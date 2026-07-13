// /app/components/biomarkers/PatternPanel.jsx
// Displays detected cross-marker patterns above the per-category grid.
// Each pattern card shows: severity pill, headline, one-line description,
// the interpretation notes, and a small snapshot chip row of the markers
// that drove the pattern (clickable to scroll to that card).

'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { detectPatterns, SEVERITY_META } from '@/lib/biomarkers/patterns'
import { STATUS } from '@/lib/biomarkers/status'

const HUMAN_MARKER = {
  hba1c: 'HbA1c', fasting_glucose: 'Fasting Glucose',
  testosterone_total: 'Total T', testosterone_free: 'Free T', shbg: 'SHBG',
  tsh: 'TSH', free_t3: 'Free T3', free_t4: 'Free T4',
  ferritin: 'Ferritin', hemoglobin: 'Hemoglobin', hs_crp: 'hs-CRP',
  apob: 'ApoB', ldl: 'LDL-C', hdl: 'HDL-C',
}

export function PatternPanel({ evaluated, onScrollToMarker }) {
  const patterns = useMemo(() => detectPatterns(evaluated || {}), [evaluated])

  if (patterns.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ss-orange">
            <Sparkles size={12} /> Pattern detection
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-ss-teal md:text-2xl">
            Cross-marker patterns
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-ss-muted">
            SelfScience looks at clusters of related markers together, because a single value in
            isolation rarely tells the full story. Themes below are educational discussion points,
            not diagnoses.
          </p>
        </div>
        <span className="whitespace-nowrap text-xs text-ss-muted">
          {patterns.length} pattern{patterns.length === 1 ? '' : 's'} detected
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} onScrollToMarker={onScrollToMarker} />
        ))}
      </div>
    </section>
  )
}

function PatternCard({ pattern, onScrollToMarker }) {
  const meta = SEVERITY_META[pattern.severity] || SEVERITY_META.ok
  const [open, setOpen] = useState(pattern.severity !== 'ok')

  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ${
      pattern.severity === 'attend' ? 'ring-rose-200'
      : pattern.severity === 'watch' ? 'ring-amber-200'
      : pattern.severity === 'nudge' ? 'ring-teal-200'
      : 'ring-ss-border-warm/60'
    }`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${meta.tone}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
              {pattern.label}
            </span>
          </div>
          <div className="mt-1.5 text-base font-bold text-ss-teal md:text-lg">
            {pattern.headline}
          </div>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-ss-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-ss-border-warm/60 px-5 pb-5 pt-4">
          <p className="text-xs italic text-ss-muted">{pattern.description}</p>

          {pattern.notes.length > 0 && (
            <ul className="space-y-2 text-sm leading-relaxed text-ss-text">
              {pattern.notes.map((note, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ss-teal/70" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}

          {pattern.observed.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
                Markers driving this pattern
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pattern.observed.map((o) => {
                  const s = STATUS[o.status] || STATUS.insufficient
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onScrollToMarker?.(o.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 hover:brightness-95 ${s.tone}`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {HUMAN_MARKER[o.id] || o.id}
                      {o.value != null && <span className="font-mono opacity-75">· {o.value}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default PatternPanel
