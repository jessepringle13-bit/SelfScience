// /app/lib/search/openAlex.js
// OpenAlex adapter. Uses the abstract_inverted_index format which requires
// reconstruction to plain text.

import { fetchWithTimeout, safeJson } from './http'
import { OPENALEX_MAILTO } from './common'

/** OpenAlex uses an inverted index for abstracts. Reconstruct the plain
 *  text from { word: [positions...] }. */
function reconstructOpenAlexAbstract(inv) {
  if (!inv || typeof inv !== 'object') return ''
  const positions = []
  for (const [word, poss] of Object.entries(inv)) {
    for (const p of poss || []) positions[p] = word
  }
  return positions.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export async function searchOpenAlex(query, limit = 10) {
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
