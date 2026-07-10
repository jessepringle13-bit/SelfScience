import { NextResponse } from 'next/server'
import {
  scoreReliability as callReliability,
  translatePlainLanguage as callPlainLanguage,
  interpretGenome as callGenome,
  extractJson,
} from '@/lib/ai'
import {
  buildReliabilityPrompt,
  buildPlainLanguagePrompt,
  buildGenomePrompt,
} from '@/lib/prompts'
import { VARIANT_CATALOG, APPROVED_RSIDS } from '@/lib/variant-catalog'
import { getPillarQuery } from '@/lib/pillars'
import { searchCache, makeCacheKey } from '@/lib/cache'
import { getUsageSnapshot, fetchOpenRouterCredit } from '@/lib/ai-usage'

const NCBI_KEY = process.env.PUBMED_API_KEY || process.env.NCBI_API_KEY || ''
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const S2_BASE = 'https://api.semanticscholar.org/graph/v1'

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
    const esearchRes = await fetch(esearchUrl, { cache: 'no-store' })
    if (!esearchRes.ok) throw new Error(`PubMed esearch ${esearchRes.status}`)
    const esearch = await safeJson(esearchRes)
    const ids = esearch?.esearchresult?.idlist || []
    if (!ids.length) return []

    // Fetch summaries + abstracts in parallel
    const idsJoined = ids.join(',')
    const [sumRes, absRes] = await Promise.all([
      fetch(
        withKey(`${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${idsJoined}&retmode=json`),
        { cache: 'no-store' }
      ),
      fetch(
        withKey(
          `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${idsJoined}&rettype=abstract&retmode=xml`
        ),
        { cache: 'no-store' }
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
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
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
    const res = await fetch(url, { cache: 'no-store' })
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
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': `SelfScience/0.4 (mailto:${OPENALEX_MAILTO})` },
    })
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

export async function GET(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p
  const subRoute = Array.isArray(p) ? p[1] : null

  if (route === 'search') return handleSearch(request)
  if (route === 'autocomplete') return handleAutocomplete(request)
  if (route === 'admin' && subRoute === 'ai-usage') return handleAdminAiUsage(request)

  return NextResponse.json({
    status: 'ok',
    service: 'selfscience',
    version: '0.5.0',
    endpoints: [
      '/api/search?q=<query>&source=all|pubmed|s2|openalex|crossref&limit=40&pillar=<name>',
      '/api/autocomplete?q=<partial>',
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
    const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
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
  for (const [rsid, gt] of Object.entries(variants || {})) {
    const meta = catalog[rsid]
    recognized.push({
      rsid, gene: meta?.gene || '', variant_name: meta?.description || '',
      genotype_called: gt, pillar: meta?.pillar || 'General',
      classification: 'Neutral',
    })
    if (meta?.pillar) {
      const p = meta.pillar
      byPillar[p] = byPillar[p] || []
      byPillar[p].push({
        gene: meta.gene, rsid, genotype: gt,
        classification: 'Neutral',
        explanation: `Research area: ${meta.description}. Full AI interpretation was not available for this session — the SelfScience search engine can surface studies on this variant directly.`,
        landmarkStudy: '',
        searches: [`${meta.gene} ${meta.description.split('—')[0].trim()}`, `${meta.gene} health research`],
      })
      enriched.push({ label: meta.description, one_line: `Research literature is available for ${meta.gene}. Explore on SelfScience.`, pillar: p, rsid, gene: meta.gene, genotype: gt })
    }
  }
  const pillars = Object.keys(byPillar).sort()
  return {
    session_id: Math.random().toString(36).slice(2, 10),
    variants_recognized: recognized,
    pillar_reports: pillars.map((p) => ({ pillar: p, strengths: [], awareness_areas: byPillar[p] })),
    overall_summary: {
      top_strengths: [],
      top_awareness_areas: enriched.slice(0, 6),
      system_view: 'Genetics is not destiny. This report provides research pointers based on your recognized variants.',
    },
    research_roadmap: {
      introduction: 'Based on your recognized variants, these are the research areas most relevant to explore.',
      pillars: pillars.map((p, i) => ({
        pillar: p, priority: i + 1,
        reason: `You have ${byPillar[p].length} recognized variant${byPillar[p].length === 1 ? '' : 's'} in ${p}.`,
        top_searches: [...new Set(byPillar[p].flatMap((v) => v.searches))].slice(0, 4),
      })),
    },
    privacy_confirmation: { data_received: 'Variant calls only', data_retained: false, session_ends: 'Data cleared on session close', file_processed: 'Client-side only' },
    disclaimer: { user_facing: 'This report is for educational purposes only. Not a medical diagnosis.', display: 'always_visible' },
    // UI-compat aliases (same shape the AI-driven path produces):
    overview: {
      strengths: [],
      areasToExplore: enriched.slice(0, 6).map((a) => ({ name: a.label, plain: a.one_line, pillar: a.pillar, rsid: a.rsid, gene: a.gene, genotype: a.genotype })),
      systemView: 'Genetics is not destiny. This report provides research pointers based on your recognized variants.',
    },
    fullReport: pillars.map((p) => ({ pillar: p, variants: byPillar[p] })),
    researchRoadmap: pillars.map((p, i) => ({
      priority: i + 1, pillar: p,
      why: `You have ${byPillar[p].length} recognized variant${byPillar[p].length === 1 ? '' : 's'} in ${p}.`,
      searches: [...new Set(byPillar[p].flatMap((v) => v.searches))].slice(0, 4),
    })),
  }
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

  try {
    // Empirical: with >50 recognized variants the AI cascade consistently
    // fails schema validation (models return garbage JSON when the prompt
    // list is that long) OR times out on Emergent's 60s ingress. In that
    // regime the variant-only fallback is BOTH faster AND more reliable —
    // it uses the curated variant-catalog to generate a solid pillar
    // breakdown, book matches, and search-starting-points from your
    // recognized variants directly. So we skip the AI cascade entirely
    // for large uploads.
    //
    // Small uploads (sample data, targeted panels) still get the AI-driven
    // interpretation because with <=50 variants the model can handle the
    // prompt reliably in ~15-20s.
    const numVariants = Object.keys(variants).length
    const SKIP_AI_THRESHOLD = 30
    const skipAi = numVariants > SKIP_AI_THRESHOLD

    let attempt = null
    let parsed = null
    if (!skipAi) {
      const prompt = buildGenomePrompt(variants, VARIANT_CATALOG)
      try {
        attempt = await callGenome(prompt)
        parsed = extractJson(attempt.text)
      } catch (aiErr) {
        console.warn(`[interpret-genome] AI cascade failed: ${aiErr?.status || 'net'} ${aiErr?.message?.slice(0, 160)}. Serving variant-only fallback.`)
      }
    } else {
      console.info(`[interpret-genome] ${numVariants} variants > threshold ${SKIP_AI_THRESHOLD} — serving variant-only fallback directly.`)
    }

    if (!parsed) {
      // Graceful fallback: build a MINIMAL valid response from the variants
      // alone. The UI can still render pillar-level guidance, book matches,
      // and a research roadmap; the user avoids a hard error. We return 200
      // with `_aiFallback: true` so downstream can show a subtle notice
      // ("AI analysis was unavailable — showing your variant-based roadmap").
      const minimal = buildMinimalGenomeReport(variants, VARIANT_CATALOG)
      return NextResponse.json(
        {
          ...minimal,
          aiProvider: attempt?.provider || 'fallback',
          aiModel: attempt?.model || 'variant-catalog',
          _aiFallback: true,
        },
        { status: 200 }
      )
    }
    const { text, provider, model } = attempt
    // Map new Session-5 schema to the shape the frontend genome-client expects
    const overall = parsed.overall_summary || {}
    const normalized = {
      // New Session-5 schema (raw)
      ...parsed,
      // Compat aliases for existing UI:
      overview: {
        strengths: (overall.top_strengths || []).map((s) => ({
          name: s.label || s.strength_name || '',
          plain: s.one_line || '',
          pillar: s.pillar || '',
          rsid: s.rsid || '',
          gene: s.gene || '',
          genotype: s.genotype || '',
        })),
        areasToExplore: (overall.top_awareness_areas || []).map((a) => ({
          name: a.label || a.awareness_name || '',
          plain: a.one_line || '',
          pillar: a.pillar || '',
          rsid: a.rsid || '',
          gene: a.gene || '',
          genotype: a.genotype || '',
        })),
        systemView: overall.system_view || '',
      },
      fullReport: (parsed.pillar_reports || []).map((p) => ({
        pillar: p.pillar,
        variants: [
          ...(p.strengths || []).map((v) => ({
            gene: v.gene, rsid: v.rsid, genotype: v.genotype,
            classification: 'Strength',
            explanation: v.user_explanation || '',
            landmarkStudy: v.landmark_study?.title
              ? `${v.landmark_study.title} — ${v.landmark_study.authors || ''} (${v.landmark_study.year || ''})`
              : '',
            searches: v.search_queries || [],
          })),
          ...(p.awareness_areas || []).map((v) => ({
            gene: v.gene, rsid: v.rsid, genotype: v.genotype,
            classification: 'Awareness',
            explanation: v.user_explanation || v.research_direction || '',
            landmarkStudy: v.landmark_study?.title
              ? `${v.landmark_study.title} — ${v.landmark_study.authors || ''} (${v.landmark_study.year || ''})`
              : '',
            searches: v.search_queries || [],
          })),
        ],
      })),
      researchRoadmap: (parsed.research_roadmap?.pillars || []).map((r) => ({
        priority: r.priority, pillar: r.pillar, why: r.reason, searches: r.top_searches || [],
      })),
    }
    return NextResponse.json({ ...normalized, aiProvider: provider, aiModel: model })
  } catch (err) {
    console.error('interpret-genome error:', err?.message)
    return NextResponse.json(
      { error: 'Analysis temporarily unavailable. Results still accessible.', detail: err?.message?.slice(0, 200) },
      { status: err?.status || 500 }
    )
  }
}

export async function POST(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p

  // New endpoints per spec
  if (route === 'score-reliability') return handleScoreReliability(request)
  if (route === 'translate-plain-language') return handleTranslatePlainLanguage(request)
  if (route === 'interpret-genome') return handleInterpretGenome(request)

  // Backward-compat aliases so existing clients keep working during migration
  if (route === 'analyze') return handleScoreReliability(request)
  if (route === 'genome') return handleInterpretGenome(request)

  return NextResponse.json({ status: 'ok' })
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
