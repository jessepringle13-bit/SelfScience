/**
 * AI usage tracker — records every provider call so we can monitor cost and
 * credit burn without leaving the app.
 *
 * Storage strategy:
 *   • In-memory Map keyed by (provider|model|task) → aggregated counters.
 *   • Persisted to /app/data/ai-usage.json every 30s (best-effort). This
 *     survives Next.js hot-reloads AND supervisor restarts, so weekly
 *     monitoring keeps working through a redeploy.
 *   • Bounded: we also keep a ring buffer of the last 200 individual calls
 *     for spot-checking recent activity, but never grow beyond that.
 *
 * Cost estimation uses a small in-code price table (see PRICES). If a model
 * is missing from the table, we still count tokens but leave cost=0 for
 * that row — the admin dashboard will surface unknown-price entries.
 */

import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR  = process.env.AI_USAGE_DIR || '/app/data'
const DATA_FILE = path.join(DATA_DIR, 'ai-usage.json')
const SAVE_DEBOUNCE_MS = 30 * 1000  // flush at most every 30s
const RING_MAX = 200

/**
 * Prices in USD per 1,000,000 tokens. Kept small and explicit. Update as
 * providers publish new pricing.
 *
 * NOTE: Together AI's Llama-3.3-70B-Instruct-Turbo is on the free serverless
 * tier ($25 credit). Once credit is exhausted, pricing kicks in at ~$0.88
 * per 1M tokens. For now, credit-based, so we log the tokens but attribute
 * $0 until credit runs out.
 */
const PRICES = {
  'openrouter:meta-llama/llama-3.1-70b-instruct':        { in: 0.09,  out: 0.09  },
  'openrouter:meta-llama/llama-3.1-8b-instruct':         { in: 0.02,  out: 0.03  },
  'openrouter:meta-llama/llama-3.3-70b-instruct':        { in: 0.06,  out: 0.25  },
  'openrouter:meta-llama/llama-3.3-70b-instruct:free':   { in: 0,     out: 0     },
  'together:meta-llama/Llama-3.3-70B-Instruct-Turbo':    { in: 0.88,  out: 0.88  }, // Post-credit
}

function priceKey(provider, model) { return `${provider}:${model}` }

function estimateCostUsd(provider, model, usage) {
  const key = priceKey(provider, model)
  const p = PRICES[key]
  if (!p) return { usd: 0, unknown: true }
  const inTok  = usage?.prompt_tokens     || usage?.input_tokens  || 0
  const outTok = usage?.completion_tokens || usage?.output_tokens || 0
  const usd = (inTok / 1e6) * p.in + (outTok / 1e6) * p.out
  return { usd, unknown: false }
}

/* ------------------------------ Storage --------------------------------- */

/**
 * Shape of the persisted document:
 * {
 *   startedAt: iso,
 *   lastUpdated: iso,
 *   totals: { calls, inTokens, outTokens, usd },
 *   byKey:  { "provider|model|task": { calls, inTokens, outTokens, usd, first, last } },
 *   byDay:  { "YYYY-MM-DD": { calls, inTokens, outTokens, usd } },
 *   ring:   [ { ts, provider, model, task, inTokens, outTokens, usd, status } ]  // last N
 * }
 */
const GLOBAL_KEY = '__ss_ai_usage__'
let state = globalThis[GLOBAL_KEY]
if (!state) {
  state = { loaded: false, data: emptyDoc(), saveTimer: null, lastSaveAt: 0 }
  globalThis[GLOBAL_KEY] = state
}

function emptyDoc() {
  const now = new Date().toISOString()
  return {
    startedAt: now, lastUpdated: now,
    totals: { calls: 0, inTokens: 0, outTokens: 0, usd: 0 },
    byKey: {}, byDay: {}, ring: [],
  }
}

async function ensureLoaded() {
  if (state.loaded) return
  state.loaded = true
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') state.data = { ...emptyDoc(), ...parsed }
  } catch {
    // First run — leave the empty doc in place.
  }
}

function scheduleSave() {
  if (state.saveTimer) return
  state.saveTimer = setTimeout(async () => {
    state.saveTimer = null
    try {
      state.data.lastUpdated = new Date().toISOString()
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(DATA_FILE, JSON.stringify(state.data, null, 2))
      state.lastSaveAt = Date.now()
    } catch (err) {
      console.warn('[ai-usage] failed to persist:', err?.message)
    }
  }, SAVE_DEBOUNCE_MS)
}

/* ---------------------------- Public API -------------------------------- */

/**
 * Record a single AI call. Safe to call frequently — internally aggregates
 * to bounded structures.
 *
 * @param {Object} entry
 * @param {'together'|'openrouter'} entry.provider
 * @param {string}   entry.model
 * @param {string}   entry.task    — 'reliability' | 'plain-language' | 'genome' | ...
 * @param {'ok'|'fail'} entry.status
 * @param {Object}   [entry.usage] — { prompt_tokens, completion_tokens }
 * @param {number}   [entry.latencyMs]
 * @param {number}   [entry.httpStatus]
 */
export async function recordAiCall(entry) {
  await ensureLoaded()
  const d = state.data
  const provider = entry.provider || 'unknown'
  const model = entry.model || 'unknown'
  const task = entry.task || 'unknown'
  const usage = entry.usage || {}
  const inTok  = usage.prompt_tokens     || usage.input_tokens  || 0
  const outTok = usage.completion_tokens || usage.output_tokens || 0
  const { usd, unknown } = estimateCostUsd(provider, model, usage)

  d.totals.calls   += 1
  d.totals.inTokens  += inTok
  d.totals.outTokens += outTok
  d.totals.usd       += usd

  const key = `${provider}|${model}|${task}`
  const now = new Date()
  const iso = now.toISOString()
  const day = iso.slice(0, 10)

  const bucket = d.byKey[key] || (d.byKey[key] = {
    calls: 0, inTokens: 0, outTokens: 0, usd: 0, unknownPrice: unknown,
    first: iso, last: iso,
  })
  bucket.calls      += 1
  bucket.inTokens   += inTok
  bucket.outTokens  += outTok
  bucket.usd        += usd
  bucket.last        = iso

  const dayBucket = d.byDay[day] || (d.byDay[day] = { calls: 0, inTokens: 0, outTokens: 0, usd: 0 })
  dayBucket.calls      += 1
  dayBucket.inTokens   += inTok
  dayBucket.outTokens  += outTok
  dayBucket.usd        += usd

  // Ring buffer — bounded.
  d.ring.push({
    ts: iso, provider, model, task,
    status: entry.status || 'ok',
    httpStatus: entry.httpStatus || null,
    inTokens: inTok, outTokens: outTok, usd,
    latencyMs: entry.latencyMs || null,
  })
  while (d.ring.length > RING_MAX) d.ring.shift()

  scheduleSave()
}

/** Return a shallow copy of the current usage document. */
export async function getUsageSnapshot() {
  await ensureLoaded()
  // JSON deep-clone so callers can't mutate our state.
  return JSON.parse(JSON.stringify(state.data))
}

/**
 * Live-check remaining OpenRouter credit balance. Uses their /credits
 * endpoint. Returns null if the key isn't configured or the request fails.
 */
export async function fetchOpenRouterCredit() {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const j = await res.json()
    return j?.data || j
  } catch (err) {
    return { error: err?.message || 'network' }
  }
}
