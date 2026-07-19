// /app/lib/search/pubmed.js
// PubMed E-utilities adapter (esearch + esummary + efetch/abstract XML).
// Requires NCBI_API_KEY / PUBMED_API_KEY env var for the ~10 req/s tier.

import { fetchWithTimeout, safeJson, safeText } from './http'
import { yearFromPubdate } from './common'

const NCBI_KEY = process.env.PUBMED_API_KEY || process.env.NCBI_API_KEY || ''
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

const withKey = (url) => (NCBI_KEY ? `${url}&api_key=${NCBI_KEY}` : url)

// Extract PubMed abstracts from efetch XML for a batch of PMIDs.
// Returns { [pmid]: abstractString }
function parsePubmedAbstracts(xml) {
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
        .replace(/<[^>]+>/g, '')
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

export async function searchPubmed(query, limit = 100) {
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
