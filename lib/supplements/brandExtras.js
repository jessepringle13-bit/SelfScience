// /app/lib/supplements/brandExtras.js
// Non-invasive overlay for BRAND_PROFILES that adds:
//   • costTier — '$' | '$$' | '$$$' pricing tier
//   • genomeForms — array of variant-relevant supplement forms the brand
//     carries (methylfolate, methylcobalamin, preformed retinol,
//     chelated_minerals, active_bs, hydroxy_b12)
//
// These are keyed off brand slug so they can be maintained independently
// of the main brandProfiles table. Missing brands default to costTier=$$
// and genomeForms=[].

export const BRAND_EXTRAS = {
  // Practitioner / premium tier
  'thorne':               { costTier: '$$$', genomeForms: ['methylfolate', 'methylcobalamin', 'chelated_minerals', 'active_bs'] },
  'pure-encapsulations':  { costTier: '$$$', genomeForms: ['methylfolate', 'methylcobalamin', 'chelated_minerals', 'active_bs'] },
  'metagenics':           { costTier: '$$$', genomeForms: ['methylfolate', 'chelated_minerals'] },
  'seeking-health':       { costTier: '$$$', genomeForms: ['methylfolate', 'methylcobalamin', 'hydroxy_b12', 'active_bs'] },
  'designs-for-health':    { costTier: '$$$', genomeForms: ['methylfolate', 'chelated_minerals'] },
  'ortho-molecular':       { costTier: '$$$', genomeForms: ['methylfolate', 'chelated_minerals'] },
  'douglas-laboratories':  { costTier: '$$$', genomeForms: ['methylfolate', 'chelated_minerals'] },
  'klaire-labs':           { costTier: '$$$', genomeForms: ['chelated_minerals'] },
  'xymogen':               { costTier: '$$$', genomeForms: ['methylfolate', 'chelated_minerals'] },
  'biotics-research':      { costTier: '$$$', genomeForms: ['methylfolate'] },

  // Mid tier
  'nordic-naturals':       { costTier: '$$',  genomeForms: [] },
  'jarrow-formulas':       { costTier: '$$',  genomeForms: ['methylcobalamin', 'methylfolate'] },
  'life-extension':        { costTier: '$$',  genomeForms: ['methylfolate', 'chelated_minerals'] },
  'now-foods':             { costTier: '$$',  genomeForms: ['methylfolate', 'chelated_minerals'] },
  'garden-of-life':        { costTier: '$$',  genomeForms: ['methylfolate', 'preformed_retinol'] },
  'momentous':             { costTier: '$$',  genomeForms: [] },
  'legion':                { costTier: '$$',  genomeForms: [] },
  'onnit':                 { costTier: '$$',  genomeForms: [] },
  'moon-juice':            { costTier: '$$$', genomeForms: [] },
  'ritual':                { costTier: '$$',  genomeForms: ['methylfolate', 'methylcobalamin'] },
  'ancient-nutrition':     { costTier: '$$',  genomeForms: [] },
  'source-naturals':       { costTier: '$$',  genomeForms: ['methylfolate'] },
  'solgar':                { costTier: '$$',  genomeForms: ['methylcobalamin'] },
  'gnc':                   { costTier: '$',   genomeForms: [] },
  'nature-made':           { costTier: '$',   genomeForms: [] },
  'natures-way':           { costTier: '$$',  genomeForms: [] },
  'natures-plus':          { costTier: '$$',  genomeForms: [] },
  'kirkland-signature':    { costTier: '$',   genomeForms: [] },
  'sports-research':       { costTier: '$$',  genomeForms: [] },
  'transparent-labs':      { costTier: '$$',  genomeForms: [] },
  'bulk-supplements':      { costTier: '$',   genomeForms: [] },
  'nutrabio':              { costTier: '$$',  genomeForms: ['methylcobalamin'] },
}

export function getBrandExtras(slug) {
  return BRAND_EXTRAS[slug] || { costTier: '$$', genomeForms: [] }
}

// Given a user's active genomics rules / variant flags, compute a
// "Best for my genome" priority score (0–4) for a brand. Higher = better.
// Currently just a count of matching genome-form tags — good enough to
// reorder the leaderboard and highlight top matches.
export function computeGenomeFit(brand, activeGenomeForms) {
  if (!activeGenomeForms?.length) return 0
  const extras = getBrandExtras(brand?.slug)
  const set = new Set(extras.genomeForms || [])
  return activeGenomeForms.reduce((score, tag) => score + (set.has(tag) ? 1 : 0), 0)
}

// Derive the list of relevant genome-form tags from a user's variant
// context. Kept small and evidence-based.
export function activeGenomeFormsFromContext({ variantsByGene = {} } = {}) {
  const tags = []
  const has = (gene) => {
    const g = variantsByGene[gene]
    if (!g) return false
    // Accept either a raw genotype string or an object with .genotype.
    const gt = typeof g === 'string' ? g : (g.genotype || g.genotype_called || '')
    return String(gt || '').toUpperCase()
  }
  const mthfr = has('MTHFR')
  if (mthfr && /T/.test(mthfr)) {
    tags.push('methylfolate', 'methylcobalamin', 'active_bs')
  }
  const bcmo1 = has('BCMO1')
  if (bcmo1 && (bcmo1 === 'TT' || bcmo1 === 'AA')) {
    tags.push('preformed_retinol')
  }
  const comt = has('COT') || has('COMT')
  if (comt && /GG/i.test(comt)) tags.push('hydroxy_b12')
  // Chelated minerals broadly benefit anyone with methylation or transport
  // variants (COMT, MTHFR, SLCO1B1 etc.) — add if any of these are non-normal.
  if (has('MTHFR') || has('COMT') || has('SLCO1B1')) tags.push('chelated_minerals')
  return Array.from(new Set(tags))
}

// Tailwind chip classes for cost tier badges.
export const COST_TIER_STYLE = {
  '$':   { chip: 'bg-emerald-50 text-emerald-700 border-emerald-300', label: 'Budget' },
  '$$':  { chip: 'bg-sky-50 text-sky-700 border-sky-300',             label: 'Mid' },
  '$$$': { chip: 'bg-slate-100 text-slate-700 border-slate-300',       label: 'Premium' },
}
