'use client'

// /app/lib/ancestryFrequencies.js
// Population Intelligence — ancestry-broken-down frequency data +
// rarity helpers + combination-probability estimator.
//
// Kept separate from /app/lib/populationFrequencies.js so the existing
// callers of that file (which store only global frequencies) are not
// disturbed. This module is additive.

import { getPopulationFrequency } from '@/lib/populationFrequencies'

/* ------------------------- Population labels ------------------------ */
export const ANCESTRY_LABELS = [
  { key: 'african',      label: 'African / African American' },
  { key: 'ashkenazi',    label: 'Ashkenazi Jewish' },
  { key: 'east_asian',   label: 'East Asian' },
  { key: 'finnish',      label: 'Finnish' },
  { key: 'latino',       label: 'Latino / Admixed American' },
  { key: 'nf_european',  label: 'Non-Finnish European' },
  { key: 'south_asian',  label: 'South Asian' },
  { key: 'other',        label: 'Other' },
]

/* ------------------------- Priority variant data -------------------- */
// Percentages (0–100) per gnomAD v3.1.2. Values match the product spec
// verbatim. Keyed by rsID; each row also stores the genotype these
// values apply to (used for display context).
export const ANCESTRY_FREQUENCIES = {
  rs1801133: { genotype: 'AG', global: 38, african: 10, ashkenazi: 42, east_asian: 32, finnish: 35, latino: 52, nf_european: 40, south_asian: 25, other: 30 },
  rs1801131: { genotype: 'GT', global: 31, african: 15, ashkenazi: 36, east_asian: 20, finnish: 28, latino: 35, nf_european: 34, south_asian: 22, other: 26 },
  rs8192678: { genotype: 'CC', global: 38, african: 65, ashkenazi: 30, east_asian: 28, finnish: 32, latino: 42, nf_european: 35, south_asian: 30, other: 40 },
  rs12722:   { genotype: 'TT', global: 23, african: 18, ashkenazi: 25, east_asian: 20, finnish: 22, latino: 28, nf_european: 24, south_asian: 19, other: 21 },
  rs10830963:{ genotype: 'GG', global: 12, african: 6,  ashkenazi: 14, east_asian: 28, finnish: 15, latino: 10, nf_european: 13, south_asian: 16, other: 11 },
  rs4253778: { genotype: 'GG', global: 72, african: 85, ashkenazi: 70, east_asian: 68, finnish: 71, latino: 74, nf_european: 72, south_asian: 69, other: 70 },
  rs1360780: { genotype: 'CT', global: 35, african: 28, ashkenazi: 37, east_asian: 22, finnish: 34, latino: 30, nf_european: 38, south_asian: 25, other: 31 },
  rs174547:  { genotype: 'TT', global: 28, african: 12, ashkenazi: 30, east_asian: 18, finnish: 29, latino: 25, nf_european: 32, south_asian: 20, other: 24 },
  rs1815739: { genotype: 'TT', global: 18, african: 3,  ashkenazi: 20, east_asian: 25, finnish: 18, latino: 16, nf_european: 18, south_asian: 24, other: 17 },
  rs4680:    { genotype: 'GG', global: 26, african: 22, ashkenazi: 28, east_asian: 48, finnish: 25, latino: 30, nf_european: 26, south_asian: 32, other: 27 },
}

export function getAncestryData(rsid) {
  if (!rsid) return null
  return ANCESTRY_FREQUENCIES[rsid] || null
}

/* ------------------------- Rarity math ------------------------------ */
// Rarity tiers by percentage carrying the user's specific genotype.
// Uses the ranges from the product spec.
export function rarityTier(percent) {
  if (percent == null) return 'unknown'
  if (percent < 15)  return 'rare'
  if (percent < 51)  return 'moderate'
  return 'common'
}
export const RARITY_META = {
  rare:     { label: 'Rare',     colorHex: '#964219', word: 'Rare' },
  moderate: { label: 'Moderate', colorHex: '#1B474D', word: 'Uncommon' },
  common:   { label: 'Common',   colorHex: '#2E7D32', word: 'Common' },
  unknown:  { label: 'Unknown',  colorHex: '#7A7974', word: '—' },
}

export function rarityStatement(percent) {
  if (percent == null || Number.isNaN(percent)) return ''
  if (percent <= 5)  return 'This is a rare variant — fewer than 1 in 20 people carry it.'
  if (percent <= 15) {
    const one_in = Math.round(100 / Math.max(6, percent))
    return `This is an uncommon variant — roughly 1 in ${Math.max(7, one_in)} people carry it.`
  }
  if (percent <= 35) {
    const one_in = Math.max(3, Math.round(100 / percent))
    return `This variant is moderately common — about 1 in ${one_in} people carry it.`
  }
  if (percent <= 65) return `This variant is common — carried by roughly ${Math.round(percent)}% of people.`
  if (percent <= 85) return 'This is a very common variant — most people carry it.'
  return 'Nearly everyone carries this variant.'
}

export function shortRarityWord(percent) {
  if (percent == null) return '—'
  if (percent < 15) return 'Rare'
  if (percent < 35) return 'Uncommon'
  if (percent < 65) return 'Common'
  return 'Very common'
}

/* ------------------------- Global freq resolver --------------------- */
// Returns the best available global frequency (0–100) for a card.
// Falls back to the existing populationFrequencies allele-level table
// (converted to a percentage) when the variant isn't in the priority
// ancestry table. If neither exists, returns null so the caller can
// hide the block gracefully.
export function globalFrequencyPercent(card) {
  if (!card?.rsid) return null
  const a = getAncestryData(card.rsid)
  if (a) return a.global
  const allele = getPopulationFrequency(card.rsid)
  if (allele == null) return null
  // Allele table is 0-1 decimal for the risk/alt allele. This is an
  // approximation for carrier percentage (not exact HWE), but good
  // enough for the 'how common' educational block. Round to whole %
  // for consistency with the priority table's granularity.
  return Math.round(allele * 100)
}

/* ------------------------- Combination probability ----------------- */
// Multiplies the global percentages (as decimals) of every provided
// variant. Returns { oneIn, orderOfMagnitude } where oneIn is a nice
// rounded 1-in-N number. Uses the spec's independence assumption.
export function combinationProbability(cards) {
  const percents = []
  for (const c of cards) {
    const p = globalFrequencyPercent(c)
    if (p == null || p <= 0) continue
    percents.push(p / 100)
  }
  if (!percents.length) return null
  // Product of percents = probability. Round to nearest order of
  // magnitude for display so we don't imply false precision.
  let logSum = 0
  for (const p of percents) logSum += Math.log10(p)
  const oneIn = Math.pow(10, -logSum)
  const rounded = Math.pow(10, Math.round(Math.log10(oneIn)))
  return { oneIn: rounded, exact: oneIn, count: percents.length }
}

export function formatOneIn(n) {
  if (!Number.isFinite(n) || n < 1) return '—'
  // Format with commas.
  return Math.round(n).toLocaleString()
}
