'use client'
import { useEffect, useState } from 'react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import { computePersonalisation } from '@/lib/supplements/personalisation'
import { getGenomeResults } from '@/lib/genomeSession'
import { getBiomarkerValues } from '@/lib/biomarkersSession'
import { GOALS } from '@/lib/supplements/goalCategories'
import { Dna, FlaskConical, AlertTriangle, ArrowLeft, ArrowRight, Upload } from 'lucide-react'

const URG = {
  high:    { chip: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'Strong match' },
  medium:  { chip: 'bg-teal-100 text-teal-900 border-teal-300',           label: 'Match' },
  low:     { chip: 'bg-sky-100 text-sky-900 border-sky-300',              label: 'Adjacent' },
  caution: { chip: 'bg-amber-100 text-amber-900 border-amber-300',        label: 'Caution' },
}

export default function MyVariantsClient() {
  const [signals, setSignals] = useState([])
  const [hasGenome, setHasGenome] = useState(false)
  const [hasBio, setHasBio] = useState(false)

  useEffect(() => {
    try {
      const g = getGenomeResults()
      const b = getBiomarkerValues()
      setSignals(computePersonalisation({ genomeReport: g, biomarkers: b }))
      setHasGenome(!!(g?.cards?.length))
      setHasBio(!!(b && Object.values(b).some((v) => v != null && v !== '')))
    } catch { /* silent */ }
  }, [])

  // Group signals by category
  const grouped = signals.reduce((acc, s) => {
    const key = s.categoryHint || s.ingredientKey || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const findGoalFor = (categoryHint) => {
    for (const g of GOALS) {
      if ((g.categories || []).some((c) => c.id === categoryHint)) return g
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#28251D]">
      <section className="bg-[#1B474D] text-white">
        <SiteNav variant="dark" />
        <div className="mx-auto max-w-5xl px-4 md:px-6 pt-6 pb-8 md:pt-8 md:pb-10">
          <a href="/tools/supplements" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Supplements
          </a>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-white/80">
            <Dna className="h-3.5 w-3.5" /> My variants · Personalisation summary
          </div>
          <h1 className="mt-2 text-2xl md:text-4xl font-bold leading-tight">Everything your DNA + labs tell us.</h1>
          <p className="mt-2 text-white/85 text-sm md:text-base max-w-2xl leading-snug">
            All personalisation signals from your uploaded genome and entered biomarkers, aggregated in one place. 100% client-side.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 md:px-6 pt-6 md:pt-8 pb-16 space-y-4">
        {!hasGenome && !hasBio ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            <Upload className="h-6 w-6 mx-auto text-[#1B474D]" />
            <p className="mt-2 font-semibold text-[#1B474D]">No genome or biomarker data on this device.</p>
            <p className="mt-1 text-sm">
              <a href="/genome" className="underline hover:text-[#C45820]">Upload your genome</a> or{' '}
              <a href="/biomarkers" className="underline hover:text-[#C45820]">enter biomarkers</a>{' '}
              to see personalisation signals here.
            </p>
          </div>
        ) : signals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            <p className="font-semibold text-[#1B474D]">No personalisation signals from your data.</p>
            <p className="mt-1 text-sm">Your uploaded genotypes and biomarker values didn&apos;t trigger any of our current personalisation rules. This is a good baseline signal.</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-[#1B474D]/15 bg-white p-4 text-sm text-slate-700">
              <strong className="text-[#1B474D]">{signals.length} signal{signals.length === 1 ? '' : 's'}</strong> across {Object.keys(grouped).length} ingredient categor{Object.keys(grouped).length === 1 ? 'y' : 'ies'}. Click a category to jump to the matching supplement discovery view.
            </div>

            {Object.entries(grouped).map(([cat, catSignals]) => {
              const goal = findGoalFor(cat)
              return (
                <section key={cat} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Ingredient category</div>
                      <div className="text-base font-semibold text-[#1B474D]">{cat}</div>
                    </div>
                    {goal && (
                      <a
                        href={`/tools/supplements?goal=${goal.id}&category=${cat}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#1B474D] hover:bg-[#0f2f34] text-white px-3 py-1.5 text-xs font-semibold"
                      >
                        See products <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </header>
                  <ul className="divide-y divide-slate-100">
                    {catSignals.map((s) => {
                      const u = URG[s.urgency] || URG.low
                      const Icon = s.source === 'genome' ? Dna : FlaskConical
                      return (
                        <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                          <div className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${u.chip}`}>{u.label}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              {s.urgency === 'caution' ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : <Icon className="h-4 w-4 text-[#1B474D]" />}
                              <span>{s.headline}</span>
                              {s.source === 'genome' && <span className="text-xs font-normal text-slate-500">{s.gene}{s.rsid ? ' · ' + s.rsid : ''}</span>}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-700 leading-snug">{s.reason}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </>
        )}

        <p className="text-xs text-slate-500">
          Educational only. Not medical advice. All data stays on this device.
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
