// /app/lib/search/clinicalTrials.js
// ClinicalTrials.gov v2 adapter. Free public API. Rendered as a distinct
// "Active Trials" strip above the literature results on /search.
// Docs: https://clinicaltrials.gov/data-api/api

import { fetchWithTimeout, safeJson } from './http'

export async function searchClinicalTrials(query, limit = 20) {
  try {
    const url =
      `https://clinicaltrials.gov/api/v2/studies` +
      `?query.term=${encodeURIComponent(query)}` +
      `&pageSize=${Math.min(limit, 50)}` +
      `&fields=protocolSection.identificationModule,protocolSection.statusModule,protocolSection.designModule,protocolSection.sponsorCollaboratorsModule,protocolSection.descriptionModule,protocolSection.conditionsModule,protocolSection.armsInterventionsModule`
    const res = await fetchWithTimeout(url, { cache: 'no-store' }, 12_000)
    if (!res.ok) {
      console.warn('ClinicalTrials.gov returned', res.status)
      return []
    }
    const data = await safeJson(res)
    const rows = data?.studies || []
    return rows.map((s) => {
      const p = s?.protocolSection || {}
      const nctId = p.identificationModule?.nctId || ''
      const title = p.identificationModule?.briefTitle || p.identificationModule?.officialTitle || 'Clinical Trial'
      const status = p.statusModule?.overallStatus || ''
      const phase = (p.designModule?.phases || []).join(', ') || null
      const sponsor = p.sponsorCollaboratorsModule?.leadSponsor?.name || ''
      const summary = p.descriptionModule?.briefSummary || ''
      const conditions = p.conditionsModule?.conditions || []
      const interventions = (p.armsInterventionsModule?.interventions || [])
        .map((i) => i.name).filter(Boolean)
      const startDate = p.statusModule?.startDateStruct?.date || null
      const year = startDate ? parseInt(String(startDate).slice(0, 4), 10) : null
      return {
        id: `nct:${nctId}`,
        provider: 'ClinicalTrials.gov',
        source: 'clinical-trial',
        title,
        journal: sponsor || 'Clinical Trial',
        year,
        authors: [sponsor].filter(Boolean),
        authorsShort: sponsor,
        abstract: summary,
        doi: null,
        url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : 'https://clinicaltrials.gov',
        pmid: null,
        nctId,
        status,
        phase,
        conditions,
        interventions,
        reliability: null,
        reliabilityLabel: null,
        reliabilityNote: null,
        plain: null,
        flags: [],
      }
    })
  } catch (err) {
    console.error('ClinicalTrials.gov error:', err)
    return []
  }
}
