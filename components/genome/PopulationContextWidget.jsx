'use client'

// /app/components/genome/PopulationContextWidget.jsx
// Small sidebar widget on genome results pages showing the count of
// rare / moderate / common variants and a link to /population-compare.

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Globe2 } from 'lucide-react'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { globalFrequencyPercent, rarityTier } from '@/lib/ancestryFrequencies'

export default function PopulationContextWidget({ report, className = '' }) {
  const counts = useMemo(() => {
    if (!report) return { rare: 0, moderate: 0, common: 0 }
    const cards = flattenReportCards(report)
    const c = { rare: 0, moderate: 0, common: 0 }
    for (const card of cards) {
      const pct = globalFrequencyPercent(card)
      if (pct == null) continue
      const t = rarityTier(pct)
      if (t === 'rare' || t === 'moderate' || t === 'common') c[t] += 1
    }
    return c
  }, [report])

  const total = counts.rare + counts.moderate + counts.common
  if (total === 0) return null

  return (
    <section aria-labelledby="pop-ctx-heading" className={`rounded-2xl border border-ss-border-warm/60 bg-ss-bg/60 p-4 md:p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Globe2 size={14} className="text-ss-teal" />
        <div
          className="font-mono text-[10px] font-bold uppercase text-ss-teal"
          style={{ letterSpacing: '0.14em' }}
        >
          How common are your findings
        </div>
      </div>
      <h3 id="pop-ctx-heading" className="sr-only">Population context</h3>
      <div className="grid grid-cols-3 gap-2">
        <StatPill count={counts.rare} label="rare variants" tone="amber" />
        <StatPill count={counts.moderate} label="moderate variants" tone="teal" />
        <StatPill count={counts.common} label="common variants" tone="green" />
      </div>
      <Link href="/population-compare" className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
        Explore population data <ArrowRight size={11} />
      </Link>
    </section>
  )
}

function StatPill({ count, label, tone }) {
  const bg  = tone === 'amber' ? 'bg-ss-amber/10' : tone === 'teal' ? 'bg-ss-teal/10' : 'bg-ss-green/10'
  const brd = tone === 'amber' ? 'border-ss-amber/40' : tone === 'teal' ? 'border-ss-teal/40' : 'border-ss-green/40'
  const num = tone === 'amber' ? 'text-ss-amber' : tone === 'teal' ? 'text-ss-teal' : 'text-ss-green'
  return (
    <div className={`rounded-xl border ${brd} ${bg} p-2 text-center`}>
      <div className={`text-[1.4rem] font-extrabold leading-none ${num}`}>{count}</div>
      <div
        className="mt-1 font-mono text-[9px] uppercase text-ss-muted"
        style={{ letterSpacing: '0.02em' }}
      >
        {label}
      </div>
    </div>
  )
}
