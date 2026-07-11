'use client'

// /app/app/ancestry/ancestry-client.jsx
// SelfScience — Ancestry Report page.
//
// A blunt, educational ancestry composition estimate: for each of the user's
// classified variants that we have per-superpopulation data on, compute the
// Hardy–Weinberg genotype likelihood in each of AFR / AMR / EAS / EUR / SAS
// and multiply across variants (log-space) to get a posterior. Rendered as:
//
//   1. Stacked composition bar (five-segment)
//   2. Ranked population cards with share %
//   3. Per-variant contributions table (which variants pulled which way)
//   4. Blunt confidence + method disclaimer
//
// Zero backend calls — everything runs client-side from sessionStorage.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Compass,
  Globe2,
  Info,
  ShieldAlert,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import RegenTools from '@/components/RegenTools'
import { getGenomeResults } from '@/lib/genomeSession'
import { estimateAncestry } from '@/lib/ancestryEstimator'
import { formatPct, SUPERPOPULATIONS } from '@/lib/populationDetailFrequencies'

export default function AncestryClient() {
  const [report, setReport] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReport(getGenomeResults()); setReady(true)
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const estimate = useMemo(() => (report ? estimateAncestry(report) : null), [report])

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />

      <div className="container pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <Compass size={14} /> Ancestry Report
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              A rough sketch of where your variants come from.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              This is an <span className="font-semibold">educational estimate</span>, not a real ancestry
              service. We compare a small set of geographically stratified variants in your genome to five
              reference superpopulations and show which one they most resemble.
            </p>
          </div>
          {report && <RegenTools />}
        </div>

        {/* Persistent top disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
          <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-amber" />
          <p className="text-sm leading-relaxed text-ss-text">
            <span className="font-semibold">Not a substitute for actual ancestry testing.</span>{' '}
            Commercial ancestry services analyse hundreds of thousands of SNPs, IBD segments and PCA
            against curated reference panels. This page uses at most a few dozen well-known variants —
            treat the output as directional, not identity.
          </p>
        </div>

        {/* Empty state — no genome */}
        {ready && !report && (
          <div className="mt-8 rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-8 text-center">
            <p className="text-sm text-ss-muted">
              Upload your genome to see a rough ancestry estimate.
            </p>
            <Link
              href="/genome"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Upload genome <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Empty state — genome but no informative variants */}
        {ready && report && !estimate && (
          <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-ss-border-warm/60">
            <p className="text-sm text-ss-text">
              None of your recognized variants have per-population frequency data in our table yet.
              As we expand the table, this view will populate automatically — nothing to change on
              your end.
            </p>
          </div>
        )}

        {estimate && (
          <>
            {/* Summary strip */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Closest superpopulation"
                value={
                  <span style={{ color: estimate.ranking[0].meta.color }}>
                    {estimate.ranking[0].meta.name}
                  </span>
                }
                sub={`${formatPct(estimate.ranking[0].share)} of the posterior`}
              />
              <StatCard
                label="Variants used"
                value={estimate.variantCount}
                sub={`${estimate.informativeCount} carried informative signal`}
              />
              <StatCard
                label="Confidence"
                value={estimate.confidence.label}
                sub={estimate.confidence.blurb}
                tone={estimate.confidence.level}
              />
            </div>

            {/* Composition bar */}
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
              <h2 className="text-lg font-bold text-ss-text">Composition estimate</h2>
              <p className="mt-1 text-xs text-ss-muted">
                Posterior probability that your genome was drawn from each reference superpopulation,
                under a uniform prior. Percentages sum to 100.
              </p>

              {/* Stacked bar */}
              <div
                className="mt-4 flex h-10 w-full overflow-hidden rounded-full ring-1 ring-ss-border-warm/60"
                aria-label="Ancestry composition bar"
              >
                {estimate.ranking.map((r) => (
                  <div
                    key={r.code}
                    className="flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      width: `${Math.max(0.3, r.share * 100)}%`,
                      backgroundColor: r.meta.color,
                      minWidth: r.share > 0.03 ? undefined : '2px',
                    }}
                    title={`${r.meta.name}: ${formatPct(r.share)}`}
                  >
                    {r.share >= 0.06 ? formatPct(r.share) : ''}
                  </div>
                ))}
              </div>

              {/* Ranked cards */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {estimate.ranking.map((r, i) => (
                  <RankedPopCard key={r.code} rank={i + 1} row={r} />
                ))}
              </div>
            </div>

            {/* Contributions table */}
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
              <h2 className="text-lg font-bold text-ss-text">Which variants said what</h2>
              <p className="mt-1 text-xs text-ss-muted">
                For each of your variants, the population that would most commonly carry your exact
                genotype. Variants marked <span className="font-semibold">informative</span> vary
                meaningfully across populations; the rest cancel out on the composition bar.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ss-border-warm/60 text-[11px] uppercase tracking-wider text-ss-muted">
                      <th className="py-2 pr-3 font-semibold">Variant</th>
                      <th className="py-2 pr-3 font-semibold">Genotype</th>
                      <th className="py-2 pr-3 font-semibold">Best-fit population</th>
                      <th className="py-2 pr-3 text-right font-semibold">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.contributions.map((c) => {
                      const pop = SUPERPOPULATIONS.find((p) => p.code === c.topPopulation)
                      return (
                        <tr key={c.rsid} className="border-b border-ss-border-warm/30 last:border-0">
                          <td className="py-2 pr-3">
                            <div className="font-bold text-ss-teal">{c.gene || c.rsid}</div>
                            <div className="text-[10px] text-ss-muted">{c.rsid}</div>
                          </td>
                          <td className="py-2 pr-3">
                            <span className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{c.genotype}</span>
                          </td>
                          <td className="py-2 pr-3">
                            {pop && (
                              <span className="font-semibold" style={{ color: pop.color }}>
                                {pop.name}
                              </span>
                            )}
                            <div className="text-[10px] text-ss-muted">
                              {formatPct(c.perPopulation[c.topPopulation])} of {pop?.code} carry this genotype
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {c.informative ? (
                              <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-teal">
                                Informative
                              </span>
                            ) : (
                              <span className="text-[10px] text-ss-muted">Neutral</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Method note */}
            <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-ss-border-warm/60">
              <h3 className="text-sm font-bold text-ss-teal">How this is calculated</h3>
              <ul className="mt-3 space-y-2 text-sm text-ss-text">
                <li className="flex items-start gap-2">
                  <Info size={13} className="mt-0.5 flex-shrink-0 text-ss-muted" />
                  <span>
                    For each of your variants we look up the allele frequency in five reference
                    superpopulations (1000 Genomes / gnomAD).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Info size={13} className="mt-0.5 flex-shrink-0 text-ss-muted" />
                  <span>
                    Using Hardy–Weinberg, we compute the probability of seeing your exact genotype in
                    each population, then multiply across variants (log-space) to get a joint likelihood.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Info size={13} className="mt-0.5 flex-shrink-0 text-ss-muted" />
                  <span>
                    Assuming a uniform prior across the five populations, we normalise those likelihoods
                    into the percentages you see on the bar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Info size={13} className="mt-0.5 flex-shrink-0 text-ss-muted" />
                  <span>
                    Populations that share very similar frequencies (e.g. EUR vs SAS for many variants)
                    are naturally hard to distinguish with this method — expect a diffuse posterior.
                  </span>
                </li>
              </ul>
            </div>

            {/* Bottom disclaimer */}
            <div className="mt-10 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
              <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-amber" />
              <p className="text-sm leading-relaxed text-ss-text">
                <span className="font-semibold">This is not identity.</span> Ancestry is complex, admixed,
                and cannot be reduced to five buckets. This page is a maths sketch on a handful of
                well-known SNPs — it may be off, and being &ldquo;typical&rdquo; or &ldquo;atypical&rdquo; for a
                reference cohort carries no value judgment.
              </p>
            </div>

            {/* Cross-link to Population Compare */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
                  <Globe2 size={16} />
                </span>
                <div>
                  <div className="text-sm font-bold text-ss-teal">Want more detail per variant?</div>
                  <div className="text-xs text-ss-muted">Population Compare shows each variant across all 5 populations side-by-side.</div>
                </div>
              </div>
              <Link
                href="/population-compare"
                className="inline-flex items-center gap-1 rounded-full border-2 border-ss-teal px-4 py-2 text-xs font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
              >
                Open Population Compare <ArrowRight size={12} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function StatCard({ label, value, sub, tone }) {
  const toneClass =
    tone === 'moderate' ? 'text-ss-teal'
      : tone === 'low' ? 'text-ss-amber'
      : tone === 'very-low' ? 'text-ss-orange'
      : 'text-ss-teal'
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">{label}</div>
      <div className={`mt-1 text-lg font-extrabold ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-ss-muted">{sub}</div>}
    </div>
  )
}

function RankedPopCard({ rank, row }) {
  return (
    <div
      className="rounded-xl bg-white p-4 ring-1 ring-ss-border-warm/60"
      style={{ borderTop: `3px solid ${row.meta.color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ss-muted">
          #{rank}
        </span>
        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: row.meta.color }}>
          {row.meta.code}
        </span>
      </div>
      <div className="mt-2 text-sm font-bold" style={{ color: row.meta.color }}>
        {row.meta.name}
      </div>
      <div className="mt-1 text-[11px] text-ss-muted">{row.meta.blurb}</div>
      <div className="mt-3 text-2xl font-extrabold text-ss-text">
        {formatPct(row.share)}
      </div>
    </div>
  )
}
