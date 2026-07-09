/**
 * Gemini API wrapper. Uses the endpoint pattern from the SelfScience brief:
 *   https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}
 * Configurable via GEMINI_MODEL env; defaults to gemini-2.5-flash (current generation).
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

const ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

export async function callGemini(prompt, { temperature = 0.1, maxOutputTokens = 2048, responseMimeType, thinkingBudget } = {}) {
  if (!GEMINI_KEY) {
    const err = new Error('GEMINI_API_KEY not configured')
    err.code = 'NO_KEY'
    throw err
  }

  const generationConfig = {
    temperature,
    maxOutputTokens,
    ...(responseMimeType ? { responseMimeType } : {}),
    ...(typeof thinkingBudget === 'number' ? { thinkingConfig: { thinkingBudget } } : {}),
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
  }

  const url = `${ENDPOINT(GEMINI_MODEL)}?key=${encodeURIComponent(GEMINI_KEY)}`

  const RETRYABLE = new Set([500, 502, 503, 504])
  const MAX_ATTEMPTS = 3
  let lastErr

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json()
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
      return { text, raw: data }
    }

    let detail = ''
    try {
      detail = await res.text()
    } catch {}
    lastErr = new Error(`Gemini ${res.status}: ${detail.slice(0, 400)}`)
    lastErr.status = res.status

    if (!RETRYABLE.has(res.status) || attempt === MAX_ATTEMPTS) throw lastErr

    // Exponential backoff: 800ms, 1600ms, 3200ms
    await new Promise((r) => setTimeout(r, 800 * Math.pow(2, attempt - 1)))
  }

  throw lastErr
}

export function extractJson(text) {
  if (!text) return null
  let s = text.trim()
  // Strip markdown fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  // Extract first JSON object substring
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  const candidate = s.slice(first, last + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}
