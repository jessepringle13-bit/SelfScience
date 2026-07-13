// /app/lib/biomarkers/status.js
// Evaluation + status vocabulary for the new biomarker cards.
//
// Vocabulary (replaces optimal/caution/flag):
//   in-target     — within SelfScience optimization range
//   borderline    — within standard clinical normal but outside optimization
//   outside       — outside standard clinical normal
//   insufficient  — no value entered / non-numeric
//
// The 4-tier vocabulary intentionally splits "outside SelfScience target"
// from "outside clinical normal" so users can see the difference between
// an optimization gap and a clinically concerning value.

import { BIOMARKERS } from './schema'

export const STATUS = {
  in_target:    { key: 'in_target',    label: 'In target',              tone: 'text-emerald-800 bg-emerald-50 ring-emerald-200', dot: 'bg-emerald-500' },
  borderline:   { key: 'borderline',   label: 'Borderline',             tone: 'text-amber-800   bg-amber-50   ring-amber-200',   dot: 'bg-amber-500'   },
  outside:      { key: 'outside',      label: 'Outside target',         tone: 'text-rose-800    bg-rose-50    ring-rose-200',    dot: 'bg-rose-500'    },
  insufficient: { key: 'insufficient', label: 'Insufficient context',   tone: 'text-slate-600   bg-slate-50   ring-slate-200',   dot: 'bg-slate-300'   },
}

/** Merge sex overrides into a biomarker for the caller's chosen sex. */
export function resolveForSex(biomarker, sex = 'male') {
  const override = biomarker.sexOverrides?.[sex]
  if (!override) return biomarker
  return {
    ...biomarker,
    standard:      override.standard     || biomarker.standard,
    optimization:  override.optimization || biomarker.optimization,
  }
}

/** Return every biomarker with sex overrides pre-merged. */
export function getBiomarkersForSex(sex = 'male') {
  return BIOMARKERS.map((b) => resolveForSex(b, sex))
}

/**
 * Evaluate a single value against a resolved biomarker.
 * Returns { status, isClinicallyAbnormal, value }.
 */
export function evaluateBiomarker(biomarker, rawValue) {
  if (rawValue === '' || rawValue == null) {
    return { status: 'insufficient', isClinicallyAbnormal: false, value: null }
  }
  const v = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)
  if (!Number.isFinite(v)) {
    return { status: 'insufficient', isClinicallyAbnormal: false, value: null }
  }

  const [oMin, oMax] = biomarker.optimization.optimal
  const [bMin, bMax] = biomarker.optimization.borderline
  const [sMin, sMax] = biomarker.standard.interval

  let status
  if (v >= oMin && v <= oMax)                    status = 'in_target'
  else if (v >= bMin && v <= bMax)               status = 'borderline'
  else if (v >= sMin && v <= sMax)               status = 'borderline'
  else                                           status = 'outside'

  const isClinicallyAbnormal = v < sMin || v > sMax
  return { status, isClinicallyAbnormal, value: v }
}

/** Evaluate the entire panel; returns { [id]: { status, value, ... } }. */
export function evaluateAllBiomarkers(values, sex = 'male') {
  const resolved = getBiomarkersForSex(sex)
  const out = {}
  for (const b of resolved) {
    out[b.id] = evaluateBiomarker(b, values?.[b.id])
  }
  return out
}

/**
 * Group biomarkers by category id (as defined in schema.CATEGORIES).
 * Order is stable to the order they appear in BIOMARKERS.
 */
export function groupByCategory(list = BIOMARKERS) {
  const map = new Map()
  for (const b of list) {
    if (!map.has(b.category)) map.set(b.category, [])
    map.get(b.category).push(b)
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }))
}
