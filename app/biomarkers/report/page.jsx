// /app/app/biomarkers/report/page.jsx
// Print-friendly clinician-ready biomarker report. ENTIRELY client-side:
// reads snapshots from localStorage, renders them into an A4-printable
// layout, and uses window.print() so the browser exports to PDF locally.
// Nothing ever leaves the user's device.

'use client'

import { useEffect, useState } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { loadHistory } from '@/lib/biomarkers/history'
import { getBiomarkerValues } from '@/lib/biomarkersSession'
import { loadContext, CONTEXT_FIELDS } from '@/lib/biomarkers/context'
import { getBiomarkersForSex, evaluateAllBiomarkers, STATUS } from '@/lib/biomarkers/status'
import { detectPatterns } from '@/lib/biomarkers/patterns'

export default function ClinicianReportPage() {
  const [state, setState] = useState({ ready: false })

  useEffect(() => {
    const history = loadHistory().entries
    const currentValues = getBiomarkerValues()
    const context = loadContext()
    let sex = 'male'
    try {
      const s = localStorage.getItem('selfscience_biomarker_sex')
      if (s === 'female' || s === 'male') sex = s
    } catch { /* noop */ }

    // Latest snapshot's values if present, else current values.
    const latestSnapshot = history[0] || null
    const values = latestSnapshot?.values || currentValues
    const evaluated = evaluateAllBiomarkers(values, latestSnapshot?.sex || sex)
    const biomarkers = getBiomarkersForSex(latestSnapshot?.sex || sex)
    const patterns = detectPatterns(evaluated)
    setState({
      ready: true,
      history,
      values,
      context: latestSnapshot?.context || context,
      sex: latestSnapshot?.sex || sex,
      evaluated,
      biomarkers,
      patterns,
      snapshotDate: latestSnapshot?.dateISO || new Date().toISOString().slice(0, 10),
    })
  }, [])

  if (!state.ready) return <div className="p-10 text-sm text-slate-500">Loading report…</div>

  const { history, values, context, sex, evaluated, biomarkers, patterns, snapshotDate } = state
  const entered = biomarkers.filter((b) => evaluated[b.id]?.status !== 'insufficient')

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Screen-only header toolbar */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/biomarkers" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
            <ArrowLeft size={12} /> Back to biomarkers
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-500"
          >
            <Printer size={13} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Report body */}
      <div className="mx-auto max-w-4xl px-6 py-8 print:max-w-none print:px-0">
        <header className="border-b border-slate-300 pb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">SelfScience Biomarker Report</div>
          <h1 className="mt-1 text-2xl font-extrabold">Bloodwork panel · {snapshotDate}</h1>
          <div className="mt-1 text-xs text-slate-600">
            Sex reference: {sex} · {entered.length} of {biomarkers.length} biomarkers recorded · Generated {new Date().toISOString().slice(0, 10)}
          </div>
          <p className="mt-3 text-[11px] italic text-slate-600">
            This is an educational summary intended for discussion with a clinician. Ranges are research-informed
            reference points, not diagnostic thresholds. All values were entered manually by the patient.
          </p>
        </header>

        {/* Draw-context block */}
        {Object.keys(context || {}).length > 0 && (
          <section className="mt-5 rounded border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Draw context noted</div>
            <ul className="mt-1 grid grid-cols-1 gap-x-6 gap-y-0.5 text-xs sm:grid-cols-2">
              {CONTEXT_FIELDS.filter((f) => context[f.id] && context[f.id] !== 'na' && context[f.id] !== 'unsure').map((f) => {
                const opt = f.options.find((o) => o.value === context[f.id])
                return (
                  <li key={f.id}><span className="font-semibold">{f.label}:</span> {opt?.label || context[f.id]}</li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Biomarker table */}
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-teal-700">Biomarker values</h2>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <th className="py-1.5 pr-2">Biomarker</th>
                <th className="py-1.5 pr-2">Value</th>
                <th className="py-1.5 pr-2">Unit</th>
                <th className="py-1.5 pr-2">Standard range</th>
                <th className="py-1.5 pr-2">SelfScience target</th>
                <th className="py-1.5 pr-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {biomarkers.map((b) => {
                const r = evaluated[b.id]
                if (!r || r.status === 'insufficient') return null
                const [sMin, sMax] = b.standard.interval
                const [oMin, oMax] = b.optimization.optimal
                const s = STATUS[r.status]
                return (
                  <tr key={b.id} className="border-b border-slate-100 align-top">
                    <td className="py-1.5 pr-2 font-semibold">{b.label}</td>
                    <td className="py-1.5 pr-2 font-mono">{r.value}</td>
                    <td className="py-1.5 pr-2 text-slate-600">{b.unit}</td>
                    <td className="py-1.5 pr-2 font-mono text-slate-600">{sMin}–{sMax}</td>
                    <td className="py-1.5 pr-2 font-mono text-teal-700">{oMin}–{oMax}</td>
                    <td className="py-1.5 pr-2">{s.label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* Patterns */}
        {patterns.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-teal-700">Cross-marker patterns</h2>
            <div className="mt-2 space-y-3">
              {patterns.map((p) => (
                <div key={p.id} className="rounded border border-slate-200 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{p.label}</div>
                  <div className="mt-0.5 text-sm font-bold text-teal-800">{p.headline}</div>
                  {p.notes?.length > 0 && (
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs">
                      {p.notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History summary */}
        {history.length > 1 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-teal-700">Snapshot history ({history.length})</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {history.map((e) => (
                <li key={e.id}>
                  <span className="font-mono font-bold">{e.dateISO}</span>
                  <span className="ml-2 text-slate-600">{Object.keys(e.values).length} values recorded</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Discussion questions */}
        <section className="mt-6 rounded border-l-4 border-teal-700 bg-teal-50 p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-teal-800">Questions to discuss with your clinician</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-800">
            <li>Are any of these values outside the standard clinical range worth further investigation?</li>
            <li>Which of the patterns above warrant retesting, and on what timeline?</li>
            <li>Given my personal + family history, do these ApoB / LDL / hs-CRP values warrant a Lp(a) test?</li>
            <li>Are any medications, supplements, or recent events likely to be influencing these results?</li>
          </ul>
        </section>

        <footer className="mt-8 border-t border-slate-300 pt-3 text-[10px] italic text-slate-500">
          Generated locally by SelfScience. No values on this report were transmitted over the internet.
          Reference ranges are drawn from major-institution consensus (ADA, ATA, ACC/AHA, ESC, WHO, Endocrine Society).
          Not diagnostic. Not medical advice.
        </footer>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
