import { NextResponse } from 'next/server'

const NCBI_KEY = process.env.NCBI_API_KEY || ''
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

/* ---------------------------- Merge + dedupe ------------------------------ */

const normalizeTitle = (t) =>
  (t || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function mergeResults(pubmed, s2) {
  const seen = new Map() // key -> item
  const push = (item) => {
    const key = item.doi ? `doi:${item.doi.toLowerCase()}` : `title:${normalizeTitle(item.title)}`
    if (!seen.has(key)) {
      seen.set(key, item)
    } else {
      // Prefer PubMed record; but fill in abstract if missing
      const existing = seen.get(key)
      if (!existing.abstract && item.abstract) existing.abstract = item.abstract
      if (!existing.citationCount && item.citationCount)
        existing.citationCount = item.citationCount
    }
  }
  ;[...pubmed, ...s2].forEach(push)

  // Interleave to preserve variety, then sort by year desc if year present
  const list = [...seen.values()]
  list.sort((a, b) => (b.year || 0) - (a.year || 0))
  return list
}

/* ------------------------------ /api/search ------------------------------- */

async function handleSearch(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const sourceFilter = searchParams.get('source') || 'all' // all | pubmed | s2
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 30)
  const pillar = searchParams.get('pillar') || ''

  if (!q) {
    return NextResponse.json({ query: '', results: [], total: 0, sources: {} })
  }

  // Bias the query with the pillar name for a simple UX-side filter
  const effectiveQuery = pillar ? `${q} ${pillar}` : q

  const pubmedPromise =
    sourceFilter === 's2' ? Promise.resolve([]) : searchPubmed(effectiveQuery, 12)
  const s2Promise =
    sourceFilter === 'pubmed'
      ? Promise.resolve([])
      : searchSemanticScholar(effectiveQuery, 10)

  const [pubmedResults, s2Results] = await Promise.all([pubmedPromise, s2Promise])
  const merged = mergeResults(pubmedResults, s2Results).slice(0, limit)

  return NextResponse.json({
    query: q,
    pillar,
    total: merged.length,
    sources: {
      pubmed: pubmedResults.length,
      semanticScholar: s2Results.length,
    },
    results: merged,
  })
}

/* --------------------------------- Router --------------------------------- */

export async function GET(request, { params }) {
  const p = (await params)?.path || []
  const route = Array.isArray(p) ? p[0] : p

  if (route === 'search') return handleSearch(request)

  return NextResponse.json({
    status: 'ok',
    service: 'selfscience',
    version: '0.2.0',
    endpoints: ['/api/search?q=<query>&source=all|pubmed|s2&limit=20&pillar=<name>'],
  })
}

export async function POST() {
  return NextResponse.json({ status: 'ok' })
}
