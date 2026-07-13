'use client'
// Genome-driven supplement-form recommendations. Mirrors the biomarker
// deep-link but scoped to genome-source personalisation signals.
import { useEffect, useState } from 'react'
import { computePersonalisation } from '@/lib/supplements/personalisation'
import { GOALS } from '@/lib/supplements/goalCategories'
import { Dna, ArrowRight, AlertTriangle, Pill } from 'lucide-react'

function findGoalFor(categoryHint) {
  for (const g of GOALS) {
    if ((g.categories || []).some((c) => c.id === categoryHint)) return g
  }
  return null
}

export default function GenomeSupplementLinks({ report }) {
  const [signals, setSignals] = useState([])

  useEffect(() => {
    if (!report?.cards?.length) { setSignals([]); return }
    try {
      const all = computePersonalisation({ genomeReport: report, biomarkers: null })
      setSignals(all.filter((s) => s.source === 'genome'))
    } catch { setSignals([]) }
  }, [report])

  if (!signals.length) return null

  return (
    <section className="rounded-2xl border border-[#1B474D]/15 bg-white shadow-sm overflow-hidden mt-6">
      <header className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-[#1B474D] to-[#0f2f34] text-white">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4" />
          <span className="text-sm font-semibold">Supplement forms your variants suggest exploring</span>
        </div>
        <a href="/tools/supplements/my-variants" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white">
          See all signals <ArrowRight className="h-3 w-3" />
        </a>
      </header>
      <ul className="divide-y divide-slate-100">
        {signals.map((s) => {
          const goal = findGoalFor(s.categoryHint)
          const href = goal
            ? `/tools/supplements?goal=${goal.id}&category=${s.categoryHint}`
            : '/tools/supplements'
          const Icon = s.urgency === 'caution' ? AlertTriangle : Dna
          return (
            <li key={s.id}>
              <a href={href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.urgency === 'caution' ? 'text-amber-700' : 'text-[#1B474D]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {s.headline}
                    {s.gene && <span className="ml-1.5 text-xs font-normal text-slate-500">({s.gene}{s.rsid ? ' · ' + s.rsid : ''})</span>}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{s.reason}</div>
                </div>
                <ArrowRight className="h-4 w-4 mt-1 text-slate-400" />
              </a>
            </li>
          )
        })}
      </ul>
      <div className="px-4 py-2 text-[10px] text-slate-500 bg-slate-50 border-t border-slate-100">
        Educational only. Not medical advice. All product links go to brand-direct stores.
      </div>
    </section>
  )
}
