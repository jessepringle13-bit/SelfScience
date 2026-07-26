'use client'

// /app/lib/goals.js
// Goal Setting & Progress Tracking — client-only.
// All state in localStorage under `ss_goals` per privacy-first spec.
//
// Goal shape (spec Part 2):
// {
//   id, category, title, description, targetValue, targetUnit, targetDate,
//   currentValue, milestones[], variantSource, linkedHabits[], linkedBiomarkers[],
//   status ('active'|'completed'|'paused'|'abandoned'),
//   createdAt, completedAt, progressLog[], notes, isPublic
// }
// Milestone: { id, title, targetValue, isCompleted, completedAt }
// Progress entry: { id, value, note, loggedAt }

import { useEffect, useState, useCallback } from 'react'

export const LS_GOALS       = 'ss_goals'
export const CHANGE_EVENT   = 'selfscience:goals-changed'
export const MAX_ACTIVE     = 30
export const MAX_MILESTONES = 5

/* -------------------------- Categories ---------------------------- */

export const CATEGORIES = [
  {
    id: 'performance',
    name: 'Athletic Performance',
    icon: 'Zap',
    color: '#0284c7', // ss-blue equivalent
    softBg: 'bg-sky-500/10',
    accent: 'text-sky-700',
    borderColor: 'border-sky-500',
    chipBg: 'bg-sky-600',
    suggestions: [
      { text: 'Improve VO2 max by [X] points',           unit: 'points',   placeholder: '5' },
      { text: 'Complete a Zone 2 base phase of [X] weeks', unit: 'weeks',    placeholder: '8' },
      { text: 'Run [X] km without stopping',             unit: 'km',       placeholder: '10' },
      { text: 'Complete a Hyrox event',                  unit: null,       placeholder: '' },
      { text: 'Complete a half marathon',                unit: null,       placeholder: '' },
      { text: 'Increase weekly training volume to [X] hours', unit: 'hours', placeholder: '8' },
    ],
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    icon: 'Leaf',
    color: '#964219', // ss-amber
    softBg: 'bg-ss-amber/10',
    accent: 'text-ss-amber',
    borderColor: 'border-ss-amber',
    chipBg: 'bg-ss-amber',
    suggestions: [
      { text: 'Eat last meal by [time] for [X] consecutive days', unit: 'days',  placeholder: '30' },
      { text: 'Eliminate folic acid fortified foods for [X] weeks', unit: 'weeks', placeholder: '4' },
      { text: 'Eat preformed vitamin A [X] times per week',       unit: 'x/week', placeholder: '3' },
      { text: 'Maintain low glycemic eating for [X] days',        unit: 'days',   placeholder: '21' },
      { text: 'Complete a 48-hour fast',                          unit: null,    placeholder: '' },
      { text: 'Complete a 72-hour fast',                          unit: null,    placeholder: '' },
    ],
  },
  {
    id: 'supplements',
    name: 'Supplements',
    icon: 'FlaskConical',
    color: '#2E7D32', // ss-green
    softBg: 'bg-ss-green/10',
    accent: 'text-ss-green',
    borderColor: 'border-ss-green',
    chipBg: 'bg-ss-green',
    suggestions: [
      { text: 'Take methylfolate consistently for [X] days',       unit: 'days', placeholder: '60' },
      { text: 'Establish a complete daily supplement routine',     unit: null,  placeholder: '' },
      { text: 'Take collagen pre-workout for [X] consecutive days', unit: 'days', placeholder: '30' },
      { text: 'Reach [X] days of fish oil consistency',            unit: 'days', placeholder: '90' },
    ],
  },
  {
    id: 'biomarkers',
    name: 'Biomarkers',
    icon: 'TestTube2',
    color: '#1B474D', // ss-teal
    softBg: 'bg-ss-teal/10',
    accent: 'text-ss-teal',
    borderColor: 'border-ss-teal',
    chipBg: 'bg-ss-teal',
    suggestions: [
      { text: 'Reduce homocysteine to below [X] umol/L', unit: 'umol/L',    placeholder: '8' },
      { text: 'Bring HbA1c below [X]%',                  unit: '%',         placeholder: '5.5' },
      { text: 'Raise Vitamin D to [X] ng/mL',            unit: 'ng/mL',     placeholder: '50' },
      { text: 'Log all priority biomarkers within [X] days', unit: 'days',  placeholder: '30' },
    ],
  },
  {
    id: 'longevity',
    name: 'Longevity',
    icon: 'Heart',
    color: '#2E7D32', // ss-green (differentiated by icon)
    softBg: 'bg-emerald-500/10',
    accent: 'text-emerald-700',
    borderColor: 'border-emerald-500',
    chipBg: 'bg-emerald-600',
    suggestions: [
      { text: 'Complete [X] extended fasts this month',                unit: 'fasts', placeholder: '2' },
      { text: 'Maintain Zone 2 training for [X] consecutive weeks',    unit: 'weeks', placeholder: '12' },
      { text: 'Complete all longevity learning path steps',            unit: null,   placeholder: '' },
      { text: 'Establish a consistent sleep schedule for [X] days',    unit: 'days', placeholder: '30' },
    ],
  },
  {
    id: 'learning',
    name: 'Health Education',
    icon: 'BookOpen',
    color: '#1B474D', // ss-teal
    softBg: 'bg-cyan-500/10',
    accent: 'text-cyan-700',
    borderColor: 'border-cyan-500',
    chipBg: 'bg-cyan-600',
    suggestions: [
      { text: 'Complete all 10 pillar learning paths',   unit: 'pillars', placeholder: '10' },
      { text: 'Read [X] research papers this month',     unit: 'papers',  placeholder: '10' },
      { text: 'Save [X] items to Reading List',          unit: 'items',   placeholder: '15' },
      { text: 'Complete your Health Story quiz',         unit: null,      placeholder: '' },
      { text: 'Generate your Practitioner Report',       unit: null,      placeholder: '' },
    ],
  },
  {
    id: 'clinical',
    name: 'Clinical Actions',
    icon: 'Stethoscope',
    color: '#964219', // ss-amber
    softBg: 'bg-orange-500/10',
    accent: 'text-orange-700',
    borderColor: 'border-orange-500',
    chipBg: 'bg-orange-600',
    suggestions: [
      { text: 'Book a doctor appointment to discuss genome findings', unit: null, placeholder: '' },
      { text: 'Get homocysteine tested',                              unit: null, placeholder: '' },
      { text: 'Get HbA1c tested',                                     unit: null, placeholder: '' },
      { text: 'Share Practitioner Report with clinician',             unit: null, placeholder: '' },
      { text: 'Discuss SLCO1B1 variant with prescriber',              unit: null, placeholder: '' },
    ],
  },
  {
    id: 'habits',
    name: 'Daily Habits',
    icon: 'CheckCircle2',
    color: '#059669', // green variant
    softBg: 'bg-teal-500/10',
    accent: 'text-teal-700',
    borderColor: 'border-teal-500',
    chipBg: 'bg-teal-600',
    suggestions: [
      { text: 'Maintain [X] habits for [X] consecutive days',        unit: 'days',  placeholder: '30' },
      { text: 'Achieve 80% habit completion rate for [X] weeks',     unit: 'weeks', placeholder: '4' },
      { text: 'Build a [X]-day streak on any habit',                 unit: 'days',  placeholder: '30' },
      { text: 'Check in on all habits every day for [X] weeks',      unit: 'weeks', placeholder: '2' },
    ],
  },
]

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]
}

/* -------------------------- Storage helpers ----------------------- */

function uid() {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID() } catch {}
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
function now() { return new Date().toISOString() }
function fireChange() {
  try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {}
  // Also poke achievement engine so it re-evaluates.
  try { window.dispatchEvent(new CustomEvent('selfscience:goal-changed')) } catch {}
}

export function readGoals() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_GOALS)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function writeGoals(list) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_GOALS, JSON.stringify(list))
    fireChange()
  } catch {}
}

/* -------------------------- Hooks --------------------------------- */

export function useGoals() {
  const [list, setList] = useState([])
  useEffect(() => {
    const load = () => setList(readGoals())
    load()
    const onChange = () => load()
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', (e) => { if (e?.key === LS_GOALS) load() })
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return list
}

export function useActiveGoals() {
  return useGoals().filter((g) => g.status === 'active')
}

/* -------------------------- CRUD --------------------------------- */

export function createGoal(input) {
  const goals = readGoals()
  const activeCount = goals.filter((g) => g.status === 'active').length
  if (activeCount >= MAX_ACTIVE) return { ok: false, error: 'max_active' }

  const rec = {
    id: uid(),
    category: input.category || 'performance',
    title: (input.title || '').trim().slice(0, 100),
    description: input.description || null,
    targetValue: Number.isFinite(Number(input.targetValue)) ? Number(input.targetValue) : null,
    targetUnit: input.targetUnit || null,
    targetDate: input.targetDate || null,
    currentValue: null,
    milestones: (input.milestones || []).slice(0, MAX_MILESTONES).map((m) => ({
      id: uid(),
      title: (m.title || '').trim(),
      targetValue: Number.isFinite(Number(m.targetValue)) ? Number(m.targetValue) : null,
      isCompleted: false,
      completedAt: null,
    })).filter((m) => m.title),
    variantSource: input.variantSource || null,
    linkedHabits: Array.isArray(input.linkedHabits) ? input.linkedHabits : [],
    linkedBiomarkers: Array.isArray(input.linkedBiomarkers) ? input.linkedBiomarkers : [],
    status: 'active',
    createdAt: now(),
    completedAt: null,
    progressLog: [],
    notes: input.notes || null,
    isPublic: !!input.isPublic,
  }
  writeGoals([rec, ...goals])
  // Trigger achievement re-eval.
  try { const { checkAll } = require('@/lib/achievements'); checkAll?.() } catch {}
  return { ok: true, goal: rec }
}

export function updateGoal(id, patch) {
  const list = readGoals().map((g) => (g.id === id ? { ...g, ...patch } : g))
  writeGoals(list)
}

export function deleteGoal(id) {
  writeGoals(readGoals().filter((g) => g.id !== id))
}

export function setStatus(id, status) {
  const patch = { status }
  if (status === 'completed') patch.completedAt = now()
  updateGoal(id, patch)
  try { const { checkAll } = require('@/lib/achievements'); checkAll?.() } catch {}
}

export function logProgress(id, { value, note, milestoneIds }) {
  const list = readGoals()
  const idx = list.findIndex((g) => g.id === id)
  if (idx < 0) return { ok: false }
  const goal = { ...list[idx] }
  const entry = {
    id: uid(),
    value: Number.isFinite(Number(value)) ? Number(value) : null,
    note: (note || '').trim().slice(0, 240) || null,
    loggedAt: now(),
  }
  goal.progressLog = [entry, ...(goal.progressLog || [])]
  if (entry.value !== null) goal.currentValue = entry.value

  // Mark completed milestones by id.
  if (Array.isArray(milestoneIds) && milestoneIds.length) {
    goal.milestones = (goal.milestones || []).map((m) => (
      milestoneIds.includes(m.id) && !m.isCompleted ? { ...m, isCompleted: true, completedAt: now() } : m
    ))
  }

  // Auto-completion signal (numeric target).
  let hitTarget = false
  if (goal.targetValue != null && goal.currentValue != null && goal.currentValue >= goal.targetValue) {
    hitTarget = true
  }
  // Auto-completion signal (all milestones done, no numeric target).
  const milestonesAllDone = (goal.milestones || []).length > 0 && goal.milestones.every((m) => m.isCompleted)
  if (!hitTarget && milestonesAllDone && goal.targetValue == null) hitTarget = true

  list[idx] = goal
  writeGoals(list)
  return { ok: true, hitTarget, goal }
}

export function loggedTodayCount(goal) {
  if (!goal?.progressLog?.length) return 0
  const today = new Date().toISOString().slice(0, 10)
  return goal.progressLog.filter((e) => (e.loggedAt || '').slice(0, 10) === today).length
}

/* -------------------------- Derived helpers ----------------------- */

export function progressPercent(goal) {
  if (!goal) return 0
  if (goal.status === 'completed') return 100
  if (goal.targetValue != null && goal.currentValue != null) {
    return Math.max(0, Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)))
  }
  const ms = goal.milestones || []
  if (ms.length) {
    const done = ms.filter((m) => m.isCompleted).length
    return Math.round((done / ms.length) * 100)
  }
  return 0
}

export function daysUntil(iso) {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return Math.ceil((t - Date.now()) / 86400000)
}

export function daysActive(goal) {
  if (!goal?.createdAt) return 0
  return Math.floor((Date.now() - Date.parse(goal.createdAt)) / 86400000)
}

export function consecutiveLogStreak(goal) {
  if (!goal?.progressLog?.length) return 0
  const days = new Set((goal.progressLog || []).map((e) => (e.loggedAt || '').slice(0, 10)))
  let streak = 0
  const cursor = new Date()
  // If today isn't logged, allow yesterday to start the streak count.
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function onTrack(goal) {
  if (!goal || goal.status !== 'active') return false
  // On track = progress logged in last 7 days OR no target date.
  if (!goal.targetDate) return true
  if (!goal.progressLog?.length) return false
  const last = Date.parse(goal.progressLog[0].loggedAt)
  const days = (Date.now() - last) / 86400000
  return days <= 7
}

/* -------------------------- Insights ----------------------------- */

export function generateInsights(goals) {
  const insights = []
  const active = goals.filter((g) => g.status === 'active')

  // Insight 1: Most consistent category (30-day window, 2+ goals with progress).
  const goalsWithProgress = goals.filter((g) => (g.progressLog || []).length > 0)
  if (goalsWithProgress.length >= 2) {
    const cutoff = Date.now() - 30 * 86400000
    const counts = {}
    for (const g of goals) {
      const recentLogs = (g.progressLog || []).filter((e) => Date.parse(e.loggedAt) >= cutoff).length
      if (recentLogs > 0) counts[g.category] = (counts[g.category] || 0) + recentLogs
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (top && top[1] > 0) {
      const cat = getCategory(top[0])
      insights.push({
        id: 'consistent_category', type: 'consistent',
        text: `Your ${cat.name} goals have the highest progress rate — you have logged progress ${top[1]} time${top[1] === 1 ? '' : 's'} in the last 30 days in this area.`,
      })
    }
  }

  // Insight 2: Longest streak goal (>=5 consecutive days).
  const streaks = active.map((g) => ({ g, s: consecutiveLogStreak(g) }))
  streaks.sort((a, b) => b.s - a.s)
  if (streaks[0] && streaks[0].s >= 5) {
    insights.push({
      id: 'streak', type: 'streak',
      text: `Your “${streaks[0].g.title}” goal has the longest active streak at ${streaks[0].s} consecutive days of progress logged.`,
    })
  }

  // Insight 3: Genome alignment (goal with high-confidence variant).
  const genomeAligned = active.find((g) => g.variantSource)
  if (genomeAligned) {
    insights.push({
      id: 'genome_align', type: 'genome',
      text: `Your “${genomeAligned.title}” goal aligns directly with your ${genomeAligned.variantSource} finding — one of the highest-confidence actions for your specific genome.`,
    })
  }

  // Insight 4: At-risk goal (7+ days no log + deadline within 30 days).
  const atRisk = active.find((g) => {
    if (!g.targetDate) return false
    const dToTarget = daysUntil(g.targetDate)
    if (dToTarget == null || dToTarget < 0 || dToTarget > 30) return false
    if (!g.progressLog?.length) return true
    const last = Date.parse(g.progressLog[0].loggedAt)
    const daysSince = (Date.now() - last) / 86400000
    return daysSince >= 7
  })
  if (atRisk) {
    const noLog = !atRisk.progressLog?.length
    const daysSince = noLog ? Math.floor((Date.now() - Date.parse(atRisk.createdAt)) / 86400000)
      : Math.floor((Date.now() - Date.parse(atRisk.progressLog[0].loggedAt)) / 86400000)
    const daysToDeadline = daysUntil(atRisk.targetDate) || 0
    insights.push({
      id: 'at_risk_' + atRisk.id, type: 'at_risk',
      text: `Your “${atRisk.title}” goal has not had progress logged in ${daysSince} days and has a deadline in ${daysToDeadline} days. It may need attention.`,
    })
  }

  return insights.slice(0, 4)
}

/* -------------------------- CSV / PDF exports -------------------- */

export function downloadCsv(goals) {
  if (typeof window === 'undefined' || !goals?.length) return
  const rows = [
    ['Goal Title', 'Category', 'Status', 'Target Value', 'Current Value', 'Unit', 'Target Date', 'Created Date', 'Completed Date', 'Variant Source', 'Progress Entries Count', 'Notes'],
    ...goals.map((g) => [
      g.title,
      getCategory(g.category).name,
      g.status,
      g.targetValue ?? '',
      g.currentValue ?? '',
      g.targetUnit || '',
      g.targetDate ? new Date(g.targetDate).toISOString().slice(0, 10) : '',
      new Date(g.createdAt).toISOString().slice(0, 10),
      g.completedAt ? new Date(g.completedAt).toISOString().slice(0, 10) : '',
      g.variantSource || '',
      (g.progressLog || []).length,
      (g.notes || '').replace(/\r?\n/g, ' '),
    ]),
  ]
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `selfscience-goals-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function openPrintablePdf(goals) {
  if (typeof window === 'undefined') return
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
  const rows = (goals || []).map((g) => {
    const cat = getCategory(g.category)
    const statusColor = g.status === 'completed' ? '#2E7D32' : g.status === 'paused' ? '#964219' : g.status === 'abandoned' ? '#7A7974' : '#1B474D'
    const pct = progressPercent(g)
    return `
      <div class="goal">
        <div class="row">
          <span class="cat" style="background:${cat.color};color:white">${esc(cat.name)}</span>
          <span class="status" style="color:${statusColor}">${esc(g.status.toUpperCase())}</span>
          ${g.variantSource ? `<span class="variant">${esc(g.variantSource)}</span>` : ''}
        </div>
        <h2>${esc(g.title)}</h2>
        ${g.description ? `<p class="desc">${esc(g.description)}</p>` : ''}
        <div class="progress">
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
          <div class="meta">
            ${g.targetValue != null ? `${g.currentValue || 0} / ${g.targetValue} ${esc(g.targetUnit || '')}` : `${pct}% complete`}
            · ${(g.progressLog || []).length} log ${(g.progressLog || []).length === 1 ? 'entry' : 'entries'}
            ${g.targetDate ? `· Due ${new Date(g.targetDate).toLocaleDateString()}` : ''}
          </div>
        </div>
        ${(g.milestones || []).length ? `<ul class="ms">${g.milestones.map((m) => `<li>${m.isCompleted ? '☑' : '☐'} ${esc(m.title)}</li>`).join('')}</ul>` : ''}
        ${g.notes ? `<p class="notes">Note: ${esc(g.notes)}</p>` : ''}
      </div>
    `
  }).join('')
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>SelfScience Goals — ${new Date().toISOString().slice(0, 10)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #28251D; margin: 32px; }
  h1 { color: #1B474D; margin: 0 0 4px; }
  .sub { color: #7A7974; font-size: 12px; margin-bottom: 24px; border-bottom: 1px solid #D4D1CA; padding-bottom: 16px; }
  .stat { display: inline-block; margin-right: 20px; font-size: 12px; }
  .stat b { color: #1B474D; }
  .goal { break-inside: avoid; page-break-inside: avoid; padding: 14px 0; border-bottom: 1px solid #EEE8DA; }
  .row { display: flex; align-items: center; gap: 10px; font-size: 10px; margin-bottom: 6px; }
  .cat { padding: 2px 8px; border-radius: 8px; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; }
  .status { font-weight: 700; letter-spacing: 0.12em; }
  .variant { padding: 2px 6px; background: #EAF5F5; border-radius: 6px; font-family: monospace; color: #1B474D; }
  h2 { color: #1B474D; margin: 4px 0 4px; font-size: 16px; }
  .desc { font-size: 12px; color: #7A7974; margin: 4px 0; }
  .progress { margin: 6px 0; }
  .bar { height: 6px; background: #EEE8DA; border-radius: 999px; overflow: hidden; }
  .fill { height: 100%; background: #2E7D32; }
  .meta { font-family: monospace; font-size: 10px; color: #7A7974; margin-top: 4px; }
  .ms { font-size: 12px; color: #28251D; padding-left: 0; list-style: none; }
  .ms li { padding: 2px 0; }
  .notes { font-size: 11px; color: #7A7974; font-style: italic; margin-top: 6px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #D4D1CA; font-size: 10px; color: #7A7974; }
  @media print { body { margin: 20mm; } .noprint { display:none; } }
</style></head>
<body>
  <h1>SelfScience Goals</h1>
  <div class="sub">
    <div class="stat">Total goals: <b>${(goals || []).length}</b></div>
    <div class="stat">Active: <b>${(goals || []).filter((g) => g.status === 'active').length}</b></div>
    <div class="stat">Completed: <b>${(goals || []).filter((g) => g.status === 'completed').length}</b></div>
    <div class="stat">Exported: <b>${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</b></div>
  </div>
  ${rows || '<p style="color:#7A7974">No goals to export.</p>'}
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
  setTimeout(() => { try { w.focus(); w.print() } catch {} }, 400)
}
