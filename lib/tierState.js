// /app/lib/tierState.js
// Three-tier progressive access engine. Pure client-side. No server
// state, no account required. One localStorage key: ss_tier_state.
//
// Tiers:
//   1 — Understanding (First Look pager)
//   2 — Explorer     (full tools)
//   3 — SelfScience Pro (AI Coach, Family Comparison, Deep Research)

'use client'
import { useEffect, useState } from 'react'

export const LS_TIER = 'ss_tier_state'
export const CHANGE = 'selfscience:tier-changed'

function fire() { try { window.dispatchEvent(new CustomEvent(CHANGE)) } catch {} }

const DEFAULT_STATE = {
  tier: 1,
  findingsTotal: 0,
  findingsRead: [],
  findingsCompleted: false,
  tier2UnlockedAt: null,
  tier3UnlockedAt: null,
  hasSeenWelcome: false,
  savedAt: null,
}

export function readTierState() {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = window.localStorage.getItem(LS_TIER)
    if (!raw) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch { return DEFAULT_STATE }
}

export function writeTierState(patch) {
  if (typeof window === 'undefined') return
  const prev = readTierState()
  const next = { ...prev, ...patch, savedAt: new Date().toISOString() }
  next.findingsCompleted = (next.findingsRead || []).length >= (next.findingsTotal || 0) && (next.findingsTotal || 0) > 0
  try { window.localStorage.setItem(LS_TIER, JSON.stringify(next)); fire() } catch {}
  return next
}

// Called by the genome results renderer when we know how many findings
// the user has. Only initializes if this is the first time.
export function initTierStateIfNew(findingsTotal) {
  const s = readTierState()
  if (!s.savedAt || s.findingsTotal !== findingsTotal) {
    return writeTierState({
      tier: s.tier || 1,
      findingsTotal,
      // Preserve read progress on regenerate (same genome, same count).
      findingsRead: s.findingsTotal === findingsTotal ? (s.findingsRead || []) : [],
      hasSeenWelcome: s.hasSeenWelcome || false,
      tier2UnlockedAt: s.tier2UnlockedAt || null,
      tier3UnlockedAt: s.tier3UnlockedAt || null,
    })
  }
  return s
}

export function markFindingRead(idOrIndex) {
  const s = readTierState()
  const key = String(idOrIndex)
  if (!s.findingsRead.includes(key)) {
    return writeTierState({ findingsRead: [...s.findingsRead, key] })
  }
  return s
}

export function unlockTier2() {
  return writeTierState({ tier: 2, tier2UnlockedAt: new Date().toISOString() })
}

// SelfScience Pro (Tier 3) — placeholder unlock. Flips the flag in
// localStorage; a real implementation would wire this to a payment
// success callback.
export function unlockTier3() {
  const s = readTierState()
  const patch = {
    tier: 3,
    tier3UnlockedAt: new Date().toISOString(),
  }
  // If the user has never graduated to Tier 2 they still get Tier 3
  // benefits — record the Tier 2 timestamp too so downstream analytics
  // see a consistent progression.
  if (!s.tier2UnlockedAt) patch.tier2UnlockedAt = new Date().toISOString()
  return writeTierState(patch)
}

// Downgrade helper — used by the dev tier switcher on /pro to demo
// the locked state without wiping progress.
export function downgradeToTier(tier) {
  const t = Math.max(1, Math.min(3, Number(tier) || 1))
  return writeTierState({ tier: t })
}

export function dismissWelcome() {
  return writeTierState({ hasSeenWelcome: true })
}

// Called from the existing "Analyze another file" reset. Wipes tier
// state entirely so the next upload starts fresh in Tier 1.
export function resetTierState() {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(LS_TIER); fire() } catch {}
}

export function useTierState() {
  const [s, setS] = useState(DEFAULT_STATE)
  useEffect(() => {
    const load = () => setS(readTierState())
    load()
    const onCh = () => load()
    window.addEventListener(CHANGE, onCh)
    window.addEventListener('storage', onCh)
    return () => {
      window.removeEventListener(CHANGE, onCh)
      window.removeEventListener('storage', onCh)
    }
  }, [])
  return s
}

// Which tool pages are gated behind Tier 2.
export const TIER2_LOCKED_ROUTES = new Set([
  '/tools/training',
  '/biomarkers',
  '/nutrition',
  '/drug-check',
  '/population-compare',
  '/practitioner-report',
])

// Which tool pages are gated behind Tier 3 (SelfScience Pro). AI Coach
// and Deep Research are now shipped as free features under /coach and
// /research; Family Comparison remains the sole Pro-gated tool for now.
export const TIER3_LOCKED_ROUTES = new Set([
  '/pro/family-compare',
])

// ---------------------------------------------------------------
// Entitlements — the granular feature map used by the PDF export
// section picker and any future Pro-gated widget. Keep in sync with
// TIER3_LOCKED_ROUTES.
// ---------------------------------------------------------------
export const PRO_FEATURES = ['aiCoach', 'familyComparison', 'deepResearch']

export function entitlementsFor(tier) {
  const t = Number(tier) || 1
  return {
    // Always-on for everyone.
    readFindings:      true,
    pdfExport:         true,

    // Tier 2+ (Explorer).
    deepExplorer:      t >= 2,
    focusMode:         t >= 2,
    allTools:          t >= 2,
    protocol:          t >= 2,

    // Tier 3 (SelfScience Pro).
    aiCoach:           t >= 3,
    familyComparison:  t >= 3,
    deepResearch:      t >= 3,
  }
}

export function hasEntitlement(feature, tierOrState) {
  const t = typeof tierOrState === 'object' && tierOrState ? tierOrState.tier : tierOrState
  return !!entitlementsFor(t)[feature]
}

export function useEntitlements() {
  const s = useTierState()
  return entitlementsFor(s.tier)
}

// Returns { locked: boolean, requiredTier: 2|3|null } so the gate
// component can pick the right splash (Tier 1 vs. Pro).
export function isRouteLocked(pathname, tier) {
  const t = Number(tier) || 1
  if (TIER3_LOCKED_ROUTES.has(pathname || '')) {
    return { locked: t < 3, requiredTier: 3 }
  }
  if (TIER2_LOCKED_ROUTES.has(pathname || '')) {
    return { locked: t < 2, requiredTier: 2 }
  }
  return { locked: false, requiredTier: null }
}
