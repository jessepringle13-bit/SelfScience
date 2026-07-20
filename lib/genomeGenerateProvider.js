// /app/lib/genomeGenerateProvider.js
// Shared server-side provider caller for Step 2. Together AI Llama 3.3 70B
// (primary) → OpenRouter paid Llama 3.1 70B (fallback). Extracted so both
// /api/genome/generate (browser callers) and /api/interpret-genome (server
// path) can hit the same cascade without any HTTP self-round-trip.
//
// Server-only. Never imported from client code (API keys must not leak).
//
// TIMEOUT BUDGETS:
//   • Per-tier: 30 seconds (aborted via AbortController if slower)
//   • Overall:  55 seconds hard ceiling (all tiers combined)
//   Emergent's ingress times out around 60s, so 55s here leaves ~5s
//   headroom for network + serialization + the Step 1 fallback path in
//   the caller.
//   Bumped from 18s → 30s per tier (2026-07) after Llama 3.3 70B was
//   observed consistently exceeding 18s on cold-start requests, which
//   was preventing genome parses from ever reaching the OpenRouter
//   fallback. The old 18s/38s combined budget was too aggressive for
//   the 70B model and produced silent failures for the user.
//
// PROVIDER CASCADE:
//   Tier 1: Together AI Llama 3.3 70B Turbo (primary — highest quality)
//   Tier 2: OpenRouter Llama 3.1 70B (paid, same-family fallback)
//   Tier 3: Google Gemini 2.5 Flash (insurance fallback — fast, cheap,
//           different vendor family so it survives Meta-Llama outages)
//   Any tier can be skipped if its key is not set in .env.

const TOGETHER_BASE             = 'https://api.together.xyz/v1'
const TOGETHER_MODEL            = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
const OPENROUTER_BASE           = 'https://openrouter.ai/api/v1'
const OPENROUTER_FALLBACK_MODEL = 'meta-llama/llama-3.1-70b-instruct'
const GEMINI_BASE               = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL              = 'gemini-2.5-flash'

const PER_TIER_TIMEOUT_MS = 30_000
const TOTAL_BUDGET_MS     = 55_000

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
        if (content.includes('[') && content.includes(']')) {
          console.info('[genomeGenerateProvider] cascaded to OpenRouter fallback')
          return { content, source: 'openrouter_fallback', model: OPENROUTER_FALLBACK_MODEL }
        }
        console.warn('[genomeGenerateProvider] OpenRouter returned non-JSON — cascading to Gemini')
      } catch (err) {
        const kind = err?.name === 'AbortError' ? `timeout after ${tierTimeout}ms` : (err?.message || 'error')
        console.warn(`[genomeGenerateProvider] OpenRouter ${kind} — cascading to Gemini`)
      }
    }
  }

  // ---- Tier 3: Google Gemini 2.5 Flash (insurance fallback) ----
  // Uses a different vendor family from Meta-Llama, so it survives cases
  // where BOTH Together AI and OpenRouter are simultaneously degraded
  // (e.g. Meta model rollout blips). Gemini 2.5 Flash is very fast
  // (usually 3-8s) so even if this tier only gets 5-10s of remaining
  // budget it often still succeeds. Free tier is generous.
  if (process.env.GEMINI_API_KEY) {
    const tierTimeout = Math.min(PER_TIER_TIMEOUT_MS, remainingBudget())
    if (tierTimeout > 500) {
      try {
        const data = await withTimeout(async (signal) => {
          const res = await fetch(
            `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              signal,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  { role: 'user', parts: [{ text: `${system}\n\n${user}` }] },
                ],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: maxTokens,
                  responseMimeType: 'application/json',
                },
              }),
            },
          )
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return await res.json()
        }, tierTimeout)
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (content.includes('[') && content.includes(']')) {
          console.info('[genomeGenerateProvider] cascaded to Gemini 2.5 Flash')
          return { content, source: 'gemini_flash', model: GEMINI_MODEL }
        }
        console.warn('[genomeGenerateProvider] Gemini returned non-JSON')
      } catch (err) {
        const kind = err?.name === 'AbortError' ? `timeout after ${tierTimeout}ms` : (err?.message || 'error')
        console.warn(`[genomeGenerateProvider] Gemini ${kind}`)
      }
    }
  }

  throw new Error(`Genome generation unavailable — all providers failed or budget exhausted (${Date.now() - startedAt}ms)`)
}
