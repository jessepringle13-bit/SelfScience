// /app/lib/training/intake.js
// Training Protocol Engine — intake form schema + localStorage helpers.
//
// STRICT PRIVACY: All intake data lives only on the user's device.

export const TRAINING_INTAKE_KEY = 'selfscience_training_intake'
export const TRAINING_PROTOCOL_KEY = 'selfscience_training_protocol'

export const EXPERIENCE_LEVELS = [
  { v: 'beginner',      label: 'Complete Beginner' },
  { v: 'recreational',  label: 'Recreational' },
  { v: 'amateur',       label: 'Amateur Competitive' },
  { v: 'collegiate',    label: 'Collegiate' },
  { v: 'semi_pro',      label: 'Semi-Professional' },
  { v: 'professional',  label: 'Professional' },
  { v: 'masters',       label: 'Masters Athlete (35+)' },
  { v: 'youth',         label: 'Youth Athlete (under 18)' },
]

export const SEX_OPTIONS = [
  { v: '',           label: 'Prefer not to say' },
  { v: 'male',       label: 'Male' },
  { v: 'female',     label: 'Female' },
]

export const SESSION_LENGTHS = [
  { v: 'u30',   label: 'Under 30 min',  minutes: 25 },
  { v: '30_45', label: '30–45 min',      minutes: 40 },
  { v: '45_60', label: '45–60 min',      minutes: 55 },
  { v: '60_90', label: '60–90 min',      minutes: 75 },
  { v: '90p',   label: '90+ min',        minutes: 100 },
]

export const ACTIVITY_SUGGESTIONS = [
  'Running', 'Powerlifting', 'Bodybuilding', 'CrossFit', 'Soccer', 'Basketball',
  'Swimming', 'Cycling', 'Yoga', 'Hiking', 'Rugby', 'Rowing', 'Tennis',
  'Boxing / MMA', 'Climbing', 'Triathlon', 'Golf',
  'General Fitness', 'I don\u2019t know yet',
]

export const GOAL_OPTIONS = [
  { v: 'strength',      label: 'Build strength' },
  { v: 'muscle',        label: 'Build muscle' },
  { v: 'endurance',     label: 'Improve endurance' },
  { v: 'power',         label: 'Improve speed / power' },
  { v: 'fat_loss',      label: 'Lose body fat' },
  { v: 'injury_prev',   label: 'Injury prevention' },
  { v: 'longevity',     label: 'Recovery and longevity' },
  { v: 'mobility',      label: 'Improve flexibility / mobility' },
  { v: 'general',       label: 'General health' },
  { v: 'unsure',        label: 'I don\u2019t know — help me figure it out' },
]

export const EQUIPMENT_OPTIONS = [
  { v: 'body_only',   label: 'Bodyweight only' },
  { v: 'dumbbell',    label: 'Dumbbells' },
  { v: 'barbell',     label: 'Barbells + rack' },
  { v: 'cable',       label: 'Cables' },
  { v: 'machine',     label: 'Machines' },
  { v: 'bands',       label: 'Resistance bands' },
  { v: 'kettlebells', label: 'Kettlebells' },
  { v: 'cardio',      label: 'Cardio machines' },
  { v: 'full_gym',    label: 'Full gym' },
  { v: 'outdoor',     label: 'Outdoor space' },
  { v: 'pool',        label: 'Pool' },
]

export const TRAINING_INTAKE_DEFAULTS = {
  // Section A — Who You Are
  experienceLevel: 'recreational',
  age: '',
  sex: '',
  unitSystem: 'metric',
  heightCm: '',
  weightKg: '',

  // Section B — What You Do
  primaryActivity: '',
  daysPerWeek: 3,
  sessionLength: '45_60',
  goals: ['general'],

  // Section C — Your Situation
  currentInjuries: '',
  pastInjuries: '',
  equipment: ['body_only'],
  protectedActivity: '',
  avoidances: '',

  // Section D — populated automatically
  hasGenome: false,
  hasBiomarkers: false,

  // Meta
  createdAt: null,
  updatedAt: null,
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadTrainingIntake() {
  if (!hasWindow()) return { ...TRAINING_INTAKE_DEFAULTS }
  try {
    const raw = localStorage.getItem(TRAINING_INTAKE_KEY)
    if (!raw) return { ...TRAINING_INTAKE_DEFAULTS }
    return { ...TRAINING_INTAKE_DEFAULTS, ...(JSON.parse(raw) || {}) }
  } catch { return { ...TRAINING_INTAKE_DEFAULTS } }
}

export function saveTrainingIntake(patch) {
  if (!hasWindow()) return false
  try {
    const cur = loadTrainingIntake()
    const next = { ...cur, ...(patch || {}), updatedAt: new Date().toISOString() }
    if (!next.createdAt) next.createdAt = next.updatedAt
    localStorage.setItem(TRAINING_INTAKE_KEY, JSON.stringify(next))
    return true
  } catch { return false }
}

export function clearTrainingIntake() {
  if (!hasWindow()) return
  try { localStorage.removeItem(TRAINING_INTAKE_KEY) } catch { /* noop */ }
}

export function saveTrainingProtocol(protocol) {
  if (!hasWindow()) return false
  try {
    localStorage.setItem(TRAINING_PROTOCOL_KEY, JSON.stringify({
      ...protocol,
      savedAt: new Date().toISOString(),
    }))
    return true
  } catch { return false }
}

export function loadTrainingProtocol() {
  if (!hasWindow()) return null
  try {
    const raw = localStorage.getItem(TRAINING_PROTOCOL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
