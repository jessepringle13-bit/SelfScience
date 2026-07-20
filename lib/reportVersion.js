// /app/lib/reportVersion.js
// Single source of truth for the two version identifiers the
// Practitioner Report footer surfaces per Section 6 spec item 7.
//
// * RULES_VERSION — bumped whenever the classification/priority logic
//   in /app/lib/clinicalPriority.js, /app/lib/pgxClassifier.js, or the
//   supplement/nutrition rule sets is materially changed.
// * VARIANT_DB_UPDATED_ISO — ISO date the /app/lib/variants.js variant
//   library was last regenerated from upstream sources (ClinVar,
//   PharmGKB, gnomAD, CPIC).
//
// Bump these together whenever a meaningful science update ships so a
// clinician reading the report can tell whether findings may have
// evolved since the PDF was generated.

export const RULES_VERSION = 'v2026.07-1'
export const VARIANT_DB_UPDATED_ISO = '2026-07-15'

/** Formats VARIANT_DB_UPDATED_ISO as a human-readable date. */
export function formatDbDate() {
  try {
    const d = new Date(VARIANT_DB_UPDATED_ISO + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return VARIANT_DB_UPDATED_ISO
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return VARIANT_DB_UPDATED_ISO }
}

/**
 * Convenience helper — the single-line footer string used on every
 * printed page. Kept in one place so all pages stay identical.
 */
export function reportFooterLine() {
  return `Rules version: ${RULES_VERSION} · Variant database last updated: ${formatDbDate()}.`
}

/**
 * Cosmetic / trait-only rsIDs that should be REMOVED from the
 * Practitioner Report's Section 3B (Strengths) print output — kept in
 * the consumer dashboard for context but not surfaced to clinicians who
 * only care about actionable metabolic/PGx/cardiovascular signals.
 * Section 6 spec item 4.
 */
export const COSMETIC_STRENGTH_RSIDS = new Set([
  'rs12913832', // HERC2 — eye color determination
  'rs1129038',  // HERC2 — brown eyes
  'rs713598',   // TAS2R38 — bitter taste sensitivity
  'rs10246939', // TAS2R38
  'rs1726866',  // TAS2R38
  'rs1426654',  // SLC24A5 — skin pigmentation
  'rs3827760',  // EDAR — hair follicle density / thickness
  'rs17822931', // ABCC11 — earwax type / body odor (trait only)
  // NOTE: LCT rs4988235 (lactase persistence) and ALDH2 rs671 (alcohol
  // flush) are INTENTIONALLY kept in the practitioner report even though
  // they superficially look "trait-like" — both have clinical management
  // implications a clinician should discuss (dairy tolerance, elevated
  // cancer-risk with alcohol for ALDH2 deficient variants).
])

// Additional trait-only gene filter — used to catch variants whose rsID
// we don't recognise but whose gene symbol matches a cosmetic-only gene.
// Applied AFTER the rsID set as a belt-and-braces safeguard.
const COSMETIC_STRENGTH_GENES = new Set([
  'HERC2', 'TAS2R38', 'SLC24A5', 'EDAR', 'ABCC11',
])

/**
 * Filter a list of strength cards through the cosmetic exclusion list.
 * Returns { kept, filteredOut } so the caller can log or report how
 * many were removed.
 */
export function filterCosmeticStrengths(strengths) {
  const kept = []
  const filteredOut = []
  for (const s of strengths || []) {
    const rsid = String(s?.rsid || '').toLowerCase()
    const gene = String(s?.gene || '').toUpperCase()
    if (COSMETIC_STRENGTH_RSIDS.has(rsid) || COSMETIC_STRENGTH_GENES.has(gene)) {
      filteredOut.push(s)
    } else {
      kept.push(s)
    }
  }
  return { kept, filteredOut }
}
