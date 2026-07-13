// /app/lib/biomarkers/genomeMatch.js
//
// Cross-reference a user's parsed genome (from sessionStorage) against
// the curated SNP→biomarker library. Returns per-biomarker matches with
// each match's genotype-specific interpretation.
//
// The genome parser produces a flattened array of variant cards. This
// module reuses that shape rather than reaching into raw VCF/txt data,
// so it works uniformly across 23andMe, Ancestry, MyHeritage, and
// Nebula VCF inputs.

import { flattenReportCards } from '../supplementProtocol'
import { SNP_ASSOCIATIONS } from './snps'

/** Normalize a raw genotype string like "C/T" or "CT" to a sorted 2-char code. */
function normalizeGenotype(gt) {
  if (!gt) return null
  const cleaned = String(gt).toUpperCase().replace(/[^A-Z]/g, '')
  if (!cleaned) return null
  if (cleaned.length === 1) return cleaned + cleaned // hemizygous shortcut
  if (cleaned.length === 2) return [...cleaned].sort().join('')
  return cleaned
}

/** Count how many risk alleles appear in the (normalized) genotype. */
function riskAlleleCount(gt, riskAlleles = []) {
  if (!gt || !riskAlleles.length) return 0
  const set = new Set(riskAlleles.map((a) => a.toUpperCase()))
  return [...gt].filter((c) => set.has(c)).length
}

/** Given a report, return `{ [rsid]: { genotype, gene } }` map. */
export function buildGenomeIndex(report) {
  if (!report) return {}
  const cards = flattenReportCards(report) || []
  const idx = {}
  for (const c of cards) {
    if (!c?.rsid) continue
    idx[c.rsid.toLowerCase()] = { genotype: c.genotype || null, gene: c.gene || null, raw: c }
  }
  return idx
}

/**
 * Attempt to match a single SNP association against the index. Returns a
 * match object (or null if the user's kit didn't cover this rsID).
 *
 * Match shape:
 *   {
 *     assoc,        // full association from SNP_ASSOCIATIONS
 *     genotype,     // sorted 2-char (e.g. "CT")
 *     riskCount,    // 0 / 1 / 2
 *     zygosity,     // 'none' | 'heterozygous' | 'homozygous'
 *     effectText,   // effectByGenotype string appropriate to zygosity
 *   }
 */
export function matchAssociation(assoc, index) {
  const idx = index[assoc.rsid?.toLowerCase()] ||
              (assoc.alt_rsid ? index[assoc.alt_rsid.toLowerCase()] : null)
  if (!idx || !idx.genotype) return null
  const gt = normalizeGenotype(idx.genotype)
  if (!gt) return null
  const riskCount = riskAlleleCount(gt, assoc.riskAlleles)
  const zygosity = riskCount === 0 ? 'none' : riskCount === 1 ? 'heterozygous' : 'homozygous'
  const effectText =
    zygosity === 'homozygous'   ? assoc.effectByGenotype.homozygous
    : zygosity === 'heterozygous' ? assoc.effectByGenotype.heterozygous
    : `${gt}: no risk allele detected — baseline / reference genotype for this variant.`
  return { assoc, genotype: gt, riskCount, zygosity, effectText }
}

/**
 * Return every match for a biomarker id, filtered to those the user's
 * kit actually reports on. Matches are sorted: risk-carrying first,
 * then by evidence strength (High → Moderate → Emerging).
 */
export function matchesForBiomarker(biomarkerId, report) {
  if (!biomarkerId) return []
  const index = buildGenomeIndex(report)
  if (Object.keys(index).length === 0) return []
  const strengthRank = { High: 0, Moderate: 1, Emerging: 2 }
  return SNP_ASSOCIATIONS
    .filter((a) => a.biomarkerIds.includes(biomarkerId))
    .map((a) => matchAssociation(a, index))
    .filter(Boolean)
    .sort((a, b) => {
      // risk-carrying first
      if ((a.riskCount > 0) !== (b.riskCount > 0)) return a.riskCount > 0 ? -1 : 1
      // then by evidence strength
      return (strengthRank[a.assoc.evidenceStrength] ?? 9) - (strengthRank[b.assoc.evidenceStrength] ?? 9)
    })
}

/**
 * Cross-biomarker summary for the sidebar. Groups all risk-carrying
 * matches by biomarker so users can see the aggregate genome→biomarker
 * picture at a glance.
 */
export function summarizeMatches(report) {
  const index = buildGenomeIndex(report)
  if (Object.keys(index).length === 0) {
    return { total: 0, coveredBiomarkers: [], riskCarrying: [], allMatches: [] }
  }
  const allMatches = SNP_ASSOCIATIONS
    .map((a) => matchAssociation(a, index))
    .filter(Boolean)
  const riskCarrying = allMatches.filter((m) => m.riskCount > 0)
  const biomarkerSet = new Set()
  for (const m of allMatches) for (const bid of m.assoc.biomarkerIds) biomarkerSet.add(bid)
  return {
    total: allMatches.length,
    coveredBiomarkers: [...biomarkerSet],
    riskCarrying,
    allMatches,
  }
}
