// /app/lib/supplements/dsld.js
// Normalizers that convert raw NIH DSLD (Dietary Supplement Label Database)
// JSON into the SelfScience-facing shapes we render in cards.
//
// Two DSLD endpoints in play:
//   1. GET /dsld/v9/search-filter?q=...     -> list of hits with a `_source` blob
//   2. GET /dsld/v9/label/{id}              -> full label including manufacturer
//                                              contact webAddress + ingredientRows
//
// We deliberately keep this as a pure transformation layer with NO network
// calls \u2014 the server route.js wraps DSLD, and the browser calls our route.

import { evaluateIngredientForm } from './ingredientForms'
import { resolveBrandUrl, getCuratedTrustBadges, isBrandCurated } from './brandDirectory'

// ---------- 1. Search-hit \u2192 SupplementProduct summary --------------------
export function normalizeSearchHit(hit) {
  const src = hit?._source || {}
  const id  = hit?._id ?? src?.id ?? null
  if (!id) return null

  const activeIngredients = (src.allIngredients || [])
    .filter((i) => i && i.category && !isInactive(i.category))
    .map((i) => ({
      name: i.name || 'Unknown',
      group: i.ingredientGroup || null,
      category: i.category || null,
      notes: i.notes || null,
    }))

  const brandName = src.brandName || 'Unknown brand'
  const brand = {
    name: brandName,
    curated: isBrandCurated(brandName),
    trustBadges: getCuratedTrustBadges(brandName),
    url: resolveBrandUrl(brandName, null),
  }

  return {
    id: String(id),
    fullName: src.fullName || 'Untitled product',
    brand,
    productType: src.productType?.langualCodeDescription || null,
    physicalState: src.physicalState?.langualCodeDescription || null,
    netContents: (src.netContents || []).map((n) => n.display).filter(Boolean).join(', ') || null,
    offMarket: src.offMarket === 1,
    entryDate: src.entryDate || null,
    ingredients: activeIngredients,
    // Ingredient-form quality tags for THIS card. Only tag active ingredients.
    formQuality: dedupeFormQuality(activeIngredients
      .map((ing) => evaluateIngredientForm({
        name: ing.name,
        formName: ing.name,
        notes: ing.notes,
        group: ing.group,
      }))
      .filter(Boolean)),
  }
}

// ---------- 2. Full label \u2192 SupplementProduct detail --------------------
export function normalizeLabelDetail(label) {
  if (!label) return null
  const id = label.id ?? label._id ?? null

  const brandName = label.brandName || 'Unknown brand'
  const manufacturer = (label.contacts || []).find((c) => (c.types || []).includes('Manufacturer'))?.contactDetails || {}
  const web = manufacturer.webAddress || null

  const brand = {
    name: brandName,
    curated: isBrandCurated(brandName),
    trustBadges: getCuratedTrustBadges(brandName),
    url: resolveBrandUrl(brandName, web),
    manufacturer: {
      name: manufacturer.name || null,
      city: manufacturer.city || null,
      state: manufacturer.state || null,
      country: manufacturer.country || null,
      phone: manufacturer.phoneNumber || null,
    },
  }

  // Ingredient rows (label detail carries `ingredientRows` with `forms[]`)
  const rows = flattenIngredientRows(label.ingredientRows || [])
  const activeRows = rows.filter((r) => !isInactive(r.category))

  const formQuality = dedupeFormQuality(activeRows
    .map((r) => evaluateIngredientForm({
      name: r.name,
      formName: r.formName,
      notes: r.notes,
      group: r.ingredientGroup,
    }))
    .filter(Boolean))

  const statements = label.statements || []
  const noteByType = (typeRegex) => {
    const s = statements.find((st) => typeRegex.test(st.type || ''))
    return s?.notes || null
  }

  return {
    id: String(id),
    fullName: label.fullName || 'Untitled product',
    brand,
    productType: label.productType?.langualCodeDescription || null,
    physicalState: label.physicalState?.langualCodeDescription || null,
    servingsPerContainer: label.servingsPerContainer || null,
    servingSizes: (label.servingSizes || []).map((s) => ({
      quantity: s.minQuantity ?? null,
      unit: s.unit || null,
    })),
    netContents: (label.netContents || []).map((n) => n.display).filter(Boolean).join(', ') || null,
    targetGroups: label.targetGroups || [],
    ingredients: activeRows,
    formQuality,
    directions: noteByType(/Directions|Suggested/i),
    storage: noteByType(/Storage/i),
    warnings: [
      noteByType(/Precautions/i),
      noteByType(/Contraindications/i),
    ].filter(Boolean),
    doesNotContain: noteByType(/Does NOT Contain/i),
    manufacturedIn: noteByType(/GMP|Manufactured/i),
    labelPdf: label.pdf ? `https://dsld.od.nih.gov/labels/${label.pdf}` : null,
    thumbnail: label.thumbnail ? `https://dsld.od.nih.gov/labels/${label.thumbnail}` : null,
    offMarket: label.offMarket === 1,
  }
}

// ---------- helpers ------------------------------------------------------

const INACTIVE_CATEGORIES = new Set([
  'other', 'fiber', 'excipient', 'binder', 'coating', 'colorant',
])
function isInactive(category) {
  if (!category) return false
  const c = String(category).toLowerCase().trim()
  return INACTIVE_CATEGORIES.has(c)
}

// Dedupe form-quality entries by ingredient, preferring the most-informative
// tier (preferred > acceptable > basic > unknown). Prevents an ingredient
// like "Folate" with a stub row from masking a better row that carried the
// real form info in `notes`.
const TIER_PRIORITY = { preferred: 3, acceptable: 2, basic: 1, unknown: 0 }
function dedupeFormQuality(list) {
  const map = new Map()
  for (const item of list) {
    if (!item) continue
    const prev = map.get(item.ingredient)
    if (!prev) { map.set(item.ingredient, item); continue }
    if ((TIER_PRIORITY[item.tier] ?? 0) > (TIER_PRIORITY[prev.tier] ?? 0)) {
      map.set(item.ingredient, item)
    }
  }
  return Array.from(map.values())
}

// Recursively flatten DSLD ingredient rows (which may have `nestedRows[]` and
// each row also has `forms[]` for the mineral/salt form).
function flattenIngredientRows(rows, depth = 0) {
  const out = []
  for (const r of rows) {
    if (!r) continue
    const dose = (r.quantity || []).map((q) => `${q.quantity}${q.unit ? ' ' + q.unit : ''}`).join(' / ')
    const forms = (r.forms || []).map((f) => f.name).filter(Boolean).join(', ')
    out.push({
      name: r.name || 'Unknown',
      category: r.category || null,
      ingredientGroup: r.ingredientGroup || null,
      formName: forms || null,
      notes: r.notes || null,
      dose: dose || null,
      depth,
    })
    if (Array.isArray(r.nestedRows) && r.nestedRows.length) {
      out.push(...flattenIngredientRows(r.nestedRows, depth + 1))
    }
  }
  return out
}
