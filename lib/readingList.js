'use client'

// /app/lib/readingList.js
// Universal save/bookmark store for content cards across the platform.
// Stored in localStorage under `ss_reading_list` (per product spec).
//
// This lib is intentionally decoupled from the existing `savedStudies`
// module so we can support ALL six card types (research, finding,
// article, trial, digest) without perturbing the legacy Reading List
// page.

import { useEffect, useState } from 'react'

const LS_KEY = 'ss_reading_list'
const LS_LIMIT_TOAST_SHOWN = 'ss_reading_list_full_shown'
export const CHANGE_EVENT = 'selfscience:reading-list-changed'
export const MAX_ITEMS = 100

/* ---------------------- Type meta (colours + labels) ------------------ */

export const TYPE_META = {
  research: { label: 'Research', bg: 'bg-ss-teal',   text: 'text-white' },
  finding:  { label: 'Finding',  bg: 'bg-ss-green',  text: 'text-white' },
  article:  { label: 'Article',  bg: 'bg-ss-amber',  text: 'text-white' },
  trial:    { label: 'Trial',    bg: 'bg-[#3A67B8]', text: 'text-white' }, // ss-blue
  digest:   { label: 'Digest',   bg: 'bg-ss-teal',   text: 'text-white' },
}

/* -------------------------- Core storage ------------------------------ */

export function readList() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function writeList(next) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  } catch {}
}

export function isSaved(id) {
  if (!id) return false
  return readList().some((x) => x.id === id)
}

/**
 * Save an item. Returns:
 *   { ok: true }             on success
 *   { ok: false, reason: 'exists' }   if already saved
 *   { ok: false, reason: 'full', limit: 100 }  if at cap
 */
export function saveItem(item) {
  if (!item?.id) return { ok: false, reason: 'invalid' }
  const list = readList()
  if (list.some((x) => x.id === item.id)) return { ok: false, reason: 'exists' }
  if (list.length >= MAX_ITEMS) return { ok: false, reason: 'full', limit: MAX_ITEMS }
  const record = {
    id: item.id,
    type: item.type || 'research',
    title: item.title || 'Saved item',
    source: item.source || '',
    url: item.url || null,
    pillar: item.pillar || null,
    variantTag: item.variantTag || null,
    notes: item.notes || null,
    savedAt: new Date().toISOString(),
  }
  writeList([record, ...list])
  return { ok: true }
}

export function unsaveItem(id) {
  const list = readList().filter((x) => x.id !== id)
  writeList(list)
}

export function updateItemNotes(id, notes) {
  const list = readList().map((x) => (x.id === id ? { ...x, notes: notes || null } : x))
  writeList(list)
}

export function clearList() {
  writeList([])
}

export function limitToastAlreadyShown() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(LS_LIMIT_TOAST_SHOWN) === 'true' } catch { return false }
}
export function markLimitToastShown() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_LIMIT_TOAST_SHOWN, 'true') } catch {}
}

/* -------------------------- Hooks ------------------------------------- */

export function useReadingList() {
  const [list, setList] = useState([])
  useEffect(() => {
    const load = () => setList(readList())
    load()
    const onChange = () => load()
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', (e) => { if (e?.key === LS_KEY) load() })
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
    }
  }, [])
  return list
}

export function useSavedCount() {
  const list = useReadingList()
  return list.length
}

export function useIsSaved(id) {
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    const check = () => setSaved(isSaved(id))
    check()
    window.addEventListener(CHANGE_EVENT, check)
    return () => window.removeEventListener(CHANGE_EVENT, check)
  }, [id])
  return saved
}

/* -------------------------- Micro-toast ------------------------------- */
// Very small toast used by save/unsave interactions. Rendered by
// <ReadingListToaster/> which is mounted in layout.js.

export const TOAST_EVENT = 'selfscience:reading-list-toast'

export function fireToast({ message, tone = 'success', href = null }) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
      detail: { message, tone, href, ts: Date.now() },
    }))
  } catch {}
}

/* -------------------------- CSV export -------------------------------- */

export function downloadListAsCsv(list) {
  if (!list || !list.length || typeof window === 'undefined') return
  const rows = [
    ['Title', 'Type', 'Source', 'Pillar', 'Saved Date', 'URL', 'Notes'],
    ...list.map((x) => [
      x.title || '',
      x.type || '',
      x.source || '',
      x.pillar || '',
      x.savedAt || '',
      x.url || '',
      (x.notes || '').replace(/\r?\n/g, ' '),
    ]),
  ]
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `selfscience-reading-list-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* -------------------------- Digest bonus tracking --------------------- */
// Track which of the 3 digest cards the user has "viewed" this ISO week.
// Viewing == clicking any link on the card (Read study / Learn more /
// See details). When all 3 are viewed we surface the bonus content.

function isoWeekStamp(date = new Date()) {
  // ISO week: yearly week counter, e.g. 2026W30. Uses UTC to be tz-safe.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = (d.getUTCDay() + 6) % 7 // Mon=0
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(
    ((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  )
  return `${d.getUTCFullYear()}W${String(week).padStart(2, '0')}`
}
export function currentWeekStamp() { return isoWeekStamp() }

const DIGEST_KEY = (ws) => `ss_digest_viewed_${ws}`

export function getDigestViewed() {
  if (typeof window === 'undefined') return { paper: false, insight: false, trial: false }
  try {
    const raw = window.localStorage.getItem(DIGEST_KEY(currentWeekStamp()))
    if (!raw) return { paper: false, insight: false, trial: false }
    const p = JSON.parse(raw)
    return { paper: !!p?.paper, insight: !!p?.insight, trial: !!p?.trial }
  } catch { return { paper: false, insight: false, trial: false } }
}

export function markDigestCardViewed(cardKey) {
  if (typeof window === 'undefined') return
  const cur = getDigestViewed()
  const next = { ...cur, [cardKey]: true }
  try {
    window.localStorage.setItem(DIGEST_KEY(currentWeekStamp()), JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('selfscience:digest-viewed-changed'))
  } catch {}
}

export function useDigestViewed() {
  const [viewed, setViewed] = useState({ paper: false, insight: false, trial: false })
  useEffect(() => {
    const load = () => setViewed(getDigestViewed())
    load()
    window.addEventListener('selfscience:digest-viewed-changed', load)
    return () => window.removeEventListener('selfscience:digest-viewed-changed', load)
  }, [])
  return viewed
}
