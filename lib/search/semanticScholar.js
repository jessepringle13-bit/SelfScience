// /app/lib/search/semanticScholar.js
// Semantic Scholar /paper/search adapter. Frequently rate-limits on the
// public tier — we swallow 429s and return [] so the rest of the fan-out
// still returns results.

import { fetchWithTimeout, safeJson } from './http'
import { detectPreprint } from './common'

const S2_BASE = 'https://api.semanticscholar.org/graph/v1'

export async function searchSemanticScholar(query, limit = 100) {
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
