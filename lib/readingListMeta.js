// /app/lib/readingListMeta.js
// Section 11 spec — annotations + read-state helpers for saved studies.
// Namespaced under ss_reading_list_notes / ss_reading_list_read so we
// stay compliant with the global localStorage naming rule.

const NOTES_KEY = 'ss_reading_list_notes'
const READ_KEY  = 'ss_reading_list_read'
const CHANGE_EVENT = 'selfscience:reading-list-meta-changed'
export const READING_LIST_META_CHANGE_EVENT = CHANGE_EVENT
export const MAX_NOTE_LENGTH = 500

function safeParse(v, fallback) {
  try { return JSON.parse(v) || fallback } catch { return fallback }
}

// ─── Notes ──────────────────────────────────────────────────────────

export function loadNotes() {
  if (typeof window === 'undefined') return {}
  try { return safeParse(window.localStorage.getItem(NOTES_KEY), {}) } catch { return {} }
}
export function getNote(studyId) {
  if (!studyId) return ''
  return loadNotes()[studyId] || ''
}
export function saveNote(studyId, text) {
  if (!studyId || typeof window === 'undefined') return
  const clean = String(text || '').slice(0, MAX_NOTE_LENGTH)
  const notes = loadNotes()
  if (clean) notes[studyId] = clean
  else delete notes[studyId]
  try {
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {}
}

// ─── Read / unread ─────────────────────────────────────────────────

function loadReadSet() {
  if (typeof window === 'undefined') return new Set()
  try {
    const arr = safeParse(window.localStorage.getItem(READ_KEY), [])
    return new Set(Array.isArray(arr) ? arr : [])
  } catch { return new Set() }
}
export function isRead(studyId) {
  if (!studyId) return false
  return loadReadSet().has(studyId)
}
export function markRead(studyId) {
  if (!studyId || typeof window === 'undefined') return
  const s = loadReadSet()
  if (s.has(studyId)) return
  s.add(studyId)
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...s]))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {}
}
export function markUnread(studyId) {
  if (!studyId || typeof window === 'undefined') return
  const s = loadReadSet()
  if (!s.has(studyId)) return
  s.delete(studyId)
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...s]))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {}
}
export function allReadIds() {
  return [...loadReadSet()]
}

// ─── CSV Export ────────────────────────────────────────────────────

function csvCell(v) {
  if (v === null || v === undefined) return ''
  const s = String(v).replace(/"/g, '""')
  return /[",\n]/.test(s) ? `"${s}"` : s
}

/**
 * Build a CSV export of saved studies with per-paper notes joined in.
 * Suitable for pasting into a reference manager or sharing with a
 * clinician.
 */
export function buildReadingListCSV(items) {
  const notes = loadNotes()
  const readSet = loadReadSet()
  const cols = ['Title', 'Authors', 'Journal', 'Year', 'URL', 'Pillars', 'Reliability', 'Read', 'Note']
  const rows = [cols.join(',')]
  for (const it of items || []) {
    const pillars = Array.isArray(it.pillars) ? it.pillars.join('; ')
      : Array.isArray(it.matchedGenes) ? it.matchedGenes.join('; ')
      : ''
    const row = [
      it.title || '',
      it.authors || '',
      it.journal || '',
      it.year || '',
      it.url || '',
      pillars,
      it.reliabilityLabel || (it.reliability ? String(it.reliability) : ''),
      readSet.has(it.id) ? 'yes' : 'no',
      notes[it.id] || '',
    ].map(csvCell).join(',')
    rows.push(row)
  }
  return rows.join('\n')
}

export function downloadReadingListCSV(items, filename = 'selfscience-reading-list.csv') {
  if (typeof window === 'undefined') return
  const csv = buildReadingListCSV(items)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
