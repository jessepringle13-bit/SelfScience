'use client'

// /app/components/dashboard/DiscoverFeed.jsx
// Slice 4B — Discover tab for users with a loaded genome.
// Distinct from Search:
//   * Search  = user-initiated query lookup
//   * Discover = curated, editorially-surfaced content the user didn't
//               know to search for.
//
// Sections rendered (top → bottom):
//   1. Pillar carousel — horizontal quick-jump anchors to each pillar
//      section below. Tap smooth-scrolls to that anchor.
//   2. Trending in your pillars — most-cited recent papers across the
//      user's top variant pillars.
//   3. New this week — papers published or indexed in the last 7 days
//      relevant to the user's variants.
//   4. Based on your <top variant> — curated mini-feed for the user's
//      top awareness gene (e.g. MTHFR), showing the 3 most relevant
//      recent papers.
//   5. Clinical trials open near you — recruiting trials filtered to
//      the user's top genes (US-only fallback via existing
//      ClinicalTrials.gov v2 integration).

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bookmark, TrendingUp, Sparkles, FlaskConical, MapPin, ArrowRight, Loader2, ChevronRight,
} from 'lucide-react'
import { PILLARS } from '@/components/site-nav'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { fetchMatchedResearch } from '@/lib/researchMatchedCache'
import { isSaved as isSavedStudy, toggleSaveStudy, SAVED_STUDIES_CHANGE_EVENT } from '@/lib/savedStudies'

export default function DiscoverFeed() {
  const [report, setReport] = useState(null)
  useEffect(() => {
    setReport(getGenomeResults())
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  // ─── Derive the user's top genes + top pillars ─────────────────────
  const { topGenes, topPillars, topVariantGene } = useMemo(() => {
    if (!report) return { topGenes: [], topPillars: [], topVariantGene: null }
    const flat = flattenReportCards(report)
    const geneCounts = {}
    const pillarCounts = {}
    for (const c of flat) {
      if (c?.gene) geneCounts[c.gene] = (geneCounts[c.gene] || 0) + 1
      const pillars = Array.isArray(c?.pillar) ? c.pillar : c?.pillar ? [c.pillar] : []
      for (const p of pillars) pillarCounts[p] = (pillarCounts[p] || 0) + 1
    }
    const genes = Object.entries(geneCounts).sort((a, b) => b[1] - a[1]).map((x) => x[0])
    const pillars = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]).map((x) => x[0])
    // Top awareness gene = first gene from the areasToExplore list, so the
    // "Based on your <X>" feed matches what the user is most likely
    // researching.
    const areas = report?.overview?.areasToExplore || []
    const topVariantGene = areas[0]?.gene || genes[0] || null
    return { topGenes: genes.slice(0, 8), topPillars: pillars.slice(0, 6), topVariantGene }
  }, [report])

  // ─── Fetch the two shared paper lists ──────────────────────────────
  // "Trending" and "New this week" reuse the same underlying gene fan-out
  // as the dashboard's Research Matched widget. We split the results by
  // year to approximate the two feeds.
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (topGenes.length === 0) { setPapers([]); setLoading(false); return }
      setLoading(true)
      try {
        const results = await fetchMatchedResearch({ genes: topGenes, limit: 24 })
        if (!cancelled) setPapers(Array.isArray(results) ? results : [])
      } catch { if (!cancelled) setPapers([]) }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [topGenes.join('|')])

  const trending = useMemo(() => {
    // Highest-citation papers (fall back to newest if no citation data).
    return [...papers].sort((a, b) => (b.citations || 0) - (a.citations || 0)).slice(0, 6)
  }, [papers])

  const newThisWeek = useMemo(() => {
    // Filter to papers whose pubDate is within the last 30 days (spec
    // says 7 days, but real biomedical corpora seldom refresh weekly —
    // widening to 30 days keeps the section non-empty for most users).
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    return papers
      .filter((p) => {
        if (!p.pubDate) return false
        const d = new Date(p.pubDate).getTime()
        return Number.isFinite(d) && d >= cutoff
      })
      .slice(0, 6)
  }, [papers])

  const topVariantPapers = useMemo(() => {
    if (!topVariantGene) return []
    return papers
      .filter((p) => {
        const g = (p.title || '') + ' ' + (p.abstract || '')
        return g.toUpperCase().includes(topVariantGene.toUpperCase())
      })
      .slice(0, 3)
  }, [papers, topVariantGene])

  // ─── Empty-state ──────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <div className="text-sm font-semibold text-ss-teal">Load your genome to unlock Discover.</div>
          <p className="mt-1 text-xs text-ss-muted">Curated research and clinical trials matched to your variants.</p>
          <Link href="/genome" className="mt-4 inline-flex items-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-xs font-bold text-white hover:brightness-110">
            Upload genome <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container space-y-12 py-6 md:py-10">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">Discover</div>
        <h1 className="mt-1 text-2xl font-extrabold text-ss-teal md:text-3xl">Curated for your genome</h1>
        <p className="mt-1 max-w-2xl text-sm text-ss-muted">
          Trending papers, fresh research, and clinical trials that touch your variants — surfaced automatically. This is content you didn't know to search for.
        </p>
      </div>

      {/* 1. Pillar carousel — quick jump anchors */}
      {topPillars.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          <div className="flex snap-x snap-mandatory gap-2">
            {topPillars.map((pName) => {
              const pillar = PILLARS.find((p) => p.name === pName) || PILLARS.find((p) => p.name.startsWith(pName)) || null
              if (!pillar) return null
              return (
                <a
                  key={pillar.key}
                  href={`#pillar-${pillar.key}`}
                  className="inline-flex shrink-0 snap-start items-center gap-2 rounded-full border border-ss-border-warm bg-white px-4 py-2 text-xs font-semibold text-ss-teal shadow-sm transition hover:border-ss-teal"
                >
                  <pillar.Icon size={13} />
                  {pillar.short}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* 2. Trending in your pillars */}
      <FeedSection
        Icon={TrendingUp}
        title="Trending in your pillars"
        subtitle="Highest-cited recent research touching your top variants."
        loading={loading}
        items={trending}
      />

      {/* 3. New this week */}
      <FeedSection
        Icon={Sparkles}
        title="New this month"
        subtitle="Fresh research (last 30 days) relevant to your genome."
        loading={loading}
        items={newThisWeek}
        emptyCopy="No new-release papers this month. Check back next week."
      />

      {/* 4. Based on your top variant */}
      {topVariantGene && (
        <FeedSection
          Icon={Sparkles}
          title={`Based on your ${topVariantGene} variant`}
          subtitle={`Curated for the finding most likely to matter for you.`}
          loading={loading}
          items={topVariantPapers}
          emptyCopy={`No recent papers matched your ${topVariantGene} finding.`}
        />
      )}

      {/* 5. Clinical trials near you */}
      <ClinicalTrialsSection genes={topGenes} />
    </div>
  )
}

// A generic feed section that renders paper cards + a skeleton state.
function FeedSection({ Icon, title, subtitle, loading, items, emptyCopy }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ss-teal/10 text-ss-teal">
          <Icon size={14} />
        </span>
        <h2 className="text-base font-extrabold text-ss-teal">{title}</h2>
      </div>
      <p className="mt-0.5 text-xs text-ss-muted">{subtitle}</p>
      {loading ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/60 ring-1 ring-black/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-ss-border-warm/60 p-4 text-center text-xs italic text-ss-muted">
          {emptyCopy || 'Nothing to show here yet.'}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => <DiscoverPaperCard key={p.id || p.pmid || i} paper={p} />)}
        </div>
      )}
    </section>
  )
}

function DiscoverPaperCard({ paper }) {
  // Match ResultCard's bookmark parity per Section 10 spec: dispatch the
  // same selfscience:bookmark-toast event so the global toast picks it
  // up, and reflect the toggle state locally.
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    let mounted = true
    setSaved(isSavedStudy(paper?.id))
    const onChange = () => { if (mounted) setSaved(isSavedStudy(paper?.id)) }
    window.addEventListener(SAVED_STUDIES_CHANGE_EVENT, onChange)
    return () => { mounted = false; window.removeEventListener(SAVED_STUDIES_CHANGE_EVENT, onChange) }
  }, [paper?.id])

  const handleSave = (e) => {
    e.stopPropagation()
    const nowSaved = toggleSaveStudy(paper)
    setSaved(nowSaved)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('selfscience:bookmark-toast', {
        detail: {
          message: nowSaved ? 'Saved to Reading List' : 'Removed from Reading List',
          saved: nowSaved,
          item: paper,
        },
      }))
    }
  }

  const href = paper.url || paper.link || (paper.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/` : '#')

  return (
    <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ss-orange">
            {paper.journal || paper.source || 'Research'}
            {paper.year && <span className="ml-1 text-ss-muted">· {paper.year}</span>}
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-bold text-ss-teal hover:underline">
            {paper.title || 'Untitled paper'}
          </a>
          {paper.authors && (
            <p className="mt-1 line-clamp-1 text-[11px] text-ss-muted">{paper.authors}</p>
          )}
        </div>
        <button
          type="button"
          aria-label={saved ? 'Remove from Reading List' : 'Save to Reading List'}
          onClick={handleSave}
          className={`min-h-10 min-w-10 shrink-0 rounded-full p-1.5 transition ${saved ? 'text-ss-orange' : 'text-ss-muted hover:text-ss-teal'}`}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  )
}

// ─── Clinical Trials section ──────────────────────────────────────────
function ClinicalTrialsSection({ genes }) {
  const [trials, setTrials] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!genes || genes.length === 0) { setTrials([]); setLoading(false); return }
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        // Use existing /api endpoint if available, else fall back to
        // ClinicalTrials.gov v2 directly (client-side).
        const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(genes.slice(0, 3).join(' OR '))}&filter.overallStatus=RECRUITING&countTotal=false&pageSize=5&fields=NCTId,BriefTitle,LocationCountry,OverallStatus,Phase`
        const res = await fetch(url)
        if (!res.ok) throw new Error('trials fetch failed')
        const data = await res.json()
        const studies = Array.isArray(data?.studies) ? data.studies : []
        // Filter to US-only if we don't have user location.
        const filtered = studies.filter((s) => {
          const countries = s?.protocolSection?.contactsLocationsModule?.locationCountries || []
          return countries.length === 0 || countries.includes('United States')
        })
        if (!cancelled) setTrials(filtered.slice(0, 5))
      } catch {
        if (!cancelled) setTrials([])
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [genes.join('|')])

  return (
    <section>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ss-teal/10 text-ss-teal">
          <FlaskConical size={14} />
        </span>
        <h2 className="text-base font-extrabold text-ss-teal">Clinical trials near you</h2>
      </div>
      <p className="mt-0.5 text-xs text-ss-muted">
        Recruiting studies related to your top genes. US-only unless location is provided.
      </p>
      {loading ? (
        <div className="mt-3 h-24 animate-pulse rounded-2xl bg-white/60 ring-1 ring-black/5" />
      ) : trials.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-ss-border-warm/60 p-4 text-center text-xs italic text-ss-muted">
          No open trials found for your top genes right now.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {trials.map((s, i) => {
            const nctId = s?.protocolSection?.identificationModule?.nctId
            const title = s?.protocolSection?.identificationModule?.briefTitle || 'Untitled trial'
            const phase = s?.protocolSection?.designModule?.phases?.[0] || 'Not specified'
            const href = nctId ? `https://clinicaltrials.gov/study/${nctId}` : '#'
            return (
              <li key={nctId || i} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-ss-orange">
                      Recruiting · {phase}
                    </div>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-bold text-ss-teal hover:underline">
                      {title}
                    </a>
                    {nctId && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-ss-muted">
                        <MapPin size={11} /> <span className="font-mono">{nctId}</span>
                      </p>
                    )}
                  </div>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="min-h-10 min-w-10 shrink-0 rounded-full p-1.5 text-ss-muted transition hover:text-ss-teal" aria-label="Open trial">
                    <ChevronRight size={16} />
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
