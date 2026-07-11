// /lib/genomeClassifier.js
// SelfScience Step 1 — Deterministic genome classification engine.
//
// This module is the SINGLE SOURCE OF TRUTH for the badge on every genome
// card (Positive / Awareness / Neutral). It runs entirely locally, contains
// zero AI calls, and never depends on network I/O.
//
// Two-step architecture:
//   Step 1 (this file):
//     - Runs 10 haplotype classifiers for multi-SNP variants (APOE, MTHFR,
//       NAT2, CYP2D6, CYP2C19, FADS, COMT, Warfarin, ACTN3, SLC6A4).
//     - Looks up single-SNP variants in VARIANT_CLASSIFICATIONS.
//     - Emits a ClassifiedGenome object with variant list + pillar summary.
//   Step 2 (future prompt): AI plain-language rewriting only. The AI receives
//     the ClassifiedGenome and MUST NOT change any badge.
//
// Merge behaviour with the legacy /app/lib/variant-catalog.js:
//   - The classification badge is ALWAYS taken from Step 1 (new tables here).
//   - The card's `classification_text` prefers the legacy hand-curated
//     `plain[classification]` copy when it exists (37 fact-checked variants
//     including FOXO3, BCMO1, MTHFR, APOE, LCT, ...). Falls back to the
//     positive_text / awareness_text / neutral_text on the new table.
//   - The user explicitly requested this merge so they don't lose the
//     fact-checked text they signed off on.

import {
  runAllHaplotypes,
} from './haplotypeClassifiers'

import {
  VARIANT_CLASSIFICATIONS,
  getVariantClassification,
  getClassificationText,
} from './variantClassifications'

import { VARIANT_CATALOG, describeVariant } from './variant-catalog'

// rsIDs consumed by the haplotype classifiers. We must skip these in the
// single-SNP pass so we don't emit two cards for the same physical variant.
const HAPLOTYPE_RSIDS = new Set([
  // APOE
  'rs429358', 'rs7412',
  // MTHFR
  'rs1801133', 'rs1801131',
  // NAT2
  'rs1799930', 'rs1208', 'rs1801280', 'rs1799929', 'rs1041983',
  // CYP2D6
  'rs1065852', 'rs3892097', 'rs5030655', 'rs28371706', 'rs35742686',
  // CYP2C19
  'rs4244285', 'rs4986893', 'rs12248560',
  // FADS
  'rs174547', 'rs1535', 'rs174537', 'rs3834458',
  // COMT
  'rs4680', 'rs4818', 'rs4633',
  // Warfarin
  'rs9923231', 'rs1799853', 'rs1057910',
  // ACTN3
  'rs1815739',
  // SLC6A4
  'rs25531', 'rs2064070',
])

// Required rsIDs for each haplotype. If NONE of the listed rsIDs are present
// in the parsed genome we skip that haplotype entirely — some classifiers
// have insufficient-data branches that still return `classification: "neutral"`
// (a defaulting quirk of the source .ts) which would incorrectly show a
// "Typical" card for a variant the user never uploaded.
const HAPLOTYPE_REQUIRED_INPUTS = {
  apoe:    ['rs429358', 'rs7412'],
  mthfr:   ['rs1801133', 'rs1801131'],
  nat2:    ['rs1799930', 'rs1208', 'rs1801280', 'rs1799929', 'rs1041983'],
  cyp2d6:  ['rs1065852', 'rs3892097', 'rs5030655', 'rs28371706', 'rs35742686'],
  cyp2c19: ['rs4244285', 'rs4986893', 'rs12248560'],
  fads:    ['rs174547', 'rs1535', 'rs174537', 'rs3834458'],
  comt:    ['rs4680', 'rs4818', 'rs4633'],
  warfarin:['rs9923231', 'rs1799853', 'rs1057910'],
  actn3:   ['rs1815739'],
  slc6a4:  ['rs25531', 'rs2064070'],
}

// Map a haplotype key (e.g. 'apoe') back to the primary rsID used to look
// up the curated `plain` copy in variant-catalog.js. For a haplotype we use
// the "defining" rsID from the pair — the one that best encodes the result.
const HAPLOTYPE_TO_CATALOG_RSID = {
  apoe:    'rs429358',
  mthfr:   'rs1801133',
  fads:    'rs174537',
  comt:    'rs4680',
  actn3:   'rs1815739',
  slc6a4:  'rs25531',
  // nat2, cyp2d6, cyp2c19, warfarin have no legacy curated entries — use
  // the classifier's own text.
}

// Map classifier classification labels ('positive' | 'awareness' | 'neutral')
// to the shape used elsewhere in the app (Strength | Awareness | Neutral),
// and to the key used in variant-catalog.js `plain` objects.
export const CLASSIFICATION_TO_LEGACY = {
  positive:  'Strength',
  awareness: 'Awareness',
  neutral:   'Neutral',
  unknown:   'Neutral',
}
const CLASSIFICATION_TO_PLAIN_KEY = {
  positive:  'strength',
  awareness: 'awareness',
  neutral:   'neutral',
  unknown:   'neutral',
}

/** Try to find hand-curated plain text for a variant + classification.
 *  Returns null if we don't have a curated entry for that rsID/classification. */
function curatedPlain(rsid, classification, genotype) {
  const meta = VARIANT_CATALOG[rsid]
  if (!meta) return null
  const key = CLASSIFICATION_TO_PLAIN_KEY[classification]
  const text = meta.plain?.[key]
  if (text) return text
  // Fall back to the gene-aware describeVariant helper only for entries that
  // ARE in variant-catalog.js — otherwise let the new table provide the copy.
  return describeVariant(rsid, CLASSIFICATION_TO_LEGACY[classification], genotype)
}

/**
 * Classify a parsed genome. Deterministic. Zero AI calls.
 *
 * @param {Record<string,string>} genome Map of rsID → genotype string
 *   (e.g. { rs1801133: 'CT', rs4988235: 'TT' })
 * @returns {ClassifiedGenome}
 */
export function classifyGenome(genome) {
  const variants = []
  const unclassified = []

  // 1. Haplotype pass — build compound results first so single-SNP rsIDs
  //    consumed by them are skipped in the next pass.
  const haplotypes = runAllHaplotypes(genome)
  const haplotypeEntries = [
    { key: 'apoe',     result: haplotypes.apoe },
    { key: 'mthfr',    result: haplotypes.mthfr },
    { key: 'nat2',     result: haplotypes.nat2 },
    { key: 'cyp2d6',   result: haplotypes.cyp2d6 },
    { key: 'cyp2c19',  result: haplotypes.cyp2c19 },
    { key: 'fads',     result: haplotypes.fads },
    { key: 'comt',     result: haplotypes.comt },
    { key: 'warfarin', result: haplotypes.warfarin },
    { key: 'actn3',    result: haplotypes.actn3 },
    { key: 'slc6a4',   result: haplotypes.slc6a4 },
  ]
  for (const { key, result } of haplotypeEntries) {
    if (!result || result.classification === 'unknown') continue
    // Guard against classifier defaulting to "neutral" when no input rsIDs
    // were provided — some source classifiers have insufficient-data branches
    // that don't set classification back to "unknown". If NONE of the
    // required rsIDs are in the parsed genome, skip this haplotype card.
    const required = HAPLOTYPE_REQUIRED_INPUTS[key] || []
    const anyPresent = required.some((r) => Object.prototype.hasOwnProperty.call(genome, r))
    if (!anyPresent) continue
    // Prefer curated plain text keyed to the haplotype's primary rsID.
    const catalogRsid = HAPLOTYPE_TO_CATALOG_RSID[key]
    const curated = catalogRsid ? curatedPlain(catalogRsid, result.classification, result.haplotype) : null
    variants.push({
      rsid: catalogRsid || key,
      gene: (result.variants_used || '').split(',')[0].trim(),
      trait: result.label,
      pillar: result.pillar,
      genotype: result.haplotype || result.variants_used,
      classification: result.classification,
      classification_text: curated || result.detail,
      is_haplotype: true,
      haplotype_name: result.haplotype,
    })
  }

  // 2. Single-SNP pass — every rsID not consumed by a haplotype above.
  for (const [rsid, genotype] of Object.entries(genome)) {
    if (HAPLOTYPE_RSIDS.has(rsid)) continue

    const lookup = getVariantClassification(rsid, genotype)
    if (!lookup) { unclassified.push(rsid); continue }

    const { classification, entry } = lookup
    // Skip variant-table entries flagged as haplotype: true whose rsID
    // wasn't in HAPLOTYPE_RSIDS (defensive — shouldn't happen with our
    // current data, but future edits are safer).
    if (entry.haplotype && !HAPLOTYPE_RSIDS.has(rsid)) continue

    const curated = curatedPlain(rsid, classification, genotype)
    variants.push({
      rsid,
      gene: entry.gene,
      trait: entry.trait,
      pillar: entry.pillar,
      genotype,
      classification,
      classification_text: curated || getClassificationText(entry, classification),
      is_haplotype: false,
    })
  }

  // 3. Pillar summary — counts per pillar per classification.
  const pillar_summary = {}
  for (const v of variants) {
    if (!pillar_summary[v.pillar]) {
      pillar_summary[v.pillar] = { positive: 0, awareness: 0, neutral: 0, total: 0 }
    }
    const bucket = v.classification === 'positive'  ? 'positive'
                 : v.classification === 'awareness' ? 'awareness'
                 : 'neutral'
    pillar_summary[v.pillar][bucket]++
    pillar_summary[v.pillar].total++
  }

  return {
    variants,
    haplotypes,
    pillar_summary,
    variant_count: Object.keys(genome).length,
    classified_count: variants.length,
    unclassified_rsids: unclassified,
  }
}

// One-time module-load confirmation per team spec.
if (typeof console !== 'undefined') {
  console.log(
    'Step 1 classifier loaded. Variant table:',
    Object.keys(VARIANT_CLASSIFICATIONS).length,
    'entries, Haplotype functions: 10'
  )
}
