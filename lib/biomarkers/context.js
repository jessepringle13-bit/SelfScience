// /app/lib/biomarkers/context.js
// Draw-context annotations the user can optionally attach to bloodwork:
// fasting status, time of day, recent illness, training load, menstrual
// phase. Stored in localStorage. patterns.js reads these to add caveats.

export const CONTEXT_STORAGE_KEY = 'selfscience_biomarker_context'

export const CONTEXT_FIELDS = [
  {
    id: 'fasting',
    label: 'Fasting status',
    hint: 'Affects: glucose, insulin, triglycerides.',
    options: [
      { value: 'fasted',      label: '8–12h fasted' },
      { value: 'long_fasted', label: '>12h fasted' },
      { value: 'non_fasted',  label: 'Non-fasted' },
      { value: 'unsure',      label: 'Not sure' },
    ],
  },
  {
    id: 'time_of_day',
    label: 'Time of draw',
    hint: 'Affects: cortisol, testosterone, TSH.',
    options: [
      { value: 'early_am',  label: 'Early AM (before 10am)' },
      { value: 'midday',    label: 'Midday' },
      { value: 'afternoon', label: 'Afternoon' },
      { value: 'evening',   label: 'Evening' },
    ],
  },
  {
    id: 'recent_illness',
    label: 'Recent illness or infection (past 2 weeks)',
    hint: 'Affects: hs-CRP, ferritin, WBC — all rise as acute-phase reactants.',
    options: [
      { value: 'none',     label: 'None' },
      { value: 'mild',     label: 'Mild cold / minor bug' },
      { value: 'moderate', label: 'Recent moderate illness' },
    ],
  },
  {
    id: 'training_load',
    label: 'Training load (past 72 hours)',
    hint: 'Affects: hs-CRP, CK, ferritin, testosterone.',
    options: [
      { value: 'rest',    label: 'Rest' },
      { value: 'normal',  label: 'Normal week' },
      { value: 'heavy',   label: 'Heavy / recent PR / competition' },
    ],
  },
  {
    id: 'menstrual_phase',
    label: 'Menstrual cycle phase (if applicable)',
    hint: 'Affects: estradiol, progesterone, iron loss patterns.',
    onlyIfSex: 'female',
    options: [
      { value: 'na',             label: 'Not applicable' },
      { value: 'follicular',     label: 'Follicular (day 1–13)' },
      { value: 'ovulation',      label: 'Ovulation (day 14–16)' },
      { value: 'luteal',         label: 'Luteal (day 17–28)' },
      { value: 'post_menopause', label: 'Post-menopause' },
    ],
  },
]

export function loadContext() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CONTEXT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveContext(ctx) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(ctx || {})) }
  catch { /* storage disabled */ }
}

export function clearContext() {
  try { localStorage.removeItem(CONTEXT_STORAGE_KEY) } catch { /* noop */ }
}

/** Count of context fields the user has answered (excluding 'unsure'/'na'). */
export function countAnswered(ctx) {
  if (!ctx) return 0
  return Object.entries(ctx).filter(([, v]) => v && v !== 'unsure' && v !== 'na').length
}

/**
 * Interpretation caveats to inject into pattern notes based on context.
 * Each caveat is a plain sentence; patterns.js appends the relevant ones
 * to the notes list so users see "Your hs-CRP is elevated but you noted
 * a recent illness — likely acute-phase" style context.
 */
export function contextCaveats(ctx) {
  const out = []
  if (!ctx) return out
  if (ctx.recent_illness === 'moderate') {
    out.push('You noted a recent moderate illness — hs-CRP and ferritin can stay elevated 1–4 weeks after infection. Consider retesting after full recovery before drawing conclusions.')
  } else if (ctx.recent_illness === 'mild') {
    out.push('You noted a mild recent illness — hs-CRP elevations here may reflect acute-phase response rather than chronic inflammation.')
  }
  if (ctx.training_load === 'heavy') {
    out.push('You noted heavy recent training — hs-CRP, CK, and ferritin can transiently rise; testosterone can transiently drop. Retest after 5–7 days of normal load before drawing conclusions.')
  }
  if (ctx.time_of_day && ctx.time_of_day !== 'early_am') {
    const label = ctx.time_of_day.replace(/_/g, ' ')
    out.push(`Draw time noted as ${label} — total testosterone and cortisol are meaningfully time-of-day dependent; interpret cautiously.`)
  }
  if (ctx.fasting === 'non_fasted' || ctx.fasting === 'unsure') {
    out.push('You noted non-fasted or unclear fasting — fasting glucose, triglycerides, and insulin interpretation depend on true fasting state.')
  }
  return out
}
