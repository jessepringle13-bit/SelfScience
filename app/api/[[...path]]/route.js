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
  extractJson,
} from '@/lib/ai'
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

const NCBI_KEY = process.env.PUBMED_API_KEY || process.env.NCBI_API_KEY || ''
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const S2_BASE = 'https://api.semanticscholar.org/graph/v1'

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

/* --------------------------------- Utils ---------------------------------- */

const withKey = (url) => (NCBI_KEY ? `${url}&api_key=${NCBI_KEY}` : url)

const safeJson = async (res) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const safeText = async (res) => {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

/**
 * fetch() with a hard timeout. Any biomedical API that hasn't returned
 * headers by the timeout is aborted, ensuring the parent /api/search call
 * never runs past the ingress 60s cap because one provider (looking at you,
 * Crossref) decided to hang.
 *
 * Callers should still wrap in try/catch and treat AbortError as "no
 * results" — the existing per-provider handlers already do this.
 */
async function fetchWithTimeout(url, options = {}, ms = 12_000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

/* Extract PubMed abstracts from efetch XML for a batch of PMIDs.
 * Returns { [pmid]: abstractString } */
const parsePubmedAbstracts = (xml) => {
  const out = {}
  if (!xml) return out
  // Split per PubmedArticle block
  const articleBlocks = xml.split(/<PubmedArticle[\s>]/).slice(1)
  for (const block of articleBlocks) {
    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)
    if (!pmidMatch) continue
    const pmid = pmidMatch[1]
    // Grab all <AbstractText ...>...</AbstractText> pieces (some abstracts are multi-section)
    const parts = [...block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)].map((m) =>
      m[1]
        .replace(/<[^>]+>/g, '') // strip inner tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim()
    )
    out[pmid] = parts.join(' ').trim()
  }
  return out
}

const yearFromPubdate = (pubdate) => {
  if (!pubdate) return null
  const m = String(pubdate).match(/(19|20)\d{2}/)
  return m ? parseInt(m[0], 10) : null
}

const detectPreprint = (paper) => {
  const journalName = paper?.journal?.name || paper?.venue || ''
  const types = paper?.publicationTypes || []
  const isPreprintVenue = /biorxiv|medrxiv|arxiv|chemrxiv|ssrn|preprints\.org/i.test(journalName)
  const isPreprintType = types.some((t) => /preprint/i.test(t))
  return isPreprintVenue || isPreprintType
}

/* ------------------------------ PubMed search ----------------------------- */

async function searchPubmed(query, limit = 12) {
  try {
    const esearchUrl = withKey(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        query
      )}&retmax=${limit}&retmode=json&sort=relevance`
    )
    const esearchRes = await fetchWithTimeout(esearchUrl, { cache: 'no-store' }, 10_000)
    if (!esearchRes.ok) throw new Error(`PubMed esearch ${esearchRes.status}`)
    const esearch = await safeJson(esearchRes)
    const ids = esearch?.esearchresult?.idlist || []
    if (!ids.length) return []

    // Fetch summaries + abstracts in parallel
    const idsJoined = ids.join(',')
    const [sumRes, absRes] = await Promise.all([
      fetchWithTimeout(
        withKey(`${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${idsJoined}&retmode=json`),
        { cache: 'no-store' },
        10_000
      ),
      fetchWithTimeout(
        withKey(
          `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${idsJoined}&rettype=abstract&retmode=xml`
        ),
        { cache: 'no-store' },
        10_000
      ),
    ])

    const summary = await safeJson(sumRes)
    const abstractsXml = await safeText(absRes)
    const abstractsMap = parsePubmedAbstracts(abstractsXml)

    const results = []
    for (const pmid of ids) {
      const rec = summary?.result?.[pmid]
      if (!rec) continue
      const authors = (rec.authors || []).map((a) => a.name).filter(Boolean)
      const doi =
        (rec.articleids || []).find((x) => x.idtype === 'doi')?.value || null
      results.push({
        id: `pubmed:${pmid}`,
        provider: 'PubMed',
        source: 'peer-reviewed',
        title: rec.title?.replace(/\.$/, '') || '(untitled)',
        journal: rec.fulljournalname || rec.source || '',
        year: yearFromPubdate(rec.pubdate || rec.epubdate),
        authors,
        authorsShort: authors.slice(0, 3).join(', ') + (authors.length > 3 ? ', et al.' : ''),
        abstract: abstractsMap[pmid] || '',
        doi,
        url: doi
          ? `https://doi.org/${doi}`
          : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        pmid,
        // AI-populated later
        reliability: null,
        reliabilityLabel: null,
        reliabilityNote: null,
        plain: null,
        flags: [],
      })
    }
    return results
  } catch (err) {
    console.error('PubMed error:', err)
    return []
  }
}

/* -------------------------- Semantic Scholar search ----------------------- */

async function searchSemanticScholar(query, limit = 10) {
  try {
    const fields = [
      'title',
      'abstract',
      'authors',
      'year',
      'journal',
      'venue',
      'openAccessPdf',
      'publicationTypes',
      'externalIds',
      'url',
      'citationCount',
    ].join(',')
    const url = `${S2_BASE}/paper/search?query=${encodeURIComponent(
      query
    )}&limit=${limit}&fields=${fields}`
    const res = await fetchWithTimeout(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }, 12_000)
    if (!res.ok) {
      // S2 often 429s; return empty rather than fail whole search
      console.warn('Semantic Scholar returned', res.status)
      return []
    }
    const data = await safeJson(res)
    const papers = data?.data || []

    return papers.map((p) => {
      const authors = (p.authors || []).map((a) => a.name).filter(Boolean)
      const preprint = detectPreprint(p)
      const journal = p.journal?.name || p.venue || (preprint ? 'Preprint' : '')
      const doi = p.externalIds?.DOI || null
      const paperId = p.paperId || p.externalIds?.CorpusId || ''
      const link =
        p.openAccessPdf?.url ||
        p.url ||
        (doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${paperId}`)
      return {
        id: `s2:${paperId}`,
        provider: 'Semantic Scholar',
        source: preprint ? 'preprint' : 'peer-reviewed',
        title: p.title || '(untitled)',
        journal,
        year: p.year || null,
        authors,
        authorsShort:
          authors.slice(0, 3).join(', ') + (authors.length > 3 ? ', et al.' : ''),
        abstract: p.abstract || '',
        doi,
        url: link,
        pmid: p.externalIds?.PubMed || null,
        citationCount: p.citationCount ?? null,
        reliability: null,
        reliabilityLabel: null,
        reliabilityNote: null,
        plain: null,
        flags: [],
      }
    })
  } catch (err) {
    console.error('Semantic Scholar error:', err)
    return []
  }
}

/* ------------------------------ OpenAlex ---------------------------------- */

/**
 * OpenAlex uses an inverted index for abstracts.
 * Reconstruct the plain text from { word: [positions...] }.
 */
function reconstructOpenAlexAbstract(inv) {
  if (!inv || typeof inv !== 'object') return ''
  const positions = []
  for (const [word, poss] of Object.entries(inv)) {
    for (const p of poss || []) positions[p] = word
  }
  return positions.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

const OPENALEX_MAILTO = process.env.CONTACT_EMAIL || 'contact@selfscience.io'

async function searchOpenAlex(query, limit = 10) {
  try {
    const url =
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
      `&per-page=${limit}&mailto=${encodeURIComponent(OPENALEX_MAILTO)}` +
      `&filter=is_paratext:false,type:article|preprint|review|book-chapter|dataset` +
      `&select=id,doi,title,publication_year,authorships,primary_location,type,abstract_inverted_index,open_access,cited_by_count`
    const res = await fetchWithTimeout(url, { cache: 'no-store' }, 12_000)
    if (!res.ok) {
      console.warn('OpenAlex returned', res.status)
      return []
    }
    const data = await safeJson(res)
    const works = data?.results || []
    return works.map((w) => {
      const doi = w.doi ? String(w.doi).replace(/^https?:\/\/doi\.org\//i, '') : null
      const authors = (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean)
      const journal = w.primary_location?.source?.display_name || ''
      const isPreprint = /preprint/i.test(w.type || '') || /biorxiv|medrxiv|arxiv|ssrn/i.test(journal)
      const openAccess = w.open_access || {}
      const oaUrl = openAccess.oa_url || null
      return {
        id: `oa:${(w.id || '').split('/').pop()}`,
        provider: 'OpenAlex',
        source: isPreprint ? 'preprint' : 'peer-reviewed',
        title: w.title || '(untitled)',
        journal,
        year: w.publication_year || null,
        authors,
        authorsShort:
          authors.slice(0, 3).join(', ') + (authors.length > 3 ? ', et al.' : ''),
        abstract: reconstructOpenAlexAbstract(w.abstract_inverted_index),
        doi,
        url: doi ? `https://doi.org/${doi}` : w.id,
        pmid: null,
        citationCount: w.cited_by_count ?? null,
        oaUrl,
        oaStatus: openAccess.oa_status || null,
        reliability: null,
        reliabilityLabel: null,
        reliabilityNote: null,
        plain: null,
        flags: [],
      }
    })
  } catch (err) {
    console.error('OpenAlex error:', err)
    return []
  }
}

/* ------------------------------ Crossref ---------------------------------- */

function stripJats(str) {
  if (!str) return ''
  return String(str)
    .replace(/<jats:[^>]+>/gi, '')
    .replace(/<\/jats:[^>]+>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function searchCrossref(query, limit = 10) {
  try {
    const url =
      `https://api.crossref.org/works?query=${encodeURIComponent(query)}` +
      `&rows=${limit}` +
      `&mailto=${encodeURIComponent(OPENALEX_MAILTO)}`
    const res = await fetchWithTimeout(url, {
      cache: 'no-store',
      headers: { 'User-Agent': `SelfScience/0.4 (mailto:${OPENALEX_MAILTO})` },
    }, 12_000)
    if (!res.ok) {
      console.warn('Crossref returned', res.status)
      return []
    }
    const data = await safeJson(res)
    const items = data?.message?.items || []
    return items.map((it) => {
      const doi = it.DOI || null
      const authors = (it.author || [])
        .map((a) => [a.given, a.family].filter(Boolean).join(' '))
        .filter(Boolean)
      const journal = (it['container-title'] || [])[0] || ''
      const year =
        it.published?.['date-parts']?.[0]?.[0] ||
        it['published-online']?.['date-parts']?.[0]?.[0] ||
        it['published-print']?.['date-parts']?.[0]?.[0] ||
        null
      const isPreprint = it.subtype === 'preprint' || /preprint/i.test(it.type || '')
      return {
        id: `crossref:${(doi || it.title?.[0] || '').slice(0, 60)}`,
        provider: 'Crossref',
        source: isPreprint ? 'preprint' : 'peer-reviewed',
        title: (it.title || [])[0] || '(untitled)',
        journal,
        year,
        authors,
        authorsShort:
          authors.slice(0, 3).join(', ') + (authors.length > 3 ? ', et al.' : ''),
        abstract: stripJats(it.abstract),
        doi,
        url: doi ? `https://doi.org/${doi}` : null,
        pmid: null,
        citationCount: null,
        oaUrl: null,
        reliability: null,
        reliabilityLabel: null,
        reliabilityNote: null,
        plain: null,
        flags: [],
      }
    })
  } catch (err) {
    console.error('Crossref error:', err)
    return []
  }
}

/* ---------------------------- Merge + dedupe ------------------------------ */

const normalizeTitle = (t) =>
  (t || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// Provider priority when the same paper is found in multiple sources.
// Later sources fill in missing fields (e.g., abstract, oaUrl, citationCount).
const PROVIDER_RANK = { PubMed: 0, 'Semantic Scholar': 1, OpenAlex: 2, Crossref: 3 }

/* -------------------------- Relevance filtering --------------------------- */

// Common English stopwords + a few generic academic filler words we don't want
// to inflate token overlap scores.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but',
  'is', 'are', 'was', 'were', 'be', 'as', 'by', 'with', 'from', 'that', 'this',
  'these', 'those', 'it', 'its', 'we', 'our', 'their', 'not', 'no', 'do', 'does',
  'has', 'have', 'had', 'can', 'may', 'might', 'will', 'shall', 'study',
  'research', 'paper', 'article',
])

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Turn a raw user query into { tokens, phrases, fullPhrase } where:
 *  - tokens = significant lowercase words (stopwords removed, min 2 chars OR digit)
 *  - phrases = the full query (if 2+ tokens) plus every adjacent bigram
 *  - fullPhrase = the full lowercased query string for exact-phrase matching
 */
function parseQuery(q) {
  const clean = (q || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return { tokens: [], phrases: [], fullPhrase: '' }
  const raw = clean.split(' ')
  const tokens = raw.filter((w) => w && !STOPWORDS.has(w) && (w.length >= 2 || /^\d+$/.test(w)))
  const phrases = new Set()
  if (tokens.length >= 2) {
    phrases.add(clean)
    for (let i = 0; i < raw.length - 1; i++) {
      if (STOPWORDS.has(raw[i]) || STOPWORDS.has(raw[i + 1])) continue
      const bigram = `${raw[i]} ${raw[i + 1]}`
      if (bigram.trim().length >= 3) phrases.add(bigram)
    }
  }
  return { tokens, phrases: [...phrases], fullPhrase: clean }
}

/**
 * Score a result against a parsed query. Higher score = more relevant.
 * Also returns a `keep` flag that decides whether to include the result at all.
 */
function scoreRelevance(item, parsed) {
  const { tokens, phrases, fullPhrase } = parsed
  const title = (item.title || '').toLowerCase()
  const abstract = (item.abstract || '').toLowerCase()
  const journal = (item.journal || '').toLowerCase()

  let score = 0

  // Full-query phrase — strongest signal
  if (fullPhrase && title.includes(fullPhrase)) score += 20
  else if (fullPhrase && abstract.includes(fullPhrase)) score += 12

  // Bigram / phrase matches
  let phraseHitsTitle = 0
  let phraseHitsAbstract = 0
  for (const p of phrases) {
    if (p === fullPhrase) continue // already counted
    if (title.includes(p)) { score += 6; phraseHitsTitle++ }
    else if (abstract.includes(p)) { score += 3; phraseHitsAbstract++ }
  }

  // Individual token (whole-word) matches
  let titleTokenHits = 0
  let absTokenHits = 0
  for (const t of tokens) {
    const re = new RegExp(`\\b${escapeRegex(t)}\\b`, 'i')
    if (re.test(title)) { score += 2; titleTokenHits++ }
    else if (re.test(abstract)) { score += 1; absTokenHits++ }
    else if (re.test(journal)) score += 0.5
  }

  // ---- Keep / drop decision ----
  // Filter out results that lack meaningful match to the query.
  // For "zone 2 training", this must drop "Work Zone Safety Gamification" (only
  // 2 of 3 tokens, no phrase) while keeping "Zone 2 aerobic exercise" (phrase match).
  let keep
  if (tokens.length === 0) {
    keep = true
  } else if (tokens.length === 1) {
    // Single-token query — trust source API but require ≥1 hit somewhere.
    keep = titleTokenHits + absTokenHits > 0
  } else {
    const hasFullPhrase =
      fullPhrase && (title.includes(fullPhrase) || abstract.includes(fullPhrase))
    const hasStrongBigram = phraseHitsTitle > 0
    const allTokensInTitle = titleTokenHits === tokens.length
    // Every query token appears SOMEWHERE (title+abstract) AND at least 2 of them
    // are in the title. This lets legitimate variations through (e.g. "rapamycin
    // and mTOR pathway in cancer" for query "rapamycin mTOR inhibition") but
    // drops results where the query looks like an accidental keyword overlap.
    const goodCoverage =
      (titleTokenHits + absTokenHits) === tokens.length &&
      titleTokenHits >= Math.min(2, tokens.length - 1)
    keep = hasFullPhrase || hasStrongBigram || allTokensInTitle || goodCoverage
  }

  return { score, keep }
}

function mergeResults(arrays, parsedQuery) {
  const seen = new Map()
  const all = []
  for (const arr of arrays) for (const it of arr) all.push(it)

  // Sort so higher-priority providers land first and become the "base" record
  all.sort((a, b) => (PROVIDER_RANK[a.provider] ?? 9) - (PROVIDER_RANK[b.provider] ?? 9))

  for (const item of all) {
    const key = item.doi
      ? `doi:${item.doi.toLowerCase()}`
      : `title:${normalizeTitle(item.title)}`
    if (!key || key === 'title:') continue
    if (!seen.has(key)) {
      seen.set(key, { ...item, providers: [item.provider] })
    } else {
      const existing = seen.get(key)
      if (!existing.providers.includes(item.provider)) existing.providers.push(item.provider)
      // Fill in missing fields from lower-priority sources
      if (!existing.abstract && item.abstract) existing.abstract = item.abstract
      if (!existing.oaUrl && item.oaUrl) existing.oaUrl = item.oaUrl
      if (!existing.oaStatus && item.oaStatus) existing.oaStatus = item.oaStatus
      if (!existing.citationCount && item.citationCount)
        existing.citationCount = item.citationCount
      if (!existing.journal && item.journal) existing.journal = item.journal
      if (!existing.doi && item.doi) existing.doi = item.doi
      if (!existing.pmid && item.pmid) existing.pmid = item.pmid
    }
  }

  let list = [...seen.values()]

  // Score + filter for relevance if the caller passed a parsed query.
  if (parsedQuery && parsedQuery.tokens.length > 0) {
    list = list
      .map((it) => {
        const r = scoreRelevance(it, parsedQuery)
        return { ...it, _relevance: r.score, _keep: r.keep }
      })
      .filter((it) => it._keep)
      // Primary sort: relevance desc; tiebreak: newer year first
      .sort((a, b) => (b._relevance - a._relevance) || ((b.year || 0) - (a.year || 0)))
      // Strip internal helper fields before returning to the client
      .map(({ _keep, ...rest }) => rest)
  } else {
    list.sort((a, b) => (b.year || 0) - (a.year || 0))
  }

  return list
}

/* ------------------------------ /api/search ------------------------------- */

async function handleSearch(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const sourceFilter = searchParams.get('source') || 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 40)
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

  // Pillar browse: pull deeper from each source so we can filter to recent 5y and still return ~20.
  const perSource = isPillarBrowse ? 20 : { pubmed: 12, s2: 10, oa: 10, crossref: 10 }
  const pubmedN   = typeof perSource === 'number' ? perSource : perSource.pubmed
  const s2N       = typeof perSource === 'number' ? perSource : perSource.s2
  const oaN       = typeof perSource === 'number' ? perSource : perSource.oa
  const crossrefN = typeof perSource === 'number' ? perSource : perSource.crossref

  const [pubmedResults, s2Results, openAlexResults, crossrefResults] = await Promise.all([
    (sourceFilter === 'all' || sourceFilter === 'pubmed')   ? searchPubmed(effectiveQuery, pubmedN)          : Promise.resolve([]),
    (sourceFilter === 'all' || sourceFilter === 's2')       ? searchSemanticScholar(effectiveQuery, s2N)     : Promise.resolve([]),
    (sourceFilter === 'all' || sourceFilter === 'openalex') ? searchOpenAlex(effectiveQuery, oaN)            : Promise.resolve([]),
    (sourceFilter === 'all' || sourceFilter === 'crossref') ? searchCrossref(effectiveQuery, crossrefN)      : Promise.resolve([]),
  ])

  // Merge + relevance filter + sort in one pass.
  let merged = mergeResults(
    [pubmedResults, s2Results, openAlexResults, crossrefResults],
    // In pillar-browse mode we skip the strict relevance filter — the curated
    // pillar query is meant to be broad, and we want a representative sweep
    // of the topic, not a phrase-matched exact hit.
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
    },
    results: merged,
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
  // Serve the cached prices JSON to the client. Read-only from the browser;
  // scraper script writes directly to the file.
  return NextResponse.json({
    meta: PRICES_JSON?._meta || {},
    prices: PRICES_JSON?.prices || {},
    count: Object.keys(PRICES_JSON?.prices || {}).length,
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
    let relatedSearches = []
    if (Array.isArray(parsed?.relatedSearches)) {
      relatedSearches = parsed.relatedSearches.filter((x) => typeof x === 'string' && x.length).slice(0, 5)
    }
    return NextResponse.json({ plain, sections, relatedSearches, aiProvider: provider, aiModel: model })
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
  if (route === 'interpret-genome') return handleInterpretGenome(request)

  // Backward-compat aliases so existing clients keep working during migration
  if (route === 'analyze') return handleScoreReliability(request)
  if (route === 'genome') return handleInterpretGenome(request)

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

