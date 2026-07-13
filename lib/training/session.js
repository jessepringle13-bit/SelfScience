// /app/lib/training/session.js
// Workout Session builder (Section 3D).
//
// Given a blueprint day (e.g. strength_upper) + intake + profile, decide
// which muscle groups to target and pull exercises from the ExerciseDB.

import { filterExercises } from './exerciseDb'

// Which muscle groups a given day-type targets.
const DAY_MUSCLES = {
  strength_upper: ['chest', 'back', 'shoulders', 'arms'],
  strength_lower: ['legs', 'glutes', 'hamstrings', 'quadriceps', 'calves'],
  strength_full:  ['legs', 'chest', 'back', 'core'],
  strength_push:  ['chest', 'shoulders', 'triceps'],
  strength_pull:  ['back', 'biceps'],
  intervals:      ['legs'],
  skill_power:    ['legs', 'core'],
  mobility:       ['back', 'legs', 'shoulders'],
  zone2_cardio:   [],   // cardio prescription, not exercise list
  active_recovery:[],
  rest:           [],
}

/**
 * Programming: how to prescribe sets/reps for each day-type and level.
 */
function prescription(dayType, level, tags) {
  const t = new Set(tags || [])
  const heavyCap = t.has('injury_risk_high') || t.has('volume_over_intensity')
  const beginnerish = ['beginner', 'youth', 'recreational'].includes(level)

  const base = {
    strength_upper: {
      sets: beginnerish ? 3 : 4,
      reps: heavyCap ? '6\u201310'   : (beginnerish ? '8\u201312' : '5\u20138'),
      rest: heavyCap ? '90 s' : '2\u20133 min',
      tempo: '2-1-2-0',
    },
    strength_lower: {
      sets: beginnerish ? 3 : 4,
      reps: heavyCap ? '8\u201312' : (beginnerish ? '8\u201312' : '5\u20138'),
      rest: heavyCap ? '90 s' : '2\u20133 min',
      tempo: '3-1-2-0',
    },
    strength_full: {
      sets: 3,
      reps: beginnerish ? '10\u201312' : '6\u201310',
      rest: '90\u2013120 s',
      tempo: '2-1-2-0',
    },
    strength_push: {
      sets: beginnerish ? 3 : 4,
      reps: heavyCap ? '6\u201310' : (beginnerish ? '8\u201312' : '5\u20138'),
      rest: '2 min',
      tempo: '2-1-2-0',
    },
    strength_pull: {
      sets: beginnerish ? 3 : 4,
      reps: heavyCap ? '8\u201312' : (beginnerish ? '8\u201312' : '6\u201310'),
      rest: '2 min',
      tempo: '2-1-2-0',
    },
    intervals: {
      sets: beginnerish ? 4 : 6,
      reps: '30 s hard / 60 s easy',
      rest: '—',
      tempo: 'max effort',
    },
    skill_power: {
      sets: 5,
      reps: '3\u20135 (quality over volume)',
      rest: '2\u20133 min',
      tempo: 'explosive',
    },
    mobility: {
      sets: 1,
      reps: '5\u20138 controlled reps',
      rest: 'minimal',
      tempo: '3-2-3-0 (slow controlled)',
    },
  }
  return base[dayType] || null
}

/**
 * Coaching cues we tack on to any exercise, tailored to the user's profile.
 */
function geneticNote(dayType, tags, exercise) {
  const t = new Set(tags || [])
  const cues = []
  if (t.has('injury_risk_high')) {
    if (['strength_lower', 'strength_full'].includes(dayType)) {
      cues.push('COL5A1 TT: joint tracking matters more than load — depth and alignment first.')
    }
    if (['strength_upper', 'strength_push', 'strength_pull'].includes(dayType)) {
      cues.push('Warm up shoulders / elbows with bands — collagen protocol 30\u201360 min pre-session.')
    }
  }
  if (t.has('volume_over_intensity')) {
    cues.push('Slow-twitch bias: aim for the top of the rep range with tight form rather than adding load.')
  }
  if (t.has('power') && dayType === 'skill_power') {
    cues.push('ACTN3 RR: your fast-twitch profile responds to intent — move the load fast, not just heavy.')
  }
  return cues
}

/**
 * Build the session for a single day.
 */
export function buildSession(day, intake, profile, exerciseList) {
  const muscles = DAY_MUSCLES[day.type] || []
  const rx = prescription(day.type, intake.experienceLevel, profile?.tags)

  if (!muscles.length) {
    // Non-exercise day (cardio prescription, active recovery, rest).
    return {
      day: day.day,
      type: day.type,
      label: day.label,
      duration: day.duration,
      cardio: day.type === 'zone2_cardio'
        ? { targetHR: '60\u201370 % of max HR', talkTest: 'You can hold a conversation but not sing.', duration: day.duration }
        : null,
      recovery: day.type === 'active_recovery'
        ? { modalities: ['Easy walk', 'Gentle swim', 'Yin yoga', 'Foam rolling + mobility'], duration: '20\u201330 min', intensity: 'HR stays below 60 % of max.' }
        : null,
      rest: day.type === 'rest'
        ? { notes: 'Sleep 7\u20139 h. Prioritise food quality + hydration. Walking counts as “rest” if you enjoy it.' }
        : null,
      exercises: [],
    }
  }

  // Pick 1 compound + 1 accessory per major muscle group targeted.
  const picked = []
  const usedIds = new Set()
  for (const m of muscles) {
    const candidates = filterExercises(exerciseList, {
      muscle: m,
      equipment: intake.equipment,
      level: intake.experienceLevel,
      limit: 8,
      exclude: [...usedIds],
    })
    if (!candidates.length) continue
    // Prefer compound, then a light isolation of same muscle.
    const compound  = candidates.find((c) => c.mechanic === 'compound')
    const isolation = candidates.find((c) => c.mechanic !== 'compound' && c.id !== compound?.id)
    if (compound)  { picked.push({ e: compound, m });  usedIds.add(compound.id) }
    if (isolation) { picked.push({ e: isolation, m }); usedIds.add(isolation.id) }
  }

  const exercises = picked.slice(0, 6).map(({ e, m }) => ({
    id: e.id,
    name: e.name,
    imageUrls: e.imageUrls,
    primaryMuscles: e.primaryMuscles,
    secondaryMuscles: e.secondaryMuscles,
    equipment: e.equipment,
    level: e.level,
    mechanic: e.mechanic,
    instructions: e.instructions,
    targetMuscle: m,
    sets: rx.sets,
    reps: rx.reps,
    rest: rx.rest,
    tempo: rx.tempo,
    cues: geneticNote(day.type, profile?.tags, e),
  }))

  return {
    day: day.day,
    type: day.type,
    label: day.label,
    duration: day.duration,
    prescription: rx,
    exercises,
  }
}

export function buildAllSessions(blueprint, intake, profile, exerciseList) {
  if (!blueprint?.days) return []
  return blueprint.days.map((d) => buildSession(d, intake, profile, exerciseList))
}
