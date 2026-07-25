'use client'

// /app/lib/journal.js
// Personal Health Journal — client-only storage engine.
// All entries live in localStorage under `ss_journal`. Zero server
// interaction. CSV/PDF export are both browser-only (Blob + print).
//
// Entry shape:
//   {
//     id, type, text, findingId, findingName, actionCategory,
//     moodRating, tags, createdAt, editedAt, searchQuery,
//   }
// type ∈ 'observation' | 'reflection' | 'action' | 'question'

import { useEffect, useState } from 'react'

const LS_KEY = 'ss_journal'
export const CHANGE_EVENT = 'selfscience:journal-changed'
export const MIN_TEXT_LEN = 20

/* ------------------------- Type metadata --------------------------- */

export const TYPE_META = {
  observation: {
    label: 'Observation',
    verb: 'noticed',
    hint: 'I noticed…',
    // Uses ss-teal (blue-ish) to signal factual capture.
    accent: 'text-ss-teal',
    dot: 'bg-ss-teal',
    ring: 'ring-ss-teal',
    softBg: 'bg-ss-teal/10',
    icon: 'Eye',
  },
  reflection: {
    label: 'Reflection',
    verb: 'reflected',
    hint: 'I think…',
    accent: 'text-ss-amber',
    dot: 'bg-ss-amber',
    ring: 'ring-ss-amber',
    softBg: 'bg-ss-amber/10',
    icon: 'MessageCircle',
  },
  action: {
    label: 'Action',
    verb: 'did',
    hint: 'I tried…',
    accent: 'text-ss-green',
    dot: 'bg-ss-green',
    ring: 'ring-ss-green',
    softBg: 'bg-ss-green/10',
    icon: 'CheckCircle2',
  },
  question: {
    label: 'Question',
    verb: 'asked',
    hint: 'I wonder…',
    accent: 'text-ss-orange',
    dot: 'bg-ss-orange',
    ring: 'ring-ss-orange',
    softBg: 'bg-ss-orange/10',
    icon: 'HelpCircle',
  },
}

export const TYPES = Object.keys(TYPE_META)

export const ACTION_CATEGORIES = [
  'Supplement',
  'Diet change',
  'Exercise',
  'Sleep',
  'Stress management',
  'Medication',
  'Lab test',
  'Doctor visit',
  'Other',
]

export const MOOD_LABELS = {
  1: 'Rough',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
}

/* ------------------------- Core storage ---------------------------- */

export function readJournal() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeJournal(list) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  } catch {}
}

function uid() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `j_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function addEntry(entry) {
  const now = new Date().toISOString()
  const rec = {
    id: uid(),
    type: entry.type || 'reflection',
    text: (entry.text || '').trim(),
    findingId: entry.findingId || null,
    findingName: entry.findingName || null,
    actionCategory: entry.actionCategory || null,
    moodRating: Number.isFinite(entry.moodRating) ? entry.moodRating : null,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    // createdAt is the user-picked (or default: today) day of the entry.
    // We store as ISO so timeline sort is trivial.
    createdAt: entry.createdAt || now,
    editedAt: null,
    searchQuery: entry.searchQuery || null,
  }
  const list = [rec, ...readJournal()]
  writeJournal(list)
  return rec
}

export function updateEntry(id, patch) {
  const list = readJournal().map((e) => (e.id === id ? { ...e, ...patch, editedAt: new Date().toISOString() } : e))
  writeJournal(list)
}

export function deleteEntry(id) {
  writeJournal(readJournal().filter((e) => e.id !== id))
}

export function clearAllEntries() {
  writeJournal([])
}

export function useJournal() {
  const [list, setList] = useState([])
  useEffect(() => {
    const load = () => setList(readJournal())
    load()
    const onChange = () => load()
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', (e) => {
      if (e?.key === LS_KEY) load()
    })
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return list
}

export function useJournalCount() {
  return useJournal().length
}

/* ------------------------ Derived helpers -------------------------- */

/**
 * Group entries into daily buckets, oldest→newest or newest→oldest.
 * Returns [{ dateKey, dateLabel, entries: [] }, ...]
 */
export function groupByDay(entries, { ascending = false } = {}) {
  const bucket = new Map()
  for (const e of entries) {
    const d = new Date(e.createdAt)
    if (Number.isNaN(d.getTime())) continue
    const key = d.toISOString().slice(0, 10)
    if (!bucket.has(key)) bucket.set(key, [])
    bucket.get(key).push(e)
  }
  const keys = [...bucket.keys()].sort()
  if (!ascending) keys.reverse()
  return keys.map((k) => ({
    dateKey: k,
    dateLabel: formatFullDate(k),
    entries: bucket.get(k).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
  }))
}

export function formatFullDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export function formatShortDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export function relativeTime(iso) {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const s = Math.floor(diff / 1000)
    if (s < 60) return 'just now'
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const day = Math.floor(h / 24)
    if (day < 7) return `${day}d ago`
    return formatShortDate(iso)
  } catch {
    return ''
  }
}

/**
 * Sample mood ratings over a rolling N-day window. Days with no rating
 * are null so the chart can draw gaps.
 */
export function moodSeries(entries, days = 30) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  const perDay = new Map() // dateKey -> [values]
  for (const e of entries) {
    if (!Number.isFinite(e.moodRating)) continue
    const d = new Date(e.createdAt)
    if (Number.isNaN(d.getTime())) continue
    if (d < start) continue
    const key = d.toISOString().slice(0, 10)
    if (!perDay.has(key)) perDay.set(key, [])
    perDay.get(key).push(e.moodRating)
  }
  const out = []
  for (let i = 0; i < days; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    const key = day.toISOString().slice(0, 10)
    const values = perDay.get(key) || []
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
    out.push({ dateKey: key, date: day, value: avg })
  }
  return out
}

/**
 * Collect the top-N most-used tags from a list of entries.
 */
export function topTags(entries, n = 12) {
  const counts = new Map()
  for (const e of entries) {
    for (const t of e.tags || []) {
      const k = String(t).trim().toLowerCase()
      if (!k) continue
      counts.set(k, (counts.get(k) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag, count]) => ({ tag, count }))
}

/* --------------------------- Exports ------------------------------- */

export function downloadCsv(entries) {
  if (typeof window === 'undefined' || !entries?.length) return
  const rows = [
    ['Date', 'Type', 'Finding', 'Action Category', 'Mood (1-5)', 'Tags', 'Text'],
    ...entries.map((e) => [
      new Date(e.createdAt).toISOString(),
      e.type,
      e.findingName || '',
      e.actionCategory || '',
      e.moodRating ?? '',
      (e.tags || []).join('; '),
      (e.text || '').replace(/\r?\n/g, ' '),
    ]),
  ]
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `selfscience-journal-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * PDF export via lightweight print-window approach — opens a formatted
 * printable HTML page in a new tab. User picks "Save as PDF" from the
 * browser print dialog. No third-party PDF library required.
 */
export function openPrintablePdf(entries) {
  if (typeof window === 'undefined') return
  const list = (entries || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
  const rows = list.map((e) => {
    const t = TYPE_META[e.type] || {}
    const dot = t.dot === 'bg-ss-teal' ? '#1B474D'
      : t.dot === 'bg-ss-amber' ? '#964219'
      : t.dot === 'bg-ss-green' ? '#2E7D32'
      : t.dot === 'bg-ss-orange' ? '#C45820'
      : '#7A7974'
    const dateStr = new Date(e.createdAt).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    return `
      <div class="entry">
        <div class="row">
          <span class="dot" style="background:${dot}"></span>
          <span class="type">${esc(t.label || e.type)}</span>
          <span class="date">${esc(dateStr)}</span>
          ${e.moodRating ? `<span class="mood">Mood ${e.moodRating}/5</span>` : ''}
        </div>
        ${e.findingName ? `<div class="meta">Finding: ${esc(e.findingName)}</div>` : ''}
        ${e.actionCategory ? `<div class="meta">Category: ${esc(e.actionCategory)}</div>` : ''}
        <div class="text">${esc(e.text)}</div>
        ${(e.tags && e.tags.length) ? `<div class="tags">${e.tags.map((t) => `<span>#${esc(t)}</span>`).join(' ')}</div>` : ''}
      </div>
    `
  }).join('')
  const totalMood = list.filter((e) => Number.isFinite(e.moodRating))
  const avgMood = totalMood.length ? (totalMood.reduce((a, b) => a + b.moodRating, 0) / totalMood.length).toFixed(1) : null
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>SelfScience Journal — ${new Date().toISOString().slice(0, 10)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #28251D; margin: 32px; }
  h1 { color: #1B474D; margin: 0 0 4px; }
  .sub { color: #7A7974; font-size: 12px; margin-bottom: 24px; border-bottom: 1px solid #D4D1CA; padding-bottom: 16px; }
  .stat { display: inline-block; margin-right: 20px; }
  .stat b { color: #1B474D; }
  .entry { break-inside: avoid; page-break-inside: avoid; padding: 12px 0; border-bottom: 1px solid #EEE8DA; }
  .row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 6px; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; }
  .type { font-weight: 700; color: #1B474D; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
  .date { color: #7A7974; }
  .mood { margin-left: auto; color: #964219; font-weight: 600; }
  .meta { font-size: 11px; color: #7A7974; margin: 2px 0; }
  .text { font-size: 14px; line-height: 1.55; margin: 6px 0 4px; white-space: pre-wrap; }
  .tags { font-size: 11px; color: #1B474D; }
  .tags span { display:inline-block; background:#EAF5F5; padding:2px 6px; border-radius:8px; margin-right:4px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #D4D1CA; font-size: 10px; color: #7A7974; }
  @media print { body { margin: 20mm; } .noprint { display:none; } }
</style></head>
<body>
  <h1>SelfScience Journal</h1>
  <div class="sub">
    <div class="stat">Entries: <b>${list.length}</b></div>
    ${avgMood ? `<div class="stat">Avg mood: <b>${avgMood}/5</b></div>` : ''}
    <div class="stat">Exported: <b>${new Date().toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' })}</b></div>
  </div>
  ${rows || '<p style="color:#7A7974">No entries to export.</p>'}
  <div class="footer">Generated by SelfScience — Educational only. Not medical advice.</div>
  <div class="noprint" style="margin-top:24px;text-align:center;">
    <button onclick="window.print()" style="padding:10px 20px;border-radius:24px;background:#1B474D;color:white;border:none;font-weight:600;cursor:pointer;">Print or Save as PDF</button>
  </div>
</body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
  // Auto-open the print dialog so users see the Save-as-PDF option immediately.
  setTimeout(() => {
    try { w.focus(); w.print() } catch {}
  }, 400)
}

/* -------------------- Finding-list helper for modal ----------------- */
// Small utility to build a list of {id,name,pillar} for the finding
// selector in the Observation entry type. Reads the same source the
// dashboard/genome pages read, and gracefully returns [] if none.

export function collectFindings(report) {
  if (!report) return []
  const arr = []
  const seen = new Set()
  const push = (c) => {
    const id = c?.rsid || c?.id || `${c?.gene}:${c?.name}`
    if (!id || seen.has(id)) return
    seen.add(id)
    arr.push({
      id,
      name: c?.name || c?.gene || id,
      gene: c?.gene || '',
      pillar: c?.pillar || '',
      genotype: c?.genotype || '',
    })
  }
  for (const c of (report?.overview?.areasToExplore || [])) push(c)
  for (const c of (report?.overview?.strengths || [])) push(c)
  for (const grp of (report?.fullReport || [])) for (const v of (grp?.variants || [])) push(v)
  for (const c of (report?.variants_recognized || [])) push(c)
  return arr.slice(0, 300)
}
