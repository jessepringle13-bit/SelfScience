// /app/lib/supplements/pricesStore.js
// MongoDB overlay for scraper-written supplement prices.
//
// Design:
//   * The bundled /app/lib/supplements/prices.json remains the baseline
//     (curated + build-time entries). This overlay lets the scraper push
//     fresh prices without a code deploy in production, where the app's
//     filesystem is read-only.
//   * Storage shape (collection: 'supplement_prices'):
//        _id: 'overlay'      (single document, upserted)
//        prices: { key: { perServing, currency, updated, source, productUrl? } }
//        meta:   { lastUpdated, source, notes, scraperVersion? }
//        updatedAt: ISODate
//   * Read helpers merge in-memory: JSON < Mongo overlay. Latest wins.
//   * On MongoDB failure the helpers gracefully return the bundled JSON
//     only — the endpoint never 500s just because Mongo is unreachable.

import { getCollection } from '@/lib/mongo'
import PRICES_JSON from './prices.json'

const COLLECTION = 'supplement_prices'
const OVERLAY_ID = 'overlay'

// Short in-process cache so repeated /api/supplements/prices GETs don't
// hit Mongo on every request. 60s is more than fresh enough given the
// scraper cadence (monthly).
const CACHE_TTL_MS = 60_000
let cached = { at: 0, data: null }

async function readOverlay() {
  try {
    const col = await getCollection(COLLECTION)
    const doc = await col.findOne({ _id: OVERLAY_ID })
    return doc || null
  } catch (err) {
    // Mongo unavailable — fall back to JSON-only.
    return null
  }
}

export async function getMergedPrices({ bypassCache = false } = {}) {
  if (!bypassCache && cached.data && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data
  }
  const overlay = await readOverlay()

  const basePrices = PRICES_JSON?.prices || {}
  const baseMeta = PRICES_JSON?._meta || {}

  const merged = { ...basePrices }
  const overlayPrices = overlay?.prices || {}
  for (const [k, v] of Object.entries(overlayPrices)) {
    if (v && typeof v === 'object') merged[k] = { ...v }
  }

  const data = {
    meta: {
      ...baseMeta,
      overlayLastUpdated: overlay?.updatedAt || null,
      overlaySource: overlay?.meta?.source || null,
      overlayNotes: overlay?.meta?.notes || null,
      overlayCount: Object.keys(overlayPrices).length,
      source: overlay ? 'bundled+overlay' : 'bundled',
    },
    prices: merged,
    count: Object.keys(merged).length,
  }
  cached = { at: Date.now(), data }
  return data
}

// Validate a single price entry from the scraper. Only allow known-safe
// shapes so a bad scraper payload can't poison the overlay.
function sanitizeEntry(v) {
  if (!v || typeof v !== 'object') return null
  const perServing = Number(v.perServing)
  if (!isFinite(perServing) || perServing < 0 || perServing > 100) return null
  const out = {
    perServing: Math.round(perServing * 100) / 100,
    currency: typeof v.currency === 'string' ? v.currency.slice(0, 8).toUpperCase() : 'USD',
    updated: typeof v.updated === 'string' && /^\d{4}-\d{2}$/.test(v.updated) ? v.updated : new Date().toISOString().slice(0, 7),
    source: v.source === 'scraped' ? 'scraped' : 'curated',
  }
  if (typeof v.productUrl === 'string' && /^https?:\/\//i.test(v.productUrl) && v.productUrl.length < 512) {
    out.productUrl = v.productUrl
  }
  return out
}

function sanitizePricesMap(input) {
  if (!input || typeof input !== 'object') return {}
  const out = {}
  for (const [k, v] of Object.entries(input)) {
    if (typeof k !== 'string' || k.length < 3 || k.length > 200) continue
    // Require the '<brand>::<ingredient>' shape.
    if (!k.includes('::')) continue
    const clean = sanitizeEntry(v)
    if (clean) out[k.toLowerCase()] = clean
  }
  return out
}

// Overwrite (replace) the entire overlay. Scraper runs are all-or-
// nothing — we don't want stale keys to linger after a brand or
// ingredient rename.
export async function replaceOverlay(payload) {
  const prices = sanitizePricesMap(payload?.prices)
  const meta = {
    source: typeof payload?.source === 'string' ? payload.source.slice(0, 60) : 'scraper',
    notes: typeof payload?.notes === 'string' ? payload.notes.slice(0, 500) : null,
    scraperVersion: typeof payload?.scraperVersion === 'string' ? payload.scraperVersion.slice(0, 40) : null,
  }
  const doc = {
    _id: OVERLAY_ID,
    prices,
    meta,
    updatedAt: new Date(),
  }
  try {
    const col = await getCollection(COLLECTION)
    await col.replaceOne({ _id: OVERLAY_ID }, doc, { upsert: true })
    cached = { at: 0, data: null } // invalidate
    return { ok: true, wrote: Object.keys(prices).length, updatedAt: doc.updatedAt }
  } catch (err) {
    return { ok: false, error: String(err?.message || err) }
  }
}

// Merge (partial upsert) — useful for one-off manual price corrections.
export async function mergeOverlay(payload) {
  const prices = sanitizePricesMap(payload?.prices)
  if (Object.keys(prices).length === 0) {
    return { ok: false, error: 'No valid price entries in payload' }
  }
  const setDoc = {}
  for (const [k, v] of Object.entries(prices)) {
    setDoc[`prices.${k}`] = v
  }
  setDoc.updatedAt = new Date()
  if (typeof payload?.source === 'string') setDoc['meta.source'] = payload.source.slice(0, 60)
  if (typeof payload?.notes === 'string') setDoc['meta.notes'] = payload.notes.slice(0, 500)

  try {
    const col = await getCollection(COLLECTION)
    await col.updateOne(
      { _id: OVERLAY_ID },
      { $set: setDoc, $setOnInsert: { _id: OVERLAY_ID } },
      { upsert: true },
    )
    cached = { at: 0, data: null }
    return { ok: true, wrote: Object.keys(prices).length, updatedAt: setDoc.updatedAt }
  } catch (err) {
    return { ok: false, error: String(err?.message || err) }
  }
}

export async function clearOverlay() {
  try {
    const col = await getCollection(COLLECTION)
    await col.deleteOne({ _id: OVERLAY_ID })
    cached = { at: 0, data: null }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err?.message || err) }
  }
}
