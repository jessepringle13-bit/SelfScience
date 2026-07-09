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

function mergeResults(...arrays) {
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

  const list = [...seen.values()]
  list.sort((a, b) => (b.year || 0) - (a.year || 0))
  return list
}

/* ------------------------------ /api/search ------------------------------- */

async function handleSearch(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const sourceFilter = searchParams.get('source') || 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 40)
  const pillar = searchParams.get('pillar') || ''

  if (!q) {
    return NextResponse.json({ query: '', results: [], total: 0, sources: {} })
  }

  const effectiveQuery = pillar ? `${q} ${pillar}` : q
  const wants = (name) => sourceFilter === 'all' || sourceFilter === name

  const [pubmedResults, s2Results, openAlexResults, crossrefResults] = await Promise.all([
    wants('pubmed') ? searchPubmed(effectiveQuery, 12) : Promise.resolve([]),
    wants('s2') ? searchSemanticScholar(effectiveQuery, 10) : Promise.resolve([]),
    wants('openalex') ? searchOpenAlex(effectiveQuery, 10) : Promise.resolve([]),
    wants('crossref') ? searchCrossref(effectiveQuery, 10) : Promise.resolve([]),
  ])

  const merged = mergeResults(
    pubmedResults,
    s2Results,
    openAlexResults,
    crossrefResults
  ).slice(0, limit)

  return NextResponse.json({
    query: q,
    pillar,
    total: merged.length,
    sources: {
      pubmed: pubmedResults.length,
      semanticScholar: s2Results.length,
      openAlex: openAlexResults.length,
      crossref: crossrefResults.length,
    },
    results: merged,
  })
}

/* --------------------------------- Router --------------------------------- */

export async function GET(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p

  if (route === 'search') return handleSearch(request)
  if (route === 'autocomplete') return handleAutocomplete(request)

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
    const prompt = buildGenomePrompt(variants, VARIANT_CATALOG)
    const { text, provider, model } = await callGenome(prompt)
    const parsed = extractJson(text)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Analysis temporarily unavailable. Results still accessible.', raw: (text || '').slice(0, 500), provider, model },
        { status: 502 }
      )
    }
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
