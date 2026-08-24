import { NextResponse } from 'next/server'

// Force this catch-all API route to always be dynamic (never statically
// rendered / never ISR-cached). Without this, `/api/editorial/featured` in
// particular could be served from a stale build snapshot to mobile PWA
// clients that already have long-lived HTTP entries.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import {
  scoreReliability as callReliability,
  translatePlainLanguage as callPlainLanguage,
  expandSemantic,
  rerankSemantic,
  chatCoach,
  planResearch,
  synthesizeResearch,
  extractJson,
  MODELS,
} from '@/lib/ai'
import { buildGroundingBlock, coachSystemPrompt } from '@/lib/ai/coachGrounding'
import { checkCoachRate, checkResearchRate } from '@/lib/ai/rateLimit'
import { recordCtaEvent, getCtaSnapshot } from '@/lib/cta-usage'
import {
  buildReliabilityPrompt,
  buildPlainLanguagePrompt,
} from '@/lib/prompts'
import { VARIANT_CATALOG, APPROVED_RSIDS, classifyVariant, describeVariant } from '@/lib/variant-catalog'
import { classifyGenome, CLASSIFICATION_TO_LEGACY } from '@/lib/genomeClassifier'
import { generateGenomeReportServer, adaptReportToLegacyShape } from '@/lib/genomeAIGenerator'
import { callGenomeGenerateProvider } from '@/lib/genomeGenerateProvider'
import { getPillarQuery } from '@/lib/pillars'
import { searchCache, makeCacheKey } from '@/lib/cache'
import { getUsageSnapshot, fetchOpenRouterCredit } from '@/lib/ai-usage'
import {
  searchArticles as supabaseSearchArticles,
  getFeaturedArticles as supabaseGetFeaturedArticles,
  pingArticlesTable as supabasePingArticles,
} from '@/lib/supabase/articles'
import { loadExerciseDB, filterExercises } from '@/lib/training/exerciseDb'
import { normalizeSearchHit, normalizeLabelDetail } from '@/lib/supplements/dsld'
import PRICES_JSON from '@/lib/supplements/prices.json'
import { getMergedPrices, replaceOverlay, mergeOverlay } from '@/lib/supplements/pricesStore'
import {
  isAdminAuthenticated,
  verifyPassword,
  expectedSessionToken,
  ADMIN_COOKIE,
} from '@/lib/admin-auth'
import {
  normalizeArticlePayload,
  listAllArticles,
  getArticleById,
  createArticle,
  updateArticleById,
  deleteArticleById,
  slugExists,
  bulkInsertArticles,
} from '@/lib/supabase/admin-articles'
import { isValidSlug } from '@/lib/slugify'
import { EDITORIAL_PILLARS } from '@/lib/supabase/pillar-map'
import {
  fetchWithTimeout,
  safeJson,
  safeText,
  searchPubmed,
  searchSemanticScholar,
  searchEuropePMC,
  searchClinicalTrials,
  searchOMIM,
  searchDisGeNET,
  searchOpenAlex,
  searchCrossref,
  llmExpandQuery,
  llmRerankResults,
  parseQuery,
  mergeResults,
} from '@/lib/search'

/**
 * Response headers that instruct every layer (SW → browser HTTP cache →
 * mobile PWA WebView → any CDN in front of the app) to NEVER cache the
 * body. Used for editorial listing endpoints so newly-published articles
 * appear immediately on installed-PWA / mobile-bookmark clients.
 */
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

async function handleSemanticExpand(request) {
  const body = await request.json().catch(() => ({}))
  const q = String(body?.query || '').trim()
  if (!q) return NextResponse.json({ expansions: [] }, { headers: NO_STORE_HEADERS })
  const expansions = await llmExpandQuery(q)
  return NextResponse.json({ expansions }, { headers: NO_STORE_HEADERS })
}

async function handleSemanticRerank(request) {
  const body = await request.json().catch(() => ({}))
  const q = String(body?.query || '').trim()
  const items = Array.isArray(body?.items) ? body.items : []
  if (!q || !items.length) return NextResponse.json({ order: null }, { headers: NO_STORE_HEADERS })
  const order = await llmRerankResults(q, items)
  return NextResponse.json({ order }, { headers: NO_STORE_HEADERS })
}

/* ------------------------------ /api/search ------------------------------- */

async function handleSearch(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const sourceFilter = searchParams.get('source') || 'all'
  // Pool limit — bumped 40 -> 100 so the client-side infinite-scroll
  // (40 initial + 20/batch) has a real pool to draw from without needing
  // another network round-trip. Individual sources are pulled deep enough
  // to feed this pool after dedupe.
  const limit = Math.min(parseInt(searchParams.get('limit') || '80', 10), 100)
  const pillar = searchParams.get('pillar') || ''
  // "pillar browse" mode: user clicked a pillar with no explicit query.
  // We swap in a curated pillar query and bias toward recent, high-quality work.
  const pillarQuery = getPillarQuery(pillar)
  const isPillarBrowse = !q && !!pillarQuery
  const effectiveInputQ = isPillarBrowse ? pillarQuery : q

  if (!effectiveInputQ) {
    return NextResponse.json({ query: '', results: [], total: 0, sources: {} })
  }

  // ---- Cache lookup ----------------------------------------------------
  // Same params → same upstream calls → same response. Pillar-browse gets
  // a longer TTL (10 min) because curated queries don't drift and we want
  // to shield the biomedical APIs from repeat pillar clicks by anonymous
  // browsers. Regular searches get a shorter TTL (5 min) — long enough to
  // absorb F5 / back-forward / dedupe from AI reprocessing, short enough
  // to keep fresh content flowing in for active researchers.
  const cacheKey = makeCacheKey('search', {
    q: effectiveInputQ, pillar, source: sourceFilter, limit, mode: isPillarBrowse ? 'browse' : 'q',
  })
  const cached = searchCache.get(cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, _cache: 'hit' })
  }

  const parsed = parseQuery(effectiveInputQ)
  // For multi-word queries, wrap in quotes so PubMed/OpenAlex/Crossref/S2 do
  // exact-phrase matching. This alone eliminates most of the "loose keyword"
  // noise (e.g. War Zone Training, Work Zone Safety) for a query like "zone 2 training".
  //
  // Exception: in pillar-browse mode we want HIGH RECALL across a topic, so we
  // do NOT quote — we want each source to interpret the curated tokens as an
  // OR-ish topic search and return the best material from the last few years.
  const isMultiWord = parsed.tokens.length >= 2
  const quotedQ = isMultiWord && !isPillarBrowse ? `"${effectiveInputQ.replace(/"/g, '')}"` : effectiveInputQ
  // Text + pillar mode ("filter by pillar"):
  //   The user typed something AND selected a pillar. The user query is
  //   authoritative — every result must match it — and the pillar acts as a
  //   topical boost. We fold in the CURATED pillar tokens (not just the
  //   pillar's display name, which is a weak signal on its own) and apply the
  //   same last-5-years recency bias that pillar-browse uses. This is what
  //   makes "inflammation + Longevity" surface healthspan/aging inflammation
  //   research instead of arbitrary inflammation papers.
  const isTextPillar = !isPillarBrowse && !!pillar && !!pillarQuery
  const effectiveQuery = isTextPillar
    ? `${quotedQ} ${pillarQuery}`                  // user text + curated pillar tokens
    : (pillar && !isPillarBrowse ? `${quotedQ} ${pillar}` : quotedQ)

  // Per-source pull depths — sized so that after dedupe (~30% overlap in
  // practice) we still return at least the client's `limit` (up to 100).
  // Europe PMC added 2026-07 — it's a PubMed superset so it dedupes heavily
  // against PubMed but adds preprint + agricola coverage. ClinicalTrials
  // returns a separate strip and is not merged into the literature pool.
  // OMIM + DisGeNET added 2026-07 for gene queries only (they don't have
  // free-text search parity; they're gene-centric registries).
  const perSource = { pubmed: 100, s2: 100, oa: 50, crossref: 40, europepmc: 50 }
  const pubmedN    = perSource.pubmed
  const s2N        = perSource.s2
  const oaN        = perSource.oa
  const crossrefN  = perSource.crossref
  const europepmcN = perSource.europepmc

  // MeSH-ish gene expansion. When the effective query looks gene-shaped
  // (all-caps letter+digit token like MTHFR, APOE, CYP1A2, BRCA1), append
  // synonym broadening to widen recall on PubMed / Europe PMC without
  // clobbering the exact-match semantics of quoted searches. This is a
  // lightweight substitute for a full MeSH xref lookup — good enough for
  // 90% of the "gene alone" query pattern.
  const geneShaped = /\b[A-Z][A-Z0-9]{1,7}\b/.test(effectiveInputQ) && !isPillarBrowse
  const searchPool = geneShaped
    ? `${effectiveQuery} OR "${effectiveInputQ} gene" OR "${effectiveInputQ} variant" OR "${effectiveInputQ} polymorphism"`
    : effectiveQuery

  const [pubmedResults, s2Results, openAlexResults, crossrefResults, europePMCResults, ctResults, omimResults, disgenetResults] = await Promise.all([
    (sourceFilter === 'all' || sourceFilter === 'pubmed')   ? searchPubmed(searchPool, pubmedN)               : Promise.resolve([]),
    (sourceFilter === 'all' || sourceFilter === 's2')       ? searchSemanticScholar(effectiveQuery, s2N)      : Promise.resolve([]),
    (sourceFilter === 'all' || sourceFilter === 'openalex') ? searchOpenAlex(effectiveQuery, oaN)             : Promise.resolve([]),
    (sourceFilter === 'all' || sourceFilter === 'crossref') ? searchCrossref(effectiveQuery, crossrefN)       : Promise.resolve([]),
    (sourceFilter === 'all' || sourceFilter === 'europepmc')? searchEuropePMC(searchPool, europepmcN)         : Promise.resolve([]),
    // ClinicalTrials.gov ALWAYS fires in parallel (no conditional). Uses
    // whatever query text or pillar keyword is available; returns [] when
    // nothing meaningful is present. This ensures every search page has the
    // trials strip populated whenever trials exist for the topic.
    (sourceFilter === 'all' || sourceFilter === 'trials')
      ? searchClinicalTrials(effectiveInputQ || effectiveQuery || '', 20)
      : Promise.resolve([]),
    // OMIM + DisGeNET are gene-only registries. Only fire when the query is
    // gene-shaped (see the geneShaped guard above). Both no-op when their
    // respective API key env var is missing, keeping the pipeline safe.
    geneShaped ? searchOMIM(effectiveInputQ)     : Promise.resolve([]),
    geneShaped ? searchDisGeNET(effectiveInputQ) : Promise.resolve([]),
  ])

  // Merge + relevance filter + sort in one pass. NOTE: ctResults are NOT
  // merged into `merged` — they render as a distinct "Active & Completed
  // Trials" strip above the literature list on the client. OMIM + DisGeNET
  // ARE merged so they compete for a slot in the top results.
  let merged = mergeResults(
    [pubmedResults, s2Results, openAlexResults, crossrefResults, europePMCResults, omimResults, disgenetResults],
    isPillarBrowse ? null : parsed
  )

  // Quality filter: drop items whose abstract leaks database artifact IDs
  // (UUIDs from OSF / Researka preprint pipelines that occasionally end up
  // pasted into abstract text). Signature is a canonical UUID prefix like
  // "0f1a2b3c-1d2e-3f4a-…". These records are almost always low-quality
  // placeholder metadata and shouldn't rank in "Zone 2 training" etc.
  const UUID_LEAK = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i
  merged = merged.filter((r) => !UUID_LEAK.test(r?.abstract || ''))

  if (isPillarBrowse || isTextPillar) {
    // Pillar contexts (both pure-browse and text+pillar) bias to the last 5
    // years. For pillar-browse this is the whole pool; for text+pillar we
    // still respect the user's query (relevance filter already applied above)
    // but sort recent-first so "inflammation + Longevity" surfaces 2024 work,
    // not a 2011 paper.
    const cutoff = new Date().getFullYear() - 5
    const recent = merged.filter((r) => (r.year || 0) >= cutoff)
    // Fall back to full set if recency-filter cuts too aggressively (e.g. a
    // niche gene where recent literature is sparse).
    const pool = recent.length >= 8 ? recent : merged
    pool.sort((a, b) => {
      const yr = (b.year || 0) - (a.year || 0)
      if (yr !== 0) return yr
      return (b.citationCount || 0) - (a.citationCount || 0)
    })
    merged = pool
  }

  merged = merged.slice(0, limit)

  const payload = {
    query: effectiveInputQ,
    pillar,
    isPillarBrowse,
    isTextPillar,
    total: merged.length,
    sources: {
      pubmed: pubmedResults.length,
      semanticScholar: s2Results.length,
      openAlex: openAlexResults.length,
      crossref: crossrefResults.length,
      europePMC: europePMCResults.length,
      omim: omimResults.length,
      disgenet: disgenetResults.length,
      clinicalTrials: ctResults.length,
    },
    results: merged,
    // Clinical trials render as a separate strip on the client; kept out
    // of `results` so the tier/relevance/date filters don't apply to them.
    clinicalTrials: ctResults,
  }

  // Only cache non-empty responses. If ALL four upstream APIs failed / 429'd
  // and we got zero results, we do NOT want to freeze that empty result for
  // 5–10 minutes — the user should be able to retry immediately and hit the
  // upstreams again.
  if (merged.length > 0) {
    const ttlMs = isPillarBrowse ? 10 * 60 * 1000 : 5 * 60 * 1000
    searchCache.set(cacheKey, payload, ttlMs)
  }

  return NextResponse.json({ ...payload, _cache: 'miss' })
}

/* --------------------------------- Router --------------------------------- */

/* --------------------- /api/supplements/dsld/* -------------------- */
// Server-side proxy to the NIH Dietary Supplement Label Database (DSLD).
// Public API, no key required. We add:
//   - hard fetch timeouts
//   - on-market filtering (offMarket=1 in DSLD means discontinued)
//   - normalisation via /lib/supplements/dsld.js
//   - in-memory caching (searchCache) with modest TTLs

const DSLD_BASE = 'https://api.ods.od.nih.gov/dsld/v9'

async function handleSupplementsDsldSearch(request) {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').trim()
  const sizeRaw = parseInt(url.searchParams.get('size') || '20', 10)
  const size = Number.isFinite(sizeRaw) ? Math.min(Math.max(sizeRaw, 1), 50) : 20
  const onMarketOnly = url.searchParams.get('onMarket') !== '0'

  if (!q) {
    return NextResponse.json({ query: '', total: 0, results: [] })
  }

  const cacheKey = makeCacheKey('dsld-search', { q, size, onMarketOnly })
  const cached = searchCache.get(cacheKey)
  if (cached) return NextResponse.json({ ...cached, _cache: 'hit' })

  // Ask DSLD for extra results if we plan to filter offMarket client-side
  const dsldSize = onMarketOnly ? Math.min(size * 3, 100) : size
  const upstream = `${DSLD_BASE}/search-filter?q=${encodeURIComponent(q)}&size=${dsldSize}`

  try {
    const resp = await fetchWithTimeout(upstream, {
      headers: { Accept: 'application/json' },
    }, 12_000)
    if (!resp.ok) {
      return NextResponse.json({ error: `DSLD upstream ${resp.status}`, results: [] }, { status: 502 })
    }
    const data = await resp.json()
    const hits = Array.isArray(data.hits) ? data.hits : []
    let normalized = hits.map(normalizeSearchHit).filter(Boolean)
    if (onMarketOnly) normalized = normalized.filter((p) => !p.offMarket)
    normalized = normalized.slice(0, size)

    const payload = {
      query: q,
      total: data?.stats?.count ?? normalized.length,
      returned: normalized.length,
      results: normalized,
    }
    searchCache.set(cacheKey, payload, 10 * 60 * 1000) // 10 min
    return NextResponse.json({ ...payload, _cache: 'miss' })
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err), results: [] }, { status: 500 })
  }
}

async function handleSupplementsPrices(request) {
  // Serve the cached prices JSON to the client. Merges bundled JSON with
  // any MongoDB overlay written by the scraper via POST /api/supplements/prices.
  // Falls back to bundled-only if Mongo is unreachable so a DB outage never
  // breaks supplement browsing.
  try {
    const merged = await getMergedPrices()
    return NextResponse.json(merged)
  } catch (err) {
    return NextResponse.json({
      meta: PRICES_JSON?._meta || {},
      prices: PRICES_JSON?.prices || {},
      count: Object.keys(PRICES_JSON?.prices || {}).length,
      _error: String(err?.message || err),
    })
  }
}

async function handleSupplementsPricesWrite(request) {
  // Admin-token gated: production price scraper POSTs fresh prices here so
  // it doesn't need to write the bundled prices.json (filesystem may be
  // read-only). Token comes from the PRICES_ADMIN_TOKEN env var and is
  // supplied in the x-prices-admin-token header.
  const expected = process.env.PRICES_ADMIN_TOKEN || ''
  if (!expected) {
    return NextResponse.json(
      { error: 'PRICES_ADMIN_TOKEN not configured on server' },
      { status: 503 },
    )
  }
  const supplied = request.headers.get('x-prices-admin-token') || ''
  if (!supplied || supplied !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const mode = (body?.mode || 'replace').toLowerCase()
  if (mode !== 'replace' && mode !== 'merge') {
    return NextResponse.json({ error: 'mode must be "replace" or "merge"' }, { status: 400 })
  }

  const result = mode === 'merge' ? await mergeOverlay(body) : await replaceOverlay(body)
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Write failed' }, { status: 500 })
  }
  return NextResponse.json({
    ok: true,
    mode,
    wrote: result.wrote,
    updatedAt: result.updatedAt,
  })
}

async function handleSupplementsDsldLabel(request, id) {
  if (!id) return NextResponse.json({ error: 'Missing label id' }, { status: 400 })

  const cacheKey = makeCacheKey('dsld-label', { id })
  const cached = searchCache.get(cacheKey)
  if (cached) return NextResponse.json({ ...cached, _cache: 'hit' })

  const upstream = `${DSLD_BASE}/label/${encodeURIComponent(id)}`
  try {
    const resp = await fetchWithTimeout(upstream, {
      headers: { Accept: 'application/json' },
    }, 12_000)
    if (resp.status === 404) return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    if (!resp.ok) return NextResponse.json({ error: `DSLD upstream ${resp.status}` }, { status: 502 })
    const data = await resp.json()
    // DSLD quirk: unknown IDs return 200 with an empty array [] instead of 404.
    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && !data.id && !data.fullName && !data.brandName)) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }
    const product = normalizeLabelDetail(data)
    if (!product) return NextResponse.json({ error: 'Invalid label payload' }, { status: 500 })

    const payload = { product }
    searchCache.set(cacheKey, payload, 60 * 60 * 1000) // 1 hour
    return NextResponse.json({ ...payload, _cache: 'miss' })
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p
  const subRoute = Array.isArray(p) ? p[1] : null
  const thirdRoute = Array.isArray(p) ? p[2] : null

  if (route === 'search') return handleSearch(request)
  if (route === 'autocomplete') return handleAutocomplete(request)
  if (route === 'admin' && subRoute === 'ai-usage') return handleAdminAiUsage(request)
  if (route === 'admin' && subRoute === 'hero-cta-stats') return handleAdminHeroCtaStats(request)
  if (route === 'admin' && subRoute === 'me') return handleAdminMe(request)
  if (route === 'admin' && subRoute === 'articles') {
    if (!thirdRoute) return handleAdminListArticles(request)
    if (thirdRoute === 'check-slug') return handleAdminCheckSlug(request)
    return handleAdminGetArticle(request, thirdRoute)
  }
  if (route === 'editorial') {
    if (subRoute === 'health')   return handleEditorialHealth(request)
    if (subRoute === 'search')   return handleEditorialSearch(request)
    if (subRoute === 'featured') return handleEditorialFeatured(request)
  }
  if (route === 'training') {
    if (subRoute === 'exercises')     return handleTrainingExercises(request)
    if (subRoute === 'exercise-find') return handleTrainingExerciseFind(request)
  }
  if (route === 'supplements') {
    if (subRoute === 'dsld' && thirdRoute === 'search') return handleSupplementsDsldSearch(request)
    if (subRoute === 'dsld' && thirdRoute && thirdRoute !== 'search') return handleSupplementsDsldLabel(request, thirdRoute)
    if (subRoute === 'prices') return handleSupplementsPrices(request)
  }

  return NextResponse.json({
    status: 'ok',
    service: 'selfscience',
    version: '0.6.0',
    endpoints: [
      '/api/search?q=<query>&source=all|pubmed|s2|openalex|crossref&limit=40&pillar=<name>',
      '/api/autocomplete?q=<partial>',
      '/api/supplements/dsld/search?q=<query>&size=20&onMarket=1',
      '/api/supplements/dsld/<labelId>',
      'POST /api/analyze  { title, journal, year, authorsShort, abstract, source }',
      'POST /api/genome  { variants: { rsid: genotype } }',
    ],
  })
}

/* --------------------------- /api/autocomplete --------------------------- */
async function handleAutocomplete(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/autocomplete?query=${encodeURIComponent(q)}`
    const res = await fetchWithTimeout(url, { cache: 'no-store', headers: { Accept: 'application/json' } }, 6_000)
    if (!res.ok) return NextResponse.json({ suggestions: [] })
    const data = await safeJson(res)
    const matches = data?.matches || []
    const suggestions = matches
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        title: m.title || '',
        year: m.year || null,
        authorsShort: (m.authorsYear || '').replace(/^\(|\)$/g, ''),
      }))
      .filter((s) => s.title)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('autocomplete error:', err)
    return NextResponse.json({ suggestions: [] })
  }
}

/* --------------------------- /api/editorial/* ---------------------------- */
/**
 * Read-side endpoints for the Supabase `articles` table.
 *
 * All queries use the anon key + RLS, which enforces that only published
 * rows are visible. Endpoints are designed to fail SILENTLY (returning an
 * empty result set) if Supabase is misconfigured or unreachable, so the
 * main search never breaks because of an editorial-side outage.
 */

async function handleEditorialHealth() {
  try {
    const res = await supabasePingArticles()
    return NextResponse.json({
      ok: !!res.ok,
      publishedArticlesVisibleToPublic: res.count,
      reason: res.ok ? null : res.reason,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, reason: err?.message || 'unknown' })
  }
}

async function handleEditorialSearch(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const pillar = (searchParams.get('pillar') || '').trim()
  const limitRaw = parseInt(searchParams.get('limit') || '12', 10)
  const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 12))

  try {
    const results = await supabaseSearchArticles({ query: q, pillar, limit })
    return NextResponse.json(
      { results, total: results.length, source: 'supabase' },
      { headers: NO_STORE_HEADERS },
    )
  } catch (err) {
    console.warn('[editorial/search] error:', err?.message)
    return NextResponse.json(
      { results: [], total: 0, source: 'supabase', error: err?.message },
      { headers: NO_STORE_HEADERS },
    )
  }
}

async function handleEditorialFeatured(request) {
  const { searchParams } = new URL(request.url)
  const limitRaw = parseInt(searchParams.get('limit') || '6', 10)
  const limit = Math.max(1, Math.min(24, Number.isFinite(limitRaw) ? limitRaw : 6))

  try {
    const results = await supabaseGetFeaturedArticles(limit)
    return NextResponse.json(
      { results, total: results.length, source: 'supabase' },
      { headers: NO_STORE_HEADERS },
    )
  } catch (err) {
    console.warn('[editorial/featured] error:', err?.message)
    return NextResponse.json(
      { results: [], total: 0, source: 'supabase', error: err?.message },
      { headers: NO_STORE_HEADERS },
    )
  }
}


/* ----------------------------- /api/analyze ------------------------------- */
/* Simple in-memory cache keyed by id / doi / title to avoid burning Gemini quota
 * on repeat searches during a session. */
const analysisCache = new Map()

const VALID_LABELS = ['Preliminary', 'Limited', 'Moderate', 'Strong', 'Excellent']

async function handleScoreReliability(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const item = body || {}
  const cacheKey = item.id || item.doi || item.pmid || (item.title || '').slice(0, 120)
  if (cacheKey && analysisCache.has(cacheKey)) {
    return NextResponse.json({ ...analysisCache.get(cacheKey), cached: true })
  }
  try {
    const prompt = buildReliabilityPrompt(item)
    const { text, provider, model } = await callReliability(prompt)
    const parsed = extractJson(text)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Model returned non-JSON output', raw: (text || '').slice(0, 400), provider, model },
        { status: 502 }
      )
    }
    const normalized = normalizeReliability(parsed, item)
    normalized.aiProvider = provider
    normalized.aiModel = model
    if (cacheKey) analysisCache.set(cacheKey, normalized)
    return NextResponse.json(normalized)
  } catch (err) {
    console.error('score-reliability error:', err?.message)
    return NextResponse.json(
      { error: 'Analysis temporarily unavailable. Results still accessible.', detail: err?.message?.slice(0, 200) },
      { status: err?.status || 500 }
    )
  }
}

async function handleTranslatePlainLanguage(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  try {
    const prompt = buildPlainLanguagePrompt(body || {})
    const { text, provider, model } = await callPlainLanguage(prompt)
    const parsed = extractJson(text)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Model returned non-JSON output', raw: (text || '').slice(0, 400), provider, model },
        { status: 502 }
      )
    }
    const plainRaw = (parsed?.plainLanguage || parsed?.plain || '').toString().trim()
    const sections = parsed?.sections && typeof parsed.sections === 'object' ? parsed.sections : null
    // Use "What Did They Find?" as the card preview when sections are present
    const plain = sections?.whatTheyFound?.toString?.().trim?.() || plainRaw
    // Plain-English title — new field from the extended prompt. Hard-cap at
    // 10 words defensively in case the model over-generates. Strip trailing
    // punctuation per prompt rules. Fallback: empty string; card falls back
    // to the academic title.
    let plainTitle = (parsed?.plainTitle || '').toString().trim()
    if (plainTitle) {
      // Strip trailing period, exclamation, question mark
      plainTitle = plainTitle.replace(/[.!?]+$/, '').trim()
      // Enforce 10-word cap
      const words = plainTitle.split(/\s+/)
      if (words.length > 10) plainTitle = words.slice(0, 10).join(' ')
    }
    let relatedSearches = []
    if (Array.isArray(parsed?.relatedSearches)) {
      relatedSearches = parsed.relatedSearches.filter((x) => typeof x === 'string' && x.length).slice(0, 5)
    }
    return NextResponse.json({ plain, plainTitle, sections, relatedSearches, aiProvider: provider, aiModel: model })
  } catch (err) {
    console.error('translate-plain-language error:', err?.message)
    return NextResponse.json(
      { error: 'Analysis temporarily unavailable. Results still accessible.', detail: err?.message?.slice(0, 200) },
      { status: err?.status || 500 }
    )
  }
}

/* Response normalizer for reliability output */
function normalizeReliability(parsed, item) {
  const scoreRaw = parseInt(parsed?.score, 10)
  const score = Math.min(5, Math.max(1, isFinite(scoreRaw) ? scoreRaw : 3))
  const label = VALID_LABELS.includes(parsed?.label) ? parsed.label : VALID_LABELS[score - 1]
  const note = (parsed?.note || '').toString().slice(0, 160)

  let flags = []
  if (Array.isArray(parsed?.flags)) {
    flags = parsed.flags
      .filter((f) => f && typeof f.label === 'string')
      .map((f) => ({ label: f.label.slice(0, 40), tone: f.tone === 'critical' ? 'critical' : 'amber' }))
      .slice(0, 4)
  }
  if (item?.source === 'preprint' && !flags.find((f) => /peer.review/i.test(f.label))) {
    flags.push({ label: 'Not Yet Peer Reviewed', tone: 'amber' })
  }

  let funding = null
  if (parsed?.funding && typeof parsed.funding === 'object') {
    const fRaw = parseInt(parsed.funding.score, 10)
    const fScore = Math.min(5, Math.max(1, isFinite(fRaw) ? fRaw : 3))
    funding = {
      score: fScore,
      funders: Array.isArray(parsed.funding.funders) ? parsed.funding.funders.filter((x) => typeof x === 'string' && x.length).slice(0, 6) : [],
      authorConflicts: Array.isArray(parsed.funding.authorConflicts) ? parsed.funding.authorConflicts.filter((x) => typeof x === 'string' && x.length).slice(0, 4) : [],
      note: (parsed.funding.note || '').toString().slice(0, 240),
    }
  }

  return {
    reliability: score,
    reliabilityLabel: label,
    reliabilityNote: note,
    flags,
    funding,
  }
}
/* ------------------- /api/interpret-genome ------------------- */

/**
 * Build a MINIMAL genome-analysis payload from the raw variant list alone —
 * no AI required. Used as a graceful fallback when the AI cascade returns
 * non-JSON output (very rare, but happens under load with our tier-2
 * fallback model). The report is less rich than an AI-driven one but still
 * gives the user their variant list grouped by pillar, book matches (via
 * the client), and search-starting-points to explore further.
 */
function buildMinimalGenomeReport(variants, catalog) {
  const byPillar = {}
  const recognized = []
  const enriched = []
  const strengthEnriched = []
  const awarenessEnriched = []
  for (const [rsid, gt] of Object.entries(variants || {})) {
    const meta = catalog[rsid]
    const cls = classifyVariant(rsid, gt) // 'Strength' | 'Awareness' | 'Neutral'
    recognized.push({
      rsid, gene: meta?.gene || '', variant_name: meta?.description || '',
      genotype_called: gt, pillar: meta?.pillar || 'General',
      classification: cls,
    })
    if (meta?.pillar) {
      const p = meta.pillar
      byPillar[p] = byPillar[p] || []
      // Variant-specific plain-language text (curated per rsID+classification).
      // Falls back to a gene-aware generic when curated copy isn't available.
      const clsCopy = describeVariant(rsid, cls, gt)
      byPillar[p].push({
        gene: meta.gene, rsid, genotype: gt,
        classification: cls,
        explanation: clsCopy,
        landmarkStudy: '',
        searches: [`${meta.gene} ${meta.description.split('—')[0].trim()}`, `${meta.gene} health research`],
      })
      const enrichedItem = { label: meta.description, one_line: clsCopy, pillar: p, rsid, gene: meta.gene, genotype: gt }
      enriched.push(enrichedItem)
      if (cls === 'Strength') strengthEnriched.push(enrichedItem)
      else if (cls === 'Awareness') awarenessEnriched.push(enrichedItem)
    }
  }
  const pillars = Object.keys(byPillar).sort()
  // Return ALL enriched variants as Areas to Explore. Users with 100+ recognized
  // variants explicitly want to see every one of them surfaced in the overview,
  // not just a truncated preview. The FullReport / Roadmap tabs already show
  // the full grouped view, but the Overview tab is where users first look for
  // "what did SelfScience find in me?" — so we no longer slice this list.
  const toCard = (a, cls) => ({ name: a.label, plain: a.one_line, pillar: a.pillar, rsid: a.rsid, gene: a.gene, genotype: a.genotype, classification: cls })
  const strengthCards = strengthEnriched.map((a) => toCard(a, 'Strength'))
  const awarenessCards = awarenessEnriched.map((a) => toCard(a, 'Awareness'))
  const neutralCards = enriched
    .filter((e) => !strengthEnriched.includes(e) && !awarenessEnriched.includes(e))
    .map((a) => toCard(a, 'Neutral'))
  return {
    session_id: Math.random().toString(36).slice(2, 10),
    variants_recognized: recognized,
    pillar_reports: pillars.map((p) => ({
      pillar: p,
      strengths: byPillar[p].filter((v) => v.classification === 'Strength'),
      awareness_areas: byPillar[p].filter((v) => v.classification !== 'Strength'),
    })),
    overall_summary: {
      top_strengths: strengthEnriched,
      top_awareness_areas: awarenessEnriched,
      system_view: 'Genetics is not destiny. This report provides research pointers based on your recognized variants.',
    },
    research_roadmap: {
      introduction: 'Based on your recognized variants, these are the research areas most relevant to explore.',
      pillars: pillars.map((p, i) => ({
        pillar: p, priority: i + 1,
        reason: `You have ${byPillar[p].length} recognized variant${byPillar[p].length === 1 ? '' : 's'} in ${p}.`,
        top_searches: [...new Set(byPillar[p].flatMap((v) => v.searches))].slice(0, 8),
      })),
    },
    privacy_confirmation: { data_received: 'Variant calls only', data_retained: false, session_ends: 'Data cleared on session close', file_processed: 'Client-side only' },
    disclaimer: { user_facing: 'This report is for educational purposes only. Not a medical diagnosis.', display: 'always_visible' },
    // UI-compat aliases (same shape the AI-driven path produces):
    overview: {
      strengths: strengthCards,
      areasToExplore: [...awarenessCards, ...neutralCards],
      systemView: 'Genetics is not destiny. This report provides research pointers based on your recognized variants.',
    },
    fullReport: pillars.map((p) => ({ pillar: p, variants: byPillar[p] })),
    researchRoadmap: pillars.map((p, i) => ({
      priority: i + 1, pillar: p,
      why: `You have ${byPillar[p].length} recognized variant${byPillar[p].length === 1 ? '' : 's'} in ${p}.`,
      searches: [...new Set(byPillar[p].flatMap((v) => v.searches))].slice(0, 8),
    })),
  }
}

/**
 * Apply Step 1 (deterministic) classifications as the authoritative badge on
 * every card in a genome API response. AI output can only contribute
 * plain-text narrative — badges come from Step 1. Overview.strengths and
 * overview.areasToExplore are re-bucketed after the override so the two
 * sections stay accurate.
 */
function applyStep1Overrides(response, step1ByRsid, step1Meta) {
  const legacyOf = (cls) =>
    cls === 'positive' ? 'Strength'
    : cls === 'awareness' ? 'Awareness'
    : cls === 'neutral' ? 'Neutral'
    : null
  const overrideCard = (card) => {
    if (!card || !card.rsid) return card
    const s1 = step1ByRsid.get(card.rsid)
    if (!s1) return card
    const legacy = legacyOf(s1.classification)
    if (!legacy) return card
    // Prefer Step 1's classification_text (already merged with curated copy
    // from variant-catalog.js). Fall back to the AI narrative otherwise.
    return {
      ...card,
      classification: legacy,
      plain: s1.classification_text || card.plain,
      _step1: true,
    }
  }
  const allOverview = [
    ...(response.overview?.strengths || []),
    ...(response.overview?.areasToExplore || []),
  ].map(overrideCard)
  if (response.overview) {
    response.overview.strengths = allOverview.filter((c) => c.classification === 'Strength')
    response.overview.areasToExplore = allOverview.filter((c) => c.classification !== 'Strength')
  }
  if (Array.isArray(response.fullReport)) {
    for (const group of response.fullReport) {
      group.variants = (group.variants || []).map((v) => {
        const s1 = step1ByRsid.get(v.rsid)
        if (!s1) return v
        const legacy = legacyOf(s1.classification)
        return legacy
          ? { ...v, classification: legacy, explanation: s1.classification_text || v.explanation, _step1: true }
          : v
      })
    }
  }
  response.step1 = {
    variant_count: step1ByRsid.size,
    unclassified_count: step1Meta?.unclassified_rsids?.length || 0,
    pillar_summary: step1Meta?.pillar_summary || {},
  }
  return response
}

// -------------------------------------------------------------------
// AI Coach chat + Deep Research generator handlers.
// Both are stateless, force-dynamic, no-store pass-throughs \u2014 nothing
// user-identifying is logged or persisted server-side beyond ephemeral
// request handling.
// -------------------------------------------------------------------
async function handleCoachChat(request) {
  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const message  = String(body?.message || '').trim().slice(0, 2000)
  const history  = Array.isArray(body?.conversationHistory) ? body.conversationHistory.slice(-8) : []
  const context  = body?.context || {}
  const sessionId = String(body?.sessionId || 'anon').slice(0, 80)

  if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  // Rate limit \u2014 per session, hourly bucket. Never keyed on IP or PII.
  const rl = checkCoachRate(sessionId, 20, 60 * 60 * 1000)
  if (!rl.allowed) {
    const mins = Math.max(1, Math.round((rl.resetAt - Date.now()) / 60000))
    return NextResponse.json({
      error: 'RATE_LIMITED',
      message: `You\u2019ve reached the free Coach limit for now. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`,
      resetAt: rl.resetAt,
    }, { status: 429 })
  }

  // Build the ground-truth block from curated catalogs + client context.
  const grounding = buildGroundingBlock({ userText: message, context })
  const isPersonalized = !!(context && ((context.userVariants || []).length || (context.supplements || []).length || (context.biomarkerFlags || []).length))

  const messages = [
    { role: 'system', content: coachSystemPrompt({ groundedFacts: grounding.factsBlock, activePillar: context.activePillar, isPersonalized }) },
    ...history.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
    { role: 'user', content: message },
  ]

  try {
    const out = await chatCoach(messages)
    return NextResponse.json({
      reply: out.text,
      provider: out.provider,
      model: out.model,
      detectedGenes: grounding.detectedGenes,
      citations: grounding.citations,
      rateLimit: { remaining: rl.remaining, resetAt: rl.resetAt },
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('coach chat error:', err?.status, err?.message?.slice(0, 200))
    return NextResponse.json({
      error: 'COACH_FAILED',
      message: 'All free models are busy right now. Please try again in a minute.',
    }, { status: 503 })
  }
}

// -------------------------------------------------------------------
// AI Coach STREAMING variant. Proxies OpenRouter SSE straight through
// to the browser so the UI can render tokens as they arrive. Uses the
// same grounding + system prompt as /api/coach and iterates through
// the coach cascade until one model starts producing tokens; falls
// back to a single error line if all tiers fail.
// -------------------------------------------------------------------
async function handleCoachChatStream(request) {
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const message   = String(body?.message || '').trim().slice(0, 2000)
  const history   = Array.isArray(body?.conversationHistory) ? body.conversationHistory.slice(-8) : []
  const context   = body?.context || {}
  const sessionId = String(body?.sessionId || 'anon').slice(0, 80)
  if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const rl = checkCoachRate(sessionId, 20, 60 * 60 * 1000)
  if (!rl.allowed) {
    const mins = Math.max(1, Math.round((rl.resetAt - Date.now()) / 60000))
    return NextResponse.json({
      error: 'RATE_LIMITED',
      message: `You\u2019ve reached the free Coach limit for now. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`,
      resetAt: rl.resetAt,
    }, { status: 429 })
  }

  const grounding = buildGroundingBlock({ userText: message, context })
  const isPersonalized = !!(context && ((context.userVariants || []).length || (context.supplements || []).length || (context.biomarkerFlags || []).length))

  const messages = [
    { role: 'system', content: coachSystemPrompt({ groundedFacts: grounding.factsBlock, activePillar: context.activePillar, isPersonalized }) },
    ...history.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
    { role: 'user', content: message },
  ]

  const encoder = new TextEncoder()

  // We build a ReadableStream that iterates through the coach cascade
  // and pipes SSE lines from the first model that begins producing
  // tokens. First chunk is a `meta` event with detectedGenes/citations
  // so the UI can render chips immediately; subsequent events are
  // `delta` (token chunks) and finally `done`.
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      send('meta', {
        detectedGenes: grounding.detectedGenes,
        citations:     grounding.citations,
        rateLimit:     { remaining: rl.remaining, resetAt: rl.resetAt },
      })

      const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
      const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
      const cascade = MODELS?.coach?.cascade || []
      const maxTokens = MODELS?.coach?.maxTokens || 900

      let anyTokenEmitted = false
      let providerUsed = null
      let modelUsed = null
      let totalOut = 0

      for (const step of cascade) {
        // Only OpenRouter supports SSE in our current setup. For
        // together-provider steps we skip streaming and fall through
        // to a non-streaming completion at the end if nothing streamed.
        if (step.provider !== 'openrouter') continue
        if (!OPENROUTER_KEY) break

        let upstream
        try {
          upstream = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${OPENROUTER_KEY}`,
              'HTTP-Referer':  'https://selfscience.io',
              'X-Title':       'SelfScience',
            },
            body: JSON.stringify({
              model: step.model,
              messages,
              temperature: 0.4,
              max_tokens: maxTokens,
              stream: true,
            }),
          })
        } catch (err) {
          continue
        }

        if (!upstream.ok || !upstream.body) continue

        providerUsed = 'openrouter'
        modelUsed = step.model

        // Parse the SSE stream from OpenRouter and forward `delta`
        // events to the client. OpenRouter uses the OpenAI SSE format:
        //   data: {...}\n\n   ... eventually   data: [DONE]\n\n
        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let modelHadContent = false
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            let idx
            while ((idx = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, idx).replace(/\r$/, '')
              buffer = buffer.slice(idx + 1)
              if (!line.startsWith('data:')) continue
              const payload = line.slice(5).trim()
              if (!payload || payload === '[DONE]') continue
              try {
                const j = JSON.parse(payload)
                const delta = j?.choices?.[0]?.delta?.content
                if (typeof delta === 'string' && delta.length > 0) {
                  modelHadContent = true
                  anyTokenEmitted = true
                  totalOut += delta.length
                  send('delta', { text: delta })
                }
              } catch { /* ignore malformed chunk */ }
            }
          }
        } catch {
          // Upstream connection died mid-stream. If we already emitted
          // tokens, we call it a partial success. Otherwise try next.
        }

        if (modelHadContent) break
        // If this model emitted zero content, try the next one.
      }

      if (!anyTokenEmitted) {
        send('error', { message: 'The Coach is temporarily unavailable. Please try again.' })
      }

      send('done', { provider: providerUsed, model: modelUsed, outLen: totalOut })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream; charset=utf-8',
      'Cache-Control':     'no-store, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}



// -------------------------------------------------------------------
// CTA A/B tracking. Public POST endpoint used by the homepage-hero
// quiz CTA to log { impression | click } events per variant. Data is
// aggregated in-memory + flushed to /app/data/cta-usage.json.
// -------------------------------------------------------------------
async function handleCtaTrack(request) {
  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const events = Array.isArray(body?.events) ? body.events.slice(0, 20) : [body]
  try {
    for (const e of events) {
      if (!e || typeof e !== 'object') continue
      await recordCtaEvent(e)
    }
  } catch (err) {
    console.warn('cta-track error:', err?.message)
  }
  // Always respond 200 \u2014 analytics must never break the app.
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}

// Admin-only GET returning the CTA snapshot. Auth via ?token=<ADMIN_TOKEN>.
async function handleAdminHeroCtaStats(request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  const snapshot = await getCtaSnapshot()
  return NextResponse.json({ snapshot }, { headers: { 'Cache-Control': 'no-store' } })
}



async function handleResearchPlan(request) {
  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const question  = String(body?.question || '').trim().slice(0, 500)
  const sessionId = String(body?.sessionId || 'anon').slice(0, 80)
  const context   = body?.context || {}
  if (!question) return NextResponse.json({ error: 'Empty question' }, { status: 400 })

  const rl = checkResearchRate(sessionId, 3, 24 * 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'RATE_LIMITED', message: 'Daily research budget reached. Come back tomorrow.', resetAt: rl.resetAt }, { status: 429 })
  }

  const scope = context.activePillar ? ` Scope the sub-queries to ${context.activePillar}.` : ''
  const prompt = `Break the following research question into 3-6 focused PubMed-friendly sub-queries.\nReturn a JSON array of short strings (no keys, just an array). Each sub-query should be phrased like a PubMed search: use MeSH-style terms and boolean operators when helpful, e.g. \"MTHFR AND folate metabolism AND homocysteine\".${scope}\n\nResearch question: \"${question}\"`

  try {
    let queries = []
    try {
      const out = await planResearch(prompt)
      // Try JSON first.
      let j = extractJson(out.text)
      if (j && !Array.isArray(j)) {
        for (const v of Object.values(j)) if (Array.isArray(v)) { j = v; break }
      }
      if (Array.isArray(j)) {
        queries = j.map((q) => String(q).trim())
      } else {
        // Fall back: parse lines from freeform text (numbered / dashed).
        queries = String(out.text || '')
          .split(/\n+/)
          .map((line) => line.replace(/^[\s>*\-\u2022]*\d*[\.\)]?\s*/, '').replace(/^"|"$/g, '').trim())
          .filter(Boolean)
      }
      queries = queries.filter((q) => q.length > 3 && q.length < 200).slice(0, 6)
    } catch (planErr) {
      console.warn('research plan LLM failed, using raw-question fallback:', planErr?.message?.slice(0, 200))
    }
    // Always ensure at least one query \u2014 fall back to the raw question.
    if (queries.length === 0) queries = [question]
    return NextResponse.json({ queries }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('research plan error:', err?.status, err?.message?.slice(0, 200))
    return NextResponse.json({ error: 'PLAN_FAILED', message: 'Planning step failed. Please try again in a minute.' }, { status: 503 })
  }
}

async function handleResearchSynthesize(request) {
  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const question = String(body?.question || '').trim().slice(0, 500)
  const sources  = Array.isArray(body?.sources) ? body.sources.slice(0, 20) : []
  if (!question) return NextResponse.json({ error: 'Empty question' }, { status: 400 })
  if (sources.length === 0) return NextResponse.json({ error: 'No sources provided' }, { status: 400 })

  // Build the source list block. Each source: { pmid, title, year, journal, abstract? , reliability? }
  const srcBlock = sources.map((s, i) => {
    const line = [
      `[${i + 1}] PMID:${s.pmid || 'n/a'} \u2014 ${(s.title || 'untitled').slice(0, 220)}`,
      s.year || s.journal ? `    ${s.journal || ''}${s.year ? ' (' + s.year + ')' : ''}` : '',
      s.reliability ? `    Reliability: ${s.reliability}` : '',
      s.abstract ? `    Abstract: ${String(s.abstract).slice(0, 500)}` : '',
    ].filter(Boolean).join('\n')
    return line
  }).join('\n')

  const system = `You are a scientific research synthesiser for SelfScience. Draft a structured markdown report answering the user\u2019s research question, using ONLY the numbered sources provided below. Rules:\n\u2022 EVERY substantive factual claim MUST cite at least one source using the format (PMID:12345678). No uncited claims.\n\u2022 NEVER invent PMIDs, effect sizes, statistics, or studies not in the source list.\n\u2022 NEVER prescribe (\"take X\"), NEVER give numeric personal risk (\"X% risk\"), and end the report with the standard disclaimer.\n\u2022 Use these sections in markdown H2 headings: \"## Overview\", \"## What the research suggests\", \"## Limitations & caveats\", \"## Bottom line\", \"## Cited sources\".\n\u2022 The \"Cited sources\" section must list every PMID used, one per line, as: \"- PMID:12345678 \u2014 Title (Year)\".\n\u2022 Keep tone calm, plain-English, non-alarmist. ~400\u2013900 words total.\n\u2022 Close with: \"---\\n_Educational only. Not medical advice. Talk to your practitioner before making changes._\"`
  const user = `Research question: ${question}\n\nSources:\n${srcBlock}`

  try {
    const out = await synthesizeResearch([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ])
    // Post-process: strip any (PMID:xxxx) that doesn't match a source in the list.
    const validPmids = new Set(sources.map((s) => String(s.pmid || '').replace(/[^0-9]/g, '')).filter(Boolean))
    const cleaned = String(out.text || '').replace(/\(PMID:\s*([0-9]{4,10})\)/g, (m, p) => validPmids.has(p) ? `(PMID:${p})` : '(citation missing)')

    return NextResponse.json({
      report: cleaned,
      provider: out.provider,
      model: out.model,
      sourcesUsed: sources.length,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('research synthesize error:', err?.status, err?.message?.slice(0, 200))
    return NextResponse.json({ error: 'SYNTH_FAILED', message: 'Synthesis failed. Please try again in a minute.' }, { status: 503 })
  }
}


// -------------------------------------------------------------------
// Deep Research synthesis STREAMING variant. Same guardrails + citation
// post-processing as the non-streaming version, but proxies OpenRouter
// SSE tokens straight through so the UI can render the report as it's
// written. Emits event: delta (token chunks) and event: done (with the
// cleaned final report + provider/model).
// -------------------------------------------------------------------
async function handleResearchSynthesizeStream(request) {
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const question = String(body?.question || '').trim().slice(0, 500)
  const sources  = Array.isArray(body?.sources) ? body.sources.slice(0, 20) : []
  if (!question) return NextResponse.json({ error: 'Empty question' }, { status: 400 })
  if (sources.length === 0) return NextResponse.json({ error: 'No sources provided' }, { status: 400 })

  const srcBlock = sources.map((s, i) => {
    const line = [
      `[${i + 1}] PMID:${s.pmid || 'n/a'} \u2014 ${(s.title || 'untitled').slice(0, 220)}`,
      s.year || s.journal ? `    ${s.journal || ''}${s.year ? ' (' + s.year + ')' : ''}` : '',
      s.reliability ? `    Reliability: ${s.reliability}` : '',
      s.abstract ? `    Abstract: ${String(s.abstract).slice(0, 500)}` : '',
    ].filter(Boolean).join('\n')
    return line
  }).join('\n')

  const system = `You are a scientific research synthesiser for SelfScience. Draft a structured markdown report answering the user\u2019s research question, using ONLY the numbered sources provided below. Rules:\n\u2022 EVERY substantive factual claim MUST cite at least one source using the format (PMID:12345678). No uncited claims.\n\u2022 NEVER invent PMIDs, effect sizes, statistics, or studies not in the source list.\n\u2022 NEVER prescribe (\"take X\"), NEVER give numeric personal risk (\"X% risk\"), and end the report with the standard disclaimer.\n\u2022 Use these sections in markdown H2 headings: \"## Overview\", \"## What the research suggests\", \"## Limitations & caveats\", \"## Bottom line\", \"## Cited sources\".\n\u2022 The \"Cited sources\" section must list every PMID used, one per line, as: \"- PMID:12345678 \u2014 Title (Year)\".\n\u2022 Keep tone calm, plain-English, non-alarmist. ~400\u2013900 words total.\n\u2022 Close with: \"---\\n_Educational only. Not medical advice. Talk to your practitioner before making changes._\"`
  const user = `Research question: ${question}\n\nSources:\n${srcBlock}`
  const messages = [
    { role: 'system', content: system },
    { role: 'user',   content: user },
  ]

  const validPmids = new Set(sources.map((s) => String(s.pmid || '').replace(/[^0-9]/g, '')).filter(Boolean))
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
      const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
      const cascade = MODELS?.researchSynthesize?.cascade || []
      const maxTokens = MODELS?.researchSynthesize?.maxTokens || 2400

      let full = ''
      let providerUsed = null
      let modelUsed    = null

      for (const step of cascade) {
        if (step.provider !== 'openrouter') continue
        if (!OPENROUTER_KEY) break
        let upstream
        try {
          upstream = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${OPENROUTER_KEY}`,
              'HTTP-Referer':  'https://selfscience.io',
              'X-Title':       'SelfScience',
            },
            body: JSON.stringify({ model: step.model, messages, temperature: 0.25, max_tokens: maxTokens, stream: true }),
          })
        } catch { continue }
        if (!upstream.ok || !upstream.body) continue

        providerUsed = 'openrouter'; modelUsed = step.model
        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let modelHadContent = false
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            let idx
            while ((idx = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, idx).replace(/\r$/, '')
              buffer = buffer.slice(idx + 1)
              if (!line.startsWith('data:')) continue
              const payload = line.slice(5).trim()
              if (!payload || payload === '[DONE]') continue
              try {
                const j = JSON.parse(payload)
                const delta = j?.choices?.[0]?.delta?.content
                if (typeof delta === 'string' && delta.length > 0) {
                  modelHadContent = true
                  full += delta
                  send('delta', { text: delta })
                }
              } catch {}
            }
          }
        } catch {}
        if (modelHadContent) break
      }

      if (!full) {
        send('error', { message: 'Synthesis failed. Please try again in a minute.' })
        send('done', { provider: null, model: null, report: '' })
        controller.close()
        return
      }

      // Post-process: strip any (PMID:xxxx) that doesn't match a
      // source in the list. Same rule as the non-streaming version.
      const cleaned = full.replace(/\(PMID:\s*([0-9]{4,10})\)/g, (m, p) => validPmids.has(p) ? `(PMID:${p})` : '(citation missing)')

      send('done', { provider: providerUsed, model: modelUsed, report: cleaned, sourcesUsed: sources.length })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream; charset=utf-8',
      'Cache-Control':     'no-store, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}




async function handleInterpretGenome(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const rawVariants = body?.variants || {}
  // Server-side whitelist enforcement + no PII: only keep approved rsIDs.
  const variants = {}
  for (const [k, v] of Object.entries(rawVariants)) {
    if (APPROVED_RSIDS.has(k) && typeof v === 'string' && v.length <= 4) {
      variants[k] = v.toUpperCase()
    }
  }
  if (Object.keys(variants).length === 0) {
    return NextResponse.json({ error: 'No recognized variants in the submitted set.' }, { status: 400 })
  }

  // ============================================================
  // STEP 1 — Deterministic classification (no AI, runs in ~1ms).
  // The badge on every card (positive/awareness/neutral) comes from here
  // and NOTHING else overrides it. The AI's job (Step 2) is only to write
  // richer plain-language text; if the AI's classification disagrees with
  // Step 1, Step 1 wins. Applied via applyStep1Overrides() below.
  // ============================================================
  const step1 = classifyGenome(variants)
  const step1ByRsid = new Map()
  for (const v of step1.variants) step1ByRsid.set(v.rsid, v)

  try {
    // ============================================================
    // Step 2 — AI plain-language card generation.
    //
    // For LARGE uploads we skip Step 2 entirely and let Step 1's curated
    // text carry the cards. Rationale: with >70 classified variants the AI
    // cascade reliably burns the full 38s budget before returning anything
    // useful (Together AI's response streaming stalls on the huge prompt).
    // Emergent's 60s ingress leaves no room for that + serialization + the
    // occasional slow first-byte. So we short-circuit — instant response,
    // Step 1 text (fact-checked, curated for ~37 well-studied variants)
    // fills every card body, badges are still correct.
    // ============================================================
    const AI_SKIP_THRESHOLD = 70
    let step2
    if (step1.classified_count > AI_SKIP_THRESHOLD) {
      console.info(`[interpret-genome] ${step1.classified_count} classified variants > ${AI_SKIP_THRESHOLD} — skipping AI, serving Step 1 text directly`)
      step2 = await generateGenomeReportServer(step1, async () => { throw new Error('skipped: large upload') })
    } else {
      step2 = await generateGenomeReportServer(step1, callGenomeGenerateProvider)
    }
    const legacy = adaptReportToLegacyShape(step2, step1)
    // `_aiFallback` flips true when the AI provider failed entirely (or was
    // skipped) and every card body is coming from Step 1 text.
    const aiFailed = !step2.ai_source || step2.ai_source === 'unavailable' || step2.ai_source === 'unknown'
    return NextResponse.json({
      ...legacy,
      _aiFallback: aiFailed,
    })
  } catch (err) {
    console.error('interpret-genome error:', err?.message)
    // Absolute last resort — build a minimal report directly from the
    // variant catalog. This should only trigger if Step 1 itself throws
    // (e.g. an unexpected input), which is extremely rare.
    try {
      const minimal = buildMinimalGenomeReport(variants, VARIANT_CATALOG)
      const withStep1 = applyStep1Overrides(
        { ...minimal, aiProvider: 'fallback', aiModel: 'variant-catalog', _aiFallback: true },
        step1ByRsid,
        step1,
      )
      return NextResponse.json(withStep1, { status: 200 })
    } catch (fallbackErr) {
      return NextResponse.json(
        { error: 'Analysis temporarily unavailable. Please try again.', detail: (err?.message || fallbackErr?.message)?.slice(0, 200) },
        { status: 500 },
      )
    }
  }
}

export async function POST(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p
  const subRoute = Array.isArray(p) ? p[1] : null
  const thirdRoute = Array.isArray(p) ? p[2] : null

  // New endpoints per spec
  if (route === 'score-reliability') return handleScoreReliability(request)
  if (route === 'translate-plain-language') return handleTranslatePlainLanguage(request)
  if (route === 'semantic-expand') return handleSemanticExpand(request)
  if (route === 'semantic-rerank') return handleSemanticRerank(request)
  if (route === 'interpret-genome') return handleInterpretGenome(request)

  // AI Coach chat + Deep Research generator. Stateless, force-dynamic,
  // no-store. See /lib/ai/coachGrounding.js for grounding + guardrails.
  if (route === 'coach' && subRoute === 'stream') return handleCoachChatStream(request)
  if (route === 'coach') return handleCoachChat(request)
  if (route === 'cta-track') return handleCtaTrack(request)
  if (route === 'research' && subRoute === 'plan') return handleResearchPlan(request)
  if (route === 'research' && subRoute === 'synthesize' && thirdRoute === 'stream') return handleResearchSynthesizeStream(request)
  if (route === 'research' && subRoute === 'synthesize') return handleResearchSynthesize(request)

  // Backward-compat aliases so existing clients keep working during migration
  if (route === 'analyze') return handleScoreReliability(request)
  if (route === 'genome') return handleInterpretGenome(request)

  // Supplement price scraper — admin-token gated write. See
  // /app/lib/supplements/pricesStore.js for the storage layer.
  if (route === 'supplements' && subRoute === 'prices') {
    return handleSupplementsPricesWrite(request)
  }

  // Admin endpoints
  if (route === 'admin' && subRoute === 'login')  return handleAdminLogin(request)
  if (route === 'admin' && subRoute === 'logout') return handleAdminLogout(request)
  if (route === 'admin' && subRoute === 'articles') {
    if (!thirdRoute)               return handleAdminCreateArticle(request)
    if (thirdRoute === 'import')   return handleAdminImportCsv(request)
  }

  return NextResponse.json({ status: 'ok' })
}

export async function PATCH(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p
  const subRoute = Array.isArray(p) ? p[1] : null
  const thirdRoute = Array.isArray(p) ? p[2] : null

  if (route === 'admin' && subRoute === 'articles' && thirdRoute) {
    return handleAdminUpdateArticle(request, thirdRoute)
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p
  const subRoute = Array.isArray(p) ? p[1] : null
  const thirdRoute = Array.isArray(p) ? p[2] : null

  if (route === 'admin' && subRoute === 'articles' && thirdRoute) {
    return handleAdminDeleteArticle(request, thirdRoute)
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

/**
 * Admin — AI usage / cost snapshot.
 *   GET /api/admin/ai-usage?token=<ADMIN_TOKEN>
 *
 * Returns:
 *   - In-app usage snapshot (calls, tokens, USD, per-model + per-day)
 *   - Live OpenRouter remaining credit balance
 * Auth: shared secret via ?token query param compared to ADMIN_TOKEN env.
 */
async function handleAdminAiUsage(request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') || ''
  const expected = process.env.ADMIN_TOKEN || ''
  if (!expected) {
    return NextResponse.json({ error: 'ADMIN_TOKEN not configured on server' }, { status: 500 })
  }
  if (token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [snapshot, openRouterCredit] = await Promise.all([
    getUsageSnapshot(),
    fetchOpenRouterCredit(),
  ])
  return NextResponse.json({
    snapshot,
    liveCredits: {
      openrouter: openRouterCredit,
      together:  { note: 'Together AI has no public credit-balance API. Check https://api.together.ai/user/billing' },
    },
    priceTableNote: 'Prices in /app/lib/ai-usage.js. Update as providers publish new pricing.',
  })
}

/* -------------------------- /api/admin/articles ------------------------- */
/**
 * Password-gated CRUD + CSV bulk-import endpoints for the editorial
 * `articles` table. All writes bypass RLS via the service-role client,
 * so `guardAdmin()` MUST be called first on every mutating request.
 */

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

function guardAdmin(request) {
  if (!isAdminAuthenticated(request)) {
    return unauthorized()
  }
  return null
}

/* --- POST /api/admin/login -------------------------------------------- */
async function handleAdminLogin(request) {
  let body = {}
  try { body = await request.json() } catch { /* ignore */ }
  const password = String(body?.password || '')
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }
  const token = expectedSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}

/* --- POST /api/admin/logout ------------------------------------------ */
async function handleAdminLogout() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
  })
  return res
}

/* --- GET /api/admin/me ----------------------------------------------- */
async function handleAdminMe(request) {
  return NextResponse.json({ authenticated: isAdminAuthenticated(request) })
}

/* --- GET /api/admin/articles ----------------------------------------- */
async function handleAdminListArticles(request) {
  const unauth = guardAdmin(request); if (unauth) return unauth
  const { data, error } = await listAllArticles({ limit: 500 })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ articles: data, total: data.length, pillars: EDITORIAL_PILLARS })
}

/* --- GET /api/admin/articles/check-slug?slug=&excludeId= ------------- */
async function handleAdminCheckSlug(request) {
  const unauth = guardAdmin(request); if (unauth) return unauth
  const { searchParams } = new URL(request.url)
  const slug = (searchParams.get('slug') || '').trim().toLowerCase()
  const excludeId = searchParams.get('excludeId') || null
  if (!slug) return NextResponse.json({ ok: false, reason: 'slug required' }, { status: 400 })
  if (!isValidSlug(slug)) return NextResponse.json({ ok: false, taken: false, valid: false })
  const taken = await slugExists(slug, { excludeId })
  return NextResponse.json({ ok: true, taken, valid: true })
}

/* --- GET /api/admin/articles/[id] ------------------------------------ */
async function handleAdminGetArticle(request, id) {
  const unauth = guardAdmin(request); if (unauth) return unauth
  const { data, error } = await getArticleById(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ article: data })
}

/* --- POST /api/admin/articles ---------------------------------------- */
async function handleAdminCreateArticle(request) {
  const unauth = guardAdmin(request); if (unauth) return unauth
  let payload
  try { payload = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { data: normalized, errors } = normalizeArticlePayload(payload, { partial: false })
  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 400 })

  if (await slugExists(normalized.slug)) {
    return NextResponse.json({ error: `slug "${normalized.slug}" is already in use` }, { status: 409 })
  }

  const { data, error } = await createArticle(normalized)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ article: data }, { status: 201 })
}

/* --- PATCH /api/admin/articles/[id] ---------------------------------- */
async function handleAdminUpdateArticle(request, id) {
  const unauth = guardAdmin(request); if (unauth) return unauth
  let payload
  try { payload = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { data: normalized, errors } = normalizeArticlePayload(payload, { partial: true })
  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 400 })

  if (normalized.slug && await slugExists(normalized.slug, { excludeId: id })) {
    return NextResponse.json({ error: `slug "${normalized.slug}" is already in use` }, { status: 409 })
  }

  const { data, error } = await updateArticleById(id, normalized)
  if (error) return NextResponse.json({ error }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ article: data })
}

/* --- DELETE /api/admin/articles/[id] --------------------------------- */
async function handleAdminDeleteArticle(request, id) {
  const unauth = guardAdmin(request); if (unauth) return unauth
  const { error } = await deleteArticleById(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/* --- POST /api/admin/articles/import (CSV bulk) ---------------------- */
async function handleAdminImportCsv(request) {
  const unauth = guardAdmin(request); if (unauth) return unauth
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const rows = Array.isArray(body?.rows) ? body.rows : null
  if (!rows) return NextResponse.json({ error: 'rows array required' }, { status: 400 })

  // Force imports as drafts (not published, not featured) regardless of CSV.
  const toInsert = []
  const errors = []
  const seenSlugsInBatch = new Set()
  for (let i = 0; i < rows.length; i++) {
    const r = { ...rows[i], is_published: false, is_featured: false }
    const { data: normalized, errors: rowErrs } = normalizeArticlePayload(r, { partial: false })
    if (rowErrs.length) {
      errors.push({ row: i + 1, slug: r.slug || null, error: rowErrs.join('; ') })
      continue
    }
    if (seenSlugsInBatch.has(normalized.slug)) {
      errors.push({ row: i + 1, slug: normalized.slug, error: 'duplicate slug within CSV' })
      continue
    }
    if (await slugExists(normalized.slug)) {
      errors.push({ row: i + 1, slug: normalized.slug, error: 'slug already exists in DB' })
      continue
    }
    seenSlugsInBatch.add(normalized.slug)
    toInsert.push(normalized)
  }

  if (!toInsert.length) {
    return NextResponse.json({ inserted: 0, skipped: rows.length, errors }, { status: 200 })
  }

  const { data, error } = await bulkInsertArticles(toInsert)
  if (error) {
    return NextResponse.json({
      inserted: 0,
      skipped: rows.length,
      errors: [...errors, { row: null, error: `bulk insert failed: ${error}` }],
    }, { status: 500 })
  }

  return NextResponse.json({
    inserted: data.length,
    skipped: rows.length - data.length,
    errors,
    imported: data,
  })
}


/* ----------------------- /api/training/exercises ----------------------- */
// Server-side pass-through to the free-exercise-db dataset.
// Query params: muscle, equipment (comma-separated), level, limit, exclude
async function handleTrainingExercises(request) {
  try {
    const { searchParams } = new URL(request.url)
    const muscle    = searchParams.get('muscle') || undefined
    const equipment = (searchParams.get('equipment') || '').split(',').filter(Boolean)
    const level     = searchParams.get('level') || undefined
    const limit     = parseInt(searchParams.get('limit') || '25', 10)
    const exclude   = (searchParams.get('exclude') || '').split(',').filter(Boolean)

    const db = await loadExerciseDB()
    const items = filterExercises(db, {
      muscle,
      equipment: equipment.length ? equipment : undefined,
      level,
      limit: Math.min(80, Math.max(1, limit)),
      exclude,
    })
    return NextResponse.json({ count: items.length, items })
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

// Given a muscle + equipment + exclude list, return ONE alternative exercise.
async function handleTrainingExerciseFind(request) {
  try {
    const { searchParams } = new URL(request.url)
    const muscle    = searchParams.get('muscle') || undefined
    const equipment = (searchParams.get('equipment') || '').split(',').filter(Boolean)
    const level     = searchParams.get('level') || undefined
    const exclude   = (searchParams.get('exclude') || '').split(',').filter(Boolean)

    const db = await loadExerciseDB()
    const items = filterExercises(db, {
      muscle,
      equipment: equipment.length ? equipment : undefined,
      level,
      limit: 10,
      exclude,
    })
    if (!items.length) return NextResponse.json({ item: null })
    // Deterministic-ish rotation: pick a random one so "Find alternative" varies.
    const pick = items[Math.floor(Math.random() * items.length)]
    return NextResponse.json({ item: pick })
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

