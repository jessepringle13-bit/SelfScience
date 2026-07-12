'use client'

// /app/app/biomarkers/biomarkers-client.jsx
// SelfScience — Lab Biomarker Panel.
// 17-field bloodwork form with per-field reference ranges shown
// BEFORE typing, live status dots after typing, a status overview card,
// and a Genetic Context panel powered by biomarker × genome correlations.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, Trash2, ArrowRight, TestTube2, Loader2 } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import RegenTools from '@/components/RegenTools'
import {
  BIOMARKERS,
  STATUS_META,
  evaluateAllBiomarkers,
  BIOMARKERS_DISCLAIMER,
  getBiomarkersForSex,
} from '@/lib/biomarkers'
import { deriveCorrelations } from '@/lib/biomarkerCorrelations'
import { getBiomarkerValues, saveBiomarkerValues, clearBiomarkerValues } from '@/lib/biomarkersSession'
import { getGenomeResults, hasGenomeResults } from '@/lib/genomeSession'

const SEX_STORAGE_KEY = 'selfscience_biomarker_sex'

export default function BiomarkersClient() {
  const [values, setValues] = useState({})
  const [ready, setReady] = useState(false)
  const [report, setReport] = useState(null)
  // Biological sex controls reference ranges for testosterone (total &
  // free), hemoglobin, ferritin, and SHBG. Default male; persisted to
  // localStorage so it survives across visits.
  const [sex, setSex] = useState('male')

  // Hydrate localStorage (biomarker values + sex) + sessionStorage (genome) on mount.
  useEffect(() => {
    setValues(getBiomarkerValues())
    setReport(getGenomeResults())
    try {
      const stored = localStorage.getItem(SEX_STORAGE_KEY)
      if (stored === 'female' || stored === 'male') setSex(stored)
    } catch { /* storage disabled */ }
    setReady(true)
    const onGenomeChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onGenomeChange)
    return () => window.removeEventListener('selfscience:genome-changed', onGenomeChange)
  }, [])

  // Persist sex selection so subsequent visits keep the same reference ranges.
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(SEX_STORAGE_KEY, sex) } catch { /* noop */ }
  }, [sex, ready])

  // Persist to localStorage on every change (with a tiny debounce).
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => saveBiomarkerValues(values), 250)
    return () => clearTimeout(t)
  }, [values, ready])

  const biomarkersForSex = useMemo(() => getBiomarkersForSex(sex), [sex])
  const evaluated = useMemo(() => evaluateAllBiomarkers(values, sex), [values, sex])
  const summary = useMemo(() => {
    const c = { optimal: 0, caution: 0, flag: 0, unknown: 0 }
    for (const b of biomarkersForSex) c[evaluated[b.id].status]++
    const filled = biomarkersForSex.length - c.unknown
    return { ...c, filled, total: biomarkersForSex.length }
  }, [evaluated, biomarkersForSex])

  const correlations = useMemo(
    () => deriveCorrelations({ status: evaluated, report }),
    [evaluated, report]
  )

  const setField = (id, v) => setValues((prev) => ({ ...prev, [id]: v }))
  const clearAll = () => {
    if (!confirm('Clear all biomarker entries? This cannot be undone.')) return
    clearBiomarkerValues()
    setValues({})
  }

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />

      <div className="container pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <TestTube2 size={14} /> Biomarkers
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Your lab panel, in context.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              Enter recent bloodwork to see how each value compares against research-informed
              targets, and how it connects to your genome findings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report && <RegenTools compact />}
            {summary.filled > 0 && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-xs font-semibold text-ss-muted transition hover:bg-ss-bg"
              >
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Top disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
          <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-ss-amber" />
          <p className="text-sm text-ss-text">
            <span className="font-semibold">Educational only.</span>{' '}
            {BIOMARKERS_DISCLAIMER}
          </p>
        </div>

        {/* Biological sex toggle — controls reference ranges for
            testosterone (total & free), hemoglobin, ferritin, and SHBG.
            Persisted to localStorage so it sticks across visits. */}
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
                sex === 'male'
                  ? 'bg-ss-teal text-white'
                  : 'bg-white text-ss-teal hover:bg-ss-bg'
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
                sex === 'female'
                  ? 'bg-ss-teal text-white'
                  : 'bg-white text-ss-teal hover:bg-ss-bg'
              }`}
            >
              Female
            </button>
          </div>
          <span className="text-xs text-ss-muted">
            Adjusts testosterone, hemoglobin, ferritin &amp; SHBG reference ranges.
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr,360px]">
          {/* ================= FORM ================= */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ss-text">Your Bloodwork</h2>
              <div className="text-xs text-ss-muted">
                {summary.filled} of {summary.total} filled
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {biomarkersForSex.map((b) => (
                <BiomarkerField
                  key={b.id}
                  field={b}
                  value={values[b.id] ?? ''}
                  onChange={(v) => setField(b.id, v)}
                  status={evaluated[b.id].status}
                />
              ))}
            </div>
          </section>

          {/* ================= SIDE PANEL ================= */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Status Overview */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ss-teal">Status Overview</h3>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <StatusStat count={summary.optimal} tone="optimal" />
                <StatusStat count={summary.caution} tone="caution" />
                <StatusStat count={summary.flag}    tone="flag" />
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-wider text-ss-muted text-center">
                From {summary.filled} entered {summary.filled === 1 ? 'biomarker' : 'biomarkers'}
              </div>
            </div>

            {/* Genetic Context */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ss-teal">Genetic Context</h3>
                {report && (
                  <span className="inline-flex items-center rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
                    Linked to genome
                  </span>
                )}
              </div>

              {!ready ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-ss-muted">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </div>
              ) : !report ? (
                <div className="mt-4 rounded-lg bg-ss-bg p-3 text-xs text-ss-muted">
                  Upload your genome to unlock biomarker × gene correlations tailored to your variants.
                  <div className="mt-2">
                    <Link href="/genome" className="inline-flex items-center gap-1 font-semibold text-ss-teal hover:underline">
                      Upload genome <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              ) : correlations.length === 0 ? (
                <p className="mt-4 text-xs text-ss-muted">
                  No specific correlations triggered yet — fill in more biomarkers or your
                  genome findings may not match the current correlation rules.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {correlations.map((c) => (
                    <CorrelationCard key={c.id} c={c} />
                  ))}
                </ul>
              )}
            </div>

            {/* Genome shortcut */}
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

// ---------------------------------------------------------------------------

function BiomarkerField({ field, value, onChange, status }) {
  const meta = STATUS_META[status]
  const filled = value !== ''
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-sm font-semibold text-ss-text">
        {field.label}
        {field.secondaryLabel && (
          <span className="rounded-full bg-ss-bg px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-ss-muted">
            {field.secondaryLabel}
          </span>
        )}
      </span>
      {/* Reference note shown BEFORE typing */}
      <span className="text-[11px] text-ss-muted">{field.optimal}</span>
      <div className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 ring-1 ring-transparent transition ${
        filled && status !== 'unknown' ? `${meta.ring} ring-2 border-transparent` : 'border-ss-border-warm'
      }`}>
        <input
          type="number"
          inputMode="decimal"
          step={field.step ?? 0.1}
          min={field.min}
          max={field.max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ss-text placeholder:text-ss-muted focus:outline-none"
          aria-label={field.label}
        />
        <span className="text-xs text-ss-muted">{field.unit}</span>
        {filled && status !== 'unknown' && (
          <span title={meta.label} className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${meta.dot}`} aria-label={`Status: ${meta.label}`} />
        )}
      </div>
    </label>
  )
}

function StatusStat({ count, tone }) {
  const meta = STATUS_META[tone]
  return (
    <div className={`rounded-xl px-2 py-3 ${meta.chip}`}>
      <div className="text-2xl font-extrabold leading-none">{count}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider">{meta.label}</div>
    </div>
  )
}

function CorrelationCard({ c }) {
  const toneClass =
    c.tone === 'priority'  ? 'border-l-ss-teal   bg-ss-teal/5' :
    c.tone === 'awareness' ? 'border-l-ss-amber  bg-ss-amber/5' :
                             'border-l-ss-muted  bg-ss-bg/40'
  return (
    <li className={`rounded-lg border-l-4 p-3 text-xs leading-relaxed text-ss-text ${toneClass}`}>
      <div className="mb-1 text-[11px] font-bold text-ss-teal">{c.title}</div>
      <div>{c.body}</div>
    </li>
  )
}
