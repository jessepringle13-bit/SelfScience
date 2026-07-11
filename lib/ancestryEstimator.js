// /app/lib/ancestryEstimator.js
// SelfScience — Naive maximum-likelihood ancestry composition estimator.
//
// Given the user's classified variants (from the standard genome analysis
// report), we compute the Hardy–Weinberg probability of observing each
// genotype in each of five 1000 Genomes superpopulations (AFR / AMR / EAS /
// EUR / SAS), multiply those probabilities across all informative variants
// (in log-space to avoid underflow), and normalise to a posterior with a
// uniform prior. The result is a percentage across the five groups.
//
// IMPORTANT — this is a very rough educational tool:
//   * Only well-characterised, geographically stratified rsIDs contribute
//     signal. Anything that looks the same across all five populations
//     (e.g. an allele frequency of 0.3 everywhere) adds essentially zero
//     evidence, so more variants ≠ better answer unless they are actually
//     informative.
//   * Real ancestry services use 700k+ SNPs, IBD segments, PCA against
//     labeled reference panels, and admixture inference. This function
//     touches at most ~40 SNPs — treat the output as directional, not
//     definitive.
//
// The confidence label surfaced in the UI is deliberately blunt about
// this — see summariseConfidence() below.

import { collectRawGenotypeRows } from './genomeCards'
import {
  computeGenotypeStats,
  getPopulationDetail,
  SUPERPOPULATIONS,
  POP_CODES,
} from './populationDetailFrequencies'

// A tiny epsilon so log(0) never blows up when a population has literally
// zero recorded copies of an allele (e.g. rs671 A in most non-EAS pops).
const EPS = 1e-6

/**
 * Score every informative variant against each superpopulation and return
 * the aggregate posterior + per-variant contributions.
 *
 * @param {object} report — parsed genome result object from sessionStorage
 * @returns {object|null}  null when we have no informative variants
 */
export function estimateAncestry(report) {
  const rawRows = collectRawGenotypeRows(report)
  if (!rawRows.length) return null

  // Log-likelihood accumulator per population.
  const logLikes = Object.fromEntries(POP_CODES.map((c) => [c, 0]))
  const contributions = []

  let informativeCount = 0

  for (const r of rawRows) {
    const stats = computeGenotypeStats(r.rsid, r.rawGenotype)
    if (!stats) continue
    const detail = getPopulationDetail(r.rsid)
    if (!detail) continue

    // "Informative" = the ratio between the most-common and least-common
    // population genotype frequency is at least 2×. This filters out
    // variants that are near-uniform across the globe and would just be
    // noise on the composition bar.
    const gv = POP_CODES.map((code) => Math.max(EPS, stats.perPopulation[code] ?? EPS))
    const gMax = Math.max(...gv)
    const gMin = Math.min(...gv)
    const informative = gMax / gMin >= 2

    if (informative) informativeCount += 1

    // Even non-informative variants still contribute equally to every
    // population (their log-likelihoods cancel on normalisation), so we
    // don't have to exclude them from the sum — but tracking the count
    // lets us surface an honest confidence label.
    for (const code of POP_CODES) {
      const p = Math.max(EPS, stats.perPopulation[code] ?? EPS)
      logLikes[code] += Math.log(p)
    }

    contributions.push({
      rsid: r.rsid,
      gene: r.gene || '',
      trait: r.trait || '',
      genotype: stats.genotype,
      copies: stats.copies,
      informative,
      perPopulation: stats.perPopulation,
      // Best-guess population purely from this one variant.
      topPopulation: pickMax(stats.perPopulation),
    })
  }

  // Nothing to work with (e.g. an empty genome or all variants missing
  // from the population data table).
  if (contributions.length === 0) return null

  // Normalise log-likelihoods into a probability distribution. Using the
  // log-sum-exp trick keeps things numerically stable.
  const maxLog = Math.max(...POP_CODES.map((c) => logLikes[c]))
  const rescaled = Object.fromEntries(
    POP_CODES.map((c) => [c, Math.exp(logLikes[c] - maxLog)]),
  )
  const total = Object.values(rescaled).reduce((s, v) => s + v, 0)
  const composition = Object.fromEntries(
    POP_CODES.map((c) => [c, rescaled[c] / total]),
  )

  // Sort populations by their share, descending, so the UI can render a
  // ranked list.
  const ranking = POP_CODES
    .map((code) => ({
      code,
      share: composition[code],
      meta: SUPERPOPULATIONS.find((p) => p.code === code),
    }))
    .sort((a, b) => b.share - a.share)

  return {
    composition,          // { AFR: 0.14, ... } summing to 1
    ranking,              // [{code, share, meta}, ...]
    topPopulation: ranking[0]?.code,
    variantCount: contributions.length,
    informativeCount,
    contributions,        // per-variant detail for the "Which variants said what" section
    confidence: summariseConfidence(informativeCount),
  }
}

/**
 * Honest, blunt confidence label. We only claim "reliable" once we have
 * enough informative variants that a single outlier can't dominate.
 */
function summariseConfidence(informativeCount) {
  if (informativeCount >= 25) {
    return {
      level: 'moderate',
      label: 'Moderate — directional signal',
      blurb: 'Enough informative variants for a rough regional picture, but far from clinical ancestry inference.',
    }
  }
  if (informativeCount >= 10) {
    return {
      level: 'low',
      label: 'Low — indicative only',
      blurb: 'A handful of informative variants — treat this as an educational sketch, not identity.',
    }
  }
  return {
    level: 'very-low',
    label: 'Very low — exploratory',
    blurb: 'Fewer than 10 informative variants. A single unusual genotype can swing this substantially.',
  }
}

function pickMax(perPopulation) {
  let top = null
  for (const c of POP_CODES) {
    const v = perPopulation[c]
    if (v == null) continue
    if (top == null || v > perPopulation[top]) top = c
  }
  return top
}
