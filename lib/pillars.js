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
  'Pediatric & Youth Wellness':       'child adolescent development',
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
}

/** Normalise any classifier / legacy pillar name to its canonical UI name.
 *  Returns the input unchanged if it's already canonical or unknown. */
export function normalizePillarName(raw) {
  if (!raw) return raw
  return PILLAR_ALIASES[raw] || raw
}

/** Get the curated query for a pillar name, or null. */
export function getPillarQuery(name) {
  if (!name) return null
  const canonical = normalizePillarName(name)
  return PILLAR_QUERIES[canonical] || null
}
