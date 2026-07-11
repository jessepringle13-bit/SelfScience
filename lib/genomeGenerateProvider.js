// /app/lib/genomeGenerateProvider.js
// Shared server-side provider caller for Step 2. Together AI Llama 3.3 70B
// (primary) → OpenRouter paid Llama 3.1 70B (fallback). Extracted so both
// /api/genome/generate (browser callers) and /api/interpret-genome (server
// path) can hit the same cascade without any HTTP self-round-trip.
//
// Server-only. Never imported from client code (API keys must not leak).
//
// TIMEOUT BUDGETS:
//   • Per-tier: 22 seconds (aborted via AbortController if slower)
//   • Overall:  45 seconds hard ceiling (both tiers combined)
//   Emergent's ingress times out around 60s, so 45s here leaves ~15s
//   headroom for network + serialization + the Step 1 fallback path in
//   the caller.

const TOGETHER_BASE             = 'https://api.together.xyz/v1'
const TOGETHER_MODEL            = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
const OPENROUTER_BASE           = 'https://openrouter.ai/api/v1'
const OPENROUTER_FALLBACK_MODEL = 'meta-llama/llama-3.1-70b-instruct'

const PER_TIER_TIMEOUT_MS = 18_000
const TOTAL_BUDGET_MS     = 38_000

/** Run an async fn under a strict timeout that COVERS body streaming too.
 *  Uses Promise.race in addition to AbortController so we get a hard cut-off
 *  even if the runtime doesn't propagate the signal to the body stream. */
async function withTimeout(fn, timeoutMs) {
  const controller = new AbortController()
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error(`timeout after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  try {
    return await Promise.race([fn(controller.signal), timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Call the Step 2 provider cascade with strict time budgets.
 * @param {{system:string, user:string, variant_count:number}} params
 * @returns {Promise<{content:string, source:string, model?:string}>}
 * @throws when both tiers fail (or budget exhausted) so the caller can
 *         emit Step 1 text as card bodies.
 */
export async function callGenomeGenerateProvider({ system, user, variant_count }) {
  const startedAt = Date.now()
  const remainingBudget = () => Math.max(0, TOTAL_BUDGET_MS - (Date.now() - startedAt))
  const maxTokens = Math.min(8000, Math.max(400, (Number(variant_count) || 10) * 120))

  const buildBody = (model) => ({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  })

  // ---- Tier 1: Together AI ----
  if (process.env.TOGETHER_API_KEY) {
    const tierTimeout = Math.min(PER_TIER_TIMEOUT_MS, remainingBudget())
    if (tierTimeout > 500) {
      try {
        const data = await withTimeout(async (signal) => {
          const res = await fetch(`${TOGETHER_BASE}/chat/completions`, {
            method: 'POST',
            signal,
            headers: {
              Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(buildBody(TOGETHER_MODEL)),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return await res.json() // signal still active for body streaming
        }, tierTimeout)
        const content = data.choices?.[0]?.message?.content || ''
        if (content.includes('[') && content.includes(']')) {
          return { content, source: 'together_ai', model: TOGETHER_MODEL }
        }
        console.warn('[genomeGenerateProvider] Together AI returned non-JSON — cascading')
      } catch (err) {
        const kind = err?.name === 'AbortError' ? `timeout after ${tierTimeout}ms` : (err?.message || 'error')
        console.warn(`[genomeGenerateProvider] Together AI ${kind} — cascading`)
      }
    }
  }

  // ---- Tier 2: OpenRouter (paid) ----
  if (process.env.OPENROUTER_API_KEY) {
    const tierTimeout = Math.min(PER_TIER_TIMEOUT_MS, remainingBudget())
    if (tierTimeout > 500) {
      try {
        const data = await withTimeout(async (signal) => {
          const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: 'POST',
            signal,
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://selfscience.io',
              'X-Title': 'SelfScience',
            },
            body: JSON.stringify(buildBody(OPENROUTER_FALLBACK_MODEL)),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return await res.json() // signal still active for body streaming
        }, tierTimeout)
        const content = data.choices?.[0]?.message?.content || ''
        console.info('[genomeGenerateProvider] cascaded to OpenRouter fallback')
        return { content, source: 'openrouter_fallback', model: OPENROUTER_FALLBACK_MODEL }
      } catch (err) {
        const kind = err?.name === 'AbortError' ? `timeout after ${tierTimeout}ms` : (err?.message || 'error')
        console.warn(`[genomeGenerateProvider] OpenRouter ${kind}`)
      }
    }
  }

  throw new Error(`Genome generation unavailable — both providers failed or budget exhausted (${Date.now() - startedAt}ms)`)
}
