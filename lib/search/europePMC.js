// /app/lib/search/europePMC.js
// Europe PMC free-text search. No API key required. Covers PubMed + additional
// biomedical literature (preprints, agricola, patents) that PubMed alone misses.
// Response schema: https://europepmc.org/RestfulWebService

import { fetchWithTimeout, safeJson } from './http'

export async function searchEuropePMC(query, limit = 40) {
  try {
    const url =
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search` +
      `?query=${encodeURIComponent(query)}` +
      `&format=json&pageSize=${Math.min(limit, 100)}` +
      `&resultType=core`
    const res = await fetchWithTimeout(url, { cache: 'no-store' }, 12_000)
    if (!res.ok) {
      console.warn('Europe PMC returned', res.status)
      return []
    }
    const data = await safeJson(res)
    const rows = data?.resultList?.result || []
    return rows.map((r) => {
      const authors = (r.authorList?.author || []).map((a) => a.fullName || a.lastName).filter(Boolean)
      const doi = r.doi || null
      const isPreprint = r.source === 'PPR' || /preprint|biorxiv|medrxiv|arxiv/i.test(r.journalTitle || '')
      const oaUrl = r.hasPDF === 'Y' && r.pmcid
        ? `https://europepmc.org/article/PMC/${r.pmcid}`
        : null
      const rawId = r.pmid ? `pubmed:${r.pmid}` : r.doi ? `doi:${r.doi}` : `eupmc:${r.id}`
      return {
        id: rawId,
        provider: 'Europe PMC',
        source: isPreprint ? 'preprint' : 'peer-reviewed',
        title: (r.title || '(untitled)').replace(/\.$/, ''),
        journal: r.journalTitle || (isPreprint ? 'Preprint' : ''),
        year: parseInt(r.pubYear, 10) || null,
        authors,
        authorsShort:
          authors.slice(0, 3).join(', ') + (authors.length > 3 ? ', et al.' : ''),
        abstract: r.abstractText || '',
        doi,
        url: doi ? `https://doi.org/${doi}` : (r.pmid ? `https://europepmc.org/article/MED/${r.pmid}` : `https://europepmc.org/article/${r.source}/${r.id}`),
        pmid: r.pmid || null,
        citationCount: r.citedByCount ?? null,
        oaUrl,
        oaStatus: r.isOpenAccess === 'Y' ? 'gold' : null,
        reliability: null,
        reliabilityLabel: null,
        reliabilityNote: null,
        plain: null,
        flags: [],
      }
    })
  } catch (err) {
    console.error('Europe PMC error:', err)
    return []
  }
}
