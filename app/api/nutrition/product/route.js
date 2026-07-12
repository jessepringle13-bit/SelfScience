// /app/app/api/nutrition/product/route.js
// Server-side proxy to Open Food Facts + curated category browse.
//   GET ?barcode=XXX             → single-product lookup
//   GET ?query=Quest             → full-text + brand-catalog merge (up to 50)
//   GET ?category=protein-bars   → category browse (up to 50 by popularity)
// No API key required. All macro values are rounded to whole numbers
// server-side so the client never has to touch decimal formatting.

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const UA = 'SelfScience/1.0 (contact@selfscience.io)'
const OFF_BASE = 'https://world.openfoodfacts.org'

const FIELDS = [
  'code', 'product_name', 'product_name_en', 'brands',
  'image_front_url', 'image_url',
  'ingredients_text', 'ingredients_text_en',
  'ingredients', 'allergens_tags', 'additives_tags',
  'nutriments', 'nutriscore_grade', 'nova_group',
  'serving_size', 'categories_tags', 'labels_tags',
].join(',')

const CATEGORY_MAP = {
  'protein-bars':   'en:protein-bars',
  'protein-powder': 'en:protein-powders',
  'energy-drinks':  'en:energy-drinks',
  'teas':           'en:teas',
  'cereals':        'en:breakfast-cereals',
  'snack-bars':     'en:snack-bars',
  'crackers':       'en:crackers',
  'chips':          'en:chips-and-crisps',
  'bread':          'en:breads',
  'pasta':          'en:pastas',
  'yogurt':         'en:yogurts',
  'cheese':         'en:cheeses',
  'milk':           'en:milks',
  'juice':          'en:fruit-juices',
  'soda':           'en:sodas',
  'sports-drinks':  'en:sports-drinks',
  'nuts':           'en:nuts',
  'frozen-meals':   'en:frozen-meals',
  'sauces':         'en:sauces',
  'condiments':     'en:condiments',
  'supplements':    'en:dietary-supplements',
  'coffee':         'en:coffees',
  'chocolate':      'en:chocolates',
  'cookies':        'en:cookies',
  'ice-cream':      'en:ice-creams',
  'oils':           'en:oils',
  'meat':           'en:meats',
  'fish':           'en:fish',
  'eggs':           'en:eggs',
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const barcode  = (searchParams.get('barcode')  || '').trim()
  const query    = (searchParams.get('query')    || '').trim()
  const category = (searchParams.get('category') || '').trim()

  try {
    if (barcode) {
      const res = await fetch(`${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, {
        headers: { 'User-Agent': UA }, cache: 'no-store',
      })
      if (!res.ok) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      const data = await res.json()
      const product = data?.product ? extractProductData(data.product) : null
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      return NextResponse.json({ product })
    }

    if (category) {
      const off = CATEGORY_MAP[category]
      if (!off) return NextResponse.json({ error: 'Unknown category', supported: Object.keys(CATEGORY_MAP) }, { status: 400 })
      const url = `${OFF_BASE}/category/${encodeURIComponent(off)}.json?page_size=50&sort_by=unique_scans_n&fields=${FIELDS}`
      const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' })
      if (!res.ok) return NextResponse.json({ error: 'Category lookup failed' }, { status: 502 })
      const data = await res.json()
      const products = (data?.products || [])
        .filter((p) => p.product_name || p.product_name_en)
        .map(extractProductData)
        .filter(Boolean)
      return NextResponse.json({ products, total_found: products.length, category, category_off_tag: off })
    }

    if (query) {
      const isLikelyBrand = query.split(/\s+/).filter(Boolean).length <= 2
      const primaryUrl =
        `${OFF_BASE}/cgi/search.pl?` +
        `search_terms=${encodeURIComponent(query)}` +
        `&search_simple=1&action=process&json=1&page_size=50` +
        `&sort_by=unique_scans_n&fields=${FIELDS}`
      const primaryRes = await fetch(primaryUrl, { headers: { 'User-Agent': UA }, cache: 'no-store' })
      let results = []
      if (primaryRes.ok) {
        const data = await primaryRes.json()
        results = (data?.products || [])
          .filter((p) => p.product_name || p.product_name_en)
          .map(extractProductData)
          .filter(Boolean)
      }
      if (isLikelyBrand) {
        const brandUrl =
          `${OFF_BASE}/cgi/search.pl?` +
          `tagtype_0=brands&tag_contains_0=contains&tag_0=${encodeURIComponent(query)}` +
          `&action=process&json=1&page_size=50` +
          `&sort_by=unique_scans_n&fields=${FIELDS}`
        const brandRes = await fetch(brandUrl, { headers: { 'User-Agent': UA }, cache: 'no-store' })
        if (brandRes.ok) {
          const brandData = await brandRes.json()
          const brandItems = (brandData?.products || [])
            .filter((p) => p.product_name || p.product_name_en)
            .map(extractProductData)
            .filter(Boolean)
          const seen = new Set(results.map((r) => r.barcode))
          for (const r of brandItems) {
            if (r.barcode && !seen.has(r.barcode)) { results.push(r); seen.add(r.barcode) }
          }
        }
      }
      results.sort((a, b) => {
        const sA = (a.image ? 2 : 0) + (a.ingredients_text ? 2 : 0) + (a.name !== 'Unknown product' ? 1 : 0)
        const sB = (b.image ? 2 : 0) + (b.ingredients_text ? 2 : 0) + (b.name !== 'Unknown product' ? 1 : 0)
        return sB - sA
      })
      return NextResponse.json({
        products: results.slice(0, 50),
        total_found: results.length,
        query,
      })
    }

    return NextResponse.json({ error: 'Provide barcode, query, or category' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Upstream product API unavailable', detail: String(err) }, { status: 502 })
  }
}

function roundMacro(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n)) return null
  return Math.round(n)
}

function extractProductData(product) {
  if (!product) return null
  return {
    name: product.product_name || product.product_name_en || 'Unknown product',
    brand: product.brands || '',
    barcode: product.code || '',
    image: product.image_front_url || product.image_url || null,
    ingredients_text: product.ingredients_text || product.ingredients_text_en || '',
    ingredients: (product.ingredients || []).map((i) => ({
      id: i.id || '',
      text: i.text || i.id || '',
      percent: i.percent_estimate ? Math.round(i.percent_estimate) : null,
    })).filter((i) => i.text),
    allergens: product.allergens_tags || [],
    additives: (product.additives_tags || []).map((a) => String(a).replace(/^en:/, '')),
    labels: (product.labels_tags || []).map((l) => String(l).replace(/^en:/, '')),
    nutriments: {
      energy_kcal:      roundMacro(product.nutriments?.['energy-kcal_100g']),
      protein_g:        roundMacro(product.nutriments?.['proteins_100g']),
      carbs_g:          roundMacro(product.nutriments?.['carbohydrates_100g']),
      sugars_g:         roundMacro(product.nutriments?.['sugars_100g']),
      fat_g:            roundMacro(product.nutriments?.['fat_100g']),
      saturated_fat_g:  roundMacro(product.nutriments?.['saturated-fat_100g']),
      fiber_g:          roundMacro(product.nutriments?.['fiber_100g']),
      sodium_mg:        product.nutriments?.['sodium_100g'] ? roundMacro(product.nutriments['sodium_100g'] * 1000) : null,
      energy_kcal_serving: roundMacro(product.nutriments?.['energy-kcal_serving']),
      protein_g_serving:   roundMacro(product.nutriments?.['proteins_serving']),
      carbs_g_serving:     roundMacro(product.nutriments?.['carbohydrates_serving']),
      sugars_g_serving:    roundMacro(product.nutriments?.['sugars_serving']),
      fat_g_serving:       roundMacro(product.nutriments?.['fat_serving']),
    },
    nutriscore: product.nutriscore_grade ? String(product.nutriscore_grade).toUpperCase() : null,
    nova_group: product.nova_group || null,
    serving_size: product.serving_size || null,
    categories: (product.categories_tags || []).slice(0, 8).map((c) => String(c).replace(/^en:/, '')),
  }
}
