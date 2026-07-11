/**
 * AI provider layer for SelfScience.
 *
 * DESIGN (July 2026 refactor): multi-provider cascade.
 *
 * Providers configured:
 *   • Together AI       — primary for genome interpretation ($25 free credit,
 *                         then pay-as-you-go). OpenAI-compatible endpoint.
 *   • OpenRouter        — routes to third-party models. We use one FREE tier
 *                         model (`meta-llama/llama-3.1-70b-instruct:free`) and
 *                         one PAID fallback (`meta-llama/llama-3.1-8b-instruct`).
 *
 * Cascades (in priority order):
 *   • Reliability       — OpenRouter free 70B  → OpenRouter paid 8B
 *   • Plain-language    — OpenRouter free 70B  → OpenRouter paid 8B
 *   • Genome            — Together AI 70B      → OpenRouter paid 70B
 *
 * Each call is wrapped in retry-with-backoff (respects Retry-After); when a
 * tier fails retryably we cascade to the next. Non-retryable prompt-level
 * errors short-circuit (see isPromptLevelFailure).
 *
 * Server-side only. Never expose API keys to the client.
 */

import { recordAiCall } from './ai-usage'

const TOGETHER_KEY    = process.env.TOGETHER_API_KEY   || ''
const OPENROUTER_KEY  = process.env.OPENROUTER_API_KEY || ''

const TOGETHER_URL    = 'https://api.together.xyz/v1/chat/completions'
const OPENROUTER_URL  = 'https://openrouter.ai/api/v1/chat/completions'

// Per-task cascades. Each entry declares which provider + model to use.
// Adding a new tier is as simple as pushing another object into the array.
//
// Model selection rationale (User-directed, July 2026):
//   • All tiers use the Meta Llama family for consistent output style across
//     primary and fallback — users won't notice a stylistic shift when a
//     cascade rolls over.
//   • Only NON-reasoning models. Our prompts are structured-output tasks,
//     not inference problems. Reasoning models burn tokens on hidden
//     thinking, are slower, and cost more on fallback.
//   • Free-primary strategy for Reliability + Plain-language: OpenRouter's
//     free tier of llama-3.3-70b handles these light structured tasks in
//     ~5-8s, well within the <10s target. Paid 8B fallback is used only
//     when the free tier is rate-limited — 8B is cheaper than the 70B paid
//     tier and sufficient for the structured JSON schema on both endpoints.
//   • Note on the free slug: user asked for `llama-3.1-70b-instruct:free`,
//     but that slug returns 404 from OpenRouter (deprecated). The equivalent
//     current free 70B is `llama-3.3-70b-instruct:free` — same Meta Llama
//     family, non-reasoning, same 70B parameter class, faster and better.
//   • Genome keeps Together AI 70B as primary (33s is expected + explained
//     in the UI with a progress ticker) with OpenRouter paid 70B fallback.
export const MODELS = {
  reliability: {
    // Free-primary → paid-8B fallback. Reliability scoring is a structured
    // JSON task; 8B handles it fine when the free tier is rate-limited.
    cascade: [
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct' },
    ],
    maxTokens: 512,
  },
  plainLanguage: {
    // Free-primary → paid-8B fallback. Plain-language rewriting is a
    // writing/formatting task that 8B handles well when the free tier is
    // saturated. Both tiers are non-reasoning for fast structured output.
    cascade: [
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct' },
    ],
    // Non-reasoning models don't burn tokens on hidden thinking, so 2048 is
    // plenty for the 8-section rewrite.
    maxTokens: 2048,
  },
  // NOTE: genome tier was retired in the two-step refactor. The Together AI
  // → OpenRouter cascade for genome lives in /lib/genomeGenerateProvider.js
  // now. Keeping MODELS focused on reliability + plain-language only.
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
async function callOpenAICompatible({ url, key, model, prompt, temperature, maxTokens, jsonMode, extraHeaders, timeoutMs }) {
  if (!key) throw makeErr('NO_KEY', `${new URL(url).host}: API key not configured`, 500, false)

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }

  // Hard abort so no single upstream can hold us hostage past the Emergent
  // ingress 60s timeout. Default 40s per attempt — leaves headroom for the
  // cascade to fall through to a second tier.
  const abortMs = Math.max(5000, timeoutMs || 40000)
  const controller = new AbortController()
  const abortTimer = setTimeout(() => controller.abort(), abortMs)

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
      signal: controller.signal,
    })
  } catch (netErr) {
    clearTimeout(abortTimer)
    if (netErr.name === 'AbortError') {
      throw makeErr('TIMEOUT', `${model} exceeded ${abortMs}ms — aborting`, 504, true)
    }
    throw makeErr('NETWORK', `${model} network: ${netErr.message}`, 0, true)
  }
  clearTimeout(abortTimer)

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
  return { text, model, usage: data?.usage || null }
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
    timeoutMs: opts.timeoutMs,
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
    timeoutMs: opts.timeoutMs,
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
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? MAX_ATTEMPTS)
  let lastErr
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await callProviderOnce(entry, prompt, opts)
    } catch (err) {
      lastErr = err
      if (!err.retryable || attempt === maxAttempts) throw err
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
  // Extract the study title + a few abstract keywords from the prompt so we
  // can detect hallucinated responses. If none of these tokens appears in
  // the model's whatTheyFound, the model is making up an unrelated study
  // (a known failure mode for smaller Llama models on elaborate schemas).
  const topicTokens = extractTopicTokens(prompt)
  return runCascade('plain-language', prompt, cascade, {
    temperature: 0.1, maxTokens, jsonMode: true,
    validate: (text) => {
      const j = extractJson(text)
      const s = j?.sections || {}
      if (!s.studyType || s.studyType.length < 20) return false
      if (!s.whatTheyFound || s.whatTheyFound.length < 20) return false
      // Topic-relevance check: whatTheyFound MUST reference at least one
      // distinctive token from the input study. Otherwise the model
      // hallucinated something unrelated.
      if (topicTokens.length >= 3) {
        const hay = (s.whatTheyFound + ' ' + (s.researchQuestion || '')).toLowerCase()
        const hits = topicTokens.filter((t) => hay.includes(t)).length
        if (hits === 0) {
          // Debug once so we can see what happened when this fires.
          console.warn(`[plain-language] topic-relevance failed. tokens=${topicTokens.slice(0, 8).join(',')} | wtf="${(s.whatTheyFound || '').slice(0, 200)}"`)
          return false
        }
      }
      return true
    },
  })
}

export async function interpretGenome() {
  // Deprecated. The old single-shot genome interpretation is retired — genome
  // requests now flow through the two-step architecture in
  // /lib/genomeGenerateProvider.js. This stub is kept only in case an
  // external caller still references it; it throws with a clear message
  // instead of silently returning bad data.
  throw new Error('interpretGenome() is deprecated. Use generateGenomeReportServer + callGenomeGenerateProvider (see /lib/genomeAIGenerator.js).')
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
  const cascadeStartedAt = Date.now()
  // Optional hard ceiling for the ENTIRE cascade. If provided, each tier is
  // budgeted a proportional share of what remains — this guarantees we never
  // exceed Emergent's ~60s ingress timeout on any endpoint that specifies
  // a totalBudgetMs (e.g. genome interpretation).
  const totalBudget = opts?.totalBudgetMs || 0
  let lastErr
  for (let i = 0; i < cascade.length; i++) {
    const entry = cascade[i]
    // Compute this tier's timeout under the shared budget (if any).
    let perTierTimeout = opts?.timeoutMs
    if (totalBudget) {
      const elapsed = Date.now() - cascadeStartedAt
      const remaining = totalBudget - elapsed
      const tiersLeft = cascade.length - i
      if (remaining <= 3000) {
        // Not enough budget left to even try — fall through to caller-side
        // fallback (variant-only report for genome, etc).
        console.warn(`[${tag}] out of budget (elapsed=${elapsed}ms) — skipping remaining ${tiersLeft} tier(s)`)
        break
      }
      // Give this tier up to half the remaining budget so a slow first tier
      // doesn't starve the fallback. Cap at the caller-specified timeoutMs.
      const share = Math.floor(remaining / Math.max(1, tiersLeft))
      perTierTimeout = Math.min(opts?.timeoutMs || 60000, share)
    }
    const t0 = Date.now()
    try {
      const out = await callWithRetry(entry, prompt, { ...opts, timeoutMs: perTierTimeout })
      const latencyMs = Date.now() - t0
      if (validate && !validate(out.text)) {
        recordAiCall({ provider: entry.provider, model: entry.model, task: tag, status: 'fail', httpStatus: 200, latencyMs, usage: out.usage }).catch(() => {})
        console.warn(`[${tag}] ${entry.provider}/${entry.model} returned 200 but failed schema validation — cascading`)
        lastErr = makeErr('VALIDATION', `Validation failed on ${entry.model}`, 200, true)
        continue
      }
      recordAiCall({ provider: entry.provider, model: entry.model, task: tag, status: 'ok', httpStatus: 200, latencyMs, usage: out.usage }).catch(() => {})
      if (i > 0) console.info(`[${tag}] succeeded on cascade tier ${i + 1}/${cascade.length}: ${entry.provider}/${entry.model}`)
      return out
    } catch (err) {
      lastErr = err
      recordAiCall({ provider: entry.provider, model: entry.model, task: tag, status: 'fail', httpStatus: err.status || 0, latencyMs: Date.now() - t0, usage: null }).catch(() => {})
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
  throw lastErr || makeErr('CASCADE_EXHAUSTED', 'All tiers exhausted', 504, true)
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

/**
 * Pull a handful of distinctive lowercase tokens from the incoming prompt so
 * we can validate that a model's response actually references the input
 * study (and isn't a hallucinated generic answer).
 *
 * We look for the study data specifically — either after a "Study title:"
 * marker (our plain-language template) or after a "Study to score:"/
 * "STUDY:" marker (our reliability template). If none found, we fall back
 * to the last 2000 chars of the prompt.
 */
const STOPWORDS = new Set([
  'about','above','after','again','against','being','below','between','during',
  'further','herself','himself','itself','myself','ourselves','their','themselves',
  'these','those','through','under','until','where','which','while','would','study',
  'studies','research','researchers','results','showed','found','patients','adults',
  'group','groups','placebo','treatment','effect','effects','trial','randomized',
  'controlled','blind','double','significantly','significant','journal','article',
  'authors','abstract','title','paper','published','year','years','week','weeks',
  'daily','group','versus','compared','baseline','follow','followup','participants',
  'analysis','analyses','review','systematic','also','however','therefore','including',
  'people','human','humans','animal','animals','findings','their','using','their',
])
function extractTopicTokens(prompt) {
  if (!prompt) return []
  // Isolate JUST the study data section, not the schema boilerplate.
  const src = String(prompt)
  let studyRegion = ''
  const markers = [
    /Study title\s*:\s*/i,        // plain-language prompt
    /Study to score\s*:\s*/i,     // reliability prompt
    /STUDY\s*:\s*/,               // fallback marker
  ]
  for (const re of markers) {
    const m = src.match(re)
    if (m) {
      studyRegion = src.slice(m.index).slice(0, 2500)
      break
    }
  }
  if (!studyRegion) studyRegion = src.slice(-2500)

  const lc = studyRegion.toLowerCase()
  const tokens = new Set()
  const wordRe = /[a-z][a-z0-9\-]{4,}/g
  let m
  while ((m = wordRe.exec(lc)) !== null) {
    const w = m[0]
    if (STOPWORDS.has(w)) continue
    tokens.add(w)
    if (tokens.size >= 30) break
  }
  const genes = studyRegion.match(/\b(?:rs\d{2,}|[A-Z]{2,}\d?[A-Z]?)\b/g) || []
  genes.forEach((g) => tokens.add(g.toLowerCase()))
  return Array.from(tokens).slice(0, 15)
}

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
