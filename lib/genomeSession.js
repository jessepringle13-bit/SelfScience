// /app/lib/genomeSession.js
// SelfScience — sessionStorage helper for post-genome-upload state.
//
// Genome results live in sessionStorage only. They are cleared automatically
// when the browser tab closes — this is a deliberate privacy-by-design
// choice. Nothing in this file writes to localStorage or a server.
//
// All accessors safely no-op on the server (SSR) where `window` isn't
// defined. Callers should still guard invocation inside `useEffect` where
// possible to avoid unnecessary hydration mismatches.

const KEY = 'selfscience_genome_results'

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function saveGenomeResults(results) {
  if (!hasWindow() || !results) return false
  try {
    sessionStorage.setItem(KEY, JSON.stringify(results))
    return true
  } catch {
    return false
  }
}

export function getGenomeResults() {
  if (!hasWindow()) return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearGenomeResults() {
  if (!hasWindow()) return
  try { sessionStorage.removeItem(KEY) } catch { /* noop */ }
}

export function hasGenomeResults() {
  if (!hasWindow()) return false
  try { return sessionStorage.getItem(KEY) != null } catch { return false }
}

// Fire a synthetic event so components mounted before the save can react.
export function notifyGenomeResultsChanged() {
  if (!hasWindow()) return
  try {
    window.dispatchEvent(new CustomEvent('selfscience:genome-changed'))
  } catch { /* noop */ }
}
