// /app/lib/supplements/ingredientForms.js
// Deterministic quality-tier map for the FORM of a supplement ingredient.
// This is the whole point of "Supplement Protocol Intelligence" — the
// difference between Methylfolate and Folic Acid, MK-7 and K1, Ubiquinol and
// Ubiquinone, matters MORE than the brand marketing.
//
// Tiers (all research-grounded, non-prescriptive):
//   preferred  — high-bioavailability / evidence-preferred form (green)
//   acceptable — decent form used broadly with reasonable evidence (blue)
//   basic      — cheapest / least-preferred form (amber, informational)
//
// The `explain` string is what appears in the tooltip / expanded card. We
// deliberately avoid superlatives — "is associated with", "research suggests",
// "may offer" — and never make disease claims.

export const INGREDIENT_FORM_TIERS = {
  // -------------------- Folate --------------------
  folate: {
    display: 'Folate (Vitamin B9)',
    forms: [
      { pattern: /(l-?5-?methyl(tetrahydro)?folate|l-methylfolate|methylfolate|5-mthf|metafolin|quatrefolic)/i,
        tier: 'preferred', label: 'L-5-Methylfolate', explain: 'The bioactive form of folate. Bypasses MTHFR conversion, often preferred for methylation support.' },
      { pattern: /(folic acid|pteroylglutamic|pteroyl-l-glutamic)/i,
        tier: 'basic', label: 'Folic Acid', explain: 'Synthetic. Must be converted by the body; conversion is impaired in MTHFR variant carriers. Look for methylfolate if you have MTHFR variants.' },
      { pattern: /(folinic|calcium folinate|leucovorin)/i,
        tier: 'acceptable', label: 'Folinic Acid', explain: '5-formyl-tetrahydrofolate. A reduced folate; still requires one conversion step to methylfolate but is not the synthetic folic acid.' },
    ],
  },

  // -------------------- Vitamin B12 --------------------
  'vitamin b12': {
    display: 'Vitamin B12 (Cobalamin)',
    forms: [
      { pattern: /methylcobalamin/i,
        tier: 'preferred', label: 'Methylcobalamin', explain: 'Active coenzyme form of B12 that participates directly in methylation.' },
      { pattern: /adenosylcobalamin|dibencozide/i,
        tier: 'preferred', label: 'Adenosylcobalamin', explain: 'The mitochondrial coenzyme form; often paired with methylcobalamin.' },
      { pattern: /hydroxo?cobalamin/i,
        tier: 'acceptable', label: 'Hydroxocobalamin', explain: 'Well-retained storage form. Body converts to active forms as needed.' },
      { pattern: /cyanocobalamin/i,
        tier: 'basic', label: 'Cyanocobalamin', explain: 'Cheapest, synthetic form. Requires body to strip a cyanide group. Fine for most people, but not preferred if you have methylation variants.' },
    ],
  },
  b12: {
    display: 'Vitamin B12',
    alias: 'vitamin b12',
  },
  cobalamin: {
    display: 'Vitamin B12',
    alias: 'vitamin b12',
  },

  // -------------------- Vitamin B6 --------------------
  'vitamin b6': {
    display: 'Vitamin B6',
    forms: [
      { pattern: /(pyridoxal.?5.?phosphate|p5p|plp)/i,
        tier: 'preferred', label: 'P-5-P', explain: 'The active coenzyme form of B6 the body actually uses.' },
      { pattern: /pyridoxine/i,
        tier: 'basic', label: 'Pyridoxine HCl', explain: 'Precursor form; must be converted by the liver to P-5-P.' },
    ],
  },
  b6: { alias: 'vitamin b6' },

  // -------------------- Magnesium --------------------
  magnesium: {
    display: 'Magnesium',
    forms: [
      { pattern: /(bis)?glycinate/i, tier: 'preferred', label: 'Magnesium Glycinate', explain: 'Bound to glycine. Gentle on digestion; often preferred for sleep, relaxation, and stress support.' },
      { pattern: /threonate/i, tier: 'preferred', label: 'Magnesium L-Threonate', explain: 'Small clinical evidence for brain-penetrant delivery and cognitive support.' },
      { pattern: /malate/i, tier: 'preferred', label: 'Magnesium Malate', explain: 'Well-absorbed; malate is a Krebs-cycle intermediate.' },
      { pattern: /taurate/i, tier: 'acceptable', label: 'Magnesium Taurate', explain: 'Paired with taurine; used in some cardiovascular research protocols.' },
      { pattern: /citrate/i, tier: 'acceptable', label: 'Magnesium Citrate', explain: 'Well-absorbed; may have a mild laxative effect at higher doses.' },
      { pattern: /(oxide|sulfate)/i, tier: 'basic', label: 'Magnesium Oxide / Sulfate', explain: 'Cheapest forms; low elemental absorption (~4% for oxide). Better forms exist.' },
    ],
  },

  // -------------------- Zinc --------------------
  zinc: {
    display: 'Zinc',
    forms: [
      { pattern: /(picolinate|bis?glycinate|glycinate)/i, tier: 'preferred', label: 'Zinc Picolinate / Bisglycinate', explain: 'Well-absorbed chelated forms of zinc.' },
      { pattern: /citrate/i, tier: 'acceptable', label: 'Zinc Citrate', explain: 'Reasonable absorption; broadly used.' },
      { pattern: /(oxide|sulfate|gluconate)/i, tier: 'basic', label: 'Zinc Oxide / Sulfate / Gluconate', explain: 'Less-bioavailable forms.' },
    ],
  },

  // -------------------- Vitamin D --------------------
  'vitamin d': {
    display: 'Vitamin D',
    forms: [
      { pattern: /(cholecalciferol|d.?3|d3)/i, tier: 'preferred', label: 'Vitamin D3 (Cholecalciferol)', explain: 'The form the body naturally makes from sun exposure. Superior for raising serum 25-OH-D.' },
      { pattern: /(ergocalciferol|d.?2|d2)/i, tier: 'basic', label: 'Vitamin D2 (Ergocalciferol)', explain: 'Plant-derived. Less effective at raising serum 25-OH-D than D3 in most studies.' },
    ],
  },
  'vitamin d3': { alias: 'vitamin d' },
  'cholecalciferol': { alias: 'vitamin d' },

  // -------------------- Vitamin K --------------------
  'vitamin k': {
    display: 'Vitamin K',
    forms: [
      { pattern: /(mk.?7|menaquinone.?7)/i, tier: 'preferred', label: 'Vitamin K2 as MK-7', explain: 'Long half-life menaquinone. Preferred for daily cardiovascular / bone research protocols.' },
      { pattern: /(mk.?4|menaquinone.?4)/i, tier: 'acceptable', label: 'Vitamin K2 as MK-4', explain: 'Short half-life; requires multiple daily doses to maintain plasma levels.' },
      { pattern: /(k.?1|phyto?menadione|phyllo?quinone)/i, tier: 'basic', label: 'Vitamin K1', explain: 'Primarily supports coagulation; less activity on bone/vascular K2-dependent proteins.' },
    ],
  },
  'vitamin k2': { alias: 'vitamin k' },
  menaquinone: { alias: 'vitamin k' },

  // -------------------- CoQ10 --------------------
  'coenzyme q10': {
    display: 'CoQ10',
    forms: [
      { pattern: /ubiquinol/i, tier: 'preferred', label: 'Ubiquinol', explain: 'The reduced, active form. Better absorbed than ubiquinone, especially in adults over 40 and statin users.' },
      { pattern: /ubiquinone/i, tier: 'acceptable', label: 'Ubiquinone', explain: 'Oxidized form; must be converted to ubiquinol in the body.' },
    ],
  },
  coq10: { alias: 'coenzyme q10' },
  ubiquinol: { alias: 'coenzyme q10' },
  ubiquinone: { alias: 'coenzyme q10' },

  // -------------------- Omega-3 (fish oil / EPA/DHA) --------------------
  'omega-3': {
    display: 'Omega-3 (EPA/DHA)',
    forms: [
      { pattern: /(re.?esterified|triglyceride|rtg|natural triglyceride)/i, tier: 'preferred', label: 'Triglyceride (rTG)', explain: 'Re-esterified triglyceride form. Higher absorption in most head-to-head studies.' },
      { pattern: /(phospholipid|krill)/i, tier: 'preferred', label: 'Phospholipid (krill)', explain: 'Phospholipid-bound EPA/DHA; sustainable sourcing considerations apply.' },
      { pattern: /(ethyl ester|ee)/i, tier: 'acceptable', label: 'Ethyl Ester (EE)', explain: 'Cheaper concentrated form. Absorption improves when taken with fat.' },
    ],
  },
  'fish oil': { alias: 'omega-3' },
  'epa': { alias: 'omega-3' },
  'dha': { alias: 'omega-3' },

  // -------------------- Iron --------------------
  iron: {
    display: 'Iron',
    forms: [
      { pattern: /(bis)?glycinate/i, tier: 'preferred', label: 'Iron Bisglycinate', explain: 'Gentle on digestion; well-absorbed chelate.' },
      { pattern: /(ferrous fumarate|ferrous gluconate)/i, tier: 'acceptable', label: 'Ferrous Fumarate / Gluconate', explain: 'Standard iron salts; can cause GI side effects.' },
      { pattern: /(ferrous sulfate)/i, tier: 'basic', label: 'Ferrous Sulfate', explain: 'Cheapest; most common cause of GI side effects.' },
    ],
  },

  // -------------------- Calcium --------------------
  calcium: {
    display: 'Calcium',
    forms: [
      { pattern: /(citrate|malate|citrate.?malate)/i, tier: 'preferred', label: 'Calcium Citrate / Malate', explain: 'Well-absorbed with or without food.' },
      { pattern: /hydroxyapatite/i, tier: 'preferred', label: 'Microcrystalline Hydroxyapatite', explain: 'Whole-bone matrix; used in some bone-health protocols.' },
      { pattern: /carbonate/i, tier: 'basic', label: 'Calcium Carbonate', explain: 'Cheap. Requires stomach acid — poorly absorbed in older adults or PPI users.' },
    ],
  },

  // -------------------- Ashwagandha --------------------
  ashwagandha: {
    display: 'Ashwagandha',
    forms: [
      { pattern: /ksm.?66/i, tier: 'preferred', label: 'KSM-66', explain: 'Full-spectrum root extract; the most heavily studied branded ashwagandha for stress and cortisol markers.' },
      { pattern: /sensoril/i, tier: 'preferred', label: 'Sensoril', explain: 'Root-and-leaf extract standardized to withanolides. Studied for stress and sleep.' },
      { pattern: /(withania|ashwagandha)/i, tier: 'acceptable', label: 'Generic Ashwagandha Extract', explain: 'Standardized extracts vary in quality; look for the branded forms if possible.' },
    ],
  },

  // -------------------- Curcumin --------------------
  curcumin: {
    display: 'Curcumin / Turmeric',
    forms: [
      { pattern: /(meriva|phytosome|longvida|bcm.?95|theracurmin|curcuwin|novasol)/i, tier: 'preferred', label: 'Bioavailable Curcumin (branded)', explain: 'Phospholipid, phytosome, or nano-formulated curcumin. 10–30× higher plasma levels than plain curcumin.' },
      { pattern: /(black pepper|piperine|bioperine).+curcumin|curcumin.+(black pepper|piperine|bioperine)/i, tier: 'acceptable', label: 'Curcumin + Piperine', explain: 'Piperine increases absorption ~20×. Older evidence base than the branded phytosome forms.' },
      { pattern: /(curcumin|turmeric)/i, tier: 'basic', label: 'Plain Curcumin / Turmeric', explain: 'Poorly absorbed on its own. Look for a bioavailability system.' },
    ],
  },
  turmeric: { alias: 'curcumin' },
}

// Resolve ingredient key from an ingredient name string (case-insensitive).
export function resolveIngredientKey(rawName) {
  if (!rawName) return null
  const name = String(rawName).toLowerCase().trim()
  if (INGREDIENT_FORM_TIERS[name]) {
    return INGREDIENT_FORM_TIERS[name].alias || name
  }
  // Substring match — pick the longest key that occurs in the ingredient text
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
      }
    }
  }
  // No pattern matched — return the ingredient identifier but tier unknown
  return {
    ingredient: entry.display,
    tier: 'unknown',
    formLabel: name || formName || 'Unspecified form',
    explain: 'Form not recognised in our reference set.',
  }
}
