/**
 * AI provider layer for SelfScience.
 *
 * DESIGN (July 2026 refactor): multi-provider cascade.
 *
 * Providers configured:
 *   • Together AI       — primary for genome interpretation ($25 free credit,
 *                         then pay-as-you-go). OpenAI-compatible endpoint.
 *   • OpenRouter        — routes to third-party models. We use one FREE tier
 *                         model (`openai/gpt-oss-20b:free`) and one PAID
 *                         model (`openai/gpt-4o-mini`) as fallback.
 *
 * Cascades (in priority order):
 *   • Reliability       — OpenRouter free  → OpenRouter paid
 *   • Plain-language    — OpenRouter free  → OpenRouter paid
 *   • Genome            — Together AI 70B  → OpenRouter paid
 *
 * Each call is wrapped in retry-with-backoff (respects Retry-After); when a
 * tier fails retryably we cascade to the next. Non-retryable prompt-level
 * errors short-circuit (see isPromptLevelFailure).
 *
 * Server-side only. Never expose API keys to the client.
 */

const TOGETHER_KEY    = process.env.TOGETHER_API_KEY   || ''
const OPENROUTER_KEY  = process.env.OPENROUTER_API_KEY || ''

const TOGETHER_URL    = 'https://api.together.xyz/v1/chat/completions'
const OPENROUTER_URL  = 'https://openrouter.ai/api/v1/chat/completions'

// Per-task cascades. Each entry declares which provider + model to use.
// Adding a new tier is as simple as pushing another object into the array.
export const MODELS = {
  reliability: {
    cascade: [
      { provider: 'openrouter', model: 'openai/gpt-oss-20b:free' },
      { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
    ],
    maxTokens: 512,
  },
  plainLanguage: {
    cascade: [
      { provider: 'openrouter', model: 'openai/gpt-oss-20b:free' },
      { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
    ],
    // gpt-oss-20b is a reasoning model that eats ~1500-2500 completion tokens
    // on hidden reasoning before writing the answer. 4096 gives comfortable
    // headroom for the elaborate 8-section JSON. gpt-4o-mini (paid fallback)
    // doesn't need this much but the extra ceiling is harmless.
    maxTokens: 4096,
  },
  genome: {
    cascade: [
      // Note: `Meta-Llama-3.1-70B-Instruct-Turbo` requires a dedicated (paid)
      // Together AI endpoint. We use the newer `Llama-3.3-70B-Instruct-Turbo`
      // which is available on the free serverless tier and is a straight
      // upgrade in quality.
      { provider: 'together',   model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
      { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
    ],
    maxTokens: 4096,
  },
}

// Retry policy — capped so the worst-case latency is small compared to real
// inference time. Two attempts × N cascade tiers, honoring Retry-After
// (but only up to RETRY_AFTER_CAP_MS — beyond that we cascade instead).
const RETRY_STATUSES     = new Set([408, 425, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS       = 2
const BASE_BACKOFF_MS    = 400
const MAX_BACKOFF_MS     = 1500
const RETRY_AFTER_CAP_MS = 2500

/* ------------------------- Low-level per-provider callers ---------------- */

/** OpenAI-compatible chat call. Together AI + OpenRouter both use this shape. */
async function callOpenAICompatible({ url, key, model, prompt, temperature, maxTokens, jsonMode, extraHeaders }) {
  if (!key) throw makeErr('NO_KEY', `${new URL(url).host}: API key not configured`, 500, false)

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
  }
  // JSON mode is supported on both Together AI (recent models) and OpenRouter
  // (per-model). If a specific model rejects it, extractJson still salvages
  // most responses because our prompts explicitly ask for JSON.
  if (jsonMode) body.response_format = { type: 'json_object' }

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(extraHeaders || {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (netErr) {
    throw makeErr('NETWORK', `${model} network: ${netErr.message}`, 0, true)
  }

  if (!res.ok) {
    let detail = ''
    try { detail = await res.text() } catch { /* body consumed */ }
    const retryAfterMs = parseRetryAfter(res.headers.get('retry-after') || '')
    const err = new Error(`${model} ${res.status}: ${detail.slice(0, 400)}`)
    err.status = res.status
    err.retryable = RETRY_STATUSES.has(res.status)
    err.retryAfterMs = retryAfterMs
    throw err
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) throw makeErr('EMPTY_RESPONSE', `Empty response from ${model}`, 502, false)
  return { text, model }
}

/** Together AI adapter — just OpenAI-compatible + Together auth. */
function callTogetherOnce(model, prompt, opts) {
  return callOpenAICompatible({
    url: TOGETHER_URL,
    key: TOGETHER_KEY,
    model, prompt,
    temperature: opts.temperature ?? 0.1,
    maxTokens: opts.maxTokens ?? 4096,
    jsonMode: !!opts.jsonMode,
  }).then((r) => ({ ...r, provider: 'together' }))
}

/** OpenRouter adapter — needs the two site headers to appear in their metrics. */
function callOpenRouterOnce(model, prompt, opts) {
  return callOpenAICompatible({
    url: OPENROUTER_URL,
    key: OPENROUTER_KEY,
    model, prompt,
    temperature: opts.temperature ?? 0.1,
    maxTokens: opts.maxTokens ?? 1024,
    jsonMode: !!opts.jsonMode,
    extraHeaders: {
      'HTTP-Referer': 'https://selfscience.io',
      'X-Title': 'SelfScience',
    },
  }).then((r) => ({ ...r, provider: 'openrouter' }))
}

/** Dispatch to the right provider based on the cascade entry. */
function callProviderOnce(entry, prompt, opts) {
  switch (entry.provider) {
    case 'together':   return callTogetherOnce(entry.model, prompt, opts)
    case 'openrouter': return callOpenRouterOnce(entry.model, prompt, opts)
    default: throw makeErr('BAD_PROVIDER', `Unknown provider: ${entry.provider}`, 500, false)
  }
}

/**
 * Call one provider/model with bounded retries. Fast-cascade if the server
 * asks us to wait longer than RETRY_AFTER_CAP_MS — better to hit a
 * different provider than sit idle.
 */
async function callWithRetry(entry, prompt, opts) {
  let lastErr
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callProviderOnce(entry, prompt, opts)
    } catch (err) {
      lastErr = err
      if (!err.retryable || attempt === MAX_ATTEMPTS) throw err
      if (err.retryAfterMs && err.retryAfterMs > RETRY_AFTER_CAP_MS) {
        console.warn(`[${entry.provider}/${entry.model}] Retry-After=${err.retryAfterMs}ms > cap — cascading instead`)
        throw err
      }
      const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS)
      const jitter = Math.floor(Math.random() * 200)
      const waitMs = Math.max(err.retryAfterMs || 0, backoff + jitter)
      console.warn(`[${entry.provider}/${entry.model}] attempt ${attempt} failed (${err.status || 'net'}). Retrying in ${waitMs}ms`)
      await sleep(waitMs)
    }
  }
  throw lastErr
}

/* --------------------- High-level ops w/ cascade -------------------------- */

export async function scoreReliability(prompt) {
  const { cascade, maxTokens } = MODELS.reliability
  return runCascade('reliability', prompt, cascade, {
    temperature: 0.1, maxTokens, jsonMode: true,
    // Reliability response must at least parse to JSON with a numeric score.
    validate: (text) => {
      const j = extractJson(text)
      return !!j && (typeof j.score === 'number' || typeof j.score === 'string')
    },
  })
}

export async function translatePlainLanguage(prompt) {
  const { cascade, maxTokens } = MODELS.plainLanguage
  return runCascade('plain-language', prompt, cascade, {
    temperature: 0.1, maxTokens, jsonMode: true,
    // Free reasoning models often return an empty schema shell. Require at
    // least studyType + whatTheyFound to be non-trivially populated before
    // accepting the response — otherwise cascade to the paid tier.
    validate: (text) => {
      const j = extractJson(text)
      const s = j?.sections || {}
      return !!s.studyType && s.studyType.length > 20
          && !!s.whatTheyFound && s.whatTheyFound.length > 20
    },
  })
}

export async function interpretGenome(prompt) {
  const { cascade, maxTokens } = MODELS.genome
  return runCascade('genome', prompt, cascade, {
    temperature: 0.1, maxTokens, jsonMode: true,
    // Require at least a pillar report to exist for genome analysis.
    validate: (text) => {
      const j = extractJson(text)
      return !!j && (
        Array.isArray(j.pillar_reports) ||
        Array.isArray(j.variants_recognized) ||
        !!j.overall_summary
      )
    },
  })
}

/**
 * Iterate the cascade in order, calling each tier with retries. Return the
 * first success THAT PASSES THE VALIDATOR. If a tier returns a 200 but the
 * validator rejects it (e.g. empty schema fields from a busy reasoning
 * model), we treat it as a soft failure and cascade to the next tier.
 * If all tiers fail, throw the last error.
 */
async function runCascade(tag, prompt, cascade, opts) {
  const validate = opts?.validate
  let lastErr
  for (let i = 0; i < cascade.length; i++) {
    const entry = cascade[i]
    try {
      const out = await callWithRetry(entry, prompt, opts)
      // Post-response validation. If the model returned 200 but produced
      // garbage / empty schema shell, cascade to the next tier instead of
      // returning a broken payload.
      if (validate && !validate(out.text)) {
        console.warn(`[${tag}] ${entry.provider}/${entry.model} returned 200 but failed schema validation — cascading`)
        lastErr = makeErr('VALIDATION', `Validation failed on ${entry.model}`, 200, true)
        continue
      }
      if (i > 0) console.info(`[${tag}] succeeded on cascade tier ${i + 1}/${cascade.length}: ${entry.provider}/${entry.model}`)
      return out
    } catch (err) {
      lastErr = err
      if (isPromptLevelFailure(err)) {
        console.error(`[${tag}] prompt-level failure on ${entry.provider}/${entry.model} — aborting cascade:`, err.message?.slice(0, 200))
        throw err
      }
      if (i < cascade.length - 1) {
        const next = cascade[i + 1]
        console.warn(`[${tag}] ${entry.provider}/${entry.model} failed (${err.status || 'net'}), cascading to ${next.provider}/${next.model}`)
      }
    }
  }
  console.error(`[${tag}] all ${cascade.length} tiers failed. last=${lastErr?.status || 'net'}: ${lastErr?.message?.slice(0, 200)}`)
  throw lastErr
}

/**
 * Prompt-level failures fail identically on every model — no point cascading.
 * Everything else (rate limits, model-specific 400/404, server errors, net
 * faults) rolls to the next model.
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

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }

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
