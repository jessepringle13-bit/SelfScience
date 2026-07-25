'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search as SearchIcon,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react'
import SiteNav, { PILLARS } from '@/components/site-nav'
import { ResultCard } from '@/components/result-card'
import ClinicalTrialsSection from '@/components/search/ClinicalTrialsSection'
import { EditorialPicks } from '@/components/editorial-picks'
import PgxDisclaimer from '@/components/PgxDisclaimer'
import { trackEvent, EVENTS } from '@/lib/analytics'
import { getPillarQuery, isYouthQuery, normalizePillarName } from '@/lib/pillars'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { fireGuideAction, GUIDE_ACTIONS } from '@/lib/guideActions'
import FirstVisitBanner from '@/components/FirstVisitBanner'
import SearchPrompts from '@/components/search/SearchPrompts'

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
// v4 (2026-07) — added `plainTitle` to the plain-language response schema.
// Older v3 entries still parse but will re-fetch to pick up the new field.
const CACHE_VERSION = 4

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
 * Fetch with retries. Retries only on 5xx and network errors (not on 4xx
 * client-side rejections which are permanent). Exponential backoff:
 * attempt 1 immediately, attempt 2 after 800ms, attempt 3 after 1600ms.
 * Returns parsed JSON on success or `null` after all attempts fail.
 */
async function fetchWithRetry(url, opts, { attempts = 3 } = {}) {
  let lastErr = null
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, opts)
      if (res.ok) return await res.json()
      // 4xx (except 429): don't retry — it's a permanent client error.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return null
      }
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastErr = err
    }
    if (i < attempts - 1) {
      // Backoff: 800ms, 1600ms
      await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
  if (lastErr && typeof console !== 'undefined') {
    console.warn('[fetchWithRetry] gave up after', attempts, 'attempts:', lastErr.message)
  }
  return null
}

/**
 * Analyze a list of items via /api/analyze, capped at `concurrency` in-flight requests.
 * Fires reliability + plain-language in PARALLEL per item (they don't depend on each other).
 *
 * Behaviour (2026-07 tightening):
 *   * Concurrency capped at 3 (was 5) — prevents the LLM-side rate-limit
 *     cascade that produced "Score unavailable" for entire pages.
 *   * Each network call retries up to 3 attempts with exponential backoff
 *     before the item is marked as analysis-failed.
 *   * Items that hit the analysis-failed branch do NOT overwrite a previous
 *     good score if one exists (the merger honours the earliest successful
 *     write via analyzedRef).
 */
async function analyzeInPool(items, concurrency, onResult, onCount) {
  // Hard-cap the caller's concurrency to protect the LLM budget. Callers
  // used to pass 5; we now clamp to 3 regardless.
  const cap = Math.min(concurrency, 3)
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
      while (inFlight < cap && queue.length > 0) {
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
        // Each has its own retry envelope so a transient blip on ONE endpoint
        // doesn't force the other to redo work.
        const reliabilityP = fetchWithRetry(
          '/api/score-reliability',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.id, doi: item.doi, pmid: item.pmid,
              title: item.title, journal: item.journal,
              year: item.year, source: item.source,
              authorsShort: item.authorsShort, abstract: item.abstract,
            }),
          },
          { attempts: 3 },
        )

        const plainP = fetchWithRetry(
          '/api/translate-plain-language',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: item.title,
              abstract: item.abstract,
              source: item.source,
            }),
          },
          { attempts: 3 },
        ).then((j) => j || { plain: '', plainTitle: '', sections: null, relatedSearches: [] })

        Promise.all([reliabilityP, plainP])
          .then(([rel, plainResp]) => {
            if (!rel) {
              onResult(item.id, { _analysisError: true })
              return
            }
            const merged = {
              ...rel,
              plain: plainResp?.plain || '',
              plainTitle: plainResp?.plainTitle || '',
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
  const initialPillar = rawInitialPillar || (isYouthQuery(initialQ) ? 'Developmental & Lifespan Wellness' : '')
  // Pillar hand-off from Dashboard: /search?pillar=X&genes=A,B,C carries the
  // user's classified genes for that pillar so we can fan out per-gene queries
  // AND highlight the matches on each result card.
  const initialGenes = useMemo(() => {
    const raw = params.get('genes') || ''
    return raw.split(',').map((g) => g.trim().toUpperCase()).filter(Boolean).slice(0, 12)
  }, [params])
  const isInitialPillarBrowse = !initialQ && !!getPillarQuery(initialPillar)
  const isInitialTextPillar = !!initialQ && !!getPillarQuery(initialPillar)

  // Deep-link controls for the ClinicalTrials section (from Dashboard gene
  // chip popovers). openTrials=1 auto-expands the section and scrolls it
  // into view once the search completes. trialStatus=recruiting narrows
  // the visible cards to actively-enrolling studies.
  const openTrialsFromUrl = (params.get('openTrials') || '') === '1'
  const trialStatusFromUrl = (params.get('trialStatus') || '').toLowerCase() || null
  const [autoScrolledTrials, setAutoScrolledTrials] = useState(false)

  const [query, setQuery] = useState(initialQ)
  const [submittedQ, setSubmittedQ] = useState(initialQ)
  const [sourceType, setSourceType] = useState('all')
  const [pillar, setPillar] = useState(initialPillar)
  // Keep the URL's ?pillar= query param in sync with the local state so that
  // (a) the shared usePillarFilter() hook on Dashboard/Genome picks up the
  // same selection, (b) sharing the URL preserves the pillar, and (c) the
  // browser Back button acts as an undo for the pillar filter. We use
  // replace (not push) so a series of pillar toggles doesn't clutter the
  // history stack.
  //
  // We ALSO clear activeGenes whenever the pillar CHANGES (not on first
  // mount): a gene selected under one pillar is almost never relevant to
  // the new pillar's context, and leaving it selected caused a confusing
  // "why are these old genes still highlighted?" UX bug (reported by user).
  const prevPillarRef = useRef(initialPillar)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const usp = new URLSearchParams(window.location.search)
    const current = usp.get('pillar') || ''
    if (current !== pillar) {
      if (pillar) usp.set('pillar', pillar)
      else usp.delete('pillar')
    }
    // Clear any previously-selected gene chips when the pillar actually
    // transitions to a different value. Skip on first mount (prevPillar
    // is set from the URL, so it starts equal to `pillar`).
    if (prevPillarRef.current !== pillar) {
      prevPillarRef.current = pillar
      setActiveGenes([])
      usp.delete('genes')
    }
    const qs = usp.toString()
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState({}, '', next)
    }
  }, [pillar])
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
  // Hide-animal-and-in-vitro toggle (2026-07). Reads from the LLM-scored
  // reliability `flags` array. Studies still analyzing (no flags yet) are
  // never hidden — nothing gets silently removed while scoring is in flight.
  const [hideNonHuman, setHideNonHuman] = useState(false)
  // Smart Search toggle — enables the semantic expansion + rerank layer.
  // Default ON. Persisted to localStorage so the user's preference sticks
  // across sessions.
  const [smartSearch, setSmartSearch] = useState(() => {
    if (typeof window === 'undefined') return true
    const v = window.localStorage.getItem('ss:smart-search')
    return v === null ? true : v === '1'
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('ss:smart-search', smartSearch ? '1' : '0')
  }, [smartSearch])
  // Ref mirror of smartSearch so the memoized runSearch (deps: []) reads
  // the latest value without needing to be re-created on every toggle.
  const smartSearchRef = useRef(smartSearch)
  useEffect(() => { smartSearchRef.current = smartSearch }, [smartSearch])
  // Recency toggle — "Last 5y" (default) vs "All time". Weights recent
  // research higher by narrowing the date range unless the user opts out.
  const [recentOnly, setRecentOnly] = useState(true)
  // Semantic rerank state — order of ids (or null) + a "refining" indicator
  // shown while the LLM re-rank is in flight.
  const [semanticOrder, setSemanticOrder] = useState(null)
  const [refining, setRefining] = useState(false)
  // Sibling state for the derived expansion terms (shown as a subtle strip
  // above the results so users understand why extra papers appear).
  const [semanticExpansions, setSemanticExpansions] = useState([])
  // Evidence-tier multi-select filter (new, 2026-07). Set of tier keys:
  // { 'strong' | 'moderate' | 'limited' }. Empty = all tiers shown.
  // Studies still analyzing (no numeric score) are always visible so the
  // filter never hides work-in-progress cards.
  const [evidenceTiers, setEvidenceTiers] = useState(() => new Set())
  const toggleEvidenceTier = useCallback((key) => {
    setEvidenceTiers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
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
    // When a pillar is active we ONLY surface genes tagged with that pillar
    // (via the classifier's `.pillar` field, normalised so classifier names
    // like "Brain & Neurochemistry" map to canonical UI PILLARS).
    const rank = { awareness: 0, strength: 1, positive: 1, neutral: 2 }
    const seen = new Map()
    for (const c of flattenReportCards(genomeReport)) {
      const g = (c.gene || '').trim()
      if (!g || /^rs\d/i.test(g)) continue
      if (pillar) {
        const norm = normalizePillarName((c.pillar || '').trim())
        if (norm !== pillar) continue
      }
      // Split combined gene labels like "MTHFR (C677T)" or "APOE ε3/ε4" into
      // just the primary gene symbol.
      const symbol = g.split(/[\s(/·+,]/)[0].toUpperCase()
      if (!symbol || symbol.length > 12) continue
      const r = rank[c.classification] ?? 3
      const prev = seen.get(symbol)
      if (!prev || r < prev.rank) seen.set(symbol, { symbol, rank: r, classification: c.classification })
    }
    return [...seen.values()].sort((a, b) => a.rank - b.rank || a.symbol.localeCompare(b.symbol))
  }, [genomeReport, pillar])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [analyses, setAnalyses] = useState({})
  const [analyzing, setAnalyzing] = useState(0)
  const [page, setPage] = useState(0)
  const analyzedRef = useRef(new Set()) // ids we've already sent to /analyze

  // Auto-scroll to the Clinical Trials section when the user arrives via a
  // Dashboard gene-chip deep-link (?openTrials=1). Fires once, only after
  // the results have loaded and trials are available in the payload.
  useEffect(() => {
    if (!openTrialsFromUrl || autoScrolledTrials) return
    if (loading) return
    const trials = data?.clinicalTrials
    if (!Array.isArray(trials) || trials.length === 0) return
    // Wait a tick for the section to render, then scroll.
    const t = setTimeout(() => {
      if (typeof document === 'undefined') return
      const el = document.getElementById('clinical-trials-section')
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setAutoScrolledTrials(true)
    }, 100)
    return () => clearTimeout(t)
  }, [openTrialsFromUrl, autoScrolledTrials, loading, data])

  const runSearch = useCallback(async (q, pill, genes = []) => {
    const trimmed = (q || '').trim()
    const pillarQuery = getPillarQuery(pill)
    // Allow pillar-only browse: no user query, but pillar has a curated one.
    if (!trimmed && !pillarQuery && genes.length === 0) {
      setData(null)
      return
    }
    // Journey Guide Tier 2 — a real search was fired.
    try { fireGuideAction(GUIDE_ACTIONS.SEARCH) } catch {}
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
        // Fan-out: 100 total budget across genes, min 10 per gene, max 30
        // per gene. With 3 genes we hit 30/30/30; with 10 genes we hit
        // 10/10/10/10... which keeps each side ~40-80 items in the pool.
        const perGeneLimit = Math.max(10, Math.min(30, Math.floor(100 / genes.length)))
        // IMPORTANT: send ONLY the gene (+ any user text) as q, and pass
        // the pillar name as a separate param. This lets the server's
        // isTextPillar branch inject the curated pillar tokens into the
        // upstream API query for topical recall, WITHOUT them counting as
        // required tokens in the relevance filter. Previously we packed
        // the pillar query text into q (e.g. "COMT depression
        // neurotransmitter") which caused the 3-token relevance filter to
        // drop any paper that didn't mention every pillar keyword \u2014
        // silently cutting recall for the Dashboard pillar hand-off by ~80%.
        const requests = genes.map((g) => {
          const url = new URL('/api/search', window.location.origin)
          const qStr = trimmed ? `${g} ${trimmed}` : g
          url.searchParams.set('q', qStr)
          url.searchParams.set('limit', String(perGeneLimit))
          if (pill) url.searchParams.set('pillar', pill)
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
          query: trimmed || pillarQuery || '',
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
        // Ask for 80 up front so infinite-scroll (40 initial + 20/batch)
        // has real headroom without another network round-trip.
        url.searchParams.set('limit', trimmed ? '80' : '40')
        if (pill) url.searchParams.set('pillar', pill)
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error(`Search failed (${res.status})`)
        merged = await res.json()
      }

      setData(merged)

      // ==== Semantic Search layer (Option C: expansion + rerank) ====
      // Only fires when Smart Search is ON, we have a real text query, and
      // there are enough results to make reranking worthwhile.
      if (smartSearchRef.current && trimmed && Array.isArray(merged?.results) && merged.results.length >= 4) {
        try {
          // Try the cache first (24h TTL keyed by normalised query).
          const normQ = trimmed.toLowerCase().trim()
          const cacheKey = `ss:sem-expand:${normQ}`
          let expansions = null
          try {
            const cached = window.localStorage.getItem(cacheKey)
            if (cached) {
              const parsed = JSON.parse(cached)
              if (parsed?.expiresAt > Date.now() && Array.isArray(parsed.expansions)) {
                expansions = parsed.expansions
              }
            }
          } catch { /* corrupt cache — refetch */ }

          if (!expansions) {
            const expRes = await fetch('/api/semantic-expand', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: trimmed }),
            }).then((r) => (r.ok ? r.json() : { expansions: [] }))
            expansions = expRes?.expansions || []
            try {
              window.localStorage.setItem(cacheKey, JSON.stringify({
                expansions,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
              }))
            } catch { /* quota — skip cache */ }
          }
          setSemanticExpansions(expansions)

          // Fire off expansion queries in parallel (non-blocking — user
          // already sees initial results). Merge new hits into the pool.
          if (expansions.length > 0) {
            setRefining(true)
            Promise.all(
              expansions.map((term) => {
                const u = new URL('/api/search', window.location.origin)
                u.searchParams.set('q', term)
                u.searchParams.set('limit', '20')
                return fetch(u.toString())
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null)
              }),
            ).then((responses) => {
              const extra = []
              for (const r of responses) {
                if (r?.results?.length) extra.push(...r.results)
              }
              if (extra.length) {
                setData((prev) => {
                  if (!prev) return prev
                  const existing = new Set((prev.results || []).map((x) => x.id))
                  const uniques = extra.filter((x) => !existing.has(x.id))
                  return { ...prev, results: [...prev.results, ...uniques] }
                })
              }
            })
          }

          // Rerank pass — reorder the initial + expansion pool by semantic
          // relevance. Cache-key includes the query so different queries
          // don't collide.
          const rerankCacheKey = `ss:sem-rerank:${normQ}`
          let rerankOrder = null
          try {
            const cached = window.localStorage.getItem(rerankCacheKey)
            if (cached) {
              const parsed = JSON.parse(cached)
              if (parsed?.expiresAt > Date.now() && Array.isArray(parsed.order)) {
                rerankOrder = parsed.order
              }
            }
          } catch { /* corrupt — refetch */ }

          if (!rerankOrder) {
            // Wait ~1s so expansion results have a chance to merge into `data`
            // before we send them to the reranker.
            await new Promise((r) => setTimeout(r, 1200))
            // Snapshot current merged pool
            const snapshot = (window.__ssLatestResults || merged.results)
              .slice(0, 40)
              .map((it) => ({ id: it.id, title: it.title, journal: it.journal, year: it.year }))
            const rr = await fetch('/api/semantic-rerank', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: trimmed, items: snapshot }),
            }).then((r) => (r.ok ? r.json() : { order: null }))
            rerankOrder = rr?.order || null
            if (rerankOrder) {
              try {
                window.localStorage.setItem(rerankCacheKey, JSON.stringify({
                  order: rerankOrder,
                  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                }))
              } catch { /* quota */ }
            }
          }
          if (rerankOrder) setSemanticOrder(rerankOrder)
        } catch (semErr) {
          console.warn('[smart search] failed silently:', semErr?.message)
        } finally {
          setRefining(false)
        }
      }
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
      effectivePillar = 'Developmental & Lifespan Wellness'
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
  // Mobile sticky chip bar: collapsed by default so it only takes one
  // pill of vertical space at 375 px. Tap the pill to reveal the full
  // gene list.
  const [stickyChipsOpen, setStickyChipsOpen] = useState(false)
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
    // Evidence-tier multi-select (Strong / Moderate / Limited). Items that
    // haven't finished analysis (no numeric score) are always kept in the
    // list so nothing is silently hidden while the AI catches up.
    if (evidenceTiers.size > 0) {
      list = list.filter((r) => {
        if (typeof r.reliability !== 'number' || r.reliability <= 0) return true
        const tier = r.reliability >= 4 ? 'strong' : r.reliability === 3 ? 'moderate' : 'limited'
        return evidenceTiers.has(tier)
      })
    }
    // Hide animal / in-vitro studies when toggled. We check the LLM-scored
    // flags array for label matches: "Animal Study", "In-Vitro Study",
    // "Cell Study", etc. If flags haven't been populated yet (scoring
    // still in flight), we leave the item visible.
    if (hideNonHuman) {
      list = list.filter((r) => {
        if (!Array.isArray(r.flags) || r.flags.length === 0) return true
        return !r.flags.some((f) => /animal|in.?vitro|cell study|mouse|rat|mice/i.test(f?.label || ''))
      })
    }
    // Sort — relevance keeps provider order, citations descends by
    // citationCount (missing values treated as 0), newest descends by year.
    if (sortMode === 'citations') {
      list = [...list].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    } else if (sortMode === 'newest') {
      list = [...list].sort((a, b) => (b.year || 0) - (a.year || 0))
    }
    // Recency weighting — when recentOnly is ON we filter to last 5 years.
    // Studies without a year (some Crossref/Semantic Scholar records) are
    // ALWAYS kept so we never drop metadata-poor but relevant papers.
    if (recentOnly && sortMode !== 'newest') {
      const cutoff = new Date().getFullYear() - 5
      list = list.filter((r) => !r.year || r.year >= cutoff)
    }
    // Semantic reorder — if the LLM returned an ordering, apply it. Items
    // not in the ordering (from expansion queries that arrived after the
    // reranker snapshot) are appended in their existing order.
    if (semanticOrder && semanticOrder.length) {
      const rankMap = new Map(semanticOrder.map((id, i) => [id, i]))
      list = [...list].sort((a, b) => {
        const ra = rankMap.has(a.id) ? rankMap.get(a.id) : 1e9
        const rb = rankMap.has(b.id) ? rankMap.get(b.id) : 1e9
        return ra - rb
      })
    }
    return list
  }, [merged, sourceType, dateRange, reliabilityFilter, evidenceTiers, hideNonHuman, sortMode, recentOnly, semanticOrder])

  // Infinite-scroll cursor. Starts at INITIAL_BATCH (40), grows by PAGE_SIZE
  // (20) each time the sentinel below the last card scrolls into view.
  // Reset whenever filters or the query change so the user always starts at
  // the top of a fresh result set.
  const INITIAL_BATCH = 40
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH)
  const paged = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  // Reset visible count when filters/query change.
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH)
  }, [sourceType, dateRange, reliabilityFilter, evidenceTiers, hideNonHuman, sortMode, pillar, submittedQ])

  // IntersectionObserver-based auto-loader. Triggers when a sentinel ~80%
  // down the current results list becomes visible.
  const loadSentinelRef = useRef(null)
  useEffect(() => {
    if (!hasMore) return
    const el = loadSentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((n) => Math.min(filtered.length, n + PAGE_SIZE))
        }
      },
      { rootMargin: '400px 0px 400px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, filtered.length])

  // Kick off AI analysis for the visible page. We now analyze the FULL
  // initial batch (40) instead of just the top 8 — with concurrency capped
  // at 3 and per-endpoint retries, this stays inside the LLM budget while
  // eliminating the "Score unavailable" state that appeared when 40 cards
  // were visible but only 8 were ever scored.
  useEffect(() => {
    if (!paged.length) return
    const targets = paged
      .filter((it) => !analyzedRef.current.has(it.id) && !analyses[it.id])
    if (!targets.length) return
    targets.forEach((t) => analyzedRef.current.add(t.id))
    analyzeInPool(
      targets,
      3,
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
      3,
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
              <SearchIcon className="ml-4 shrink-0 text-ss-muted" size={18} />
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
                    <SearchIcon size={14} className="mt-1 shrink-0 text-ss-muted" />
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

          {/* Gene chip bar was previously here. It is now rendered as its
              own sticky section below the hero (Section 4 spec) so the
              chips remain visible while the user scrolls through
              results. */}
        </div>
      </section>

      {/* "You might be wondering..." pre-built question chips.
          Only shows when the search box is empty AND no search has
          been submitted — hides the moment the user types. Additive:
          nothing below (gene chips, filter pills, results) is
          touched. */}
      <section className="border-b border-ss-border-warm bg-ss-surface" aria-label="Suggested questions">
        <div className="container py-5 md:py-6">
          <SearchPrompts
            genomeReport={genomeReport}
            hasQuery={query.length > 0 || submittedQ.length > 0}
            onPick={(q) => {
              setQuery(q)
              setSubmittedQ(q)
              setShowSuggestions(false)
            }}
          />
        </div>
      </section>

      {/* Sticky Gene Chip Bar \u2014 Section 4 spec. Lives outside the hero so
          it stays visible below the fixed nav as the user scrolls. On
          mobile it collapses into a single "Genome filter" pill that
          expands on tap; on md+ the full carousel is always visible. */}
      {yourGenes.length > 0 && (
        <section
          className="sticky top-16 z-30 border-b border-ss-border-warm bg-white/95 backdrop-blur shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          aria-label="Genome filter"
        >
          <div className="container py-2 md:py-3">
            {/* MOBILE: single pill + expand toggle */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setStickyChipsOpen((v) => !v)}
                aria-expanded={stickyChipsOpen}
                aria-controls="sticky-gene-chips-mobile"
                className="flex w-full items-center justify-between gap-2 rounded-full border border-ss-teal/40 bg-white px-3 py-1.5 text-[11px] font-semibold text-ss-teal shadow-sm"
              >
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-ss-orange" />
                  Genome filter:{' '}
                  <strong className="font-bold">
                    {activeGenes.length === 0
                      ? 'All genes'
                      : activeGenes.length === 1
                        ? activeGenes[0]
                        : `${activeGenes.length} selected`}
                  </strong>
                </span>
                <ChevronDown size={13} className={`shrink-0 transition ${stickyChipsOpen ? 'rotate-180' : ''}`} />
              </button>
              {stickyChipsOpen && (
                <div id="sticky-gene-chips-mobile" className="mt-2 -mx-2 overflow-x-auto px-2 pb-1">
                  <div className="flex snap-x snap-mandatory gap-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                    {yourGenes.map(({ symbol, classification }) => {
                      const isSelected = activeGenes.includes(symbol)
                      let cls
                      if (isSelected) cls = 'border-ss-orange bg-ss-orange text-white'
                      else if (classification === 'awareness') cls = 'border-ss-amber/60 bg-white text-ss-amber'
                      else if (classification === 'strength' || classification === 'positive') cls = 'border-ss-green/60 bg-white text-ss-green'
                      else cls = 'border-ss-border-warm bg-white text-ss-teal'
                      return (
                        <button
                          key={symbol}
                          type="button"
                          onClick={() => toggleGene(symbol)}
                          className={`shrink-0 snap-start rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tracking-wider transition ${cls}`}
                          aria-pressed={isSelected}
                        >
                          {symbol}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* DESKTOP: full carousel */}
            <div className="hidden md:block">
              {pillar && (
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-ss-muted">
                  <span>
                    Showing genes relevant to:{' '}
                    <strong className="font-bold text-ss-teal">
                      {PILLARS.find((p) => p.name === pillar)?.short || pillar}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPillar('')}
                    className="rounded-full border border-ss-border-warm px-2 py-0.5 text-[10px] font-semibold text-ss-teal hover:bg-ss-bg"
                  >
                    Show all
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-ss-orange" />
                  <span>
                    Your genome \u00b7 tap to cross-reference
                    {activeGenes.length > 0 && (
                      <span className="ml-2 rounded-full bg-ss-orange px-2 py-0.5 text-[9px] font-bold tracking-widest text-white">
                        {activeGenes.length} selected
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] normal-case tracking-normal text-ss-muted/70">
                  {yourGenes.length} recognised
                </span>
              </div>
              <div className="relative mt-1.5">
                <button
                  type="button"
                  onClick={() => scrollChips('left')}
                  aria-label="Scroll gene chips left"
                  className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-1.5 text-ss-teal shadow-md ring-1 ring-black/10 transition hover:bg-ss-bg md:inline-flex"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollChips('right')}
                  aria-label="Scroll gene chips right"
                  className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-1.5 text-ss-teal shadow-md ring-1 ring-black/10 transition hover:bg-ss-bg md:inline-flex"
                >
                  <ChevronRight size={14} />
                </button>
                <div
                  ref={chipScrollerRef}
                  className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-1 pb-1 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {yourGenes.map(({ symbol, classification }) => {
                    const isSelected = activeGenes.includes(symbol)
                    const base = 'shrink-0 snap-start rounded-full border px-3 py-1 font-mono text-xs font-semibold tracking-wider transition'
                    let cls
                    if (isSelected) cls = 'border-ss-orange bg-ss-orange text-white shadow ring-2 ring-ss-orange/20'
                    else if (classification === 'awareness') cls = 'border-ss-amber/60 bg-white text-ss-amber hover:bg-ss-amber hover:text-white'
                    else if (classification === 'strength' || classification === 'positive') cls = 'border-ss-green/60 bg-white text-ss-green hover:bg-ss-green hover:text-white'
                    else cls = 'border-ss-border-warm bg-white text-ss-teal hover:bg-ss-bg'
                    return (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => toggleGene(symbol)}
                        className={`${base} ${cls}`}
                        title={isSelected ? `Remove ${symbol}` : `Add ${symbol} to cross-reference`}
                        aria-pressed={isSelected}
                      >
                        {symbol}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
        <FirstVisitBanner
          storageKey="ss_visited_search"
          Icon={SearchIcon}
          text="Try typing a health topic — or tap one of your gene chips to search research matched to your DNA."
          buttonText="Search MTHFR →"
          onAction={() => {
            setQuery('MTHFR methylation')
            setSubmittedQ('MTHFR methylation')
            runSearch('MTHFR methylation', pillar, activeGenes)
          }}
          ariaLabel="First visit tip on Search — dismiss"
        />
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
            {/* Editorial Picks (Supabase) \u2014 above external results.
                Fetches in parallel; hides itself if there are no matches. */}
            <EditorialPicks query={submittedQ} pillar={pillar} />

            {/* Clinical Trials — collapsible section above literature.
                ALWAYS present when trials exist, so users know research is
                happening RIGHT NOW even if they don't need to enroll.
                Recruiting trials get a green left-border accent + a
                "potentially enrolling" note. Every card carries an add-to-
                practitioner-report button and a genome-relevance tag when
                a matched gene is in the user's variants. Section is
                collapsible with a count badge so a page with 20 trials
                doesn't overwhelm the literature below. Zero-result state
                skips rendering entirely. */}
            {Array.isArray(data?.clinicalTrials) && data.clinicalTrials.length > 0 && (
              <ClinicalTrialsSection
                trials={data.clinicalTrials}
                query={submittedQ || pillar || 'your query'}
                userGenes={activeGenes}
                defaultOpen={openTrialsFromUrl}
                statusFilter={trialStatusFromUrl}
              />
            )}

            {/* Evidence tier quick-filter (Strong / Moderate / Limited).
                Multi-select. Active pills are teal-filled; inactive are
                outlined. Studies still analyzing bypass this filter. */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-ss-muted">
                Evidence
              </span>
              {[
                { key: 'strong',   label: 'Strong',   dot: 'bg-ss-green' },
                { key: 'moderate', label: 'Moderate', dot: 'bg-ss-amber' },
                { key: 'limited',  label: 'Limited',  dot: 'bg-[#c2513a]' },
              ].map((t) => {
                const active = evidenceTiers.has(t.key)
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleEvidenceTier(t.key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-ss-teal bg-ss-teal text-white shadow-sm'
                        : 'border-ss-border-warm bg-white text-ss-muted hover:border-ss-teal hover:text-ss-teal'
                    }`}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full ${t.dot}`} />
                    {t.label}
                  </button>
                )
              })}
              {evidenceTiers.size > 0 && (
                <button
                  type="button"
                  onClick={() => setEvidenceTiers(new Set())}
                  className="ml-1 text-[11px] font-semibold text-ss-muted underline hover:text-ss-teal"
                >
                  Clear
                </button>
              )}

              {/* Hide animal / in-vitro filter \u2014 checks the reliability
                  flags array populated by the LLM scorer. Studies still
                  analyzing (no flags yet) are never hidden. */}
              <label className="ml-3 inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-ss-muted">
                <input
                  type="checkbox"
                  checked={hideNonHuman}
                  onChange={(e) => setHideNonHuman(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ss-teal"
                />
                Hide animal / in-vitro
              </label>

              {/* Section 4 spec: promote "Last 5y" and "Smart Search" from
                  checkbox rows into proper toggle pills matching the
                  evidence-tier + filter chip aesthetic above. Both remain
                  keyboard/aria accessible via aria-pressed. */}
              <button
                type="button"
                role="switch"
                aria-checked={recentOnly}
                onClick={() => setRecentOnly((v) => !v)}
                className={`ml-2 inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  recentOnly
                    ? 'border-ss-teal bg-ss-teal text-white shadow-sm'
                    : 'border-ss-border-warm bg-white text-ss-teal hover:border-ss-teal'
                }`}
                title="Restrict results to the last 5 years"
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-2 w-2 rounded-full ${recentOnly ? 'bg-white' : 'bg-ss-teal/40'}`}
                />
                Last 5y
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={smartSearch}
                onClick={() => setSmartSearch((v) => !v)}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  smartSearch
                    ? 'border-ss-orange bg-ss-orange text-white shadow-sm'
                    : 'border-ss-border-warm bg-white text-ss-orange hover:border-ss-orange'
                }`}
                title="Uses AI to expand your query with related terms and reorder results by meaning"
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-2 w-2 rounded-full ${smartSearch ? 'bg-white' : 'bg-ss-orange/40'}`}
                />
                Smart Search
              </button>

              {refining && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-ss-teal">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ss-teal border-t-transparent" />
                  Refining results\u2026
                </span>
              )}

              <span className="ml-auto text-[11px] text-ss-muted">
                Showing {paged.length} of {filtered.length}
              </span>
            </div>

            {/* Semantic expansion pills \u2014 shown under the filter bar
                so the user understands why extra papers appeared. */}
            {smartSearch && semanticExpansions.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">
                  Also searching:
                </span>
                {semanticExpansions.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paged.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  highlightGenes={activeGenes}
                  corpus={filtered}
                />
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

            {/* Infinite-scroll sentinel + loading indicator */}
            {hasMore && (
              <div
                ref={loadSentinelRef}
                className="mt-8 flex justify-center py-6 text-xs text-ss-muted"
                aria-live="polite"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ss-teal border-t-transparent" />
                  Loading more studies…
                </span>
              </div>
            )}
            {!hasMore && filtered.length > INITIAL_BATCH && (
              <div className="mt-8 text-center text-[11px] italic text-ss-muted">
                End of results — {filtered.length} studies shown.
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
