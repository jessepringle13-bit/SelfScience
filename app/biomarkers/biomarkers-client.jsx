'use client'

// /app/app/biomarkers/biomarkers-client.jsx
// SelfScience — Biomarker Panel (Phase 1 redesign).
//
// Uses the schema-driven biomarker library in /app/lib/biomarkers/. Each
// biomarker renders as a rich BiomarkerCard with:
//   • "Why this matters" explainer
//   • Standard clinical range vs SelfScience optimization range
//   • Range bar with the user's value overlaid
//   • Evidence drawer (confidence badge + curated citations)
//   • Related biomarker chips (scroll-jump to interpret alongside)
//   • Possible next-step suggestions
//
// Status vocabulary: in_target / borderline / outside / insufficient
// (see /app/lib/biomarkers/status.js).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, Trash2, ArrowRight, TestTube2, Loader2 } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import RegenTools from '@/components/RegenTools'
import { BIOMARKERS_DISCLAIMER } from '@/lib/biomarkers/schema'
import { evaluateAllBiomarkers, getBiomarkersForSex, groupByCategory } from '@/lib/biomarkers/status'
import { CATEGORIES } from '@/lib/biomarkers/schema'
import { deriveCorrelations } from '@/lib/biomarkerCorrelations'
import {
  getBiomarkerValues, saveBiomarkerValues, clearBiomarkerValues,
} from '@/lib/biomarkersSession'
import { getGenomeResults } from '@/lib/genomeSession'

import { PanelSummary } from '@/components/biomarkers/PanelSummary'
import { BiomarkerCard } from '@/components/biomarkers/BiomarkerCard'
import { EmptyStateOnboarding } from '@/components/biomarkers/EmptyStateOnboarding'
import { PatternPanel } from '@/components/biomarkers/PatternPanel'
import { GenomeSidebar } from '@/components/biomarkers/GenomeSidebar'
import { ContextPanel } from '@/components/biomarkers/ContextPanel'
import { TrendControls } from '@/components/biomarkers/TrendControls'
import { loadContext, saveContext } from '@/lib/biomarkers/context'

const SEX_STORAGE_KEY = 'selfscience_biomarker_sex'

export default function BiomarkersClient() {
  const [values, setValues] = useState({})
  const [ready, setReady] = useState(false)
  const [report, setReport] = useState(null)
  const [sex, setSex] = useState('male')
  const [context, setContext] = useState({})

  // Hydrate localStorage (values + sex + context) + sessionStorage (genome) on mount.
  useEffect(() => {
    setValues(getBiomarkerValues())
    setReport(getGenomeResults())
    setContext(loadContext())
    try {
      const stored = localStorage.getItem(SEX_STORAGE_KEY)
      if (stored === 'female' || stored === 'male') setSex(stored)
    } catch { /* storage disabled */ }
    setReady(true)
    const onGenomeChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onGenomeChange)
    return () => window.removeEventListener('selfscience:genome-changed', onGenomeChange)
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(SEX_STORAGE_KEY, sex) } catch { /* noop */ }
  }, [sex, ready])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => saveBiomarkerValues(values), 250)
    return () => clearTimeout(t)
  }, [values, ready])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => saveContext(context), 200)
    return () => clearTimeout(t)
  }, [context, ready])

  const biomarkersForSex = useMemo(() => getBiomarkersForSex(sex), [sex])
  const evaluated = useMemo(() => evaluateAllBiomarkers(values, sex), [values, sex])
  const grouped = useMemo(() => groupByCategory(biomarkersForSex), [biomarkersForSex])

  const enteredCount = Object.values(evaluated).filter((r) => r.status !== 'insufficient').length

  // Legacy correlations for the Genetic Context sidebar — computed with
  // the legacy status vocabulary via the compat facade. Keeps the existing
  // Phase 2 preview (formal genome integration lands in Phase 2 proper).
  const legacyEvaluated = useMemo(() => {
    const out = {}
    const map = { in_target: 'optimal', borderline: 'caution', outside: 'flag', insufficient: 'unknown' }
    for (const [id, r] of Object.entries(evaluated)) {
      out[id] = { value: r.value, status: map[r.status] || 'unknown' }
    }
    return out
  }, [evaluated])
  const correlations = useMemo(
    () => deriveCorrelations({ status: legacyEvaluated, report }),
    [legacyEvaluated, report]
  )

  const setField = (id, v) => setValues((prev) => ({ ...prev, [id]: v }))

  const clearAll = () => {
    if (!confirm('Clear all biomarker entries? This cannot be undone.')) return
    clearBiomarkerValues()
    setValues({})
  }

  const scrollToBiomarker = (id) => {
    const el = document.getElementById(`bm-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />

      <div className="container pb-24 pt-24 md:pt-28">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <TestTube2 size={14} /> Biomarkers
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Your bloodwork, in context.
            </h1>
            <p className="mt-2 text-ss-muted">
              A schema-driven biomarker interpretation tool. Every range shown here is traceable
              to a source, labeled with a confidence tier, and framed as a discussion point —
              not a diagnosis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report && <RegenTools compact />}
            {enteredCount > 0 && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-xs font-semibold text-ss-muted transition hover:bg-ss-bg"
              >
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Trend + report toolbar (Phase 3) \u2014 Save snapshot, History, Print report.
            Everything is client-side; snapshots live only in localStorage. */}
        <div className="mt-4">
          <TrendControls values={values} context={context} sex={sex} />
        </div>

        {/* Educational disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
          <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-ss-amber" />
          <p className="text-sm text-ss-text">
            <span className="font-semibold">Educational, not medical advice.</span>{' '}
            {BIOMARKERS_DISCLAIMER}
          </p>
        </div>

        {/* Onboarding empty state — only when nothing entered */}
        {ready && enteredCount === 0 && (
          <div className="mt-6">
            <EmptyStateOnboarding />
          </div>
        )}

        {/* Sex toggle */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
          <span className="text-xs font-bold uppercase tracking-wider text-ss-teal">
            Biological sex
          </span>
          <div
            role="radiogroup"
            aria-label="Biological sex for biomarker reference ranges"
            className="inline-flex overflow-hidden rounded-full ring-1 ring-ss-border-warm"
          >
            <button
              type="button"
              role="radio"
              aria-checked={sex === 'male'}
              onClick={() => setSex('male')}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                sex === 'male' ? 'bg-ss-teal text-white' : 'bg-white text-ss-teal hover:bg-ss-bg'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={sex === 'female'}
              onClick={() => setSex('female')}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                sex === 'female' ? 'bg-ss-teal text-white' : 'bg-white text-ss-teal hover:bg-ss-bg'
              }`}
            >
              Female
            </button>
          </div>
          <span className="text-xs text-ss-muted">
            Adjusts testosterone, hemoglobin, ferritin &amp; SHBG reference ranges.
          </span>
        </div>

        {/* Optional draw-context chips (fasting / time / illness / training / cycle).
            Collapsed by default; expanded state is per-session. */}
        <div className="mt-4">
          <ContextPanel context={context} sex={sex} onChange={setContext} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr,320px]">
          {/* ============ MAIN COLUMN ============ */}
          <section>
            {/* Snapshot summary */}
            <PanelSummary evaluated={evaluated} total={biomarkersForSex.length} />

            {/* Cross-marker pattern detection (hidden when no clusters have
                enough entered data to evaluate). */}
            <PatternPanel evaluated={evaluated} onScrollToMarker={scrollToBiomarker} context={context} />

            {/* Category-grouped biomarker cards */}
            <div className="mt-8 space-y-10">
              {grouped.map(({ category, items }) => (
                <section key={category} id={`cat-${category}`}>
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h2 className="text-xl font-extrabold text-ss-teal md:text-2xl">
                      {CATEGORIES[category]?.label || category}
                    </h2>
                    <span className="text-xs text-ss-muted">
                      {items.length} marker{items.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="space-y-5">
                    {items.map((b) => (
                      <BiomarkerCard
                        key={b.id}
                        biomarker={b}
                        sex={sex}
                        value={values[b.id] ?? ''}
                        onChange={setField}
                        onScrollToRelated={scrollToBiomarker}
                        report={report}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Bottom disclaimer */}
            <div className="mt-12 rounded-2xl bg-white p-6 text-sm leading-relaxed text-ss-muted ring-1 ring-ss-border-warm/60">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ss-orange">
                Methodology
              </div>
              <p className="mt-2">
                Standard ranges are drawn from major-institution consensus (ADA, ATA, ACC/AHA, ESC,
                WHO, Endocrine Society). SelfScience target ranges are a synthesis of the evidence
                cited on each biomarker card and current editorial judgment. Confidence tiers are
                shown per marker; ranges labeled &quot;Contested&quot; or &quot;Emerging&quot; reflect meaningful
                expert disagreement.
              </p>
              <p className="mt-3">
                Nothing here is diagnostic. Interpretations are educational and should be reviewed
                with a qualified clinician who knows your history.
              </p>
            </div>
          </section>

          {/* ============ SIDEBAR ============ */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* NEW: schema-driven genome cross-reference (Phase 2b).
                Shows ~18 curated SNP\u2192biomarker matches with evidence tiers. */}
            <GenomeSidebar report={report} onScrollToMarker={scrollToBiomarker} />

            {/* Legacy correlations panel \u2014 hand-tuned narrative rules that
                combine biomarker status with genome haplotypes (kept here
                so nothing pre-existing regresses). */}
            {ready && report && correlations.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ss-teal">
                  Editorial context
                </h3>
                <ul className="mt-3 space-y-3">
                  {correlations.map((c) => (
                    <li key={c.id} className={`rounded-lg border-l-4 p-3 text-xs leading-relaxed text-ss-text ${
                      c.tone === 'priority'  ? 'border-l-ss-teal   bg-ss-teal/5' :
                      c.tone === 'awareness' ? 'border-l-ss-amber  bg-ss-amber/5' :
                                               'border-l-ss-muted  bg-ss-bg/40'
                    }`}>
                      <div className="mb-1 text-[11px] font-bold text-ss-teal">{c.title}</div>
                      <div>{c.body}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report && (
              <Link
                href="/genome"
                className="flex items-center justify-between rounded-2xl bg-ss-teal p-4 text-white transition hover:brightness-110"
              >
                <span className="text-sm font-semibold">See your full genome report</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
