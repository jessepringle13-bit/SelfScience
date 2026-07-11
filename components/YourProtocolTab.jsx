'use client'

// /app/components/YourProtocolTab.jsx
// SelfScience — "Your Protocol" tab. Renders three subsections
// (Priority Stack, Lifestyle Protocols, Awareness Flags) generated
// deterministically from the user's genome findings via the static
// SUPPLEMENT_PROTOCOL_MAP in lib/supplementProtocol.js.
//
// Compliance:
//   • Full disclaimer callout at top AND bottom (per spec).
//   • Every card cites a "Research basis" sentence.
//   • Awareness cards are framed as provider discussion points.
//   • No medical claims language anywhere.

import { useMemo } from 'react'
import { ShieldAlert, Pill, Sparkles, Flag, Info, ArrowRight } from 'lucide-react'
import {
  matchProtocolToUserVariants,
  PROTOCOL_DISCLAIMER,
  CATEGORY_META,
} from '@/lib/supplementProtocol'

const CATEGORY_ORDER = ['priority', 'lifestyle', 'awareness']

const CATEGORY_STYLES = {
  priority:  { icon: Pill,      accent: 'text-ss-teal',   dot: 'bg-ss-teal',   borderColor: '#1B474D' },
  lifestyle: { icon: Sparkles,  accent: 'text-ss-green',  dot: 'bg-ss-green',  borderColor: '#2E7D32' },
  awareness: { icon: Flag,      accent: 'text-ss-amber',  dot: 'bg-ss-amber',  borderColor: '#964219' },
}

export default function YourProtocolTab({ report }) {
  const groups = useMemo(() => matchProtocolToUserVariants(report), [report])
  const totalEntries =
    groups.priority.length + groups.lifestyle.length + groups.awareness.length
  const totalRecommendations = [...groups.priority, ...groups.lifestyle, ...groups.awareness]
    .reduce((sum, e) => sum + (e.recommendations?.length || 0), 0)

  return (
    <div className="space-y-8">
      {/* ==================================================================
          TOP DISCLAIMER — required by spec
         ================================================================== */}
      <DisclaimerCallout />

      {/* Intro copy */}
      <div className="rounded-2xl border border-ss-border-warm/60 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
            <Info size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-ss-teal">Your Protocol</h3>
            <p className="mt-1 text-sm text-ss-text">
              An educational, research-framed supplement and lifestyle protocol
              built from the variants recognized in your genome file. Every
              recommendation shows the specific gene, mechanism, and research
              basis behind it — so you can discuss the reasoning with your
              healthcare provider before acting on any of it.
            </p>
            <p className="mt-2 text-xs text-ss-muted">
              Matched <span className="font-semibold text-ss-text">{totalEntries}</span> variant-driven {totalEntries === 1 ? 'protocol' : 'protocols'} · <span className="font-semibold text-ss-text">{totalRecommendations}</span> individual {totalRecommendations === 1 ? 'recommendation' : 'recommendations'}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================
          THREE CATEGORY SECTIONS
         ================================================================== */}
      {CATEGORY_ORDER.map((key) => (
        <CategorySection
          key={key}
          categoryKey={key}
          entries={groups[key] || []}
        />
      ))}

      {/* ==================================================================
          BOTTOM DISCLAIMER — required by spec
         ================================================================== */}
      <DisclaimerCallout />
    </div>
  )
}

// ---------------------------------------------------------------------------

function CategorySection({ categoryKey, entries }) {
  const meta = CATEGORY_META[categoryKey]
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
          No {meta.label.toLowerCase()} recommendations matched your current results.
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

// ---------------------------------------------------------------------------

function ProtocolCard({ entry, categoryKey }) {
  const style = CATEGORY_STYLES[categoryKey]
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60"
      style={{ borderLeft: `4px solid ${style.borderColor}` }}
    >
      {/* Header: gene / genotype pattern + category dot */}
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
              <code key={r} className="rounded bg-ss-bg px-1.5 py-0.5 text-[10px] text-ss-muted">
                {r}
              </code>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 space-y-4">
        {entry.recommendations.map((rec, i) => (
          <RecommendationBlock key={`${entry.id}-${i}`} rec={rec} entry={entry} />
        ))}
      </div>

      {/* Per-entry disclaimer note */}
      {entry.disclaimerNote && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-ss-bg/70 p-3 text-xs text-ss-muted">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>{entry.disclaimerNote}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function RecommendationBlock({ rec, entry }) {
  return (
    <div className="rounded-xl bg-ss-bg/50 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-lg font-bold text-ss-text">{rec.name}</div>
        <span className="inline-flex items-center rounded-full border border-ss-teal/30 bg-ss-teal/5 px-2.5 py-0.5 text-[11px] font-semibold text-ss-teal">
          Research dose: {rec.dose}
        </span>
      </div>

      {/* Why (always visible on desktop, expandable on mobile via <details>) */}
      <div className="mt-3 space-y-3 text-sm">
        <WhyRow label="Variant" body={`${entry.gene} — ${entry.genotypePattern}`} />
        <WhyRow label="Mechanism" body={rec.mechanism} />
        <WhyRow label="Research basis" body={rec.researchBasis} />
        {rec.note && (
          <div className="rounded-lg bg-white p-3 text-xs text-ss-text ring-1 ring-ss-border-warm/40">
            <span className="font-semibold text-ss-orange">Note: </span>
            {rec.note}
          </div>
        )}
      </div>

      {/* Small educational footer per spec */}
      <div className="mt-3 text-[10px] uppercase tracking-wider text-ss-muted">
        Educational research context — not medical advice.
      </div>
    </div>
  )
}

function WhyRow({ label, body }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <div className="w-28 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wider text-ss-muted">
        {label}
      </div>
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ss-text">{body}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function DisclaimerCallout() {
  return (
    <div
      role="note"
      aria-label="Educational disclaimer"
      className="flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4"
    >
      <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-amber" />
      <p className="text-sm leading-relaxed text-ss-text">
        <span className="font-semibold">Educational disclaimer.</span>{' '}
        {PROTOCOL_DISCLAIMER}
      </p>
    </div>
  )
}
