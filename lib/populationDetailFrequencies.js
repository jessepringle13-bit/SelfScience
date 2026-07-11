// /app/lib/populationDetailFrequencies.js
// SelfScience — Per-superpopulation allele frequencies for Population Compare.
//
// Each entry stores the allele the app treats as the "reported" allele
// (typically the risk / minor allele from the interpretation), plus its
// frequency across the five 1000 Genomes / gnomAD v3 superpopulations:
//
//   AFR  African / African American
//   AMR  Latino / Admixed American
//   EAS  East Asian
//   EUR  European
//   SAS  South Asian
//
// Values are decimals in [0,1]. Rounded from gnomAD v3/v4 pop-level
// frequencies where confidently known; well-known 1000 Genomes literature
// values elsewhere. Any variant not present in this map is not shown in the
// Population Compare view (caller should hide it) — we fail loud rather than
// display a flat / fabricated distribution.

export const POPULATION_ALLELE_FREQUENCIES = {
  // ── Methylation / one-carbon ─────────────────────────────────────────────
  rs1801133: { allele: 'T', ref: 'C', global: 0.32,
    populations: { AFR: 0.11, AMR: 0.45, EAS: 0.28, EUR: 0.36, SAS: 0.17 } },
  rs1801131: { allele: 'C', ref: 'A', global: 0.24,
    populations: { AFR: 0.16, AMR: 0.20, EAS: 0.19, EUR: 0.32, SAS: 0.36 } },
  rs1805087: { allele: 'G', ref: 'A', global: 0.19,
    populations: { AFR: 0.28, AMR: 0.18, EAS: 0.15, EUR: 0.20, SAS: 0.12 } },
  rs602662:  { allele: 'A', ref: 'G', global: 0.42,
    populations: { AFR: 0.55, AMR: 0.42, EAS: 0.06, EUR: 0.50, SAS: 0.45 } },

  // ── Neurotransmitter / cognition ─────────────────────────────────────────
  rs4680:    { allele: 'A', ref: 'G', global: 0.42,
    populations: { AFR: 0.30, AMR: 0.45, EAS: 0.30, EUR: 0.48, SAS: 0.44 } },
  rs25531:   { allele: 'G', ref: 'A', global: 0.10,
    populations: { AFR: 0.24, AMR: 0.09, EAS: 0.05, EUR: 0.08, SAS: 0.10 } },

  // ── Nutrition / metabolism ───────────────────────────────────────────────
  // Lactase persistence — one of the most population-stratified traits in humans.
  rs4988235: { allele: 'T', ref: 'C', global: 0.32,
    populations: { AFR: 0.05, AMR: 0.34, EAS: 0.005, EUR: 0.55, SAS: 0.20 } },
  rs182549:  { allele: 'T', ref: 'C', global: 0.32,
    populations: { AFR: 0.05, AMR: 0.34, EAS: 0.005, EUR: 0.55, SAS: 0.20 } },
  rs762551:  { allele: 'C', ref: 'A', global: 0.32,
    populations: { AFR: 0.31, AMR: 0.30, EAS: 0.34, EUR: 0.32, SAS: 0.30 } },
  // ALDH2*2 — the classic East Asian alcohol flush variant.
  rs671:     { allele: 'A', ref: 'G', global: 0.07,
    populations: { AFR: 0.001, AMR: 0.010, EAS: 0.30, EUR: 0.001, SAS: 0.02 } },
  // ADH1B*2 — fast alcohol metabolism; heavily East Asian / South Asian.
  rs1229984: { allele: 'A', ref: 'G', global: 0.15,
    populations: { AFR: 0.003, AMR: 0.20, EAS: 0.70, EUR: 0.02, SAS: 0.30 } },
  rs9939609: { allele: 'A', ref: 'T', global: 0.36,
    populations: { AFR: 0.51, AMR: 0.35, EAS: 0.15, EUR: 0.43, SAS: 0.31 } },
  rs17782313:{ allele: 'C', ref: 'T', global: 0.24,
    populations: { AFR: 0.14, AMR: 0.28, EAS: 0.20, EUR: 0.26, SAS: 0.32 } },
  rs1801282: { allele: 'G', ref: 'C', global: 0.12,
    populations: { AFR: 0.02, AMR: 0.12, EAS: 0.05, EUR: 0.13, SAS: 0.09 } },
  rs7903146: { allele: 'T', ref: 'C', global: 0.24,
    populations: { AFR: 0.29, AMR: 0.24, EAS: 0.03, EUR: 0.30, SAS: 0.28 } },

  // ── Vitamins ─────────────────────────────────────────────────────────────
  rs2282679: { allele: 'C', ref: 'A', global: 0.28,
    populations: { AFR: 0.08, AMR: 0.30, EAS: 0.28, EUR: 0.30, SAS: 0.31 } },
  rs4588:    { allele: 'A', ref: 'C', global: 0.28,
    populations: { AFR: 0.08, AMR: 0.30, EAS: 0.28, EUR: 0.30, SAS: 0.31 } },
  rs2228570: { allele: 'T', ref: 'C', global: 0.40,
    populations: { AFR: 0.65, AMR: 0.42, EAS: 0.48, EUR: 0.38, SAS: 0.38 } },

  // ── Iron ────────────────────────────────────────────────────────────────
  // HFE C282Y — strongly Northern European.
  rs1800562: { allele: 'A', ref: 'G', global: 0.03,
    populations: { AFR: 0.0016, AMR: 0.026, EAS: 0.00005, EUR: 0.058, SAS: 0.005 } },
  rs1799945: { allele: 'G', ref: 'C', global: 0.11,
    populations: { AFR: 0.03, AMR: 0.10, EAS: 0.05, EUR: 0.14, SAS: 0.11 } },

  // ── Cardiovascular ──────────────────────────────────────────────────────
  // APOE ε4-defining variant.
  rs429358:  { allele: 'C', ref: 'T', global: 0.14,
    populations: { AFR: 0.22, AMR: 0.11, EAS: 0.09, EUR: 0.14, SAS: 0.10 } },
  // APOE ε2-defining variant.
  rs7412:    { allele: 'T', ref: 'C', global: 0.08,
    populations: { AFR: 0.10, AMR: 0.06, EAS: 0.09, EUR: 0.07, SAS: 0.05 } },
  rs11591147:{ allele: 'T', ref: 'G', global: 0.015,
    populations: { AFR: 0.007, AMR: 0.01, EAS: 0.001, EUR: 0.019, SAS: 0.006 } },
  rs708272:  { allele: 'G', ref: 'A', global: 0.42,
    populations: { AFR: 0.32, AMR: 0.42, EAS: 0.45, EUR: 0.42, SAS: 0.45 } },

  // ── Sleep / circadian ───────────────────────────────────────────────────
  rs10830963:{ allele: 'G', ref: 'C', global: 0.28,
    populations: { AFR: 0.06, AMR: 0.24, EAS: 0.44, EUR: 0.28, SAS: 0.30 } },
  rs1801260: { allele: 'C', ref: 'T', global: 0.30,
    populations: { AFR: 0.44, AMR: 0.30, EAS: 0.20, EUR: 0.30, SAS: 0.31 } },

  // ── Sports performance ──────────────────────────────────────────────────
  // ACTN3 R577X — famous "sprint gene" — highly variable across populations.
  rs1815739: { allele: 'T', ref: 'C', global: 0.42,
    populations: { AFR: 0.10, AMR: 0.51, EAS: 0.55, EUR: 0.42, SAS: 0.53 } },
  rs4253778: { allele: 'C', ref: 'G', global: 0.20,
    populations: { AFR: 0.11, AMR: 0.20, EAS: 0.16, EUR: 0.23, SAS: 0.21 } },
  rs8192678: { allele: 'A', ref: 'G', global: 0.30,
    populations: { AFR: 0.19, AMR: 0.36, EAS: 0.45, EUR: 0.30, SAS: 0.28 } },

  // ── Detox ───────────────────────────────────────────────────────────────
  rs1695:    { allele: 'G', ref: 'A', global: 0.32,
    populations: { AFR: 0.42, AMR: 0.32, EAS: 0.18, EUR: 0.33, SAS: 0.30 } },
  rs1050450: { allele: 'T', ref: 'C', global: 0.31,
    populations: { AFR: 0.20, AMR: 0.29, EAS: 0.32, EUR: 0.34, SAS: 0.30 } },
  rs1799930: { allele: 'A', ref: 'G', global: 0.30,
    populations: { AFR: 0.27, AMR: 0.31, EAS: 0.24, EUR: 0.33, SAS: 0.28 } },
  rs1801280: { allele: 'C', ref: 'T', global: 0.44,
    populations: { AFR: 0.36, AMR: 0.44, EAS: 0.31, EUR: 0.46, SAS: 0.40 } },

  // ── Pharmacogenomics ────────────────────────────────────────────────────
  // CYP2C19*2 — meaningfully more common in East / South Asian.
  rs4244285: { allele: 'A', ref: 'G', global: 0.20,
    populations: { AFR: 0.16, AMR: 0.10, EAS: 0.31, EUR: 0.15, SAS: 0.36 } },
  rs4986893: { allele: 'A', ref: 'G', global: 0.02,
    populations: { AFR: 0.005, AMR: 0.003, EAS: 0.07, EUR: 0.0001, SAS: 0.008 } },
  // CYP2C19*17 — rapid metabolizer, higher in African / European.
  rs12248560:{ allele: 'T', ref: 'C', global: 0.16,
    populations: { AFR: 0.19, AMR: 0.11, EAS: 0.02, EUR: 0.22, SAS: 0.14 } },
  // CYP2D6*4.
  rs3892097: { allele: 'A', ref: 'G', global: 0.14,
    populations: { AFR: 0.07, AMR: 0.12, EAS: 0.005, EUR: 0.19, SAS: 0.11 } },
  rs1065852: { allele: 'A', ref: 'G', global: 0.24,
    populations: { AFR: 0.09, AMR: 0.19, EAS: 0.55, EUR: 0.20, SAS: 0.14 } },
  // VKORC1 — huge East Asian skew (warfarin dosing implication).
  rs9923231: { allele: 'T', ref: 'C', global: 0.40,
    populations: { AFR: 0.11, AMR: 0.40, EAS: 0.90, EUR: 0.40, SAS: 0.14 } },
  // CYP2C9*2 and *3 — mostly EUR / SAS.
  rs1799853: { allele: 'T', ref: 'C', global: 0.08,
    populations: { AFR: 0.006, AMR: 0.12, EAS: 0.005, EUR: 0.13, SAS: 0.05 } },
  rs1057910: { allele: 'C', ref: 'A', global: 0.05,
    populations: { AFR: 0.010, AMR: 0.05, EAS: 0.02, EUR: 0.08, SAS: 0.10 } },

  // ── Immune / gut ────────────────────────────────────────────────────────
  rs11209026:{ allele: 'A', ref: 'G', global: 0.05,
    populations: { AFR: 0.001, AMR: 0.06, EAS: 0.0001, EUR: 0.06, SAS: 0.03 } },
}

// Human-readable population metadata for the UI.
export const SUPERPOPULATIONS = [
  { code: 'AFR', name: 'African',        blurb: 'Sub-Saharan African & African-American cohorts',      color: '#B45309' }, // amber-700
  { code: 'AMR', name: 'Latino / Admixed', blurb: 'Latino / Admixed American cohorts (mixed ancestry)', color: '#0E7490' }, // cyan-700
  { code: 'EAS', name: 'East Asian',     blurb: 'Han Chinese, Japanese, Vietnamese, Korean cohorts',   color: '#9D174D' }, // pink-800
  { code: 'EUR', name: 'European',       blurb: 'Non-Finnish & Finnish European cohorts',              color: '#1E40AF' }, // blue-800
  { code: 'SAS', name: 'South Asian',    blurb: 'Indian, Pakistani, Bangladeshi, Sri Lankan cohorts',  color: '#166534' }, // green-800
]

export const POP_CODES = SUPERPOPULATIONS.map((p) => p.code)

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getPopulationDetail(rsid) {
  if (!rsid) return null
  return POPULATION_ALLELE_FREQUENCIES[rsid] || null
}

/**
 * Given an rsID and a two-character genotype string (e.g. "CT"), figure out
 * how many copies of the reported allele the caller carries (0, 1, 2), the
 * expected Hardy–Weinberg genotype frequency in each superpopulation, and
 * the corresponding global frequency.
 *
 * Handles reverse-strand calls: raw consumer files (AncestryDNA / some
 * 23andMe positions) may report the same SNP on the minus strand, so e.g. a
 * C/T variant can appear as "AG" (A ↔ T, G ↔ C). We try the direct read
 * first and only fall back to complementation when the raw bases don't
 * match the ref/alt on the reported strand.
 *
 * Returns null when we either lack population data for the rsID or cannot
 * parse the genotype at all.
 */
const _COMPLEMENT = { A: 'T', T: 'A', C: 'G', G: 'C' }

export function computeGenotypeStats(rsid, genotype) {
  const detail = getPopulationDetail(rsid)
  if (!detail) return null
  if (!genotype || typeof genotype !== 'string') return null

  // Normalize a raw call like "C/T", "CT", "TC" or "C;T" into two
  // uppercase base letters. Anything that isn't a base letter (e.g. the
  // status-string genotype some haplotype classifiers emit — "val_val" —
  // or "--" for no-call) is stripped, so short-circuit here if we don't
  // have exactly two clean bases.
  const chars = genotype.toUpperCase().replace(/[^ACGT]/g, '')
  if (chars.length !== 2) return null
  let [a1, a2] = chars.split('')

  const altAllele = detail.allele.toUpperCase()
  const refAllele = detail.ref.toUpperCase()
  const isBase = (b) => b === altAllele || b === refAllele

  // Direct read — the bases match the ref/alt on the forward strand.
  if (!isBase(a1) || !isBase(a2)) {
    // Reverse-strand fallback — try complementing both bases and see if
    // that lines up with ref/alt. Only accept the flip if BOTH bases
    // survive; anything else is truly unparseable for this rsID.
    const c1 = _COMPLEMENT[a1]
    const c2 = _COMPLEMENT[a2]
    if (c1 && c2 && isBase(c1) && isBase(c2)) {
      a1 = c1
      a2 = c2
    } else {
      return null
    }
  }

  // Count how many copies of the reported (alt) allele are present (0, 1, 2).
  let copies = 0
  for (const b of [a1, a2]) if (b === altAllele) copies += 1

  // Hardy–Weinberg: freq(genotype) given allele freq p in each population.
  const genoFreqAt = (p) => {
    if (copies === 2) return p * p                 // homozygous alt
    if (copies === 0) return (1 - p) * (1 - p)     // homozygous ref
    return 2 * p * (1 - p)                         // heterozygous
  }

  const perPopulation = {}
  for (const code of POP_CODES) {
    const p = detail.populations[code]
    perPopulation[code] = p == null ? null : genoFreqAt(p)
  }
  const globalGenotypeFreq = genoFreqAt(detail.global)

  // "Percentile rarity" — the share of the global population that does NOT
  // carry the user's genotype. 1.0 means literally unique; 0.0 means everyone
  // has it. We floor at 0 for numerical safety.
  const rarity = Math.max(0, 1 - globalGenotypeFreq)

  // Which population is this genotype most / least common in?
  let mostCommon = null
  let leastCommon = null
  for (const code of POP_CODES) {
    const v = perPopulation[code]
    if (v == null) continue
    if (mostCommon == null || v > perPopulation[mostCommon]) mostCommon = code
    if (leastCommon == null || v < perPopulation[leastCommon]) leastCommon = code
  }

  return {
    rsid,
    genotype: `${a1}${a2}`,
    altAllele,
    refAllele,
    copies,
    zygosity: copies === 2 ? 'homozygous_alt' : copies === 0 ? 'homozygous_ref' : 'heterozygous',
    perPopulation,          // { AFR: 0.xx, ... } — expected % of pop with this genotype
    globalGenotypeFreq,
    rarity,
    mostCommon,
    leastCommon,
  }
}

/**
 * Format a decimal (0–1) as a display string: 48.2% or 0.6%.
 */
export function formatPct(f) {
  if (f == null || Number.isNaN(f)) return '—'
  const pct = f * 100
  if (pct < 1) return pct.toFixed(2) + '%'
  if (pct < 10) return pct.toFixed(1) + '%'
  return Math.round(pct) + '%'
}
