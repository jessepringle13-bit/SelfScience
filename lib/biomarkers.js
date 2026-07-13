// /app/lib/biomarkers.js
// COMPATIBILITY FACADE.
//
// The rich schema now lives in /app/lib/biomarkers/{schema,status,index}.js.
// This module keeps the old public API alive so existing consumers
// (practitioner-report-client.jsx, Dashboard.jsx, RegenTools.jsx, etc.)
// keep working without a rewrite.
//
// Legacy status vocabulary (3-tier + unknown) is preserved via
// evaluateBiomarker() and STATUS_META. New code should import from
// '@/lib/biomarkers/index' for the 4-tier vocabulary + rich schema.

import {
  BIOMARKERS as SCHEMA_BIOMARKERS,
  CATEGORIES,
  CONFIDENCE_META,
  BIOMARKERS_DISCLAIMER as SCHEMA_DISCLAIMER,
} from './biomarkers/schema'
import {
  STATUS as NEW_STATUS,
  resolveForSex,
  getBiomarkersForSex as newGetBiomarkersForSex,
  evaluateBiomarker as newEvaluateBiomarker,
  evaluateAllBiomarkers as newEvaluateAllBiomarkers,
  groupByCategory,
} from './biomarkers/status'

/* --------------- New (v2) API — preferred going forward --------------- */
export {
  SCHEMA_BIOMARKERS as BIOMARKERS,
  CATEGORIES,
  CONFIDENCE_META,
  NEW_STATUS as STATUS,
  resolveForSex,
  groupByCategory,
}

export const BIOMARKERS_DISCLAIMER = SCHEMA_DISCLAIMER

/* -------------------- Legacy (v1) API — compat shim ------------------- */

/** Legacy status → color/label table used by practitioner-report + Regen. */
export const STATUS_META = {
  optimal:  { label: 'Optimal',   color: '#2E7D32' },
  caution:  { label: 'Caution',   color: '#B07D00' },
  flag:     { label: 'Flag',      color: '#A12C7B' },
  unknown:  { label: '—',         color: '#7A7974' },
}

const NEW_TO_LEGACY = {
  in_target:    'optimal',
  borderline:   'caution',
  outside:      'flag',
  insufficient: 'unknown',
}

/**
 * Legacy signature: (field, rawValue) → 'optimal'|'caution'|'flag'|'unknown'.
 * Delegates to the new evaluator and maps its 4-tier status back to the
 * old 3-tier vocabulary.
 */
export function evaluateBiomarker(field, rawValue) {
  const { status } = newEvaluateBiomarker(field, rawValue)
  return NEW_TO_LEGACY[status] || 'unknown'
}

/**
 * Legacy `evaluateAllBiomarkers(values, sex?)`.
 * Returns `{ [id]: { value, status } }` using legacy vocabulary.
 */
export function evaluateAllBiomarkers(values, sex = 'male') {
  const out = {}
  const evaluated = newEvaluateAllBiomarkers(values, sex)
  for (const [id, r] of Object.entries(evaluated)) {
    out[id] = { value: r.value, status: NEW_TO_LEGACY[r.status] || 'unknown' }
  }
  return out
}

/**
 * Legacy `getBiomarkersForSex(sex?)`.
 * Returns biomarkers with sex overrides merged AND with legacy fields
 * (`optimal` copy string, `classify()` function) synthesized on top for
 * any old UI code that still reads them.
 */
export function getBiomarkersForSex(sex = 'male') {
  return newGetBiomarkersForSex(sex).map((b) => ({
    ...b,
    // Legacy `.optimal` string used by old cards / practitioner report.
    optimal: `${b.optimization.label}: ${b.optimization.optimal[0]}–${b.optimization.optimal[1]} ${b.unit}`,
    // Legacy `.classify(v)` returning 3-tier string.
    classify: (v) => {
      const { status } = newEvaluateBiomarker(b, v)
      return NEW_TO_LEGACY[status] || 'unknown'
    },
  }))
}
