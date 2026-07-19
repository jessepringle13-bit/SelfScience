'use client'

// /app/app/population-compare/population-compare-client.jsx
// SelfScience — Population Compare page.
//
// Reads the user's genome analysis from sessionStorage and visualises how
// each of their variants compares to five global superpopulations
// (AFR / AMR / EAS / EUR / SAS). Three linked views:
//   1. Highlights — most globally rare + most population-skewed variants
//   2. Bar Chart  — per-variant bars of the user's genotype frequency
//                   across each superpopulation
//   3. Heatmap    — compact grid: rows = variants, cols = populations
//
// Nothing here talks to the network — everything is derived locally from
// existing sessionStorage results + the static population data table.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Globe2,
  ArrowRight,
  Info,
  ShieldAlert,
  BarChart3,
  LayoutGrid,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { getGenomeResults } from '@/lib/genomeSession'
import { collectRawGenotypeRows } from '@/lib/genomeCards'
import {
  computeGenotypeStats,
  formatPct,
  SUPERPOPULATIONS,
  POP_CODES,
  getPopulationDetail,
} from '@/lib/populationDetailFrequencies'
import RegenTools from '@/components/RegenTools'
import DashboardBackLink from '@/components/DashboardBackLink'

const VIEWS = [
  { key: 'highlights', label: 'Highlights', Icon: Sparkles },
  { key: 'bars',       label: 'Bar Chart',  Icon: BarChart3 },
  { key: 'heatmap',    label: 'Heatmap',    Icon: LayoutGrid },
]

export default function PopulationCompareClient() {
  const [report, setReport] = useState(null)
  const [ready, setReady] = useState(false)
  const [view, setView] = useState('highlights')

  useEffect(() => {
    setReport(getGenomeResults()); setReady(true)
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  // Build the analysed variant set once. We iterate the RAW parsed genome
  // (report._variants) instead of the classified card list because some
  // haplotype cards (COMT, APOE, MTHFR, …) rewrite `genotype` as a status
  // string like "val_val" — which would nonsensically be interpreted as
  // "AA" once non-ACGT chars were stripped. Cards give us display metadata
  // only; raw calls come from _variants.
  const rows = useMemo(() => {
    if (!report) return []
    const rawRows = collectRawGenotypeRows(report)
    const out = []
    for (const r of rawRows) {
      const stats = computeGenotypeStats(r.rsid, r.rawGenotype)
      if (!stats) continue
      const detail = getPopulationDetail(r.rsid)
      out.push({
        rsid: r.rsid,
        gene: r.gene,
        trait: r.trait,
        pillar: r.pillar,
        classification: r.classification,
        genotype: stats.genotype,
        copies: stats.copies,
        zygosity: stats.zygosity,
        altAllele: stats.altAllele,
        refAllele: stats.refAllele,
        perPopulation: stats.perPopulation,
        globalGenotypeFreq: stats.globalGenotypeFreq,
        rarity: stats.rarity,
        mostCommon: stats.mostCommon,
        leastCommon: stats.leastCommon,
        alleleFreqByPop: detail.populations,
      })
    }
    return out
  }, [report])

  // Skew score = max(pop freq) - min(pop freq) of the user's genotype. Bigger
  // = more geographically stratified.
  const rowsBySkew = useMemo(() => {
    return [...rows].sort((a, b) => {
      const skewA = geoSkew(a.perPopulation)
      const skewB = geoSkew(b.perPopulation)
      return skewB - skewA
    })
  }, [rows])

  const rowsByRarity = useMemo(() => {
    return [...rows].sort((a, b) => b.rarity - a.rarity)
  }, [rows])

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />
      <DashboardBackLink className="container pt-20 md:pt-24 -mb-4" />

      <div className="container pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <Globe2 size={14} /> Population Compare
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              How your variants compare to the world.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              For each of your variants that we have global data on, see how common your
              genotype is across the five 1000 Genomes superpopulations —
              African, Latino / Admixed, East Asian, European, and South Asian.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PopulationLegend />
            {report && <RegenTools />}
          </div>
        </div>

        {/* Empty state — no genome */}
        {ready && !report && (
          <div className="mt-8 rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-8 text-center">
            <p className="text-sm text-ss-muted">
              Upload your genome to see how your variants compare across global populations.
            </p>
            <Link
              href="/genome"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Upload genome <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Empty state — genome loaded but no rows */}
        {ready && report && rows.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-ss-border-warm/60">
            <p className="text-sm text-ss-text">
              None of your recognized variants have detailed per-population frequency data
              in our table yet. As we add more variants this view will populate automatically —
              nothing to change on your end.
            </p>
          </div>
        )}

        {ready && report && rows.length > 0 && (
          <>
            {/* Summary strip */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Variants compared"
                value={rows.length}
                sub="Recognized SNPs with population data"
              />
              <StatCard
                label="Rarest genotype"
                value={rowsByRarity[0]?.gene || rowsByRarity[0]?.rsid || '—'}
                sub={rowsByRarity[0]
                  ? `Rarer than ${formatPct(rowsByRarity[0].rarity)} of people globally`
                  : ''}
              />
              <StatCard
                label="Most population-skewed"
                value={rowsBySkew[0]?.gene || rowsBySkew[0]?.rsid || '—'}
                sub={rowsBySkew[0]
                  ? `Ranges ${formatPct(minVal(rowsBySkew[0].perPopulation))} → ${formatPct(maxVal(rowsBySkew[0].perPopulation))} across pops`
                  : ''}
              />
            </div>

            {/* View switcher */}
            <div className="mt-8 inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-ss-border-warm/60">
              {VIEWS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    view === key
                      ? 'bg-ss-teal text-white shadow-sm'
                      : 'text-ss-muted hover:text-ss-teal'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {view === 'highlights' && <HighlightsView rowsByRarity={rowsByRarity} rowsBySkew={rowsBySkew} />}
            {view === 'bars' && <BarsView rows={rowsBySkew} />}
            {view === 'heatmap' && <HeatmapView rows={rowsBySkew} />}

            {/* Bottom disclaimer */}
            <div className="mt-10 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
              <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-ss-amber" />
              <p className="text-sm leading-relaxed text-ss-text">
                <span className="font-semibold">Population data is aggregate.</span> These
                frequencies come from public 1000 Genomes / gnomAD cohorts and describe group
                averages — they don&apos;t predict individual ancestry, health outcomes, or
                behavior. Being &ldquo;typical&rdquo; or &ldquo;rare&rdquo; for a variant carries no value judgment.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

function HighlightsView({ rowsByRarity, rowsBySkew }) {
  const rareTop = rowsByRarity.slice(0, 6)
  const skewTop = rowsBySkew.slice(0, 6)
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="text-lg font-bold text-ss-text">🌍 Your rarest genotypes</h2>
        <p className="mt-1 text-xs text-ss-muted">
          Genotypes that are least common globally — carried by fewer people worldwide.
        </p>
        <div className="mt-4 space-y-3">
          {rareTop.map((r) => (
            <RarityCard key={r.rsid} row={r} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-ss-text">🧭 Most population-skewed</h2>
        <p className="mt-1 text-xs text-ss-muted">
          Genotypes with the biggest gap between the most-common and least-common
          populations — a signal of geographic stratification.
        </p>
        <div className="mt-4 space-y-3">
          {skewTop.map((r) => (
            <SkewCard key={r.rsid} row={r} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RarityCard({ row }) {
  const popMeta = SUPERPOPULATIONS.find((p) => p.code === row.mostCommon)
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-ss-border-warm/60">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <span className="text-sm font-bold text-ss-teal">{row.gene || row.rsid}</span>
          <span className="ml-2 text-xs text-ss-muted">{row.trait}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ss-orange">
          Rarer than {formatPct(row.rarity)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ss-muted">
        <code className="rounded bg-ss-bg px-1.5 py-0.5 font-mono">{row.rsid}</code>
        <span className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{row.genotype}</span>
        <ZygosityBadge z={row.zygosity} />
        {popMeta && (
          <span>
            Most common in{' '}
            <span className="font-semibold" style={{ color: popMeta.color }}>
              {popMeta.name}
            </span>{' '}
            ({formatPct(row.perPopulation[row.mostCommon])})
          </span>
        )}
      </div>
    </div>
  )
}

function SkewCard({ row }) {
  const most = SUPERPOPULATIONS.find((p) => p.code === row.mostCommon)
  const least = SUPERPOPULATIONS.find((p) => p.code === row.leastCommon)
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-ss-border-warm/60">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="text-sm font-bold text-ss-teal">{row.gene || row.rsid}</span>
          <span className="ml-2 text-xs text-ss-muted">{row.trait}</span>
        </div>
        <span className="text-[10px] font-mono text-ss-muted">{row.rsid}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-ss-text">
        <span className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{row.genotype}</span>
        <ZygosityBadge z={row.zygosity} />
      </div>
      <MiniPopBars perPopulation={row.perPopulation} />
      <div className="mt-2 flex justify-between text-[11px] text-ss-muted">
        <span>
          High in <span className="font-semibold" style={{ color: most?.color }}>{most?.name}</span>{' '}
          {formatPct(row.perPopulation[row.mostCommon])}
        </span>
        <span>
          Low in <span className="font-semibold" style={{ color: least?.color }}>{least?.name}</span>{' '}
          {formatPct(row.perPopulation[row.leastCommon])}
        </span>
      </div>
    </div>
  )
}

function BarsView({ rows }) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-ss-muted">
        Each row shows the estimated share of that population who carry your exact genotype for that variant.
        Sorted by how population-skewed the variant is.
      </p>
      {rows.map((r) => (
        <BarRow key={r.rsid} row={r} />
      ))}
    </div>
  )
}

function BarRow({ row }) {
  const maxVal = Math.max(0.001, ...POP_CODES.map((c) => row.perPopulation[c] || 0))
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ss-border-warm/60">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="text-sm font-bold text-ss-teal">{row.gene || row.rsid}</span>
          <span className="ml-2 text-xs text-ss-muted">{row.trait}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ss-muted">
          <code className="font-mono">{row.rsid}</code>
          <span className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{row.genotype}</span>
          <ZygosityBadge z={row.zygosity} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {SUPERPOPULATIONS.map((p) => {
          const v = row.perPopulation[p.code]
          const pct = v == null ? 0 : (v / maxVal) * 100
          return (
            <div key={p.code} className="flex items-center gap-3">
              <span
                className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: p.color }}
                title={p.blurb}
              >
                {p.name}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-ss-bg">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(1.5, pct)}%`, backgroundColor: p.color }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-[11px] font-semibold text-ss-text">
                {formatPct(v)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeatmapView({ rows }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60">
      <table className="w-full min-w-[640px] border-separate" style={{ borderSpacing: '0 4px' }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ss-muted">
              Variant
            </th>
            {SUPERPOPULATIONS.map((p) => (
              <th
                key={p.code}
                className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider"
                style={{ color: p.color }}
                title={p.blurb}
              >
                {p.code}
              </th>
            ))}
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-ss-muted">
              Genotype
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const rowMax = Math.max(0.001, ...POP_CODES.map((c) => r.perPopulation[c] || 0))
            return (
              <tr key={r.rsid}>
                <td className="sticky left-0 z-10 rounded-l-lg bg-ss-bg/60 px-3 py-2 text-left align-middle">
                  <div className="text-xs font-bold text-ss-teal">{r.gene || r.rsid}</div>
                  <div className="text-[10px] text-ss-muted">{r.rsid}</div>
                </td>
                {SUPERPOPULATIONS.map((p) => {
                  const v = r.perPopulation[p.code]
                  const intensity = v == null ? 0 : v / rowMax  // 0..1 relative to row
                  return (
                    <td
                      key={p.code}
                      className="px-1 py-1 text-center align-middle"
                    >
                      <div
                        className="mx-auto flex h-11 w-14 items-center justify-center rounded-md text-[10px] font-semibold"
                        style={{
                          backgroundColor: rgba(p.color, 0.12 + intensity * 0.78),
                          color: intensity > 0.55 ? '#fff' : '#2A2A29',
                        }}
                        title={`${p.name}: ${formatPct(v)}`}
                      >
                        {formatPct(v)}
                      </div>
                    </td>
                  )
                })}
                <td className="rounded-r-lg bg-ss-bg/60 px-3 py-2 text-right align-middle">
                  <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ss-text">
                    {r.genotype}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="mt-3 flex items-start gap-2 text-[11px] text-ss-muted">
        <Info size={12} className="mt-0.5 flex-shrink-0" />
        <span>
          Cell intensity is scaled per row — darker means &ldquo;most common population for
          this genotype.&rdquo; The number is the absolute % of that population expected to carry it.
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function PopulationLegend() {
  return (
    <div className="grid grid-cols-5 gap-1 rounded-xl bg-white p-2 text-[10px] shadow-sm ring-1 ring-ss-border-warm/60">
      {SUPERPOPULATIONS.map((p) => (
        <div key={p.code} className="flex flex-col items-center px-1.5 text-center" title={p.blurb}>
          <span className="h-2 w-8 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="mt-1 font-bold" style={{ color: p.color }}>{p.code}</span>
          <span className="text-ss-muted">{p.name.split(' / ')[0]}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-ss-teal">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-ss-muted">{sub}</div>}
    </div>
  )
}

function ZygosityBadge({ z }) {
  const label =
    z === 'homozygous_alt' ? '2 copies'
      : z === 'heterozygous' ? '1 copy'
      : 'reference'
  const tone =
    z === 'homozygous_alt' ? 'bg-ss-amber/15 text-ss-amber'
      : z === 'heterozygous' ? 'bg-ss-teal/10 text-ss-teal'
      : 'bg-ss-bg text-ss-muted'
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>
      {label}
    </span>
  )
}

function MiniPopBars({ perPopulation }) {
  const max = Math.max(0.001, ...POP_CODES.map((c) => perPopulation[c] || 0))
  return (
    <div className="mt-3 grid grid-cols-5 gap-1">
      {SUPERPOPULATIONS.map((p) => {
        const v = perPopulation[p.code]
        const h = v == null ? 4 : Math.max(4, (v / max) * 48)
        return (
          <div key={p.code} className="flex flex-col items-center">
            <div className="flex h-12 w-full items-end justify-center">
              <div
                className="w-6 rounded-t-md transition-all"
                style={{ height: `${h}px`, backgroundColor: p.color }}
                title={`${p.name}: ${formatPct(v)}`}
              />
            </div>
            <span className="mt-1 text-[9px] font-semibold" style={{ color: p.color }}>{p.code}</span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function geoSkew(perPopulation) {
  const vals = POP_CODES.map((c) => perPopulation[c]).filter((v) => v != null)
  if (vals.length === 0) return 0
  return Math.max(...vals) - Math.min(...vals)
}

function minVal(perPopulation) {
  const vals = POP_CODES.map((c) => perPopulation[c]).filter((v) => v != null)
  return vals.length ? Math.min(...vals) : 0
}
function maxVal(perPopulation) {
  const vals = POP_CODES.map((c) => perPopulation[c]).filter((v) => v != null)
  return vals.length ? Math.max(...vals) : 0
}

// Convert a hex color + alpha to an rgba() string. Used to shade heatmap cells
// by intensity while keeping palette control in one place.
function rgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
