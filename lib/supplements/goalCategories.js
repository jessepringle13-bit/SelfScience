// /app/lib/supplements/goalCategories.js
// Deterministic, hand-curated map from user health-goal to the ingredient
// categories that Phase-1 SelfScience Supplement Discovery will surface.
// Phase 3 will layer genome/biomarker personalisation on top; Phase 1 is a
// clean, explainable, category-first browse.

export const GOALS = [
  {
    id: 'sleep',
    label: 'Sleep & Recovery',
    description: 'Support falling asleep, staying asleep, and morning recovery.',
    icon: '🌙',
    categories: [
      { id: 'magnesium-glycinate', label: 'Magnesium Glycinate', dsldQuery: 'magnesium glycinate', notes: 'Chelated magnesium form often paired with sleep/relaxation research.' },
      { id: 'glycine', label: 'Glycine', dsldQuery: 'glycine', notes: 'Amino acid; some sleep-latency and core-body-temperature evidence.' },
      { id: 'l-theanine', label: 'L-Theanine', dsldQuery: 'l-theanine', notes: 'Green-tea amino acid; alpha-wave / calm-alertness research.' },
      { id: 'apigenin', label: 'Apigenin', dsldQuery: 'apigenin', notes: 'Flavonoid found in chamomile; emerging sleep research.' },
      { id: 'melatonin-low-dose', label: 'Low-Dose Melatonin', dsldQuery: 'melatonin 0.3', notes: 'Look for 0.3–1 mg products; higher doses are more research-controversial.' },
    ],
  },
  {
    id: 'energy',
    label: 'Energy & Mitochondria',
    description: 'Support cellular energy production and daytime vitality.',
    icon: '⚡',
    categories: [
      { id: 'coq10', label: 'CoQ10 (Ubiquinol)', dsldQuery: 'ubiquinol', notes: 'Prefer ubiquinol over ubiquinone for adults 40+.' },
      { id: 'creatine', label: 'Creatine Monohydrate', dsldQuery: 'creatine monohydrate', notes: 'Best-studied ergogenic aid; also mitochondrial phosphocreatine support.' },
      { id: 'b-complex', label: 'Methylated B-Complex', dsldQuery: 'methylated b complex', notes: 'Look for methylfolate + methylcobalamin + P-5-P.' },
      { id: 'alpha-lipoic-acid', label: 'Alpha-Lipoic Acid', dsldQuery: 'alpha lipoic acid', notes: 'R-ALA is the biologically active isomer.' },
      { id: 'pqq', label: 'PQQ', dsldQuery: 'pyrroloquinoline quinone', notes: 'Small clinical evidence base on mitochondrial biogenesis.' },
    ],
  },
  {
    id: 'methylation',
    label: 'Methylation Support',
    description: 'Support one-carbon metabolism and B-vitamin dependent pathways.',
    icon: '🧬',
    categories: [
      { id: 'methylfolate', label: 'L-5-Methylfolate', dsldQuery: 'l-methylfolate', notes: 'Bioactive folate; bypasses MTHFR conversion.' },
      { id: 'methylcobalamin', label: 'Methylcobalamin (B12)', dsldQuery: 'methylcobalamin', notes: 'Active coenzyme B12.' },
      { id: 'p5p', label: 'P-5-P (Active B6)', dsldQuery: 'pyridoxal 5 phosphate', notes: 'Active B6; participates in homocysteine metabolism.' },
      { id: 'tmg', label: 'TMG (Betaine)', dsldQuery: 'trimethylglycine betaine', notes: 'Alternate methyl donor; researched for homocysteine reduction.' },
      { id: 'riboflavin', label: 'Riboflavin (R5P)', dsldQuery: 'riboflavin 5 phosphate', notes: 'Cofactor for the MTHFR enzyme itself.' },
    ],
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular Support',
    description: 'Educational support for lipid metabolism, endothelial function, and vascular calcium partitioning.',
    icon: '❤️',
    categories: [
      { id: 'omega-3', label: 'Omega-3 (EPA/DHA)', dsldQuery: 'omega 3 epa dha', notes: 'Look for triglyceride (rTG) form with IFOS 5-star certification.' },
      { id: 'coq10', label: 'CoQ10 (Ubiquinol)', dsldQuery: 'ubiquinol', notes: 'Frequently researched with statin users.' },
      { id: 'vitamin-k2', label: 'Vitamin K2 (MK-7)', dsldQuery: 'menaquinone mk-7', notes: 'Long half-life K2 form.' },
      { id: 'magnesium', label: 'Magnesium', dsldQuery: 'magnesium glycinate', notes: 'Prefer glycinate, malate, or taurate.' },
      { id: 'nattokinase', label: 'Nattokinase', dsldQuery: 'nattokinase', notes: 'Fibrinolytic enzyme from fermented soy; small clinical evidence.' },
    ],
  },
  {
    id: 'cognition',
    label: 'Cognition & Focus',
    description: 'Support attention, memory, and neural signaling.',
    icon: '🧠',
    categories: [
      { id: 'omega-3-dha', label: 'Omega-3 (DHA-dominant)', dsldQuery: 'omega 3 dha', notes: 'DHA is the primary structural fat of the brain.' },
      { id: 'lions-mane', label: "Lion's Mane", dsldQuery: 'lions mane hericium', notes: 'Mushroom extract; emerging NGF research.' },
      { id: 'bacopa', label: 'Bacopa Monnieri', dsldQuery: 'bacopa monnieri', notes: 'Ayurvedic herb; multi-week memory studies.' },
      { id: 'alpha-gpc', label: 'Alpha-GPC / Citicoline', dsldQuery: 'alpha gpc citicoline', notes: 'Choline donors; cholinergic signaling support.' },
      { id: 'creatine', label: 'Creatine (Cognitive)', dsldQuery: 'creatine monohydrate', notes: 'Emerging evidence for cognition under sleep deprivation and in vegetarians.' },
    ],
  },
  {
    id: 'stress',
    label: 'Stress & Mood',
    description: 'Support adaptive stress response and calm-alertness.',
    icon: '🌿',
    categories: [
      { id: 'ashwagandha', label: 'Ashwagandha (KSM-66 / Sensoril)', dsldQuery: 'ashwagandha ksm-66', notes: 'Prefer the branded standardized extracts.' },
      { id: 'rhodiola', label: 'Rhodiola Rosea', dsldQuery: 'rhodiola rosea', notes: 'Look for standardization to rosavins + salidrosides.' },
      { id: 'l-theanine', label: 'L-Theanine', dsldQuery: 'l-theanine', notes: 'Calm-alertness amino acid.' },
      { id: 'saffron', label: 'Saffron', dsldQuery: 'saffron affron', notes: 'Standardized saffron extracts studied for mood.' },
      { id: 'magnesium-glycinate', label: 'Magnesium Glycinate', dsldQuery: 'magnesium glycinate', notes: 'GABA-adjacent relaxation research.' },
    ],
  },
  {
    id: 'immune',
    label: 'Immune Function',
    description: 'Support baseline immune resilience.',
    icon: '🛡️',
    categories: [
      { id: 'vitamin-d3-k2', label: 'Vitamin D3 + K2', dsldQuery: 'vitamin d3 k2', notes: 'Pair D3 with K2 for calcium partitioning research.' },
      { id: 'zinc', label: 'Zinc (Picolinate/Bisglycinate)', dsldQuery: 'zinc picolinate', notes: 'Prefer chelated forms.' },
      { id: 'vitamin-c', label: 'Vitamin C', dsldQuery: 'vitamin c ascorbic', notes: 'Buffered / liposomal for higher doses.' },
      { id: 'quercetin', label: 'Quercetin', dsldQuery: 'quercetin', notes: 'Flavonoid; often paired with zinc.' },
      { id: 'nac', label: 'N-Acetylcysteine (NAC)', dsldQuery: 'n-acetylcysteine', notes: 'Glutathione precursor.' },
    ],
  },
  {
    id: 'longevity',
    label: 'Longevity Basics',
    description: 'The most-researched "foundations" stack. Not a promise.',
    icon: '🌱',
    categories: [
      { id: 'omega-3', label: 'Omega-3 (EPA/DHA)', dsldQuery: 'omega 3 epa dha', notes: 'Foundational EFA.' },
      { id: 'vitamin-d3-k2', label: 'Vitamin D3 + K2', dsldQuery: 'vitamin d3 k2', notes: 'Foundational fat-soluble pair.' },
      { id: 'magnesium', label: 'Magnesium', dsldQuery: 'magnesium glycinate', notes: 'Foundational mineral.' },
      { id: 'creatine', label: 'Creatine Monohydrate', dsldQuery: 'creatine monohydrate', notes: 'Best-studied longevity-adjacent supplement.' },
      { id: 'nmn-nr', label: 'NMN / NR', dsldQuery: 'nicotinamide riboside', notes: 'NAD+ precursors. Human clinical evidence is early.' },
    ],
  },
]

export function getGoalById(id) {
  return GOALS.find((g) => g.id === id) || null
}

export const CONTEXTS = {
  age: ['18-29', '30-44', '45-59', '60+'],
  sex: ['Female', 'Male', 'Prefer not to say'],
  dietary_pattern: ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Ketogenic', 'Other'],
}
