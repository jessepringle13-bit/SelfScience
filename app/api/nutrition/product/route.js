// /app/app/api/nutrition/product/route.js
// Server-side proxy to Open Food Facts + curated category browse.
//   GET ?barcode=XXX                           → single-product lookup
//   GET ?query=Quest&page=1                    → text + brand-catalog merge
//   GET ?category=protein-bars&page=1          → category browse (US-first)
//
// Design notes
// ------------
// * Everything is US-first: we append `countries_tags=en:united-states` so
//   American brands rank ahead of the more-scanned European ones. Category
//   browses that come back empty fall back to a global query so the shelf
//   is never blank.
// * `safeFetch` handles Open Food Facts' occasional HTML/503 responses.
//   OFF sometimes returns an HTML error page with a 200 status — we detect
//   that via Content-Type and treat it as a transient failure instead of
//   crashing on `JSON.parse`.
// * Brand searches ("Barbella's", "Quest", …) go through /cgi/suggest.pl
//   first to resolve the canonical slug OFF stores internally. This is
//   what makes apostrophe-heavy brand names actually return results.
// * All macros are rounded to whole numbers server-side so the client
//   never touches decimal formatting. Very small values (<1g fiber) are
//   rendered as the string "<1" for readability.
// * Response shapes are intentionally backwards-compatible with the
//   existing client:
//     barcode  → { product: {...} }
//     query    → { products: [...], total_found, query, page }
//     category → { products: [...], total_found, category, page }
//     rate-limit → { error: 'temporarily_unavailable', message, products: [], total_found: 0 }
//                  with HTTP 503 so the client can distinguish.

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const UA = 'SelfScience/1.0 (contact@selfscience.io)'
const OFF_BASE = 'https://world.openfoodfacts.org'
const US_TAG = 'en:united-states'

const FIELDS = [
  'code', 'product_name', 'product_name_en', 'brands',
  'image_front_url', 'image_url',
  'ingredients_text', 'ingredients_text_en',
  'ingredients', 'allergens_tags', 'additives_tags',
  'nutriments', 'nutriscore_grade', 'nova_group',
  'serving_size', 'categories_tags', 'countries_tags', 'labels_tags',
  'unique_scans_n',
].join(',')

// ---------------------------------------------------------------------------
// Category slugs → Open Food Facts taxonomy tags. Every tag here has been
// spot-checked to return >0 US products from v2 search.
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  // Protein & fitness
  'protein-bars':      'en:protein-bars',
  'protein-powder':    'en:protein-powders',
  'energy-drinks':     'en:energy-drinks',
  'sports-drinks':     'en:sports-drinks',
  'meal-replacement':  'en:meal-replacement',
  'protein-chips':     'en:salty-snacks',
  // Beverages
  'teas':              'en:teas',
  'coffees':           'en:coffees',
  'juices':            'en:fruit-juices',
  'sodas':             'en:sodas',
  'plant-based-milk':  'en:plant-based-milks',
  // Snacks
  'snack-bars':        'en:snack-bars',
  'granola-bars':      'en:granola-bars',
  'chips':             'en:chips-and-crisps',
  'crackers':          'en:crackers',
  'popcorn':           'en:popcorn',
  'nuts':              'en:nuts',
  'nut-butters':       'en:nut-butters',
  'peanut-butter':     'en:peanut-butters',
  'jerky':             'en:meat-snacks',
  'rice-cakes':        'en:rice-cakes',
  // Breakfast & bakery
  'breakfast-cereals': 'en:breakfast-cereals',
  'breads':            'en:breads',
  // Dairy & alternatives
  'yogurts':           'en:yogurts',
  'cheeses':           'en:cheeses',
  'milks':             'en:milks',
  'ice-cream':         'en:ice-creams',
  // Pantry
  'pastas':            'en:pastas',
  'sauces':            'en:sauces',
  'condiments':        'en:condiments',
  'salad-dressings':   'en:salad-dressings',
  'oils':              'en:oils',
  'hot-sauce':         'en:hot-sauces',
  'ketchup':           'en:ketchup',
  'mayonnaise':        'en:mayonnaise',
  'bread-spreads':     'en:bread-spreads',
  // Frozen & canned
  'frozen-meals':      'en:frozen-meals',
  'frozen-pizzas':     'en:frozen-pizzas',
  'frozen-vegetables': 'en:frozen-vegetables',
  'canned-beans':      'en:canned-legumes',
  'canned-tuna':       'en:canned-fish',
  'soups':             'en:soups',
  // Sweets
  'chocolate':         'en:chocolates',
  'cookies':           'en:cookies',
  // Basics / supplements
  'supplements':       'en:dietary-supplements',
  'eggs':              'en:eggs',
  'chicken':           'en:chicken',
  'beef':              'en:beef',
  'fish':              'en:fish',
  'baby-food':         'en:baby-foods',
}

// ---------------------------------------------------------------------------
// safeFetch — every upstream call goes through here. Returns `null` on any
// upstream problem so callers can decide whether to fall back / retry.
// ---------------------------------------------------------------------------
async function safeFetch(url, { timeoutMs = 9000 } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      cache: 'no-store',
      signal: ctrl.signal,
    })
    if (res.status === 503 || res.status === 429) return { __rateLimited: true }
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('json')) {
      // OFF occasionally returns an HTML "please try later" page with 200.
      return { __rateLimited: true }
    }
    return await res.json()
  } catch (err) {
    // AbortError, network error, etc — surface as null so callers retry/fallback.
    if (err?.name !== 'AbortError') {
      console.warn('OFF fetch error:', err?.message || err)
    }
    return null
  } finally {
    clearTimeout(t)
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const barcode  = (searchParams.get('barcode')  || '').trim()
  const query    = (searchParams.get('query')    || '').trim()
  const category = (searchParams.get('category') || '').trim()
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  try {
    if (barcode) return await handleBarcode(barcode)
    if (query)   return await handleQuery(query, page)
    if (category) return await handleCategory(category, page)
    return NextResponse.json({ error: 'Provide barcode, query, or category' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Upstream product API unavailable', detail: String(err) }, { status: 502 })
  }
}

// ─── BARCODE ────────────────────────────────────────────────────────────────
async function handleBarcode(barcode) {
  const data = await safeFetch(
    `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`
  )
  if (!data || data.__rateLimited) {
    return NextResponse.json(
      { error: 'temporarily_unavailable', message: 'Open Food Facts is temporarily unavailable. Try again in a moment.' },
      { status: 503 },
    )
  }
  if (data.status === 0 || !data.product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  const product = extractProductData(data.product)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product })
}

// ─── TEXT SEARCH ────────────────────────────────────────────────────────────
async function handleQuery(query, page) {
  // Two-step: (1) US-filtered free-text via legacy CGI, (2) brand-tag lookup
  // via v2 API after resolving the canonical slug (handles apostrophes etc.).
  const results = []
  const seen = new Set()
  let anyUpstreamOK = false

  // 1. Free-text (US-first). One retry if empty on cold cache.
  const textUrl = buildTextSearchUrl(query, page)
  let textData = await safeFetch(textUrl)
  if (textData && !textData.__rateLimited) anyUpstreamOK = true
  if (!textData || textData.__rateLimited || !textData?.products?.length) {
    await new Promise((r) => setTimeout(r, 400))
    textData = await safeFetch(textUrl)
    if (textData && !textData.__rateLimited) anyUpstreamOK = true
  }
  addProductsToResults(textData?.products, results, seen)

  // 2. Brand slug lookup for short queries (1-3 tokens) if we still need more.
  const tokens = query.split(/\s+/).filter(Boolean)
  if (tokens.length <= 3 && results.length < 20) {
    const suggest = await safeFetch(
      `${OFF_BASE}/cgi/suggest.pl?tagtype=brands&term=${encodeURIComponent(query)}&lc=en&json=1`
    )
    if (suggest && !suggest.__rateLimited) anyUpstreamOK = true
    if (Array.isArray(suggest) && suggest.length > 0) {
      // Try the top 3 suggestions — the first is usually spot-on but for
      // multi-brand queries ("Quest") the second/third can add variety.
      for (const suggestion of suggest.slice(0, 3)) {
        const slug = String(suggestion)
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[^\w\s-]/g, '')  // strip apostrophes / punctuation
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        if (!slug) continue

        const brandParams = new URLSearchParams({
          brands_tags_en: slug,
          countries_tags_en: US_TAG,
          sort_by: 'unique_scans_n',
          page_size: '30',
          page: String(page),
          fields: FIELDS,
        })
        let brandData = await safeFetch(`${OFF_BASE}/api/v2/search?${brandParams}`)
        if (brandData && !brandData.__rateLimited) anyUpstreamOK = true
        // Retry once without the US filter if brand has no US listings.
        if (!brandData?.products?.length) {
          brandParams.delete('countries_tags_en')
          brandData = await safeFetch(`${OFF_BASE}/api/v2/search?${brandParams}`)
          if (brandData && !brandData.__rateLimited) anyUpstreamOK = true
        }
        addProductsToResults(brandData?.products, results, seen)
        if (results.length >= 40) break
      }
    }
  }

  // If EVERY upstream call was rate-limited/down and we got nothing, surface
  // that clearly so the client can render "temporarily unavailable" instead
  // of a misleading "no results".
  if (!anyUpstreamOK && results.length === 0) {
    return NextResponse.json(
      {
        error: 'temporarily_unavailable',
        message: 'Open Food Facts is temporarily unavailable. Please try again in a moment.',
        products: [],
        total_found: 0,
        query,
        page,
      },
      { status: 503 },
    )
  }

  // Sort: US-first, then image + ingredients presence, then scan count.
  results.sort((a, b) => scoreProduct(b) - scoreProduct(a))

  return NextResponse.json({
    products: results.slice(0, 48),
    total_found: results.length,
    query,
    page,
  })
}

// ─── CATEGORY BROWSE ────────────────────────────────────────────────────────
async function handleCategory(categoryKey, page) {
  const off = CATEGORY_MAP[categoryKey]
  if (!off) {
    return NextResponse.json(
      { error: 'Unknown category', supported: Object.keys(CATEGORY_MAP) },
      { status: 400 },
    )
  }

  const usParams = new URLSearchParams({
    categories_tags: off,
    countries_tags: US_TAG,
    sort_by: 'unique_scans_n',
    page_size: '48',
    page: String(page),
    fields: FIELDS,
  })
  let data = await safeFetch(`${OFF_BASE}/api/v2/search?${usParams}`)

  // Rate-limited → surface a helpful error the client can render inline.
  if (data?.__rateLimited) {
    return NextResponse.json(
      {
        error: 'temporarily_unavailable',
        message: 'Product database is temporarily unavailable. Please try again in a moment.',
        products: [],
        total_found: 0,
      },
      { status: 503 },
    )
  }

  // No US results → fall back to the global feed so the shelf isn't empty.
  let note = null
  if (!data || !data.products || data.products.length === 0) {
    note = 'Showing global results — US-only feed returned no data for this category.'
    const globalParams = new URLSearchParams({
      categories_tags: off,
      sort_by: 'unique_scans_n',
      page_size: '48',
      page: String(page),
      fields: FIELDS,
    })
    data = await safeFetch(`${OFF_BASE}/api/v2/search?${globalParams}`)
    if (data?.__rateLimited || !data) {
      return NextResponse.json(
        {
          error: 'temporarily_unavailable',
          message: 'Product database is temporarily unavailable. Please try again in a moment.',
          products: [],
          total_found: 0,
        },
        { status: 503 },
      )
    }
  }

  const products = (data?.products || [])
    .filter((p) => p.product_name || p.product_name_en)
    .map(extractProductData)
    .filter(Boolean)
    .filter((p) => !isNonHumanFood(p))

  // Preserve OFF's popularity ordering; only apply a light image-preference tiebreak.
  return NextResponse.json({
    products,
    total_found: data?.count ?? products.length,
    category: categoryKey,
    category_off_tag: off,
    page,
    ...(note ? { note } : {}),
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildTextSearchUrl(query, page) {
  // Legacy CGI is the only OFF endpoint that supports free-text search.
  // `search_simple=0` is required for the advanced tag filter (US country
  // restriction) to actually apply — with search_simple=1 OFF silently
  // ignores the tag_* fields and returns global results.
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '0',
    action: 'process',
    json: '1',
    page_size: '30',
    page: String(page),
    sort_by: 'unique_scans_n',
    tagtype_0: 'countries',
    tag_contains_0: 'contains',
    tag_0: 'en:united-states',
    fields: FIELDS,
  })
  return `${OFF_BASE}/cgi/search.pl?${params}`
}

function addProductsToResults(rawProducts, results, seen) {
  if (!rawProducts?.length) return
  for (const raw of rawProducts) {
    const p = extractProductData(raw)
    if (!p) continue
    if (!p.name || p.name === 'Unknown product') continue
    if (!p.barcode || seen.has(p.barcode)) continue
    if (isNonHumanFood(p)) continue
    results.push(p)
    seen.add(p.barcode)
  }
}

// ---------------------------------------------------------------------------
// Guardrails against non-human-food showing up in food searches. Two signals:
//   1. Category tags — dog/cat/pet food is clearly tagged in OFF.
//   2. Brand/name pattern — "Milk-Bone", "Purina", "Iams" etc. Handles the
//      case where OFF has empty categories (data quality varies wildly).
// ---------------------------------------------------------------------------
const PET_CATEGORY_PATTERNS = [
  'dog-snack', 'dog-biscuit', 'dog-food', 'dog-treat',
  'cat-food', 'cat-treat', 'cat-snack',
  'pet-food', 'pet-treat', 'pet-snack',
  'animal-feed', 'animal-food', 'kibble',
  'bird-food', 'fish-food', 'rabbit-food',
]
const PET_BRAND_PATTERNS = [
  /milk[\s-]?bone/i,
  /\bpurina\b/i,
  /\biams\b/i,
  /\bpedigree\b/i,
  /\bfriskies\b/i,
  /\bfancy feast\b/i,
  /\bmeow mix\b/i,
  /\bwhiskas\b/i,
  /\bcesar\b/i,
  /\bblue buffalo\b/i,
  /\bhills? science diet\b/i,
  /\bnutro\b/i,
  /\btemptations\b/i,
  /\bgreenies\b/i,
  /\bwellness core\b/i,
  /\borijen\b/i,
  /\bacana\b/i,
]
function isNonHumanFood(p) {
  const cats = (p.categories || []).map((c) => String(c).toLowerCase())
  if (cats.some((c) => PET_CATEGORY_PATTERNS.some((pat) => c.includes(pat)))) return true
  const brand = String(p.brand || '')
  if (PET_BRAND_PATTERNS.some((re) => re.test(brand))) return true
  // Very defensive last check: product name matches obvious pet-food giveaways.
  const name = String(p.name || '')
  if (/\b(dog|cat|puppy|kitten|pet)\s+(food|treat|biscuit|chew|snack|kibble|bone)/i.test(name)) return true
  if (/\bmilk[\s-]?bone/i.test(name)) return true
  return false
}

function scoreProduct(p) {
  const countries = (p.countries || []).map((c) => String(c).toLowerCase())
  const isUSPrimary = countries.slice(0, 2).some((c) => c.includes('united-states')) ? 8 : 0
  const isUSSecondary = !isUSPrimary && countries.some((c) => c.includes('united-states')) ? 2 : 0
  // Very long country lists usually indicate a globally-distributed product
  // OFF users have tagged with dozens of markets (e.g. Nutella, Coca-Cola).
  // For US shoppers those aren't as relevant as US-primary items so we
  // subtract a small penalty.
  const globalPenalty = countries.length > 6 ? -2 : 0
  const img = p.image ? 3 : 0
  const ing = p.ingredients_text ? 2 : 0
  const namedOK = p.name && p.name !== 'Unknown product' ? 1 : 0
  const scanBoost = Math.min(3, Math.log10((p.scans || 0) + 1))
  return isUSPrimary + isUSSecondary + globalPenalty + img + ing + namedOK + scanBoost
}

function roundMacro(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n)) return null
  return Math.round(n)
}

// Small values (fiber, salt in g) that round to 0 are more useful as "<1"
// so users don't misread a rounded zero as an actual zero.
function formatSmallMacro(value) {
  const r = roundMacro(value)
  if (r === null) return null
  if (r === 0 && Number(value) > 0) return '<1'
  return r
}

function extractProductData(product) {
  if (!product) return null
  const name = product.product_name_en || product.product_name || ''
  if (!name) return null
  const n = product.nutriments || {}

  return {
    name,
    brand: product.brands || '',
    barcode: product.code || '',
    image: product.image_front_url || product.image_url || null,
    ingredients_text: product.ingredients_text_en || product.ingredients_text || '',
    ingredients: (product.ingredients || [])
      .map((i) => ({
        id: i.id || '',
        text: i.text || i.id || '',
        percent: i.percent_estimate ? Math.round(i.percent_estimate) : null,
      }))
      .filter((i) => i.text),
    allergens: product.allergens_tags || [],
    additives: (product.additives_tags || []).map((a) => String(a).replace(/^en:/, '')),
    labels: (product.labels_tags || []).map((l) => String(l).replace(/^en:/, '')),
    countries: product.countries_tags || [],
    nutriscore: product.nutriscore_grade ? String(product.nutriscore_grade).toUpperCase() : null,
    nova_group: product.nova_group ? Number(product.nova_group) : null,
    serving_size: product.serving_size || null,
    scans: product.unique_scans_n || 0,
    categories: (product.categories_tags || []).slice(0, 8).map((c) => String(c).replace(/^en:/, '')),
    nutriments: {
      // Per 100g (reference)
      energy_kcal:      roundMacro(n['energy-kcal_100g']),
      protein_g:        roundMacro(n['proteins_100g']),
      carbs_g:          roundMacro(n['carbohydrates_100g']),
      sugars_g:         roundMacro(n['sugars_100g']),
      fat_g:            roundMacro(n['fat_100g']),
      saturated_fat_g:  roundMacro(n['saturated-fat_100g']),
      fiber_g:          formatSmallMacro(n['fiber_100g']),
      sodium_mg:        n['sodium_100g'] ? roundMacro(n['sodium_100g'] * 1000) : null,
      // Per serving (preferred for display when available)
      energy_kcal_serving:      roundMacro(n['energy-kcal_serving']),
      protein_g_serving:        roundMacro(n['proteins_serving']),
      carbs_g_serving:          roundMacro(n['carbohydrates_serving']),
      sugars_g_serving:         roundMacro(n['sugars_serving']),
      fat_g_serving:            roundMacro(n['fat_serving']),
      saturated_fat_g_serving:  roundMacro(n['saturated-fat_serving']),
      fiber_g_serving:          formatSmallMacro(n['fiber_serving']),
      sodium_mg_serving:        n['sodium_serving'] ? roundMacro(n['sodium_serving'] * 1000) : null,
    },
  }
}
