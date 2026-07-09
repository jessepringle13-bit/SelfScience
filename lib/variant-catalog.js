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

export const APPROVED_RSIDS = new Set([
  ...Object.keys(VARIANT_CATALOG),
  // Extended per Session-5 spec (approved rsIDs for parsing only; the AI
  // interprets these from its training when not detailed in VARIANT_CATALOG)
  'rs1421085', 'rs1801282', 'rs1535', 'rs3834458', 'rs1260326',
  'rs7501331', 'rs33972313', 'rs182549', 'rs2069514', 'rs1229984',
  'rs1800562', 'rs1799945', 'rs2228570', 'rs731236', 'rs7041',
  'rs3135506', 'rs693', 'rs1367117', 'rs688', 'rs5925',
  'rs4253778', 'rs1042638', 'rs8192678', 'rs12722', 'rs71746744',
  'rs1107946', 'rs1799750', 'rs679620', 'rs2010963', 'rs3025039',
  'rs1049434', 'rs7832552', 'rs35767', 'rs6214', 'rs2229765',
  'rs1799817', 'rs10457180', 'rs13217795', 'rs12778366', 'rs7895833',
  'rs11246020', 'rs9420907', 'rs10069690', 'rs2736100', 'rs2736098',
  'rs6010620', 'rs1800795', 'rs1800629', 'rs1205', 'rs1800947',
  'rs1799964', 'rs1042522', 'rs1799977', 'rs13181', 'rs1136410',
  'rs28897672', 'rs6323', 'rs3788862', 'rs25531', 'rs2064070',
  'rs4251417', 'rs1360780', 'rs9470080', 'rs3800373', 'rs1800497',
  'rs6275', 'rs1076560', 'rs1800955', 'rs7799652', 'rs4570625',
  'rs1386494', 'rs10830963', 'rs1387153', 'rs1801260', 'rs4580704',
  'rs57875989', 'rs244769', 'rs324981', 'rs2119882', 'rs121908617',
  'rs1065852', 'rs3892097', 'rs5030655', 'rs28371706', 'rs35742686',
  'rs4244285', 'rs4986893', 'rs12248560', 'rs1799853', 'rs1057910',
  'rs2740574', 'rs776746', 'rs2306283', 'rs1142345', 'rs1800460',
  'rs1800462', 'rs5030868', 'rs4148323', 'rs8175347', 'rs1208',
  'rs1801280', 'rs1799929', 'rs1041983', 'rs4147568', 'rs854560',
  'rs854571', 'rs1800566', 'rs4646903', 'rs1048943', 'rs1799814',
  'rs2187668', 'rs7454108', 'rs2858331', 'rs1800896', 'rs2275913',
  'rs3087243', 'rs231775', 'rs2476601', 'rs5743708', 'rs4986790',
  'rs4986791', 'rs2201841', 'rs11209026', 'rs10489629', 'rs7574865',
  'rs9322335', 'rs743572', 'rs2414096', 'rs9340799', 'rs2234693',
  'rs4986938', 'rs1256049', 'rs2854744', 'rs6220', 'rs1137101',
  'rs1805134', 'rs2268458', 'rs1991517', 'rs12913832', 'rs1800407',
  'rs4778241', 'rs4778138', 'rs11547464', 'rs1805007', 'rs1805008',
  'rs2228479', 'rs885479', 'rs1042602', 'rs1393350', 'rs35264875',
  'rs3745901', 'rs12203592', 'rs16891982', 'rs26722', 'rs17646946',
  'rs3212355', 'rs17822931', 'rs713598', 'rs1726866', 'rs10246939',
  'rs4481887', 'rs4654748', 'rs6746030', 'rs3750904', 'rs601338',
  'rs8111874', 'rs8004664', 'rs2066842', 'rs5743293', 'rs2076756',
  'rs7517847', 'rs1004819',
])

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
