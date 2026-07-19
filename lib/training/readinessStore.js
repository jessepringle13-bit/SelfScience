// /app/lib/training/readinessStore.js
// localStorage-backed daily readiness check-in for the Recovery tab.
// One check-in per calendar day, keyed by YYYY-MM-DD. Numeric HRV is
// optional (users with wearables can enter it; everyone else leaves blank).
//
// Score model: sleep (1-5) + soreness inverted (1-5) + readiness (1-5) = 3-15
// Threshold for "low readiness" surfacing = 8/15 (matches user spec default).

const KEY = 'ss_readiness_v1'
const LOW_THRESHOLD = 8

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function getAllReadiness() {
  if (!hasWindow()) return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function getTodayReadiness() {
  return getAllReadiness().find((r) => r.dateISO === todayISO()) || null
}

export function saveReadiness({ sleep, soreness, readiness, hrv = null, note = '' }) {
  if (!hasWindow()) return null
  const rec = {
    dateISO: todayISO(),
    sleep: Number(sleep) || 0,
    soreness: Number(soreness) || 0,
    readiness: Number(readiness) || 0,
    // Soreness is inverted — more soreness = lower recovery. Score: 6-soreness.
    total: (Number(sleep) || 0) + (6 - (Number(soreness) || 0)) + (Number(readiness) || 0),
    hrv: hrv != null && hrv !== '' && !isNaN(Number(hrv)) ? Number(hrv) : null,
    note: String(note || '').slice(0, 200),
    ts: Date.now(),
  }
  try {
    const all = getAllReadiness().filter((r) => r.dateISO !== rec.dateISO)
    all.unshift(rec)
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 365)))
    window.dispatchEvent(new CustomEvent('selfscience:readiness-saved', { detail: rec }))
    return rec
  } catch { return null }
}

export function isLowReadiness(rec) {
  if (!rec) return false
  return typeof rec.total === 'number' && rec.total <= LOW_THRESHOLD
}

export { LOW_THRESHOLD }
