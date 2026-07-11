// /app/app/api/pubmed-search/route.js
// SelfScience — Dedicated server route for gene-targeted PubMed searches
// used by the Personalized Dashboard's "Research Matched to You" section.
//
// Accepts:  GET /api/pubmed-search?gene=MTHFR&limit=3
// Returns:  { results: [{ pmid, title, authors, journal, year, pubmedUrl }] }
//
// The NCBI E-utilities API key (if configured) stays server-side only.
// Uses Next.js fetch caching (revalidate=3600) to avoid hammering PubMed
// on every dashboard render.

import { NextResponse } from 'next/server'

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const NCBI_KEY = process.env.PUBMED_API_KEY || process.env.NCBI_API_KEY || ''
const withKey = (u) => (NCBI_KEY ? `${u}&api_key=${NCBI_KEY}` : u)

export const revalidate = 3600 // 1 hour

export async function GET(request) {
  const url = new URL(request.url)
  const gene = String(url.searchParams.get('gene') || '').trim()
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '3', 10), 1), 8)
  if (!gene) {
    return NextResponse.json({ results: [], error: 'gene param required' }, { status: 400 })
  }

  // Focus the search on real gene-symbol usage so we don't get noise from
  // acronym collisions. Add a recency window (last 3 years) to prefer
  // current-year-ish research.
  const currentYear = new Date().getFullYear()
  const oldestYear = currentYear - 3
  const term = `(${gene}[Gene Name] OR ${gene}[Title/Abstract]) AND (${oldestYear}:${currentYear}[dp])`

  try {
    const esearchUrl = withKey(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${limit}&retmode=json&sort=date`
    )
    const esearchRes = await fetch(esearchUrl, { next: { revalidate: 3600 } })
    if (!esearchRes.ok) throw new Error(`esearch ${esearchRes.status}`)
    const esearch = await esearchRes.json().catch(() => null)
    const ids = esearch?.esearchresult?.idlist || []
    if (!ids.length) return NextResponse.json({ results: [] })

    const summaryUrl = withKey(
      `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
    )
    const summaryRes = await fetch(summaryUrl, { next: { revalidate: 3600 } })
    if (!summaryRes.ok) throw new Error(`esummary ${summaryRes.status}`)
    const summary = await summaryRes.json().catch(() => null)
    const items = ids.map((pmid) => {
      const s = summary?.result?.[pmid] || {}
      const authors = Array.isArray(s.authors)
        ? s.authors.slice(0, 3).map((a) => a.name).filter(Boolean).join(', ')
        : ''
      const year = (s.pubdate || '').match(/\d{4}/)?.[0] || ''
      return {
        pmid,
        title: s.title || 'Untitled research',
        authors,
        journal: s.fulljournalname || s.source || '',
        year,
        pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      }
    })
    return NextResponse.json({ results: items })
  } catch (err) {
    // Never let a PubMed failure bubble as a 500 that breaks the client
    // — return an empty array so the dashboard degrades gracefully.
    return NextResponse.json({ results: [], error: err?.message || 'pubmed error' })
  }
}
