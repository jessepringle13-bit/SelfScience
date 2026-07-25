'use client'

// /app/lib/habits.js
// Habit & Lifestyle Tracker — client-only. All state in `ss_habits`.
// Pure functions + a subscribe hook. No server involved.

import { useEffect, useState } from 'react'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'

const LS_HABITS = 'ss_habits'
const LS_SUGGESTIONS_SHOWN = 'ss_habit_suggestions_shown'
export const CHANGE_EVENT = 'selfscience:habits-changed'
export const MAX_HABITS = 20
export const EDIT_LOCK_DAYS = 30

/* ------------------------- Category metadata ------------------------ */
export const CATEGORY_META = {
  nutrition:   { label: 'Nutrition',   color: '#964219' }, // ss-amber
  supplements: { label: 'Supplements', color: '#2E7D32' }, // ss-green
  training:    { label: 'Training',    color: '#006494' }, // ss-editorial-blue
  wellness:    { label: 'Wellness',    color: '#1B474D' }, // ss-teal
  custom:      { label: 'Custom',      color: '#7A7974' }, // ss-muted
}
export const CATEGORIES = Object.keys(CATEGORY_META)

export const FREQUENCIES = [
  { key: 'daily', label: 'Daily' },
  { key: '3x_week', label: '3x per week', perWeek: 3 },
  { key: '4_5x_week', label: '4–5x per week', perWeek: 4 },
  { key: 'training_days', label: 'On training days' },
  { key: 'custom', label: 'Custom' },
]

export const COLOR_SWATCHES = [
  '#2E7D32', // ss-green
  '#1B474D', // ss-teal
  '#964219', // ss-amber
  '#006494', // ss-editorial-blue
  '#8B5CF6', // purple
  '#F87171', // coral
  '#64748B', // slate
  '#FB7185', // rose
]

/* ------------------------- Storage helpers -------------------------- */
function uid() {
  try { if (crypto?.randomUUID) return crypto.randomUUID() } catch {}
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
function fireChange() {
  try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {}
}

export function readHabits() {
  if (typeof window === 'undefined') return []
  try { const raw = window.localStorage.getItem(LS_HABITS); const arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : [] } catch { return [] }
}
function writeHabits(list) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_HABITS, JSON.stringify(list)); fireChange() } catch {}
}

export function useHabits() {
  const [list, setList] = useState([])
  useEffect(() => {
    const load = () => setList(readHabits())
    load()
    window.addEventListener(CHANGE_EVENT, load)
    return () => window.removeEventListener(CHANGE_EVENT, load)
  }, [])
  return list
}

/* ------------------------- Habit CRUD ------------------------------- */
export function addHabit(input) {
  const habits = readHabits()
  const active = habits.filter((h) => h.isActive !== false)
  if (active.length >= MAX_HABITS) return { ok: false, error: 'max' }
  const rec = {
    id: uid(),
    name: (input.name || '').trim(),
    category: input.category || 'custom',
    frequency: input.frequency || 'daily',
    frequencyDetail: input.frequencyDetail || null,
    why: input.why || null,
    variantSource: input.variantSource || null,
    color: input.color || '#2E7D32',
    createdAt: new Date().toISOString(),
    isActive: true,
    checkIns: [],
    notes: {},
  }
  writeHabits([rec, ...habits])
  return { ok: true, habit: rec }
}
export function updateHabit(id, patch) {
  const list = readHabits().map((h) => (h.id === id ? { ...h, ...patch } : h))
  writeHabits(list)
}
export function archiveHabit(id) { updateHabit(id, { isActive: false }) }
export function restoreHabit(id) { updateHabit(id, { isActive: true }) }
export function deleteHabit(id) {
  writeHabits(readHabits().filter((h) => h.id !== id))
}

export function toggleCheckIn(id, dateKey) {
  const list = readHabits().map((h) => {
    if (h.id !== id) return h
    const set = new Set(h.checkIns || [])
    if (set.has(dateKey)) set.delete(dateKey); else set.add(dateKey)
    return { ...h, checkIns: [...set].sort() }
  })
  writeHabits(list)
}
export function setNote(id, dateKey, note) {
  const list = readHabits().map((h) => {
    if (h.id !== id) return h
    const notes = { ...(h.notes || {}) }
    if (note && note.trim()) notes[dateKey] = note.trim().slice(0, 120)
    else delete notes[dateKey]
    return { ...h, notes }
  })
  writeHabits(list)
}

/* ------------------------- Date helpers ----------------------------- */
export function dateKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export function daysDiff(a, b) {
  const A = new Date(a); A.setHours(0,0,0,0)
  const B = new Date(b); B.setHours(0,0,0,0)
  return Math.round((B - A) / 86400000)
}
export function isEditableDate(iso) {
  const diff = daysDiff(iso, dateKey())
  return diff >= 0 && diff <= EDIT_LOCK_DAYS
}
export function formatShortDate(iso) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  } catch { return iso }
}
export function formatLongDate(iso) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  } catch { return iso }
}

/* ------------------------- Streak / completion ---------------------- */
// Streak = number of consecutive days ending on `endKey` that were checked.
export function streakFor(habit, endKey = dateKey()) {
  if (!habit?.checkIns?.length) return 0
  const set = new Set(habit.checkIns)
  let n = 0
  let cursor = new Date(endKey + 'T12:00:00')
  // If today isn't checked, start from yesterday so a completed streak
  // still shows during the day before the user checks in.
  if (!set.has(dateKey(cursor))) cursor = addDays(cursor, -1)
  while (set.has(dateKey(cursor))) {
    n += 1
    cursor = addDays(cursor, -1)
  }
  return n
}
export function bestStreak(habit) {
  const dates = (habit.checkIns || []).slice().sort()
  if (!dates.length) return 0
  let best = 1, cur = 1
  for (let i = 1; i < dates.length; i++) {
    if (daysDiff(dates[i - 1], dates[i]) === 1) { cur += 1; if (cur > best) best = cur }
    else { cur = 1 }
  }
  return best
}
export function completionOverWindow(habit, days = 90) {
  const set = new Set(habit.checkIns || [])
  const end = dateKey()
  const start = dateKey(addDays(new Date(), -(days - 1)))
  const created = habit.createdAt ? dateKey(new Date(habit.createdAt)) : start
  const effStart = created > start ? created : start
  let completed = 0, target = 0
  const startDate = new Date(effStart + 'T12:00:00')
  const endDate = new Date(end + 'T12:00:00')
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    const key = dateKey(d)
    target += 1
    if (set.has(key)) completed += 1
  }
  const freqMult = habit.frequency === '3x_week' ? 3 / 7 : habit.frequency === '4_5x_week' ? 4 / 7 : 1
  const adjustedTarget = Math.max(1, Math.round(target * freqMult))
  const pct = Math.min(100, Math.round((completed / adjustedTarget) * 100))
  return { completed, target: adjustedTarget, percent: pct }
}

/* ------------------------- Suggestions from genome ------------------ */
const SUGGESTION_RULES = [
  { rsid: 'rs10830963', gts: ['GG'], gene: 'MTNR1B', name: 'Stop eating 2–3 hours before bed', category: 'nutrition', frequency: 'daily', why: 'Your MTNR1B GG variant means late eating impairs your overnight insulin secretion.' },
  { rsid: 'rs1801133', gts: ['TT','CT','TC'], gene: 'MTHFR', name: 'Take methylfolate and methylcobalamin', category: 'supplements', frequency: 'daily', why: 'Your MTHFR variant reduces folate conversion by ~50% — the active forms bypass this entirely.' },
  { rsid: 'rs12722', gts: ['TT','CT','TC'], gene: 'COL5A1', name: 'Take collagen + vitamin C before exercise', category: 'training', frequency: 'training_days', why: 'Your elevated connective-tissue injury risk has the strongest evidence base for pre-exercise collagen loading.' },
  { rsid: 'rs8192678', gts: ['CC','GG','GC','CG'], gene: 'PPARGC1A', name: 'Complete a Zone 2 cardio session', category: 'training', frequency: '4_5x_week', why: 'Your mitochondrial adaptation requires higher-frequency Zone 2 than average to achieve equivalent adaptation.' },
  { rsid: 'rs1360780', gts: ['CT','TC','TT','AA'], gene: 'FKBP5', name: 'Active wind-down before bed', category: 'wellness', frequency: 'daily', why: 'Your cortisol clears more slowly than average — a deliberate wind-down signal matters more for your genotype.' },
  { rsid: 'rs174547', gts: ['TT','CT','TC'], gene: 'FADS1', name: 'Take EPA/DHA fish oil', category: 'supplements', frequency: 'daily', why: 'Your omega-3 conversion from plant sources is impaired — direct EPA/DHA is the only reliable source for your genotype.' },
  { rsid: 'rs4253778', gts: ['GG','CC'], gene: 'PPARA', name: 'Morning movement in fasted state', category: 'training', frequency: 'daily', why: 'Your fat-oxidation response is enhanced during fasted exercise — this is a genuine metabolic advantage for your genotype.' },
  { rsid: 'rs12934922', gts: ['AA','TT'], gene: 'BCMO1', name: 'Eat preformed vitamin A (eggs or liver)', category: 'nutrition', frequency: 'daily', why: 'Your beta-carotene to retinol conversion is reduced by 57–69% — animal-source vitamin A bypasses this conversion entirely.' },
]
const GENERAL_SUGGESTION = { rsid: null, gene: null, name: 'Log today’s mood and energy', category: 'wellness', frequency: 'daily', why: 'Tracking how you feel over time reveals patterns that connect your habits to your actual wellbeing.' }

function normGT(gt) {
  if (!gt) return ''
  const s = String(gt).toUpperCase().replace(/[^A-Z]/g, '')
  return s.length === 2 ? [s[0], s[1]].sort().join('') : s
}
export function getHabitSuggestions() {
  const report = getGenomeResults()
  const out = []
  const cardByRsid = new Map()
  if (report) {
    for (const c of flattenReportCards(report)) {
      if (c?.rsid) cardByRsid.set(String(c.rsid).toLowerCase(), c)
    }
  }
  const isSirt = cardByRsid.get('rs7069102') || cardByRsid.get('rs2273773')
  const isFoxo = cardByRsid.get('rs2802292')
  for (const rule of SUGGESTION_RULES) {
    const c = cardByRsid.get(rule.rsid.toLowerCase())
    if (!c) continue
    const userGt = normGT(c.genotype)
    const wanted = rule.gts.map(normGT)
    if (!wanted.includes(userGt)) continue
    out.push({ ...rule })
  }
  if (isSirt && isFoxo) {
    out.push({ rsid: null, gene: 'SIRT1', name: 'Complete a 16+ hour fast', category: 'nutrition', frequency: '3x_week', why: 'Fasting is the most potent natural activator of your sirtuin and FOXO3 pathways.' })
  }
  out.push(GENERAL_SUGGESTION)
  return out
}

export function suggestionsShown() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(LS_SUGGESTIONS_SHOWN) === 'true' } catch { return false }
}
export function markSuggestionsShown() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_SUGGESTIONS_SHOWN, 'true'); fireChange() } catch {}
}

/* ------------------------- Insights --------------------------------- */
const STREAK_BENCHMARKS = [
  { days: 60, longerThan: 97 }, { days: 30, longerThan: 92 }, { days: 21, longerThan: 85 },
  { days: 14, longerThan: 75 }, { days: 7,  longerThan: 60 },
]
const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export function generateInsights(habits) {
  const active = habits.filter((h) => h.isActive !== false)
  const insights = []
  if (!active.length) return insights

  // 1. Best day of week (across all habits).
  const perDow = [0,0,0,0,0,0,0]
  let totalCheckIns = 0
  for (const h of active) {
    for (const iso of (h.checkIns || [])) {
      const d = new Date(iso + 'T12:00:00'); if (Number.isNaN(d)) continue
      perDow[d.getDay()] += 1; totalCheckIns += 1
    }
  }
  if (totalCheckIns >= 5) {
    let bestIdx = 0
    for (let i = 1; i < 7; i++) if (perDow[i] > perDow[bestIdx]) bestIdx = i
    const pct = Math.round((perDow[bestIdx] / totalCheckIns) * 100)
    if (pct >= 20) insights.push({
      id: 'best_dow', type: 'best_dow',
      text: `You are most consistent on ${DOW[bestIdx]} — ${pct}% of your check-ins happen on this day. Build your week around it.`,
    })
  }

  // 2. Struggling habit — lowest completion in last 30 days if < 50%.
  const with30 = active.map((h) => ({ h, r: completionOverWindow(h, 30) }))
  with30.sort((a, b) => a.r.percent - b.r.percent)
  const worst = with30[0]
  if (worst && worst.r.percent < 50 && worst.r.target > 3) {
    insights.push({
      id: 'struggling', type: 'struggling',
      text: `Your “${worst.h.name}” habit has the lowest completion rate at ${worst.r.percent}%. Consider reducing the frequency or adjusting when you do it.`,
    })
  }

  // 3. Streak celebration (>= 7).
  const streaks = active.map((h) => ({ h, s: streakFor(h) }))
  streaks.sort((a, b) => b.s - a.s)
  const top = streaks[0]
  if (top && top.s >= 7) {
    const bench = STREAK_BENCHMARKS.find((b) => top.s >= b.days) || STREAK_BENCHMARKS[STREAK_BENCHMARKS.length - 1]
    insights.push({
      id: 'streak', type: 'streak',
      text: `You have maintained “${top.h.name}” for ${top.s} days in a row — that is longer than ${bench.longerThan}% of habit streaks on the platform.`,
    })
  }

  // 4. Genome connection — skip if we don't have simple biomarker tracking data.
  // Kept as a hook for later; currently no-op if ss_biomarkers_last_logged not tracked.

  return insights.slice(0, 3)
}

/* ------------------------- Summary stats ---------------------------- */
export function summaryStats(habits) {
  const active = habits.filter((h) => h.isActive !== false)
  if (!active.length) return { mostConsistent: null, longestStreak: null, totalThisMonth: 0 }
  const rated = active.map((h) => ({ h, r: completionOverWindow(h, 90).percent }))
  rated.sort((a, b) => b.r - a.r)
  const streaks = active.map((h) => ({ h, s: streakFor(h) }))
  streaks.sort((a, b) => b.s - a.s)
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`
  let totalThisMonth = 0
  for (const h of active) for (const d of (h.checkIns || [])) if (d.startsWith(monthPrefix)) totalThisMonth += 1
  return {
    mostConsistent: rated[0] ? { habit: rated[0].h, percent: rated[0].r } : null,
    longestStreak:  streaks[0] ? { habit: streaks[0].h, days: streaks[0].s } : null,
    totalThisMonth,
  }
}

/* ------------------------- CSV export ------------------------------- */
export function downloadCsv(habits) {
  if (typeof window === 'undefined') return
  const rows = [['Habit Name','Category','Variant Source','Date','Completed','Note','Streak At Date']]
  for (const h of habits) {
    const dates = new Set(h.checkIns || [])
    // Sort all dates; if none, skip.
    const sorted = [...dates].sort()
    for (const d of sorted) {
      const streak = streakFor(h, d)
      const note = (h.notes && h.notes[d]) || ''
      rows.push([h.name, h.category || '', h.variantSource || '', d, 'yes', note, String(streak)])
    }
  }
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `selfscience-habits-${dateKey()}.csv`
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
