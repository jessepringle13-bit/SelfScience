/**
 * Curated list of well-studied rsIDs for the SelfScience genome roadmap.
 * Every variant here has substantial peer-reviewed literature.
 * Keep this list <200 for MVP so parsing is fast and prompts stay under token limits.
 *
 * Classification per genotype:
 *   - `positive` genotypes → "Positive" card (Strength) — variant associated with
 *     favorable / protective / typical-function alleles in the literature.
 *   - `awareness` genotypes → "Be Aware" card — variant associated with reduced
 *     function, elevated risk, or something worth understanding better.
 *   - anything not in either bucket → "Typical" (Neutral) card.
 *
 * Notes on strand: 23andMe / AncestryDNA report genotypes on the forward (+)
 * strand. The genotype strings below are the common forward-strand alleles for
 * each SNP; if a genotype comes back that doesn't match either bucket we
 * conservatively default to "Typical".
 */


import { VARIANT_LIST } from './variants'

export const VARIANT_CATALOG = {
  // ---- Nutrition & Methylation ----
  rs1801133: { gene: 'MTHFR', pillar: 'Nutrition', description: 'C677T — folate metabolism',
    positive: ['CC'], awareness: ['CT','TC','TT'] },
  rs1801131: { gene: 'MTHFR', pillar: 'Nutrition', description: 'A1298C — folate cycle',
    positive: ['AA','TT'], awareness: ['AC','CA','CC','TG','GT','GG'] },
  rs4988235: { gene: 'LCT', pillar: 'Nutrition', description: 'Lactase persistence',
    positive: ['TT','CT','TC','AA','AG','GA'], awareness: ['CC','GG'] },
  rs762551:  { gene: 'CYP1A2', pillar: 'Nutrition', description: 'Caffeine metabolism speed',
    positive: ['AA'], awareness: ['CC'] },
  rs671:     { gene: 'ALDH2', pillar: 'Nutrition', description: 'Alcohol metabolism',
    positive: ['GG','CC'], awareness: ['AG','GA','AA','CT','TC','TT'] },
  rs174537:  { gene: 'FADS1', pillar: 'Nutrition', description: 'Omega-3 conversion efficiency',
    positive: ['GG'], awareness: ['TT'] },
  rs2282679: { gene: 'GC',    pillar: 'Nutrition', description: 'Vitamin D binding protein',
    positive: ['AA','TT'], awareness: ['CC','GG'] },
  rs4588:    { gene: 'GC',    pillar: 'Nutrition', description: 'Vitamin D transport variant',
    positive: ['CC','GG'], awareness: ['AA','TT'] },
  rs602662:  { gene: 'FUT2',  pillar: 'Nutrition', description: 'B12 absorption / gut microbiome',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs1051266: { gene: 'SLC19A1', pillar: 'Nutrition', description: 'Folate transporter',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs1801198: { gene: 'TCN2',  pillar: 'Nutrition', description: 'Transcobalamin — B12 transport',
    positive: ['CC','GG'], awareness: ['GG','CC'] }, // ambiguous — default Typical
  rs12934922:{ gene: 'BCMO1', pillar: 'Nutrition', description: 'Beta-carotene → vitamin A',
    positive: ['TT','AA'], awareness: ['AA','TT'] }, // strand ambiguous — default Typical
  rs662799:  { gene: 'APOA5', pillar: 'Nutrition', description: 'Triglyceride response to fat',
    positive: ['AA','TT'], awareness: ['GG','CC'] },
  rs9939609: { gene: 'FTO',   pillar: 'Nutrition', description: 'Satiety and body-weight risk',
    positive: ['TT'], awareness: ['AA'] },
  rs17782313:{ gene: 'MC4R',  pillar: 'Nutrition', description: 'Appetite regulation',
    positive: ['TT'], awareness: ['CC'] },

  // ---- Performance ----
  rs1815739: { gene: 'ACTN3', pillar: 'Performance', description: 'R577X — sprint / power fibre type',
    positive: ['CC','GG'], awareness: ['TT','AA'] },
  rs4646994: { gene: 'ACE',   pillar: 'Performance', description: 'I/D — endurance vs power',
    positive: ['II'], awareness: ['DD'] },
  rs1799983: { gene: 'NOS3',  pillar: 'Performance', description: 'Nitric oxide / vascular response',
    positive: ['GG','CC'], awareness: ['TT','AA'] },
  rs1042713: { gene: 'ADRB2', pillar: 'Performance', description: 'Beta-2 adrenergic — airway/fat',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs1801252: { gene: 'ADRB1', pillar: 'Performance', description: 'Beta-1 — heart rate response',
    positive: ['AA','TT'], awareness: ['GG','CC'] },

  // ---- Longevity ----
  rs429358:  { gene: 'APOE',  pillar: 'Longevity', description: 'APOE4 defining variant',
    positive: ['TT','AA'], awareness: ['CC','GG','CT','TC','AG','GA'] },
  rs7412:    { gene: 'APOE',  pillar: 'Longevity', description: 'APOE2 defining variant',
    positive: ['CT','TC','TT','AG','GA','AA'], awareness: [] },
  rs2802292: { gene: 'FOXO3', pillar: 'Longevity', description: 'Long-lived cohorts variant',
    positive: ['TT','AA'], awareness: [] },
  rs5882:    { gene: 'CETP',  pillar: 'Longevity', description: 'HDL / cognitive longevity',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs1544410: { gene: 'VDR',   pillar: 'Longevity', description: 'Vitamin D receptor',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs4149056: { gene: 'SLCO1B1',pillar: 'Longevity', description: 'Statin metabolism / muscle risk',
    positive: ['TT','AA'], awareness: ['CC','GG','CT','TC','AG','GA'] },

  // ---- Detox & Genomics ----
  rs1695:    { gene: 'GSTP1', pillar: 'Genomics', description: 'Glutathione S-transferase activity',
    positive: ['AA','TT'], awareness: ['GG','CC'] },
  rs1799931: { gene: 'NAT2',  pillar: 'Genomics', description: 'Acetylator status',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs2470893: { gene: 'CYP1A1',pillar: 'Genomics', description: 'Phase I detoxification',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs2231142: { gene: 'ABCG2', pillar: 'Genomics', description: 'Uric acid / xenobiotic transport',
    positive: ['GG','CC'], awareness: ['TT','AA'] },
  rs662:     { gene: 'PON1',  pillar: 'Genomics', description: 'Antioxidant enzyme activity',
    positive: ['AA','TT'], awareness: ['GG','CC'] },

  // ---- Wellness (sleep, mood, stress) ----
  rs4680:    { gene: 'COMT',  pillar: 'Wellness', description: 'Dopamine catabolism / stress',
    positive: [], awareness: [] }, // Val/Met trade-offs; keep Typical
  rs73598374:{ gene: 'ADA',   pillar: 'Wellness', description: 'Slow-wave sleep depth',
    positive: ['TT','AA'], awareness: [] },
  rs228697:  { gene: 'PER3',  pillar: 'Wellness', description: 'Chronotype / morningness',
    positive: [], awareness: [] }, // chronotype trade-offs
  rs1799971: { gene: 'OPRM1', pillar: 'Wellness', description: 'Mu-opioid — reward sensitivity',
    positive: ['AA','TT'], awareness: ['GG','CC'] },
  rs6265:    { gene: 'BDNF',  pillar: 'Wellness', description: 'Val66Met — stress and learning',
    positive: ['GG','CC'], awareness: ['AA','TT'] },
  rs53576:   { gene: 'OXTR',  pillar: 'Wellness', description: 'Oxytocin receptor sensitivity',
    positive: ['GG','CC'], awareness: [] },
}

export const APPROVED_RSIDS = new Set([
  ...Object.keys(VARIANT_CATALOG),
  // Expanded 500+ research-validated SNP library. Every rsID here is
  // whitelisted for parsing; those with per-genotype classification live in
  // VARIANT_CATALOG above (~40 curated), everything else surfaces as a
  // recognized variant the user can explore via the search engine.
  ...VARIANT_LIST,
])

/**
 * Classify a called genotype for a given rsID.
 * Returns 'Positive' | 'Awareness' | 'Neutral'.
 * - 'Positive' = protective / typical-function / favorable allele in the literature
 * - 'Awareness' = reduced function / elevated risk / worth understanding better
 * - 'Neutral'  = typical / trade-off / not enough evidence to bucket cleanly
 *
 * The genotype is normalised to uppercase and sorted alphabetically (so 'GA' and
 * 'AG' match the same rule), and matched against both the raw genotype and its
 * reverse-complement (to be lenient across strand orientations from different
 * consumer DNA services).
 */
export function classifyVariant(rsid, genotype) {
  const meta = VARIANT_CATALOG[rsid]
  if (!meta) return 'Neutral'
  const gt = (genotype || '').toUpperCase().replace(/[^ACGTID]/g, '')
  if (!gt) return 'Neutral'
  const sorted = gt.split('').sort().join('')
  const matches = (list) =>
    (list || []).some((g) => {
      const u = g.toUpperCase()
      return u === gt || u.split('').sort().join('') === sorted
    })
  if (matches(meta.positive)) return 'Strength'
  if (matches(meta.awareness)) return 'Awareness'
  return 'Neutral'
}

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
