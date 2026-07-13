// /app/lib/supplements/ingredientForms.js
// PHASE 2: deepened ingredient-form ontology.
//
// Deterministic quality-tier map for the FORM of a supplement ingredient.
// The whole point of Supplement Protocol Intelligence: the difference between
// Methylfolate and Folic Acid, MK-7 and K1, Ubiquinol and Ubiquinone matters
// MORE than the brand marketing.
//
// Tiers (research-grounded, non-prescriptive):
//   preferred  - high-bioavailability / evidence-preferred form (green)
//   acceptable - decent form used broadly with reasonable evidence (blue)
//   basic      - cheapest / least-preferred form (amber, informational)
//
// Each form record can now optionally carry:
//   halfLife   - human plasma half-life or dose interval note
//   pairWith   - synergistic co-nutrients (e.g., "Fat", "K2 (for D3)")
//   caution    - context-dependent caveat (educational only)
//   evidence   - one-line evidence pointer ("Multiple RCTs", "Emerging")
//
// The `explain` string is the tooltip / expanded card body. We deliberately
// avoid superlatives - "is associated with", "research suggests", "may offer"
// - and never make disease claims.

export const INGREDIENT_FORM_TIERS = {
  /* ================= B-COMPLEX ================= */
  folate: {
    display: 'Folate (Vitamin B9)',
    forms: [
      { pattern: /(l-?5-?methyl(tetrahydro)?folate|l-methylfolate|methylfolate|5-mthf|metafolin|quatrefolic)/i,
        tier: 'preferred', label: 'L-5-Methylfolate',
        explain: 'The bioactive form of folate. Bypasses MTHFR conversion; often preferred for methylation support.',
        evidence: 'Multiple RCTs vs folic acid', pairWith: 'B12 (methylcobalamin)' },
      { pattern: /(folinic|calcium folinate|leucovorin)/i,
        tier: 'acceptable', label: 'Folinic Acid',
        explain: '5-formyl-tetrahydrofolate. Still requires one conversion step to methylfolate but is not the synthetic folic acid.' },
      { pattern: /(folic acid|pteroylglutamic|pteroyl-l-glutamic)/i,
        tier: 'basic', label: 'Folic Acid',
        explain: 'Synthetic. Must be converted by the body; conversion is impaired in MTHFR variant carriers.',
        caution: 'Unmetabolised folic acid can accumulate in some individuals with MTHFR variants.' },
    ],
  },
  'vitamin b12': {
    display: 'Vitamin B12 (Cobalamin)',
    forms: [
      { pattern: /methylcobalamin/i,
        tier: 'preferred', label: 'Methylcobalamin',
        explain: 'Active coenzyme form of B12 that participates directly in methylation.' },
      { pattern: /adenosylcobalamin|dibencozide/i,
        tier: 'preferred', label: 'Adenosylcobalamin',
        explain: 'The mitochondrial coenzyme form; often paired with methylcobalamin.' },
      { pattern: /hydroxo?cobalamin/i,
        tier: 'acceptable', label: 'Hydroxocobalamin',
        explain: 'Well-retained storage form. Body converts to active forms as needed.', halfLife: 'Long' },
      { pattern: /cyanocobalamin/i,
        tier: 'basic', label: 'Cyanocobalamin',
        explain: 'Cheapest, synthetic form. Body must strip a cyanide group. Not preferred if you have methylation variants.' },
    ],
  },
  b12: { alias: 'vitamin b12' },
  cobalamin: { alias: 'vitamin b12' },
  'vitamin b6': {
    display: 'Vitamin B6',
    forms: [
      { pattern: /(pyridoxal.?5.?phosphate|p5p|plp)/i,
        tier: 'preferred', label: 'P-5-P',
        explain: 'The active coenzyme form of B6 the body actually uses. Preferred in homocysteine metabolism.' },
      { pattern: /pyridoxine/i,
        tier: 'basic', label: 'Pyridoxine HCl',
        explain: 'Precursor form; must be converted by the liver to P-5-P.',
        caution: 'High long-term doses of pyridoxine have been associated with neuropathy in some case reports.' },
    ],
  },
  b6: { alias: 'vitamin b6' },
  'vitamin b1': {
    display: 'Vitamin B1 (Thiamine)',
    forms: [
      { pattern: /(benfotiamine)/i, tier: 'preferred', label: 'Benfotiamine',
        explain: 'Fat-soluble thiamine analog with higher bioavailability; researched for glycation-related endpoints.' },
      { pattern: /(sulbutiamine)/i, tier: 'preferred', label: 'Sulbutiamine',
        explain: 'Lipophilic thiamine dimer that crosses the blood-brain barrier better than thiamine HCl.' },
      { pattern: /(ttfd|thiamine tetrahydrofurfuryl disulfide|allithiamine)/i, tier: 'preferred', label: 'Allithiamine / TTFD',
        explain: 'High-bioavailability thiamine derivative; used in some metabolic protocols.' },
      { pattern: /(thiamin(?:e)? (hcl|hydrochloride|mononitrate|nitrate))|(thiamin(?:e)?$)/i,
        tier: 'basic', label: 'Thiamine HCl / Mononitrate',
        explain: 'Standard water-soluble form. Fine baseline; less potent than the fat-soluble analogs.' },
    ],
  },
  b1: { alias: 'vitamin b1' },
  thiamine: { alias: 'vitamin b1' },
  'vitamin b2': {
    display: 'Vitamin B2 (Riboflavin)',
    forms: [
      { pattern: /(riboflavin.?5.?phosphate|r5p|fmn|flavin mononucleotide)/i,
        tier: 'preferred', label: 'Riboflavin-5-Phosphate',
        explain: 'Active coenzyme form (FMN). Preferred if you have MTHFR C677T variants (riboflavin is a cofactor for MTHFR).' },
      { pattern: /riboflavin/i,
        tier: 'acceptable', label: 'Riboflavin',
        explain: 'Standard form; well-absorbed but requires a phosphorylation step to activate.' },
    ],
  },
  b2: { alias: 'vitamin b2' },
  riboflavin: { alias: 'vitamin b2' },
  niacin: {
    display: 'Niacin (Vitamin B3)',
    forms: [
      { pattern: /(nicotinamide riboside|nr\b|niagen)/i,
        tier: 'preferred', label: 'Nicotinamide Riboside',
        explain: 'NAD+ precursor. Small clinical evidence for raising NAD+ in humans.', evidence: 'Human RCTs, early' },
      { pattern: /(nicotinamide mononucleotide|nmn\b)/i,
        tier: 'preferred', label: 'NMN',
        explain: 'NAD+ precursor one step from NAD+. Regulatory status varies by region.',
        caution: 'FDA has questioned dietary-supplement status of NMN in the US (2022+).' },
      { pattern: /(inositol hexanicotinate|no.?flush niacin)/i,
        tier: 'acceptable', label: 'Inositol Hexanicotinate',
        explain: '"No-flush" niacin. Slower release; different pharmacokinetics from immediate-release nicotinic acid.' },
      { pattern: /(nicotinic acid|niacin\b)/i,
        tier: 'acceptable', label: 'Nicotinic Acid (Immediate Release)',
        explain: 'The form used in cardiovascular research (Boden et al. HDL studies). Causes flushing.',
        caution: 'Hepatotoxicity risk at high doses of extended-release forms.' },
      { pattern: /nicotinamide|niacinamide/i,
        tier: 'basic', label: 'Nicotinamide / Niacinamide',
        explain: 'Amide form; does not cause flushing but also does not raise HDL. Used in dermatology and NAD+ salvage.' },
    ],
  },
  b3: { alias: 'niacin' },

  /* ================= FAT-SOLUBLE VITAMINS ================= */
  'vitamin d': {
    display: 'Vitamin D',
    forms: [
      { pattern: /(cholecalciferol|d.?3|d3)/i,
        tier: 'preferred', label: 'Vitamin D3 (Cholecalciferol)',
        explain: 'The form the body naturally makes from sun exposure. Superior for raising serum 25-OH-D.',
        pairWith: 'K2 (MK-7) + magnesium + fat' },
      { pattern: /(ergocalciferol|d.?2|d2)/i,
        tier: 'basic', label: 'Vitamin D2 (Ergocalciferol)',
        explain: 'Plant-derived. Less effective at raising serum 25-OH-D than D3 in most head-to-head studies.' },
    ],
  },
  'vitamin d3': { alias: 'vitamin d' },
  cholecalciferol: { alias: 'vitamin d' },

  'vitamin k': {
    display: 'Vitamin K',
    forms: [
      { pattern: /(mk.?7|menaquinone.?7)/i,
        tier: 'preferred', label: 'Vitamin K2 as MK-7',
        explain: 'Long half-life menaquinone. Preferred for daily cardiovascular/bone research protocols.', halfLife: '~72 h' },
      { pattern: /(mk.?4|menaquinone.?4)/i,
        tier: 'acceptable', label: 'Vitamin K2 as MK-4',
        explain: 'Short half-life; requires multiple daily doses. Used in some Japanese bone-health protocols.', halfLife: '~1-2 h' },
      { pattern: /(k.?1|phyto?menadione|phyllo?quinone)/i,
        tier: 'basic', label: 'Vitamin K1',
        explain: 'Primarily supports coagulation; limited activity on bone/vascular K2-dependent proteins.' },
    ],
  },
  'vitamin k2': { alias: 'vitamin k' },
  menaquinone: { alias: 'vitamin k' },

  'vitamin a': {
    display: 'Vitamin A',
    forms: [
      { pattern: /(retinyl palmitate|retinol|preformed vitamin a)/i,
        tier: 'preferred', label: 'Preformed Vitamin A (Retinol / Retinyl Palmitate)',
        explain: 'Direct source; does not depend on carotenoid conversion (which is impaired in many individuals with BCMO1 variants).',
        caution: 'Do not exceed 10,000 IU/day chronically without clinical guidance, especially in pregnancy.' },
      { pattern: /(beta[- ]?carotene|provitamin a)/i,
        tier: 'acceptable', label: 'Beta-Carotene',
        explain: 'Precursor; conversion rate to retinol varies 4-40x between individuals (BCMO1 genotype dependent).' },
    ],
  },

  'vitamin e': {
    display: 'Vitamin E',
    forms: [
      { pattern: /(mixed tocopherols|tocotrienol|gamma[- ]?tocopherol)/i,
        tier: 'preferred', label: 'Mixed Tocopherols / Tocotrienols',
        explain: 'Full-spectrum vitamin E; supplemental alpha-tocopherol alone can lower gamma-tocopherol levels.',
        evidence: 'Meta-analyses on alpha-only forms are equivocal' },
      { pattern: /(d.?alpha[- ]?tocopherol|natural vitamin e)/i,
        tier: 'acceptable', label: 'd-Alpha-Tocopherol',
        explain: 'Natural (non-synthetic) alpha-tocopherol. Better retained than synthetic dl-form but incomplete without gamma.' },
      { pattern: /(dl[- ]?alpha[- ]?tocopherol|synthetic vitamin e|dl.?tocopherol)/i,
        tier: 'basic', label: 'dl-Alpha-Tocopherol (synthetic)',
        explain: 'Synthetic mix of 8 stereoisomers; body preferentially retains only one. Lower biological activity than natural form.' },
    ],
  },

  'vitamin c': {
    display: 'Vitamin C',
    forms: [
      { pattern: /(liposomal|phospholipid|lypo)/i,
        tier: 'preferred', label: 'Liposomal Vitamin C',
        explain: 'Phospholipid-encapsulated. Higher plasma AUC than plain ascorbic acid at equivalent doses.', evidence: 'Emerging clinical data' },
      { pattern: /(ester.?c|calcium ascorbate)/i,
        tier: 'acceptable', label: 'Ester-C / Calcium Ascorbate',
        explain: 'Buffered, non-acidic. Well-tolerated at higher doses; contains ascorbate metabolites.' },
      { pattern: /(sodium ascorbate|magnesium ascorbate|potassium ascorbate)/i,
        tier: 'acceptable', label: 'Mineral Ascorbate (buffered)',
        explain: 'Non-acidic form; gentler on the GI tract than ascorbic acid.' },
      { pattern: /(ascorbic acid|vitamin c\b)/i,
        tier: 'basic', label: 'Ascorbic Acid',
        explain: 'Standard form. Fine and cheap; can cause GI upset at higher single doses.' },
    ],
  },

  /* ================= MINERALS ================= */
  magnesium: {
    display: 'Magnesium',
    forms: [
      { pattern: /(bis)?glycinate/i, tier: 'preferred', label: 'Magnesium Glycinate',
        explain: 'Bound to glycine. Gentle on digestion; often preferred for sleep, relaxation, and stress support.' },
      { pattern: /threonate/i, tier: 'preferred', label: 'Magnesium L-Threonate',
        explain: 'Small clinical evidence for brain-penetrant delivery and cognitive support.',
        evidence: 'Small RCTs (Slutsky et al.)' },
      { pattern: /malate/i, tier: 'preferred', label: 'Magnesium Malate',
        explain: 'Well-absorbed; malate is a Krebs-cycle intermediate. Used in some fatigue/fibromyalgia protocols.' },
      { pattern: /taurate/i, tier: 'acceptable', label: 'Magnesium Taurate',
        explain: 'Paired with taurine; used in some cardiovascular research protocols.' },
      { pattern: /citrate/i, tier: 'acceptable', label: 'Magnesium Citrate',
        explain: 'Well-absorbed; may have a mild laxative effect at higher doses.' },
      { pattern: /(oxide|sulfate)/i, tier: 'basic', label: 'Magnesium Oxide / Sulfate',
        explain: 'Cheapest forms; low elemental absorption (~4% for oxide). Better forms exist.' },
    ],
  },

  zinc: {
    display: 'Zinc',
    forms: [
      { pattern: /(picolinate|bis?glycinate|glycinate)/i, tier: 'preferred', label: 'Zinc Picolinate / Bisglycinate',
        explain: 'Well-absorbed chelated forms of zinc.', pairWith: 'Copper (2-4x lower ratio for long-term use)' },
      { pattern: /(monomethionine|opti[- ]?zinc)/i, tier: 'preferred', label: 'Zinc Monomethionine (OptiZinc)',
        explain: 'Amino-acid chelate with strong retention data; used in some athletic supplements.' },
      { pattern: /citrate/i, tier: 'acceptable', label: 'Zinc Citrate',
        explain: 'Reasonable absorption; broadly used.' },
      { pattern: /(oxide|sulfate|gluconate)/i, tier: 'basic', label: 'Zinc Oxide / Sulfate / Gluconate',
        explain: 'Less-bioavailable forms. Gluconate is fine for short-term acute use (lozenges).' },
    ],
  },

  iron: {
    display: 'Iron',
    forms: [
      { pattern: /(bis)?glycinate/i, tier: 'preferred', label: 'Iron Bisglycinate',
        explain: 'Gentle on digestion; well-absorbed chelate. Preferred if standard iron salts cause GI issues.' },
      { pattern: /heme[- ]?iron/i, tier: 'preferred', label: 'Heme Iron Polypeptide',
        explain: 'Animal-derived heme iron; absorption is not inhibited by phytates/polyphenols.' },
      { pattern: /(ferrous fumarate|ferrous gluconate)/i, tier: 'acceptable', label: 'Ferrous Fumarate / Gluconate',
        explain: 'Standard iron salts; can cause GI side effects.' },
      { pattern: /(ferrous sulfate)/i, tier: 'basic', label: 'Ferrous Sulfate',
        explain: 'Cheapest; most common cause of GI side effects and constipation.',
        caution: 'Do not supplement iron without a serum ferritin test first.' },
    ],
  },

  calcium: {
    display: 'Calcium',
    forms: [
      { pattern: /(citrate|malate|citrate.?malate)/i, tier: 'preferred', label: 'Calcium Citrate / Malate',
        explain: 'Well-absorbed with or without food; does not require stomach acid.', pairWith: 'D3 + K2 + magnesium' },
      { pattern: /hydroxyapatite/i, tier: 'preferred', label: 'Microcrystalline Hydroxyapatite',
        explain: 'Whole-bone matrix; used in some bone-health protocols.' },
      { pattern: /carbonate/i, tier: 'basic', label: 'Calcium Carbonate',
        explain: 'Cheap. Requires stomach acid; poorly absorbed in older adults or PPI users.' },
    ],
  },

  selenium: {
    display: 'Selenium',
    forms: [
      { pattern: /(selenomethionine|se-methionine)/i, tier: 'preferred', label: 'Selenomethionine',
        explain: 'Organic form used in the SELECT trial. Well-retained in tissues.',
        caution: 'Do not exceed ~200 mcg/day chronically without a serum selenium test.' },
      { pattern: /(methyl.?selenocysteine|se.?methylselenocysteine)/i, tier: 'preferred', label: 'Se-Methylselenocysteine',
        explain: 'Emerging cancer-chemoprevention research; different metabolism from selenomethionine.' },
      { pattern: /(sodium selenite|sodium selenate)/i, tier: 'basic', label: 'Sodium Selenite / Selenate',
        explain: 'Inorganic forms; used in some multivitamins.' },
    ],
  },

  chromium: {
    display: 'Chromium',
    forms: [
      { pattern: /picolinate/i, tier: 'preferred', label: 'Chromium Picolinate',
        explain: 'Most-studied form for glycemic and body-composition endpoints.' },
      { pattern: /(polynicotinate|nicotinate)/i, tier: 'acceptable', label: 'Chromium Polynicotinate',
        explain: 'Niacin-bound; well-tolerated alternative.' },
      { pattern: /(chloride|chromic chloride)/i, tier: 'basic', label: 'Chromium Chloride',
        explain: 'Older form; lower bioavailability than picolinate.' },
    ],
  },

  copper: {
    display: 'Copper',
    forms: [
      { pattern: /(bis)?glycinate/i, tier: 'preferred', label: 'Copper Bisglycinate',
        explain: 'Chelated form; well-absorbed and generally well-tolerated.' },
      { pattern: /(oxide|sulfate)/i, tier: 'basic', label: 'Copper Oxide / Sulfate',
        explain: 'Cheap inorganic forms; oxide is essentially non-absorbable.' },
    ],
  },

  /* ================= FATTY ACIDS ================= */
  'omega-3': {
    display: 'Omega-3 (EPA/DHA)',
    forms: [
      { pattern: /(re.?esterified|triglyceride|rtg|natural triglyceride)/i,
        tier: 'preferred', label: 'Triglyceride (rTG)',
        explain: 'Re-esterified triglyceride form. Higher absorption in most head-to-head studies.', pairWith: 'Fat / meal' },
      { pattern: /(phospholipid|krill)/i, tier: 'preferred', label: 'Phospholipid (Krill)',
        explain: 'Phospholipid-bound EPA/DHA; sustainable sourcing considerations apply.' },
      { pattern: /(ethyl ester|\bee\b)/i, tier: 'acceptable', label: 'Ethyl Ester (EE)',
        explain: 'Cheaper concentrated form. Absorption improves when taken with fat.' },
      { pattern: /(cod liver oil)/i, tier: 'acceptable', label: 'Cod Liver Oil',
        explain: 'Whole-food source; also delivers vitamins A and D. Look for tested purity.' },
    ],
  },
  'fish oil': { alias: 'omega-3' },
  epa: { alias: 'omega-3' },
  dha: { alias: 'omega-3' },

  /* ================= COENZYMES / MITOCHONDRIA ================= */
  'coenzyme q10': {
    display: 'CoQ10',
    forms: [
      { pattern: /ubiquinol/i, tier: 'preferred', label: 'Ubiquinol',
        explain: 'The reduced, active form. Better absorbed than ubiquinone, especially in adults over 40 and statin users.',
        pairWith: 'Fat' },
      { pattern: /ubiquinone/i, tier: 'acceptable', label: 'Ubiquinone',
        explain: 'Oxidized form; must be converted to ubiquinol in the body.' },
    ],
  },
  coq10: { alias: 'coenzyme q10' },
  ubiquinol: { alias: 'coenzyme q10' },
  ubiquinone: { alias: 'coenzyme q10' },

  /* ================= CHOLINE / COGNITION ================= */
  choline: {
    display: 'Choline',
    forms: [
      { pattern: /(alpha.?gpc|alpha[- ]?glyceryl.?phosphoryl.?choline|l.?alpha.?glycerylphosphorylcholine)/i,
        tier: 'preferred', label: 'Alpha-GPC',
        explain: 'Crosses the blood-brain barrier readily; used in athletic and cognitive research protocols.',
        evidence: 'Small RCTs (power output, cognition)' },
      { pattern: /(citicoline|cdp.?choline|cognizin)/i, tier: 'preferred', label: 'Citicoline (CDP-Choline)',
        explain: 'Delivers both choline and cytidine (uridine precursor). Well-studied for cognitive endpoints.' },
      { pattern: /(bitartrate|choline chloride)/i, tier: 'basic', label: 'Choline Bitartrate',
        explain: 'Cheapest form; less BBB penetration than Alpha-GPC or Citicoline.' },
    ],
  },

  /* ================= AMINO ACIDS / CREATINE ================= */
  creatine: {
    display: 'Creatine',
    forms: [
      { pattern: /(monohydrate|creapure)/i, tier: 'preferred', label: 'Creatine Monohydrate',
        explain: 'The most-studied form (hundreds of RCTs). Creapure is a European purity-certified brand.',
        evidence: 'Hundreds of RCTs (strength, cognition, sarcopenia)' },
      { pattern: /(hcl|hydrochloride)/i, tier: 'acceptable', label: 'Creatine HCl',
        explain: 'More water-soluble; some anecdotal reports of better GI tolerance. Less evidence than monohydrate.' },
      { pattern: /(nitrate|ethyl ester|magnesium chelate|buffered|kre.?alkalyn)/i,
        tier: 'basic', label: 'Novel Creatine (nitrate/ester/buffered)',
        explain: 'Marketing-driven variants. No consistent evidence of superiority to monohydrate; usually more expensive.' },
    ],
  },

  /* ================= ADAPTOGENS ================= */
  ashwagandha: {
    display: 'Ashwagandha',
    forms: [
      { pattern: /ksm.?66/i, tier: 'preferred', label: 'KSM-66',
        explain: 'Full-spectrum root extract; the most heavily-studied branded ashwagandha for stress and cortisol.',
        evidence: '20+ RCTs' },
      { pattern: /sensoril/i, tier: 'preferred', label: 'Sensoril',
        explain: 'Root-and-leaf extract standardized to withanolides. Studied for stress and sleep.' },
      { pattern: /(shoden)/i, tier: 'preferred', label: 'Shoden',
        explain: 'High-withanolide extract (~35% total withanolide glycosides).' },
      { pattern: /(withania|ashwagandha)/i, tier: 'acceptable', label: 'Generic Ashwagandha Extract',
        explain: 'Standardized extracts vary in quality; look for the branded forms if possible.' },
    ],
  },

  rhodiola: {
    display: 'Rhodiola Rosea',
    forms: [
      { pattern: /(shr.?5|rhodax|rosea premium|3%.*rosavin|rosavin.*3%)/i,
        tier: 'preferred', label: 'Standardized (3% rosavins / 1% salidroside)',
        explain: 'The extract used in most RCTs. Look for both rosavins AND salidroside standardization.' },
      { pattern: /(rhodiola|rhodola)/i, tier: 'acceptable', label: 'Generic Rhodiola Extract',
        explain: 'Standardization highly variable; check for rosavins/salidroside ratios on the label.' },
    ],
  },

  curcumin: {
    display: 'Curcumin / Turmeric',
    forms: [
      { pattern: /(meriva|phytosome|longvida|bcm.?95|theracurmin|curcuwin|novasol)/i,
        tier: 'preferred', label: 'Bioavailable Curcumin (branded)',
        explain: 'Phospholipid, phytosome, or nano-formulated curcumin. 10-30x higher plasma levels than plain curcumin.' },
      { pattern: /(black pepper|piperine|bioperine).+curcumin|curcumin.+(black pepper|piperine|bioperine)/i,
        tier: 'acceptable', label: 'Curcumin + Piperine',
        explain: 'Piperine increases absorption ~20x. Older evidence base than branded phytosome forms.',
        caution: 'Piperine can affect drug metabolism (CYP3A4). Space from prescriptions.' },
      { pattern: /(curcumin|turmeric)/i, tier: 'basic', label: 'Plain Curcumin / Turmeric',
        explain: 'Poorly absorbed on its own. Look for a bioavailability system.' },
    ],
  },
  turmeric: { alias: 'curcumin' },

  /* ================= NEW: PROBIOTICS / FIBER / MISC ================= */
  probiotic: {
    display: 'Probiotic',
    forms: [
      { pattern: /(lgg|lactobacillus rhamnosus gg)/i, tier: 'preferred', label: 'L. rhamnosus GG',
        explain: 'Most-studied probiotic strain in the world; broad research base.' },
      { pattern: /(bb.?12|bifidobacterium animalis subsp\. lactis bb.?12)/i, tier: 'preferred', label: 'B. lactis BB-12',
        explain: 'Well-characterized strain with pediatric and adult clinical data.' },
      { pattern: /(hn019|dr10)/i, tier: 'preferred', label: 'B. lactis HN019 / DR10',
        explain: 'Immune and GI-transit RCT evidence.' },
      { pattern: /(saccharomyces boulardii|s\. boulardii)/i, tier: 'preferred', label: 'S. boulardii',
        explain: 'Yeast-based probiotic; distinct mechanism from bacterial strains.' },
      { pattern: /(lactobacillus|bifidobacterium|probiotic)/i, tier: 'acceptable', label: 'Multi-strain Probiotic',
        explain: 'Effect is strain-specific. Look for products that list exact strain designations (not just species).' },
    ],
  },

  melatonin: {
    display: 'Melatonin',
    forms: [
      { pattern: /(microdose|0\.[1-5] mg|300 mcg|500 mcg|low.?dose)/i, tier: 'preferred', label: 'Low-Dose (0.3-1 mg)',
        explain: 'Physiologic dose range used in most sleep RCTs.',
        caution: 'Higher doses do not mean better sleep and may worsen next-day grogginess.' },
      { pattern: /(sustained release|extended release|time.?release)/i, tier: 'acceptable', label: 'Extended-Release Melatonin',
        explain: 'Slower release for sleep maintenance; may suit early-morning-awakening pattern.' },
      { pattern: /melatonin/i, tier: 'acceptable', label: 'Immediate-Release Melatonin',
        explain: 'Most common form. Take 30-60 min before intended sleep onset.' },
    ],
  },

  '5-htp': {
    display: '5-HTP',
    forms: [
      { pattern: /(griffonia|standardized 5.?htp)/i, tier: 'preferred', label: 'Griffonia-Sourced 5-HTP',
        explain: 'Extracted from Griffonia simplicifolia seed; well-characterized commercial source.',
        caution: 'Do not combine with SSRIs, MAOIs, or tramadol without clinical guidance.' },
    ],
  },

  berberine: {
    display: 'Berberine',
    forms: [
      { pattern: /(dihydroberberine|berberine phytosome|berbevis)/i, tier: 'preferred', label: 'Dihydroberberine / Berberine Phytosome',
        explain: 'Higher-bioavailability berberine derivatives; smaller doses achieve equivalent plasma levels.' },
      { pattern: /berberine/i, tier: 'acceptable', label: 'Berberine HCl',
        explain: 'Standard form; poor bioavailability so ~500 mg 2-3x daily is typical.',
        caution: 'Inhibits CYP3A4; can interact with many medications.' },
    ],
  },

  'lion\'s mane': {
    display: "Lion's Mane",
    forms: [
      { pattern: /(fruiting body|8:1|12:1|hot water extract|dual extract)/i, tier: 'preferred', label: 'Fruiting-Body Extract',
        explain: 'Standardized to beta-glucans; fruiting body has higher hericenones than mycelium/grain products.' },
      { pattern: /(mycelium|myceliated grain|grown on grain)/i, tier: 'basic', label: 'Mycelium on Grain',
        explain: 'Often mostly grain starch; lower active compound density than fruiting-body extracts.' },
    ],
  },
  hericium: { alias: "lion's mane" },

  bacopa: {
    display: 'Bacopa Monnieri',
    forms: [
      { pattern: /(bacognize|bacopa monnieri.*(45|50|55)%|bacosides.*(45|50|55)%|synapsa)/i,
        tier: 'preferred', label: 'Standardized Extract (45-55% bacosides)',
        explain: 'The extracts used in the multi-week cognition RCTs. Look for Bacognize or Synapsa branding.' },
      { pattern: /bacopa/i, tier: 'acceptable', label: 'Generic Bacopa',
        explain: 'Check for bacoside standardization on the label.' },
    ],
  },

  resveratrol: {
    display: 'Resveratrol',
    forms: [
      { pattern: /(trans.?resveratrol)/i, tier: 'preferred', label: 'Trans-Resveratrol',
        explain: 'The biologically active isomer. Look for 98%+ trans-isomer standardization.' },
      { pattern: /resveratrol/i, tier: 'acceptable', label: 'Generic Resveratrol',
        explain: 'Cis-/trans- ratios vary; trans is the researched isomer.' },
    ],
  },

  quercetin: {
    display: 'Quercetin',
    forms: [
      { pattern: /(quercetin phytosome|quercefit)/i, tier: 'preferred', label: 'Quercetin Phytosome (Quercefit)',
        explain: 'Phospholipid-formulated quercetin with substantially higher bioavailability.' },
      { pattern: /(dihydrate|anhydrous|quercetin)/i, tier: 'acceptable', label: 'Standard Quercetin',
        explain: 'Poor absorption; typically dosed at 500-1000 mg for effect.' },
    ],
  },

  'n-acetylcysteine': {
    display: 'N-Acetylcysteine (NAC)',
    forms: [
      { pattern: /(pharmagra|pharmaceutical grade|nac)/i, tier: 'preferred', label: 'N-Acetylcysteine',
        explain: 'Glutathione precursor. Well-studied in respiratory, hepatic, and psychiatric research.',
        caution: 'FDA has periodically questioned NAC dietary-supplement status in the US.' },
    ],
  },
  nac: { alias: 'n-acetylcysteine' },

  glutathione: {
    display: 'Glutathione',
    forms: [
      { pattern: /(liposomal|lipsome|setria).*glutathione|glutathione.*(liposomal|lipsome|setria)/i,
        tier: 'preferred', label: 'Liposomal / Setria Glutathione',
        explain: 'Formulated to survive digestion. Better plasma outcomes than plain reduced glutathione.' },
      { pattern: /(l.?glutathione|reduced glutathione)/i, tier: 'basic', label: 'Reduced Glutathione (Plain)',
        explain: 'Largely degraded in the gut. Use NAC or a liposomal form instead.' },
    ],
  },

  'alpha-lipoic-acid': {
    display: 'Alpha-Lipoic Acid',
    forms: [
      { pattern: /(r.?ala|r.?alpha.?lipoic|na.?rala|biotivia)/i, tier: 'preferred', label: 'R-Lipoic Acid (R-ALA)',
        explain: 'The biologically active isomer. Higher potency than racemic mixtures.' },
      { pattern: /(alpha.?lipoic|thioctic|racemic)/i, tier: 'acceptable', label: 'Racemic Alpha-Lipoic Acid',
        explain: '50:50 mix of R and S isomers. Broadly available and inexpensive.' },
    ],
  },
  ala: { alias: 'alpha-lipoic-acid' },

  collagen: {
    display: 'Collagen',
    forms: [
      { pattern: /(hydrolyzed|peptides|collagen peptides|verisol|peptan|fortigel|bodybalance)/i,
        tier: 'preferred', label: 'Hydrolyzed Collagen Peptides',
        explain: 'Low-molecular-weight peptides that survive digestion. Look for branded actives (Verisol, Peptan, Fortigel).' },
      { pattern: /(gelatin|type ii collagen|uc.?ii)/i, tier: 'acceptable', label: 'Undenatured Type-II / Gelatin',
        explain: 'UC-II has small joint-health RCT evidence; gelatin is a bulk protein source.' },
      { pattern: /collagen/i, tier: 'acceptable', label: 'Generic Collagen',
        explain: 'Check for hydrolysis/peptide labelling.' },
    ],
  },
}

// -------- helpers --------

// Resolve ingredient key from an ingredient name string (case-insensitive).
export function resolveIngredientKey(rawName) {
  if (!rawName) return null
  const name = String(rawName).toLowerCase().trim()
  if (INGREDIENT_FORM_TIERS[name]) {
    return INGREDIENT_FORM_TIERS[name].alias || name
  }
  // Substring match - pick the longest key that occurs in the ingredient text
  let bestKey = null
  let bestLen = 0
  for (const key of Object.keys(INGREDIENT_FORM_TIERS)) {
    if (name.includes(key) && key.length > bestLen) {
      bestKey = key
      bestLen = key.length
    }
  }
  if (!bestKey) return null
  return INGREDIENT_FORM_TIERS[bestKey].alias || bestKey
}

// Given an ingredient (name + optional forms/notes), return the best-matching
// form tier record. Returns null if this ingredient is not in our tier map.
export function evaluateIngredientForm({ name, formName, notes, group }) {
  const key = resolveIngredientKey(group) || resolveIngredientKey(name) || resolveIngredientKey(formName)
  if (!key) return null
  const entry = INGREDIENT_FORM_TIERS[key]
  if (!entry?.forms) return null

  const haystack = [group, name, formName, notes].filter(Boolean).join(' ')
  for (const form of entry.forms) {
    if (form.pattern.test(haystack)) {
      return {
        ingredient: entry.display,
        tier: form.tier,
        formLabel: form.label,
        explain: form.explain,
        halfLife: form.halfLife || null,
        pairWith: form.pairWith || null,
        caution: form.caution || null,
        evidence: form.evidence || null,
      }
    }
  }
  // No pattern matched - return the ingredient identifier but tier unknown
  return {
    ingredient: entry.display,
    tier: 'unknown',
    formLabel: name || formName || 'Unspecified form',
    explain: 'Form not recognised in our reference set.',
  }
}
