// /app/lib/supabase/pillar-map.js
// Maps the site's canonical pillar `name` (long form, used in URLs
// and site-nav) to the short form used in Supabase's `pillars` text[].
// Also exports the reverse mapping and a helper that accepts either.

export const LONG_TO_SHORT = {
  'Genomics': 'Genomics',
  'Nutrition': 'Nutrition',
  'Sports Performance': 'Performance',
  'Longevity': 'Longevity',
  'General Wellness': 'Wellness',
  'Pharmacogenomics': 'Pharmacogenomics',
  'Mental Health & Neurochemistry': 'Mental Health',
  'Environmental Sensitivity': 'Environment',
  'Hormones & Endocrine Health': 'Hormones',
  'Pediatric & Youth Wellness': 'Youth Wellness',
}

export const SHORT_TO_LONG = Object.fromEntries(
  Object.entries(LONG_TO_SHORT).map(([long, short]) => [short, long])
)

/** Return the short (Supabase) pillar name for any form the caller has. */
export function toShortPillar(input) {
  if (!input) return null
  const s = String(input).trim()
  if (LONG_TO_SHORT[s]) return LONG_TO_SHORT[s]
  if (SHORT_TO_LONG[s]) return s
  return null
}

/** Editorial pillar names accepted by the DB (mirrors the CHECK-less text[] contents). */
export const EDITORIAL_PILLARS = [
  'Genomics', 'Nutrition', 'Performance', 'Longevity', 'Wellness',
  'Pharmacogenomics', 'Mental Health', 'Environment', 'Hormones', 'Youth Wellness',
]
