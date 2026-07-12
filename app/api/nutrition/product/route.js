// /app/app/api/nutrition/product/route.js
// Server-side proxy to Open Food Facts. Keeps CORS + rate-limit headaches
// off the client and gives us one shape to consume across scanner, journal,
// and search. No API key required by Open Food Facts, but they ask that
// consumers set a descriptive User-Agent.

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const UA = 'SelfScience/1.0 (contact@selfscience.io)'
const OFF_BASE = 'https://world.openfoodfacts.org'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const barcode = (searchParams.get('barcode') || '').trim()
  const query = (searchParams.get('query') || '').trim()

  try {
    if (barcode) {
      const res = await fetch(`${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json`, {
        headers: { 'User-Agent': UA },
        // Prevent Next 15 from caching product lookups — users expect fresh data.
        cache: 'no-store',
      })
      if (!res.ok) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      const data = await res.json()
      const product = data?.product ? extractProductData(data.product) : null
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      return NextResponse.json({ product })
    }

    if (query) {
      const res = await fetch(
        `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`,
        { headers: { 'User-Agent': UA }, cache: 'no-store' }
      )
      if (!res.ok) return NextResponse.json({ error: 'Search failed' }, { status: 500 })
      const data = await res.json()
      return NextResponse.json({
        products: (data?.products || []).map(extractProductData).filter(Boolean),
      })
    }

    return NextResponse.json({ error: 'Provide barcode or query' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Upstream product API unavailable', detail: String(err) }, { status: 502 })
  }
}

function extractProductData(product) {
  if (!product) return null
  return {
    name: product.product_name || product.product_name_en || product.generic_name || 'Unknown product',
    brand: product.brands || '',
    barcode: product.code || '',
    image: product.image_front_url || product.image_url || null,
    ingredients_text: product.ingredients_text || product.ingredients_text_en || '',
    ingredients: (product.ingredients || []).map((i) => i.text || i.id || '').filter(Boolean),
    allergens: product.allergens_tags || [],
    additives: product.additives_tags || [],
    nutriments: {
      energy_kcal:   product.nutriments?.['energy-kcal_100g'] ?? null,
      protein:       product.nutriments?.['proteins_100g'] ?? null,
      carbs:         product.nutriments?.['carbohydrates_100g'] ?? null,
      sugars:        product.nutriments?.['sugars_100g'] ?? null,
      fat:           product.nutriments?.['fat_100g'] ?? null,
      saturated_fat: product.nutriments?.['saturated-fat_100g'] ?? null,
      fiber:         product.nutriments?.['fiber_100g'] ?? null,
      sodium:        product.nutriments?.['sodium_100g'] ?? null,
    },
    nutriscore: product.nutriscore_grade || null,
    nova_group: product.nova_group || null,
    serving_size: product.serving_size || null,
  }
}
