// /app/lib/supplements/grouping.js
// Turns a flat list of DSLD products into a brand-grouped, family-clustered,
// curated view. The redesign goal: show BRAND DIVERSITY above the fold rather
// than five near-identical dose variants from one brand hogging the grid.
//
// Two view modes are supported:
//   'curated'  -> one card per brand+product-family, with variants nested.
//   'all'      -> the flat product list (unchanged).

import { getCuratedTrustBadges, isBrandCurated } from './brandDirectory'

/** Strip dose + container-count noise from a full product name so we can
 *  cluster "L-Methylfolate 1 mg", "L-Methylfolate 5 mg", "L-Methylfolate 15 mg"
 *  under one product family called "L-Methylfolate".
 */
function normaliseFamilyName(fullName) {
  if (!fullName) return 'Untitled'
  let s = String(fullName)

  // Kill trailing container-count phrases (e.g. "60 Capsules", "120 Vegan Capsule(s)")
  s = s.replace(/[,\s\u2014-]+\d+\s*(?:vegan|vegetable|veggie)?\s*(?:capsule|tablet|softgel|gummy|serving|scoop|packet|lozenge)s?\s*(?:\(s\))?\s*/gi, ' ')

  // Kill trailing dose phrases (e.g. "1 mg", "1000 IU", "5.4 g", "500 mcg", "30 ml")
  s = s.replace(/[,\s\u2014-]+\d+(?:\.\d+)?\s*(?:mg|mcg|g|iu|kcal|ml|oz|billion(?: cfu)?)\b\s*/gi, ' ')

  // Kill trailing size codes like "- 60 ct" / "60ct" / "60-ct"
  s = s.replace(/[,\s\u2014-]+\d+\s*ct\.?\b/gi, ' ')

  // Kill "- Extra Strength" style modifiers only when clearly a size/strength suffix
  s = s.replace(/\s*[-\u2014]\s*(?:extra strength|high potency|maximum strength|standard strength)\b.*$/gi, '')

  // Collapse whitespace + trim commas/dashes at the end
  s = s.replace(/\s+/g, ' ').replace(/[\s,\-\u2014]+$/g, '').trim()
  return s || fullName
}

/** Extract a dose "label" for the variant chip (e.g. "1 mg", "60 Capsules"). */
function extractVariantLabel(product) {
  const parts = []
  const doseMatch = String(product.fullName || '').match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|iu|ml)\b/i)
  if (doseMatch) parts.push(doseMatch[0])
  if (product.netContents) parts.push(product.netContents)
  if (parts.length === 0 && product.fullName) parts.push(product.fullName)
  return parts.join(' \u00b7 ')
}

/** Tier priority for picking the "default" variant inside a family. */
const TIER_RANK = { preferred: 3, acceptable: 2, basic: 1, unknown: 0 }
function bestFormTier(product) {
  let best = 0
  for (const f of product.formQuality || []) {
    const r = TIER_RANK[f.tier] ?? 0
    if (r > best) best = r
  }
  return best
}

/** Given all variants in a family, pick the "recommended default" variant.
 *  Priority:
 *    1. Best form-quality tier (preferred > acceptable > basic > unknown)
 *    2. Curated brand URL over manufacturer fallback over search fallback
 *    3. Not off-market
 *    4. Middle-of-the-pack dose (avoid smallest/largest extreme)
 *    5. Alphabetic full-name stability
 */
function pickDefaultVariant(variants) {
  if (variants.length === 1) return variants[0]

  const parseDose = (v) => {
    const m = String(v.fullName || '').match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu|ml)\b/i)
    if (!m) return { val: null, unit: null }
    return { val: parseFloat(m[1]), unit: (m[2] || '').toLowerCase() }
  }
  // Compute median dose (per dominant unit) to define "middle"
  const doseInfos = variants.map(parseDose)
  const units = doseInfos.map((d) => d.unit).filter(Boolean)
  const dominantUnit = units.length
    ? [...new Set(units)].sort((a, b) => units.filter((u) => u === b).length - units.filter((u) => u === a).length)[0]
    : null
  const dosesInUnit = doseInfos.filter((d) => d.unit === dominantUnit && d.val != null).map((d) => d.val).sort((a, b) => a - b)
  const median = dosesInUnit.length ? dosesInUnit[Math.floor(dosesInUnit.length / 2)] : null

  const urlSourceRank = { curated: 3, dsld_manufacturer: 2, search_fallback: 1 }

  const scored = variants.map((v) => {
    const d = parseDose(v)
    const doseDist = (d.unit === dominantUnit && d.val != null && median != null)
      ? Math.abs(d.val - median)
      : 999
    return {
      v,
      score: [
        bestFormTier(v),                                       // higher is better
        v.offMarket ? 0 : 1,                                    // on-market first
        urlSourceRank[v.brand?.url?.source] ?? 0,               // curated first
        -doseDist,                                              // closer to median (negate for max)
        -(v.fullName || '').length,                             // shorter names first (stable)
      ],
    }
  })

  scored.sort((a, b) => {
    for (let i = 0; i < a.score.length; i++) {
      if (a.score[i] !== b.score[i]) return b.score[i] - a.score[i]
    }
    return 0
  })
  return scored[0].v
}

/** Cluster products into brand → product-family groups. */
export function groupProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return []
  const groups = new Map()

  for (const p of products) {
    const brand = p.brand?.name || 'Unknown brand'
    const family = normaliseFamilyName(p.fullName)
    const key = `${brand.toLowerCase()}::${family.toLowerCase()}`
    if (!groups.has(key)) {
      groups.set(key, { brand, family, variants: [] })
    }
    groups.get(key).variants.push(p)
  }

  // Materialise + rank
  const list = Array.from(groups.values()).map((g) => {
    const defaultVariant = pickDefaultVariant(g.variants)
    const groupTier = bestFormTier(defaultVariant)
    const curated = isBrandCurated(g.brand)
    const trustBadges = getCuratedTrustBadges(g.brand)
    // Best certification tier across all variants (gold=3, silver=2, bronze=1)
    const certTierOrder = { gold: 3, silver: 2, bronze: 1, baseline: 0 }
    let bestCertTier = 0
    let certCount = 0
    for (const v of g.variants) {
      const certs = v.certifications || []
      certCount = Math.max(certCount, certs.length)
      for (const c of certs) {
        const r = certTierOrder[c.tier] ?? 0
        if (r > bestCertTier) bestCertTier = r
      }
    }
    const transparencyScore = defaultVariant?.brand?.transparencyScore ?? 0
    return {
      brand: g.brand,
      family: g.family,
      curated,
      trustBadges,
      groupTier,
      bestCertTier,
      certCount,
      transparencyScore,
      variantCount: g.variants.length,
      defaultVariant,
      variants: g.variants.map((v) => ({
        id: v.id,
        fullName: v.fullName,
        label: extractVariantLabel(v),
        netContents: v.netContents,
        offMarket: v.offMarket,
        formQuality: v.formQuality,
        product: v,
      })),
    }
  })

  // Sort for brand diversity above the fold:
  //   1) Products with preferred-tier ingredient forms first
  //   2) Better third-party certification tier next
  //   3) Higher transparency score next
  //   4) Curated brands
  //   5) Not off-market
  //   6) Alphabetic brand for stability
  list.sort((a, b) => {
    if (b.groupTier !== a.groupTier) return b.groupTier - a.groupTier
    if (b.bestCertTier !== a.bestCertTier) return b.bestCertTier - a.bestCertTier
    if (b.transparencyScore !== a.transparencyScore) return b.transparencyScore - a.transparencyScore
    if (b.curated !== a.curated) return (b.curated ? 1 : 0) - (a.curated ? 1 : 0)
    const aOff = a.defaultVariant.offMarket ? 1 : 0
    const bOff = b.defaultVariant.offMarket ? 1 : 0
    if (aOff !== bOff) return aOff - bOff
    return a.brand.localeCompare(b.brand)
  })

  // Brand-diversity guard: interleave so we never show two consecutive groups
  // from the same brand. In practice each group is already a unique brand+family,
  // but we further push same-brand repeats down the list.
  const seenBrand = new Map()
  const primary = []
  const secondary = []
  for (const g of list) {
    const count = seenBrand.get(g.brand.toLowerCase()) || 0
    if (count === 0) primary.push(g)
    else secondary.push(g)
    seenBrand.set(g.brand.toLowerCase(), count + 1)
  }
  return [...primary, ...secondary]
}

// -------- "Why this may fit you" copy builder ---------------------------
// Deterministic, non-prescriptive, references the category the user chose and
// the ingredient form the default variant provides.
export function buildWhyThisFits({ category, group }) {
  const notes = category?.notes || ''
  const forms = (group.defaultVariant?.formQuality || [])
  const preferred = forms.find((f) => f.tier === 'preferred')
  const acceptable = forms.find((f) => f.tier === 'acceptable')
  const basic = forms.find((f) => f.tier === 'basic')

  const parts = []
  if (preferred) {
    parts.push(`Uses ${preferred.formLabel} \u2014 the ${preferred.tier} form of ${preferred.ingredient}.`)
  } else if (acceptable) {
    parts.push(`Uses ${acceptable.formLabel} of ${acceptable.ingredient} \u2014 a reasonable, broadly-studied form.`)
  } else if (basic) {
    parts.push(`Contains ${basic.formLabel} of ${basic.ingredient}. Better forms exist \u2014 keep browsing for alternatives.`)
  }

  if (group.curated) {
    parts.push('Sourced from a brand we\u2019ve verified as delivering label-transparent, brand-direct products.')
  } else if (group.defaultVariant.brand?.url?.source === 'dsld_manufacturer') {
    parts.push('Manufacturer contact is on file with the NIH DSLD label record.')
  }

  if (notes) parts.push(notes)
  return parts.join(' ')
}
