// /app/lib/biomarkers/snps.js
//
// SelfScience — CURATED SNP → BIOMARKER ASSOCIATION LIBRARY.
//
// Each entry describes ONE variant's association with one or more
// biomarkers, with an evidence-strength label and a small set of
// citations. Genotype checks are done via the user's flattened genome
// cards (see /app/lib/biomarkers/genomeMatch.js).
//
// EDITORIAL GROUND RULES
//   1. Only associations with strong published support are included
//      here. Emerging associations are labeled Emerging and framed
//      with humility.
//   2. Each entry specifies a `direction` (increases / decreases /
//      modulates) and short `effectByGenotype` text so the UI can
//      say something concrete rather than "genetics affect this".
//   3. All copy uses research language ("associated with", "may
//      influence") \u2014 never "causes" or "will".
//
// EVIDENCE STRENGTH TIERS
//   High      \u2014 Guideline-mentioned or Mendelian-inheritance clarity
//                 (HFE hemochromatosis, MTHFR homocysteine, APOE lipids)
//   Moderate  \u2014 Consistent large-scale GWAS + mechanistic support
//   Emerging  \u2014 Signal present but effect size / clinical relevance debated

/**
 * @typedef {Object} SnpAssociation
 * @property {string}      id
 * @property {string}      rsid                // primary rsID
 * @property {string=}     alt_rsid            // secondary rsID some kits report
 * @property {string}      gene
 * @property {string=}     variantLabel        // human name (e.g. \"C677T\")
 * @property {string[]}    biomarkerIds        // ids from schema.js
 * @property {string[]}    riskAlleles         // e.g. [\"T\"] \u2014 risk-associated
 * @property {'increases'|'decreases'|'modulates'} direction  // effect on biomarker(s)
 * @property {{ heterozygous:string, homozygous:string }} effectByGenotype
 * @property {string}      whatItIs            // one-line description of the variant
 * @property {string}      interpretation      // interpretation prose (research language)
 * @property {string=}     actionable          // possible next steps (framed as discussion, optional)
 * @property {'High'|'Moderate'|'Emerging'} evidenceStrength
 * @property {{ label:string, year?:number, url?:string, type:string }[]} citations
 */

/** @type {SnpAssociation[]} */
export const SNP_ASSOCIATIONS = [
  /* ------------------------ Methylation \u00b7 Homocysteine ------------------ */
  {
    id: 'mthfr-c677t',
    rsid: 'rs1801133',
    gene: 'MTHFR',
    variantLabel: 'C677T (Ala222Val)',
    biomarkerIds: ['homocysteine'],
    riskAlleles: ['T'],
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'CT: ~30\u201340% reduction in MTHFR enzyme activity.',
      homozygous:   'TT: ~60\u201370% reduction in MTHFR enzyme activity; largest population effect on homocysteine.',
    },
    whatItIs: 'A common variant in methylenetetrahydrofolate reductase, which converts folate into its active methylated form (5-MTHF).',
    interpretation: 'TT (and to a lesser extent CT) carriers convert dietary folic acid into active 5-MTHF less efficiently. This is associated with higher homocysteine levels in cohort studies, particularly when folate intake is low.',
    actionable: 'Ensuring adequate folate intake (leafy greens, legumes) and, per some clinicians\u2019 practice, using methylfolate (5-MTHF) instead of standard folic acid is a common discussion point for TT carriers with elevated homocysteine.',
    evidenceStrength: 'High',
    citations: [
      { label: 'Frosst et al., original MTHFR C677T characterization, Nat Genet', year: 1995, url: 'https://pubmed.ncbi.nlm.nih.gov/7647779/', type: 'seminal' },
      { label: 'Klerk et al., MTHFR meta-analysis on homocysteine + CVD, JAMA', year: 2002, url: 'https://pubmed.ncbi.nlm.nih.gov/12365961/', type: 'meta-analysis' },
    ],
  },
  {
    id: 'mthfr-a1298c',
    rsid: 'rs1801131',
    gene: 'MTHFR',
    variantLabel: 'A1298C (Glu429Ala)',
    biomarkerIds: ['homocysteine'],
    riskAlleles: ['C'],
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'AC: modest reduction in enzyme activity; independent effect on homocysteine is small.',
      homozygous:   'CC: mild reduction; effect on homocysteine notably smaller than C677T homozygous.',
    },
    whatItIs: 'A second common MTHFR variant. Its effect on homocysteine is real but smaller than C677T.',
    interpretation: 'A1298C on its own has a mild effect on homocysteine. It matters more when combined with C677T (compound heterozygous CT/AC) \u2014 that combination roughly approximates the effect of homozygous C677T alone.',
    evidenceStrength: 'Moderate',
    citations: [
      { label: 'Weisberg et al., MTHFR A1298C functional analysis', year: 2001, url: 'https://pubmed.ncbi.nlm.nih.gov/11414544/', type: 'mechanistic' },
    ],
  },
  {
    id: 'mtr-a2756g',
    rsid: 'rs1805087',
    gene: 'MTR',
    variantLabel: 'A2756G',
    biomarkerIds: ['homocysteine'],
    riskAlleles: ['G'],
    direction: 'modulates',
    effectByGenotype: {
      heterozygous: 'AG: modestly modifies methionine synthase activity.',
      homozygous:   'GG: further modifies methionine synthase activity; effect on homocysteine is context-dependent (B12 status matters).',
    },
    whatItIs: 'Variant in methionine synthase, which remethylates homocysteine back to methionine using B12 as a cofactor.',
    interpretation: 'The effect on homocysteine is meaningful primarily when B12 status is suboptimal \u2014 which makes B12 (and active B12 / holotranscobalamin) worth checking alongside.',
    evidenceStrength: 'Moderate',
    citations: [
      { label: 'Chen et al., MTR variants and homocysteine, meta-analysis', year: 2013, url: 'https://pubmed.ncbi.nlm.nih.gov/23144619/', type: 'meta-analysis' },
    ],
  },

  /* ---------------------------- Iron \u00b7 Ferritin ---------------------- */
  {
    id: 'hfe-c282y',
    rsid: 'rs1800562',
    gene: 'HFE',
    variantLabel: 'C282Y (Cys282Tyr)',
    biomarkerIds: ['ferritin', 'hemoglobin'],
    riskAlleles: ['A'], // A = mutant (Y)
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'GA (C/Y): mild iron-retention tendency; clinical iron overload uncommon on its own.',
      homozygous:   'AA (Y/Y): the primary genotype for hereditary hemochromatosis \u2014 sharply elevated risk of iron accumulation. Penetrance is incomplete (many homozygotes never develop clinical disease).',
    },
    whatItIs: 'The main variant behind hereditary hemochromatosis type 1. Impairs hepcidin regulation, allowing excess iron absorption.',
    interpretation: 'C282Y homozygosity is associated with substantially elevated ferritin and transferrin saturation in adulthood; heterozygotes typically show only mild iron-loading tendencies. Penetrance is incomplete, so genotype alone is not diagnostic.',
    actionable: 'For homozygotes, tracking ferritin + transferrin saturation over time and discussing therapeutic phlebotomy with a clinician if ferritin trends high is the standard framework.',
    evidenceStrength: 'High',
    citations: [
      { label: 'Feder et al., HFE gene discovery, Nat Genet', year: 1996, url: 'https://pubmed.ncbi.nlm.nih.gov/8696333/', type: 'seminal' },
      { label: 'European Association Study of the Liver \u2014 Hemochromatosis guidelines', year: 2022, url: 'https://pubmed.ncbi.nlm.nih.gov/35031334/', type: 'consensus-guideline' },
    ],
  },
  {
    id: 'hfe-h63d',
    rsid: 'rs1799945',
    gene: 'HFE',
    variantLabel: 'H63D (His63Asp)',
    biomarkerIds: ['ferritin'],
    riskAlleles: ['G'], // G = mutant (D)
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'CG (H/D): typically minimal effect on ferritin alone.',
      homozygous:   'GG (D/D): mild elevation of ferritin possible; H63D-only hemochromatosis is uncommon.',
    },
    whatItIs: 'A second common HFE variant. Milder effect than C282Y.',
    interpretation: 'H63D on its own rarely produces clinical iron overload. It matters most when compound-heterozygous with C282Y (Y/D), which can produce a milder version of the hemochromatosis phenotype.',
    evidenceStrength: 'Moderate',
    citations: [
      { label: 'Merryweather-Clarke et al., HFE variant global frequency', year: 2000, url: 'https://pubmed.ncbi.nlm.nih.gov/11149706/', type: 'cohort' },
    ],
  },

  /* ---------------------------- Lipids \u00b7 APOE ---------------------- */
  {
    id: 'apoe-rs429358',
    rsid: 'rs429358',
    gene: 'APOE',
    variantLabel: '\u03b52/\u03b53/\u03b54 typing (position 1)',
    biomarkerIds: ['ldl', 'apob'],
    riskAlleles: ['C'], // C = \u03b54
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'TC: one \u03b54 allele \u2014 associated with modestly higher LDL-C and higher ApoB on average.',
      homozygous:   'CC: two \u03b54 alleles \u2014 associated with meaningfully higher LDL-C, ApoB, and lifetime CV risk.',
    },
    whatItIs: 'One of two SNPs that jointly determine APOE isoform (\u03b52 / \u03b53 / \u03b54). APOE mediates hepatic clearance of lipoprotein remnants.',
    interpretation: '\u03b54 carriers absorb dietary cholesterol more efficiently and clear lipoprotein remnants less efficiently \u2014 both associated with higher LDL-C and ApoB. Interpret alongside rs7412 to determine full \u03b5-status.',
    actionable: 'APOE \u03b54 status is one of few personalized-nutrition signals with reasonable evidence: reducing saturated fat may have a larger LDL-lowering effect in \u03b54 carriers than in \u03b53/\u03b53 individuals in some studies.',
    evidenceStrength: 'High',
    citations: [
      { label: 'Bennet et al., APOE and lipids meta-analysis, JAMA', year: 2007, url: 'https://pubmed.ncbi.nlm.nih.gov/17925521/', type: 'meta-analysis' },
    ],
  },
  {
    id: 'apoe-rs7412',
    rsid: 'rs7412',
    gene: 'APOE',
    variantLabel: '\u03b52/\u03b53/\u03b54 typing (position 2)',
    biomarkerIds: ['ldl', 'apob'],
    riskAlleles: ['C'], // C = \u03b53 (reference); T = \u03b52
    direction: 'modulates',
    effectByGenotype: {
      heterozygous: 'CT: one \u03b52 allele \u2014 associated with lower LDL-C on average, but complex interaction with \u03b54 if present.',
      homozygous:   'TT: two \u03b52 alleles (uncommon) \u2014 markedly lower LDL-C, but rare risk of type III hyperlipoproteinemia.',
    },
    whatItIs: 'The second APOE-typing SNP. Together with rs429358 it determines \u03b52 / \u03b53 / \u03b54 status.',
    interpretation: '\u03b52 alleles are associated with lower LDL-C on average. Full APOE interpretation requires both SNPs; SelfScience shows both when the genome file covers them.',
    evidenceStrength: 'High',
    citations: [
      { label: 'Bennet et al., APOE and lipids meta-analysis, JAMA', year: 2007, url: 'https://pubmed.ncbi.nlm.nih.gov/17925521/', type: 'meta-analysis' },
    ],
  },
  {
    id: 'apob-rs693',
    rsid: 'rs693',
    gene: 'APOB',
    variantLabel: 'Xbal (T2488T)',
    biomarkerIds: ['apob', 'ldl'],
    riskAlleles: ['T'],
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'CT: modestly higher ApoB / LDL on average.',
      homozygous:   'TT: modestly higher ApoB / LDL on average; effect size smaller than APOE \u03b54.',
    },
    whatItIs: 'A synonymous variant in APOB that tags a broader haplotype associated with LDL/ApoB variation.',
    interpretation: 'Effect size on ApoB is modest \u2014 a nudge, not a driver. Meaningful primarily in combination with other lipid-modifying variants.',
    evidenceStrength: 'Moderate',
    citations: [
      { label: 'Willer et al., Global lipids consortium GWAS, Nat Genet', year: 2013, url: 'https://pubmed.ncbi.nlm.nih.gov/24097068/', type: 'gwas' },
    ],
  },
  {
    id: 'pcsk9-r46l',
    rsid: 'rs11591147',
    gene: 'PCSK9',
    variantLabel: 'R46L (loss-of-function)',
    biomarkerIds: ['ldl', 'apob'],
    riskAlleles: ['G'], // G = reference; T = protective LoF
    direction: 'decreases',
    effectByGenotype: {
      heterozygous: 'GT: one loss-of-function allele \u2014 associated with substantially lower lifetime LDL-C and lower CV risk. Uncommon.',
      homozygous:   'TT: very rare; if present, associated with very low LDL-C.',
    },
    whatItIs: 'A rare loss-of-function variant in PCSK9, which normally degrades LDL receptors. Losing PCSK9 function keeps LDL receptors intact longer, lowering circulating LDL.',
    interpretation: 'This is a protective variant: rs11591147 T carriers have lower lifetime LDL-C exposure and correspondingly lower coronary disease risk, essentially validating the mechanism of PCSK9-inhibitor drugs.',
    evidenceStrength: 'High',
    citations: [
      { label: 'Cohen et al., PCSK9 mutations and CHD risk, NEJM', year: 2006, url: 'https://pubmed.ncbi.nlm.nih.gov/16554528/', type: 'cohort' },
    ],
  },

  /* --------------------------- Metabolic \u00b7 Glucose ------------------- */
  {
    id: 'tcf7l2-rs7903146',
    rsid: 'rs7903146',
    gene: 'TCF7L2',
    variantLabel: 'IVS3 T-allele',
    biomarkerIds: ['hba1c', 'fasting_glucose'],
    riskAlleles: ['T'],
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'CT: ~30\u201340% relative increase in type 2 diabetes risk.',
      homozygous:   'TT: ~80\u2013100% relative increase in T2D risk; largest common variant effect on T2D risk.',
    },
    whatItIs: 'The single largest common-variant contributor to type 2 diabetes risk in populations of European ancestry.',
    interpretation: 'T-allele carriers are associated with impaired \u03b2-cell insulin secretion in response to glucose. Effect appears in HbA1c and fasting glucose over time \u2014 lifestyle interventions (weight, activity, diet quality) are effective in this genotype.',
    actionable: 'Refined-carb reduction and post-meal activity are especially high-leverage in T-carriers because the primary defect is post-meal insulin response, not baseline.',
    evidenceStrength: 'High',
    citations: [
      { label: 'Grant et al., TCF7L2 T2D discovery, Nat Genet', year: 2006, url: 'https://pubmed.ncbi.nlm.nih.gov/16415884/', type: 'gwas' },
      { label: 'DPP substudy: lifestyle effective in TCF7L2 T-carriers, NEJM', year: 2006, url: 'https://pubmed.ncbi.nlm.nih.gov/16855265/', type: 'rct' },
    ],
  },
  {
    id: 'fto-rs9939609',
    rsid: 'rs9939609',
    gene: 'FTO',
    variantLabel: 'intron 1 A-allele',
    biomarkerIds: ['hba1c'],
    riskAlleles: ['A'],
    direction: 'modulates',
    effectByGenotype: {
      heterozygous: 'TA: ~1\u20131.5 kg higher body weight on average, indirectly affecting HbA1c.',
      homozygous:   'AA: ~3 kg higher body weight on average; effect on HbA1c is mediated via body composition, not direct glycemic dysregulation.',
    },
    whatItIs: 'The most-studied common obesity-associated variant. Effect appears to work via appetite / satiety signaling.',
    interpretation: 'FTO\u2019s effect on HbA1c is INDIRECT \u2014 mediated by body composition rather than glucose handling. Lifestyle interventions are as effective in AA carriers as in TT.',
    evidenceStrength: 'Moderate',
    citations: [
      { label: 'Frayling et al., FTO obesity association, Science', year: 2007, url: 'https://pubmed.ncbi.nlm.nih.gov/17434869/', type: 'gwas' },
      { label: 'Livingstone et al., FTO does not modify weight-loss response, meta-analysis, BMJ', year: 2016, url: 'https://pubmed.ncbi.nlm.nih.gov/27669983/', type: 'meta-analysis' },
    ],
  },

  /* ----------------------- Micronutrients \u00b7 Vitamin D ---------------- */
  {
    id: 'gc-rs2282679',
    rsid: 'rs2282679',
    gene: 'GC',
    variantLabel: 'DBP variant',
    biomarkerIds: ['vitamin_d'],
    riskAlleles: ['C'],
    direction: 'decreases',
    effectByGenotype: {
      heterozygous: 'AC: modestly lower circulating 25-OH vitamin D on average.',
      homozygous:   'CC: more meaningfully lower 25-OH vitamin D on average; may need higher intake to reach the same serum level.',
    },
    whatItIs: 'A variant in vitamin D binding protein (DBP), which carries most 25-OH vitamin D in circulation.',
    interpretation: 'CC carriers tend to run lower 25-OH vitamin D at any given intake. Practical implication: if you\u2019re a CC carrier and struggling to reach a target level, this genotype is part of the explanation.',
    evidenceStrength: 'High',
    citations: [
      { label: 'Wang et al., GC and vitamin D, Lancet', year: 2010, url: 'https://pubmed.ncbi.nlm.nih.gov/20541252/', type: 'gwas' },
    ],
  },
  {
    id: 'cyp2r1-rs10741657',
    rsid: 'rs10741657',
    gene: 'CYP2R1',
    variantLabel: '25-hydroxylase variant',
    biomarkerIds: ['vitamin_d'],
    riskAlleles: ['A'],
    direction: 'decreases',
    effectByGenotype: {
      heterozygous: 'GA: modestly lower conversion of dietary/skin vitamin D to circulating 25-OH form.',
      homozygous:   'AA: more meaningfully reduced conversion efficiency.',
    },
    whatItIs: 'CYP2R1 converts vitamin D2/D3 into circulating 25-OH vitamin D in the liver. Loss-of-function variants reduce this step.',
    interpretation: 'AA carriers convert vitamin D substrate to 25-OH form less efficiently. Combined with GC (rs2282679) risk allele, the effect on serum 25-OH is additive.',
    evidenceStrength: 'Moderate',
    citations: [
      { label: 'Wang et al., CYP2R1 GWAS, Lancet', year: 2010, url: 'https://pubmed.ncbi.nlm.nih.gov/20541252/', type: 'gwas' },
    ],
  },
  {
    id: 'vdr-fok1',
    rsid: 'rs2228570',
    gene: 'VDR',
    variantLabel: 'FokI',
    biomarkerIds: ['vitamin_d'],
    riskAlleles: ['A'],
    direction: 'modulates',
    effectByGenotype: {
      heterozygous: 'GA: intermediate VDR activity; effect on 25-OH levels themselves is minimal.',
      homozygous:   'AA (Ff): full-length receptor with modestly reduced transcriptional activity; measurable serum 25-OH effect is small.',
    },
    whatItIs: 'A variant that changes the vitamin D receptor start codon, producing slightly different receptor lengths with different transcriptional efficiency.',
    interpretation: 'FokI does not clearly move measured 25-OH vitamin D itself \u2014 it modulates how strongly tissues respond to a given vitamin D level. Its role in clinical outcomes remains debated.',
    evidenceStrength: 'Emerging',
    citations: [
      { label: 'Uitterlinden et al., VDR polymorphisms review', year: 2004, url: 'https://pubmed.ncbi.nlm.nih.gov/14746706/', type: 'review' },
    ],
  },

  /* ---------------------------- Thyroid \u00b7 DIO2 ------------------------ */
  {
    id: 'dio2-rs225014',
    rsid: 'rs225014',
    gene: 'DIO2',
    variantLabel: 'Thr92Ala',
    biomarkerIds: ['free_t3', 'free_t4'],
    riskAlleles: ['C'],
    direction: 'modulates',
    effectByGenotype: {
      heterozygous: 'TC: potential mild reduction in peripheral T4\u2192T3 conversion; clinical relevance debated.',
      homozygous:   'CC: some studies suggest more meaningful reduction in T4\u2192T3 conversion, possibly affecting how hypothyroid patients respond to T4-only therapy.',
    },
    whatItIs: 'Variant in deiodinase 2, which converts inactive T4 into active T3 inside cells.',
    interpretation: 'The strongest evidence for DIO2 Thr92Ala relates to how hypothyroid patients respond to T4-only levothyroxine treatment \u2014 CC carriers may benefit more from T4+T3 combination therapy. In the general (non-hypothyroid) population its effect on Free T3 is small.',
    evidenceStrength: 'Emerging',
    citations: [
      { label: 'Panicker et al., DIO2 rs225014 and T4/T3 response, JCEM', year: 2009, url: 'https://pubmed.ncbi.nlm.nih.gov/19190113/', type: 'cohort' },
    ],
  },

  /* --------------------------- Hormones \u00b7 SHBG / T -------------------- */
  {
    id: 'shbg-rs6259',
    rsid: 'rs6259',
    gene: 'SHBG',
    variantLabel: 'Asp327Asn',
    biomarkerIds: ['shbg', 'testosterone_free'],
    riskAlleles: ['A'], // A = 327Asn = slower clearance = higher SHBG
    direction: 'increases',
    effectByGenotype: {
      heterozygous: 'GA: modestly slower SHBG clearance \u2014 tends to produce higher circulating SHBG.',
      homozygous:   'AA: further-elevated SHBG on average; can lower calculated free testosterone.',
    },
    whatItIs: 'A missense variant that slows SHBG protein clearance from circulation, raising steady-state SHBG levels.',
    interpretation: 'A-allele carriers tend to have higher SHBG. Because SHBG binds testosterone, higher SHBG can reduce the free (bioactive) fraction even when total T looks normal.',
    evidenceStrength: 'Moderate',
    citations: [
      { label: 'Ohlsson et al., SHBG GWAS, Nat Genet', year: 2011, url: 'https://pubmed.ncbi.nlm.nih.gov/21131608/', type: 'gwas' },
    ],
  },
  {
    id: 'cyp17a1-rs743572',
    rsid: 'rs743572',
    gene: 'CYP17A1',
    variantLabel: 'T-34C',
    biomarkerIds: ['testosterone_total', 'testosterone_free'],
    riskAlleles: ['G'],
    direction: 'modulates',
    effectByGenotype: {
      heterozygous: 'AG: modestly altered androgen synthesis pathway flux.',
      homozygous:   'GG: further-modified flux through the androgen synthesis pathway; effect size on measured testosterone is small.',
    },
    whatItIs: 'Regulatory variant in CYP17A1, a key enzyme in the androgen synthesis pathway.',
    interpretation: 'Effect on measured testosterone is subtle; more relevant in downstream steroid metabolism than in a single testosterone reading.',
    evidenceStrength: 'Emerging',
    citations: [
      { label: 'Ohlsson et al., testosterone GWAS meta-analysis, Nat Comm', year: 2020, url: 'https://pubmed.ncbi.nlm.nih.gov/32398744/', type: 'gwas' },
    ],
  },
]

/**
 * Return every association that targets a given biomarker id.
 * Callers use this to render the "Genome links" section on a card.
 */
export function associationsForBiomarker(biomarkerId) {
  return SNP_ASSOCIATIONS.filter((a) => a.biomarkerIds.includes(biomarkerId))
}

export const EVIDENCE_STRENGTH_META = {
  High:     { label: 'High',     tone: 'text-emerald-800 bg-emerald-50 ring-emerald-200' },
  Moderate: { label: 'Moderate', tone: 'text-teal-800    bg-teal-50    ring-teal-200'    },
  Emerging: { label: 'Emerging', tone: 'text-amber-800   bg-amber-50   ring-amber-200'   },
}
