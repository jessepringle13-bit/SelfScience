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

// Model assignments — updated to models that are ACTUALLY available on OpenRouter
// as of build time. The spec's models (llama-3.1-70b-instruct:free, mistral-7b-instruct:free)
// have been retired from the free catalog. When the spec's models return to free tier,
// swap the strings back in.
export const MODELS = {
  reliability: {
    primary: 'openai/gpt-oss-20b:free',
    fallback: 'nvidia/nemotron-3-super-120b-a12b:free',
    maxTokens: 1024,
  },
  plainLanguage: {
    primary: 'openai/gpt-oss-20b:free',
    fallback: 'nvidia/nemotron-3-super-120b-a12b:free',
    maxTokens: 4096,
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
  const { primary, fallback, maxTokens } = MODELS.reliability
  try {
    return await callOpenRouter(primary, prompt, { maxTokens, temperature: 0.1 })
  } catch (primaryError) {
    console.warn('[reliability] primary failed:', primaryError.message?.slice(0, 200))
    try {
      return await callOpenRouter(fallback, prompt, { maxTokens, temperature: 0.1 })
    } catch (fallbackError) {
      console.error('[reliability] fallback also failed:', fallbackError.message?.slice(0, 200))
      throw fallbackError
    }
  }
}

export async function translatePlainLanguage(prompt) {
  const { primary, fallback, maxTokens } = MODELS.plainLanguage
  try {
    return await callOpenRouter(primary, prompt, { maxTokens, temperature: 0.1 })
  } catch (primaryError) {
    console.warn('[plain-language] primary failed:', primaryError.message?.slice(0, 200))
    try {
      return await callOpenRouter(fallback, prompt, { maxTokens, temperature: 0.1 })
    } catch (fallbackError) {
      console.error('[plain-language] fallback also failed:', fallbackError.message?.slice(0, 200))
      throw fallbackError
    }
  }
}

export async function interpretGenome(prompt) {
  const { primary, groqFallback, maxTokens } = MODELS.genome
  try {
    return await callOpenRouter(primary, prompt, { maxTokens, temperature: 0.1 })
  } catch (primaryError) {
    console.warn('[genome] OpenRouter primary failed, using Groq direct:', primaryError.message?.slice(0, 200))
    try {
      return await callGroqDirect(groqFallback, prompt, { maxTokens, temperature: 0.1 })
    } catch (fallbackError) {
      console.error('[genome] Groq fallback also failed:', fallbackError.message?.slice(0, 200))
      throw fallbackError
    }
  }
}

/* ------------------------------- Helpers --------------------------------- */

async function httpErr(res, tag) {
  let detail = ''
  try {
    detail = await res.text()
  } catch {}
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
