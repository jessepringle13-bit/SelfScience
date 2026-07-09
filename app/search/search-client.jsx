'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { ResultCard } from '@/components/result-card'

const PILLARS = ['Genomics', 'Nutrition', 'Performance', 'Longevity', 'Wellness']
const SOURCE_OPTIONS = [
  { key: 'all', label: 'All sources' },
  { key: 'pubmed', label: 'PubMed only' },
  { key: 's2', label: 'Semantic Scholar only' },
]
const DATE_OPTIONS = [
  { key: 'any', label: 'Any date' },
  { key: '1', label: 'Past year' },
  { key: '5', label: 'Past 5 years' },
  { key: '10', label: 'Past 10 years' },
]

/**
 * Analyze a list of items via /api/analyze, capped at `concurrency` in-flight requests.
 * onResult is called each time one item completes with (id, analysis).
 * onCount is called with the number of currently in-flight requests (for the UI badge).
 */
async function analyzeInPool(items, concurrency, onResult, onCount) {
  const queue = [...items]
  let inFlight = 0
  const kick = () => onCount && onCount(inFlight)

  return new Promise((resolve) => {
    const next = () => {
      if (queue.length === 0 && inFlight === 0) {
        kick()
        resolve()
        return
      }
      while (inFlight < concurrency && queue.length > 0) {
        const item = queue.shift()
        inFlight++
        kick()
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            doi: item.doi,
            pmid: item.pmid,
            title: item.title,
            journal: item.journal,
            year: item.year,
            source: item.source,
            authorsShort: item.authorsShort,
            abstract: item.abstract,
          }),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error(String(res.status))
            return res.json()
          })
          .then((json) => onResult(item.id, json))
          .catch(() => {
            onResult(item.id, {
              _analysisError: true,
            })
          })
          .finally(() => {
            inFlight--
            kick()
            next()
          })
      }
    }
    next()
  })
}

export default function SearchClient() {
  const router = useRouter()
  const params = useSearchParams()
  const initialQ = params.get('q') || ''
  const initialPillar = params.get('pillar') || ''
  const initialSource = params.get('source') || 'all'
  const [query, setQuery] = useState(initialQ)
  const [submittedQ, setSubmittedQ] = useState(initialQ)
  const [pillar, setPillar] = useState(initialPillar)
  const [source, setSource] = useState(initialSource)
  const [dateRange, setDateRange] = useState('any')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [analyses, setAnalyses] = useState({}) // id -> {reliability, reliabilityLabel, ...}
  const [analyzing, setAnalyzing] = useState(0) // count in flight

  const runSearch = useCallback(async (q, s, pill) => {
    if (!q.trim()) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    setAnalyses({})
    try {
      const url = new URL('/api/search', window.location.origin)
      url.searchParams.set('q', q)
      if (s && s !== 'all') url.searchParams.set('source', s)
      if (pill) url.searchParams.set('pillar', pill)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const json = await res.json()
      setData(json)
      // Kick off AI analysis for top results only; rate-friendly for free tier.
      // Concurrency 2 keeps latency reasonable while respecting Gemini free RPM.
      const initial = (json.results || []).slice(0, 6)
      analyzeInPool(initial, 2, (id, analysis) => {
        setAnalyses((prev) => ({ ...prev, [id]: analysis }))
      }, setAnalyzing)
    } catch (e) {
      setError(e.message || 'Something went wrong')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run search when submittedQ/source/pillar change
  useEffect(() => {
    if (submittedQ) runSearch(submittedQ, source, pillar)
  }, [submittedQ, source, pillar, runSearch])

  const submit = (e) => {
    e?.preventDefault?.()
    const q = query.trim()
    if (!q) return
    setSubmittedQ(q)
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (source && source !== 'all') usp.set('source', source)
    if (pillar) usp.set('pillar', pillar)
    router.replace(`/search?${usp.toString()}`)
  }

  // Client-side date filtering (raw display, no reranking yet)
  const filtered = useMemo(() => {
    if (!data?.results) return []
    const merged = data.results.map((r) => ({ ...r, ...(analyses[r.id] || {}) }))
    if (dateRange === 'any') return merged
    const cutoff = new Date().getFullYear() - parseInt(dateRange, 10)
    return merged.filter((r) => (r.year || 0) >= cutoff)
  }, [data, dateRange, analyses])

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* Sticky search band */}
      <section className="relative bg-ss-teal pb-8 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <form onSubmit={submit} className="mx-auto max-w-4xl">
            <div className="flex items-center overflow-hidden rounded-full bg-white text-ss-text shadow-lg ring-1 ring-black/10">
              <Search className="ml-4 shrink-0 text-ss-muted" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search PubMed and Semantic Scholar… e.g. MTHFR C677T, zone 2 training, rapamycin"
                className="w-full bg-transparent px-3 py-3 text-base placeholder:text-ss-muted focus:outline-none"
              />
              <button
                type="submit"
                className="m-1.5 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ss-orange-dark"
              >
                Search
              </button>
            </div>

            {/* Pillar pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPillar('')}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  pillar === ''
                    ? 'border-ss-orange bg-ss-orange text-white'
                    : 'border-white/25 bg-white/5 text-white/85 hover:bg-white/10'
                }`}
              >
                All pillars
              </button>
              {PILLARS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPillar(pillar === p ? '' : p)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    pillar === p
                      ? 'border-ss-orange bg-ss-orange text-white'
                      : 'border-white/25 bg-white/5 text-white/85 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* Results grid */}
      <section className="container py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Filters */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-muted">
              <SlidersHorizontal size={14} /> Filters
            </div>

            <FilterGroup title="Source">
              {SOURCE_OPTIONS.map((opt) => (
                <RadioPill
                  key={opt.key}
                  active={source === opt.key}
                  onClick={() => setSource(opt.key)}
                  label={opt.label}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Date">
              {DATE_OPTIONS.map((opt) => (
                <RadioPill
                  key={opt.key}
                  active={dateRange === opt.key}
                  onClick={() => setDateRange(opt.key)}
                  label={opt.label}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Reliability">
              <p className="text-xs italic text-ss-muted">
                Enabled once AI scoring is wired.
              </p>
            </FilterGroup>
          </aside>

          {/* Results */}
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="text-2xl font-extrabold text-ss-teal">
                {submittedQ ? (
                  <>Results for “{submittedQ}”</>
                ) : (
                  <>Search health &amp; genomics research</>
                )}
              </h1>
              {data && (
                <span className="inline-flex items-center gap-3 text-xs text-ss-muted">
                  <span>
                    Showing {filtered.length} of {data.total} · PubMed: {data.sources?.pubmed ?? 0} · Semantic Scholar: {data.sources?.semanticScholar ?? 0}
                  </span>
                  {analyzing > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ss-privacy-tint px-2.5 py-1 font-semibold text-ss-teal">
                      <Loader2 size={12} className="animate-spin" />
                      Scoring {analyzing} in progress…
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* States */}
            {loading && <SkeletonList />}
            {!loading && error && (
              <div className="flex items-start gap-3 rounded-lg border border-ss-amber/40 bg-white p-4 text-sm text-ss-amber">
                <AlertCircle size={16} className="mt-0.5" />
                <div>
                  <div className="font-semibold">Search error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}
            {!loading && !error && submittedQ && filtered.length === 0 && (
              <div className="rounded-lg border border-ss-border-warm bg-white p-6 text-sm text-ss-muted">
                No results. Try a different query or broaden your filters.
              </div>
            )}
            {!loading && !error && !submittedQ && (
              <div className="rounded-lg border border-dashed border-ss-border-warm bg-white p-8 text-center text-sm text-ss-muted">
                Enter a topic, gene, molecule, or study above to search PubMed and Semantic Scholar.
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {filtered.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-[#0F2C30] py-8 text-white/70">
        <div className="container flex flex-col items-start justify-between gap-4 text-xs md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} SelfScience. Educational only. Not medical advice.</div>
          <nav className="flex gap-5">
            <a href="/about">About</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ss-teal">
        {title}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function RadioPill({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-fit rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-ss-teal text-white'
          : 'bg-white text-ss-text ring-1 ring-ss-border-warm hover:ring-ss-teal'
      }`}
    >
      {label}
    </button>
  )
}

function SkeletonList() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-24 rounded-full bg-ss-border-warm" />
            <div className="h-3 w-10 rounded bg-ss-border-warm" />
          </div>
          <div className="h-5 w-4/5 rounded bg-ss-border-warm" />
          <div className="mt-2 h-3 w-2/5 rounded bg-ss-border-warm" />
          <div className="mt-6 h-3 w-20 rounded-full bg-ss-border-warm" />
          <div className="mt-4 h-3 w-full rounded bg-ss-border-warm" />
          <div className="mt-2 h-3 w-11/12 rounded bg-ss-border-warm" />
          <div className="mt-2 h-3 w-9/12 rounded bg-ss-border-warm" />
          <div className="mt-6 flex gap-4">
            <div className="h-3 w-16 rounded bg-ss-border-warm" />
            <div className="h-3 w-12 rounded bg-ss-border-warm" />
            <div className="h-3 w-14 rounded bg-ss-border-warm" />
          </div>
        </div>
      ))}
    </div>
  )
}
