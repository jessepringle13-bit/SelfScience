'use client'

// /app/lib/journeyReset.js
// Central helpers for the "Clear & Reset", "Restart Guide", and
// "Show Guide again" actions. Every reset happens client-side —
// SelfScience never stores this data on our servers.

import { clearGenomeResults } from '@/lib/genomeSession'

// Guide-related keys (Part 2 clears exactly these; Part 1 clears these
// PLUS the genome + onboarding + interests).
export const GUIDE_KEYS = [
  'ss_guide_progress',
  'ss_guide_tier2',
  'ss_guide_tier2_unlocked',
  'ss_guide_explorer',
  'ss_guide_first_seen',
  'ss_guide_collapsed',
  'ss_guide_dismissed',
  'ss_visited_search',
  'ss_visited_nutrition',
  'ss_visited_drugcheck',
  'ss_visited_supplements',
  'ss_visited_biomarkers',
  'ss_visited_training',
  'ss_features_explored',
]

// Additional keys wiped only by the full "Clear & Reset" flow.
export const FULL_RESET_EXTRA_KEYS = [
  'ss_onboarded',
  'ss_interests',
  'ss_orientation_seen',
  'ss_dashboard_tour_seen',
  'ss_real_genome_banner_dismissed',
]

/**
 * Full reset (Part 1) — wipes genome + guide + first-visit banners.
 * Fires 'selfscience:genome-changed' so mounted components refresh.
 */
export function resetGenomeAndGuide() {
  if (typeof window === 'undefined') return
  try {
    clearGenomeResults()
    ;[...GUIDE_KEYS, ...FULL_RESET_EXTRA_KEYS].forEach((k) => {
      try { window.localStorage.removeItem(k) } catch {}
    })
    window.dispatchEvent(new Event('selfscience:genome-changed'))
    window.dispatchEvent(new Event('selfscience:interests-changed'))
  } catch {}
}

/**
 * Guide-only reset (Part 2) — leaves genome, onboarding, and interests
 * intact. Un-hides the guide so it reappears at Tier 1 · Step 1.
 */
export function resetGuideOnly() {
  if (typeof window === 'undefined') return
  try {
    GUIDE_KEYS.forEach((k) => {
      try { window.localStorage.removeItem(k) } catch {}
    })
    // Reset "first seen" so the 3-day auto-collapse timer starts over.
    try { window.localStorage.setItem('ss_guide_first_seen', new Date().toISOString()) } catch {}
    window.dispatchEvent(new Event('selfscience:guide-changed'))
  } catch {}
}

/**
 * Show Guide Again (Part 3) — only clears the dismissed / collapsed flags.
 * Does NOT reset progress.
 */
export function showGuideAgain() {
  if (typeof window === 'undefined') return
  try {
    try { window.localStorage.removeItem('ss_guide_dismissed') } catch {}
    try { window.localStorage.removeItem('ss_guide_collapsed') } catch {}
    // Reset the auto-collapse anchor so 3-day rule starts over.
    try { window.localStorage.setItem('ss_guide_first_seen', new Date().toISOString()) } catch {}
    window.dispatchEvent(new Event('selfscience:guide-changed'))
  } catch {}
}

/**
 * Toast helper — appended to a global event bus. Actual rendering
 * happens inside <Toast /> (mounted in root layout).
 */
export function fireToast(message, opts = {}) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('selfscience:toast', {
      detail: { message, tone: opts.tone || 'success', ttl: opts.ttl || 3000 },
    }))
  } catch {}
}
