// /app/app/api/supplements/dsld-product/route.js
// Server-side proxy to the NIH Dietary Supplement Label Database (DSLD).
// Public endpoint — no API key required.
//   GET ?barcode=XXX        → single-product lookup by UPC
//   GET ?query=Thorne&size=6 → text search
//
// Docs: https://api.ods.od.nih.gov/dsld/v9/

import { NextResponse } from 'next/server'

const DSLD_BASE = 'https://api.ods.od.nih.gov/dsld/v9'

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
}

async function safeFetch(url, opts = {}) {
  try {
    const r = await fetch(url, { ...opts, headers: { Accept: 'application/json', ...(opts.headers || {}) } })
    if (!r.ok) return { ok: false, status: r.status }
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('json')) return { ok: false, status: r.status, err: 'non-json' }
    return { ok: true, data: await r.json() }
  } catch (err) {
    return { ok: false, err: err?.message }
  }
}

// Normalise a DSLD label hit into a compact product record.
function shapeProduct(raw) {
  if (!raw) return null
  const src = raw._source || raw
  return {
    dsldId:       src.id || raw._id || null,
    upcSku:       src.upcSku || src.upc || null,
    productName:  src.fullName || src.productName || 'Unknown supplement',
    brand:        src.brandName || null,
    dosageForm:   src.physicalState?.langualDescription || src.physicalState || null,
    servingSize:  src.servingSizes?.[0]?.quantity ? `${src.servingSizes[0].quantity} ${src.servingSizes[0].unit || ''}`.trim() : null,
    ingredients: (src.ingredientRows || []).map((r) => ({
      name:     r.name || r.forms?.[0]?.name || null,
      form:     r.forms?.[0]?.name || null,
      quantity: r.quantity?.[0]?.quantity || null,
      unit:     r.quantity?.[0]?.unit || null,
      category: r.category || null,
      role:     r.ingredientGroup || null,
    })).filter((x) => x.name),
    claims:      (src.claims || []).map((c) => c.langualDescription || c.name).filter(Boolean),
    thumbnail:   src.thumbnail || null,
    officialUrl: src.offMarketDate ? null : src.productUrl || null,
    onMarket:    !src.offMarketDate,
    raw:         null, // omit raw to keep payload small
  }
}

export async function GET(req) {
  const url = new URL(req.url)
  const barcode = url.searchParams.get('barcode')
  const query   = url.searchParams.get('query')
  const size    = Math.min(Number(url.searchParams.get('size') || 6), 20)

  try {
    // Barcode lookup
    if (barcode) {
      const clean = String(barcode).replace(/[^0-9]/g, '').trim()
      if (!clean) return NextResponse.json({ product: null }, { headers: noStore })

      // DSLD search supports upcSku field.
      const q = encodeURIComponent(clean)
      const search = await safeFetch(`${DSLD_BASE}/search-filter?q=upcSku:${q}&size=1`)
      if (search.ok && search.data?.hits?.hits?.length) {
        const product = shapeProduct(search.data.hits.hits[0])
        return NextResponse.json({ product }, { headers: noStore })
      }
      return NextResponse.json({ product: null, notFound: true }, { headers: noStore })
    }

    // Text search
    if (query) {
      const q = encodeURIComponent(query.trim())
      const search = await safeFetch(`${DSLD_BASE}/search-filter?q=${q}&size=${size}`)
      if (search.ok && search.data?.hits?.hits?.length) {
        const products = search.data.hits.hits.map(shapeProduct).filter(Boolean)
        return NextResponse.json({
          products,
          total_found: search.data.hits.total?.value || products.length,
          query,
        }, { headers: noStore })
      }
      return NextResponse.json({ products: [], total_found: 0, query }, { headers: noStore })
    }

    return NextResponse.json({ error: 'Provide a barcode or query.' }, { status: 400, headers: noStore })
  } catch (err) {
    return NextResponse.json({ error: 'dsld_error', message: err?.message }, { status: 500, headers: noStore })
  }
}
