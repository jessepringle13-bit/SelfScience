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
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    let detail = ''
    try {
      detail = await res.text()
    } catch {}
    const err = new Error(`Gemini ${res.status}: ${detail.slice(0, 400)}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
  return { text, raw: data }
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
