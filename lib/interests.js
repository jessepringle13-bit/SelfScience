// /app/lib/interests.js
// Phase A · Part 2 support: canonical list of "what would you like to learn
// about?" options shown in the first-time welcome modal, plus helpers to
// read/write user selections and translate them into pillar names for
// downstream re-ordering / filtering of the dashboard chip bar.
//
// Storage keys (client-side only, ss_ namespaced):
//   ss_onboarded → '1' once the welcome modal has been shown/dismissed
//   ss_interests → JSON.stringify(string[]) of interest keys

export const LS_ONBOARDED = 'ss_onboarded'
export const LS_INTERESTS = 'ss_interests'

// Each interest maps to one or more canonical pillar names as used by
// components/site-nav.jsx PILLARS. The 'everything' sentinel maps to '*'
// which readers should treat as "all pillars" (safe default).
export const INTERESTS = [
  { key: 'energy',     label: 'My energy and metabolism',                    pillars: ['Nutrition'] },
  { key: 'sleep',      label: 'My sleep quality',                            pillars: ['General Wellness'] },
  { key: 'food',       label: 'How my body responds to food',                pillars: ['Nutrition'] },
  { key: 'heart',      label: 'My heart health',                             pillars: ['Longevity'] },
  { key: 'fitness',    label: 'My fitness and recovery',                     pillars: ['Sports Performance'] },
  { key: 'meds',       label: 'Medications and how my body processes them', pillars: ['Pharmacogenomics'] },
  { key: 'mental',     label: 'My mental clarity and mood',                  pillars: ['Mental Health & Neurochemistry'] },
  { key: 'everything', label: "I'm not sure yet — show me everything",       pillars: ['*'] },
]

const INTEREST_BY_KEY = Object.fromEntries(INTERESTS.map((i) => [i.key, i]))

// SSR-safe reader. Returns the currently-selected interest keys or [].
export function getInterests() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_INTERESTS)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((k) => INTEREST_BY_KEY[k]) : []
  } catch { return [] }
}

// SSR-safe writer. Marks the user as onboarded regardless of whether they
// selected anything (dismissing without selecting is a valid path — we still
// don't want to re-show the modal).
export function setInterests(keys) {
  if (typeof window === 'undefined') return
  try {
    const clean = Array.isArray(keys) ? keys.filter((k) => INTEREST_BY_KEY[k]) : []
    window.localStorage.setItem(LS_INTERESTS, JSON.stringify(clean))
    window.localStorage.setItem(LS_ONBOARDED, '1')
    window.dispatchEvent(new Event('selfscience:interests-changed'))
  } catch { /* noop */ }
}

// True until the welcome modal has been shown once.
export function needsOnboarding() {
  if (typeof window === 'undefined') return false
  try { return !window.localStorage.getItem(LS_ONBOARDED) } catch { return false }
}

// Expand selected interests → distinct pillar names. 'everything' returns
// ALL PILLARS so callers can treat the safe default as "everything visible".
export function pillarsFromInterests(keys, allPillars = []) {
  if (!Array.isArray(keys) || keys.length === 0) return []
  if (keys.includes('everything')) return allPillars.map((p) => p.name || p)
  const out = new Set()
  keys.forEach((k) => {
    const i = INTEREST_BY_KEY[k]
    if (!i) return
    i.pillars.forEach((p) => { if (p !== '*') out.add(p) })
  })
  return Array.from(out)
}
