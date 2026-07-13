// /app/lib/supplements/prices.js
// Per-brand, per-ingredient-family per-serving prices.
// Two sources merged at import:
//   1) The in-code PRICE_CACHE below (fast, ships with the bundle)
//   2) /app/lib/supplements/prices.json (writable by the operator scraper)
// JSON entries override in-code entries so a monthly scrape update lands
// without a code deploy.

import PRICES_JSON from './prices.json'
//
// Prices are USD, per serving, and reflect the brand-direct price at time
// of curation. They are educational estimates — always check the brand
// store link on each card for the current price.
//
// Key = `${brandName.toLowerCase()}::${ingredientFamily.toLowerCase()}`
// Value = { perServing: number, currency: 'USD', updated: 'YYYY-MM' }

export const PRICE_CACHE = {
  // ------------- L-5-Methylfolate -------------
  'methylpro::folate (vitamin b9)':              { perServing: 0.28, currency: 'USD', updated: '2026-07' },
  'thorne::folate (vitamin b9)':                 { perServing: 0.42, currency: 'USD', updated: '2026-07' },
  'seeking health::folate (vitamin b9)':         { perServing: 0.35, currency: 'USD', updated: '2026-07' },
  'pure encapsulations::folate (vitamin b9)':    { perServing: 0.60, currency: 'USD', updated: '2026-07' },
  'metabolic maintenance::folate (vitamin b9)':  { perServing: 0.32, currency: 'USD', updated: '2026-07' },
  'now foods::folate (vitamin b9)':              { perServing: 0.10, currency: 'USD', updated: '2026-07' },
  'jarrow formulas::folate (vitamin b9)':        { perServing: 0.15, currency: 'USD', updated: '2026-07' },

  // ------------- Vitamin B12 (Methylcobalamin) -------------
  'thorne::vitamin b12 (cobalamin)':             { perServing: 0.30, currency: 'USD', updated: '2026-07' },
  'seeking health::vitamin b12 (cobalamin)':     { perServing: 0.24, currency: 'USD', updated: '2026-07' },
  'pure encapsulations::vitamin b12 (cobalamin)':{ perServing: 0.45, currency: 'USD', updated: '2026-07' },
  'jarrow formulas::vitamin b12 (cobalamin)':    { perServing: 0.12, currency: 'USD', updated: '2026-07' },
  'now foods::vitamin b12 (cobalamin)':          { perServing: 0.08, currency: 'USD', updated: '2026-07' },

  // ------------- Vitamin D -------------
  'thorne::vitamin d':                            { perServing: 0.25, currency: 'USD', updated: '2026-07' },
  'nordic naturals::vitamin d':                   { perServing: 0.30, currency: 'USD', updated: '2026-07' },
  'life extension::vitamin d':                    { perServing: 0.18, currency: 'USD', updated: '2026-07' },
  'now foods::vitamin d':                         { perServing: 0.05, currency: 'USD', updated: '2026-07' },
  'pure encapsulations::vitamin d':               { perServing: 0.40, currency: 'USD', updated: '2026-07' },

  // ------------- Omega-3 -------------
  'nordic naturals::omega-3 (epa/dha)':           { perServing: 0.80, currency: 'USD', updated: '2026-07' },
  'carlson::omega-3 (epa/dha)':                   { perServing: 0.55, currency: 'USD', updated: '2026-07' },
  'thorne::omega-3 (epa/dha)':                    { perServing: 0.95, currency: 'USD', updated: '2026-07' },
  'life extension::omega-3 (epa/dha)':            { perServing: 0.60, currency: 'USD', updated: '2026-07' },
  'now foods::omega-3 (epa/dha)':                 { perServing: 0.20, currency: 'USD', updated: '2026-07' },
  'sports research::omega-3 (epa/dha)':           { perServing: 0.35, currency: 'USD', updated: '2026-07' },

  // ------------- Magnesium -------------
  'thorne::magnesium':                            { perServing: 0.35, currency: 'USD', updated: '2026-07' },
  'pure encapsulations::magnesium':               { perServing: 0.50, currency: 'USD', updated: '2026-07' },
  'now foods::magnesium':                         { perServing: 0.06, currency: 'USD', updated: '2026-07' },
  'bulk supplements::magnesium':                  { perServing: 0.04, currency: 'USD', updated: '2026-07' },
  'momentous::magnesium':                         { perServing: 0.80, currency: 'USD', updated: '2026-07' },

  // ------------- Ashwagandha -------------
  'now foods::ashwagandha':                       { perServing: 0.15, currency: 'USD', updated: '2026-07' },
  'life extension::ashwagandha':                  { perServing: 0.30, currency: 'USD', updated: '2026-07' },
  'seeking health::ashwagandha':                  { perServing: 0.45, currency: 'USD', updated: '2026-07' },
  'momentous::ashwagandha':                       { perServing: 0.85, currency: 'USD', updated: '2026-07' },

  // ------------- CoQ10 -------------
  'thorne::coq10':                                { perServing: 0.75, currency: 'USD', updated: '2026-07' },
  'life extension::coq10':                        { perServing: 0.55, currency: 'USD', updated: '2026-07' },
  'now foods::coq10':                             { perServing: 0.25, currency: 'USD', updated: '2026-07' },

  // ------------- Creatine -------------
  'momentous::creatine':                          { perServing: 1.10, currency: 'USD', updated: '2026-07' },
  'thorne::creatine':                             { perServing: 0.55, currency: 'USD', updated: '2026-07' },
  'transparent labs::creatine':                   { perServing: 0.65, currency: 'USD', updated: '2026-07' },
  'legion athletics::creatine':                   { perServing: 0.50, currency: 'USD', updated: '2026-07' },
  'bulk supplements::creatine':                   { perServing: 0.08, currency: 'USD', updated: '2026-07' },
  'now foods::creatine':                          { perServing: 0.12, currency: 'USD', updated: '2026-07' },
}

// Lookup: give it a brand name + the ingredient display label (e.g.
// "Folate (Vitamin B9)"). Returns { perServing, currency, updated } or null.
export function getPricePerServing(brandName, ingredientFamily) {
  if (!brandName || !ingredientFamily) return null
  const key = `${String(brandName).toLowerCase()}::${String(ingredientFamily).toLowerCase()}`
  // JSON cache wins over in-code (so scraped updates land without a code deploy)
  return (PRICES_JSON?.prices?.[key]) || PRICE_CACHE[key] || null
}

// Given a full product object, pick the first preferred-tier ingredient family
// and return the cached price if we have one.
export function getPriceForProduct(product) {
  if (!product?.brand?.name || !product?.formQuality?.length) return null
  const pref = product.formQuality.find((f) => f.tier === 'preferred') || product.formQuality[0]
  if (!pref?.ingredient) return null
  return getPricePerServing(product.brand.name, pref.ingredient)
}

export function formatPrice(price) {
  if (!price) return null
  const val = price.perServing
  if (typeof val !== 'number') return null
  return `$${val.toFixed(2)}/serving`
}
