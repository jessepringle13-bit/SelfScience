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
import PgxDisclaimer from '@/components/PgxDisclaimer'
import { trackEvent, EVENTS } from '@/lib/analytics'
import { getPillarQuery, isYouthQuery } from '@/lib/pillars'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'

const SOURCE_TYPE_OPTIONS = [
  { key: 'all',       label: 'All' },
  { key: 'studies',   label: 'Studies Only' },      // peer-reviewed
  { key: 'preprints', label: 'Preprints' },
  { key: 'editorial', label: 'Editorial' },
]

const DATE_OPTIONS = [
  // Order matters — the first entry is the visual anchor. We reorder so
  // "Last 10 Years" leads (matches the new default) and "All Time / Historic"
  // remains a clear opt-in for older research.
  { key: '10', label: 'Last 10 Years' },
  { key: '5',  label: 'Last 5 Years' },
  { key: '2',  label: 'Last 2 Years' },
  { key: 'any',label: 'All Time · Include Historic' },
]

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Best match' },
  { key: 'citations', label: 'Most cited' },
  { key: 'newest',    label: 'Newest first' },
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
  // Auto-apply the Youth pillar when the URL query looks pediatric and no
  // pillar was explicitly requested. Same behaviour as `submit()` \u2014 keeps
  // the user's typed text as the search term and layers the pillar on top.
  const rawInitialPillar = params.get('pillar') || ''
  const initialPillar = rawInitialPillar || (isYouthQuery(initialQ) ? 'Pediatric & Youth Wellness' : '')
  // Pillar hand-off from Dashboard: /search?pillar=X&genes=A,B,C carries the
  // user's classified genes for that pillar so we can fan out per-gene queries
  // AND highlight the matches on each result card.
  const initialGenes = useMemo(() => {
    const raw = params.get('genes') || ''
    return raw.split(',').map((g) => g.trim().toUpperCase()).filter(Boolean).slice(0, 12)
  }, [params])
  const isInitialPillarBrowse = !initialQ && !!getPillarQuery(initialPillar)
  const isInitialTextPillar = !!initialQ && !!getPillarQuery(initialPillar)

  const [query, setQuery] = useState(initialQ)
  const [submittedQ, setSubmittedQ] = useState(initialQ)
  const [sourceType, setSourceType] = useState('all')
  const [pillar, setPillar] = useState(initialPillar)
  const [activeGenes, setActiveGenes] = useState(initialGenes)
  // Default date filter: 10 years when any structured hand-off is active
  // (pillar, or pillar+genes, or explicit gene set) — else All Time so
  // "Historic" studies (>10 yrs) remain reachable via the filter.
  // Default date filter behaviour:
  //  · pillar-only or pillar+text search → Last 10 Years (recent focus)
  //  · gene fan-out (activeGenes present) → All Time (narrow queries
  //    surface classic mechanistic papers older than 10 years)
  //  · nothing hand-off → All Time
  const [dateRange, setDateRange] = useState(
    initialGenes.length > 0
      ? 'any'
      : (isInitialPillarBrowse || isInitialTextPillar) ? '10' : 'any'
  )
  const [reliabilityFilter, setReliabilityFilter] = useState('all')
  // For pillar+gene fan-outs we default to Most-Cited so the strongest
  // signals surface first across a mixed round-robin merge.
  const [sortMode, setSortMode] = useState(
    initialGenes.length > 0 ? 'citations' : 'relevance'
  )

  // Genome-loaded state — powers the "Your genes" chip row so a user can
  // dispatch a search for any of their recognised variants without leaving
  // the search page. Reads from sessionStorage and re-hydrates on the
  // selfscience:genome-changed event fired by the genome page + RegenTools.
  const [genomeReport, setGenomeReport] = useState(null)
  useEffect(() => {
    setGenomeReport(getGenomeResults())
    const onChange = () => setGenomeReport(getGenomeResults())
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:genome-changed', onChange)
      return () => window.removeEventListener('selfscience:genome-changed', onChange)
    }
  }, [])

  const yourGenes = useMemo(() => {
    if (!genomeReport) return []
    // De-duplicate gene symbols across all classified cards. We stable-sort
    // "awareness > strengths > neutral" so the chip row leads with findings
    // the user most likely wants to research first.
    const rank = { awareness: 0, strength: 1, positive: 1, neutral: 2 }
    const seen = new Map()
    for (const c of flattenReportCards(genomeReport)) {
      const g = (c.gene || '').trim()
      if (!g || /^rs\d/i.test(g)) continue
      // Split combined gene labels like "MTHFR (C677T)" or "APOE ε3/ε4" into
      // just the primary gene symbol.
      const symbol = g.split(/[\s(/·+,]/)[0].toUpperCase()
      if (!symbol || symbol.length > 12) continue
      const r = rank[c.classification] ?? 3
      const prev = seen.get(symbol)
      if (!prev || r < prev.rank) seen.set(symbol, { symbol, rank: r, classification: c.classification })
    }
    return [...seen.values()].sort((a, b) => a.rank - b.rank || a.symbol.localeCompare(b.symbol))
  }, [genomeReport])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [analyses, setAnalyses] = useState({})
  const [analyzing, setAnalyzing] = useState(0)
  const [page, setPage] = useState(0)
  const analyzedRef = useRef(new Set()) // ids we've already sent to /analyze

  const runSearch = useCallback(async (q, pill, genes = []) => {
    const trimmed = (q || '').trim()
    const pillarQuery = getPillarQuery(pill)
    // Allow pillar-only browse: no user query, but pillar has a curated one.
    if (!trimmed && !pillarQuery && genes.length === 0) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    setAnalyses({})
    setPage(0)
    analyzedRef.current = new Set()
    try {
      let merged = { pubmed: [], semantic_scholar: [], openalex: [], crossref: [] }

      if (genes.length > 0) {
        // Fan-out: fire one /api/search per gene, then round-robin
        // interleave the results across genes for a "healthy mix" instead
        // of grouping all Gene-A hits before Gene-B hits.
        // Cap per-gene fetch so heavy sets (8+ genes) don't overwhelm
        // upstream APIs while still surfacing enough breadth.
        const perGeneLimit = Math.max(5, Math.min(15, Math.floor(60 / genes.length)))
        const anchor = trimmed || pillarQuery || ''
        const requests = genes.map((g) => {
          const url = new URL('/api/search', window.location.origin)
          const qStr = anchor ? `${g} ${anchor}` : g
          url.searchParams.set('q', qStr)
          url.searchParams.set('limit', String(perGeneLimit))
          return fetch(url.toString())
            .then((r) => (r.ok ? r.json() : {}))
            .then((j) => ({ gene: g, results: (j?.results || []), sources: j?.sources || {} }))
            .catch(() => ({ gene: g, results: [], sources: {} }))
        })
        const batches = await Promise.all(requests)

        // Round-robin merge with cross-gene dedupe.
        const seen = new Map() // key -> item (already pushed to interleaved)
        const geneQueues = batches.map(({ gene, results }) => ({
          gene,
          queue: results.map((r) => ({ ...r, _matchedGenes: [gene] })),
        }))
        const interleaved = []
        let progressed = true
        while (progressed) {
          progressed = false
          for (const gq of geneQueues) {
            if (gq.queue.length === 0) continue
            const item = gq.queue.shift()
            progressed = true
            const key = item.doi || item.pmid || item.id || `${item.provider || ''}:${(item.title || '').toLowerCase()}`
            const prev = seen.get(key)
            if (prev) {
              if (!prev._matchedGenes.includes(gq.gene)) prev._matchedGenes.push(gq.gene)
            } else {
              seen.set(key, item)
              interleaved.push(item)
            }
          }
        }

        // Aggregate source counts for the info chips.
        const aggSources = { pubmed: 0, semanticScholar: 0, openAlex: 0, crossref: 0 }
        for (const b of batches) {
          aggSources.pubmed         += b.sources?.pubmed || 0
          aggSources.semanticScholar+= b.sources?.semanticScholar || 0
          aggSources.openAlex       += b.sources?.openAlex || 0
          aggSources.crossref       += b.sources?.crossref || 0
        }

        merged = {
          query: anchor,
          pillar: pill,
          isPillarBrowse: !!pillarQuery,
          isFanout: true,
          total: interleaved.length,
          sources: aggSources,
          results: interleaved,
          _fanoutGenes: genes,
        }
      } else {
        const url = new URL('/api/search', window.location.origin)
        if (trimmed) url.searchParams.set('q', trimmed)
        url.searchParams.set('limit', trimmed ? '40' : '20')
        if (pill) url.searchParams.set('pillar', pill)
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error(`Search failed (${res.status})`)
        merged = await res.json()
      }

      setData(merged)
    } catch (e) {
      setError(e.message || 'Something went wrong')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fire search when we have either a submitted query OR a pillar-browse
    // OR a gene hand-off from the Dashboard.
    if (submittedQ || getPillarQuery(pillar) || activeGenes.length > 0) {
      runSearch(submittedQ, pillar, activeGenes)
    }
  }, [submittedQ, pillar, activeGenes, runSearch])

  const submit = (e) => {
    e?.preventDefault?.()
    const q = query.trim()
    if (!q) return
    setSubmittedQ(q)
    // Auto-apply the Youth pillar when the free-text query looks pediatric
    // (e.g. "children MTHFR", "ADHD genetics", "pediatric nutrition"). We
    // KEEP the user's typed text as the search term and layer the pillar on
    // top so results still match what they actually asked for.
    let effectivePillar = pillar
    if (!effectivePillar && isYouthQuery(q)) {
      effectivePillar = 'Pediatric & Youth Wellness'
      setPillar(effectivePillar)
    }
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      source: 'search_bar',
      has_pillar: !!effectivePillar,
      auto_pillar: !!effectivePillar && !pillar,
    })
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (effectivePillar) usp.set('pillar', effectivePillar)
    router.replace(`/search?${usp.toString()}`)
  }

  /** Toggle a gene in/out of the active cross-reference set. Preserves any
   *  active pillar or query, so users can layer multiple genes and refine
   *  a single fan-out search. When both pillar/query are empty and no
   *  active genes remain after toggling, the results panel clears. */
  const toggleGene = (symbol) => {
    if (!symbol) return
    const upper = symbol.toUpperCase()
    const nextGenes = activeGenes.includes(upper)
      ? activeGenes.filter((g) => g !== upper)
      : [...activeGenes, upper].slice(0, 12)
    setActiveGenes(nextGenes)
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      source: 'your_genes_chip',
      gene: upper,
    })
    // Sync URL so state is bookmark-/shareable.
    const usp = new URLSearchParams()
    if (submittedQ) usp.set('q', submittedQ)
    if (pillar) usp.set('pillar', pillar)
    if (nextGenes.length) usp.set('genes', nextGenes.join(','))
    router.replace(usp.toString() ? `/search?${usp.toString()}` : '/search')
  }

  // Horizontal-scroll carousel plumbing for the "Your Genes" chip row.
  const chipScrollerRef = useRef(null)
  const scrollChips = (dir) => {
    const el = chipScrollerRef.current
    if (!el) return
    const delta = dir === 'left' ? -220 : 220
    el.scrollBy({ left: delta, behavior: 'smooth' })
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
    // Sort — relevance keeps provider order, citations descends by
    // citationCount (missing values treated as 0), newest descends by year.
    if (sortMode === 'citations') {
      list = [...list].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    } else if (sortMode === 'newest') {
      list = [...list].sort((a, b) => (b.year || 0) - (a.year || 0))
    }
    return list
  }, [merged, sourceType, dateRange, reliabilityFilter, sortMode])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0)
  }, [sourceType, dateRange, reliabilityFilter, sortMode, pillar, submittedQ])

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

          {/* "Your genes" chip carousel — appears only when the user has
              an analysed genome in sessionStorage. Chips are toggleable
              (multi-select) and drive the fan-out cross-reference search.
              Horizontal-scroll carousel keeps 40+ genes accessible without
              eating vertical real estate. */}
          {yourGenes.length > 0 && (
            <div className="mx-auto mt-4 max-w-4xl">
              <div className="flex items-center justify-between gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-ss-orange" />
                  <span>
                    Your genome · tap to cross-reference
                    {activeGenes.length > 0 && (
                      <span className="ml-2 rounded-full bg-ss-orange px-2 py-0.5 text-[9px] font-bold tracking-widest text-white">
                        {activeGenes.length} selected
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] normal-case tracking-normal text-white/50">
                  {yourGenes.length} recognised
                </span>
              </div>
              <div className="relative mt-2">
                {/* Left / right scroll affordances (desktop only) */}
                <button
                  type="button"
                  onClick={() => scrollChips('left')}
                  aria-label="Scroll gene chips left"
                  className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-1.5 text-ss-teal shadow-md ring-1 ring-black/10 transition hover:bg-white md:inline-flex"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollChips('right')}
                  aria-label="Scroll gene chips right"
                  className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-1.5 text-ss-teal shadow-md ring-1 ring-black/10 transition hover:bg-white md:inline-flex"
                >
                  <ChevronRight size={14} />
                </button>

                <div
                  ref={chipScrollerRef}
                  className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-1 pb-2 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {yourGenes.map(({ symbol, classification }) => {
                    const isSelected = activeGenes.includes(symbol)
                    const base = 'shrink-0 snap-start rounded-full border px-3 py-1 font-mono text-xs font-semibold tracking-wider transition'
                    let cls
                    if (isSelected) {
                      // Selected → solid orange highlight regardless of classification
                      cls = 'border-ss-orange bg-ss-orange text-white shadow-md ring-2 ring-white/40'
                    } else if (classification === 'awareness') {
                      cls = 'border-ss-amber/70 bg-white/5 text-ss-amber hover:bg-ss-amber hover:text-white'
                    } else if (classification === 'strength' || classification === 'positive') {
                      cls = 'border-ss-green/70 bg-white/5 text-ss-green hover:bg-ss-green hover:text-white'
                    } else {
                      cls = 'border-white/25 bg-white/5 text-white/85 hover:bg-white/15'
                    }
                    return (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => toggleGene(symbol)}
                        className={`${base} ${cls}`}
                        title={
                          isSelected
                            ? `Remove ${symbol} from cross-reference`
                            : `Add ${symbol} to cross-reference`
                        }
                        aria-pressed={isSelected}
                      >
                        {symbol}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
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
          <FilterGroup label="Sort" options={SORT_OPTIONS} value={sortMode} onChange={setSortMode} />
          <FilterGroup label="Reliability" options={RELIABILITY_OPTIONS} value={reliabilityFilter} onChange={setReliabilityFilter} />
        </div>
      </section>

      {/* Results */}
      <section className="container py-8">
        {/* PGx-specific safety disclaimer when the active pillar filter is
            Pharmacogenomics — mirrors the same banner on the genome results
            and drug checker pages so users see it wherever PGx content
            surfaces. */}
        {pillar === 'Pharmacogenomics' && <PgxDisclaimer />}
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-ss-teal">
            {data?.isPillarBrowse && pillar
              ? <>Latest research on <span className="text-ss-orange">{pillar}</span></>
              : data?.isTextPillar && pillar && submittedQ
                ? <>&ldquo;{submittedQ}&rdquo; in <span className="text-ss-orange">{pillar}</span> <span className="text-sm font-medium text-ss-muted">· last 5 years</span></>
                : submittedQ
                  ? <>Results for &ldquo;{submittedQ}&rdquo;</>
                  : <>Search health &amp; genomics research</>}
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

        {/* Cross-referencing banner — visible when the search was launched
            from a Dashboard pillar tile with the user's genes attached, or
            any time activeGenes are set. Chips are removable so the user
            can narrow the fan-out. */}
        {activeGenes.length > 0 && (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-orange">
                Cross-referencing {pillar || 'your search'} with
              </span>
              {activeGenes.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGene(g)}
                  className="group inline-flex items-center gap-1 rounded-full bg-ss-orange/15 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ss-orange transition hover:bg-ss-orange hover:text-white"
                  title={`Remove ${g} from cross-reference`}
                >
                  {g}
                  <span className="text-[10px] opacity-60 group-hover:opacity-100">×</span>
                </button>
              ))}
              {activeGenes.length > 1 && (
                <button
                  onClick={() => {
                    setActiveGenes([])
                    const usp = new URLSearchParams()
                    if (submittedQ) usp.set('q', submittedQ)
                    if (pillar) usp.set('pillar', pillar)
                    router.replace(usp.toString() ? `/search?${usp.toString()}` : '/search')
                  }}
                  className="ml-1 text-[11px] font-semibold text-ss-muted hover:text-ss-teal"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-ss-muted">
              Each result is scored against these genes — matching genes are highlighted{' '}
              <span className="rounded bg-ss-orange/20 px-1 font-mono font-bold text-ss-orange">like this</span>{' '}
              in the title and shown as chips on the card.
            </p>
          </div>
        )}

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
        {!loading && !error && (submittedQ || data?.isPillarBrowse || activeGenes.length > 0) && filtered.length === 0 && (
          <div className="rounded-lg border border-ss-border-warm bg-white p-6 text-sm text-ss-muted">
            No results matching your filters. Try loosening them or a different query.
          </div>
        )}
        {!loading && !error && !submittedQ && !data?.isPillarBrowse && activeGenes.length === 0 && (
          <div className="rounded-lg border border-dashed border-ss-border-warm bg-white p-8 text-center text-sm text-ss-muted">
            Enter a topic, gene, molecule, or study above to search PubMed, Semantic Scholar, OpenAlex &amp; Crossref.
          </div>
        )}

        {!loading && !error && paged.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {paged.map((item) => (
                <ResultCard key={item.id} item={item} highlightGenes={activeGenes} />
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
