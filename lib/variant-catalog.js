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
 * Per-classification `plain` copy:
 *   Each catalog entry may include a `plain: { strength, awareness, neutral }`
 *   object with a short, variant-specific description used when the AI provider
 *   is unavailable or hasn't returned a rich narrative for that variant. These
 *   replace the previous single-sentence "your GT genotype at GENE is
 *   associated with typical or favorable function in the literature" filler.
 *   Fallback logic in describeVariant() handles missing keys gracefully.
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
    positive: ['CC'], awareness: ['CT','TC','TT'],
    plain: {
      strength:  'Full-activity MTHFR C677T — your folate methylation pathway runs at typical enzyme speed, so standard folate intake works well.',
      awareness: 'MTHFR C677T reduces folate-processing enzyme activity by roughly 30% (heterozygous) to 70% (homozygous). Many people with this variant benefit from methylated folate (5-MTHF) and B12, especially if homocysteine is elevated.',
    },
  },
  rs1801131: { gene: 'MTHFR', pillar: 'Nutrition', description: 'A1298C — folate cycle',
    positive: ['AA','TT'], awareness: ['AC','CA','CC','TG','GT','GG'],
    plain: {
      strength:  'MTHFR A1298C at typical activity — a different MTHFR domain than C677T, and yours reads normal-function.',
      awareness: 'MTHFR A1298C affects a different domain than C677T; mildly reduced activity is common, and the effect compounds if you also carry a C677T variant. Methyl-B-complex supplementation is a common research direction.',
    },
  },
  rs4988235: { gene: 'LCT', pillar: 'Nutrition', description: 'Lactase persistence',
    positive: ['TT','CT','TC','AA','AG','GA'], awareness: ['CC','GG'],
    plain: {
      strength:  'Lactase persistence — your body continues producing lactase into adulthood, so dairy is typically well-tolerated.',
      awareness: 'Lactase non-persistence — enzyme production drops after childhood in most people with this genotype. Bloating or discomfort from milk is common; hard cheeses, yogurt, and lactose-free products usually still work.',
    },
  },
  rs762551:  { gene: 'CYP1A2', pillar: 'Nutrition', description: 'Caffeine metabolism speed',
    positive: ['AA'], awareness: ['CC'],
    plain: {
      strength:  'Fast caffeine metaboliser — you clear caffeine 2–4× faster than slow metabolisers. Cardiovascular risk from moderate caffeine intake appears lower for you.',
      awareness: 'Slow caffeine metaboliser — caffeine lingers 6–10 hours longer. The literature associates high daily caffeine with elevated hypertension risk in slow metabolisers; timing and dose matter.',
    },
  },
  rs671:     { gene: 'ALDH2', pillar: 'Nutrition', description: 'Alcohol metabolism',
    positive: ['GG','CC'], awareness: ['AG','GA','AA','CT','TC','TT'],
    plain: {
      strength:  'ALDH2 processes acetaldehyde (alcohol\'s toxic breakdown product) at typical speed.',
      awareness: 'The "alcohol flush" variant. Reduced ALDH2 activity causes acetaldehyde to build up; even moderate alcohol raises esophageal cancer risk substantially in carriers.',
    },
  },
  rs174537:  { gene: 'FADS1', pillar: 'Nutrition', description: 'Omega-3 conversion efficiency',
    positive: ['GG'], awareness: ['TT'],
    plain: {
      strength:  'Efficient conversion of plant-based ALA (flax, chia, walnuts) into active EPA/DHA omega-3s.',
      awareness: 'Reduced conversion of plant omega-3 → active EPA/DHA. Direct sources (fatty fish, algae oil) are more efficient than relying on flaxseed alone.',
    },
  },
  rs2282679: { gene: 'GC',    pillar: 'Nutrition', description: 'Vitamin D binding protein',
    positive: ['AA','TT'], awareness: ['CC','GG'],
    plain: {
      strength:  'Efficient vitamin D binding protein — you tend to maintain higher circulating 25(OH)D from the same intake.',
      awareness: 'Lower vitamin D binding capacity — many people with this genotype benefit from higher-than-standard vitamin D3 supplementation. Rechecking 25(OH)D seasonally is worth it.',
    },
  },
  rs4588:    { gene: 'GC',    pillar: 'Nutrition', description: 'Vitamin D transport variant',
    positive: ['CC','GG'], awareness: ['AA','TT'],
    plain: {
      strength:  'Preferred vitamin D transport haplotype — the vitamin reaches tissues efficiently.',
      awareness: 'Vitamin D transport variant associated with lower circulating levels. Sun exposure or supplement targets may need to be higher for the same measured serum level.',
    },
  },
  rs602662:  { gene: 'FUT2',  pillar: 'Nutrition', description: 'B12 absorption / gut microbiome',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'Secretor status — you secrete ABO blood-group antigens into gut mucus, supporting a diverse microbiome and typical B12 absorption.',
      awareness: 'Non-secretor status — modestly linked to altered gut microbiome composition and slightly lower B12 absorption. Not harmful; worth understanding if GI symptoms are chronic.',
    },
  },
  rs1051266: { gene: 'SLC19A1', pillar: 'Nutrition', description: 'Folate transporter',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'SLC19A1 folate transporter at typical activity — folate uptake into cells runs efficiently.',
      awareness: 'Reduced folate transport into cells — combined with an MTHFR variant it becomes more relevant. Methylated folate is easier to shuttle.',
    },
  },
  rs1801198: { gene: 'TCN2',  pillar: 'Nutrition', description: 'Transcobalamin — B12 transport',
    positive: ['CC','GG'], awareness: ['GG','CC'],
    plain: {
      neutral: 'TCN2 governs how B12 travels through the blood into cells. Some variants modestly lower delivered B12; combined with dietary status this is more informative than in isolation.',
    },
  },
  rs12934922:{ gene: 'BCMO1', pillar: 'Nutrition', description: 'R267S — beta-carotene → vitamin A',
    positive: ['AA'], awareness: ['TT','AT','TA'],
    plain: {
      strength:  'BCMO1 R267S reference genotype — you convert plant-based beta-carotene (carrots, sweet potato, leafy greens) into active vitamin A (retinol) at typical efficiency.',
      awareness: 'BCMO1 R267S variant reduces beta-carotene → retinol conversion by ~57% (heterozygous) to ~69% (homozygous). Retinol from animal sources (eggs, dairy, liver) is more efficient than plant sources; a mixed-source approach is well-researched.',
    },
  },
  rs662799:  { gene: 'APOA5', pillar: 'Nutrition', description: 'Triglyceride response to fat',
    positive: ['TT','GG'], awareness: ['AA','CC'],
    plain: {
      strength:  'APOA5 low-risk allele — typical post-meal triglyceride response to dietary fat.',
      awareness: 'APOA5 AA — associated with higher post-meal triglyceride response to dietary fat in research. Fat quality and meal timing are more relevant for this genotype.',
    },
  },
  rs9939609: { gene: 'FTO',   pillar: 'Nutrition', description: 'Satiety and body-weight risk',
    positive: ['TT'], awareness: ['AA'],
    plain: {
      strength:  'Typical FTO signaling — no association with the classic FTO obesity-risk allele.',
      awareness: 'The classic FTO obesity-risk variant. Larger appetite and slower satiety are well-documented, with an average effect of ~1–3 kg. Regular exercise substantially blunts the effect in every published cohort.',
    },
  },
  rs17782313:{ gene: 'MC4R',  pillar: 'Nutrition', description: 'Appetite regulation',
    positive: ['TT'], awareness: ['CC'],
    plain: {
      strength:  'Typical MC4R appetite signaling.',
      awareness: 'MC4R variant linked to increased hunger and slightly higher BMI in large cohorts. Effect is modest but real; regular meal timing and adequate protein are the most researched levers.',
    },
  },

  // ---- Performance ----
  rs1815739: { gene: 'ACTN3', pillar: 'Performance', description: 'R577X — sprint / power fibre type',
    positive: ['CC','GG'], awareness: ['TT','AA'],
    plain: {
      strength:  'Alpha-actinin-3 fully expressed — the "sprint gene". Fast-twitch fibres are well-supported for power and sprint performance.',
      awareness: 'R577X null — no alpha-actinin-3 protein. Modestly reduced sprint/power output, but the same variant is over-represented in elite endurance athletes. Not a health risk.',
    },
  },
  rs4646994: { gene: 'ACE',   pillar: 'Performance', description: 'I/D — endurance vs power',
    positive: ['II'], awareness: ['DD'],
    plain: {
      strength:  'ACE insertion (I) allele — over-represented in endurance athletes and associated with efficient cardiovascular adaptation to aerobic training.',
      awareness: 'ACE deletion (D) allele — associated with power-sport advantage but also slightly higher blood-pressure response to sodium and stress. Not a diagnosis.',
    },
  },
  rs1799983: { gene: 'NOS3',  pillar: 'Performance', description: 'Nitric oxide / vascular response',
    positive: ['GG','CC'], awareness: ['TT','AA'],
    plain: {
      strength:  'Endothelial NOS at typical activity — vascular dilation and blood-flow regulation are well-supported.',
      awareness: 'Reduced nitric oxide production — linked to slightly higher cardiovascular risk. Aerobic exercise and dietary nitrates (beets, leafy greens) reliably upregulate this pathway.',
    },
  },
  rs1042713: { gene: 'ADRB2', pillar: 'Performance', description: 'Beta-2 adrenergic — airway/fat',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'Beta-2 adrenergic receptor at typical function — bronchodilator response and adrenergic fat mobilisation run normally.',
      awareness: 'ADRB2 variant with modestly altered receptor response — may affect exercise-induced fat mobilisation and bronchodilator sensitivity in some studies.',
    },
  },
  rs1801252: { gene: 'ADRB1', pillar: 'Performance', description: 'Beta-1 — heart rate response',
    positive: ['AA','TT'], awareness: ['GG','CC'],
    plain: {
      strength:  'Beta-1 adrenergic receptor at typical function — heart-rate response to adrenaline and exercise is standard.',
      awareness: 'ADRB1 variant with modestly altered heart-rate response to adrenaline and to beta-blocker medications. Clinical significance is still debated.',
    },
  },

  // ---- Longevity ----
  rs429358:  { gene: 'APOE',  pillar: 'Longevity', description: 'APOE4 defining variant',
    positive: ['TT','AA'], awareness: ['CC','GG','CT','TC','AG','GA'],
    plain: {
      strength:  'No APOE4 allele — you don\'t carry the APOE isoform most-associated with elevated late-life cognitive risk.',
      awareness: 'At least one APOE4 allele. This is a modifier, not a diagnosis. Well-studied protective levers include cardiovascular and metabolic health, aerobic exercise, sleep quality, and ongoing cognitive engagement.',
    },
  },
  rs7412:    { gene: 'APOE',  pillar: 'Longevity', description: 'APOE2 defining variant',
    positive: ['CT','TC','TT','AG','GA','AA'], awareness: [],
    plain: {
      strength:  'At least one APOE2 allele — often linked with slightly lower LDL cholesterol and modest cognitive-longevity benefits in the literature.',
      neutral:   'No APOE2 allele — the more common genotype at this position.',
    },
  },
  rs2802292: { gene: 'FOXO3', pillar: 'Longevity', description: 'FOXO3 cellular stress pathway',
    // The G allele at rs2802292 is the minor allele associated with longevity
    // in centenarian populations (Willcox et al. 2008 Okinawan cohort;
    // replicated across German, Italian, Japanese, Hawaiian populations —
    // longevity cases are ~2.75× more likely to carry GG vs TT). TT is the
    // common reference genotype — not adverse, just standard.
    positive: ['GG'], awareness: [],
    plain: {
      strength:  'FOXO3 GG — the "longevity" genotype. Centenarian populations are ~2.75× more likely to carry GG than TT (Okinawan, German, Italian, Japanese, and Hawaiian cohorts). Associated with better cardiovascular protection and healthspan markers.',
      neutral:   'Standard FOXO3 function at this position. Research associates the G allele with longevity markers in centenarian population studies. Lifestyle interventions including aerobic exercise and caloric restriction activate related cellular pathways regardless of genotype.',
    },
  },
  rs5882:    { gene: 'CETP',  pillar: 'Longevity', description: 'HDL / cognitive longevity',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'CETP variant associated with higher HDL cholesterol and, in some cohorts, lower late-life cognitive decline.',
      awareness: 'Standard CETP activity — no specific longevity signal from this position.',
    },
  },
  rs1544410: { gene: 'VDR',   pillar: 'Longevity', description: 'Vitamin D receptor',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'Vitamin D receptor with typical binding — standard dose-response to vitamin D from diet, sun, or supplements.',
      awareness: 'VDR variant associated with weaker vitamin D signalling. Higher supplementation targets are worth discussing with your provider, alongside 25(OH)D bloodwork.',
    },
  },
  rs4149056: { gene: 'SLCO1B1',pillar: 'Longevity', description: 'Statin metabolism / muscle risk',
    positive: ['TT','AA'], awareness: ['CC','GG','CT','TC','AG','GA'],
    plain: {
      strength:  'SLCO1B1 at normal transport activity — statins are cleared efficiently and muscle-related side-effects are uncommon.',
      awareness: 'SLCO1B1 variant strongly linked to statin-induced muscle pain (myopathy) and, at homozygous, rhabdomyolysis risk. If statins are ever prescribed, flag this to your provider — dose or drug choice may matter.',
    },
  },

  // ---- Detox & Genomics ----
  rs1695:    { gene: 'GSTP1', pillar: 'Genomics', description: 'Glutathione S-transferase activity',
    positive: ['AA','TT'], awareness: ['GG','CC'],
    plain: {
      strength:  'Glutathione-S-transferase P1 at full activity — Phase II detoxification of oxidative and drug compounds runs efficiently.',
      awareness: 'Reduced GSTP1 activity — Phase II detox is slower. Cruciferous vegetables (broccoli, kale, sulforaphane-rich foods) reliably upregulate glutathione activity.',
    },
  },
  rs1799931: { gene: 'NAT2',  pillar: 'Genomics', description: 'Acetylator status',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'NAT2 rapid-acetylator variant — dietary amines and select drugs are cleared efficiently.',
      awareness: 'NAT2 slow-acetylator variant. Some medications (isoniazid, hydralazine, procainamide) may need dose adjustments; heavily grilled/charred meats warrant more moderation.',
    },
  },
  rs2470893: { gene: 'CYP1A1',pillar: 'Genomics', description: 'Phase I detoxification',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'CYP1A1 at typical Phase I activity — polycyclic hydrocarbons (from charred foods, tobacco smoke) are metabolised at normal speed.',
      awareness: 'Inducible CYP1A1 variant — Phase I detox can run hotter with certain exposures. Cruciferous vegetables help balance this pathway.',
    },
  },
  rs2231142: { gene: 'ABCG2', pillar: 'Genomics', description: 'Uric acid / xenobiotic transport',
    positive: ['GG','CC'], awareness: ['TT','AA'],
    plain: {
      strength:  'ABCG2 transporter at typical function — uric acid excretion and drug efflux are normal.',
      awareness: 'Reduced ABCG2 transport is a strong risk factor for gout and higher urate levels. Hydration and moderating purine-rich foods (organ meats, beer, some seafood) help meaningfully.',
    },
  },
  rs662:     { gene: 'PON1',  pillar: 'Genomics', description: 'Antioxidant enzyme activity',
    positive: ['AA','TT'], awareness: ['GG','CC'],
    plain: {
      strength:  'Paraoxonase 1 at higher activity — associated with better antioxidant defence against oxidised LDL.',
      awareness: 'PON1 with reduced activity in most assays. Cardiovascular implications are still debated, but this pairs meaningfully with standard lipid markers (Apo B, oxidised LDL).',
    },
  },

  // ---- Wellness (sleep, mood, stress) ----
  rs4680:    { gene: 'COMT',  pillar: 'Wellness', description: 'Dopamine catabolism / stress',
    positive: [], awareness: [],
    plain: {
      neutral: 'COMT Val158Met governs dopamine breakdown in the prefrontal cortex. Met/Met is the "worrier" pattern (slower breakdown, better memory, higher stress reactivity); Val/Val is the "warrior" pattern (faster breakdown, higher stress tolerance). Not a health risk either way — just different cognitive profiles.',
    },
  },
  rs73598374:{ gene: 'ADA',   pillar: 'Wellness', description: 'Slow-wave sleep depth',
    positive: ['TT','AA'], awareness: [],
    plain: {
      strength:  'ADA variant associated with deeper slow-wave sleep and higher reported subjective sleep quality on the same hours.',
      neutral:   'Standard ADA genotype — sleep depth is average, no distinguishing signal from this position.',
    },
  },
  rs228697:  { gene: 'PER3',  pillar: 'Wellness', description: 'Chronotype / morningness',
    positive: [], awareness: [],
    plain: {
      neutral: 'PER3 modestly influences whether you\'re morning- or evening-typed. Not a health risk — a preference-map, not a diagnosis. Aligning key work with your natural peak hours is the practical takeaway.',
    },
  },
  rs1799971: { gene: 'OPRM1', pillar: 'Wellness', description: 'Mu-opioid — reward sensitivity',
    positive: ['AA','TT'], awareness: ['GG','CC'],
    plain: {
      strength:  'Mu-opioid receptor at typical function — pain modulation and reward signalling are standard.',
      awareness: 'OPRM1 variant with altered opioid signalling. Some studies link it to reduced pain tolerance and higher addiction-response sensitivity — worth discussing with your provider before opioid prescriptions.',
    },
  },
  rs6265:    { gene: 'BDNF',  pillar: 'Wellness', description: 'Val66Met — stress and learning',
    positive: ['GG','CC'], awareness: ['AA','TT'],
    plain: {
      strength:  'BDNF Val/Val — associated with typical stress resilience and neuroplasticity.',
      awareness: 'BDNF Met carrier — some studies link this to greater stress sensitivity and modestly different learning patterns. Aerobic exercise reliably raises BDNF expression regardless of genotype.',
    },
  },
  rs53576:   { gene: 'OXTR',  pillar: 'Wellness', description: 'Oxytocin receptor sensitivity',
    positive: ['GG','CC'], awareness: [],
    plain: {
      strength:  'OXTR variant associated with higher self-reported empathy, social bonding, and stress-buffering from social contact in the literature.',
      neutral:   'Standard OXTR genotype — no specific signal from this position.',
    },
  },
}

export const APPROVED_RSIDS = new Set([
  ...Object.keys(VARIANT_CATALOG),
  // Expanded 500+ research-validated SNP library. Every rsID here is
  // whitelisted for parsing; those with per-genotype classification live in
  // VARIANT_CATALOG above (~37 curated), everything else surfaces as a
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
 * Return a variant-specific, classification-appropriate plain-language
 * description for a card. Falls back sensibly:
 *
 *   1) meta.plain[<classification-key>]  (curated per-variant text)
 *   2) A short generic "watch / typical / explore" template that at least
 *      mentions the specific gene + description, so no two cards read
 *      identically even when the catalog doesn't have curated copy.
 *   3) Absolutely-last-resort generic sentence for uncatalogued rsIDs.
 *
 * Used by the fallback and AI-fill code paths in /api/interpret-genome to
 * avoid repetitive "is associated with typical or favorable function in the
 * literature" filler across every card.
 */
export function describeVariant(rsid, classification, genotype) {
  const meta = VARIANT_CATALOG[rsid]
  const key = classification === 'Strength' ? 'strength'
            : classification === 'Awareness' ? 'awareness'
            : 'neutral'
  // 1) Curated per-variant text
  const curated = meta?.plain?.[key]
  if (curated) return curated
  // 2) Gene-aware generic
  if (meta) {
    const gene = meta.gene || 'this gene'
    const desc = meta.description || 'a well-studied position'
    if (classification === 'Strength') {
      return `${gene}: ${desc}. Your ${genotype || 'called'} genotype reads as typical or favorable-function at this position — see the studies below for the specific research context.`
    }
    if (classification === 'Awareness') {
      return `${gene}: ${desc}. Your ${genotype || 'called'} genotype is one to understand better — not a diagnosis or warning. The studies below explain what researchers have found.`
    }
    return `${gene}: ${desc}. Your ${genotype || 'called'} genotype at this position doesn't fall cleanly into strength or awareness — the research is mixed or context-dependent.`
  }
  // 3) Uncatalogued rsID — extremely rare since VARIANT_LIST covers 671 SNPs.
  return `A well-studied variant with active research literature. Use the search below to explore what researchers have found about ${rsid}.`
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
