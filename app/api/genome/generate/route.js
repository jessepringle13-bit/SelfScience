// /app/app/api/genome/generate/route.js
// SelfScience Step 2 — dedicated AI plain-language endpoint.
//
// Sits BESIDE /api/interpret-genome (the older combined endpoint). This one
// receives an already-classified variant list from the browser (Step 1 having
// run client-side) and asks the AI to write plain-language card copy only.
//
// The AI is not allowed to invent classifications — the client sends
// `classification` in the payload and this endpoint doesn't touch it. The
// AI's job is card_title / card_body / what_this_means / search_queries.
//
// Cascade: Together AI (Llama 3.3 70B) → OpenRouter paid (Llama 3.1 70B).
// Keys are read from server-side env only and never exposed to the client.

import { NextResponse } from 'next/server'

const TOGETHER_BASE            = 'https://api.together.xyz/v1'
const TOGETHER_MODEL           = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
const OPENROUTER_BASE          = 'https://openrouter.ai/api/v1'
const OPENROUTER_FALLBACK_MODEL = 'meta-llama/llama-3.1-70b-instruct'

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { system, user, variant_count } = body || {}
  if (!system || !user) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  // Cap max_tokens at ~120 tokens per card, ceiling 8000. Non-reasoning models
  // so no hidden-thinking budget is wasted — this is real output tokens.
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
          return NextResponse.json({ content, source: 'together_ai', model: TOGETHER_MODEL })
        }
        console.warn('[genome/generate] Together AI returned non-JSON — cascading')
      } else {
        console.warn(`[genome/generate] Together AI failed: ${res.status} — cascading`)
      }
    }
  } catch (err) {
    console.warn('[genome/generate] Together AI threw:', err?.message)
  }

  // ---- Tier 2: OpenRouter (paid) ----
  try {
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
        console.info('[genome/generate] cascaded to OpenRouter fallback')
        return NextResponse.json({ content, source: 'openrouter_fallback', model: OPENROUTER_FALLBACK_MODEL })
      }
    }
  } catch (err) {
    console.warn('[genome/generate] OpenRouter fallback threw:', err?.message)
  }

  return NextResponse.json(
    { error: 'Genome generation unavailable — both providers failed' },
    { status: 503 },
  )
}
