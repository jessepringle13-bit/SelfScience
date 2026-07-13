// /app/lib/training/exerciseDb.js
// Server-side loader for the free-exercise-db dataset (yuhonas/free-exercise-db).
// - 873 exercises, MIT licensed, no API key
// - Fetched once and cached in-process
// - Filterable by primary muscle, equipment, level
//
// Image URLs are built on-the-fly from the raw GitHub CDN.

const DATASET_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMAGE_CDN   = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

let CACHE = null
let FETCH_PROMISE = null

async function fetchDataset() {
  const res = await fetch(DATASET_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`ExerciseDB fetch failed: ${res.status}`)
  const list = await res.json()
  return list.map((e, idx) => ({
    id: e.id || `${e.name}-${idx}`.replace(/\s+/g, '_').toLowerCase(),
    name: e.name,
    force: e.force || null,          // pull | push | static | null
    level: e.level || 'intermediate', // beginner | intermediate | expert
    mechanic: e.mechanic || null,     // compound | isolation | null
    equipment: e.equipment || 'body only',
    primaryMuscles: e.primaryMuscles || [],
    secondaryMuscles: e.secondaryMuscles || [],
    instructions: e.instructions || [],
    category: e.category || null,      // strength | cardio | plyometrics | stretching | powerlifting | strongman | olympic weightlifting
    imageUrls: (e.images || []).map((p) => IMAGE_CDN + p),
  }))
}

export async function loadExerciseDB() {
  if (CACHE) return CACHE
  if (FETCH_PROMISE) return FETCH_PROMISE
  FETCH_PROMISE = fetchDataset().then((list) => { CACHE = list; return list })
    .catch((err) => { FETCH_PROMISE = null; throw err })
  return FETCH_PROMISE
}

// --- Filter helpers ---

const MUSCLE_ALIASES = {
  chest: ['chest'],
  back: ['lats', 'middle back', 'lower back', 'traps'],
  shoulders: ['shoulders'],
  arms: ['biceps', 'triceps', 'forearms'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  legs: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  core: ['abdominals', 'obliques'],
  abdominals: ['abdominals'],
  full_body: ['abdominals', 'glutes', 'quadriceps', 'hamstrings', 'chest', 'lats', 'shoulders'],
}

const EQUIPMENT_ALIASES = {
  body_only:   ['body only'],
  dumbbell:    ['dumbbell'],
  barbell:     ['barbell', 'e-z curl bar', 'other'],
  cable:       ['cable'],
  machine:     ['machine'],
  bands:       ['bands'],
  kettlebells: ['kettlebells'],
  cardio:      ['machine'],
  full_gym:    ['body only', 'dumbbell', 'barbell', 'cable', 'machine', 'bands', 'kettlebells'],
  outdoor:     ['body only', 'bands'],
  pool:        ['body only'],
}

function levelForExperience(exp) {
  if (exp === 'beginner' || exp === 'youth') return ['beginner']
  if (exp === 'recreational') return ['beginner', 'intermediate']
  if (['amateur', 'collegiate', 'masters'].includes(exp)) return ['intermediate', 'expert']
  if (['semi_pro', 'professional'].includes(exp)) return ['intermediate', 'expert']
  return ['beginner', 'intermediate', 'expert']
}

export function filterExercises(list, { muscle, equipment, level, limit = 25, exclude = [] } = {}) {
  if (!list) return []
  const wantedMuscles = muscle
    ? new Set((MUSCLE_ALIASES[muscle] || [muscle]).map((s) => s.toLowerCase()))
    : null
  const wantedEquip = equipment && equipment.length
    ? new Set(equipment.flatMap((e) => EQUIPMENT_ALIASES[e] || [e]).map((s) => s.toLowerCase()))
    : null
  const wantedLevels = level ? new Set(levelForExperience(level)) : null
  const excludeSet = new Set(exclude)

  const matches = []
  for (const e of list) {
    if (excludeSet.has(e.id)) continue
    if (wantedMuscles) {
      const primary = (e.primaryMuscles || []).map((s) => s.toLowerCase())
      const hit = primary.some((m) => wantedMuscles.has(m))
      if (!hit) continue
    }
    if (wantedEquip) {
      const eq = String(e.equipment || 'body only').toLowerCase()
      if (!wantedEquip.has(eq)) continue
    }
    if (wantedLevels && !wantedLevels.has(String(e.level).toLowerCase())) continue
    matches.push(e)
  }
  // Prefer compound over isolation, then higher-quality names first.
  matches.sort((a, b) => {
    const ac = a.mechanic === 'compound' ? -1 : 0
    const bc = b.mechanic === 'compound' ? -1 : 0
    return ac - bc
  })
  return matches.slice(0, limit)
}

export function pickRandom(list, n) {
  const copy = [...list]
  const out = []
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}
