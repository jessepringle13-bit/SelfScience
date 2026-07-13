// /app/lib/biomarkers/index.js
// Barrel export + BACKWARDS-COMPAT layer.
//
// The old page imported { BIOMARKERS, STATUS_META, evaluateAllBiomarkers,
// BIOMARKERS_DISCLAIMER, getBiomarkersForSex } from '@/lib/biomarkers'.
// We keep those names working so any place still importing the old API
// (e.g. /app/components/RegenTools.jsx, /app/components/Dashboard.jsx,
// /app/app/practitioner-report/*) doesn't break.

import { BIOMARKERS as SCHEMA_BIOMARKERS, BIOMARKERS_DISCLAIMER, CATEGORIES, CONFIDENCE_META } from './schema'
import {
  STATUS,
  resolveForSex,
  getBiomarkersForSex,
  evaluateBiomarker,
  evaluateAllBiomarkers,
  groupByCategory,
} from './status'

export { BIOMARKERS_DISCLAIMER, CATEGORIES, CONFIDENCE_META, STATUS }
export { resolveForSex, getBiomarkersForSex, evaluateBiomarker, evaluateAllBiomarkers, groupByCategory }
export const BIOMARKERS = SCHEMA_BIOMARKERS

/**
 * Legacy STATUS_META shape used by old cards:
 *   { optimal:{label,color}, caution:{...}, flag:{...}, unknown:{...} }
 * Kept alive so RegenTools + practitioner-report don't crash.
 * New code should use STATUS from status.js.
 */
export const STATUS_META = {
  optimal:  { label: 'Optimal',   color: '#2E7D32' },
  caution:  { label: 'Caution',   color: '#B07D00' },
  flag:     { label: 'Flag',      color: '#A12C7B' },
  unknown:  { label: '—',         color: '#7A7974' },
}

/**
 * Legacy evaluator that returns the 3-tier vocabulary (optimal/caution/
 * flag/unknown). Bridges the new schema back to the old shape by mapping
 * the new 4-tier status through this table:
 *   in_target    → optimal
 *   borderline   → caution
 *   outside      → flag
 *   insufficient → unknown
 * Consumed by any older component that still reads .status as one of
 * those strings.
 */
const STATUS_LEGACY_MAP = {
  in_target:    'optimal',
  borderline:   'caution',
  outside:      'flag',
  insufficient: 'unknown',
}
export function evaluateAllBiomarkersLegacy(values, sex = 'male') {
  const out = {}
  const evaluated = evaluateAllBiomarkers(values, sex)
  for (const [id, r] of Object.entries(evaluated)) {
    out[id] = { value: r.value, status: STATUS_LEGACY_MAP[r.status] || 'unknown' }
  }
  return out
}
