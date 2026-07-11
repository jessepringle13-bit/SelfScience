'use client'

// /app/app/training/training-client.jsx
// SelfScience — Training Protocol tab (variant-driven training style,
// cardio/metabolic, and recovery/connective-tissue guidance).
//
// Reads genome report from sessionStorage and matches against the static
// TRAINING_PROTOCOL_MAP. Renders three category sections with the same
// visual conventions as YourProtocolTab, plus top+bottom disclaimer
// callouts.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, Dumbbell, HeartPulse, ShieldCheck, Info, ArrowRight, Loader2 } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { getGenomeResults } from '@/lib/genomeSession'
import {
  matchTrainingToUserVariants,
  TRAINING_DISCLAIMER,
  TRAINING_CATEGORY_META,
} from '@/lib/trainingProtocol'

const CATEGORY_ORDER = ['style', 'cardio', 'recovery']
const CATEGORY_STYLES = {
  style:    { icon: Dumbbell,    accent: 'text-ss-teal',  dot: 'bg-ss-teal',  borderColor: '#1B474D' },
  cardio:   { icon: HeartPulse,  accent: 'text-ss-green', dot: 'bg-ss-green', borderColor: '#2E7D32' },
  recovery: { icon: ShieldCheck, accent: 'text-ss-amber', dot: 'bg-ss-amber', borderColor: '#964219' },
}

export default function TrainingClient() {
  const [report, setReport] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReport(getGenomeResults())
    setReady(true)
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const groups = useMemo(() => matchTrainingToUserVariants(report), [report])
  const totalEntries = groups.style.length + groups.cardio.length + groups.recovery.length
  const totalRecs = [...groups.style, ...groups.cardio, ...groups.recovery]
    .reduce((s, e) => s + (e.recommendations?.length || 0), 0)

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />

      <div className="container pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <Dumbbell size={14} /> Training Protocol
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Train with your genome, not against it.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              A research-framed training emphasis — style, cardio adaptation, and
              recovery cadence — built from your variant findings.
            </p>
          </div>
          <Link
            href="/genome"
            className="inline-flex items-center gap-2 rounded-full border-2 border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
          >
            See genome findings <ArrowRight size={13} />
          </Link>
        </div>

        {/* Top disclaimer */}
        <div className="mt-8">
          <DisclaimerCallout />
        </div>

        {/* Intro card */}
        <div className="mt-6 rounded-2xl border border-ss-border-warm/60 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
              <Info size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-ss-teal">Your Training Emphasis</h3>
              <p className="mt-1 text-sm text-ss-text">
                Grouped into three areas: what your variants suggest as your primary
                training style, how your aerobic system adapts, and what your
                connective-tissue variants imply for recovery cadence and injury
                prevention. Every recommendation shows the specific research basis.
              </p>
              {ready && (
                <p className="mt-2 text-xs text-ss-muted">
                  Matched <span className="font-semibold text-ss-text">{totalEntries}</span> variant-driven {totalEntries === 1 ? 'protocol' : 'protocols'} · <span className="font-semibold text-ss-text">{totalRecs}</span> individual {totalRecs === 1 ? 'recommendation' : 'recommendations'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* No genome state */}
        {ready && !report && (
          <div className="mt-8 rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-8 text-center">
            <p className="text-sm text-ss-muted">
              Upload your genome to see a training protocol tailored to your variants.
            </p>
            <Link
              href="/genome"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Upload genome <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* No report loaded yet */}
        {!ready && (
          <div className="mt-8 flex items-center gap-2 text-sm text-ss-muted">
            <Loader2 size={14} className="animate-spin" /> Loading your protocol…
          </div>
        )}

        {/* Category sections */}
        {ready && report && (
          <div className="mt-8 space-y-10">
            {CATEGORY_ORDER.map((key) => (
              <CategorySection key={key} categoryKey={key} entries={groups[key] || []} />
            ))}
            <DisclaimerCallout />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function CategorySection({ categoryKey, entries }) {
  const meta = TRAINING_CATEGORY_META[categoryKey]
  const style = CATEGORY_STYLES[categoryKey]
  const Icon = style.icon
  return (
    <section>
      <header className="mb-4 flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-ss-border-warm/60 ${style.accent}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ss-text">{meta.label}</h2>
          <p className="mt-0.5 text-xs text-ss-muted">{meta.subtitle}</p>
        </div>
      </header>
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-6 text-center text-sm text-ss-muted">
          No {meta.label.toLowerCase()} recommendations matched your genome yet.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <ProtocolCard key={entry.id} entry={entry} categoryKey={categoryKey} />
          ))}
        </div>
      )}
    </section>
  )
}

function ProtocolCard({ entry, categoryKey }) {
  const style = CATEGORY_STYLES[categoryKey]
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60"
      style={{ borderLeft: `4px solid ${style.borderColor}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
            <span className="text-sm font-semibold text-ss-teal">{entry.gene}</span>
            <span className="text-xs text-ss-muted">·</span>
            <span className="text-xs text-ss-muted">{entry.genotypePattern}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.rsids.map((r) => (
              <code key={r} className="rounded bg-ss-bg px-1.5 py-0.5 text-[10px] text-ss-muted">{r}</code>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {entry.recommendations.map((rec, i) => (
          <RecommendationBlock key={`${entry.id}-${i}`} rec={rec} entry={entry} />
        ))}
      </div>

      {entry.disclaimerNote && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-ss-bg/70 p-3 text-xs text-ss-muted">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>{entry.disclaimerNote}</span>
        </div>
      )}
    </div>
  )
}

function RecommendationBlock({ rec, entry }) {
  return (
    <div className="rounded-xl bg-ss-bg/50 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-lg font-bold text-ss-text">{rec.name}</div>
        <span className="inline-flex items-center rounded-full border border-ss-teal/30 bg-ss-teal/5 px-2.5 py-0.5 text-[11px] font-semibold text-ss-teal">
          {rec.dose}
        </span>
      </div>
      <div className="mt-3 space-y-3 text-sm">
        <Row label="Variant"        body={`${entry.gene} — ${entry.genotypePattern}`} />
        <Row label="Mechanism"      body={rec.mechanism} />
        <Row label="Research basis" body={rec.researchBasis} />
        {rec.note && (
          <div className="rounded-lg bg-white p-3 text-xs text-ss-text ring-1 ring-ss-border-warm/40">
            <span className="font-semibold text-ss-orange">Note: </span>
            {rec.note}
          </div>
        )}
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-wider text-ss-muted">
        Educational research context — not a training prescription.
      </div>
    </div>
  )
}

function Row({ label, body }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <div className="w-28 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wider text-ss-muted">{label}</div>
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ss-text">{body}</div>
    </div>
  )
}

function DisclaimerCallout() {
  return (
    <div role="note" aria-label="Educational disclaimer"
      className="flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
      <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-amber" />
      <p className="text-sm leading-relaxed text-ss-text">
        <span className="font-semibold">Educational disclaimer.</span>{' '}
        {TRAINING_DISCLAIMER}
      </p>
    </div>
  )
}
