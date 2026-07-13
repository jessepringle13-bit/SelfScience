// /app/lib/supplements/brandTiers.js
// Curated brand price tier map. Educational only. Based on typical DTC/MSRP
// per-serving cost for the brand's flagship SKUs. NOT scraped in real-time
// (DSLD does not surface pricing; a live scraper is out of scope for this
// MVP). $ = value, $$ = mid-market, $$$ = premium.

export const BRAND_TIER = {
  // $ Value
  'bulk supplements': '$',
  'bulksupplements': '$',
  'now foods': '$',
  'now': '$',
  'nature made': '$',
  'nutricost': '$',
  'jarrow formulas': '$',
  'jarrow': '$',
  'solgar': '$',
  'doctor\'s best': '$',
  'doctors best': '$',
  'sports research': '$',
  'renew life': '$',
  'culturelle': '$',
  'thrive market': '$',
  'optimum nutrition': '$',

  // $$ Mid-market
  'thorne': '$$',
  'life extension': '$$',
  'metabolic maintenance': '$$',
  'methylpro': '$$',
  'nordic naturals': '$$',
  'carlson': '$$',
  'garden of life': '$$',
  'megafood': '$$',
  'new chapter': '$$',
  'transparent labs': '$$',
  'legion athletics': '$$',
  'legion': '$$',
  'seeking health': '$$',
  'ancient nutrition': '$$',
  'orgain': '$$',
  'vega': '$$',
  'vital proteins': '$$',
  'hum nutrition': '$$',
  'care of': '$$',
  'onnit': '$$',
  'four sigmatic': '$$',
  'om mushroom': '$$',
  'huel': '$$',
  'lmnt': '$$',
  'ritual': '$$',
  'paleovalley': '$$',
  'ancestral supplements': '$$',
  'just ingredients': '$$',

  // $$$ Premium
  'pure encapsulations': '$$$',
  'designs for health': '$$$',
  'metagenics': '$$$',
  'klaire labs': '$$$',
  'klaire': '$$$',
  'kirkman': '$$$',
  'quicksilver scientific': '$$$',
  'momentous': '$$$',
  'ag1': '$$$',
  'athletic greens': '$$$',
  'cymbiotika': '$$$',
  'bulletproof': '$$$',
  'seed': '$$$',
  'armra': '$$$',
  'needed': '$$$',
  'perelel': '$$$',
  'gaia herbs': '$$$',
  'herb pharm': '$$$',
  'host defense': '$$$',
  'bioptimizers': '$$$',
  'persona nutrition': '$$$',
}

export const TIER_META = {
  '$':   { label: '$ Value',   description: 'Budget-friendly; usually under ~$0.20 per serving.', style: 'bg-slate-100 text-slate-700 border-slate-300' },
  '$$':  { label: '$$ Mid',    description: 'Mid-market; ~$0.20-$0.60 per serving.',            style: 'bg-sky-100 text-sky-800 border-sky-300' },
  '$$$': { label: '$$$ Premium', description: 'Premium; typically over ~$0.60 per serving.',      style: 'bg-amber-100 text-amber-900 border-amber-300' },
}

const norm = (s) => String(s || '').toLowerCase().trim()

export function getBrandTier(brandName) {
  return BRAND_TIER[norm(brandName)] || null
}

export function getBrandTierMeta(brandName) {
  const t = getBrandTier(brandName)
  return t ? { tier: t, ...TIER_META[t] } : null
}

// Rank tier for cost comparison (lower = cheaper)
const TIER_RANK = { '$': 1, '$$': 2, '$$$': 3 }
export function tierRank(tier) {
  return TIER_RANK[tier] || 99
}
