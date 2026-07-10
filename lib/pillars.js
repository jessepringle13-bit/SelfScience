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

/** Get the curated query for a pillar name, or null. */
export function getPillarQuery(name) {
  if (!name) return null
  return PILLAR_QUERIES[name] || null
}
