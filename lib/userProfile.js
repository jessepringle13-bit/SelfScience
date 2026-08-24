'use client'

// /app/lib/userProfile.js
// Health Story quiz answers + platform personalisation helpers.
// All state lives in localStorage under privacy-safe keys.
//
// Keys we own:
//   ss_user_profile   — JSON: {goal, preference, literacy, completed, completedAt}
//   ss_quiz_skipped   — 'true' when user opts out of the quiz
//   ss_quiz_q1|q2|q3  — individual answers (mirrors the profile object;
//                       kept for partial-state / back-nav resume)
//   ss_pillar_default_applied — 'true' after we auto-select the goal
//                       pillar on Dashboard mount ONCE, so returning
//                       users can freely click "All Pillars".

const LS_PROFILE  = 'ss_user_profile'
const LS_SKIPPED  = 'ss_quiz_skipped'
const LS_Q1       = 'ss_quiz_q1'
const LS_Q2       = 'ss_quiz_q2'
const LS_Q3       = 'ss_quiz_q3'
const LS_DEFAULT_APPLIED = 'ss_pillar_default_applied'

/* ---------------------------- Getters -------------------------------- */

export function getUserProfile() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LS_PROFILE)
    if (!raw) return null
    const p = JSON.parse(raw)
    return p && typeof p === 'object' ? p : null
  } catch { return null }
}

// -------------------------------------------------------------------------
// Nickname (optional) — read from ss_nickname OR ss_user_profile.nickname.
// Kept optional because current onboarding doesn't collect it. Any future
// onboarding step (or profile settings page) can call saveUserNickname()
// to enable personalised greetings across the app.
// -------------------------------------------------------------------------
const LS_NICKNAME = 'ss_nickname'

export function getUserNickname() {
  if (typeof window === 'undefined') return ''
  try {
    // 1. Explicit standalone key wins.
    const direct = window.localStorage.getItem(LS_NICKNAME)
    if (direct) return String(direct).trim()
    // 2. Fall back to a nickname field on the main user profile if a
    //    future onboarding step chose to co-locate it there.
    const profile = getUserProfile()
    const fromProfile = profile && (profile.nickname || profile.firstName || profile.name)
    if (fromProfile) return String(fromProfile).trim()
  } catch {}
  return ''
}

export function saveUserNickname(nickname) {
  if (typeof window === 'undefined') return
  const clean = String(nickname || '').trim().slice(0, 40)
  try {
    if (clean) window.localStorage.setItem(LS_NICKNAME, clean)
    else window.localStorage.removeItem(LS_NICKNAME)
    window.dispatchEvent(new Event('selfscience:nickname-changed'))
  } catch {}
}

export function clearUserNickname() {
  saveUserNickname('')
}

export function getQuizPartial() {
  if (typeof window === 'undefined') return { q1: null, q2: null, q3: null }
  try {
    return {
      q1: window.localStorage.getItem(LS_Q1),
      q2: window.localStorage.getItem(LS_Q2),
      q3: window.localStorage.getItem(LS_Q3),
    }
  } catch { return { q1: null, q2: null, q3: null } }
}

export function isQuizSkipped() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(LS_SKIPPED) === 'true' } catch { return false }
}

/* ---------------------------- Setters -------------------------------- */

export function saveQuizAnswer(qKey, value) {
  if (typeof window === 'undefined') return
  const key = { q1: LS_Q1, q2: LS_Q2, q3: LS_Q3 }[qKey]
  if (!key) return
  try { window.localStorage.setItem(key, value) } catch {}
}

export function markQuizSkipped(flag = true) {
  if (typeof window === 'undefined') return
  try {
    if (flag) window.localStorage.setItem(LS_SKIPPED, 'true')
    else window.localStorage.removeItem(LS_SKIPPED)
  } catch {}
}

export function saveUserProfile({ goal, preference, literacy }) {
  if (typeof window === 'undefined') return null
  const profile = {
    goal:       goal || null,
    preference: preference || null,
    literacy:   literacy || null,
    completed:  true,
    completedAt: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(LS_PROFILE, JSON.stringify(profile))
    window.localStorage.setItem(LS_SKIPPED, 'false')
    // On re-take we DO want the goal pillar to re-apply once. Wipe the
    // "applied" flag so the Dashboard picks up the new goal on next
    // mount.
    window.localStorage.removeItem(LS_DEFAULT_APPLIED)
    window.dispatchEvent(new CustomEvent('selfscience:profile-changed'))
  } catch {}
  return profile
}

/* ------------- Goal → default pillar chip mapping -------------------- */

const GOAL_TO_PILLAR = {
  performance: 'Sports Performance',
  health:      'General Wellness',
  curiosity:   'Genomics',
  nutrition:   'Nutrition',
  clinical:    'Pharmacogenomics',
  family:      'General Wellness',
}

export function pillarForGoal(goal) {
  return GOAL_TO_PILLAR[goal] || null
}

/**
 * Returns the pillar we should auto-select on Dashboard mount for this
 * user — but ONLY the first time. Returns null if:
 *   • the user hasn't taken the quiz
 *   • we've already applied the default this browser
 * Caller passes `currentUrlPillar` — if that's set, we assume the user
 * intentionally landed with a pillar in the URL and skip.
 */
export function shouldApplyGoalPillar(currentUrlPillar) {
  if (typeof window === 'undefined') return null
  if (currentUrlPillar) return null
  try {
    if (window.localStorage.getItem(LS_DEFAULT_APPLIED) === 'true') return null
    const profile = getUserProfile()
    if (!profile?.goal) return null
    const target = pillarForGoal(profile.goal)
    if (!target) return null
    return target
  } catch { return null }
}

export function markGoalPillarApplied() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_DEFAULT_APPLIED, 'true') } catch {}
}

/* ----------------- Personalisation copy helpers ---------------------- */

export const GOAL_LABEL = {
  performance: 'more energy and better performance',
  health:      'understanding a health issue',
  curiosity:   'curiosity about your genetics',
  nutrition:   'optimising diet and supplements',
  clinical:    'clinical or practitioner guidance',
  family:      "your family's health",
}

export const LITERACY_LABEL = {
  beginner:     'Beginner',
  intermediate: 'Some knowledge',
  advanced:     'Knowledgeable',
  professional: 'Professional',
}

export const PREFERENCE_LABEL = {
  actionable:    'Simple explanations and clear next steps',
  research:      'Research details and study confidence scores',
  clinical:      'Clinical summaries and doctor conversation tools',
  comprehensive: 'Everything — full detail across all tools',
}

/* -------- Cross-app trigger for opening the quiz on demand ---------- */

export const OPEN_QUIZ_EVENT = 'selfscience:open-health-story-quiz'

export function openHealthStoryQuiz() {
  if (typeof window === 'undefined') return
  try { window.dispatchEvent(new Event(OPEN_QUIZ_EVENT)) } catch {}
}
