/**
 * Unified AI wrapper for SelfScience.
 * Tries providers in order: Gemini → Groq → OpenRouter.
 * Only falls back on transient/quota errors (429, 5xx). Hard errors bubble up.
 *
 * All providers implement a JSON-object response format for structured output.
 * Returns: { text, provider, model }
 */

/* ---------------------------- Provider configs --------------------------- */

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite'

const RETRYABLE = new Set([429, 500, 502, 503, 504])

/* ---------------------------- Provider callers --------------------------- */

async function callGemini(prompt, { temperature, maxOutputTokens, thinkingBudget = 0, responseMimeType }) {
  if (!GEMINI_KEY) throw makeErr('NO_KEY', 'GEMINI_API_KEY not configured', 401)

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(responseMimeType ? { responseMimeType } : {}),
      ...(typeof thinkingBudget === 'number' ? { thinkingConfig: { thinkingBudget } } : {}),
    },
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw await httpErr(res, 'gemini')
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  return { text, provider: 'gemini', model: GEMINI_MODEL }
}

async function callGroq(prompt, { temperature, maxOutputTokens }) {
  if (!GROQ_KEY) throw makeErr('NO_KEY', 'GROQ_API_KEY not configured', 401)

  const body = {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxOutputTokens,
    response_format: { type: 'json_object' },
  }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw await httpErr(res, 'groq')
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  return { text, provider: 'groq', model: GROQ_MODEL }
}

async function callOpenRouter(prompt, { temperature, maxOutputTokens }) {
  if (!OPENROUTER_KEY) throw makeErr('NO_KEY', 'OPENROUTER_API_KEY not configured', 401)

  const body = {
    model: OPENROUTER_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxOutputTokens,
    response_format: { type: 'json_object' },
  }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://selfscience.io',
      'X-Title': 'SelfScience',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw await httpErr(res, 'openrouter')
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  return { text, provider: 'openrouter', model: OPENROUTER_MODEL }
}

/* --------------------------------- Router -------------------------------- */

const CALLERS = { gemini: callGemini, groq: callGroq, openrouter: callOpenRouter }
const AVAILABILITY = () => ({ gemini: !!GEMINI_KEY, groq: !!GROQ_KEY, openrouter: !!OPENROUTER_KEY })

/**
 * Try providers in order: gemini → groq → openrouter.
 * Fall back on 429, 500, 502, 503, 504. Bubble other errors.
 *
 * options:
 *   temperature (default 0.1)
 *   maxOutputTokens (default 2048)
 *   thinkingBudget (gemini only, default 0)
 *   responseMimeType (gemini only, default 'application/json')
 *   preferOrder (override provider order)
 */
export async function callAI(prompt, options = {}) {
  const {
    temperature = 0.1,
    maxOutputTokens = 2048,
    thinkingBudget = 0,
    responseMimeType = 'application/json',
    preferOrder = ['gemini', 'groq', 'openrouter'],
  } = options

  const avail = AVAILABILITY()
  const providers = preferOrder.filter((p) => avail[p])
  if (providers.length === 0) {
    throw makeErr('NO_KEY', 'No AI provider is configured (Gemini/Groq/OpenRouter).', 500)
  }

  let lastErr
  for (const p of providers) {
    try {
      const result = await CALLERS[p](prompt, {
        temperature,
        maxOutputTokens,
        thinkingBudget,
        responseMimeType,
      })
      return result
    } catch (err) {
      lastErr = err
      // Only fall back on retryable/quota errors
      if (!RETRYABLE.has(err.status)) {
        console.warn(`[AI ${p}] non-retryable error, bubbling up:`, err.status, err.message?.slice(0, 200))
        throw err
      }
      console.warn(`[AI] ${p} failed (${err.status}), falling back to next provider...`)
    }
  }
  throw lastErr
}

/* --------------------------------- Utils --------------------------------- */

async function httpErr(res, provider) {
  let detail = ''
  try {
    detail = await res.text()
  } catch {}
  const err = new Error(`${provider} ${res.status}: ${detail.slice(0, 400)}`)
  err.status = res.status
  err.provider = provider
  return err
}

function makeErr(code, message, status) {
  const err = new Error(message)
  err.code = code
  err.status = status
  return err
}

/**
 * Extract a JSON object from LLM text output (strips markdown fences etc).
 * Returns null if unparseable.
 */
export function extractJson(text) {
  if (!text) return null
  let s = text.trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  try {
    return JSON.parse(s.slice(first, last + 1))
  } catch {
    return null
  }
}
