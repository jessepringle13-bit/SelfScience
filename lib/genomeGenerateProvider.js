// /app/lib/genomeGenerateProvider.js
// Shared server-side provider caller for Step 2. Together AI Llama 3.3 70B
// (primary) → OpenRouter paid Llama 3.1 70B (fallback). Extracted so both
// /api/genome/generate (browser callers) and /api/interpret-genome (server
// path) can hit the same cascade without any HTTP self-round-trip.
//
// Server-only. Never imported from client code (API keys must not leak).

const TOGETHER_BASE             = 'https://api.together.xyz/v1'
const TOGETHER_MODEL            = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
const OPENROUTER_BASE           = 'https://openrouter.ai/api/v1'
const OPENROUTER_FALLBACK_MODEL = 'meta-llama/llama-3.1-70b-instruct'

/**
 * Call the Step 2 provider cascade.
 * @param {{system:string, user:string, variant_count:number}} params
 * @returns {Promise<{content:string, source:string, model?:string}>}
 * @throws when both tiers fail so the caller can fall back to Step 1 text.
 */
export async function callGenomeGenerateProvider({ system, user, variant_count }) {
  const maxTokens = Math.min(8000, Math.max(400, (Number(variant_count) || 10) * 120))

  // ---- Tier 1: Together AI ----
  try {
    if (process.env.TOGETHER_API_KEY) {
      const res = await fetch(`${TOGETHER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: TOGETHER_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user',   content: user },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ''
        if (content.includes('[') && content.includes(']')) {
          return { content, source: 'together_ai', model: TOGETHER_MODEL }
        }
        console.warn('[genomeGenerateProvider] Together AI returned non-JSON — cascading')
      } else {
        console.warn(`[genomeGenerateProvider] Together AI failed: ${res.status} — cascading`)
      }
    }
  } catch (err) {
    console.warn('[genomeGenerateProvider] Together AI threw:', err?.message)
  }

  // ---- Tier 2: OpenRouter (paid) ----
  if (process.env.OPENROUTER_API_KEY) {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://selfscience.io',
        'X-Title': 'SelfScience',
      },
      body: JSON.stringify({
        model: OPENROUTER_FALLBACK_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content || ''
      console.info('[genomeGenerateProvider] cascaded to OpenRouter fallback')
      return { content, source: 'openrouter_fallback', model: OPENROUTER_FALLBACK_MODEL }
    }
  }

  throw new Error('Genome generation unavailable — both providers failed')
}
