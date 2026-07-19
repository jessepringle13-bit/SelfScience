// /app/lib/search/disgenet.js
// DisGeNET gene-disease association adapter.
// Missing DISGENET_API_KEY -> returns [] silently so the pipeline never blocks.
// Key: https://www.disgenet.org/api

import { fetchWithTimeout, safeJson } from './http'

export async function searchDisGeNET(gene) {
  const key = process.env.DISGENET_API_KEY
  if (!key || !gene) return []
  try {
    const url =
      `https://www.disgenet.org/api/gda/gene/symbol/${encodeURIComponent(gene)}` +
      `?limit=15&format=json`
    const res = await fetchWithTimeout(url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${key}` },
    }, 10_000)
    if (!res.ok) return []
    const rows = (await safeJson(res)) || []
    return rows.slice(0, 12).map((r) => ({
      id: `disgenet:${r.diseaseid}-${gene}`,
      provider: 'DisGeNET',
      source: 'disgenet',
      title: `${gene}: ${r.disease_name || 'Disease association'}`,
      journal: 'DisGeNET (gene-disease evidence score)',
      year: r.year_finalist || null,
      authors: [],
      authorsShort: '',
      abstract: `${r.disease_name || ''}. Evidence score: ${r.score || 'n/a'} (out of 1.0). Reported in ${r.nof_pmids || 0} PubMed article(s), ${r.nof_snps || 0} SNP-level record(s).`,
      doi: null,
      url: `https://www.disgenet.org/browser/1/1/0/${gene}`,
      pmid: null,
      reliability: null,
      reliabilityLabel: null,
      reliabilityNote: null,
      plain: null,
      flags: [],
      _matchedGenes: [gene.toUpperCase()],
      _disgenetScore: r.score,
    }))
  } catch (err) {
    console.error('DisGeNET error:', err?.message)
    return []
  }
}
