// /app/lib/genomeCards.js
// SelfScience — Helpers that pair the RAW parsed genome (report._variants,
// a map of rsid → genotype string) with the DISPLAY metadata on classified
// variant cards (gene, trait, pillar, classification).
//
// Why this exists: for haplotype-grouped positions (COMT, APOE, MTHFR, …)
// the classifier emits cards whose `genotype` field is a status label like
// "val_val" or "e3/e4" — great for the main report UI, terrible for anything
// downstream that needs to interpret raw alleles (Hardy–Weinberg maths,
// strand normalisation, population-frequency lookups). Those callers must
// go straight to report._variants for the raw two-base call.

import { flattenReportCards } from './supplementProtocol'

/**
 * Build a lookup table keyed by rsID containing the classified card's
 * display metadata. First-write-wins so richer overview cards outrank
 * pillar-only cards when both exist for the same rsID.
 */
function buildCardIndex(report) {
  const idx = {}
  for (const c of flattenReportCards(report)) {
    if (!c?.rsid) continue
    if (!idx[c.rsid]) idx[c.rsid] = c
  }
  return idx
}

/**
 * Return one row per rsID from the raw parsed genome (report._variants),
 * pairing each raw genotype with its classified-card metadata when we have
 * one. This is the correct source for any code that needs to *interpret*
 * a raw genotype (strand-normalise it, count allele copies, do Hardy–
 * Weinberg maths).
 *
 * Each row: { rsid, rawGenotype, gene, trait, pillar, classification }
 *
 * Callers that don't care about metadata can just iterate report._variants
 * directly — this helper mainly saves them from doing the index build.
 */
export function collectRawGenotypeRows(report) {
  if (!report) return []
  const raw = report._variants || {}
  const idx = buildCardIndex(report)
  const rows = []
  for (const [rsid, genotype] of Object.entries(raw)) {
    if (!genotype || typeof genotype !== 'string') continue
    const card = idx[rsid] || {}
    rows.push({
      rsid,
      rawGenotype: genotype,
      gene: card.gene || '',
      trait: card.trait || card.name || '',
      pillar: card.pillar || '',
      classification: card.classification || 'neutral',
    })
  }
  return rows
}
