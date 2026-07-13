// /app/components/biomarkers/PanelSummary.jsx
// Snapshot summary card at the top of the /biomarkers page.
// Counts fields by 4-tier status and links each count to a per-status
// filter (implemented as scroll-jump for MVP).

'use client'

import { useMemo } from 'react'
import { STATUS } from '@/lib/biomarkers/status'

export function PanelSummary({ evaluated, total }) {
  const counts = useMemo(() => {
    const acc = { in_target: 0, borderline: 0, outside: 0, insufficient: 0 }
    for (const r of Object.values(evaluated || {})) {
      if (acc[r.status] != null) acc[r.status]++
    }
    return acc
  }, [evaluated])

  const entered = total - counts.insufficient

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ss-border-warm/60 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ss-orange">Snapshot</div>
          <h2 className="mt-0.5 text-xl font-extrabold text-ss-teal md:text-2xl">
            {entered} of {total} biomarkers entered
          </h2>
        </div>
        {entered === 0 && (
          <span className="text-xs italic text-ss-muted">
            Enter what you have — partial panels still surface useful patterns.
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatChip meta={STATUS.in_target}    count={counts.in_target} />
        <StatChip meta={STATUS.borderline}   count={counts.borderline} />
        <StatChip meta={STATUS.outside}      count={counts.outside} />
        <StatChip meta={STATUS.insufficient} count={counts.insufficient} />
      </div>
    </div>
  )
}

function StatChip({ meta, count }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ring-1 ${meta.tone}`}>
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${meta.dot}`} />
      <div>
        <div className="font-mono text-lg font-bold leading-none">{count}</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{meta.label}</div>
      </div>
    </div>
  )
}

export default PanelSummary
