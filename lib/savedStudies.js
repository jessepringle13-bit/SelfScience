'use client'

// /app/lib/savedStudies.js
// LocalStorage-backed "reading list" for research studies. Shared across the
// Search page (per-card bookmark toggle) and the Reading List page (which
// surfaces the saved studies section).
//
// Storage key: `ss:saved-studies` — array of light-weight study snapshots
// (id, title, plainTitle, journal, year, url, reliability + label + note,
//  source, matchedGenes, savedAt). Full abstracts / plain-language bodies
// are NOT persisted here to keep localStorage under the ~5MB quota — the
// search-page reliability cache (`ss:analysis:*`) already retains that
// content for 7 days if the user re-opens the study.
//
// A CustomEvent (`selfscience:saved-studies-changed`) is dispatched on every
// mutation so any component (bookmark icon, list badge, reading list page)
// can subscribe with a single addEventListener call and stay in sync across
// tabs/routes.

const STORAGE_KEY = 'ss:saved-studies'
const CHANGE_EVENT = 'selfscience:saved-studies-changed'
const MAX_SAVED = 500 // hard cap to protect the quota

function safeRead() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeWrite(list) {
  if (typeof window === 'undefined') return
  try {
    const capped = list.slice(-MAX_SAVED)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(capped))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  } catch {
    /* quota exceeded — silent no-op */
  }
}

// Snapshot only the fields we need on the Reading List page so we don't
// bloat localStorage with full abstracts.
function snapshot(item) {
  if (!item?.id) return null
  return {
    id: String(item.id),
    title: item.title || '',
    plainTitle: item.plainTitle || '',
    journal: item.journal || '',
    year: item.year || '',
    url: item.url || '',
    doi: item.doi || '',
    pmid: item.pmid || '',
    source: item.source || 'peer-reviewed',
    reliability: typeof item.reliability === 'number' ? item.reliability : null,
    reliabilityLabel: item.reliabilityLabel || null,
    reliabilityNote: item.reliabilityNote || null,
    matchedGenes: Array.isArray(item._matchedGenes) ? item._matchedGenes.slice(0, 6) : [],
    savedAt: Date.now(),
  }
}

export function isSaved(id) {
  if (!id) return false
  return safeRead().some((s) => s.id === String(id))
}

export function getSavedStudies() {
  // Newest first — the reading list surfaces most-recently-saved at top.
  return [...safeRead()].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
}

export function saveStudy(item) {
  const snap = snapshot(item)
  if (!snap) return false
  const current = safeRead()
  if (current.some((s) => s.id === snap.id)) return false
  current.push(snap)
  safeWrite(current)
  return true
}

export function unsaveStudy(id) {
  if (!id) return false
  const current = safeRead()
  const next = current.filter((s) => s.id !== String(id))
  if (next.length === current.length) return false
  safeWrite(next)
  return true
}

/**
 * Toggle helper — the primary API used by the card's bookmark icon.
 * Returns `true` if the study is now saved, `false` if it was removed.
 */
export function toggleSaveStudy(item) {
  const id = String(item?.id || '')
  if (!id) return false
  if (isSaved(id)) {
    unsaveStudy(id)
    return false
  }
  saveStudy(item)
  return true
}

export function clearSavedStudies() {
  safeWrite([])
}

export const SAVED_STUDIES_CHANGE_EVENT = CHANGE_EVENT
