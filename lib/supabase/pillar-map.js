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
  // Section 5 rename \u2014 canonical name is now "Developmental & Lifespan
  // Wellness" but the Supabase text[] still uses the old short "Youth
  // Wellness" tag. We accept the legacy long form too so old rows
  // continue to resolve.
  'Developmental & Lifespan Wellness': 'Youth Wellness',
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
