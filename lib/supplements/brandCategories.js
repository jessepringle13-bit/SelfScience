// /app/lib/supplements/brandCategories.js
// Infer brand categories from the `focus` text field.
// Deterministic, non-prescriptive. Used for the leaderboard category filter.

export const BRAND_CATEGORIES = [
  { id: 'fish-oil',       label: 'Fish oil / Omega-3',      re: /\b(fish[- ]?oil|omega[- ]?3|epa|dha|krill|marine)\b/i },
  { id: 'multivitamin',   label: 'Multivitamin',            re: /\b(multi(vitamin)?|foundational|daily[- ]?pack|foundations?[- ]stack|complete\b)\b/i },
  { id: 'probiotic',      label: 'Probiotic / Gut',         re: /\b(probiot|synbiot|lgg|strain|gut\b|microbiome)\b/i },
  { id: 'collagen',       label: 'Collagen / Protein',      re: /\b(collagen|whey|protein|peptides?|amino)\b/i },
  { id: 'methylation',    label: 'Methylation',             re: /\b(methyl|methylation|mthfr)\b/i },
  { id: 'nootropic',      label: 'Nootropic / Cognitive',   re: /\b(nootrop|cognitiv|focus|brain|memory|alpha[- ]gpc|citicoline)\b/i },
  { id: 'adaptogen',      label: 'Adaptogen / Stress',      re: /\b(adaptogen|stress|ashwagandha|rhodiola|cortisol|calm)\b/i },
  { id: 'herbal',         label: 'Herbal / Botanical',      re: /\b(herbal|botanical|tincture|liquid extract|ayurvedic|adaptogen)\b/i },
  { id: 'mushroom',       label: 'Functional mushroom',     re: /\b(mushroom|mycelium|reishi|lion.?s? mane|cordyceps|chaga)\b/i },
  { id: 'organ',          label: 'Whole-food / Organ',      re: /\b(organ|liver|whole[- ]food|grass[- ]fed|ancestral|colostrum|bone broth)\b/i },
  { id: 'electrolyte',    label: 'Electrolyte / Hydration', re: /\b(electrolyte|hydration|sodium\b|potassium\b)\b/i },
  { id: 'sport',          label: 'Sports performance',      re: /\b(sport|athlet|performance|pre[- ]?workout|creatine|open[- ]label)\b/i },
  { id: 'longevity',      label: 'Longevity / NAD+',        re: /\b(longevity|nad\+?|nmn\b|nr\b|resveratrol|rapamycin)\b/i },
  { id: 'practitioner',   label: 'Practitioner-grade',      re: /\b(practitioner|clinician|functional[- ]medicine|hypoallergenic|clinical[- ]grade)\b/i },
  { id: 'prenatal',       label: 'Prenatal / Women',        re: /\b(prenatal|postpartum|women|cycle|ob\/gyn)\b/i },
  { id: 'personalized',   label: 'Personalized packs',      re: /\b(personali[sz]ed|daily[- ]pack|subscription|tailored)\b/i },
  { id: 'wellness',       label: 'Broad wellness',          re: /\b(daily|wellness|category|catalog|dtc|traceability|clean[- ]label)\b/i },
]

// Best-effort category inference from a brand profile focus string.
// A brand can belong to multiple categories.
export function inferBrandCategories(brand) {
  if (!brand?.focus) return []
  const hay = String(brand.focus).toLowerCase()
  const cats = []
  for (const c of BRAND_CATEGORIES) {
    if (c.re.test(hay)) cats.push(c.id)
  }
  return cats
}

export function getCategoryLabel(id) {
  return BRAND_CATEGORIES.find((c) => c.id === id)?.label || id
}
