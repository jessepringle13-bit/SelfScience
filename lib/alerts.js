'use client'

// /app/lib/alerts.js
// Genome Alert System — client-only.
//
// All state lives in localStorage under the `ss_` namespace. Zero
// server calls. Runs as a non-blocking check on page load and
// piggybacks on caches populated by other features (weekly digest,
// habits, reading list, journal, community).
//
// Alert shape:
//   {
//     id, type, title, body, variantSource, pillar,
//     actionLabel, actionUrl, createdAt, expiresAt,
//     isRead, isDismissed, pinned
//   }
//
// type ∈ 'research' | 'habit' | 'trial' | 'community' | 'reminder' | 'update'

import { useEffect, useState, useCallback } from 'react'
import { readDigestCache } from '@/lib/weeklyDigest'
import { readHabits, getHabitSuggestions, streakFor, dateKey } from '@/lib/habits'
import { readJournal } from '@/lib/journal'
import { readList as readReadingList } from '@/lib/readingList'
import { getGenomeResults, hasGenomeResults } from '@/lib/genomeSession'

export const LS_ALERTS               = 'ss_alerts'
export const LS_PREFS                = 'ss_alert_prefs'
export const LS_LAST_CHECK           = 'ss_alerts_last_check_at'
export const LS_SEEN_UPDATES         = 'ss_alerts_seen_updates'
export const LS_SEEN_RESEARCH        = 'ss_alerts_seen_research_ids'
export const LS_SEEN_TRIALS          = 'ss_alerts_seen_trial_ids'
export const LS_SEEN_HABITS          = 'ss_alerts_seen_habit_keys'
export const LS_SEEN_COMMUNITY       = 'ss_alerts_seen_community_keys'
export const LS_SEEN_REMINDERS       = 'ss_alerts_seen_reminder_keys'

export const CHANGE_EVENT   = 'selfscience:alerts-changed'
export const MAX_ALERTS     = 50
export const MAX_PINNED     = 5
export const CHECK_INTERVAL_MS = 60 * 60 * 1000 // don't re-run heavy checks more than once an hour

/* --------------------------- Type metadata ----------------------------- */

export const TYPE_META = {
  research: {
    label: 'New research',
    // Uses ss-teal (blue-ish) — matches finding-related surfaces.
    accent: 'text-ss-teal',
    dot:    'bg-ss-teal',
    softBg: 'bg-ss-teal/10',
    hex:    '#1B474D',
    ttlDays: 30,
  },
  habit: {
    label: 'Habit suggestion',
    accent: 'text-ss-green',
    dot:    'bg-ss-green',
    softBg: 'bg-ss-green/10',
    hex:    '#2E7D32',
    ttlDays: 30,
  },
  trial: {
    label: 'Trial match',
    accent: 'text-ss-orange',
    dot:    'bg-ss-orange',
    softBg: 'bg-ss-orange/10',
    hex:    '#C45820',
    ttlDays: 30,
  },
  community: {
    label: 'Community insight',
    accent: 'text-purple-600',
    dot:    'bg-purple-500',
    softBg: 'bg-purple-500/10',
    hex:    '#8B5CF6',
    ttlDays: 30,
  },
  reminder: {
    label: 'Reminder',
    accent: 'text-ss-amber',
    dot:    'bg-ss-amber',
    softBg: 'bg-ss-amber/10',
    hex:    '#964219',
    ttlDays: 14,
  },
  update: {
    label: 'Platform update',
    accent: 'text-ss-editorial-blue',
    dot:    'bg-[#006494]',
    softBg: 'bg-[#006494]/10',
    hex:    '#006494',
    ttlDays: 30,
  },
}
export const TYPES = Object.keys(TYPE_META)

/* ------------------------ Prefs ---------------------------------------- */

const DEFAULT_PREFS = {
  master:    true,
  research:  true,
  habit:     true,
  trial:     true,
  community: true,
  reminder:  true,
  update:    true,
}

export function readPrefs() {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS }
  try {
    const raw = window.localStorage.getItem(LS_PREFS)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_PREFS, ...(parsed || {}) }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(next) {
  if (typeof window === 'undefined') return
  try {
    const merged = { ...readPrefs(), ...(next || {}) }
    window.localStorage.setItem(LS_PREFS, JSON.stringify(merged))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  } catch {}
}

export function usePrefs() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  useEffect(() => {
    const load = () => setPrefs(readPrefs())
    load()
    const onChange = () => load()
    const onStorage = (e) => { if (e?.key === LS_PREFS) load() }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  const update = useCallback((patch) => savePrefs(patch), [])
  return [prefs, update]
}

/* ------------------------ Storage core --------------------------------- */

function uid() {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID() } catch {}
  return `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
function now() { return new Date().toISOString() }
function msFromDays(n) { return n * 24 * 60 * 60 * 1000 }

function fireChange() {
  try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {}
}

export function readAlerts() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_ALERTS)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function writeAlerts(list) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_ALERTS, JSON.stringify(list))
    fireChange()
  } catch {}
}

/**
 * Housekeeping: drop expired (unless pinned) and clamp to MAX_ALERTS.
 * Pinned alerts are never dropped by the cap either.
 */
function cleanAndCap(list) {
  const t = Date.now()
  const survivors = (list || []).filter((a) => {
    if (!a) return false
    if (a.pinned) return true
    if (a.isDismissed) return false
    if (a.expiresAt && Date.parse(a.expiresAt) < t) return false
    return true
  })
  // Sort: pinned first (newest first), then non-pinned newest first.
  survivors.sort(sortAlerts)
  // Cap: keep all pinned + top N unpinned to fit MAX_ALERTS overall.
  const pinned = survivors.filter((a) => a.pinned)
  const rest = survivors.filter((a) => !a.pinned)
  const overflow = Math.max(0, (pinned.length + rest.length) - MAX_ALERTS)
  const trimmedRest = overflow ? rest.slice(0, rest.length - overflow) : rest
  return [...pinned, ...trimmedRest]
}

export function sortAlerts(a, b) {
  // Pinned first, newest first within each group.
  if (!!b.pinned - !!a.pinned) return (!!b.pinned) - (!!a.pinned)
  return (b.createdAt || '').localeCompare(a.createdAt || '')
}

/**
 * Add an alert. Dedupes by id. If an alert with the same id already
 * exists, we don't clobber user-side flags (isRead / pinned) — we
 * only refresh title/body/action/expiry.
 */
export function addAlert(alert) {
  if (!alert || !alert.type || !TYPE_META[alert.type]) return null
  const ttlDays = TYPE_META[alert.type].ttlDays
  const created = alert.createdAt || now()
  const expiresAt = alert.expiresAt || new Date(Date.parse(created) + msFromDays(ttlDays)).toISOString()
  const rec = {
    id: alert.id || uid(),
    type: alert.type,
    title: (alert.title || '').trim(),
    body: (alert.body || '').trim(),
    variantSource: alert.variantSource || null,
    pillar: alert.pillar || null,
    actionLabel: alert.actionLabel || null,
    actionUrl: alert.actionUrl || null,
    createdAt: created,
    expiresAt,
    isRead: false,
    isDismissed: false,
    pinned: false,
  }
  const list = readAlerts()
  const existingIdx = list.findIndex((x) => x.id === rec.id)
  let next
  if (existingIdx >= 0) {
    const prev = list[existingIdx]
    next = list.slice()
    next[existingIdx] = {
      ...prev,
      title: rec.title,
      body: rec.body,
      actionLabel: rec.actionLabel,
      actionUrl: rec.actionUrl,
      variantSource: rec.variantSource || prev.variantSource,
      pillar: rec.pillar || prev.pillar,
      expiresAt: rec.expiresAt,
    }
  } else {
    next = [rec, ...list]
  }
  writeAlerts(cleanAndCap(next))
  return rec
}

export function markRead(id) {
  const list = readAlerts().map((a) => (a.id === id ? { ...a, isRead: true } : a))
  writeAlerts(cleanAndCap(list))
}
export function markAllRead() {
  const list = readAlerts().map((a) => ({ ...a, isRead: true }))
  writeAlerts(cleanAndCap(list))
}
export function dismissAlert(id) {
  const list = readAlerts().filter((a) => a.id !== id)
  writeAlerts(cleanAndCap(list))
}
export function clearAllAlerts() {
  // Keeps pinned alerts (user pinned them = they want them).
  const list = readAlerts().filter((a) => a.pinned)
  writeAlerts(cleanAndCap(list))
}
export function pinAlert(id) {
  const list = readAlerts()
  const pinnedCount = list.filter((a) => a.pinned).length
  const target = list.find((a) => a.id === id)
  if (!target) return { ok: false, reason: 'not_found' }
  if (target.pinned) return { ok: true, alreadyPinned: true }
  if (pinnedCount >= MAX_PINNED) return { ok: false, reason: 'max_pinned' }
  const next = list.map((a) => (a.id === id ? { ...a, pinned: true, isRead: true } : a))
  writeAlerts(cleanAndCap(next))
  return { ok: true }
}
export function unpinAlert(id) {
  const list = readAlerts().map((a) => (a.id === id ? { ...a, pinned: false } : a))
  writeAlerts(cleanAndCap(list))
}

/* ------------------------ Hooks ---------------------------------------- */

export function useAlerts() {
  const [list, setList] = useState([])
  useEffect(() => {
    const load = () => setList(readAlerts())
    load()
    const onChange = () => load()
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', (e) => { if (e?.key === LS_ALERTS) load() })
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return list
}

export function useUnreadCount() {
  const list = useAlerts()
  return list.filter((a) => !a.isRead).length
}

/* ------------------------ Seen sets ------------------------------------ */

function readSeenSet(key) {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch { return new Set() }
}
function writeSeenSet(key, set, cap = 200) {
  if (typeof window === 'undefined') return
  try {
    const arr = [...set].slice(-cap)
    window.localStorage.setItem(key, JSON.stringify(arr))
  } catch {}
}

/* ------------------------ Genome variant helpers ----------------------- */

function userGeneSymbols() {
  const report = getGenomeResults()
  if (!report) return { symbols: new Set(), rsids: new Set() }
  const symbols = new Set()
  const rsids = new Set()
  const push = (c) => {
    const g = (c?.gene || '').split(/[\s(/·+,]/)[0]?.toUpperCase()
    if (g && !/^RS\d/i.test(g) && g.length <= 12) symbols.add(g)
    const r = String(c?.rsid || '').toLowerCase()
    if (r) rsids.add(r)
  }
  for (const c of report.variants_recognized || []) push(c)
  for (const grp of report.fullReport || []) for (const v of grp?.variants || []) push(v)
  for (const c of report?.overview?.areasToExplore || []) push(c)
  for (const c of report?.overview?.strengths || []) push(c)
  return { symbols, rsids }
}

/* ------------------------ Platform updates ----------------------------- */

// Hardcoded platform updates. Add a new entry to fire an update alert
// once for every existing user. Keep versions ISO-ordered so sorting
// is trivial. Increment carefully — this fires exactly once per user.
export const PLATFORM_UPDATES = [
  {
    key: 'alerts_v1_launch',
    title: 'Genome Alerts is live',
    body:  'Get notified when new research, trials, habits, or community insights match your genome. Manage what you want to hear about in the gear menu → Alerts.',
    actionLabel: 'Open settings',
    actionUrl: '#alert-prefs',
    releasedAt: '2025-06-15',
  },
  {
    key: 'blueprint_v1_launch',
    title: 'Your Health Blueprint is here',
    body:  'A single-page synthesis of your genome, protocol, nutrition, and next steps — everything in one shareable summary.',
    actionLabel: 'Open Blueprint',
    actionUrl: '/blueprint',
    releasedAt: '2025-05-01',
  },
  {
    key: 'tracker_v1_launch',
    title: 'Habit & Lifestyle Tracker',
    body:  'Track genome-informed habits with 90-day heatmaps, streaks, and insights — all on-device.',
    actionLabel: 'Open Tracker',
    actionUrl: '/tracker',
    releasedAt: '2025-05-10',
  },
  {
    key: 'population_compare_v1',
    title: 'Population Compare',
    body:  'See how your variants compare against gnomAD frequencies across ancestries and populations.',
    actionLabel: 'Compare',
    actionUrl: '/population-compare',
    releasedAt: '2025-05-20',
  },
]

function checkPlatformUpdates() {
  const seen = readSeenSet(LS_SEEN_UPDATES)
  let added = 0
  for (const u of PLATFORM_UPDATES) {
    if (seen.has(u.key)) continue
    seen.add(u.key)
    addAlert({
      id: `update:${u.key}`,
      type: 'update',
      title: u.title,
      body:  u.body,
      actionLabel: u.actionLabel,
      actionUrl: u.actionUrl,
      // Update alerts get a stable created date from releasedAt so they
      // don't jump to the top forever — but for very first render we
      // use "now" so they appear as unread new.
      createdAt: now(),
    })
    added += 1
  }
  if (added) writeSeenSet(LS_SEEN_UPDATES, seen)
  return added
}

/* ------------------------ Research alerts ------------------------------ */

function checkResearchAlerts() {
  // Cached-only. Use the weekly digest cache the dashboard already populates.
  const cache = readDigestCache()
  if (!cache || !Array.isArray(cache.variants)) return 0
  const seen = readSeenSet(LS_SEEN_RESEARCH)
  let added = 0
  for (const v of cache.variants) {
    const study = v?.research || v?.study
    if (!study) continue
    const pmid = study.pmid || study.id || study.url || `${v.rsid}:${study.title}`
    const key = `research:${pmid}`
    if (seen.has(key)) continue
    seen.add(key)
    const geneLabel = v.gene || v.rsid || 'your variant'
    addAlert({
      id: `research:${pmid}`,
      type: 'research',
      title: `New research on ${geneLabel}`,
      body: study.title || 'A study relevant to your variant was published this week.',
      variantSource: v.rsid || v.gene || null,
      pillar: v.pillar || null,
      actionLabel: 'Open study',
      actionUrl: study.url || `/search?q=${encodeURIComponent(v.gene || v.rsid || '')}`,
    })
    added += 1
    if (added >= 3) break // never spam more than 3 research alerts per check
  }
  if (added) writeSeenSet(LS_SEEN_RESEARCH, seen)
  return added
}

/* ------------------------ Trial alerts --------------------------------- */

function checkTrialAlerts() {
  const cache = readDigestCache()
  if (!cache || !Array.isArray(cache.variants)) return 0
  const seen = readSeenSet(LS_SEEN_TRIALS)
  let added = 0
  for (const v of cache.variants) {
    const trials = Array.isArray(v?.trials) ? v.trials : []
    for (const t of trials) {
      const nct = t.nctId || t.id || t.url
      if (!nct) continue
      const key = `trial:${nct}`
      if (seen.has(key)) continue
      seen.add(key)
      addAlert({
        id: `trial:${nct}`,
        type: 'trial',
        title: `Trial match: ${v.gene || v.rsid}`,
        body: t.title || 'A recruiting clinical trial matches one of your variants.',
        variantSource: v.rsid || v.gene || null,
        pillar: v.pillar || null,
        actionLabel: t.location ? `View · ${t.location}` : 'View trial',
        actionUrl: t.url || `https://clinicaltrials.gov/search?term=${encodeURIComponent(v.gene || v.rsid || '')}`,
      })
      added += 1
      if (added >= 2) break
    }
    if (added >= 2) break
  }
  if (added) writeSeenSet(LS_SEEN_TRIALS, seen)
  return added
}

/* ------------------------ Habit alerts --------------------------------- */

function checkHabitAlerts() {
  if (!hasGenomeResults()) return 0
  const seen = readSeenSet(LS_SEEN_HABITS)
  const habits = readHabits()
  const activeNames = new Set(habits.filter((h) => h.isActive !== false).map((h) => (h.name || '').toLowerCase()))
  const suggestions = getHabitSuggestions() || []
  let added = 0
  for (const s of suggestions) {
    if (!s?.rsid && !s?.gene) continue // skip general fallback
    const key = `habit:${s.rsid || s.gene}:${s.name}`
    if (seen.has(key)) continue
    if (activeNames.has((s.name || '').toLowerCase())) { seen.add(key); continue }
    seen.add(key)
    addAlert({
      id: `habit:${s.rsid || s.gene}:${(s.name || '').slice(0, 40)}`,
      type: 'habit',
      title: `New habit for your ${s.gene || 'variant'}`,
      body: `${s.name} — ${s.why || 'Backed by your genotype.'}`,
      variantSource: s.rsid || s.gene || null,
      pillar: null,
      actionLabel: 'Add to Tracker',
      actionUrl: '/tracker?suggestions=1',
    })
    added += 1
    if (added >= 2) break
  }
  if (added) writeSeenSet(LS_SEEN_HABITS, seen)
  return added
}

/* ------------------------ Community alerts ----------------------------- */

// Anonymised: we can't peek at Supabase per-user, so we fire once per
// (variant × week) — a lightweight nudge to check the community for
// insights on their variants. Backed by rsid presence in the report.
function checkCommunityAlerts() {
  if (!hasGenomeResults()) return 0
  const { symbols } = userGeneSymbols()
  if (!symbols.size) return 0
  const seen = readSeenSet(LS_SEEN_COMMUNITY)
  const isoWeek = weekKey()
  const top = [...symbols].sort().slice(0, 1)
  let added = 0
  for (const g of top) {
    const key = `community:${g}:${isoWeek}`
    if (seen.has(key)) continue
    seen.add(key)
    addAlert({
      id: `community:${g}:${isoWeek}`,
      type: 'community',
      title: `Community insights for ${g}`,
      body: `See what other ${g} carriers are reporting this week — what worked, what didn't, and the questions they're asking.`,
      variantSource: g,
      actionLabel: 'Open Community',
      actionUrl: `/community?gene=${encodeURIComponent(g)}`,
    })
    added += 1
  }
  if (added) writeSeenSet(LS_SEEN_COMMUNITY, seen)
  return added
}

function weekKey() {
  const d = new Date()
  // ISO year-week (Monday-based)
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/* ------------------------ Reminder alerts ------------------------------ */

function checkReminderAlerts() {
  const seen = readSeenSet(LS_SEEN_REMINDERS)
  const wk = weekKey()
  let added = 0

  // 1. Habit streak at risk — most-consistent habit hasn't been checked today.
  const habits = readHabits().filter((h) => h.isActive !== false)
  const today = dateKey()
  for (const h of habits) {
    const s = streakFor(h)
    if (s < 3) continue
    const checkedToday = (h.checkIns || []).includes(today)
    if (checkedToday) continue
    const key = `reminder:habit_streak:${h.id}:${today}`
    if (seen.has(key)) continue
    seen.add(key)
    addAlert({
      id: key,
      type: 'reminder',
      title: `Keep your ${s}-day streak alive`,
      body: `You haven't checked "${h.name}" today. Two quick taps keeps the momentum.`,
      actionLabel: 'Open Tracker',
      actionUrl: '/tracker',
    })
    added += 1
    if (added >= 1) break // one streak nudge per session is enough
  }

  // 2. Journal gap — last entry was >14 days ago.
  const journal = readJournal()
  if (journal.length) {
    const lastISO = journal[0]?.createdAt
    if (lastISO) {
      const days = Math.floor((Date.now() - Date.parse(lastISO)) / 86400000)
      if (days >= 14) {
        const key = `reminder:journal_gap:${wk}`
        if (!seen.has(key)) {
          seen.add(key)
          addAlert({
            id: key,
            type: 'reminder',
            title: `${days} days since your last journal entry`,
            body: 'A short reflection now takes 30 seconds and gives you something to look back on when you review patterns.',
            actionLabel: 'Open Journal',
            actionUrl: '/journal',
          })
          added += 1
        }
      }
    }
  }

  // 3. Reading list has 5+ unread items.
  const rl = readReadingList()
  if (rl.length >= 5) {
    const unread = rl.filter((x) => !x.readAt)
    if (unread.length >= 5) {
      const key = `reminder:reading_backlog:${wk}`
      if (!seen.has(key)) {
        seen.add(key)
        addAlert({
          id: key,
          type: 'reminder',
          title: `You have ${unread.length} saved studies to read`,
          body: 'Quick scans of 2–3 at a time are the sweet spot for building your understanding without burning out.',
          actionLabel: 'Open Reading List',
          actionUrl: '/reading-list',
        })
        added += 1
      }
    }
  }

  if (added) writeSeenSet(LS_SEEN_REMINDERS, seen)
  return added
}

/* ------------------------ Master check --------------------------------- */

/**
 * Non-blocking, idempotent. Safe to call on every page load — it will
 * skip heavy work if it ran recently (unless force = true). Runs in
 * a microtask so it never blocks first paint.
 */
export function runAlertChecks({ force = false } = {}) {
  if (typeof window === 'undefined') return Promise.resolve({ added: 0 })
  const prefs = readPrefs()
  if (!prefs.master) return Promise.resolve({ added: 0, skipped: 'master_off' })

  const last = Number(window.localStorage.getItem(LS_LAST_CHECK) || 0)
  if (!force && last && (Date.now() - last) < CHECK_INTERVAL_MS) {
    return Promise.resolve({ added: 0, skipped: 'debounced' })
  }

  return new Promise((resolve) => {
    // Kick off in a microtask so it never blocks first paint.
    const run = () => {
      let added = 0
      try {
        if (prefs.update)    added += checkPlatformUpdates()
      } catch (e) { console.warn('[alerts] update check failed', e) }
      try {
        if (prefs.research)  added += checkResearchAlerts()
      } catch (e) { console.warn('[alerts] research check failed', e) }
      try {
        if (prefs.trial)     added += checkTrialAlerts()
      } catch (e) { console.warn('[alerts] trial check failed', e) }
      try {
        if (prefs.habit)     added += checkHabitAlerts()
      } catch (e) { console.warn('[alerts] habit check failed', e) }
      try {
        if (prefs.community) added += checkCommunityAlerts()
      } catch (e) { console.warn('[alerts] community check failed', e) }
      try {
        if (prefs.reminder)  added += checkReminderAlerts()
      } catch (e) { console.warn('[alerts] reminder check failed', e) }

      try { window.localStorage.setItem(LS_LAST_CHECK, String(Date.now())) } catch {}
      // Final housekeeping pass.
      writeAlerts(cleanAndCap(readAlerts()))
      resolve({ added })
    }
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 1500 })
    } else {
      setTimeout(run, 250)
    }
  })
}

/* ------------------------ Utilities ------------------------------------ */

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
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch { return '' }
}

export function pinnedCount() {
  return readAlerts().filter((a) => a.pinned).length
}
