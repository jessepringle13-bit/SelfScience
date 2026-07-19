// /app/lib/search/crossref.js
// Crossref adapter. Abstracts arrive as JATS-wrapped XML — stripped inline.

import { fetchWithTimeout, safeJson } from './http'
import { OPENALEX_MAILTO } from './common'

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

export async function searchCrossref(query, limit = 10) {
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
