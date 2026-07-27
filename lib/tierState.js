// /app/lib/tierState.js
// Three-tier progressive access engine. Pure client-side. No server
// state, no account required. One localStorage key: ss_tier_state.

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

export function isRouteLocked(pathname, tier) {
  if (tier >= 2) return false
  return TIER2_LOCKED_ROUTES.has(pathname || '')
}
