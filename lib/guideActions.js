'use client'

// /app/lib/guideActions.js
// Small helper that lets any feature signal "the user just did the real
// action for this Tier 2 step" so the Journey Guide can mark it complete
// without waiting for a route visit. Kept as a fire-and-forget dispatch
// so callers don't need to know about the guide's internal state.

export const GUIDE_ACTION_EVENT = 'selfscience:guide-action'

// Keys must match the `key` used in TIER2_STEPS inside JourneyGuide.jsx.
export const GUIDE_ACTIONS = {
  SEARCH:     'search',       // user ran a real search query
  SCANNER:    'scanner',      // user scanned a barcode
  DRUG_CHECK: 'drugcheck',    // user checked a medication against their genome
  BIOMARKERS: 'biomarkers',   // user saved a biomarker value
  REPORT:     'report',       // user generated / printed the practitioner report
  ARTICLES:   'articles',     // user opened an actual article page
}

/**
 * Fire the "did the real thing" signal for a Tier 2 step.
 *   fireGuideAction(GUIDE_ACTIONS.SEARCH)
 * SSR-safe. Silent when window is unavailable.
 */
export function fireGuideAction(stepKey) {
  if (typeof window === 'undefined' || !stepKey) return
  try {
    window.dispatchEvent(new CustomEvent(GUIDE_ACTION_EVENT, { detail: { key: stepKey } }))
  } catch { /* noop */ }
}
