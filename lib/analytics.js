/**
 * Privacy-conscious analytics helper.
 *
 * We deliberately do NOT track:
 *  - actual search query text
 *  - genome file contents or matched variants
 *  - any personal or health data
 *
 * We DO track event names + generic metadata (source, page_path, book slug).
 * All params are sanitised through ALLOWED_KEYS before hitting gtag.
 */

// Only these keys will ever be forwarded to GA4. Anything else is dropped.
const ALLOWED_KEYS = new Set([
  'page_path',
  'page_location',
  'source',
  'tab',
  'book_slug',
  'pillar',
  'file_format',
  'variant_count',
  'result_count',
  'has_pillar',
  'triggered_by',
])

/** Sanitise event params to keep any accidental PII out. */
function sanitise(params) {
  const clean = {}
  if (!params || typeof params !== 'object') return clean
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_KEYS.has(key)) continue
    if (value === null || value === undefined) continue
    // Only allow primitives (strings, numbers, booleans)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value
    }
  }
  return clean
}

/**
 * Fire a GA4 event. Safe no-op on server or when gtag isn't loaded
 * (e.g. NEXT_PUBLIC_GA_MEASUREMENT_ID is empty).
 */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  const safeParams = sanitise({
    page_path: window.location?.pathname,
    ...params,
  })
  try {
    window.gtag('event', name, safeParams)
  } catch {
    /* swallow — analytics must never break the app */
  }
}

// Event name constants so we don't typo them in components.
export const EVENTS = {
  SEARCH_PERFORMED: 'search_performed',
  GENOME_UPLOAD_STARTED: 'genome_upload_started',
  GENOME_RESULTS_VIEWED: 'genome_results_viewed',
  READING_LIST_VIEWED: 'reading_list_viewed',
  BOOK_RESEARCH_CLICKED: 'book_research_clicked',
  PLAIN_LANGUAGE_EXPANDED: 'plain_language_expanded',
  SUPPORT_CLICKED: 'support_clicked',
}
