// /app/lib/biomarkersSession.js
// SelfScience — localStorage helper for the biomarker form.
// Unlike genome data (session-only for privacy), biomarker entries are
// often re-visited across sessions, so we persist to localStorage.
// Users can wipe via the "Clear all" button on the panel.

const KEY = 'selfscience_biomarker_values'

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function saveBiomarkerValues(values) {
  if (!hasWindow() || !values) return false
  try { localStorage.setItem(KEY, JSON.stringify(values)); return true } catch { return false }
}

export function getBiomarkerValues() {
  if (!hasWindow()) return {}
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : {} } catch { return {} }
}

export function clearBiomarkerValues() {
  if (!hasWindow()) return
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}
