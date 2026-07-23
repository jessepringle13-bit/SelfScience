'use client'

// /app/components/dashboard/PillarChipBar.jsx
// Horizontal, scrollable pillar chip bar used on the Dashboard to filter
// Top Findings / Strengths / Research Matched sections. Mirrors the style
// of the Search page filter row.
//
// Phase A · Part 2: the chip ORDER is now driven by the user's interests
// selected during the first-time welcome modal. Preferred pillars appear
// FIRST (right after "All Pillars"), with a subtle "★" marker to hint
// they're prioritized based on the user's stated interests. Everything is
// still visible — this is a re-ordering, not a filter.

import { useEffect, useState } from 'react'
import { PILLARS } from '@/components/site-nav'
import { getInterests, pillarsFromInterests } from '@/lib/interests'

export default function PillarChipBar({ value, onChange, className = '' }) {
  const [preferred, setPreferred] = useState(() => new Set())

  // Read the user's interests from localStorage on mount and re-read
  // whenever they change (welcome modal fires 'selfscience:interests-changed').
  useEffect(() => {
    const compute = () => {
      const keys   = getInterests()
      const names  = pillarsFromInterests(keys, PILLARS)
      // "Everything" (safe default) → don't prioritize anything, since
      // all pillars are equal in that mode.
      const noRe   = keys.includes('everything') || names.length === 0
      setPreferred(noRe ? new Set() : new Set(names))
    }
    compute()
    if (typeof window === 'undefined') return
    window.addEventListener('selfscience:interests-changed', compute)
    return () => window.removeEventListener('selfscience:interests-changed', compute)
  }, [])

  // Sort: preferred pillars first (in the order they appear in PILLARS
  // for stability), then the rest.
  const orderedPillars = [...PILLARS].sort((a, b) => {
    const ap = preferred.has(a.name) ? 0 : 1
    const bp = preferred.has(b.name) ? 0 : 1
    return ap - bp
  })

  const chips = [{ key: '__all', name: '', short: 'All Pillars' }, ...orderedPillars]
  return (
    <div
      role="tablist"
      aria-label="Filter by pillar"
      className={`no-scrollbar -mx-1 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-1 py-1 ${className}`}
    >
      {chips.map((p) => {
        const isAll = p.key === '__all'
        const active = isAll ? !value : value === p.name
        const isPreferred = !isAll && preferred.has(p.name)
        return (
          <button
            key={p.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(isAll ? null : p.name)}
            className={`min-h-9 shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              active
                ? 'border-ss-teal bg-ss-teal text-white shadow-sm'
                : 'border-ss-border-warm bg-white text-ss-teal hover:border-ss-teal'
            }`}
          >
            {isPreferred && !active && (
              <span aria-hidden="true" className="mr-1 text-ss-orange">★</span>
            )}
            {p.short}
          </button>
        )
      })}
    </div>
  )
}
