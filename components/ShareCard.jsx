'use client'

// /app/components/ShareCard.jsx
// Presentational-only share card. Renders at a fixed 1080x1350 (portrait —
// good for Instagram / mobile share sheets) inside a parent that scales it
// via CSS transform for on-screen preview. html2canvas rasterizes the actual
// 1080x1350 node so the export is always crisp regardless of preview size.
//
// Uses only the app's `ss-*` brand tokens (matching the spec hex values):
//   Primary  #1B474D  -> bg-ss-teal / text-ss-teal
//   Accent   #C45820  -> bg-ss-orange / text-ss-orange
//   BG       #F7F6F2  -> bg-ss-bg
//   Text     #28251D  -> text-ss-text
//   Muted    #7A7974  -> text-ss-muted
//   Border   #D4D1CA  -> border-ss-border-warm
//   Success  #2E7D32  -> bg-ss-green / text-ss-green
//   Warning  #964219  -> bg-ss-amber / text-ss-amber

import { forwardRef } from 'react'

const PILLAR_COLORS = {
  aware:   'bg-ss-amber',
  benefit: 'bg-ss-green',
  neutral: 'bg-ss-border-warm',
}

function FindingRow({ tone, gene, label }) {
  const dotClass = tone === 'aware' ? 'bg-ss-amber' : 'bg-ss-green'
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ss-border-warm/70 bg-white px-6 py-5">
      <span className={`inline-block h-4 w-4 flex-shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-extrabold leading-tight text-ss-text">{gene}</div>
        {/* Note: avoid Tailwind's `truncate` here — html2canvas clips descenders
            (g, p, y) in some browsers when `overflow: hidden` is combined
            with tight line-heights. Labels are already length-capped to ~42
            chars in shortLabel(), so a plain nowrap is sufficient. */}
        <div
          className="mt-2 whitespace-nowrap text-lg text-ss-muted"
          style={{ lineHeight: '1.6', paddingBottom: 4 }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

const ShareCard = forwardRef(function ShareCard({ genomeResults }, ref) {
  const beAware  = (genomeResults?.beAware  || []).slice(0, 3)
  const benefits = (genomeResults?.benefits || []).slice(0, 3)
  const pillars  = (genomeResults?.pillars  || []).slice(0, 9)

  return (
    <div
      ref={ref}
      // Fixed export size — CSS transform in the parent scales for preview.
      // Explicit width/height in inline style so html2canvas captures 1080x1350.
      style={{ width: 1080, height: 1350 }}
      className="relative overflow-hidden bg-ss-bg"
    >
      {/* Corner accent — deep teal band on the left */}
      <div className="absolute inset-y-0 left-0 w-2 bg-ss-teal" aria-hidden="true" />

      <div className="flex h-full flex-col p-14">
        {/* Header — logo + wordmark */}
        <div className="flex items-center gap-3">
          {/* Simple DNA-helix inline mark */}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ss-teal text-white">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 4c4 4 8 4 12 0" />
              <path d="M6 20c4-4 8-4 12 0" />
              <path d="M6 8c4 4 8 4 12 0" />
              <path d="M6 16c4-4 8-4 12 0" />
            </svg>
          </div>
          <div className="text-3xl font-bold tracking-tight text-ss-teal">SelfScience</div>
        </div>

        {/* Heading */}
        <h1 className="mt-10 text-6xl font-black leading-tight text-ss-text">My Genome Profile</h1>
        <p className="mt-3 text-xl text-ss-muted">Top findings from my personal research report.</p>

        {/* Be Aware section */}
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full bg-ss-amber" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-ss-amber">Top Be Aware Findings</h2>
          </div>
          <div className="mt-4 space-y-3">
            {beAware.length === 0 && (
              <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white px-6 py-4 text-lg text-ss-muted">
                No awareness findings — every recognized variant is in favorable or neutral range.
              </div>
            )}
            {beAware.map((f, i) => (
              <FindingRow key={`aware-${f.rsid || i}`} tone="aware" gene={f.gene} label={f.label} />
            ))}
          </div>
        </section>

        {/* Benefit section */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full bg-ss-green" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-ss-green">Top Strengths</h2>
          </div>
          <div className="mt-4 space-y-3">
            {benefits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white px-6 py-4 text-lg text-ss-muted">
                No positive findings surfaced yet — explore your full report to see all recognized variants.
              </div>
            )}
            {benefits.map((f, i) => (
              <FindingRow key={`benefit-${f.rsid || i}`} tone="benefit" gene={f.gene} label={f.label} />
            ))}
          </div>
        </section>

        {/* Pillar breakdown bar */}
        <section className="mt-auto pt-10">
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-ss-muted">
            Pillar Overview
          </div>
          <div className="flex h-6 w-full overflow-hidden rounded-full ring-1 ring-ss-border-warm">
            {pillars.length === 0 && <div className="flex-1 bg-ss-border-warm" />}
            {pillars.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className={`h-full flex-1 ${PILLAR_COLORS[p.status] || PILLAR_COLORS.neutral}`}
                title={`${p.name}: ${p.status}`}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-6 text-base text-ss-muted">
            <LegendDot color="bg-ss-green"  label="Benefit" />
            <LegendDot color="bg-ss-amber"  label="Be Aware" />
            <LegendDot color="bg-ss-border-warm" label="Neutral" />
          </div>
        </section>

        {/* Footer watermark */}
        <div className="mt-8 border-t border-ss-border-warm pt-6 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.35em] text-ss-muted">selfscience.io</div>
        </div>
      </div>
    </div>
  )
})

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${color}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export default ShareCard
