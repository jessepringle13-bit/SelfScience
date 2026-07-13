// /app/lib/training/blueprint.js
// Weekly Blueprint generator (Section 3C).
//
// Rules-based, deterministic. Given:
//  - daysAvailable (0..7)
//  - sessionLength minutes
//  - primaryGoal(s)
//  - experience level
//  - profile.tags
//
// …produces a 7-day plan of DayEntry objects.

import { SESSION_LENGTHS } from './intake'

export const DAY_TYPES = {
  strength_upper:      { label: 'Strength — Upper Body',      color: '#059669', intensity: 'hard' },
  strength_lower:      { label: 'Strength — Lower Body',      color: '#059669', intensity: 'hard' },
  strength_full:       { label: 'Strength — Full Body',       color: '#059669', intensity: 'hard' },
  strength_push:       { label: 'Strength — Push',             color: '#059669', intensity: 'hard' },
  strength_pull:       { label: 'Strength — Pull',             color: '#059669', intensity: 'hard' },
  zone2_cardio:        { label: 'Zone 2 Cardio',                color: '#0891B2', intensity: 'moderate' },
  intervals:           { label: 'Intervals / Threshold',        color: '#EA580C', intensity: 'hard' },
  sport_practice:      { label: 'Sport Practice',                color: '#7C3AED', intensity: 'moderate' },
  skill_power:         { label: 'Power / Skill Work',            color: '#7C3AED', intensity: 'moderate' },
  mobility:            { label: 'Mobility & Stretching',         color: '#0EA5A4', intensity: 'easy' },
  active_recovery:     { label: 'Active Recovery',               color: '#94A3B8', intensity: 'easy' },
  rest:                { label: 'Rest',                          color: '#CBD5E1', intensity: 'easy' },
}

function sessionMinutes(lengthKey) {
  const s = SESSION_LENGTHS.find((s) => s.v === lengthKey)
  return s ? s.minutes : 55
}

function focus(type) {
  return ({
    strength_upper:  'Chest, back, shoulders, arms',
    strength_lower:  'Quads, hamstrings, glutes, calves',
    strength_full:   'Compound lifts — major movement patterns',
    strength_push:   'Push (chest, shoulders, triceps)',
    strength_pull:   'Pull (back, biceps, rear delts)',
    zone2_cardio:    'Aerobic base — HR 60–70 % max, conversational pace',
    intervals:       'Repeat efforts above threshold, structured recovery',
    sport_practice:  'Sport-specific skills, drills, or match play',
    skill_power:     'Speed, jumps, throws — quality over volume',
    mobility:        'Full-body joint mobility + eccentric loading',
    active_recovery: 'Walk, easy swim, or yoga — raise HR slightly, no fatigue',
    rest:            'Sleep, food, life',
  })[type] || ''
}

/**
 * Decide the base training "budget" — how many strength / cardio / recovery /
 * rest days out of daysAvailable to allocate, based on goal + profile.
 */
function budget(intake, profile) {
  const goals = new Set(intake.goals || [])
  const tags  = new Set(profile?.tags || [])
  const days  = Math.max(0, Math.min(7, Number(intake.daysPerWeek) || 3))

  // Start with defaults per goal.
  let strength = 0, cardio = 0, intervals = 0, skill = 0, mobility = 0
  if (goals.has('strength') || goals.has('muscle') || goals.has('power')) {
    strength = Math.min(4, Math.max(2, Math.round(days * 0.55)))
  }
  if (goals.has('endurance') || goals.has('fat_loss')) {
    cardio    = Math.min(4, Math.max(2, Math.round(days * 0.45)))
    intervals = 1
  }
  if (goals.has('general') || goals.has('longevity')) {
    strength = Math.max(strength, 2)
    cardio   = Math.max(cardio, 2)
  }
  if (goals.has('mobility') || goals.has('injury_prev')) {
    mobility = Math.max(mobility, 1)
  }
  if (!strength && !cardio) {
    // Default: balanced 3-day mixed programme.
    strength = Math.min(days, 2); cardio = Math.max(0, days - strength - 1)
  }

  // Genome nudges.
  if (tags.has('endurance_volume_high')) cardio    = Math.min(days, cardio + 1)
  if (tags.has('endurance_bias'))         cardio    = Math.min(days, cardio + 1)
  if (tags.has('power') && !cardio)       skill     = Math.min(days, skill + 1)
  if (tags.has('injury_risk_high'))        mobility  = Math.max(mobility, 1)
  if (tags.has('aerobic_before_skill'))   skill     = Math.min(days, skill + 1)

  // FKBP5 T carriers: force one active-recovery day between hards.
  const activeRecovery = tags.has('no_backtoback_hard') ? 1 : 0

  // Clamp to daysAvailable.
  let workDays = strength + cardio + intervals + skill + mobility + activeRecovery
  while (workDays > days) {
    if (intervals > 0)  { intervals--; workDays-- }
    else if (skill > 0) { skill--; workDays-- }
    else if (mobility > 1) { mobility--; workDays-- }
    else if (cardio > 1) { cardio--; workDays-- }
    else if (strength > 1) { strength--; workDays-- }
    else break
  }
  const rest = Math.max(0, 7 - days)
  return { strength, cardio, intervals, skill, mobility, activeRecovery, rest }
}

/**
 * Order the day-types into a sensible weekly rotation.
 * Priority: never place two heavy days back to back for FKBP5 T carriers or
 * COL5A1 TT users. Prefer strength Mon/Thu, cardio Tue/Sat, mobility Sun, etc.
 */
function schedule(b, tags) {
  const pool = []
  // Alternate strength splits based on how many strength days
  if (b.strength >= 4) {
    pool.push('strength_upper', 'strength_lower', 'strength_push', 'strength_pull')
  } else if (b.strength === 3) {
    pool.push('strength_upper', 'strength_lower', 'strength_full')
  } else if (b.strength === 2) {
    pool.push('strength_upper', 'strength_lower')
  } else if (b.strength === 1) {
    pool.push('strength_full')
  }
  for (let i = 0; i < b.cardio; i++) pool.push('zone2_cardio')
  for (let i = 0; i < b.intervals; i++) pool.push('intervals')
  for (let i = 0; i < b.skill; i++) pool.push('skill_power')
  for (let i = 0; i < b.mobility; i++) pool.push('mobility')
  for (let i = 0; i < b.activeRecovery; i++) pool.push('active_recovery')
  for (let i = 0; i < b.rest; i++) pool.push('rest')

  // Sort so hard sessions are interleaved with easy ones.
  const isHard = (t) => ['strength_upper','strength_lower','strength_full','strength_push','strength_pull','intervals'].includes(t)
  const hards = pool.filter(isHard)
  const softs = pool.filter((t) => !isHard(t))
  const week = []
  const hardMax = 7 // no artificial cap; loop below balances
  let hi = 0, si = 0
  // Round-robin interleave, but bias to hard→soft alternation for injury/FKBP5
  const forceAlternate = tags.has('no_backtoback_hard') || tags.has('injury_risk_high')
  for (let d = 0; d < 7; d++) {
    let pick = null
    const preferHardNext = (d % 2 === 0) || !forceAlternate
    if (preferHardNext && hi < hards.length) pick = hards[hi++]
    else if (si < softs.length) pick = softs[si++]
    else if (hi < hards.length) pick = hards[hi++]
    if (!pick) pick = 'rest'
    week.push(pick)
  }
  return week.slice(0, 7)
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function buildWeeklyBlueprint(intake, profile) {
  if (!intake) return null
  const b     = budget(intake, profile || { tags: [] })
  const tags  = new Set(profile?.tags || [])
  const week  = schedule(b, tags)
  const mins  = sessionMinutes(intake.sessionLength)

  const days = week.map((type, i) => {
    const meta = DAY_TYPES[type]
    return {
      day: DAY_LABELS[i],
      type,
      label: meta.label,
      intensity: meta.intensity,
      color: meta.color,
      focus: focus(type),
      duration: type === 'rest' ? '—' : type === 'active_recovery' ? '20\u201330 min' : `${mins} min`,
    }
  })
  return { days, budget: b }
}
