// /app/lib/supplements/interactions.js
// Curated supplement-drug and supplement-PGx-variant interaction table.
// Only clinically-meaningful pairs; only surface personalised warnings —
// never generic ones.
//
// Two dimensions of matching:
//   • DRUG match  — user has this med in ss_my_medications (Drug Check).
//   • PGX  match  — user has a variant that materially changes the risk.
//
// Each entry returns a short amber flag string when it fires.

// ─── Supplement key normalisation ──────────────────────────────────────────

// Normalise a raw ingredient/product name to one of the canonical keys
// below. Accepts arrays or space-separated strings.
const KEY_ALIASES = {
  'vitamin k':          ['vitamin k', 'menaquinone', 'phylloquinone', 'k1', 'k2', 'mk-4', 'mk-7'],
  'st johns wort':      ["st john's wort", 'st johns wort', 'hypericum'],
  'fish oil':           ['fish oil', 'omega-3', 'epa', 'dha', 'omega 3'],
  'coq10':              ['coq10', 'ubiquinol', 'ubiquinone', 'coenzyme q10'],
  'magnesium':          ['magnesium', 'magnesium citrate', 'magnesium glycinate', 'magnesium oxide'],
  'melatonin':          ['melatonin'],
  'grapefruit':         ['grapefruit'],
  'iron':               ['ferrous', 'iron sulfate', 'iron bisglycinate', 'ferric'],
  'calcium':            ['calcium citrate', 'calcium carbonate', 'calcium'],
  'niacin':             ['niacin', 'nicotinic acid'],
  'green tea extract':  ['egcg', 'green tea extract'],
  'vitamin e':          ['vitamin e', 'tocopherol'],
  'ginkgo':             ['ginkgo', 'ginkgo biloba'],
  'garlic':             ['garlic', 'allium sativum'],
}

export function classifySupplement(name) {
  if (!name) return null
  const hay = String(name).toLowerCase()
  for (const [canonical, aliases] of Object.entries(KEY_ALIASES)) {
    if (aliases.some((a) => hay.includes(a))) return canonical
  }
  return null
}

// ─── Interaction table ─────────────────────────────────────────────────────

// Each entry: { supplement, drugs: [ids or generics], genes: {gene: ['phenotype', ...]}, message }
// A single entry fires if BOTH a drug OR a matching gene condition is met.
export const SUPPLEMENT_INTERACTIONS = [
  {
    supplement: 'vitamin k',
    drugs: ['warfarin'],
    genes: { VKORC1: ['higher_sensitivity'] },
    message:
      'Vitamin K directly affects warfarin efficacy. If you take warfarin, do not start or adjust vitamin K supplementation without your prescriber — dosing may need re-titration.',
  },
  {
    supplement: 'coq10',
    drugs: ['warfarin', 'simvastatin', 'atorvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin'],
    genes: { SLCO1B1: ['poor_transport', 'decreased_transport'] },
    message:
      'CoQ10 is often paired with statins to offset muscle side-effects — clinically supported for SLCO1B1 poor transporters. Note: CoQ10 can also mildly reduce warfarin effect. Discuss with your prescriber.',
  },
  {
    supplement: 'st johns wort',
    drugs: ['escitalopram', 'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'tramadol', 'warfarin', 'clopidogrel', 'oral contraceptives'],
    genes: { CYP2C19: ['UM', 'RM'], CYP2D6: ['UM', 'RM'] },
    message:
      "St. John's Wort induces CYP3A4/2C19/2D6 and can lower blood levels of many prescription drugs — including SSRIs, warfarin, clopidogrel, and hormonal contraceptives. Avoid combining without prescriber guidance.",
  },
  {
    supplement: 'fish oil',
    drugs: ['warfarin', 'clopidogrel', 'apixaban', 'rivaroxaban'],
    genes: {},
    message:
      'High-dose fish oil (>3 g/day EPA+DHA) may increase bleeding risk when combined with anticoagulants or antiplatelets. Standard 1–2 g doses are generally low-risk but discuss with your prescriber.',
  },
  {
    supplement: 'magnesium',
    drugs: ['ciprofloxacin', 'levofloxacin', 'doxycycline', 'tetracycline', 'levothyroxine'],
    genes: {},
    message:
      'Magnesium can chelate certain antibiotics and levothyroxine, reducing absorption. Separate doses by at least 2–4 hours.',
  },
  {
    supplement: 'iron',
    drugs: ['levothyroxine', 'ciprofloxacin', 'levofloxacin', 'doxycycline'],
    genes: {},
    message:
      'Iron reduces absorption of levothyroxine and certain antibiotics. Separate doses by at least 4 hours.',
  },
  {
    supplement: 'calcium',
    drugs: ['levothyroxine', 'ciprofloxacin', 'levofloxacin', 'doxycycline'],
    genes: {},
    message:
      'Calcium binds to levothyroxine and certain antibiotics, reducing absorption. Separate doses by at least 4 hours.',
  },
  {
    supplement: 'melatonin',
    drugs: ['zolpidem', 'diazepam', 'lorazepam', 'clonazepam', 'alprazolam', 'oxycodone', 'morphine'],
    genes: {},
    message:
      'Melatonin combined with sedatives, benzodiazepines, or opioids may increase drowsiness and impair driving/operating machinery. Use with caution.',
  },
  {
    supplement: 'grapefruit',
    drugs: ['simvastatin', 'atorvastatin', 'clopidogrel', 'tacrolimus', 'cyclosporine', 'nifedipine'],
    genes: {},
    message:
      'Grapefruit inhibits CYP3A4 and can dramatically raise blood levels of many drugs (statins, tacrolimus, some calcium blockers). Avoid unless approved by your prescriber.',
  },
  {
    supplement: 'niacin',
    drugs: ['simvastatin', 'atorvastatin', 'rosuvastatin'],
    genes: { SLCO1B1: ['poor_transport'] },
    message:
      'High-dose niacin (>1 g/day) combined with statins increases myopathy risk — significantly higher if you carry a SLCO1B1 poor-transporter variant.',
  },
]

// Returns any interactions that fire for a given supplement + user context.
// context = { userDrugs: ['warfarin', ...], phenotypes: {CYP2C19: {phenotype: 'PM'}, ...} }
export function findInteractionsForSupplement(supplementName, context = {}) {
  const key = classifySupplement(supplementName)
  if (!key) return []
  const userDrugs = new Set((context.userDrugs || []).map((d) => String(d).toLowerCase()))
  const phenotypes = context.phenotypes || {}

  return SUPPLEMENT_INTERACTIONS
    .filter((entry) => entry.supplement === key)
    .filter((entry) => {
      const drugHit = (entry.drugs || []).some((d) => userDrugs.has(String(d).toLowerCase()))
      const geneHit = Object.entries(entry.genes || {}).some(([gene, phList]) => {
        const ph = phenotypes[gene]
        if (!ph) return false
        return phList.includes(ph.phenotype)
      })
      return drugHit || geneHit
    })
    .map((entry) => ({
      message: entry.message,
      matchedDrug: (entry.drugs || []).find((d) => userDrugs.has(String(d).toLowerCase())) || null,
      matchedGene: Object.entries(entry.genes || {}).find(([g, phs]) => phenotypes[g] && phs.includes(phenotypes[g].phenotype))?.[0] || null,
    }))
}
