// /app/lib/goalGenomeContext.js
// Genome-aware one-liner context strings surfaced during goal creation
// and on the goal detail card. Reads user's variants and returns the
// single most relevant sentence for the selected goal category.

import { getGenomeResults } from '@/lib/genomeSession'

// (rsid, category) → { line, gene, chip }
// Only wire a handful of high-signal combos; the UI falls back to
// null (no context box) when no match.
const RULES = [
  // Performance
  { rsid: 'rs8192678', categories: ['performance', 'longevity'], gene: 'PPARGC1A',
    line: 'Your PPARGC1A variant means Zone 2 training requires 4–5 sessions per week to achieve equivalent mitochondrial adaptation.' },
  { rsid: 'rs1815739', categories: ['performance'], gene: 'ACTN3',
    line: 'Your ACTN3 genotype shapes your fast-twitch fibre response — the training stimulus that produces the biggest gains for you differs from the population average.' },
  { rsid: 'rs12722',   categories: ['performance', 'supplements'], gene: 'COL5A1',
    line: 'Your COL5A1 T-allele elevates tendon injury risk — pre-exercise collagen and vitamin C has the strongest evidence base for your genotype.' },

  // Nutrition
  { rsid: 'rs10830963', categories: ['nutrition'], gene: 'MTNR1B',
    line: 'Your MTNR1B variant means meal timing has a measurable impact on your insulin secretion — earlier eating cutoffs have the strongest research support.' },
  { rsid: 'rs4253778',  categories: ['nutrition', 'longevity'], gene: 'PPARA',
    line: 'Your PPARA variant enhances fat oxidation during fasting — extended fasts are both safer and more metabolically productive for you.' },
  { rsid: 'rs12934922', categories: ['nutrition'], gene: 'BCMO1',
    line: 'Your BCMO1 variant reduces beta-carotene to retinol conversion by 57–69% — preformed vitamin A from animal sources bypasses this completely.' },

  // Supplements
  { rsid: 'rs1801133', categories: ['supplements', 'biomarkers'], gene: 'MTHFR',
    line: 'Your MTHFR variant means methylated B vitamins (methylfolate, methylcobalamin) are essential — not optional — for keeping homocysteine in a healthy range.' },
  { rsid: 'rs1801131', categories: ['supplements', 'biomarkers'], gene: 'MTHFR',
    line: 'Your MTHFR A1298C variant reduces folate conversion efficiency — methylated forms are your reliable path to normal homocysteine.' },
  { rsid: 'rs174547',  categories: ['supplements'], gene: 'FADS1',
    line: 'Your FADS1 variant impairs conversion of plant omega-3s to EPA/DHA — direct fish oil is the only reliable source for you.' },

  // Longevity
  { rsid: 'rs2802292',  categories: ['longevity'], gene: 'FOXO3',
    line: 'Your FOXO3 variant is one of the most replicated longevity findings — the pathway it sits on responds strongly to fasting and Zone 2 training.' },
  { rsid: 'rs9420907',  categories: ['longevity', 'biomarkers'], gene: 'OBFC1',
    line: 'Your OBFC1 variant is linked to telomere maintenance — sleep consistency and Zone 2 training show the strongest supportive evidence.' },

  // Clinical
  { rsid: 'rs4149056', categories: ['clinical'], gene: 'SLCO1B1',
    line: 'Your SLCO1B1 variant meaningfully changes how statins are cleared — worth flagging to any prescriber before starting a statin.' },
]

function userVariantIndex() {
  const report = getGenomeResults()
  if (!report) return { byRsid: new Map(), byGene: new Set() }
  const byRsid = new Map()
  const byGene = new Set()
  const push = (c) => {
    const r = String(c?.rsid || '').toLowerCase()
    const g = (c?.gene || '').split(/[\s(/·+,]/)[0]?.toUpperCase()
    if (r) byRsid.set(r, c)
    if (g && !/^RS\d/i.test(g) && g.length <= 12) byGene.add(g)
  }
  for (const c of report?.variants_recognized || []) push(c)
  for (const grp of report?.fullReport || []) for (const v of grp?.variants || []) push(v)
  for (const c of report?.overview?.areasToExplore || []) push(c)
  for (const c of report?.overview?.strengths || []) push(c)
  return { byRsid, byGene }
}

export function getGenomeContext(categoryId) {
  const { byRsid } = userVariantIndex()
  if (!byRsid.size) return null
  for (const rule of RULES) {
    if (!rule.categories.includes(categoryId)) continue
    const variant = byRsid.get(rule.rsid.toLowerCase())
    if (variant) {
      return {
        variantSource: rule.rsid,
        gene: rule.gene,
        line: rule.line,
        confidence: 'High',
      }
    }
  }
  return null
}

export function findAllContextsForUser() {
  const { byRsid } = userVariantIndex()
  const out = []
  for (const rule of RULES) {
    if (byRsid.has(rule.rsid.toLowerCase())) {
      out.push({ variantSource: rule.rsid, gene: rule.gene, line: rule.line, categories: rule.categories })
    }
  }
  return out
}
