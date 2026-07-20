'use client'

// /app/components/dashboard/PillarChipBar.jsx
// Horizontal, scrollable pillar chip bar used on the Dashboard to filter
// Top Findings / Strengths / Research Matched sections. Mirrors the style
// of the Search page filter row. Replaces the earlier dropdown-based
// PillarFilter on the Dashboard (dropdown stays available elsewhere).

import { PILLARS } from '@/components/site-nav'

export default function PillarChipBar({ value, onChange, className = '' }) {
  const chips = [{ key: '__all', name: '', short: 'All Pillars' }, ...PILLARS]
  return (
    <div
      role="tablist"
      aria-label="Filter by pillar"
      className={`no-scrollbar -mx-1 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-1 py-1 ${className}`}
    >
      {chips.map((p) => {
        const isAll = p.key === '__all'
        const active = isAll ? !value : value === p.name
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
            {p.short}
          </button>
        )
      })}
    </div>
  )
}
