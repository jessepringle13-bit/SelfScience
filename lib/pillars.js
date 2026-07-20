/**
 * Curated search queries per pillar. Used when a user clicks a pillar tile
 * (from the homepage grid, the nav dropdown, or the category pills) and lands
 * on /search without an explicit q. The backend swaps these in for `q` so we
 * get high-recall, on-topic results across PubMed / Semantic Scholar /
 * OpenAlex / Crossref.
 *
 * Keep queries SHORT (2–4 tokens). The relevance filter in /api/search
 * requires token coverage; long curated strings will over-filter.
 */
export const PILLAR_QUERIES = {
  'Genomics':                         'polygenic risk score',
  'Nutrition':                        'nutrigenomics dietary intervention',
  'Sports Performance':               'athletic performance genetics',
  'Longevity':                        'healthspan longevity aging',
  'General Wellness':                 'sleep gut microbiome',
  'Pharmacogenomics':                 'pharmacogenomics drug metabolism',
  'Mental Health & Neurochemistry':   'depression neurotransmitter',
  'Environmental Sensitivity':        'environmental chemical exposure',
  'Hormones & Endocrine Health':      'endocrine hormone health',
  'Developmental & Lifespan Wellness':       'child adolescent development',
}

/** Recognized pillar names (used to detect a pillar-browse request). */
export const PILLAR_NAMES = Object.keys(PILLAR_QUERIES)

/**
 * Aliases used by the variant classifier and other legacy sources that
 * emit pillar names slightly different from the canonical UI names. Any
 * time we group classified variants by pillar (Dashboard tiles, Practitioner
 * Report, etc.), we normalise via `normalizePillarName()` so the tile→search
 * hand-off actually surfaces the user's genes.
 */
const PILLAR_ALIASES = {
  'Brain & Neurochemistry':   'Mental Health & Neurochemistry',
  'Hormones & Endocrine':     'Hormones & Endocrine Health',
  'Sleep & Circadian':        'General Wellness',
  'Immune & Gut Health':      'General Wellness',
  'Physical Traits':          'Genomics',
  // Section 5 rename \u2014 legacy classifier / older cached data may still
  // emit the old label. Normalise upward to the new canonical name.
  'Pediatric & Youth Wellness': 'Developmental & Lifespan Wellness',
}

/** Normalise any classifier / legacy pillar name to its canonical UI name.
 *  Returns the input unchanged if it's already canonical or unknown. */
export function normalizePillarName(raw) {
  if (!raw) return raw
  return PILLAR_ALIASES[raw] || raw
}

/** Detect whether a free-text query looks like a Youth/Pediatric research
 *  request. Used by /search to auto-apply the Youth pillar filter when
 *  the user types things like "children MTHFR" or "ADHD genetics" without
 *  having to click the pillar chip first. Keeps their original text as the
 *  search term AND adds pillar=Pediatric & Youth Wellness. */
const YOUTH_KEYWORDS = [
  'children', 'child', 'kids', 'kid',
  'pediatric', 'paediatric', 'peds',
  'infant', 'infants', 'baby', 'babies', 'newborn', 'newborns',
  'toddler', 'toddlers',
  'adolescent', 'adolescents', 'teen', 'teens', 'teenager', 'teenagers',
  'youth', 'juvenile',
  'pregnancy', 'prenatal', 'postnatal', 'perinatal', 'gestational',
  'breastfeeding', 'breast milk', 'breast-milk',
  'school-age', 'schoolage',
  'adhd',
]
export function isYouthQuery(q) {
  if (!q) return false
  const s = String(q).toLowerCase()
  return YOUTH_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`).test(s))
}

/** Get the curated query for a pillar name, or null. */
export function getPillarQuery(name) {
  if (!name) return null
  const canonical = normalizePillarName(name)
  return PILLAR_QUERIES[canonical] || null
}


