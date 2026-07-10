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

// Model cascade — arrays ordered by preference. Each entry sits in a distinct
// Groq rate-limit bucket, so when the first is throttled the next usually
// succeeds immediately.
//
// Empirically-tuned model choices per task:
//   • Reliability (short JSON): 3-tier cascade — llama-3.1-8b-instant is
//     compliant on a simple schema; llama-4-scout is a strong tier-2;
//     llama-3.3-70b-versatile is the highest-quality safety net.
//   • Plain-language / Genome (elaborate schema, must not hallucinate):
//     2-tier cascade — llama-3.3-70b-versatile is the only Groq model that
//     reliably fills the 8-section rewrite without either (a) hallucinating
//     wholesale content like the 8B, (b) echoing the schema placeholders
//     like the Qwen reasoning models, or (c) burning the token budget on
//     hidden reasoning tokens like the gpt-oss models. llama-4-scout is
//     the last-resort — occasionally returns non-JSON prose but never
//     hallucinates full studies. If both fail (rare), the API returns 502
//     and the frontend already handles that gracefully.
export const MODELS = {
  reliability: {
    groqCascade: [
      'llama-3.1-8b-instant',                              // ~750 tok/s, plenty for a short JSON
      'meta-llama/llama-4-scout-17b-16e-instruct',         // Llama-4, 17B, separate rate bucket
      'llama-3.3-70b-versatile',                           // heavier but different bucket, last resort
    ],
    maxTokens: 512,
  },
  plainLanguage: {
    // 8-section patient-friendly rewrite. See note above for why we don't
    // use qwen/gpt-oss/8b as fallbacks here.
    groqCascade: [
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-scout-17b-16e-instruct',
    ],
    maxTokens: 2048,
  },
  genome: {
    // Larger context for the full variant-panel interpretation.
    groqCascade: [
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-scout-17b-16e-instruct',
    ],
    maxTokens: 4096,
  },
}

// Retry policy — tuned to cap the worst-case latency at ~5-6s while still
// giving each model a genuine chance to recover from transient blips.
//
// Latency budget analysis (worst case, all three models rate-limited):
//   3 models × 2 attempts × ~500ms request = ~3s of network
// + 3 models × 1 retry × ~450ms backoff     = ~1.4s of backoff
// + up to one 2.5s Retry-After honored      = 2.5s
// -----------------------------------------------------------
//   Total worst case                         ≈ 6-7s (vs. ~20s previously)
const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 2        // per model: initial + 1 retry (was 3)
const BASE_BACKOFF_MS = 400   // 400ms + jitter
const MAX_BACKOFF_MS = 1500   // hard cap on our own backoff
const RETRY_AFTER_CAP_MS = 2500 // if the server asks us to wait >2.5s, cascade instead

/* ------------------------- Low-level Groq caller -------------------------- */

/**
 * Single Groq HTTP call. Rejects with an Error carrying:
 *   err.status   — HTTP status if applicable
 *   err.retryable — boolean, true if retryable status or network fault
 *   err.retryAfterMs — recommended sleep before next attempt (0 if none)
 */
async function callGroqOnce(model, prompt, { temperature, maxTokens, jsonMode }) {
  if (!GROQ_KEY) throw makeErr('NO_KEY', 'GROQ_API_KEY not configured', 500, false)

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
  }
  // JSON mode: Groq guarantees the response is a syntactically valid JSON
  // object. Required for our reliability / plain-language / genome flows
  // because we JSON.parse the response on the server. The prompt still
  // needs to describe the exact schema — JSON mode only enforces syntax.
  if (jsonMode) body.response_format = { type: 'json_object' }

  let res
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
 * server-provided Retry-After headers (capped). If the server asks us to
 * wait longer than RETRY_AFTER_CAP_MS, we skip the retry and let the caller
 * cascade to the next model — usually much faster than waiting.
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
      // Fast-path: if the server asks us to wait longer than our cap, don't
      // waste time here — hand back to the cascade so it can try a different
      // model (different rate-limit bucket) that's likely available NOW.
      if (err.retryAfterMs && err.retryAfterMs > RETRY_AFTER_CAP_MS) {
        console.warn(`[groq/${model}] server Retry-After=${err.retryAfterMs}ms > cap ${RETRY_AFTER_CAP_MS}ms — cascading instead`)
        throw err
      }
      // Otherwise: exponential backoff with jitter, honoring any short
      // server suggestion.
      const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS)
      const jitter = Math.floor(Math.random() * 200)
      const waitMs = Math.max(err.retryAfterMs || 0, backoff + jitter)
      console.warn(`[groq/${model}] attempt ${attempt} failed (${err.status || 'net'}). Retrying in ${waitMs}ms`)
      await sleep(waitMs)
    }
  }
  throw lastErr // unreachable, TS-satisfier
}

/* --------------------- High-level operations w/ model cascade -------------- */

/**
 * Reliability scoring. Rolls through the 3-model Groq cascade with retries.
 * Worst case = 3 models × 2 attempts = 6 network calls before failing.
 */
export async function scoreReliability(prompt) {
  const { groqCascade, maxTokens } = MODELS.reliability
  return runWithModelCascade('reliability', prompt, groqCascade, {
    temperature: 0.1, maxTokens, jsonMode: true,
  })
}

export async function translatePlainLanguage(prompt) {
  const { groqCascade, maxTokens } = MODELS.plainLanguage
  return runWithModelCascade('plain-language', prompt, groqCascade, {
    temperature: 0.1, maxTokens, jsonMode: true,
  })
}

export async function interpretGenome(prompt) {
  const { groqCascade, maxTokens } = MODELS.genome
  return runWithModelCascade('genome', prompt, groqCascade, {
    temperature: 0.1, maxTokens, jsonMode: true,
  })
}

/**
 * Shared cascade: iterate through a list of models, calling each with the
 * retry-with-backoff wrapper. Return the first success. If ALL models fail,
 * throw the LAST error (usually the most informative).
 *
 * Error handling philosophy:
 *   - Prompt-level errors (NO_KEY, EMPTY_RESPONSE, 401/403 auth) short-circuit
 *     — they'll fail identically on every model, so cascading is a waste.
 *   - Model-level errors (400 model_decommissioned, 404 not-found, 5xx server,
 *     429 rate-limit) always cascade to the next model — a different model
 *     with a different rate bucket / deployment status is likely to succeed.
 */
async function runWithModelCascade(tag, prompt, models, opts) {
  let lastErr
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const out = await callGroqWithRetry(model, prompt, opts)
      // Log a small info line if we rolled past the primary — useful for
      // production dashboards to see how often the cascade is active.
      if (i > 0) console.info(`[${tag}] succeeded on cascade tier ${i + 1}/${models.length}: ${model}`)
      return out
    } catch (err) {
      lastErr = err
      if (isPromptLevelFailure(err)) {
        console.error(`[${tag}] prompt-level failure on ${model} — aborting cascade:`, err.message?.slice(0, 200))
        throw err
      }
      if (i < models.length - 1) {
        console.warn(`[${tag}] ${model} failed (${err.status || 'net'}), cascading to ${models[i + 1]}`)
      }
    }
  }
  console.error(`[${tag}] all ${models.length} Groq models failed. last=${lastErr?.status || 'net'}: ${lastErr?.message?.slice(0, 200)}`)
  throw lastErr
}

/**
 * Prompt-level failures fail identically on every model, so we do NOT cascade
 * past them. Everything else (model-specific 400/404, rate limits, server
 * errors, network) rolls to the next model in the cascade.
 */
function isPromptLevelFailure(err) {
  if (err.code === 'NO_KEY') return true
  if (err.code === 'EMPTY_RESPONSE') return true
  if (err.status === 401 || err.status === 403) return true
  return false
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
