// /app/lib/biomarkerCorrelations.js
// SelfScience — Rules that combine the user's biomarker entries with
// their genome findings (loaded from sessionStorage) to produce a
// research-language "Genetic Context" panel on /biomarkers.
//
// Each rule is a pure predicate + a text block. Nothing here uses AI,
// makes network calls, or writes state. All matching happens against the
// evaluated biomarker map ({[id]: {value, status}}) plus the flattened
// genome cards array from the report.
//
// Compliance:
//   • Research-language only ("associated with", "research suggests").
//   • No prescriptive medical claims.
//   • Cards are framed as discussion prompts or research context.

import { flattenReportCards } from './supplementProtocol'

function findCard(cards, rsid) {
  return cards.find((c) => c.rsid === rsid)
}
function hasGenotype(cards, rsid, ...gts) {
  const c = findCard(cards, rsid); if (!c?.genotype) return false
  const gt = String(c.genotype).toUpperCase().replace(/[^A-Z]/g, '')
  const s = gt.length === 2 ? [...gt].sort().join('') : gt
  return gts.some((g) => {
    const x = String(g).toUpperCase().replace(/[^A-Z]/g, '')
    return s === (x.length === 2 ? [...x].sort().join('') : x)
  })
}
function hasHaplotype(cards, rsidHints, ...statusNames) {
  const hints = Array.isArray(rsidHints) ? rsidHints : [rsidHints]
  return cards.some((c) => c.is_haplotype && (hints.includes(c.rsid) ||
    hints.some((h) => (c.gene || '').includes(h))) && statusNames.includes(c.haplotype_name))
}

// A rule returns null if no match, else { id, title, body, tone }.
export const CORRELATION_RULES = [
  // 1. HbA1c elevated + MTNR1B GG
  ({ status, cards }) => {
    if (status.hba1c?.status !== 'caution' && status.hba1c?.status !== 'flag') return null
    if (!hasGenotype(cards, 'rs10830963', 'GG', 'CC')) return null
    return {
      id: 'hba1c-mtnr1b',
      title: 'HbA1c × MTNR1B late-eating variant',
      tone: 'awareness',
      body: 'Your elevated HbA1c together with the MTNR1B risk allele is a well-studied pattern. Research consistently shows that eating close to natural melatonin onset in this genotype impairs the glucose response. A meal cutoff by roughly 6:30 PM is the primary research-supported intervention before adding supplements.',
    }
  },

  // 2. Testosterone low (regardless of genotype) — nutrition-first framing
  ({ status }) => {
    const t = status.testosterone_total?.value
    if (t == null || t >= 500) return null
    return {
      id: 'testosterone-low-general',
      title: 'Testosterone below 500 ng/dL',
      tone: 'awareness',
      body: 'Low testosterone is influenced more by sleep, resistance training, and caloric intake than by any known genetic variant in the general population. Before attributing this to genetics, review sleep quality, training volume, and total daily calories with a qualified clinician.',
    }
  },

  // 3. HDL low + CETP GG
  ({ status, cards }) => {
    if (status.hdl?.status !== 'caution' && status.hdl?.status !== 'flag') return null
    if (!hasGenotype(cards, 'rs708272', 'GG', 'AG', 'CC', 'CT')) return null
    return {
      id: 'hdl-cetp',
      title: 'HDL × CETP variant',
      tone: 'awareness',
      body: 'CETP GG is associated in research with a tendency toward higher HDL, so an HDL below optimal despite this genotype suggests lifestyle drivers (activity, monounsaturated fat intake, alcohol pattern) are worth reviewing before treating this as a purely genetic finding.',
    }
  },

  // 4. Vitamin D above upper reference range
  ({ status }) => {
    const v = status.vitamin_d?.value
    if (v == null || v <= 80) return null
    return {
      id: 'vitd-upper',
      title: 'Vitamin D above 80 ng/mL',
      tone: 'awareness',
      body: 'Research on very high vitamin D levels remains mixed; sustained values above 80 ng/mL are typically the point at which clinicians reassess dosing. Discuss recent supplement doses and lab timing with your provider.',
    }
  },

  // 5. Homocysteine elevated + MTHFR compound-het or homozygous
  ({ status, cards }) => {
    const s = status.homocysteine?.status
    if (s !== 'caution' && s !== 'flag') return null
    if (!hasHaplotype(cards, ['rs1801133', 'rs1801131'],
        'compound_heterozygous', '677_homozygous', '1298_homozygous', 'double_homozygous', '677_heterozygous', '1298_heterozygous')) return null
    return {
      id: 'homocysteine-mthfr',
      title: 'Homocysteine × MTHFR',
      tone: 'priority',
      body: 'Elevated homocysteine combined with an MTHFR variant is one of the most-studied gene–biomarker pairs. Research supports active methylfolate (5-MTHF) alongside methyl B12 and B6 as the pathway-appropriate combination — review with a qualified provider before starting.',
    }
  },

  // 6. Hemoglobin low + FUT2 non-secretor (linked to B12 absorption)
  ({ status, cards }) => {
    const s = status.hemoglobin?.status
    if (s !== 'caution' && s !== 'flag') return null
    if (!hasGenotype(cards, 'rs601338', 'AA', 'TT') && !hasGenotype(cards, 'rs602662', 'AA', 'TT')) return null
    return {
      id: 'hemoglobin-fut2',
      title: 'Hemoglobin × FUT2 non-secretor',
      tone: 'awareness',
      body: 'FUT2 non-secretor status is associated with lower B12 absorption in research populations. When hemoglobin is below optimal alongside this variant, evaluating B12 status is a well-supported next step alongside standard iron work-up.',
    }
  },

  // 7. NEW: Low testosterone + caloric restriction (verbatim per user)
  ({ status }) => {
    const t = status.testosterone_total?.value
    if (t == null || t >= 500) return null
    return {
      id: 'testosterone-caloric',
      title: 'Low testosterone — caloric intake first',
      tone: 'priority',
      body: 'Caloric intake is the primary modifiable driver of testosterone in active males. Research consistently shows that eating below ~2,000 kcal/day suppresses testosterone regardless of training status. Total caloric intake should be evaluated before attributing low testosterone to genetics.',
    }
  },

  // 8. NEW: hs-CRP elevated + IL23R GG or NOD2 CT (verbatim per user)
  ({ status, cards }) => {
    const s = status.hs_crp?.status
    if (s !== 'caution' && s !== 'flag') return null
    const il23r = hasGenotype(cards, 'rs11209026', 'GG', 'CC')
    const nod2  = hasGenotype(cards, 'rs2066847', 'CT', 'AG') || hasGenotype(cards, 'rs2066844', 'CT', 'AG') || hasGenotype(cards, 'rs2066845', 'CG', 'GC')
    if (!il23r && !nod2) return null
    return {
      id: 'hscrp-il23r-nod2',
      title: 'Elevated hs-CRP × gut inflammatory variant',
      tone: 'priority',
      body: 'IL23R and/or NOD2 variants are associated with elevated gut inflammatory signaling in research. Elevated hs-CRP combined with these variants suggests gut inflammation management — prebiotic fiber, Bifidobacterium strains, and anti-inflammatory dietary patterns — as a research-supported priority.',
    }
  },
]

/**
 * Evaluate every rule against the current biomarker status map + genome
 * report. Returns an array of matched correlation cards (may be empty).
 */
export function deriveCorrelations({ status, report }) {
  const cards = report ? flattenReportCards(report) : []
  const results = []
  const seen = new Set()
  for (const rule of CORRELATION_RULES) {
    try {
      const r = rule({ status, cards, report })
      if (r && !seen.has(r.id)) { results.push(r); seen.add(r.id) }
    } catch (err) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.warn('[biomarkerCorrelations] rule threw:', err)
      }
    }
  }
  return results
}
