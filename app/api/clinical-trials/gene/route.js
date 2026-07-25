// /app/app/api/clinical-trials/gene/route.js
// SelfScience — Lightweight ClinicalTrials.gov proxy for gene-scoped
// dashboard badges. Returns just the counts + the top 2 studies (sorted
// so recruiting comes first, then most-recent completed).
//
// Response shape:
//   {
//     gene: 'MTHFR',
//     total: 137,           // authoritative overall count (countTotal=true)
//     recruiting: 4,        // best-effort count over the first page
//     completed: 22,
//     terminated: 3,
//     other: 21,
//     active: 4,            // alias of recruiting for convenience
//     top: [{ nctId, title, status, phase, year, url }, ...] // max 2
//   }
//
// The Dashboard fetches once per unique gene and caches in localStorage
// for 24h (see /app/lib/geneTrialsCache.js). We also honour Next.js's
// data cache with revalidate=86400 so repeat SSR/API hits are cheap.

import { NextResponse } from 'next/server'

export const revalidate = 86400 // 24h server-side cache

const CT_BASE = 'https://clinicaltrials.gov/api/v2/studies'

const RECRUITING_STATUSES = new Set(['RECRUITING', 'NOT_YET_RECRUITING'])
const COMPLETED_STATUSES = new Set(['COMPLETED'])
const TERMINATED_STATUSES = new Set(['TERMINATED', 'WITHDRAWN', 'SUSPENDED'])

async function fetchJson(url, ms = 10_000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, next: { revalidate: 86400 } })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

function emptyPayload(gene, extra = {}) {
  return {
    gene,
    total: 0,
    recruiting: 0,
    completed: 0,
    terminated: 0,
    other: 0,
    active: 0,
    top: [],
    ...extra,
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  const geneRaw = String(url.searchParams.get('gene') || '').trim()
  if (!geneRaw || geneRaw.length > 20) {
    return NextResponse.json({ error: 'gene required' }, { status: 400 })
  }
  const gene = geneRaw.toUpperCase()

  // Skip clearly non-gene tokens (rs IDs, digits only, etc).
  if (/^RS\d+$/i.test(gene) || /^\d+$/.test(gene)) {
    return NextResponse.json(emptyPayload(gene))
  }

  // ClinicalTrials.gov v2 API — 50-study page is enough for a reliable
  // status breakdown while keeping payload small. countTotal returns the
  // authoritative overall total across ALL matching studies.
  const params = new URLSearchParams({
    'query.term': gene,
    pageSize: '50',
    countTotal: 'true',
    fields:
      'protocolSection.identificationModule,protocolSection.statusModule,protocolSection.designModule,protocolSection.conditionsModule,protocolSection.contactsLocationsModule',
  })

  const data = await fetchJson(`${CT_BASE}?${params.toString()}`)
  if (!data) return NextResponse.json(emptyPayload(gene, { _error: 'upstream' }))

  const studies = Array.isArray(data?.studies) ? data.studies : []
  const total = typeof data?.totalCount === 'number' ? data.totalCount : studies.length

  if (studies.length === 0) return NextResponse.json(emptyPayload(gene, { total }))

  let recruiting = 0
  let completed = 0
  let terminated = 0
  let other = 0

  const normalized = studies.map((s) => {
    const p = s?.protocolSection || {}
    const nctId = p.identificationModule?.nctId || ''
    const title =
      p.identificationModule?.briefTitle ||
      p.identificationModule?.officialTitle ||
      'Clinical Trial'
    const status = String(p.statusModule?.overallStatus || '').toUpperCase()
    const phase = (p.designModule?.phases || []).join(', ') || null
    const startDate = p.statusModule?.startDateStruct?.date || null
    const year = startDate ? parseInt(String(startDate).slice(0, 4), 10) || null : null

    // Additive: expose site locations so downstream features (e.g.
    // the Weekly Digest) can filter by geography. Keep it lightweight
    // (max 6 sites) to avoid ballooning the payload.
    const rawLocs = Array.isArray(p?.contactsLocationsModule?.locations)
      ? p.contactsLocationsModule.locations
      : []
    const locations = rawLocs.slice(0, 6).map((l) => ({
      city: l?.city || '',
      state: l?.state || '',
      country: l?.country || '',
    }))

    if (RECRUITING_STATUSES.has(status)) recruiting++
    else if (COMPLETED_STATUSES.has(status)) completed++
    else if (TERMINATED_STATUSES.has(status)) terminated++
    else other++

    return {
      nctId,
      title,
      status,
      phase,
      year,
      locations,
      url: nctId
        ? `https://clinicaltrials.gov/study/${nctId}`
        : 'https://clinicaltrials.gov',
    }
  })

  // Priority sort so the top 2 always feature the most useful trials.
  const priority = {
    RECRUITING: 0,
    NOT_YET_RECRUITING: 1,
    ACTIVE_NOT_RECRUITING: 2,
    ENROLLING_BY_INVITATION: 3,
    COMPLETED: 4,
  }
  normalized.sort((a, b) => {
    const pa = priority[a.status] ?? 9
    const pb = priority[b.status] ?? 9
    if (pa !== pb) return pa - pb
    return (b.year || 0) - (a.year || 0)
  })

  const top = normalized.slice(0, 2)

  return NextResponse.json({
    gene,
    total,
    recruiting,
    completed,
    terminated,
    other,
    active: recruiting,
    top,
  })
}
