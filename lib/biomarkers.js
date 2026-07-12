// /app/lib/biomarkers.js
// SelfScience — Lab biomarker panel definitions.
//
// All 17 biomarker fields, their reference ranges, and a pure function
// that classifies a user's value into one of: 'optimal' | 'caution' |
// 'flag' | 'unknown'.  Nothing here does network I/O.
//
// Reference ranges follow the user-provided spec verbatim. For sex-specific
// biomarkers we show the male reference range and label the field with a
// small "(male ref)" note in the UI — users of any sex can still enter
// their number and see a color dot, they just need to interpret against
// the correct clinical range.

/**
 * @typedef {Object} Biomarker
 * @property {string}  id             - Slug used in state / storage
 * @property {string}  label          - Display label
 * @property {string}  unit           - Value unit shown in the input
 * @property {string=} secondaryLabel - Optional short qualifier (e.g. "male")
 * @property {string}  optimal        - Human-readable optimal range copy
 * @property {(v:number)=>('optimal'|'caution'|'flag')} classify - Range logic
 * @property {number=} step           - HTML number input step (defaults 0.1)
 * @property {number=} min            - HTML number input min
 * @property {number=} max            - HTML number input max
 */

// Small helper to build a classifier from thresholds.
// tier layout: optimalMin..optimalMax with cautionMin..optimalMin-1 and
// optimalMax+1..cautionMax on either side, else flag.
function classifyRange({ optimalMin, optimalMax, cautionMin, cautionMax }) {
  return (v) => {
    if (v == null || Number.isNaN(v)) return 'unknown'
    if (v >= optimalMin && v <= optimalMax) return 'optimal'
    if (cautionMin != null && v >= cautionMin && v < optimalMin) return 'caution'
    if (cautionMax != null && v > optimalMax && v <= cautionMax) return 'caution'
    return 'flag'
  }
}

export const BIOMARKERS = [
  {
    id: 'hba1c',
    label: 'HbA1c',
    unit: '%',
    optimal: 'Optimal <5.4% · Caution 5.4–5.7 · Flag >5.7',
    step: 0.1,
    min: 3, max: 15,
    classify: (v) => (v == null || Number.isNaN(v)) ? 'unknown' : v < 5.4 ? 'optimal' : v <= 5.7 ? 'caution' : 'flag',
  },
  {
    id: 'testosterone_total',
    label: 'Testosterone (total)',
    secondaryLabel: 'male ref',
    unit: 'ng/dL',
    optimal: 'Optimal 700–1000 · Caution 500–699 · Flag <500',
    step: 1,
    min: 0, max: 2500,
    classify: (v) => (v == null || Number.isNaN(v)) ? 'unknown' : v >= 700 && v <= 1000 ? 'optimal' : v >= 500 && v < 700 ? 'caution' : v > 1000 ? 'caution' : 'flag',
    female: {
      secondaryLabel: 'female ref',
      optimal: 'Optimal 15–70 · Caution 8–14 · Flag <8',
      classify: (v) => (v == null || Number.isNaN(v)) ? 'unknown' : v >= 15 && v <= 70 ? 'optimal' : v >= 8 && v < 15 ? 'caution' : v > 70 && v <= 100 ? 'caution' : 'flag',
    },
  },
  {
    id: 'testosterone_free',
    label: 'Free Testosterone',
    secondaryLabel: 'male ref',
    unit: 'pg/mL',
    optimal: 'Optimal 15–25 pg/mL',
    step: 0.1,
    min: 0, max: 60,
    classify: classifyRange({ optimalMin: 15, optimalMax: 25, cautionMin: 10, cautionMax: 30 }),
    female: {
      secondaryLabel: 'female ref',
      optimal: 'Optimal 1–8 pg/mL',
      classify: classifyRange({ optimalMin: 1, optimalMax: 8, cautionMin: 0.5, cautionMax: 10 }),
    },
  },
  {
    id: 'hdl',
    label: 'HDL Cholesterol',
    unit: 'mg/dL',
    optimal: 'Optimal >55 · Caution 45–55 · Flag <45',
    step: 1,
    min: 0, max: 200,
    classify: (v) => (v == null || Number.isNaN(v)) ? 'unknown' : v > 55 ? 'optimal' : v >= 45 ? 'caution' : 'flag',
  },
  {
    id: 'ldl',
    label: 'LDL Cholesterol',
    unit: 'mg/dL',
    optimal: 'Optimal <100 · Caution 100–130 · Flag >130',
    step: 1,
    min: 0, max: 400,
    classify: (v) => (v == null || Number.isNaN(v)) ? 'unknown' : v < 100 ? 'optimal' : v <= 130 ? 'caution' : 'flag',
  },
  {
    id: 'apob',
    label: 'ApoB',
    unit: 'mg/dL',
    optimal: 'Optimal <80 · Caution 80–100 · Flag >100',
    step: 1,
    min: 0, max: 250,
    classify: (v) => (v == null || Number.isNaN(v)) ? 'unknown' : v < 80 ? 'optimal' : v <= 100 ? 'caution' : 'flag',
  },
  {
    id: 'hs_crp',
    label: 'hs-CRP',
    unit: 'mg/L',
    optimal: 'Optimal <1.0 · Caution 1.0–3.0 · Flag >3.0',
    step: 0.1,
    min: 0, max: 40,
    classify: (v) => (v == null || Number.isNaN(v)) ? 'unknown' : v < 1.0 ? 'optimal' : v <= 3.0 ? 'caution' : 'flag',
  },
  {
    id: 'vitamin_d',
    label: 'Vitamin D (25-OH)',
    unit: 'ng/mL',
    optimal: 'Optimal 50–80 · Caution 30–49 or >80',
    step: 1,
    min: 0, max: 200,
    classify: (v) => {
      if (v == null || Number.isNaN(v)) return 'unknown'
      if (v >= 50 && v <= 80) return 'optimal'
      if ((v >= 30 && v < 50) || v > 80) return 'caution'
      return 'flag'
    },
  },
  {
    id: 'fasting_glucose',
    label: 'Fasting Glucose',
    unit: 'mg/dL',
    optimal: 'Optimal 70–90 · Caution 90–100 · Flag >100',
    step: 1,
    min: 0, max: 500,
    classify: (v) => {
      if (v == null || Number.isNaN(v)) return 'unknown'
      if (v >= 70 && v <= 90) return 'optimal'
      if (v > 90 && v <= 100) return 'caution'
      if (v >= 60 && v < 70) return 'caution'
      return 'flag'
    },
  },
  {
    id: 'hemoglobin',
    label: 'Hemoglobin',
    secondaryLabel: 'male ref',
    unit: 'g/dL',
    optimal: 'Optimal 14.5–17.5 · Caution 13.5–14.4 · Flag <13.5',
    step: 0.1,
    min: 0, max: 25,
    classify: (v) => {
      if (v == null || Number.isNaN(v)) return 'unknown'
      if (v >= 14.5 && v <= 17.5) return 'optimal'
      if (v >= 13.5 && v < 14.5) return 'caution'
      if (v > 17.5 && v <= 18.5) return 'caution'
      return 'flag'
    },
    female: {
      secondaryLabel: 'female ref',
      optimal: 'Optimal 12.0–16.0 · Caution 11.0–11.9 · Flag <11.0',
      classify: (v) => {
        if (v == null || Number.isNaN(v)) return 'unknown'
        if (v >= 12.0 && v <= 16.0) return 'optimal'
        if (v >= 11.0 && v < 12.0) return 'caution'
        if (v > 16.0 && v <= 17.0) return 'caution'
        return 'flag'
      },
    },
  },
  {
    id: 'ferritin',
    label: 'Ferritin',
    secondaryLabel: 'male ref',
    unit: 'ng/mL',
    optimal: 'Optimal 50–200 · Caution 20–49 · Flag <20 or >300',
    step: 1,
    min: 0, max: 3000,
    classify: (v) => {
      if (v == null || Number.isNaN(v)) return 'unknown'
      if (v >= 50 && v <= 200) return 'optimal'
      if ((v >= 20 && v < 50) || (v > 200 && v <= 300)) return 'caution'
      return 'flag'
    },
    female: {
      secondaryLabel: 'female ref',
      optimal: 'Optimal 20–150 · Caution 12–19 · Flag <12 or >200',
      classify: (v) => {
        if (v == null || Number.isNaN(v)) return 'unknown'
        if (v >= 20 && v <= 150) return 'optimal'
        if (v >= 12 && v < 20) return 'caution'
        if (v > 150 && v <= 200) return 'caution'
        return 'flag'
      },
    },
  },
  {
    id: 'tsh',
    label: 'TSH',
    unit: 'mIU/L',
    optimal: 'Optimal 1.0–2.5 · Caution 0.5–1.0 or 2.5–4.0 · Flag outside',
    step: 0.1,
    min: 0, max: 30,
    classify: (v) => {
      if (v == null || Number.isNaN(v)) return 'unknown'
      if (v >= 1.0 && v <= 2.5) return 'optimal'
      if ((v >= 0.5 && v < 1.0) || (v > 2.5 && v <= 4.0)) return 'caution'
      return 'flag'
    },
  },
  {
    id: 'free_t3',
    label: 'Free T3',
    unit: 'pg/mL',
    optimal: 'Optimal 3.2–4.2 pg/mL',
    step: 0.1,
    min: 0, max: 10,
    classify: classifyRange({ optimalMin: 3.2, optimalMax: 4.2, cautionMin: 2.8, cautionMax: 4.6 }),
  },
  {
    id: 'free_t4',
    label: 'Free T4',
    unit: 'ng/dL',
    optimal: 'Optimal 1.2–1.8 ng/dL',
    step: 0.1,
    min: 0, max: 5,
    classify: classifyRange({ optimalMin: 1.2, optimalMax: 1.8, cautionMin: 0.8, cautionMax: 2.2 }),
  },
  {
    id: 'shbg',
    label: 'SHBG',
    secondaryLabel: 'male ref',
    unit: 'nmol/L',
    optimal: 'Optimal 20–40 · Caution 40–60 · Flag >60',
    step: 1,
    min: 0, max: 250,
    classify: (v) => {
      if (v == null || Number.isNaN(v)) return 'unknown'
      if (v >= 20 && v <= 40) return 'optimal'
      if (v > 40 && v <= 60) return 'caution'
      if (v >= 10 && v < 20) return 'caution'
      return 'flag'
    },
    female: {
      secondaryLabel: 'female ref',
      optimal: 'Optimal 40–120 · Caution 20–39 · Flag <20 or >120',
      classify: (v) => {
        if (v == null || Number.isNaN(v)) return 'unknown'
        if (v >= 40 && v <= 120) return 'optimal'
        if (v >= 20 && v < 40) return 'caution'
        return 'flag'
      },
    },
  },
  {
    id: 'igf1',
    label: 'IGF-1',
    secondaryLabel: 'adult ref',
    unit: 'ng/mL',
    optimal: 'Optimal 150–300 ng/mL',
    step: 1,
    min: 0, max: 800,
    classify: classifyRange({ optimalMin: 150, optimalMax: 300, cautionMin: 100, cautionMax: 350 }),
  },
  {
    id: 'homocysteine',
    label: 'Homocysteine',
    unit: 'µmol/L',
    optimal: 'Optimal <9 · Caution 9–15 · Flag >15',
    step: 0.1,
    min: 0, max: 100,
    classify: (v) => {
      if (v == null || Number.isNaN(v)) return 'unknown'
      if (v < 9) return 'optimal'
      if (v <= 15) return 'caution'
      return 'flag'
    },
  },
]

export const STATUS_META = {
  optimal: { label: 'Optimal', dot: 'bg-ss-green',       ring: 'ring-ss-green/40',       chip: 'bg-ss-green/10 text-ss-green' },
  caution: { label: 'Caution', dot: 'bg-amber-500',      ring: 'ring-amber-500/40',      chip: 'bg-amber-100 text-amber-900' },
  flag:    { label: 'Flag',    dot: 'bg-ss-amber',       ring: 'ring-ss-amber/40',       chip: 'bg-ss-amber/10 text-ss-amber' },
  unknown: { label: '—',       dot: 'bg-ss-border-warm', ring: 'ring-ss-border-warm/40', chip: 'bg-ss-bg text-ss-muted' },
}

/**
 * Return a biomarker list with the female overrides applied when sex ===
 * 'female'. Male ranges are the default (unchanged from the historical
 * BIOMARKERS export). This keeps every downstream consumer sex-aware
 * without them needing to know about the internal shape.
 */
export function getBiomarkersForSex(sex = 'male') {
  if (sex !== 'female') return BIOMARKERS
  return BIOMARKERS.map((b) => {
    if (!b.female) return b
    return {
      ...b,
      secondaryLabel: b.female.secondaryLabel || b.secondaryLabel,
      optimal:        b.female.optimal        || b.optimal,
      classify:       b.female.classify       || b.classify,
    }
  })
}

/**
 * Return the status for a single field given a value that may be a string
 * or number (empty string / null / NaN => 'unknown').
 */
export function evaluateBiomarker(field, rawValue) {
  if (rawValue === '' || rawValue == null) return 'unknown'
  const v = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)
  if (Number.isNaN(v)) return 'unknown'
  return field.classify(v)
}

/**
 * Evaluate every biomarker in one shot. Accepts an optional `sex` so the
 * female-specific overrides are applied to Testosterone (total & free),
 * Hemoglobin, Ferritin, and SHBG before evaluation.
 * Returns { [id]: { value: number|null, status: 'optimal'|... } }.
 */
export function evaluateAllBiomarkers(values, sex = 'male') {
  const out = {}
  for (const b of getBiomarkersForSex(sex)) {
    const raw = values?.[b.id]
    const value = (raw === '' || raw == null) ? null : parseFloat(raw)
    out[b.id] = { value: Number.isNaN(value) ? null : value, status: evaluateBiomarker(b, raw) }
  }
  return out
}

export const BIOMARKERS_DISCLAIMER =
  'Reference ranges are research-informed general targets, not personalized medical advice. Discuss any labs with a qualified clinician.'
