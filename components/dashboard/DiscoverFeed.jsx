'use client'

// /app/components/dashboard/DiscoverFeed.jsx
// Discover tab — curated research surfaced from the user's genome. Rewritten
// (Discover-Fix, Jun 2026) to:
//   • Fan out queries per-pillar and per-variant using PLAIN-LANGUAGE
//     PubMed queries built from /app/lib/variantQueries.js (raw rsIDs
//     don't match against PubMed at all).
//   • Widen the "New this month" cut-off to 90 days.
//   • Show a proper empty-state with an icon, explanation, Retry button,
//     and a reassurance line — no more blank white cards.
//   • Never return a Map from a data helper into an "expected array"
//     consumer (the previous version silently swallowed all results
//     because fetchMatchedResearch returns a Map).

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bookmark, TrendingUp, Sparkles, FlaskConical, MapPin, ArrowRight,
  RefreshCw, ChevronRight,
} from 'lucide-react'
import { PILLARS } from '@/components/site-nav'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { queryForVariant, queryForPillar, combinedVariantQuery } from '@/lib/variantQueries'
import { isSaved as isSavedStudy, toggleSaveStudy, SAVED_STUDIES_CHANGE_EVENT } from '@/lib/savedStudies'

// ─── Low-level fetch helper ─────────────────────────────────────────────
// Wraps /api/pubmed-search with a q= (plain-language) or gene= param.
async function pubmedQuery({ q, gene, limit = 6, days = 0 }) {
  const params = new URLSearchParams()
  if (q)    params.set('q', q)
  if (gene) params.set('gene', gene)
  params.set('limit', String(limit))
  if (days > 0) params.set('days', String(days))
  try {
    const r = await fetch(`/api/pubmed-search?${params.toString()}`)
    if (!r.ok) return []
    const data = await r.json()
    return Array.isArray(data?.results) ? data.results : []
  } catch { return [] }
}

// Uniquify by pmid so parallel fan-outs don't double-count the same paper.
function dedupeByPmid(papers) {
  const seen = new Set()
  const out = []
  for (const p of papers) {
    const id = p?.pmid || p?.id
    if (!id || seen.has(id)) continue
    seen.add(id); out.push(p)
  }
  return out
}

// ─── Component ──────────────────────────────────────────────────────────
export default function DiscoverFeed() {
  const [report, setReport] = useState(null)
  useEffect(() => {
    setReport(getGenomeResults())
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  // Derive top pillars + top variants + a "featured variant" (the finding
  // most likely to matter — first areasToExplore entry, else the top
  // flat card).
  const { topPillars, topVariants, featuredVariant } = useMemo(() => {
    if (!report) return { topPillars: [], topVariants: [], featuredVariant: null }
    const flat = flattenReportCards(report)
    const pillarCounts = {}
    for (const c of flat) {
      const pillars = Array.isArray(c?.pillar) ? c.pillar : c?.pillar ? [c.pillar] : []
      for (const p of pillars) pillarCounts[p] = (pillarCounts[p] || 0) + 1
    }
    const pillars = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]).map((x) => x[0])
    const variants = flat.filter((c) => c?.rsid || c?.gene).slice(0, 8).map((c) => ({ rsid: c.rsid, gene: c.gene, pillar: Array.isArray(c.pillar) ? c.pillar[0] : c.pillar }))
    const areas = report?.overview?.areasToExplore || []
    const featured = areas[0] ? { rsid: areas[0].rsid, gene: areas[0].gene } : variants[0] || null
    return { topPillars: pillars.slice(0, 5), topVariants: variants, featuredVariant: featured }
  }, [report])

  // ─── Fetch state ──────────────────────────────────────────────────────
  const [trending,   setTrending]   = useState([])
  const [newMonth,   setNewMonth]   = useState([])
  const [featured,   setFeatured]   = useState([])
  const [status,     setStatus]     = useState('idle') // 'idle' | 'loading' | 'ok' | 'error' | 'empty'
  const [reloadNonce, setReloadNonce] = useState(0)

  const loadAll = useCallback(async () => {
    if (!report) return
    setStatus('loading')
    try {
      // Section 2 — Trending in your pillars: query each of the top 3
      // pillars in parallel with its plain-language query, keep the 6
      // most-recent overall.
      const pillarQueries = topPillars.slice(0, 3).map((p) => queryForPillar(p))
      const pillarBatches = await Promise.all(
        pillarQueries.map((q) => pubmedQuery({ q, limit: 4, days: 180 })),
      )
      let trendingPapers = dedupeByPmid(pillarBatches.flat())
      // If the 6-month window came back empty, retry without the day
      // filter so we still show recent-ish research.
      if (trendingPapers.length === 0 && pillarQueries.length) {
        const wideBatches = await Promise.all(
          pillarQueries.map((q) => pubmedQuery({ q, limit: 4 })),
        )
        trendingPapers = dedupeByPmid(wideBatches.flat())
      }
      trendingPapers = trendingPapers
        .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
        .slice(0, 6)

      // Section 3 — New this month: 90-day window, OR-join the user's
      // top-5 variant plain-language queries into a single search.
      const combined = combinedVariantQuery(topVariants.slice(0, 5))
      let newMonthPapers = []
      if (combined) {
        newMonthPapers = await pubmedQuery({ q: combined, limit: 6, days: 90 })
        // Fallback: if 90-day window is empty, drop the days filter but
        // sort by pubDate so newest shows first.
        if (newMonthPapers.length === 0) {
          newMonthPapers = await pubmedQuery({ q: combined, limit: 6 })
          newMonthPapers = newMonthPapers
            .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
        }
      }

      // Section 4 — Based on your featured variant: run the variant's
      // plain-language query directly.
      let featuredPapers = []
      if (featuredVariant) {
        const q = queryForVariant(featuredVariant.rsid, featuredVariant.gene)
        if (q) featuredPapers = await pubmedQuery({ q, limit: 3 })
      }

      setTrending(trendingPapers)
      setNewMonth(newMonthPapers)
      setFeatured(featuredPapers)
      const anything = trendingPapers.length + newMonthPapers.length + featuredPapers.length
      setStatus(anything > 0 ? 'ok' : 'empty')
    } catch (e) {
      setStatus('error')
    }
  }, [report, topPillars.join('|'), topVariants.map((v) => v.rsid || v.gene).join('|'), featuredVariant?.rsid, featuredVariant?.gene])

  useEffect(() => { loadAll() }, [loadAll, reloadNonce])
  const retry = () => setReloadNonce((n) => n + 1)

  // ─── No-genome empty-state ─────────────────────────────────────────────
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

  const loading   = status === 'loading' || status === 'idle'
  const showRetry = status === 'error' || status === 'empty'

  return (
    <div className="container space-y-12 py-6 md:py-10">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">Discover</div>
        <h1 className="mt-1 text-2xl font-extrabold text-ss-teal md:text-3xl">Curated for your genome</h1>
        <p className="mt-1 max-w-2xl text-sm text-ss-muted">
          Trending papers, fresh research, and clinical trials that touch your variants — surfaced automatically. This is content you didn&apos;t know to search for.
        </p>
      </div>

      {/* Pillar carousel — quick jump anchors */}
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

      {/* Global retry banner — only shown when a full batch failed or
          every section came back empty. Individual sections still show
          their own inline empty copy underneath. */}
      {showRetry && !loading && (
        <ResearchLoadingCard
          onRetry={retry}
          mode={status === 'error' ? 'error' : 'empty'}
        />
      )}

      {/* Trending in your pillars */}
      <FeedSection
        Icon={TrendingUp}
        title="Trending in your pillars"
        subtitle="Highest-recency research across your top health areas."
        loading={loading}
        items={trending}
        onRetry={retry}
      />

      {/* New this month */}
      <FeedSection
        Icon={Sparkles}
        title="New this month"
        subtitle="Fresh research (last 90 days) relevant to your genome."
        loading={loading}
        items={newMonth}
        onRetry={retry}
        emptyCopy="No new-release papers matched your variants in the last 90 days."
      />

      {/* Based on your featured variant */}
      {featuredVariant && (
        <FeedSection
          Icon={Sparkles}
          title={`Based on your ${featuredVariant.gene || featuredVariant.rsid} variant`}
          subtitle="Curated for the finding most likely to matter for you."
          loading={loading}
          items={featured}
          onRetry={retry}
          emptyCopy={`No recent papers matched your ${featuredVariant.gene || featuredVariant.rsid} finding.`}
        />
      )}

      {/* Clinical trials */}
      <ClinicalTrialsSection genes={topVariants.map((v) => v.gene).filter(Boolean)} />
    </div>
  )
}

// A generic feed section that renders paper cards + a skeleton state.
function FeedSection({ Icon, title, subtitle, loading, items, emptyCopy, onRetry }) {
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
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <InlineEmptyState copy={emptyCopy || 'Nothing to show here yet.'} onRetry={onRetry} />
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => <DiscoverPaperCard key={p.id || p.pmid || i} paper={p} />)}
        </div>
      )}
    </section>
  )
}

// Icon + explanation + Retry action. Replaces the previous blank "italic
// muted text" empty placeholder per the Discover-Fix spec.
function InlineEmptyState({ copy, onRetry }) {
  return (
    <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-ss-border-warm bg-white p-6 text-center">
      <FlaskConical size={22} className="text-ss-teal" strokeWidth={1.75} />
      <p className="mt-3 max-w-sm text-sm font-semibold text-ss-teal">{copy}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-ss-teal px-4 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
      <p className="mt-3 text-[11px] text-ss-muted">Results pull from PubMed — check your connection if this persists.</p>
    </div>
  )
}

// Full-width research-loading card for when EVERYTHING came back empty
// or the fetch outright failed. Sits above the per-section cards so
// users see a clear top-level state.
function ResearchLoadingCard({ onRetry, mode }) {
  const isError = mode === 'error'
  return (
    <div className="rounded-2xl border border-ss-border-warm bg-white p-6 text-center shadow-sm">
      <FlaskConical size={26} className="mx-auto text-ss-teal" strokeWidth={1.75} />
      <p className="mt-3 text-base font-extrabold text-ss-teal">
        {isError ? 'We couldn’t reach PubMed right now.' : 'Research is loading for your genome.'}
      </p>
      <p className="mt-1 text-xs text-ss-muted">
        {isError
          ? 'PubMed occasionally rate-limits or times out. Give it a moment and try again.'
          : 'This is the first time PubMed has seen your query — results should appear shortly.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-teal px-5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
      >
        <RefreshCw size={13} /> Retry
      </button>
      <p className="mt-3 text-[11px] text-ss-muted">
        Results pull from PubMed — check your connection if this persists.
      </p>
    </div>
  )
}

function DiscoverPaperCard({ paper }) {
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

  const href = paper.url || paper.link || paper.pubmedUrl || (paper.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/` : '#')

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
        const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(genes.slice(0, 3).join(' OR '))}&filter.overallStatus=RECRUITING&countTotal=false&pageSize=5&fields=NCTId,BriefTitle,LocationCountry,OverallStatus,Phase`
        const res = await fetch(url)
        if (!res.ok) throw new Error('trials fetch failed')
        const data = await res.json()
        const studies = Array.isArray(data?.studies) ? data.studies : []
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
        <div className="mt-3 h-24 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />
      ) : trials.length === 0 ? (
        <InlineEmptyState copy="No open trials found for your top genes right now." />
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
