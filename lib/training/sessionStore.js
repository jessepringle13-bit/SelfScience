// /app/lib/training/sessionStore.js
// localStorage-backed store for completed workout sessions + realtime
// session progress. Session data never leaves the browser — respects the
// SelfScience privacy contract.
//
// Storage shape:
//   ss_training_sessions_v1 -> [
//     { id, dateISO, dayType, label, durationSec, avgRpe,
//       exercises: [{ id, name, sets: [{ done, rpe? }] }] },
//     ...
//   ]
//   ss_training_active_session_v1 -> current in-flight session (auto-saved)

const SESSIONS_KEY = 'ss_training_sessions_v1'
const ACTIVE_KEY = 'ss_training_active_session_v1'

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

// ------- Completed sessions --------------------------------------------------

export function getAllSessions() {
  if (!hasWindow()) return []
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function saveCompletedSession(session) {
  if (!hasWindow() || !session) return null
  try {
    const all = getAllSessions()
    const record = {
      id: session.id || `sess-${Date.now()}`,
      dateISO: session.dateISO || new Date().toISOString(),
      dayType: session.dayType || 'strength',
      label: session.label || 'Session',
      durationSec: Number(session.durationSec) || 0,
      avgRpe: typeof session.avgRpe === 'number' ? session.avgRpe : null,
      exercises: (session.exercises || []).map((e) => ({
        id: e.id,
        name: e.name,
        sets: (e.sets || []).map((s) => ({ done: !!s.done, rpe: s.rpe ?? null })),
        rpe: e.rpe ?? null,
      })),
    }
    all.unshift(record)
    // Cap at 500 sessions to keep storage lean
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(all.slice(0, 500)))
    window.dispatchEvent(new CustomEvent('selfscience:training-session-saved', { detail: record }))
    return record
  } catch { return null }
}

export function getSessionsByDate(dateISO) {
  const day = String(dateISO).slice(0, 10)
  return getAllSessions().filter((s) => (s.dateISO || '').slice(0, 10) === day)
}

// Returns a Set of YYYY-MM-DD strings for the last `days` days that have
// at least one completed session logged.
export function getCompletedDaySet(days = 60) {
  const cutoff = Date.now() - days * 86400_000
  const set = new Set()
  for (const s of getAllSessions()) {
    const t = new Date(s.dateISO).getTime()
    if (isNaN(t) || t < cutoff) continue
    set.add(String(s.dateISO).slice(0, 10))
  }
  return set
}

// Streak = consecutive days including today (or yesterday if not trained
// today yet) that have at least one session. Rest-day exemptions: not
// implemented here — the UI can layer on rest-day awareness.
export function getStreakDays() {
  const set = getCompletedDaySet(90)
  if (set.size === 0) return 0
  let count = 0
  const today = new Date()
  // Include today if trained; otherwise start from yesterday.
  const start = new Date(today)
  if (!set.has(today.toISOString().slice(0, 10))) {
    start.setDate(start.getDate() - 1)
  }
  const cursor = new Date(start)
  while (set.has(cursor.toISOString().slice(0, 10))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

// Week-start (Monday) ISO date for a given date.
export function weekStartISO(d = new Date()) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Mon = 0
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export function getSessionsThisWeek() {
  const start = weekStartISO()
  return getAllSessions().filter((s) => (s.dateISO || '').slice(0, 10) >= start)
}

// Returns sessions whose ISO date falls within the Mon-Sun window that
// contains `weekStartDate` (a Date at 00:00 local for that Monday).
export function getSessionsForWeek(weekStartDate) {
  if (!(weekStartDate instanceof Date)) return []
  const start = new Date(weekStartDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  const startISO = start.toISOString().slice(0, 10)
  const endISO = end.toISOString().slice(0, 10)
  return getAllSessions().filter((s) => {
    const d = (s.dateISO || '').slice(0, 10)
    return d >= startISO && d < endISO
  })
}

// ------- Active (in-flight) session ------------------------------------------

export function readActiveSession() {
  if (!hasWindow()) return null
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function writeActiveSession(state) {
  if (!hasWindow()) return
  try {
    if (state) window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(state))
    else window.localStorage.removeItem(ACTIVE_KEY)
  } catch { /* ignore */ }
}

export function clearActiveSession() {
  writeActiveSession(null)
}

// ------- PR / progress detection ---------------------------------------------

// Returns true if the current session's RPE for an exercise is lower than
// the most-recent previous log's RPE (with sets equal or higher). Signals
// a strength gain.
export function detectPr(exerciseId, currentSets, currentRpe) {
  if (!exerciseId || typeof currentRpe !== 'number') return false
  const doneSets = (currentSets || []).filter((s) => s.done).length
  const prev = getAllSessions().find((s) =>
    (s.exercises || []).some((e) => e.id === exerciseId)
  )
  if (!prev) return false
  const prevEx = prev.exercises.find((e) => e.id === exerciseId)
  if (!prevEx || typeof prevEx.rpe !== 'number') return false
  const prevDone = (prevEx.sets || []).filter((s) => s.done).length
  return doneSets >= prevDone && currentRpe < prevEx.rpe
}
