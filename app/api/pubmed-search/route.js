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
  // Phase-B research fix: accept an arbitrary plain-language query so the
  // Discover feed can pull per-pillar or per-variant research using
  // real English terms — PubMed does NOT match raw rsIDs.
  const q = String(url.searchParams.get('q') || '').trim()
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '3', 10), 1), 12)
  // Optional recency window (in days). Defaults to a 3-YEAR window for
  // gene-symbol lookups, but callers can narrow it (e.g. Discover "New
  // this month" wants a 90-day window).
  const daysParam = parseInt(url.searchParams.get('days') || '0', 10)
  if (!gene && !q) {
    return NextResponse.json({ results: [], error: 'gene or q param required' }, { status: 400 })
  }

  // Focus the search on real gene-symbol usage so we don't get noise from
  // acronym collisions. Add a recency window (last 3 years) to prefer
  // current-year-ish research. When `q` is provided, we run the query
  // verbatim (already plain-language) so PubMed's default relevance
  // ranking applies.
  const currentYear = new Date().getFullYear()
  const oldestYear = currentYear - 3
  let term
  if (q) {
    // If the caller narrowed the window in days, use PubMed's relative
    // date filter (dp = date-of-publication in [yyyy/mm/dd] syntax).
    if (daysParam > 0 && Number.isFinite(daysParam)) {
      const now = new Date()
      const past = new Date(now.getTime() - daysParam * 24 * 60 * 60 * 1000)
      const fmt = (d) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
      term = `(${q}) AND (${fmt(past)}:${fmt(now)}[dp])`
    } else {
      term = `(${q}) AND (${oldestYear}:${currentYear}[dp])`
    }
  } else {
    term = `(${gene}[Gene Name] OR ${gene}[Title/Abstract]) AND (${oldestYear}:${currentYear}[dp])`
  }

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
      // Parse a real Date so the client can apply date-window filters
      // (e.g. Discover's "New this month" 90-day cutoff). PubMed's
      // `sortpubdate` comes back as "2025/08/01 00:00" — we just need
      // the y/m/d portion, which JS Date parses reliably.
      const rawDate = s.sortpubdate || s.pubdate || (year ? `${year}/01/01` : '')
      let pubDate = null
      if (rawDate) {
        // Take the leading "yyyy/mm/dd" (or "yyyy Mon dd" fallback) and
        // let Date figure it out.
        const iso = String(rawDate).split(' ')[0]
        const d = new Date(iso.replace(/\//g, '-'))
        if (Number.isFinite(d.getTime())) {
          pubDate = d.toISOString()
        } else if (year) {
          pubDate = new Date(`${year}-01-01`).toISOString()
        }
      }
      return {
        pmid,
        id: `pubmed:${pmid}`,
        title: s.title || 'Untitled research',
        authors,
        journal: s.fulljournalname || s.source || '',
        year,
        pubDate,
        source: 'PubMed',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
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
