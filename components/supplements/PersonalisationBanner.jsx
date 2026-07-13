'use client'
// Top-of-results "Personalised for you" banner. Shows genome + biomarker
// signals that match the current category. Educational only — no dosing,
// no prescriptive language.
import { Dna, FlaskConical, AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

const URGENCY_STYLE = {
  high:    { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', label: 'Strong match' },
  medium:  { bg: 'bg-teal-50',    border: 'border-teal-300',    text: 'text-teal-900',    label: 'Match' },
  low:     { bg: 'bg-sky-50',     border: 'border-sky-300',     text: 'text-sky-900',     label: 'Adjacent' },
  caution: { bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-900',   label: 'Caution' },
}

export default function PersonalisationBanner({ signals, category }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !signals?.length) return null

  return (
    <div className="rounded-2xl border border-[#1B474D]/20 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-[#1B474D] to-[#0f2f34] text-white">
        <div className="flex items-center gap-2">
          <Dna className="h-4 w-4" />
          <span className="text-sm font-semibold">
            Personalised for you
            {category ? <span className="font-normal text-white/80"> · {category.label}</span> : null}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {signals.map((s) => {
          const style = URGENCY_STYLE[s.urgency] || URGENCY_STYLE.low
          const Icon = s.source === 'genome' ? Dna : FlaskConical
          return (
            <li key={s.id} className={`flex items-start gap-3 px-4 py-3 ${style.bg}`}>
              <div className={`shrink-0 rounded-md border ${style.border} ${style.bg} p-1.5`}>
                {s.urgency === 'caution'
                  ? <AlertTriangle className={`h-4 w-4 ${style.text}`} />
                  : <Icon className={`h-4 w-4 ${style.text}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold uppercase tracking-wide ${style.text}`}>{style.label}</div>
                <div className="text-sm font-semibold text-slate-900">
                  {s.headline}
                  {s.source === 'genome' && s.gene && <span className="ml-1.5 text-xs font-normal text-slate-500">({s.gene}{s.rsid ? ' · ' + s.rsid : ''})</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-700 leading-snug">{s.reason}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-100 bg-slate-50">
        Educational only. Not a diagnosis or prescription. Talk to a clinician before starting any supplement.
      </div>
    </div>
  )
}
