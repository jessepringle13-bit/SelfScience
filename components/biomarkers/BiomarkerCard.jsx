// /app/components/biomarkers/BiomarkerCard.jsx
// Rich per-biomarker card used on the redesigned /biomarkers page.
//
// Contains:
//   • Value input with unit + status pill (or empty-state prompt)
//   • "Why it matters" explainer
//   • Range bar comparing standard vs SelfScience optimization ranges
//   • Textual range summary (both ranges written out)
//   • Evidence drawer (confidence + citations, collapsible)
//   • Related biomarker chips (clickable to scroll into view)
//   • "Possible next steps" chip group
//   • Optional divergence note when clinical range and SelfScience target
//     meaningfully disagree.

'use client'

import { useMemo } from 'react'
import { ArrowRight, Lightbulb, RefreshCcw, Stethoscope, TestTube2 } from 'lucide-react'
import { STATUS, evaluateBiomarker, resolveForSex } from '@/lib/biomarkers/status'
import RangeBar from './RangeBar'
import EvidenceDrawer from './EvidenceDrawer'
import GenomeLinks from './GenomeLinks'
import Sparkline from './Sparkline'

export function BiomarkerCard({ biomarker, sex = 'male', value, onChange, onScrollToRelated, report = null }) {
  const resolved = useMemo(() => resolveForSex(biomarker, sex), [biomarker, sex])
  const evalResult = useMemo(() => evaluateBiomarker(resolved, value), [resolved, value])
  const statusMeta = STATUS[evalResult.status]

  const [sMin, sMax] = resolved.standard.interval
  const [oMin, oMax] = resolved.optimization.optimal

  // Divergence note: is SelfScience target meaningfully narrower or
  // shifted vs the standard clinical range?
  const divergenceNote = useMemo(() => {
    const stdSpan = sMax - sMin
    const optSpan = oMax - oMin
    const narrower = optSpan < 0.75 * stdSpan
    const shiftedLow  = oMax < sMax * 0.7
    const shiftedHigh = oMin > sMax * 1.05
    if (shiftedHigh) return 'The SelfScience target sits above the standard clinical range — mid-upper-normal is preferred by some optimization frameworks; direct outcome evidence is limited.'
    if (shiftedLow)  return 'The SelfScience target sits below the standard clinical range — cohort data associates lower values with better outcomes; benefit at the extreme low end is not established.'
    if (narrower)    return 'The SelfScience target is a tighter window than the standard clinical range; being outside the target but inside “normal” is usually a nudge, not a red flag.'
    return null
  }, [sMin, sMax, oMin, oMax])

  return (
    <article id={`bm-${resolved.id}`} className="scroll-mt-28 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 md:p-6">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-ss-teal md:text-xl">{resolved.label}</h3>
            {resolved.aliases?.length > 0 && (
              <span className="text-[11px] text-ss-muted">a.k.a. {resolved.aliases.join(' · ')}</span>
            )}
          </div>
        </div>

        {/* Status pill */}
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusMeta.tone}`}>
          <span className={`inline-block h-2 w-2 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </div>
      </div>

      {/* Value input row */}
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <label className="inline-flex items-center rounded-full bg-ss-bg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ss-muted">
          Your value
        </label>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            inputMode="decimal"
            step={resolved.step ?? 0.1}
            min={resolved.min}
            max={resolved.max}
            value={value ?? ''}
            onChange={(e) => onChange?.(resolved.id, e.target.value)}
            placeholder="—"
            className="w-24 rounded-md border border-ss-border-warm bg-white px-2 py-1 text-base font-mono font-bold text-ss-text focus:border-ss-teal focus:outline-none focus:ring-1 focus:ring-ss-teal"
          />
          <span className="text-sm text-ss-muted">{resolved.unit}</span>
        </div>
      </div>

      {/* Range bar */}
      <div className="mt-4">
        <RangeBar biomarker={resolved} value={evalResult.value} />
      </div>

      {/* Trend sparkline (hidden until 2+ dated snapshots exist) */}
      <div className="mt-3">
        <Sparkline biomarker={resolved} />
      </div>

      {/* Range summaries */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RangeCard
          label="Standard clinical range"
          range={`${sMin}–${sMax} ${resolved.unit}`}
          note={resolved.standard.label}
          source={resolved.standard.source}
          tone="muted"
        />
        <RangeCard
          label="SelfScience target"
          range={`${oMin}–${oMax} ${resolved.unit}`}
          note={resolved.optimization.label}
          tone="teal"
        />
      </div>

      {divergenceNote && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs italic leading-relaxed text-amber-800 ring-1 ring-amber-200">
          {divergenceNote}
        </p>
      )}

      {/* Why it matters */}
      <div className="mt-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">Why this matters</div>
        <p className="mt-1 text-sm leading-relaxed text-ss-text">{resolved.whyItMatters}</p>
      </div>

      {/* Related biomarkers */}
      {resolved.relatedTo?.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">Interpret alongside</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {resolved.relatedTo.map((rid) => (
              <button
                key={rid}
                type="button"
                onClick={() => onScrollToRelated?.(rid)}
                className="inline-flex items-center gap-1 rounded-full bg-ss-teal/10 px-2 py-0.5 text-[11px] font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
              >
                {rid.replace(/_/g, ' ')}
                <ArrowRight size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Evidence drawer */}
      <div className="mt-4">
        <EvidenceDrawer biomarker={resolved} />
      </div>

      {/* Genome links (only when user has a genome AND covered variants exist) */}
      {report && <GenomeLinks biomarkerId={resolved.id} report={report} />}

      {/* Next steps */}
      <NextStepsGrid steps={resolved.nextSteps} />
    </article>
  )
}

/* ------------------------------- Subparts -------------------------------- */

function RangeCard({ label, range, note, source, tone }) {
  const cls = tone === 'teal'
    ? 'bg-ss-teal/5 ring-ss-teal/20'
    : 'bg-slate-50 ring-slate-200'
  return (
    <div className={`rounded-lg p-3 ring-1 ${cls}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">{label}</div>
      <div className="mt-1 font-mono text-sm font-bold text-ss-text">{range}</div>
      {note && <div className="mt-0.5 text-[11px] text-ss-muted">{note}</div>}
      {source && <div className="mt-0.5 text-[10px] italic text-ss-muted">{source}</div>}
    </div>
  )
}

function NextStepsGrid({ steps }) {
  if (!steps) return null
  const groups = [
    { key: 'lifestyle',    label: 'Lifestyle levers',      icon: Lightbulb,   items: steps.lifestyle || [] },
    { key: 'clinician',    label: 'Clinician follow-up',   icon: Stethoscope, items: steps.clinician || [] },
    { key: 'relatedLabs',  label: 'Pair with next time',   icon: TestTube2,   items: steps.relatedLabs || [] },
  ]
  return (
    <div className="mt-5 rounded-xl bg-ss-bg/70 p-4">
      <div className="flex items-center gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ss-orange">Possible next steps to discuss or explore</div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {groups.map(({ key, label, icon: Icon, items }) => (
          items.length > 0 && (
            <div key={key}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-ss-teal">
                <Icon size={12} /> {label}
              </div>
              <ul className="mt-1.5 space-y-1 text-xs text-ss-text/85">
                {items.map((it, i) => (
                  <li key={i} className="flex gap-1">
                    <span className="select-none text-ss-muted">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        ))}
      </div>
      {steps.retest && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ss-muted">
          <RefreshCcw size={11} /> <span className="font-semibold text-ss-text/85">Retest cadence:</span> {steps.retest}
        </div>
      )}
    </div>
  )
}

export default BiomarkerCard
