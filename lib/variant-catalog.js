/**
 * Curated list of well-studied rsIDs for the SelfScience genome roadmap.
 * Every variant here has substantial peer-reviewed literature.
 * Keep this list <200 for MVP so parsing is fast and prompts stay under token limits.
 */

export const VARIANT_CATALOG = {
  // ---- Nutrition & Methylation ----
  rs1801133: { gene: 'MTHFR', pillar: 'Nutrition', description: 'C677T — folate metabolism' },
  rs1801131: { gene: 'MTHFR', pillar: 'Nutrition', description: 'A1298C — folate cycle' },
  rs4988235: { gene: 'LCT', pillar: 'Nutrition', description: 'Lactase persistence' },
  rs762551:  { gene: 'CYP1A2', pillar: 'Nutrition', description: 'Caffeine metabolism speed' },
  rs671:     { gene: 'ALDH2', pillar: 'Nutrition', description: 'Alcohol metabolism' },
  rs174537:  { gene: 'FADS1', pillar: 'Nutrition', description: 'Omega-3 conversion efficiency' },
  rs2282679: { gene: 'GC',    pillar: 'Nutrition', description: 'Vitamin D binding protein' },
  rs4588:    { gene: 'GC',    pillar: 'Nutrition', description: 'Vitamin D transport variant' },
  rs602662:  { gene: 'FUT2',  pillar: 'Nutrition', description: 'B12 absorption / gut microbiome' },
  rs1051266: { gene: 'SLC19A1', pillar: 'Nutrition', description: 'Folate transporter' },
  rs1801198: { gene: 'TCN2',  pillar: 'Nutrition', description: 'Transcobalamin — B12 transport' },
  rs12934922:{ gene: 'BCMO1', pillar: 'Nutrition', description: 'Beta-carotene → vitamin A' },
  rs662799:  { gene: 'APOA5', pillar: 'Nutrition', description: 'Triglyceride response to fat' },
  rs9939609: { gene: 'FTO',   pillar: 'Nutrition', description: 'Satiety and body-weight risk' },
  rs17782313:{ gene: 'MC4R',  pillar: 'Nutrition', description: 'Appetite regulation' },

  // ---- Performance ----
  rs1815739: { gene: 'ACTN3', pillar: 'Performance', description: 'R577X — sprint / power fibre type' },
  rs4646994: { gene: 'ACE',   pillar: 'Performance', description: 'I/D — endurance vs power' },
  rs1799983: { gene: 'NOS3',  pillar: 'Performance', description: 'Nitric oxide / vascular response' },
  rs1042713: { gene: 'ADRB2', pillar: 'Performance', description: 'Beta-2 adrenergic — airway/fat' },
  rs1801252: { gene: 'ADRB1', pillar: 'Performance', description: 'Beta-1 — heart rate response' },

  // ---- Longevity ----
  rs429358:  { gene: 'APOE',  pillar: 'Longevity', description: 'APOE4 defining variant' },
  rs7412:    { gene: 'APOE',  pillar: 'Longevity', description: 'APOE2 defining variant' },
  rs2802292: { gene: 'FOXO3', pillar: 'Longevity', description: 'Long-lived cohorts variant' },
  rs5882:    { gene: 'CETP',  pillar: 'Longevity', description: 'HDL / cognitive longevity' },
  rs1544410: { gene: 'VDR',   pillar: 'Longevity', description: 'Vitamin D receptor' },
  rs4149056: { gene: 'SLCO1B1',pillar: 'Longevity', description: 'Statin metabolism / muscle risk' },

  // ---- Detox & Genomics ----
  rs1695:    { gene: 'GSTP1', pillar: 'Genomics', description: 'Glutathione S-transferase activity' },
  rs1799931: { gene: 'NAT2',  pillar: 'Genomics', description: 'Acetylator status' },
  rs2470893: { gene: 'CYP1A1',pillar: 'Genomics', description: 'Phase I detoxification' },
  rs2231142: { gene: 'ABCG2', pillar: 'Genomics', description: 'Uric acid / xenobiotic transport' },
  rs662:     { gene: 'PON1',  pillar: 'Genomics', description: 'Antioxidant enzyme activity' },

  // ---- Wellness (sleep, mood, stress) ----
  rs4680:    { gene: 'COMT',  pillar: 'Wellness', description: 'Dopamine catabolism / stress' },
  rs73598374:{ gene: 'ADA',   pillar: 'Wellness', description: 'Slow-wave sleep depth' },
  rs228697:  { gene: 'PER3',  pillar: 'Wellness', description: 'Chronotype / morningness' },
  rs1799971: { gene: 'OPRM1', pillar: 'Wellness', description: 'Mu-opioid — reward sensitivity' },
  rs6265:    { gene: 'BDNF',  pillar: 'Wellness', description: 'Val66Met — stress and learning' },
  rs53576:   { gene: 'OXTR',  pillar: 'Wellness', description: 'Oxytocin receptor sensitivity' },
}

export const APPROVED_RSIDS = new Set(Object.keys(VARIANT_CATALOG))

/**
 * Anonymized sample genotype set so the /genome demo works without a real DNA file.
 * Values chosen to include a healthy mix of common/heterozygous/interesting calls.
 */
export const SAMPLE_VARIANTS = {
  rs1801133: 'CT',  // MTHFR C677T heterozygous
  rs1801131: 'AC',  // MTHFR A1298C heterozygous
  rs4988235: 'TT',  // LCT lactase persistent
  rs762551:  'AA',  // CYP1A2 fast caffeine metabolizer
  rs671:     'GG',  // ALDH2 normal alcohol metabolism
  rs174537:  'GT',  // FADS1 mixed omega-3 conversion
  rs2282679: 'AC',  // GC — lower vitamin D binding
  rs602662:  'AG',  // FUT2 heterozygous secretor
  rs4680:    'AG',  // COMT balanced Val/Met
  rs1815739: 'CT',  // ACTN3 balanced sprint/endurance
  rs4646994: 'ID',  // ACE heterozygous
  rs1799983: 'GT',  // NOS3 heterozygous
  rs429358:  'TT',  // APOE — no E4 allele
  rs7412:    'CC',  // APOE — no E2 allele
  rs2802292: 'GT',  // FOXO3 heterozygous
  rs1695:    'AG',  // GSTP1 heterozygous
  rs73598374:'CC',  // ADA typical
  rs228697:  'CC',  // PER3 typical
  rs6265:    'AG',  // BDNF Val/Met
  rs9939609: 'AT',  // FTO heterozygous
  rs17782313:'TC',  // MC4R heterozygous
  rs4149056: 'TT',  // SLCO1B1 normal statin clearance
  rs2231142: 'GG',  // ABCG2 typical
  rs662799:  'AG',  // APOA5 heterozygous
  rs662:     'AG',  // PON1 heterozygous
}
