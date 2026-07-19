// /app/lib/training/milestoneStore.js
// localStorage checkbox state for training milestones (Weeks 1-4 Foundation,
// Weeks 5-12 Development, 6-month Transformation). Also stores a program
// start date so we can render a "Week X of Y" progress bar.

const DONE_KEY = 'ss_milestones_done_v1'
const START_KEY = 'ss_program_start_v1'

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getDoneMap() {
  if (!hasWindow()) return {}
  try {
    const raw = window.localStorage.getItem(DONE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function isMilestoneDone(id) {
  return !!getDoneMap()[id]
}

export function toggleMilestone(id) {
  if (!hasWindow() || !id) return
  const map = getDoneMap()
  if (map[id]) delete map[id]
  else map[id] = new Date().toISOString()
  try {
    window.localStorage.setItem(DONE_KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('selfscience:milestone-changed'))
  } catch { /* noop */ }
  return map[id] || null
}

// Program start date — auto-set on first read if not set. Used for the
// "Week X of Y" progress bar.
export function getProgramStartISO() {
  if (!hasWindow()) return null
  try {
    let s = window.localStorage.getItem(START_KEY)
    if (!s) {
      s = new Date().toISOString()
      window.localStorage.setItem(START_KEY, s)
    }
    return s
  } catch { return null }
}

export function resetProgramStart() {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(START_KEY, new Date().toISOString())
    window.dispatchEvent(new CustomEvent('selfscience:milestone-changed'))
  } catch { /* noop */ }
}

export function getCurrentWeek() {
  const s = getProgramStartISO()
  if (!s) return 1
  const days = Math.floor((Date.now() - new Date(s).getTime()) / 86400_000)
  return Math.max(1, Math.min(26, Math.floor(days / 7) + 1))
}
