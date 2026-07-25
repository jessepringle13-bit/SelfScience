// /app/lib/variantQueries.js
// Curated map of rsID → PLAIN-LANGUAGE PubMed search query. PubMed does
// not match raw rsIDs, so we translate each variant into a search string
// built from the gene symbol + the biological function/context researchers
// use in paper titles/abstracts.
//
// Fallback: if no explicit mapping exists but we know the gene symbol,
// the caller can construct a query directly from the gene.

const VARIANT_QUERIES = {
  // Folate / methylation
  rs1801133: 'MTHFR C677T methylation folate',
  rs1801131: 'MTHFR A1298C methylation homocysteine',
  rs1805087: 'MTR B12 homocysteine methionine',
  rs1801394: 'MTRR B12 methylation',
  rs1532268: 'SHMT1 folate one-carbon metabolism',

  // Sports / performance
  rs1815739: 'ACTN3 muscle fiber type endurance power',
  rs8192678: 'PPARGC1A mitochondrial biogenesis exercise',
  rs4253778: 'PPARA fat oxidation endurance',
  rs12722:   'COL5A1 tendon injury collagen',
  rs1799750: 'MMP1 collagen degradation tissue repair',

  // Cardio / longevity
  rs429358:  'APOE cardiovascular Alzheimer cholesterol',
  rs7412:    'APOE cholesterol lipoprotein',
  rs9420907: 'OBFC1 telomere length aging',
  rs12778366: 'SIRT1 sirtuin NAD longevity',

  // Nutrition / metabolism
  rs9939609: 'FTO obesity BMI appetite',
  rs7903146: 'TCF7L2 type 2 diabetes insulin',
  rs762551:  'CYP1A2 caffeine metabolism',
  rs4988235: 'LCT lactase persistence dairy',
  rs671:     'ALDH2 alcohol flush metabolism',
  rs174537:  'FADS1 omega-3 fatty acid conversion',
  rs10830963: 'MTNR1B melatonin insulin glucose',

  // Pharmacogenomics
  rs1065852:  'CYP2D6 drug metabolism antidepressant',
  rs4244285:  'CYP2C19 clopidogrel PPI metabolism',
  rs1799853:  'CYP2C9 warfarin NSAID metabolism',
  rs1057910:  'CYP2C9 warfarin metabolism',
  rs9923231:  'VKORC1 warfarin dosing',
  rs4149056:  'SLCO1B1 statin myopathy',
  rs1799971:  'OPRM1 opioid response pain',
  rs4680:     'COMT dopamine cognition stress',

  // Environmental sensitivity / detox
  rs1042713:  'ADRB2 asthma beta agonist response',
  rs1544410:  'VDR vitamin D receptor',
  rs2228570:  'VDR vitamin D receptor bone',
  rs662:      'PON1 organophosphate pesticide detox',

  // Sleep / stress
  rs1360780:  'FKBP5 cortisol stress HPA axis',
}

// Pillar-level broad queries for the "Trending in your pillars" section.
// Each is written as a plain-language PubMed query — not a gene-symbol
// bracket lookup — so we get recent human-facing research rather than
// niche gene reviews.
const PILLAR_QUERIES = {
  'Nutrition':                       'nutrigenomics diet genetics',
  'Pharmacogenomics':                'pharmacogenomics drug metabolism CYP',
  'Longevity':                       'longevity aging genetics telomere',
  'Sports Performance':              'exercise genetics athletic performance',
  'Mental Health & Neurochemistry':  'neurotransmitter genetics mood dopamine serotonin',
  'General Wellness':                'sleep circadian genetics wellness',
  'Environmental Sensitivity':       'gene-environment interaction detox',
  'Hormones & Endocrine Health':     'hormone genetics endocrine',
  'Developmental & Lifespan Wellness': 'lifespan wellness genetics epigenetics',
  'Genomics':                        'human genome research clinical',
}

/**
 * Return a PubMed-friendly plain-language query for a given rsID.
 * Falls back to a gene-symbol query when we have no curated string but
 * do have a gene symbol; returns null if there's nothing to search on.
 */
export function queryForVariant(rsid, gene) {
  const id = String(rsid || '').toLowerCase()
  if (VARIANT_QUERIES[id]) return VARIANT_QUERIES[id]
  if (gene) {
    // Build a lightweight plain-language query from the gene symbol.
    // PubMed's Title/Abstract search returns coherent results for
    // well-known gene names.
    return `${gene} genetics human`
  }
  return null
}

/**
 * Return a plain-language pillar query for the given pillar name.
 */
export function queryForPillar(pillarName) {
  return PILLAR_QUERIES[pillarName] || `${pillarName} genetics`
}

/**
 * Turn an array of rsIDs (with optional gene hints) into a single
 * OR-joined PubMed query. Useful for the "New this month" fan-out.
 */
export function combinedVariantQuery(variants = []) {
  const parts = []
  for (const v of variants) {
    const q = queryForVariant(v?.rsid, v?.gene)
    if (q) parts.push(`(${q})`)
  }
  return parts.length ? parts.join(' OR ') : null
}

export { VARIANT_QUERIES, PILLAR_QUERIES }
