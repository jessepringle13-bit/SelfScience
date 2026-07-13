// /app/lib/biomarkers/history.js
// Multi-date snapshot storage for biomarker panels. ENTIRELY client-side:
// values live in localStorage, never sent to a server, and are exportable
// as JSON for the user to back up manually.
//
// Storage shape:
//   {
//     entries: [
//       { id: uuid, dateISO: '2025-11-14', values: {...}, context: {...}, sex: 'male' },
//       ...
//     ]
//   }
// Ordered newest-first.

export const HISTORY_STORAGE_KEY = 'selfscience_biomarker_history'

function newId() {
  // crypto.randomUUID is available in evergreen browsers; fall back to Math.random.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'e_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function loadHistory() {
  if (typeof window === 'undefined') return { entries: [] }
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return { entries: [] }
    const parsed = JSON.parse(raw)
    return { entries: Array.isArray(parsed?.entries) ? parsed.entries : [] }
  } catch { return { entries: [] } }
}

function persist(state) {
  try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state)) } catch { /* noop */ }
}

/** Add a new snapshot. Returns the created entry. */
export function addSnapshot({ values, context, sex, dateISO }) {
  const state = loadHistory()
  const iso = dateISO || new Date().toISOString().slice(0, 10)
  // Only include biomarkers with actual values so snapshots stay lean.
  const cleanValues = {}
  for (const [k, v] of Object.entries(values || {})) {
    if (v === '' || v == null) continue
    const n = typeof v === 'number' ? v : parseFloat(v)
    if (Number.isFinite(n)) cleanValues[k] = n
  }
  const entry = {
    id: newId(),
    dateISO: iso,
    savedAt: new Date().toISOString(),
    values: cleanValues,
    context: context ? { ...context } : {},
    sex: sex || 'male',
  }
  state.entries = [entry, ...state.entries].sort(compareEntries)
  persist(state)
  return entry
}

export function updateSnapshotDate(id, dateISO) {
  const state = loadHistory()
  const idx = state.entries.findIndex((e) => e.id === id)
  if (idx < 0) return null
  state.entries[idx] = { ...state.entries[idx], dateISO }
  state.entries.sort(compareEntries)
  persist(state)
  return state.entries[idx]
}

export function deleteSnapshot(id) {
  const state = loadHistory()
  state.entries = state.entries.filter((e) => e.id !== id)
  persist(state)
}

export function clearHistory() {
  try { localStorage.removeItem(HISTORY_STORAGE_KEY) } catch { /* noop */ }
}

/** Newest-first comparator by dateISO then savedAt. */
function compareEntries(a, b) {
  if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? 1 : -1
  return (a.savedAt || '') < (b.savedAt || '') ? 1 : -1
}

/**
 * Return a chronological (oldest-first) series for a single biomarker:
 *   [{ dateISO, value }, ...]
 * Only entries that recorded a numeric value for `biomarkerId` are included.
 */
export function seriesFor(biomarkerId) {
  const { entries } = loadHistory()
  return entries
    .filter((e) => e.values && Number.isFinite(e.values[biomarkerId]))
    .map((e) => ({ dateISO: e.dateISO, value: e.values[biomarkerId] }))
    .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1))
}

/** Export the entire history as a pretty-printed JSON string (for user backup). */
export function exportHistoryJSON() {
  return JSON.stringify(loadHistory(), null, 2)
}
