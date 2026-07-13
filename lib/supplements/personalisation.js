// /app/lib/supplements/personalisation.js
// Phase 3 — genome + biomarker driven personalisation for the Supplement
// Discovery UI. Deterministic, non-prescriptive, opt-in.
//
// The engine takes:
//   - genomeReport.cards[]   (produced by /app/lib/genomeParser.js)
//   - biomarkerValues        (from getBiomarkerValues())
//
// And returns an array of "signals":
//   {
//     id,               // stable rule id
//     source: 'genome'|'biomarker',
//     gene?, rsid?, genotype?, marker?, value?,
//     ingredientKey,    // maps to /lib/supplements/ingredientForms.js
//     categoryHint?,    // maps to a goalCategories.js category id if any
//     urgency,          // 'high' | 'medium' | 'low' | 'caution'
//     headline,         // short one-line label
//     reason,           // plain-language rationale (never prescriptive)
//     alsoConsider?: string[]   // adjacent ingredient keys
//   }
//
// Everything client-side. No network, no user data leaves the browser.

// ---------------- helpers (mirror /lib/supplementProtocol.js) ----------------
function findCard(cards, rsid) {
  return (cards || []).find((c) => c.rsid === rsid) || null
}

function normaliseGenotype(gt) {
  if (!gt) return null
  const g = String(gt).toUpperCase().replace(/[^A-Z]/g, '')
  if (g.length !== 2) return g
  return [g[0], g[1]].sort().join('')
}

function hasGenotype(cards, rsid, ...genotypes) {
  const card = findCard(cards, rsid)
  const gt = normaliseGenotype(card?.genotype)
  if (!gt) return false
  return genotypes.some((g) => normaliseGenotype(g) === gt)
}

function getGenotype(cards, rsid) {
  const card = findCard(cards, rsid)
  return normaliseGenotype(card?.genotype)
}

// ---------------- genome rules ----------------
export const GENOME_RULES = [
  {
    id: 'mthfr-c677t',
    gene: 'MTHFR', rsid: 'rs1801133',
    ingredientKey: 'folate',
    categoryHint: 'methylfolate',
    match(cards) {
      const gt = getGenotype(cards, 'rs1801133')
      if (!gt || !['CT', 'TT'].includes(gt)) return null
      return {
        genotype: gt,
        urgency: gt === 'TT' ? 'high' : 'medium',
        headline: gt === 'TT' ? 'MTHFR C677T homozygous' : 'MTHFR C677T heterozygous',
        reason: gt === 'TT'
          ? 'Reduced MTHFR enzyme activity (~30% of normal). The bioactive L-5-methylfolate form is often preferred over synthetic folic acid, which may not convert efficiently.'
          : 'Modestly reduced MTHFR enzyme activity (~65% of normal). L-5-methylfolate is often preferred over folic acid for this variant.',
        alsoConsider: ['vitamin b12', 'vitamin b6', 'riboflavin'],
      }
    },
  },
  {
    id: 'mthfr-a1298c',
    gene: 'MTHFR', rsid: 'rs1801131',
    ingredientKey: 'folate',
    categoryHint: 'methylfolate',
    match(cards) {
      const gt = getGenotype(cards, 'rs1801131')
      if (!gt || !['AC', 'CC'].includes(gt)) return null
      return {
        genotype: gt,
        urgency: gt === 'CC' ? 'medium' : 'low',
        headline: gt === 'CC' ? 'MTHFR A1298C homozygous' : 'MTHFR A1298C heterozygous',
        reason: 'A1298C has a smaller effect on folate conversion than C677T, but the bioactive methylfolate form is still often preferred.',
        alsoConsider: ['vitamin b12'],
      }
    },
  },
  {
    id: 'apoe-e4',
    gene: 'APOE', rsids: ['rs429358', 'rs7412'],
    ingredientKey: 'omega-3',
    categoryHint: 'omega-3',
    match(cards) {
      // APOE ε4 carrier: rs429358 = C on at least one allele AND rs7412 = C/C
      const c1 = getGenotype(cards, 'rs429358')
      const c2 = getGenotype(cards, 'rs7412')
      if (!c1 || !c2) return null
      const hasEpsilon4 = (c1.includes('C')) && c2 === 'CC'
      if (!hasEpsilon4) return null
      const homozygous = c1 === 'CC' && c2 === 'CC'
      return {
        genotype: `${c1} + ${c2}`,
        urgency: homozygous ? 'high' : 'medium',
        headline: homozygous ? 'APOE ε4/ε4 carrier' : 'APOE ε4 carrier',
        reason: 'APOE ε4 alleles alter lipid handling. Research on cardiovascular endpoints often favours EPA-dominant, triglyceride-form omega-3s rather than DHA-heavy ethyl-ester products for this genotype.',
        alsoConsider: ['coenzyme q10', 'vitamin d'],
      }
    },
  },
  {
    id: 'comt-met',
    gene: 'COMT', rsid: 'rs4680',
    ingredientKey: 'folate',
    categoryHint: 'methylfolate',
    match(cards) {
      const gt = getGenotype(cards, 'rs4680')
      if (gt !== 'AA') return null
      return {
        genotype: gt,
        urgency: 'caution',
        headline: 'COMT Val158Met · slow methylator',
        reason: 'Slow COMT breaks down catecholamines more slowly; high-dose methyl donors (methylfolate, methylcobalamin, TMG) can cause anxiety or irritability in some carriers. Start LOW and titrate under clinician guidance.',
        alsoConsider: [],
      }
    },
  },
  {
    id: 'vdr-taq1',
    gene: 'VDR', rsid: 'rs731236',
    ingredientKey: 'vitamin d',
    categoryHint: 'vitamin-d3-k2',
    match(cards) {
      const gt = getGenotype(cards, 'rs731236')
      if (!gt || gt === 'TT') return null
      return {
        genotype: gt,
        urgency: 'low',
        headline: 'VDR TaqI variant',
        reason: 'VDR variants may reduce vitamin D receptor sensitivity. Pair vitamin D3 with K2 (MK-7) for calcium partitioning research protocols.',
        alsoConsider: ['vitamin k', 'magnesium'],
      }
    },
  },
  {
    id: 'fut2-nonsecretor',
    gene: 'FUT2', rsid: 'rs602662',
    ingredientKey: 'vitamin b12',
    categoryHint: 'methylcobalamin',
    match(cards) {
      const gt = getGenotype(cards, 'rs602662')
      if (gt !== 'AA') return null
      return {
        genotype: gt,
        urgency: 'medium',
        headline: 'FUT2 non-secretor',
        reason: 'FUT2 non-secretor status is associated with lower serum B12. Methylcobalamin (active B12) at higher-normal doses is often studied for this group.',
        alsoConsider: ['folate'],
      }
    },
  },
  {
    id: 'bcmo1',
    gene: 'BCMO1', rsid: 'rs7501331',
    ingredientKey: 'vitamin a',
    match(cards) {
      const gt = getGenotype(cards, 'rs7501331')
      if (!gt || !['CT', 'TT'].includes(gt)) return null
      return {
        genotype: gt,
        urgency: gt === 'TT' ? 'medium' : 'low',
        headline: 'BCMO1 low-converter',
        reason: 'Reduced beta-carotene → retinol conversion. Preformed vitamin A (retinyl palmitate or cod liver oil) is often researched as an alternative.',
        alsoConsider: [],
      }
    },
  },
]

// ---------------- biomarker rules ----------------
// Biomarker values come from getBiomarkerValues() which mirrors the
// biomarker-form fields (see /app/lib/biomarkers.js). All values are numeric
// or null. Units follow the biomarker form defaults.
export const BIOMARKER_RULES = [
  {
    id: 'low-vitamin-d',
    marker: 'vitamin_d',                          // 25-OH-D (ng/mL)
    ingredientKey: 'vitamin d',
    categoryHint: 'vitamin-d3-k2',
    match(val) {
      if (val == null || isNaN(val)) return null
      if (val < 20) return { urgency: 'high', headline: '25-OH-D deficient (<20 ng/mL)', reason: 'Serum vitamin D in the deficient range. D3 (cholecalciferol) paired with K2 is often researched for repletion.' }
      if (val < 30) return { urgency: 'medium', headline: '25-OH-D insufficient (20-30 ng/mL)', reason: 'Serum vitamin D in the insufficient range. D3 with K2 is often researched to reach the 40-60 ng/mL research target.' }
      return null
    },
  },
  {
    id: 'high-homocysteine',
    marker: 'homocysteine',                      // μmol/L
    ingredientKey: 'folate',
    categoryHint: 'methylfolate',
    match(val) {
      if (val == null || isNaN(val)) return null
      if (val >= 15) return { urgency: 'high', headline: `Homocysteine ${val} μmol/L (elevated)`, reason: 'Homocysteine at this level often responds to combined methylfolate + methylcobalamin + P-5-P + riboflavin (the classic B-vitamin homocysteine-lowering stack).', alsoConsider: ['vitamin b12', 'vitamin b6', 'riboflavin'] }
      if (val >= 10) return { urgency: 'medium', headline: `Homocysteine ${val} μmol/L (borderline)`, reason: 'Borderline homocysteine. Methylation-supporting B-vitamins (methylfolate + methylcobalamin) are often researched to bring this into the <8 range.', alsoConsider: ['vitamin b12', 'vitamin b6'] }
      return null
    },
  },
  {
    id: 'low-ferritin',
    marker: 'ferritin',                          // ng/mL
    ingredientKey: 'iron',
    match(val) {
      if (val == null || isNaN(val)) return null
      if (val < 30) return { urgency: 'medium', headline: `Ferritin ${val} ng/mL (low)`, reason: 'Low ferritin suggests reduced iron stores. Iron bisglycinate is often better tolerated than sulfate. Discuss with a clinician before supplementing iron.' }
      return null
    },
  },
  {
    id: 'high-ldl',
    marker: 'ldl',                               // mg/dL
    ingredientKey: 'omega-3',
    categoryHint: 'omega-3',
    match(val) {
      if (val == null || isNaN(val)) return null
      if (val >= 160) return { urgency: 'medium', headline: `LDL ${val} mg/dL (elevated)`, reason: 'Elevated LDL. Omega-3 (EPA-dominant, triglyceride form) and CoQ10 (ubiquinol) are often researched alongside a clinician-guided lipid strategy.', alsoConsider: ['coenzyme q10'] }
      return null
    },
  },
  {
    id: 'high-hba1c',
    marker: 'hba1c',                             // %
    ingredientKey: 'berberine',
    match(val) {
      if (val == null || isNaN(val)) return null
      if (val >= 5.7) return { urgency: 'medium', headline: `HbA1c ${val}% (pre-diabetic or higher)`, reason: 'Elevated HbA1c. Berberine + chromium + magnesium have small-to-moderate research bases for glycemic support. Talk to your clinician before combining with any diabetes medications.', alsoConsider: ['chromium', 'magnesium', 'alpha-lipoic-acid'] }
      return null
    },
  },
]

// ---------------- main entrypoint ----------------
export function computePersonalisation({ genomeReport, biomarkers }) {
  const signals = []
  const cards = genomeReport?.cards || []

  // Genome-driven signals
  for (const rule of GENOME_RULES) {
    const hit = rule.match(cards)
    if (!hit) continue
    signals.push({
      id: rule.id,
      source: 'genome',
      gene: rule.gene, rsid: rule.rsid, rsids: rule.rsids,
      ingredientKey: rule.ingredientKey,
      categoryHint: rule.categoryHint,
      ...hit,
    })
  }

  // Biomarker-driven signals
  if (biomarkers && typeof biomarkers === 'object') {
    for (const rule of BIOMARKER_RULES) {
      const raw = biomarkers[rule.marker]
      const val = typeof raw === 'string' ? parseFloat(raw) : raw
      const hit = rule.match(val)
      if (!hit) continue
      signals.push({
        id: rule.id,
        source: 'biomarker',
        marker: rule.marker, value: val,
        ingredientKey: rule.ingredientKey,
        categoryHint: rule.categoryHint,
        ...hit,
      })
    }
  }

  // Sort by urgency
  const urgencyRank = { high: 3, medium: 2, low: 1, caution: 0 }
  signals.sort((a, b) => (urgencyRank[b.urgency] ?? 0) - (urgencyRank[a.urgency] ?? 0))

  return signals
}

// ---------------- category / product matching ----------------
// Given a category (from goalCategories.js) OR an individual product's
// formQuality[], return the personalisation signals that apply to it.
export function signalsForCategory(signals, category) {
  if (!category || !signals?.length) return []
  return signals.filter((s) => s.categoryHint === category.id || s.ingredientKey === category.id)
}

export function signalsForProduct(signals, product) {
  if (!signals?.length) return []
  const productKeys = new Set((product?.formQuality || []).map((f) => f.ingredient?.toLowerCase()))
  return signals.filter((s) => {
    // Match by ingredientKey substring (e.g. signal.ingredientKey = 'folate'
    // and product formQuality has display "Folate (Vitamin B9)").
    for (const key of productKeys) {
      if (!key) continue
      if (key.includes(s.ingredientKey)) return true
      if (s.ingredientKey.includes(key)) return true
    }
    return false
  })
}
