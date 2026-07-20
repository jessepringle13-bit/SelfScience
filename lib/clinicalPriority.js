// /app/lib/clinicalPriority.js
// Shared helpers used by the Practitioner Report (Section 6 spec).
//
// Priority rules for awareness findings (Section 3A):
//   * URGENT  — life-threatening drug reaction risk. Specifically:
//               DPYD deficient/reduced, TPMT deficient/reduced, and any
//               finding flagged with a red-flag keyword in its
//               clinical_priority or plain-language text.
//   * IMPORTANT — dose-relevant PGx findings that a prescriber should
//               note but that are not immediately life-threatening.
//               SLCO1B1, VKORC1, and CYP2C19/CYP2D6/CYP2C9 findings
//               tagged as intermediate metabolizer.
//   * STANDARD — everything else in the awareness list.
//
// Priority rules for PGx phenotype table (Section 3C):
//   * URGENT   — Poor / Reduced / Deficient metabolizer (red border).
//                DPYD + TPMT ALWAYS map to urgent when non-normal.
//   * IMPORTANT — Intermediate metabolizer (amber border).
//   * NORMAL   — Normal / Extensive / Rapid metabolizer (green border).
//   * UNKNOWN  — no phenotype resolved (no border).

const URGENT_GENES = new Set(['DPYD', 'TPMT'])
const IMPORTANT_PGX_GENES = new Set(['SLCO1B1', 'VKORC1', 'CYP2C19', 'CYP2D6', 'CYP2C9'])

const RED_FLAG_KEYWORDS = [
  'life-threat', 'life threat', 'severe toxicity', 'severe reaction',
  'contraindicated', 'do not prescribe', 'avoid entirely', 'fluorouracil',
  '5-fu ', 'capecitabine', 'azathioprine', 'mercaptopurine',
]

// Poor / Reduced / Deficient variants of the metabolizer label emitted
// by /lib/pgxClassifier.js.
const URGENT_PHENOTYPE_RE = /(poor|reduced|deficient)/i
const AMBER_PHENOTYPE_RE  = /intermediate/i
const NORMAL_PHENOTYPE_RE = /(normal|extensive|rapid|ultrarapid)/i

/**
 * Classify a single awareness card. Returns one of:
 *   'urgent' | 'important' | 'standard'
 * @param {object} item — card from report.overview.areasToExplore
 * @param {object} [phenotypes] — inferAllPGxPhenotypes(report) map
 */
export function getAwarenessPriority(item, phenotypes) {
  if (!item) return 'standard'
  const gene = String(item.gene || '').toUpperCase()
  const rsid = String(item.rsid || '').toLowerCase()
  const plainText = `${item.plain || ''} ${item.classification_text || ''} ${item.trait || ''} ${item.name || ''}`.toLowerCase()

  // 1. Explicit user override / already-tagged priority
  if (item.clinical_priority === 'urgent') return 'urgent'
  if (item.clinical_priority === 'important') return 'important'

  // 2. Life-threatening keyword hit anywhere in the text
  for (const kw of RED_FLAG_KEYWORDS) {
    if (plainText.includes(kw)) return 'urgent'
  }

  // 3. Gene-based rules
  if (URGENT_GENES.has(gene)) {
    // DPYD / TPMT are only "urgent" when the phenotype is non-normal.
    const ph = phenotypes?.[gene]?.label || ''
    if (URGENT_PHENOTYPE_RE.test(ph)) return 'urgent'
    // If phenotype data is missing but the finding was surfaced in the
    // awareness list, it usually means a variant of clinical concern was
    // detected — still urgent as a precaution.
    if (!ph) return 'urgent'
  }

  if (IMPORTANT_PGX_GENES.has(gene)) return 'important'

  return 'standard'
}

/**
 * Sort awareness cards by priority (urgent → important → standard),
 * preserving original relative order within each bucket.
 */
export function sortAwarenessByPriority(items, phenotypes) {
  const withMeta = items.map((it, i) => ({ it, i, p: getAwarenessPriority(it, phenotypes) }))
  const rank = { urgent: 0, important: 1, standard: 2 }
  withMeta.sort((a, b) => (rank[a.p] - rank[b.p]) || (a.i - b.i))
  return withMeta.map((x) => ({ ...x.it, _priority: x.p }))
}

/**
 * Classify a single PGx phenotype row. Returns one of:
 *   'urgent' | 'important' | 'normal' | 'unknown'
 */
export function getPGxPhenotypePriority(geneCode, phenotypes) {
  const label = String(phenotypes?.[geneCode]?.label || '').trim()
  if (!label || label === '—') return 'unknown'
  // DPYD + TPMT default to urgent when non-normal, per spec.
  if (URGENT_GENES.has(geneCode) && !NORMAL_PHENOTYPE_RE.test(label)) return 'urgent'
  if (URGENT_PHENOTYPE_RE.test(label)) return 'urgent'
  if (AMBER_PHENOTYPE_RE.test(label))  return 'important'
  if (NORMAL_PHENOTYPE_RE.test(label)) return 'normal'
  return 'unknown'
}

/**
 * Tailwind border-color class for each priority bucket. Kept in one
 * place so the practitioner report and any future consumer stay in
 * visual sync.
 */
export const PRIORITY_BORDER_CLASS = {
  urgent:    'border-l-4 border-l-ss-red',
  important: 'border-l-4 border-l-ss-amber',
  normal:    'border-l-4 border-l-ss-green',
  standard:  '',
  unknown:   '',
}

/**
 * Human-readable label for each bucket (used in legends).
 */
export const PRIORITY_LABEL = {
  urgent:    'Urgent — discuss before prescribing',
  important: 'Important — note for dosing',
  standard:  'Standard — for awareness',
  normal:    'Normal metabolizer',
  unknown:   'Not resolved',
}
