'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import SiteNav, { PILLARS } from '@/components/site-nav'
import { ResultCard } from '@/components/result-card'
import { trackEvent, EVENTS } from '@/lib/analytics'

const SOURCE_TYPE_OPTIONS = [
  { key: 'all',       label: 'All' },
  { key: 'studies',   label: 'Studies Only' },      // peer-reviewed
  { key: 'preprints', label: 'Preprints' },
  { key: 'editorial', label: 'Editorial' },
]

const DATE_OPTIONS = [
  { key: 'any', label: 'All Time' },
  { key: '2',  label: 'Last 2 Years' },
  { key: '5',  label: 'Last 5 Years' },
  { key: '10', label: 'Last 10 Years' },
]

const RELIABILITY_OPTIONS = [
  { key: 'all',       label: 'All' },
  { key: 'strong',    label: 'Strong+' },
  { key: 'excellent', label: 'Excellent Only' },
]

const PAGE_SIZE = 20

/* -------------------------- localStorage cache ---------------------------- */
/**
 * 7-day cache of {reliability, plain, sections, relatedSearches, flags, funding}
 * keyed by paper id/doi/pmid. Repeat searches for the same paper resolve instantly
 * with no AI call. Keys are hashed via a stable identity function.
 */
const CACHE_KEY_PREFIX = 'ss:analysis:'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const CACHE_VERSION = 3 // bump to invalidate all cached entries after schema change

function cacheKeyFor(item) {
  const raw = item.doi || item.pmid || item.id || (item.title || '').toLowerCase().replace(/\s+/g, ' ').slice(0, 120)
  return raw ? `${CACHE_KEY_PREFIX}${raw}` : null
}

function readCache(item) {
  try {
    const k = cacheKeyFor(item)
    if (!k || typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(k)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (entry?._v !== CACHE_VERSION) return null
    if (!entry?.ts || Date.now() - entry.ts > CACHE_TTL_MS) return null
    return entry.data
  } catch {
    return null
  }
}

function writeCache(item, data) {
  try {
    const k = cacheKeyFor(item)
    if (!k || typeof localStorage === 'undefined') return
    localStorage.setItem(k, JSON.stringify({ _v: CACHE_VERSION, ts: Date.now(), data }))
  } catch {
    /* quota exceeded or storage disabled — non-fatal */
  }
}

/**
 * Analyze a list of items via /api/analyze, capped at `concurrency` in-flight requests.
 * Fires reliability + plain-language in PARALLEL per item (they don't depend on each other).
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

        // Cache hit → resolve instantly without any network call
        const cached = readCache(item)
        if (cached) {
          Promise.resolve().then(() => {
            onResult(item.id, cached)
            inFlight--
            kick()
            next()
          })
          continue
        }

        // Fire both endpoints in PARALLEL — they don't depend on each other.
        // Previously plain-language waited for reliability; that added a full round-trip
        // per item. Now they run simultaneously, ~halving per-item wall time.
        const reliabilityP = fetch('/api/score-reliability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id, doi: item.doi, pmid: item.pmid,
            title: item.title, journal: item.journal,
            year: item.year, source: item.source,
            authorsShort: item.authorsShort, abstract: item.abstract,
          }),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .catch(() => null)

        const plainP = fetch('/api/translate-plain-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            abstract: item.abstract,
            source: item.source,
          }),
        })
          .then((r) => (r.ok ? r.json() : { plain: '', sections: null, relatedSearches: [] }))
          .catch(() => ({ plain: '', sections: null, relatedSearches: [] }))

        Promise.all([reliabilityP, plainP])
          .then(([rel, plainResp]) => {
            if (!rel) {
              onResult(item.id, { _analysisError: true })
              return
            }
            const merged = {
              ...rel,
              plain: plainResp?.plain || '',
              sections: plainResp?.sections || null,
              relatedSearches: plainResp?.relatedSearches || [],
            }
            onResult(item.id, merged)
            writeCache(item, merged)
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

  const [query, setQuery] = useState(initialQ)
  const [submittedQ, setSubmittedQ] = useState(initialQ)
  const [sourceType, setSourceType] = useState('all')
  const [pillar, setPillar] = useState(initialPillar)
  const [dateRange, setDateRange] = useState('any')
  const [reliabilityFilter, setReliabilityFilter] = useState('all')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [analyses, setAnalyses] = useState({})
  const [analyzing, setAnalyzing] = useState(0)
  const [page, setPage] = useState(0)
  const analyzedRef = useRef(new Set()) // ids we've already sent to /analyze

  const runSearch = useCallback(async (q, pill) => {
    if (!q.trim()) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    setAnalyses({})
    setPage(0)
    analyzedRef.current = new Set()
    try {
      const url = new URL('/api/search', window.location.origin)
      url.searchParams.set('q', q)
      url.searchParams.set('limit', '40')
      if (pill) url.searchParams.set('pillar', pill)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message || 'Something went wrong')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (submittedQ) runSearch(submittedQ, pillar)
  }, [submittedQ, pillar, runSearch])

  const submit = (e) => {
    e?.preventDefault?.()
    const q = query.trim()
    if (!q) return
    setSubmittedQ(q)
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      source: 'search_bar',
      has_pillar: !!pillar,
    })
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (pillar) usp.set('pillar', pillar)
    router.replace(`/search?${usp.toString()}`)
  }

  /* --------------------------- Autocomplete ----------------------------- */

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.length < 2 || query === submittedQ) {
      setSuggestions([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true)
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setSuggestions(json.suggestions || [])
      } catch {
        setSuggestions([])
      } finally {
        setSuggestLoading(false)
      }
    }, 220)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [query, submittedQ])

  const chooseSuggestion = (s) => {
    setQuery(s.title)
    setSubmittedQ(s.title)
    setShowSuggestions(false)
    setSuggestions([])
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      source: 'autocomplete',
      has_pillar: !!pillar,
    })
    const usp = new URLSearchParams()
    usp.set('q', s.title)
    if (pillar) usp.set('pillar', pillar)
    router.replace(`/search?${usp.toString()}`)
  }

  /* ----------------------- Filtered & paged view ------------------------ */

  const merged = useMemo(() => {
    if (!data?.results) return []
    return data.results.map((r) => ({ ...r, ...(analyses[r.id] || {}) }))
  }, [data, analyses])

  const filtered = useMemo(() => {
    let list = merged
    // Source-type
    if (sourceType === 'studies')   list = list.filter((r) => r.source === 'peer-reviewed')
    if (sourceType === 'preprints') list = list.filter((r) => r.source === 'preprint')
    if (sourceType === 'editorial') list = list.filter((r) => r.source === 'editorial')
    // Date
    if (dateRange !== 'any') {
      const cutoff = new Date().getFullYear() - parseInt(dateRange, 10)
      list = list.filter((r) => (r.year || 0) >= cutoff)
    }
    // Reliability
    if (reliabilityFilter !== 'all') {
      const min = reliabilityFilter === 'excellent' ? 5 : 4
      list = list.filter((r) => typeof r.reliability === 'number' && r.reliability >= min)
    }
    return list
  }, [merged, sourceType, dateRange, reliabilityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0)
  }, [sourceType, dateRange, reliabilityFilter, pillar, submittedQ])

  // Kick off AI analysis for the visible page (only items not yet analyzed)
  useEffect(() => {
    if (!paged.length) return
    const targets = paged
      .slice(0, 8) // analyze top 8 of the visible page
      .filter((it) => !analyzedRef.current.has(it.id) && !analyses[it.id])
    if (!targets.length) return
    targets.forEach((t) => analyzedRef.current.add(t.id))
    analyzeInPool(
      targets,
      5,
      (id, analysis) => setAnalyses((prev) => ({ ...prev, [id]: analysis })),
      setAnalyzing
    )
  }, [paged, analyses])

  const scoreRest = () => {
    if (!filtered.length) return
    const remaining = paged.filter((it) => !analyzedRef.current.has(it.id))
    if (!remaining.length) return
    remaining.forEach((t) => analyzedRef.current.add(t.id))
    analyzeInPool(
      remaining,
      5,
      (id, analysis) => setAnalyses((prev) => ({ ...prev, [id]: analysis })),
      setAnalyzing
    )
  }

  /* ------------------------------- Render ------------------------------- */

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* Persistent search band */}
      <section className="relative bg-ss-teal pb-10 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <form onSubmit={submit} className="relative mx-auto max-w-4xl">
            <div className="flex items-center overflow-hidden rounded-full bg-white text-ss-text shadow-lg ring-1 ring-black/10">
              <Search className="ml-4 shrink-0 text-ss-muted" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                placeholder="Search PubMed, Semantic Scholar, OpenAlex, Crossref…"
                className="w-full bg-transparent px-3 py-3 text-base placeholder:text-ss-muted focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSuggestions([])
                  }}
                  className="mr-2 rounded-full p-1 text-ss-muted hover:bg-ss-bg"
                  aria-label="Clear"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="m-1.5 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ss-orange-dark"
              >
                Search
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && query.length >= 2 && (suggestions.length > 0 || suggestLoading) && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white text-ss-text shadow-2xl ring-1 ring-black/10">
                {suggestLoading && (
                  <div className="px-4 py-3 text-xs text-ss-muted">
                    <Loader2 size={12} className="mr-1 inline animate-spin" />
                    Searching Semantic Scholar…
                  </div>
                )}
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      chooseSuggestion(s)
                    }}
                    className="flex w-full items-start gap-3 border-t border-ss-border-warm/60 px-4 py-3 text-left transition hover:bg-ss-bg first:border-t-0"
                  >
                    <Search size={14} className="mt-1 shrink-0 text-ss-muted" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ss-teal line-clamp-2">{s.title}</span>
                      {s.authorsShort && (
                        <span className="text-xs text-ss-muted">{s.authorsShort}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Pillar pills */}
          <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-2">
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
                key={p.key}
                type="button"
                onClick={() => setPillar(pillar === p.name ? '' : p.name)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  pillar === p.name
                    ? 'border-ss-orange bg-ss-orange text-white'
                    : 'border-white/25 bg-white/5 text-white/85 hover:bg-white/10'
                }`}
              >
                {p.short}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filter row */}
      <section className="border-b border-ss-border-warm bg-white">
        <div className="container flex flex-wrap items-center gap-4 py-4 text-xs">
          <div className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-ss-muted">
            <SlidersHorizontal size={13} /> Filters
          </div>
          <FilterGroup label="Type" options={SOURCE_TYPE_OPTIONS} value={sourceType} onChange={setSourceType} />
          <FilterGroup label="Date" options={DATE_OPTIONS} value={dateRange} onChange={setDateRange} />
          <FilterGroup label="Reliability" options={RELIABILITY_OPTIONS} value={reliabilityFilter} onChange={setReliabilityFilter} />
        </div>
      </section>

      {/* Results */}
      <section className="container py-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-ss-teal">
            {submittedQ ? <>Results for “{submittedQ}”</> : <>Search health &amp; genomics research</>}
          </h1>
          {data && (
            <span className="inline-flex flex-wrap items-center gap-2 text-xs text-ss-muted">
              <span>{filtered.length} shown</span>
              {data.sources?.pubmed ? <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-ss-border-warm">PubMed {data.sources.pubmed}</span> : null}
              {data.sources?.semanticScholar ? <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-ss-border-warm">Semantic Scholar {data.sources.semanticScholar}</span> : null}
              {data.sources?.openAlex ? <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-ss-border-warm">OpenAlex {data.sources.openAlex}</span> : null}
              {data.sources?.crossref ? <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-ss-border-warm">Crossref {data.sources.crossref}</span> : null}
              {analyzing > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ss-privacy-tint px-2.5 py-1 font-semibold text-ss-teal">
                  <Loader2 size={12} className="animate-spin" />
                  Scoring {analyzing} …
                </span>
              )}
            </span>
          )}
        </div>

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
            No results matching your filters. Try loosening them or a different query.
          </div>
        )}
        {!loading && !error && !submittedQ && (
          <div className="rounded-lg border border-dashed border-ss-border-warm bg-white p-8 text-center text-sm text-ss-muted">
            Enter a topic, gene, molecule, or study above to search PubMed, Semantic Scholar, OpenAlex &amp; Crossref.
          </div>
        )}

        {!loading && !error && paged.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {paged.map((item) => (
                <ResultCard key={item.id} item={item} />
              ))}
            </div>

            {/* Score-rest button (rarely needed if auto-analysis kicks in) */}
            {paged.some((it) => typeof it.reliability !== 'number' && !it._analysisError) && analyzing === 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={scoreRest}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-ss-teal px-5 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
                >
                  Score remaining on this page
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-ss-text ring-1 ring-ss-border-warm disabled:opacity-40 hover:ring-ss-teal"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-8 min-w-8 rounded-full px-3 text-xs font-bold transition ${
                      i === currentPage
                        ? 'bg-ss-teal text-white'
                        : 'bg-white text-ss-muted ring-1 ring-ss-border-warm hover:text-ss-teal'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-ss-text ring-1 ring-ss-border-warm disabled:opacity-40 hover:ring-ss-teal"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="bg-[#0F2C30] py-8 text-white/70">
        <div className="container flex flex-col items-start justify-between gap-4 text-xs md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} SelfScience. Educational only. Not medical advice.</div>
          <nav className="flex gap-5">
            <a href="/about">About</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/reading-list">Reading List</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              value === opt.key
                ? 'bg-ss-teal text-white'
                : 'bg-white text-ss-muted ring-1 ring-ss-border-warm hover:text-ss-teal hover:ring-ss-teal'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
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
        </div>
      ))}
    </div>
  )
}
