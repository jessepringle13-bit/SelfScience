// /app/lib/cta-usage.js
// Ultra-light server-side counter for A/B CTA impressions + clicks.
// Same disk-persistence pattern as /lib/ai-usage.js: bounded in-memory
// map, flushed to /app/data/cta-usage.json every ~30s.
// Keyed by (location|cta|variant|kind).

import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR  = process.env.CTA_USAGE_DIR || '/app/data'
const DATA_FILE = path.join(DATA_DIR, 'cta-usage.json')
const SAVE_DEBOUNCE_MS = 30 * 1000

const GLOBAL_KEY = '__ss_cta_usage__'
let state = globalThis[GLOBAL_KEY]
if (!state) {
  state = { loaded: false, data: empty(), saveTimer: null }
  globalThis[GLOBAL_KEY] = state
}

function empty() {
  const now = new Date().toISOString()
  return { startedAt: now, lastUpdated: now, byKey: {}, byDay: {} }
}

async function ensureLoaded() {
  if (state.loaded) return
  state.loaded = true
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') state.data = { ...empty(), ...parsed }
  } catch {}
}

function scheduleSave() {
  if (state.saveTimer) return
  state.saveTimer = setTimeout(async () => {
    state.saveTimer = null
    try {
      state.data.lastUpdated = new Date().toISOString()
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(DATA_FILE, JSON.stringify(state.data, null, 2))
    } catch (err) {
      console.warn('[cta-usage] failed to persist:', err?.message)
    }
  }, SAVE_DEBOUNCE_MS)
}

/**
 * Record a CTA event.
 * @param {Object} e
 * @param {string} e.location  e.g. 'homepage-hero'
 * @param {string} e.cta       e.g. 'quiz_secondary'
 * @param {string} e.variant   e.g. 'a' | 'b' | 'c'
 * @param {'impression'|'click'} e.kind
 */
export async function recordCtaEvent(e) {
  await ensureLoaded()
  const location = String(e?.location || 'unknown').slice(0, 60)
  const cta      = String(e?.cta      || 'unknown').slice(0, 60)
  const variant  = String(e?.variant  || 'a').slice(0, 8)
  const kind     = e?.kind === 'click' ? 'click' : 'impression'

  const key = `${location}|${cta}|${variant}|${kind}`
  const day = new Date().toISOString().slice(0, 10)

  const b = state.data.byKey[key] || (state.data.byKey[key] = { count: 0, first: new Date().toISOString(), last: null })
  b.count += 1
  b.last   = new Date().toISOString()

  const dk = `${day}|${location}|${cta}|${variant}|${kind}`
  state.data.byDay[dk] = (state.data.byDay[dk] || 0) + 1

  scheduleSave()
}

/** Return a deep-cloned snapshot of the current counts. */
export async function getCtaSnapshot() {
  await ensureLoaded()
  return JSON.parse(JSON.stringify(state.data))
}
