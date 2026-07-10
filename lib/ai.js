/**
 * AI provider layer for SelfScience.
 *
 * DESIGN (June 2025 refactor): Groq-only, no OpenRouter.
 *
 * The previous OpenRouter fallback tier relied on the free `openai/gpt-oss-20b:free`
 * model which hits its 50-request/day cap almost immediately in production and
 * was returning cascading 429s. Groq's free tier is significantly more generous
 * and we have two independent model buckets we can rotate through:
 *
 *   • llama-3.1-8b-instant     — fast, structured JSON
 *   • llama-3.3-70b-versatile  — higher quality for the plain-language rewrite
 *
 * Each Groq call is wrapped in a bounded retry loop with exponential backoff
 * that honors any `Retry-After` header the Groq API sends. If the primary
 * model exhausts its retries we roll to the secondary model (separate
 * rate-limit bucket). If BOTH models fail after all retries, we surface the
 * final error and let the client display its fallback UI.
 *
 * Server-side only. Never expose GROQ_API_KEY to the client.
 */

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Model assignments. Each pair shares no rate-limit bucket, so a 429 on the
// primary is often (but not always) recoverable by hitting the secondary.
export const MODELS = {
  reliability: {
    groqPrimary:   'llama-3.1-8b-instant',      // ~750 tok/s, plenty for a scoring JSON
    groqSecondary: 'llama-3.3-70b-versatile',   // heavier but different rate bucket
    maxTokens: 512,
  },
  plainLanguage: {
    groqPrimary:   'llama-3.3-70b-versatile',   // needs nuance for 8-section rewrite
    groqSecondary: 'llama-3.1-8b-instant',      // faster + cheaper fallback
    maxTokens: 2048,
  },
  genome: {
    // Larger context for the full variant-panel interpretation.
    groqPrimary:   'llama-3.3-70b-versatile',
    groqSecondary: 'llama-3.1-8b-instant',
    maxTokens: 4096,
  },
}

// Retry policy — deliberately conservative so we don't amplify a real outage.
const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3        // total attempts per model (initial + 2 retries)
const BASE_BACKOFF_MS = 400   // 400ms, 800ms, 1600ms (with jitter)
const MAX_BACKOFF_MS = 5000   // never wait longer than 5s between retries
const RETRY_AFTER_CAP_MS = 8000 // never let a server-suggested Retry-After block us > 8s

/* ------------------------- Low-level Groq caller -------------------------- */

/**
 * Single Groq HTTP call. Rejects with an Error carrying:
 *   err.status   — HTTP status if applicable
 *   err.retryable — boolean, true if retryable status or network fault
 *   err.retryAfterMs — recommended sleep before next attempt (0 if none)
 */
async function callGroqOnce(model, prompt, { temperature, maxTokens }) {
  if (!GROQ_KEY) throw makeErr('NO_KEY', 'GROQ_API_KEY not configured', 500, false)

  let res
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
      cache: 'no-store',
    })
  } catch (netErr) {
    // Network fault (DNS, TCP reset, timeout). Always retryable.
    throw makeErr('NETWORK', `groq/${model} network: ${netErr.message}`, 0, true)
  }

  if (!res.ok) {
    let detail = ''
    try { detail = await res.text() } catch { /* body consumed */ }
    const retryAfterHdr = res.headers.get('retry-after') || ''
    const retryAfterMs = parseRetryAfter(retryAfterHdr)
    const retryable = RETRY_STATUSES.has(res.status)
    const err = new Error(`groq/${model} ${res.status}: ${detail.slice(0, 400)}`)
    err.status = res.status
    err.retryable = retryable
    err.retryAfterMs = retryAfterMs
    throw err
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) {
    // Empty completion is very rarely retryable — Groq only does this if the
    // request was actually processed but the model produced nothing. We treat
    // it as non-retryable to avoid burning quota on a bad prompt.
    throw makeErr('EMPTY_RESPONSE', `Empty response from Groq ${model}`, 502, false)
  }
  return { text, provider: 'groq', model }
}

/**
 * Call Groq with bounded retries and exponential backoff (+ jitter). Honors
 * server-provided Retry-After headers (capped).
 */
async function callGroqWithRetry(model, prompt, opts) {
  const { temperature = 0.1, maxTokens = 1024 } = opts || {}
  let lastErr
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGroqOnce(model, prompt, { temperature, maxTokens })
    } catch (err) {
      lastErr = err
      // Non-retryable OR last attempt → surface immediately.
      if (!err.retryable || attempt === MAX_ATTEMPTS) throw err
      // Prefer server suggestion, else exponential backoff with jitter.
      const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS)
      const jitter = Math.floor(Math.random() * 250)
      const suggested = err.retryAfterMs ? Math.min(err.retryAfterMs, RETRY_AFTER_CAP_MS) : 0
      const waitMs = Math.max(suggested, backoff + jitter)
      // Only log the first retry to keep the log clean; deeper retries are quiet.
      if (attempt === 1) {
        console.warn(`[groq/${model}] attempt ${attempt} failed (${err.status || 'net'}). Retrying in ${waitMs}ms`)
      }
      await sleep(waitMs)
    }
  }
  throw lastErr // unreachable, TS-satisfier
}

/* --------------------- High-level operations w/ model cascade -------------- */

/**
 * Reliability scoring. Primary → secondary → surface error.
 * Each model call already retries internally, so the total worst case is
 * 2 models × 3 attempts = 6 network calls before failing.
 */
export async function scoreReliability(prompt) {
  const { groqPrimary, groqSecondary, maxTokens } = MODELS.reliability
  return runWithModelCascade('reliability', prompt, groqPrimary, groqSecondary, {
    temperature: 0.1, maxTokens,
  })
}

export async function translatePlainLanguage(prompt) {
  const { groqPrimary, groqSecondary, maxTokens } = MODELS.plainLanguage
  return runWithModelCascade('plain-language', prompt, groqPrimary, groqSecondary, {
    temperature: 0.1, maxTokens,
  })
}

export async function interpretGenome(prompt) {
  const { groqPrimary, groqSecondary, maxTokens } = MODELS.genome
  return runWithModelCascade('genome', prompt, groqPrimary, groqSecondary, {
    temperature: 0.1, maxTokens,
  })
}

/**
 * Shared cascade: try primary (with retries), then secondary (with retries).
 * Non-retryable errors (e.g. NO_KEY, EMPTY_RESPONSE, 400 bad-prompt) short-
 * circuit — no point rolling to the secondary if the prompt is malformed.
 */
async function runWithModelCascade(tag, prompt, primary, secondary, opts) {
  try {
    return await callGroqWithRetry(primary, prompt, opts)
  } catch (primaryErr) {
    const isRetryable = primaryErr.retryable !== false && primaryErr.code !== 'NO_KEY' && primaryErr.code !== 'EMPTY_RESPONSE'
    if (!isRetryable) {
      console.error(`[${tag}] non-retryable primary failure:`, primaryErr.message?.slice(0, 200))
      throw primaryErr
    }
    console.warn(`[${tag}] primary ${primary} exhausted retries (${primaryErr.status || 'net'}), rolling to ${secondary}`)
    try {
      return await callGroqWithRetry(secondary, prompt, opts)
    } catch (secondaryErr) {
      console.error(`[${tag}] all Groq models failed. primary=${primaryErr.status || 'net'} secondary=${secondaryErr.status || 'net'}: ${secondaryErr.message?.slice(0, 160)}`)
      throw secondaryErr
    }
  }
}

/* ------------------------------- Helpers --------------------------------- */

function makeErr(code, message, status, retryable) {
  const err = new Error(message)
  err.code = code
  err.status = status
  err.retryable = !!retryable
  return err
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parse a `Retry-After` header value. Groq returns it as seconds (integer)
 * or occasionally as an HTTP-date. Returns 0 if unparseable.
 */
function parseRetryAfter(v) {
  if (!v) return 0
  const asInt = Number(v)
  if (Number.isFinite(asInt) && asInt >= 0) return Math.round(asInt * 1000)
  const asDate = Date.parse(v)
  if (Number.isFinite(asDate)) {
    const delta = asDate - Date.now()
    return delta > 0 ? delta : 0
  }
  return 0
}

/**
 * Extract a JSON object from raw LLM text output (strips markdown fences).
 */
export function extractJson(text) {
  if (!text) return null
  const s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  try {
    return JSON.parse(s.slice(first, last + 1))
  } catch {
    return null
  }
}
