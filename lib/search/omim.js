// /app/lib/search/omim.js
// OMIM (Online Mendelian Inheritance in Man) gene-registry adapter.
// Missing OMIM_API_KEY -> returns [] silently so the pipeline never blocks.
// Key: https://omim.org/api

import { fetchWithTimeout, safeJson } from './http'

export async function searchOMIM(gene) {
  const key = process.env.OMIM_API_KEY
  if (!key || !gene) return []
  try {
    const url =
      `https://api.omim.org/api/entry/search` +
      `?search=approved_gene_symbol:${encodeURIComponent(gene)}` +
      `&limit=8&format=json&apiKey=${encodeURIComponent(key)}`
    const res = await fetchWithTimeout(url, { cache: 'no-store' }, 10_000)
    if (!res.ok) return []
    const data = await safeJson(res)
    const rows = data?.omim?.searchResponse?.entryList || []
    return rows.map((r) => {
      const e = r?.entry || {}
      const mimNumber = e.mimNumber || ''
      const title = (e.titles?.preferredTitle || `OMIM ${mimNumber}`).replace(/\.$/, '')
      return {
        id: `omim:${mimNumber}`,
        provider: 'OMIM',
        source: 'omim',
        title: `${gene}: ${title}`,
        journal: 'Online Mendelian Inheritance in Man',
        year: null,
        authors: [],
        authorsShort: '',
        abstract: e.textSection?.[0]?.textSectionContent || '',
        doi: null,
        url: `https://www.omim.org/entry/${mimNumber}`,
        pmid: null,
        reliability: null,
        reliabilityLabel: null,
        reliabilityNote: null,
        plain: null,
        flags: [],
        _matchedGenes: [gene.toUpperCase()],
      }
    })
  } catch (err) {
    console.error('OMIM error:', err?.message)
    return []
  }
}
