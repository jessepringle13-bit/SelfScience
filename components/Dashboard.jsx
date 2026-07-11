'use client'

// /app/components/Dashboard.jsx
// SelfScience — Personalized post-genome-upload dashboard.
//
// Reads genome results from sessionStorage (never a server call) and renders
// 6 sections: Top Findings, Strengths, Pillar Score Overview, Research
// Matched to You, Your Protocol Preview, Explore Your Pillars.
//
// PubMed research is fetched via /api/pubmed-search (server route) with
// graceful loading + empty/error states — PubMed failures never break the
// rest of the dashboard.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Sparkles, ShieldAlert, Loader2, Dna } from 'lucide-react'
import { getGenomeResults } from '@/lib/genomeSession'
import { matchProtocolToUserVariants } from '@/lib/supplementProtocol'
import { PILLARS } from '@/components/site-nav'

export default function Dashboard() {
  const [report, setReport] = useState(null)

  // Hydrate from sessionStorage after mount so we don't hit SSR issues.
  useEffect(() => {
    setReport(getGenomeResults())
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const strengths = (report?.overview?.strengths || []).slice(0, 3)
  const areas     = (report?.overview?.areasToExplore || []).slice(0, 3)

  // Derive top 3 gene symbols from strengths + areas for research matching.
  const topGenes = useMemo(() => {
    const genes = []
    const seen = new Set()
    for (const c of [...areas, ...strengths]) {
      const raw = (c?.gene || '').trim()
      // Skip rsID-list style gene fields from haplotypes.
      if (!raw || /^rs\d/i.test(raw) || raw.includes(' + ') || raw.includes(',')) continue
      if (seen.has(raw)) continue
      seen.add(raw)
      genes.push(raw)
      if (genes.length >= 3) break
    }
    return genes
  }, [report])

  const protocolPreview = useMemo(() => {
    if (!report) return []
    const g = matchProtocolToUserVariants(report)
    return [...g.priority, ...g.lifestyle, ...g.awareness].slice(0, 3)
  }, [report])

  const pillarSummary = report?.step1?.pillar_summary || {}

  return (
    <div className="min-h-screen bg-ss-bg pb-20">
      {/* Header */}
      <div className="container pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              Your Dashboard
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Welcome back — here&apos;s what your genome says today.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              Personalized snapshot of your top findings, protocol, and matching research — all in one place.
            </p>
          </div>
          <Link
            href="/genome"
            className="inline-flex items-center gap-2 rounded-full border-2 border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
          >
            See full results <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="container mt-10 space-y-14">
        {/* 1. TOP FINDINGS (Be Aware) */}
        <DashSection title="Your Top Findings" subtitle="The most notable Be Aware findings from your genome." toneClass="text-ss-amber">
          {areas.length === 0 ? (
            <EmptyRow copy="No awareness findings surfaced — every recognized variant is in favorable or neutral range." />
          ) : (
            <CardRow items={areas} tone="aware" />
          )}
          <SeeAllLink href="/genome" label="See all findings" />
        </DashSection>

        {/* 2. STRENGTHS */}
        <DashSection title="Your Strengths" subtitle="Your top favorable variants." toneClass="text-ss-green">
          {strengths.length === 0 ? (
            <EmptyRow copy="No positive findings surfaced yet — explore your full report for the complete picture." />
          ) : (
            <CardRow items={strengths} tone="strength" />
          )}
          <SeeAllLink href="/genome" label="See all strengths" />
        </DashSection>

        {/* 3. PILLAR SCORE OVERVIEW */}
        <DashSection title="Pillar Score Overview" subtitle="Distribution of findings across your 10 pillars." toneClass="text-ss-teal">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PILLARS.map((p) => (
              <PillarTile key={p.key} pillar={p} summary={pillarSummary[p.name]} />
            ))}
          </div>
        </DashSection>

        {/* 4. RESEARCH MATCHED TO YOU */}
        <ResearchMatched genes={topGenes} />

        {/* 5. YOUR PROTOCOL PREVIEW */}
        <DashSection title="Your Protocol Preview" subtitle="First 3 variant-driven recommendations. Full protocol is in the Genome tab." toneClass="text-ss-teal">
          {protocolPreview.length === 0 ? (
            <EmptyRow copy="No protocol matches yet — more findings unlock more recommendations." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {protocolPreview.map((entry) => (
                <ProtocolPreviewCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
          <SeeAllLink href="/genome?tab=protocol" label="See your full protocol" />
        </DashSection>

        {/* 6. EXPLORE YOUR PILLARS */}
        <DashSection title="Explore Your Pillars" subtitle="Dive into the research grouped by pillar." toneClass="text-ss-teal">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <ExplorePillarCard key={p.key} pillar={p} />
            ))}
          </div>
        </DashSection>

        {/* Educational disclaimer footer */}
        <div className="rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-ss-amber" />
            <p className="text-sm text-ss-text">
              <span className="font-semibold">Educational only.</span> This dashboard summarizes research associations, not medical predictions. Talk to a qualified clinician before making health decisions from this information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function DashSection({ title, subtitle, toneClass, children }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className={`text-xl font-extrabold ${toneClass || 'text-ss-teal'}`}>{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ss-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function SeeAllLink({ href, label }) {
  return (
    <div className="mt-4">
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-ss-teal hover:underline">
        {label} <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function EmptyRow({ copy }) {
  return (
    <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-6 text-center text-sm text-ss-muted">
      {copy}
    </div>
  )
}

function CardRow({ items, tone }) {
  const border = tone === 'strength' ? '#2E7D32' : tone === 'aware' ? '#964219' : '#7A7974'
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((c, i) => (
        <div
          key={c.rsid || i}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          style={{ borderLeft: `4px solid ${border}` }}
        >
          <div className="text-sm font-bold text-ss-teal">{c.name || c.gene}</div>
          <p className="mt-2 line-clamp-3 text-sm text-ss-text">{c.plain || ''}</p>
          <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-ss-muted">
            {c.gene && <code className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{c.gene}</code>}
            {c.rsid && <code className="rounded bg-ss-bg px-1.5 py-0.5">{c.rsid}</code>}
            {c.genotype && <span className="font-semibold">{c.genotype}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function PillarTile({ pillar, summary }) {
  const positive = summary?.positive || 0
  const awareness = summary?.awareness || 0
  const neutral = summary?.neutral || 0
  const total = positive + awareness + neutral
  return (
    <Link
      href={`/search?pillar=${encodeURIComponent(pillar.name)}`}
      className="flex flex-col rounded-xl bg-white p-4 ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
          <pillar.Icon size={16} strokeWidth={1.5} />
        </span>
        <div className="text-xs font-bold text-ss-teal">{pillar.name}</div>
      </div>
      <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-ss-border-warm/40" aria-hidden="true">
        {total === 0 ? (
          <div className="h-full w-full" />
        ) : (
          <>
            {positive > 0 && <div className="h-full bg-ss-green" style={{ width: `${(positive/total)*100}%` }} />}
            {awareness > 0 && <div className="h-full bg-ss-amber" style={{ width: `${(awareness/total)*100}%` }} />}
            {neutral > 0 && <div className="h-full bg-ss-border-warm" style={{ width: `${(neutral/total)*100}%` }} />}
          </>
        )}
      </div>
      <div className="mt-2 text-[10px] text-ss-muted">
        {positive}·Benefit &nbsp;{awareness}·Aware &nbsp;{neutral}·Neutral
      </div>
    </Link>
  )
}

function ExplorePillarCard({ pillar }) {
  return (
    <Link
      href={`/search?pillar=${encodeURIComponent(pillar.name)}`}
      className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
        <pillar.Icon size={20} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-ss-teal">{pillar.name}</div>
        <div className="mt-1 text-xs text-ss-muted line-clamp-2">{pillar.description}</div>
      </div>
      <ArrowRight size={14} className="mt-2 flex-shrink-0 text-ss-muted" />
    </Link>
  )
}

function ProtocolPreviewCard({ entry }) {
  const first = entry.recommendations?.[0]
  if (!first) return null
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-ss-teal" />
        <span className="text-xs font-bold uppercase tracking-wider text-ss-teal">{entry.gene}</span>
      </div>
      <div className="mt-2 text-base font-bold text-ss-text">{first.name}</div>
      <p className="mt-2 text-xs text-ss-muted line-clamp-3">{first.mechanism}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Research Matched section — async fetch through /api/pubmed-search
// ---------------------------------------------------------------------------

function ResearchMatched({ genes }) {
  const [state, setState] = useState({ loading: false, byGene: {}, error: null })

  const fetchAll = useCallback(async () => {
    if (!genes || genes.length === 0) return
    setState({ loading: true, byGene: {}, error: null })
    const results = await Promise.all(
      genes.map(async (g) => {
        try {
          const r = await fetch(`/api/pubmed-search?gene=${encodeURIComponent(g)}&limit=2`)
          if (!r.ok) return { gene: g, papers: [] }
          const data = await r.json()
          return { gene: g, papers: data.results || [] }
        } catch {
          return { gene: g, papers: [] }
        }
      })
    )
    const byGene = {}
    for (const r of results) byGene[r.gene] = r.papers
    setState({ loading: false, byGene, error: null })
  }, [genes])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <DashSection
      title="Research Matched to You"
      subtitle="Recent papers touching your top variant genes."
      toneClass="text-ss-teal"
    >
      {genes.length === 0 ? (
        <EmptyRow copy="Not enough gene data yet to match research. Once you have more findings, this section fills in." />
      ) : state.loading ? (
        <div className="flex items-center gap-2 rounded-xl bg-white p-6 text-sm text-ss-muted ring-1 ring-ss-border-warm/60">
          <Loader2 size={16} className="animate-spin" />
          Loading research for {genes.join(', ')}…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {genes.map((g) => {
            const papers = state.byGene[g] || []
            return (
              <div key={g} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
                <div className="flex items-center gap-2">
                  <Dna size={14} className="text-ss-teal" />
                  <span className="text-xs font-bold uppercase tracking-wider text-ss-teal">{g}</span>
                </div>
                {papers.length === 0 ? (
                  <p className="mt-3 text-sm text-ss-muted">
                    No recent research found for this variant right now.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {papers.map((p) => (
                      <li key={p.pmid}>
                        <a
                          href={p.pubmedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-2"
                        >
                          <ExternalLink size={12} className="mt-1 flex-shrink-0 text-ss-muted" />
                          <div className="min-w-0">
                            <div className="line-clamp-3 text-sm font-medium text-ss-text group-hover:underline">
                              {p.title}
                            </div>
                            <div className="mt-1 text-[11px] text-ss-muted line-clamp-1">
                              {p.journal}{p.year ? ` · ${p.year}` : ''}
                            </div>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashSection>
  )
}
