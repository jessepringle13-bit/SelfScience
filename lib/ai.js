/**
 * AI provider layer for SelfScience.
 * Per spec: ALL AI calls route through OpenRouter, with Groq direct only
 * as the fallback for genome interpretation.
 *
 * Server-side only. Never expose keys to the client.
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const GROQ_KEY = process.env.GROQ_API_KEY || ''

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Model assignments — Groq primary for speed (~5-10x faster than OpenRouter free tier),
// with a Groq-to-Groq intermediate fallback (different models = separate rate limits)
// before finally falling back to OpenRouter if the whole Groq account is degraded.
export const MODELS = {
  reliability: {
    // Groq: fastest inference available, ~750 tok/s. Structured JSON output only needs
    // a small model. If 8b hits TPM cap, roll to 70b (separate rate limit bucket).
    groqPrimary: 'llama-3.1-8b-instant',
    groqSecondary: 'llama-3.3-70b-versatile',
    orFallback: 'openai/gpt-oss-20b:free',
    maxTokens: 512,
  },
  plainLanguage: {
    // Groq 70B for the 8-section translation — needs more nuance than 8b.
    // Still ~200 tok/s on Groq. Roll to 8b instant if 70b is rate-limited.
    groqPrimary: 'llama-3.3-70b-versatile',
    groqSecondary: 'llama-3.1-8b-instant',
    orFallback: 'openai/gpt-oss-20b:free',
    maxTokens: 2048,
  },
  genome: {
    primary: 'nousresearch/hermes-3-llama-3.1-405b:free',
    groqFallback: 'llama-3.3-70b-versatile',
    maxTokens: 4096,
  },
}

/* ------------------------- Raw provider callers -------------------------- */

async function callOpenRouter(model, prompt, { temperature = 0.1, maxTokens = 1024 } = {}) {
  if (!OPENROUTER_KEY) throw makeErr('NO_KEY', 'OPENROUTER_API_KEY not configured', 500)
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://selfscience.io',
      'X-Title': 'SelfScience',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw await httpErr(res, `openrouter/${model}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) throw makeErr('EMPTY_RESPONSE', `Empty response from ${model}`, 502)
  return { text, provider: 'openrouter', model }
}

async function callGroqDirect(model, prompt, { temperature = 0.1, maxTokens = 4096 } = {}) {
  if (!GROQ_KEY) throw makeErr('NO_KEY', 'GROQ_API_KEY not configured', 500)
  const res = await fetch(GROQ_URL, {
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
  if (!res.ok) throw await httpErr(res, `groq/${model}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) throw makeErr('EMPTY_RESPONSE', `Empty response from Groq ${model}`, 502)
  return { text, provider: 'groq', model }
}

/* --------------------- High-level operations with fallback --------------- */

export async function scoreReliability(prompt) {
  const { groqPrimary, groqSecondary, orFallback, maxTokens } = MODELS.reliability
  // 3-tier fallback: fast Groq -> different Groq model (separate rate-limit bucket) -> OpenRouter
  try {
    return await callGroqDirect(groqPrimary, prompt, { maxTokens, temperature: 0.1 })
  } catch (primaryError) {
    const isRateLimit = primaryError.status === 429
    console.warn(`[reliability] Groq ${groqPrimary} failed${isRateLimit ? ' (rate-limited)' : ''}, trying ${groqSecondary}:`, primaryError.message?.slice(0, 160))
    try {
      return await callGroqDirect(groqSecondary, prompt, { maxTokens, temperature: 0.1 })
    } catch (secondaryError) {
      console.warn('[reliability] Groq secondary failed, falling back to OpenRouter:', secondaryError.message?.slice(0, 160))
      try {
        return await callOpenRouter(orFallback, prompt, { maxTokens, temperature: 0.1 })
      } catch (fallbackError) {
        console.error('[reliability] all providers failed:', fallbackError.message?.slice(0, 200))
        throw fallbackError
      }
    }
  }
}

export async function translatePlainLanguage(prompt) {
  const { groqPrimary, groqSecondary, orFallback, maxTokens } = MODELS.plainLanguage
  try {
    return await callGroqDirect(groqPrimary, prompt, { maxTokens, temperature: 0.1 })
  } catch (primaryError) {
    const isRateLimit = primaryError.status === 429
    console.warn(`[plain-language] Groq ${groqPrimary} failed${isRateLimit ? ' (rate-limited)' : ''}, trying ${groqSecondary}:`, primaryError.message?.slice(0, 160))
    try {
      return await callGroqDirect(groqSecondary, prompt, { maxTokens, temperature: 0.1 })
    } catch (secondaryError) {
      console.warn('[plain-language] Groq secondary failed, falling back to OpenRouter:', secondaryError.message?.slice(0, 160))
      try {
        return await callOpenRouter(orFallback, prompt, { maxTokens, temperature: 0.1 })
      } catch (fallbackError) {
        console.error('[plain-language] all providers failed:', fallbackError.message?.slice(0, 200))
        throw fallbackError
      }
    }
  }
}

export async function interpretGenome(prompt) {
  const { primary, groqFallback, maxTokens } = MODELS.genome
  // Per Session-5 spec: Groq direct is PRIMARY for genome (fastest for large JSON);
  // OpenRouter (Hermes 405B) is the fallback.
  try {
    return await callGroqDirect(groqFallback, prompt, { maxTokens, temperature: 0.1 })
  } catch (primaryError) {
    console.warn('[genome] Groq primary failed, falling back to OpenRouter:', primaryError.message?.slice(0, 200))
    try {
      return await callOpenRouter(primary, prompt, { maxTokens, temperature: 0.1 })
    } catch (fallbackError) {
      console.error('[genome] OpenRouter fallback also failed:', fallbackError.message?.slice(0, 200))
      throw fallbackError
    }
  }
}

/* ------------------------------- Helpers --------------------------------- */

async function httpErr(res, tag) {
  let detail = ''
  try {
    detail = await res.text()
  } catch {
    /* response body already consumed */
  }
  const err = new Error(`${tag} ${res.status}: ${detail.slice(0, 400)}`)
  err.status = res.status
  return err
}

function makeErr(code, message, status) {
  const err = new Error(message)
  err.code = code
  err.status = status
  return err
}

/**
 * Extract a JSON object from raw LLM text output (strips markdown fences).
 */
export function extractJson(text) {
  if (!text) return null
  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  try {
    return JSON.parse(s.slice(first, last + 1))
  } catch {
    return null
  }
}
