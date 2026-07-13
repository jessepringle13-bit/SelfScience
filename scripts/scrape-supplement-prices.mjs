#!/usr/bin/env node
/*
 * /app/scripts/scrape-supplement-prices.mjs
 *
 * Operator script (NOT auto-run). Fetches the brand-store product pages for
 * a curated set of (brand, ingredient) SKUs, extracts the per-serving price,
 * and writes /app/lib/supplements/prices.json.
 *
 * Rules:
 *   - Respect robots.txt (per-domain check up front)
 *   - Per-brand throttle: min 30s between requests to the same brand host
 *   - 1 concurrent request per brand host
 *   - Random delay 5-15s between different-host requests
 *   - Custom User-Agent identifying SelfScience + contact email
 *   - Cache /app/lib/supplements/prices.json monthly at most
 *   - Skip brands whose robots.txt disallow the target path
 *   - Log failures and continue (never fail the whole run)
 *
 * Usage:
 *   node scripts/scrape-supplement-prices.mjs [--dry-run] [--brand=<slug>]
 *
 * The `targets` table below is the curated list of "canonical SKUs" — the
 * flagship product per brand for each ingredient family we track. Extraction
 * selectors (CSS) are the primary hook; a fallback regex on the raw HTML
 * catches OpenGraph 'product:price:amount' meta tags.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PRICES_PATH = path.join(__dirname, '..', 'lib', 'supplements', 'prices.json')
const UA = 'SelfScience-PriceCache/1.0 (+https://selfscience.io/bots; hello@selfscience.io)'

const targets = [
  { brand: 'MethylPro',           family: 'Folate (Vitamin B9)',    url: 'https://methylpro.com/products/l-methylfolate-5-mg-90-capsules',    servingsPerContainer: 90 },
  { brand: 'Thorne',              family: 'Folate (Vitamin B9)',    url: 'https://www.thorne.com/products/dp/5-mthf-1-mg',                    servingsPerContainer: 60 },
  { brand: 'Nordic Naturals',     family: 'Omega-3 (EPA/DHA)',      url: 'https://www.nordicnaturals.com/consumers/ultimate-omega-1280-mg-omega-3/', servingsPerContainer: 60 },
  { brand: 'Carlson',             family: 'Omega-3 (EPA/DHA)',      url: 'https://carlsonlabs.com/product/the-very-finest-fish-oil/',         servingsPerContainer: 60 },
  { brand: 'Momentous',           family: 'Creatine',                url: 'https://www.livemomentous.com/products/creatine-monohydrate',       servingsPerContainer: 90 },
  { brand: 'Thorne',              family: 'Creatine',                url: 'https://www.thorne.com/products/dp/creatine',                       servingsPerContainer: 90 },
  { brand: 'NOW Foods',           family: 'Vitamin D',               url: 'https://www.nowfoods.com/products/supplements/vitamin-d-3-5000-iu-softgels', servingsPerContainer: 240 },
]

async function loadPrices() {
  try {
    const raw = await fs.readFile(PRICES_PATH, 'utf8')
    return JSON.parse(raw)
  } catch { return { _meta: {}, prices: {} } }
}

async function savePrices(data) {
  data._meta = { ...(data._meta || {}), lastUpdated: new Date().toISOString().slice(0, 10) }
  await fs.writeFile(PRICES_PATH, JSON.stringify(data, null, 2) + '\n')
}

// ------ scraper stubs (deliberately conservative) ------
// Real implementation would use a headless browser (playwright) or fetch +
// cheerio. For MVP the extraction is left as an operator-triggered task; we
// only ship the plumbing.
async function scrapeOne(target) {
  // console.warn(`[scrape] ${target.brand} -> ${target.url}`)
  // 1. GET robots.txt for the host, verify the path is allowed
  // 2. Extract price via product-schema / OpenGraph / configured CSS
  // 3. Divide by target.servingsPerContainer -> perServing
  return null // No auto-scrape; operator wires this in when legally cleared
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const brandFilter = (args.find((a) => a.startsWith('--brand=')) || '').replace('--brand=', '').toLowerCase()

  const data = await loadPrices()
  console.log(`Loaded ${Object.keys(data.prices || {}).length} cached prices.`)

  const perBrandLast = new Map()
  for (const t of targets) {
    if (brandFilter && t.brand.toLowerCase() !== brandFilter) continue
    const host = new URL(t.url).host
    const last = perBrandLast.get(host) || 0
    const wait = Math.max(0, 30_000 - (Date.now() - last))
    if (wait) { console.log(`  throttling ${host} for ${wait}ms`); await new Promise((r) => setTimeout(r, wait)) }

    let result = null
    try { result = await scrapeOne(t) } catch (err) { console.warn(`  failed ${t.brand}:`, err.message) }
    perBrandLast.set(host, Date.now())

    if (!result) { console.log(`  skipped ${t.brand} (no auto-scrape wired)`); continue }

    const key = `${t.brand.toLowerCase()}::${t.family.toLowerCase()}`
    const perServing = result.total / t.servingsPerContainer
    data.prices[key] = {
      perServing: Number(perServing.toFixed(2)),
      currency: 'USD',
      updated: new Date().toISOString().slice(0, 7),
      source: 'scraped',
      productUrl: t.url,
    }
    console.log(`  ${t.brand} -> $${perServing.toFixed(2)}/serving`)

    // Random 5-15s pause between different-host requests
    await new Promise((r) => setTimeout(r, 5_000 + Math.random() * 10_000))
  }

  if (dryRun) { console.log('DRY RUN: not writing prices.json'); return }
  await savePrices(data)
  console.log(`Wrote ${Object.keys(data.prices).length} prices to prices.json`)
}

main().catch((err) => { console.error(err); process.exit(1) })
