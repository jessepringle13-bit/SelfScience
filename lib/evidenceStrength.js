// /app/lib/evidenceStrength.js
// SelfScience — Evidence strength classifications per rsID.
//
// This is a static, local, hand-curated lookup used purely to render the
// small "Established / Emerging / Preliminary" chip on every variant card.
// It never controls a badge classification or triggers any API call.
//
// tier: 'established' | 'emerging' | 'preliminary'
//   - established: replicated across 10+ independent studies (GWAS meta-
//                  analyses, textbook variants).
//   - emerging:    2–9 studies; well-supported but still accumulating.
//   - preliminary: 1–2 studies; exploratory context only.
//
// STUDY-COUNT REVIEW NOTE: values below reflect a best-effort literature
// review as of build time. Numbers like "10+" and "2–9" are ranges, not
// exact citation counts, and should be re-verified before any high-stakes
// use. Nothing here is a medical claim.

export const EVIDENCE_STRENGTH = {
  // ---- Methylation / one-carbon (highly established) ----
  rs1801133: { tier: 'established', studyCount: '10+', note: 'MTHFR C677T — one of the most-studied variants in human genetics.' },
  rs1801131: { tier: 'established', studyCount: '10+', note: 'MTHFR A1298C — extensively studied, compounds C677T when co-inherited.' },
  rs1805087: { tier: 'emerging',    studyCount: '2–9', note: 'MTR A2756G — solid B12/methylation research base.' },
  rs1801394: { tier: 'emerging',    studyCount: '2–9', note: 'MTRR A66G — recycles B12 for methylation; well-studied context variant.' },
  rs602662:  { tier: 'established', studyCount: '10+', note: 'FUT2 secretor status — extensively replicated across gut and B12 studies.' },
  rs2274976: { tier: 'preliminary', studyCount: '1–2', note: 'MTHFR R594Q — emerging methylation context variant.' },

  // ---- Neurotransmitter / cognition ----
  rs4680:    { tier: 'established', studyCount: '10+', note: 'COMT Val158Met — extensively replicated across cognition, pain, and stress literature.' },
  rs4818:    { tier: 'emerging',    studyCount: '2–9', note: 'COMT haplotype tag — supporting variant for COMT activity classification.' },
  rs4633:    { tier: 'emerging',    studyCount: '2–9', note: 'COMT synonymous variant — used with rs4680 for haplotype resolution.' },
  rs25531:   { tier: 'established', studyCount: '10+', note: 'SLC6A4 L/S promoter variant — heavily studied in mood and stress research.' },
  rs2064070: { tier: 'preliminary', studyCount: '1–2', note: 'SLC6A4 supporting SNP for L/S haplotype resolution.' },

  // ---- Nutrition / metabolism (well studied) ----
  rs4988235: { tier: 'established', studyCount: '10+', note: 'LCT / MCM6 lactase persistence — landmark variant, extensively replicated.' },
  rs182549:  { tier: 'established', studyCount: '10+', note: 'LCT persistence — second well-studied position at the MCM6/LCT enhancer.' },
  rs762551:  { tier: 'established', studyCount: '10+', note: 'CYP1A2*1F — caffeine metabolism speed; well replicated across cardiovascular studies.' },
  rs671:     { tier: 'established', studyCount: '10+', note: 'ALDH2 Glu504Lys — the alcohol flush variant; deeply studied East Asian population variant.' },
  rs1229984: { tier: 'established', studyCount: '10+', note: 'ADH1B His48Arg — fast alcohol metabolism; well replicated.' },
  rs9939609: { tier: 'established', studyCount: '10+', note: 'FTO — canonical obesity-risk locus; extensively replicated across cohorts.' },
  rs17782313:{ tier: 'established', studyCount: '10+', note: 'MC4R — appetite regulation variant; large GWAS support.' },
  rs1801282: { tier: 'established', studyCount: '10+', note: 'PPARG Pro12Ala — insulin sensitivity; large diabetes cohort replication.' },
  rs7903146: { tier: 'established', studyCount: '10+', note: 'TCF7L2 — the most robust T2D-risk locus discovered by GWAS.' },
  rs4402960: { tier: 'emerging',    studyCount: '2–9', note: 'IGF2BP2 — replicated glucose regulation variant.' },
  rs5219:    { tier: 'emerging',    studyCount: '2–9', note: 'KCNJ11 E23K — insulin secretion channel; supported by multiple studies.' },

  // ---- Vitamins & micronutrient conversion ----
  rs12934922:{ tier: 'emerging',    studyCount: '2–9', note: 'BCMO1 R267S — beta-carotene→retinol conversion; multiple mechanism studies.' },
  rs7501331: { tier: 'preliminary', studyCount: '1–2', note: 'BCMO1 secondary variant — supporting evidence only.' },
  rs2282679: { tier: 'established', studyCount: '10+', note: 'GC (vitamin D binding protein) — replicated across vitamin D GWAS.' },
  rs4588:    { tier: 'emerging',    studyCount: '2–9', note: 'GC vitamin D transport variant — well-supported companion SNP.' },
  rs2228570: { tier: 'emerging',    studyCount: '2–9', note: 'VDR FokI — receptor responsiveness; consistent moderate literature.' },
  rs1544410: { tier: 'emerging',    studyCount: '2–9', note: 'VDR BsmI — receptor binding variant; well-studied bone density research.' },
  rs731236:  { tier: 'emerging',    studyCount: '2–9', note: 'VDR TaqI — companion vitamin D receptor SNP.' },

  // ---- Fatty acids ----
  rs174537:  { tier: 'established', studyCount: '10+', note: 'FADS1 — canonical omega-3 conversion efficiency locus.' },
  rs174547:  { tier: 'established', studyCount: '10+', note: 'FADS1 tag — well-studied ALA→EPA/DHA conversion variant.' },
  rs1535:    { tier: 'emerging',    studyCount: '2–9', note: 'FADS1 desaturation variant — well-supported.' },
  rs3834458: { tier: 'emerging',    studyCount: '2–9', note: 'FADS2 desaturation variant.' },

  // ---- Iron / trace minerals ----
  rs1800562: { tier: 'established', studyCount: '10+', note: 'HFE C282Y — hemochromatosis-associated variant; deeply studied.' },
  rs1799945: { tier: 'established', studyCount: '10+', note: 'HFE H63D — the second HFE variant, extensively studied.' },

  // ---- Cardiovascular ----
  rs429358:  { tier: 'established', studyCount: '10+', note: 'APOE variant defining ε2/ε3/ε4; landmark cardiovascular and cognition variant.' },
  rs7412:    { tier: 'established', studyCount: '10+', note: 'APOE companion variant; extensively replicated.' },
  rs11591147:{ tier: 'established', studyCount: '10+', note: 'PCSK9 R46L — loss-of-function variant; landmark LDL research target.' },
  rs693:     { tier: 'emerging',    studyCount: '2–9', note: 'APOB — LDL particle size and density variant.' },
  rs708272:  { tier: 'established', studyCount: '10+', note: 'CETP TaqIB — HDL cholesterol levels; extensively replicated.' },
  rs5882:    { tier: 'emerging',    studyCount: '2–9', note: 'CETP I405V — longevity/HDL companion variant.' },
  rs662799:  { tier: 'established', studyCount: '10+', note: 'APOA5 — well-studied triglyceride response variant.' },
  rs328:     { tier: 'emerging',    studyCount: '2–9', note: 'LPL S447X — triglyceride clearance gain-of-function.' },
  rs1800629: { tier: 'established', studyCount: '10+', note: 'TNF-α promoter — extensively studied inflammation variant.' },
  rs1800795: { tier: 'established', studyCount: '10+', note: 'IL6 — well-studied inflammation cytokine promoter variant.' },

  // ---- Sleep / circadian ----
  rs10830963:{ tier: 'established', studyCount: '10+', note: 'MTNR1B — canonical late-eating / fasting glucose variant.' },
  rs1387153: { tier: 'emerging',    studyCount: '2–9', note: 'MTNR1B second-position variant; compounds rs10830963.' },
  rs228697:  { tier: 'preliminary', studyCount: '1–2', note: 'PER3 chronotype variant — emerging research.' },
  rs1801260: { tier: 'emerging',    studyCount: '2–9', note: 'CLOCK 3111T/C — well-studied circadian variant.' },
  rs1144566: { tier: 'preliminary', studyCount: '1–2', note: 'TIMELESS variant — emerging circadian research.' },

  // ---- Sports performance ----
  rs1815739: { tier: 'established', studyCount: '10+', note: 'ACTN3 R577X — the "sprint/endurance" fiber-type variant; extensively studied.' },
  rs4253778: { tier: 'emerging',    studyCount: '2–9', note: 'PPARA — fat oxidation during exercise; multiple sports studies.' },
  rs8192678: { tier: 'emerging',    studyCount: '2–9', note: 'PPARGC1A Gly482Ser — mitochondrial biogenesis variant.' },
  rs12722:   { tier: 'emerging',    studyCount: '2–9', note: 'COL5A1 — connective tissue elasticity / injury risk.' },

  // ---- Detox / xenobiotic ----
  rs1799930: { tier: 'established', studyCount: '10+', note: 'NAT2*6 slow-acetylator allele — extensively studied pharmacogenomic variant.' },
  rs1208:    { tier: 'emerging',    studyCount: '2–9', note: 'NAT2 supporting variant for acetylator status.' },
  rs1041983: { tier: 'emerging',    studyCount: '2–9', note: 'NAT2 companion variant.' },
  rs1801280: { tier: 'emerging',    studyCount: '2–9', note: 'NAT2*5 slow-acetylator variant.' },
  rs1799929: { tier: 'emerging',    studyCount: '2–9', note: 'NAT2 haplotype resolution variant.' },
  rs1695:    { tier: 'emerging',    studyCount: '2–9', note: 'GSTP1 I105V — well-studied glutathione conjugation variant.' },
  rs1050450: { tier: 'emerging',    studyCount: '2–9', note: 'GPX1 Pro198Leu — oxidative stress response.' },

  // ---- Pharmacogenomics (established for most) ----
  rs4244285: { tier: 'established', studyCount: '10+', note: 'CYP2C19*2 — canonical poor-metabolizer variant.' },
  rs4986893: { tier: 'established', studyCount: '10+', note: 'CYP2C19*3 — well-studied loss-of-function allele.' },
  rs12248560:{ tier: 'established', studyCount: '10+', note: 'CYP2C19*17 — rapid metabolizer variant; well-replicated.' },
  rs1065852: { tier: 'established', studyCount: '10+', note: 'CYP2D6*10 tag — extensively studied pharmacogenomic variant.' },
  rs3892097: { tier: 'established', studyCount: '10+', note: 'CYP2D6*4 — landmark poor-metabolizer variant.' },
  rs5030655: { tier: 'emerging',    studyCount: '2–9', note: 'CYP2D6*6 variant — well-studied loss-of-function.' },
  rs28371706:{ tier: 'preliminary', studyCount: '1–2', note: 'CYP2D6 supporting variant.' },
  rs35742686:{ tier: 'emerging',    studyCount: '2–9', note: 'CYP2D6*3 variant.' },
  rs9923231: { tier: 'established', studyCount: '10+', note: 'VKORC1 — warfarin dosing; landmark pharmacogenomic variant.' },
  rs1799853: { tier: 'established', studyCount: '10+', note: 'CYP2C9*2 — well-studied warfarin metabolism variant.' },
  rs1057910: { tier: 'established', studyCount: '10+', note: 'CYP2C9*3 — canonical warfarin PGx variant.' },

  // ---- Immune / gut ----
  rs11209026:{ tier: 'established', studyCount: '10+', note: 'IL23R — replicated IBD / gut inflammation variant.' },
  rs10754558:{ tier: 'emerging',    studyCount: '2–9', note: 'NLRP3 — inflammasome activation.' },

  // ---- Longevity ----
  rs2802292: { tier: 'established', studyCount: '10+', note: 'FOXO3 — canonical longevity-associated variant; multiple cohort replications.' },
  rs1042522: { tier: 'established', studyCount: '10+', note: 'TP53 Arg72Pro — extensively studied p53 codon 72 variant.' },
}

export const EVIDENCE_TIER_META = {
  established: {
    label: 'Established',
    description: 'Established: This association has been replicated across 10 or more independent studies.',
  },
  emerging: {
    label: 'Emerging',
    description: 'Emerging: This association has been observed in 2–9 studies and is still being validated.',
  },
  preliminary: {
    label: 'Preliminary',
    description: 'Preliminary: This association comes from 1–2 studies and should be considered exploratory.',
  },
}

export function getEvidenceStrength(rsid) {
  if (!rsid) return null
  return EVIDENCE_STRENGTH[rsid] || null
}
