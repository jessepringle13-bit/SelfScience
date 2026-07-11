// /app/lib/populationFrequencies.js
// SelfScience — Static per-rsID global allele frequencies.
//
// Frequencies are gnomAD-style GLOBAL frequencies for the risk/alt allele
// discussed in the app's interpretation (typically the minor allele). Value
// is stored as a decimal between 0 and 1 — formatFrequency() converts it to
// a display percentage.
//
// NOTE ON DATA REVIEW: Values below reflect published gnomAD v3/v4 global
// estimates where confidently known; some are literature-derived estimates
// where gnomAD numbers vary substantially by population. Any value flagged
// with `// estimate` should be re-verified against the latest gnomAD
// release before high-stakes use. Nothing here is a medical claim.

export const POPULATION_FREQUENCIES = {
  // ---- Methylation / one-carbon ----
  rs1801133: 0.32,   // MTHFR C677T (T allele global) — well characterized
  rs1801131: 0.31,   // MTHFR A1298C (C allele)
  rs1805087: 0.19,   // MTR A2756G (G allele)
  rs1801394: 0.44,   // MTRR A66G (G allele) — estimate
  rs602662:  0.42,   // FUT2 secretor (non-secretor allele) — varies by pop
  rs2274976: 0.06,   // MTHFR R594Q (A allele) — estimate

  // ---- Neurotransmitter / cognition ----
  rs4680:    0.48,   // COMT Val158Met (Met allele) — close to 50/50 globally
  rs4818:    0.45,   // COMT haplotype tag — estimate
  rs4633:    0.48,   // COMT synonymous — estimate
  rs25531:   0.10,   // SLC6A4 rs25531 A/G — G is minor; estimate
  rs2064070: 0.30,   // SLC6A4 supporting — estimate

  // ---- Nutrition / metabolism ----
  rs4988235: 0.35,   // LCT/MCM6 T (persistence allele) frequency varies strongly by ancestry — global estimate
  rs182549:  0.35,   // LCT companion — estimate
  rs762551:  0.32,   // CYP1A2*1F (C allele) — slow metabolizer
  rs671:     0.08,   // ALDH2*2 (A allele) — concentrated in East Asian ancestry
  rs1229984: 0.07,   // ADH1B*2 (A allele) — concentrated in East Asian ancestry
  rs9939609: 0.42,   // FTO risk allele (A) — well characterized
  rs17782313:0.24,   // MC4R risk (C allele) — estimate
  rs1801282: 0.12,   // PPARG Ala12 (G allele) — global minor
  rs7903146: 0.28,   // TCF7L2 T2D risk (T allele)
  rs4402960: 0.32,   // IGF2BP2 T2D risk (T allele) — estimate
  rs5219:    0.36,   // KCNJ11 E23K (T allele) — estimate

  // ---- Vitamins & conversion ----
  rs12934922:0.44,   // BCMO1 R267S (T allele) — estimate; heavily studied
  rs7501331: 0.24,   // BCMO1 supporting — estimate
  rs2282679: 0.28,   // GC vitamin D binding (C allele)
  rs4588:    0.28,   // GC transport (A allele) — estimate
  rs2228570: 0.36,   // VDR FokI (T/f allele) — estimate
  rs1544410: 0.42,   // VDR BsmI (G allele) — estimate
  rs731236:  0.43,   // VDR TaqI (C allele) — estimate

  // ---- Fatty acids ----
  rs174537:  0.35,   // FADS1 T allele (efficient conversion) — estimate
  rs174547:  0.35,   // FADS1 tag — estimate
  rs1535:    0.35,   // FADS1 — estimate
  rs3834458: 0.38,   // FADS2 — estimate

  // ---- Iron / trace minerals ----
  rs1800562: 0.03,   // HFE C282Y — rare; well characterized
  rs1799945: 0.11,   // HFE H63D — well characterized

  // ---- Cardiovascular ----
  rs429358:  0.14,   // APOE ε4-defining variant (C allele) — well characterized
  rs7412:    0.08,   // APOE ε2-defining variant (T allele) — well characterized
  rs11591147:0.015,  // PCSK9 R46L LOF (T allele) — rare protective
  rs693:     0.48,   // APOB — estimate
  rs708272:  0.42,   // CETP TaqIB (G allele) — well characterized
  rs5882:    0.32,   // CETP I405V (G allele) — estimate
  rs662799:  0.10,   // APOA5 risk (C allele) — estimate
  rs328:     0.09,   // LPL S447X (G allele) — estimate
  rs1800629: 0.15,   // TNF-α (A allele) — estimate
  rs1800795: 0.40,   // IL6 (C allele) — estimate

  // ---- Sleep / circadian ----
  rs10830963:0.30,   // MTNR1B risk (G allele) — well characterized
  rs1387153: 0.28,   // MTNR1B second position — estimate
  rs228697:  0.10,   // PER3 — estimate
  rs1801260: 0.30,   // CLOCK 3111 — estimate
  rs1144566: 0.20,   // TIMELESS — estimate

  // ---- Sports performance ----
  rs1815739: 0.42,   // ACTN3 R577X (T/X allele) — well characterized
  rs4253778: 0.20,   // PPARA (C allele) — estimate
  rs8192678: 0.30,   // PPARGC1A Gly482Ser — estimate
  rs12722:   0.30,   // COL5A1 (T allele) — estimate

  // ---- Detox / xenobiotic ----
  rs1799930: 0.30,   // NAT2*6 — estimate
  rs1208:    0.44,   // NAT2 companion — estimate
  rs1041983: 0.35,   // NAT2 companion — estimate
  rs1801280: 0.44,   // NAT2*5 — estimate
  rs1799929: 0.30,   // NAT2 haplotype tag — estimate
  rs1695:    0.32,   // GSTP1 I105V (G allele) — estimate
  rs1050450: 0.31,   // GPX1 Pro198Leu (T allele) — estimate

  // ---- Pharmacogenomics ----
  rs4244285: 0.15,   // CYP2C19*2 — well characterized; higher in East Asian
  rs4986893: 0.02,   // CYP2C19*3 — rare loss-of-function
  rs12248560:0.19,   // CYP2C19*17 — rapid metabolizer
  rs1065852: 0.20,   // CYP2D6*10 tag — estimate
  rs3892097: 0.19,   // CYP2D6*4 — well characterized
  rs5030655: 0.02,   // CYP2D6*6 — rare
  rs28371706:0.02,   // CYP2D6 supporting — rare; estimate
  rs35742686:0.02,   // CYP2D6*3 — rare
  rs9923231: 0.40,   // VKORC1 (T allele) — well characterized
  rs1799853: 0.11,   // CYP2C9*2 — well characterized
  rs1057910: 0.07,   // CYP2C9*3 — well characterized

  // ---- Immune / gut ----
  rs11209026:0.06,   // IL23R protective (A allele) — rare in some pops
  rs10754558:0.42,   // NLRP3 — estimate

  // ---- Longevity ----
  rs2802292: 0.30,   // FOXO3 (G allele) — estimate
  rs1042522: 0.28,   // TP53 codon 72 Pro allele — estimate
}

/**
 * Look up the global allele frequency for an rsID.
 * Returns null when not in the table — caller should hide the chip.
 */
export function getPopulationFrequency(rsid) {
  if (!rsid) return null
  const freq = POPULATION_FREQUENCIES[rsid]
  if (freq == null) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      // Dev-only nudge so we can spot missing entries; never logs in prod.
      console.debug(`[populationFrequencies] no entry for ${rsid}`)
    }
    return null
  }
  return freq
}

/**
 * Convert a decimal frequency (0-1) into the display string:
 *   0.483 -> '48.3'
 *   0.03  -> '3.0'
 *   0.001 -> '0.1'
 *   0.5   -> '50'   (whole number when >= 10)
 * Returns a string — the calling component wraps it with the "% of people"
 * template.
 */
export function formatFrequency(freq) {
  if (freq == null || Number.isNaN(freq)) return ''
  const pct = freq * 100
  // For very small percentages (rare variants), always show one decimal so
  // "0" doesn't appear for 0.4% variants.
  if (pct < 10) return pct.toFixed(1)
  return String(Math.round(pct))
}
