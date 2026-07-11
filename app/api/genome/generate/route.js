// /app/app/api/genome/generate/route.js
// Thin server endpoint for browser Step 2 calls. All provider cascade logic
// lives in /app/lib/genomeGenerateProvider.js so /api/interpret-genome and
// this route share the same behaviour.

import { NextResponse } from 'next/server'
import { callGenomeGenerateProvider } from '@/lib/genomeGenerateProvider'

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
  try {
    const out = await callGenomeGenerateProvider({ system, user, variant_count })
    return NextResponse.json(out)
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Provider unavailable' }, { status: 503 })
  }
}
