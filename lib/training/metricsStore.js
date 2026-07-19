// /app/lib/training/metricsStore.js
// localStorage-backed log for the Metrics-to-Track panel. Each metric has a
// list of {value, dateISO, ts} entries — used both to display "your latest"
// value and to draw a recharts sparkline when 2+ entries exist.
//
// Data never leaves the browser (SelfScience privacy contract).
//
// Storage shape:
//   ss_training_metrics_v1 -> {
//     [metricName]: [{ value: number|string, dateISO: 'YYYY-MM-DD', ts: 173... }, ...],
//     ...
//   }

const KEY = 'ss_training_metrics_v1'

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readAll() {
  if (!hasWindow()) return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj : {}
  } catch { return {} }
}

function writeAll(obj) {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(obj))
    window.dispatchEvent(new CustomEvent('selfscience:training-metrics-changed'))
  } catch { /* ignore */ }
}

// All entries for a single metric name, sorted oldest -> newest for chart use.
export function getEntries(metricName) {
  if (!metricName) return []
  const all = readAll()
  const arr = Array.isArray(all[metricName]) ? all[metricName] : []
  return [...arr].sort((a, b) => (a.ts || 0) - (b.ts || 0))
}

// Latest (newest) entry for a metric, or null.
export function getLatestEntry(metricName) {
  const entries = getEntries(metricName)
  return entries.length ? entries[entries.length - 1] : null
}

// Save a new entry. Idempotent by (name, dateISO): a same-day re-log
// overwrites the previous entry for that date so the sparkline stays clean.
export function saveEntry(metricName, value, dateISO) {
  if (!metricName) return null
  const day = String(dateISO || new Date().toISOString().slice(0, 10)).slice(0, 10)
  const numeric = Number(String(value).replace(',', '.'))
  const rec = {
    value: isNaN(numeric) ? String(value) : numeric,
    dateISO: day,
    ts: Date.now(),
  }
  const all = readAll()
  const list = Array.isArray(all[metricName]) ? all[metricName] : []
  const filtered = list.filter((e) => e.dateISO !== day)
  filtered.push(rec)
  all[metricName] = filtered.slice(-100) // cap per metric
  writeAll(all)
  return rec
}

// Delete a single entry by timestamp (undo affordance).
export function deleteEntry(metricName, ts) {
  if (!metricName || !ts) return
  const all = readAll()
  const list = Array.isArray(all[metricName]) ? all[metricName] : []
  all[metricName] = list.filter((e) => e.ts !== ts)
  writeAll(all)
}
