'use client'

// /app/lib/weeklyDigest.js
// SelfScience — client-side engine for the "This Week for Your Genome"
// dashboard section. Everything here runs in the browser and touches
// only localStorage — nothing is stored server-side.
//
// Data flow (called from WeeklyDigest.jsx):
//   1. Pick the user's top 5 variants (curated priorities first).
//   2. Card 1 — hit /api/pubmed-search with a 7-day window, escalate to
//      30d then no-window if empty. Never renders an empty card.
//   3. Card 2 — pick a Did You Know snippet, rotating weekly.
//   4. Card 3 — hit /api/clinical-trials/gene for each variant, filter
//      to recruiting trials, sort by location preference (Wisconsin >
//      IL/MN/IA > US > remote/global).
//   5. Cache the whole payload under ss_digest_cache + timestamp under
//      ss_digest_last_refreshed. Refresh weekly.
//
// Additive only — nothing existing is mutated. No LLM or paid API used.

/* ------------------- Variant → plain-language query map ---------------- */

export const VARIANT_QUERY_MAP = {
  rs1801133: { gene: 'MTHFR',    q: 'MTHFR C677T methylation folate' },
  rs1801131: { gene: 'MTHFR',    q: 'MTHFR A1298C methylation homocysteine' },
  rs8192678: { gene: 'PPARGC1A', q: 'PPARGC1A mitochondrial biogenesis exercise' },
  rs12722:   { gene: 'COL5A1',   q: 'COL5A1 tendon collagen injury' },
  rs10830963:{ gene: 'MTNR1B',   q: 'MTNR1B melatonin insulin glucose' },
  rs4253778: { gene: 'PPARA',    q: 'PPARA fat oxidation ketosis' },
  rs1799750: { gene: 'MMP1',     q: 'MMP1 collagen degradation tissue' },
  rs9420907: { gene: 'OBFC1',    q: 'OBFC1 telomere aging' },
  rs12778366:{ gene: 'SIRT1',    q: 'SIRT1 NAD sirtuin longevity' },
  rs1360780: { gene: 'FKBP5',    q: 'FKBP5 cortisol stress HPA' },
  rs174547:  { gene: 'FADS1',    q: 'FADS1 omega-3 EPA DHA conversion' },
  rs1815739: { gene: 'ACTN3',    q: 'ACTN3 muscle fiber endurance power' },
  rs4680:    { gene: 'COMT',     q: 'COMT dopamine stress catabolism' },
}

/* ---------------------- Did You Know curated bank --------------------- */
// Keyed by rsid — hand-written per product spec. Priority-variant
// snippets always beat the dynamic fallback.

const DID_YOU_KNOW_BANK = {
  rs1801133:
    'People with compound heterozygous MTHFR who switch to methylfolate from folic acid report measurable reductions in homocysteine within 8 to 12 weeks in multiple clinical trials.',
  rs1801131:
    'People with compound heterozygous MTHFR who switch to methylfolate from folic acid report measurable reductions in homocysteine within 8 to 12 weeks in multiple clinical trials.',
  rs8192678:
    'Athletes with the PPARGC1A CC variant who train 4 to 5 days per week in Zone 2 show equivalent mitochondrial adaptation to TT carriers who train only 2 to 3 days — it just takes more stimulus.',
  rs12722:
    'A study of 300 recreational runners found COL5A1 TT carriers had a 58 percent higher rate of Achilles tendinopathy — but those who used a collagen and vitamin C pre-exercise protocol had significantly fewer injuries.',
  rs10830963:
    'In MTNR1B GG carriers, eating dinner after 8 PM was associated with a 25 percent higher fasting glucose the following morning compared to eating before 6 PM — in the same individuals on different days.',
  rs4253778:
    'PPARA GG carriers show significantly higher fat oxidation rates during fasting than GG non-carriers — meaning extended fasting is both safer and more metabolically productive for this genotype.',
  rs1360780:
    'Research on FKBP5 CT carriers shows cortisol remains elevated an average of 40 minutes longer after a stressor compared to TT carriers — making post-stress recovery protocols measurably more important.',
  rs174547:
    'FADS1 TT carriers who rely on flaxseed oil as their omega-3 source convert less than 5 percent of ALA to usable EPA — compared to 15 to 20 percent in optimal converters. Direct EPA and DHA sources eliminate this inefficiency entirely.',
  rs12778366:
    'A 48-hour fast in SIRT1 TT carriers produces the same degree of sirtuin pathway activation as daily NMN supplementation for 30 days — making extended fasting one of the highest-value longevity interventions for this genotype.',
}

/* ---------------- Location preference sort (Card 3) ------------------- */
// 0 = Wisconsin, 1 = neighboring, 2 = anywhere in the US,
// 3 = remote / global, 4 = other. Lower is better.

const NEIGHBOR_STATES = new Set(['ILLINOIS', 'MINNESOTA', 'IOWA', 'MICHIGAN'])

function locationRank(locations = []) {
  if (!Array.isArray(locations) || locations.length === 0) return 3
  let best = 4
  for (const l of locations) {
    const state = String(l?.state || '').toUpperCase()
    const country = String(l?.country || '').toUpperCase()
    if (state === 'WISCONSIN') return 0
    if (NEIGHBOR_STATES.has(state)) best = Math.min(best, 1)
    else if (country === 'UNITED STATES' || country === 'USA') best = Math.min(best, 2)
    else best = Math.min(best, 4)
  }
  return best
}

/**
 * Return a short display label for the trial location. Prefers Wisconsin
 * → US city+state → country → "Multiple sites".
 */
export function summarizeTrialLocation(locations = []) {
  if (!locations || !locations.length) return 'Location TBD'
  const wi = locations.find((l) => String(l?.state || '').toUpperCase() === 'WISCONSIN')
  if (wi) return `${wi.city || 'Wisconsin'}, WI`
  const usa = locations.find((l) => {
    const c = String(l?.country || '').toUpperCase()
    return c === 'UNITED STATES' || c === 'USA'
  })
  if (usa) {
    const stateAbbr = usa.state ? String(usa.state).slice(0, 20) : ''
    return usa.city && stateAbbr ? `${usa.city}, ${stateAbbr}` : stateAbbr || usa.city || 'United States'
  }
  return locations[0]?.country || 'Multiple sites'
}

/* ------------------ Top-variants picker ------------------------------- */
// Take up to 5 variants for the digest. Prefer those in the curated
// query map (they'll produce better PubMed matches), then fill from the
// user's report cards in order of appearance.

const CLASS_WEIGHT = { positive: 0, strength: 0, awareness: 0, be_aware: 0, aware: 0, finding: 0, neutral: 2 }

export function pickTopDigestVariants(cards = []) {
  if (!Array.isArray(cards) || !cards.length) return []
  const seen = new Set()
  const inMap = []
  const outOfMap = []
  for (const c of cards) {
    const rsid = String(c?.rsid || '').toLowerCase()
    const gene = String(c?.gene || '').split(/[\s(/·+,]/)[0].toUpperCase()
    if (!rsid && !gene) continue
    const key = rsid || `gene:${gene}`
    if (seen.has(key)) continue
    seen.add(key)
    const wrapped = { rsid, gene, card: c, w: CLASS_WEIGHT[String(c?.classification || '').toLowerCase()] ?? 1 }
    if (VARIANT_QUERY_MAP[rsid]) inMap.push(wrapped)
    else if (gene) outOfMap.push(wrapped)
  }
  inMap.sort((a, b) => a.w - b.w)
  outOfMap.sort((a, b) => a.w - b.w)
  return [...inMap, ...outOfMap].slice(0, 5)
}

/* ---------------------- Weekly deterministic rotation ------------------ */

function isoWeekIndex(date = new Date()) {
  // Simple week counter — days since UNIX epoch / 7, floored.
  const oneDay = 24 * 60 * 60 * 1000
  return Math.floor(date.getTime() / (7 * oneDay))
}

/* ---------------------------- Did You Know ---------------------------- */

function dynamicDidYouKnow(card) {
  const gene = String(card?.gene || '').split(/[\s(/·+,]/)[0] || 'this gene'
  const conf = String(card?.evidence_strength || '').toLowerCase()
  const confPhrase = (conf === 'strong' || conf === 'established')
    ? 'a large body of research'
    : (conf === 'moderate' || conf === 'emerging')
      ? 'a growing body of research'
      : 'early research'
  const bit = card?.classification_text || card?.summary || card?.plain || ''
  if (bit && bit.length > 20) {
    return `${confPhrase} in ${gene} suggests: ${bit.trim().replace(/[.!?]?$/, '')}. What you do with that biology day-to-day is often more important than the variant itself.`
  }
  return `${confPhrase} on the ${gene} gene points to variation in its pathway — but lifestyle, other genes, and biomarkers usually matter more than any single variant.`
}

export function pickDidYouKnow(digestVariants, weekIndex) {
  if (!Array.isArray(digestVariants) || !digestVariants.length) {
    return null
  }
  // Deterministic weekly rotation: pick which variant's snippet we show
  // this week. Curated snippets always win over dynamic ones on any
  // given week — but the choice of variant rotates.
  const curatedFirst = [...digestVariants].sort((a, b) => {
    const ac = DID_YOU_KNOW_BANK[a.rsid] ? 0 : 1
    const bc = DID_YOU_KNOW_BANK[b.rsid] ? 0 : 1
    return ac - bc
  })
  const idx = ((weekIndex % curatedFirst.length) + curatedFirst.length) % curatedFirst.length
  const pick = curatedFirst[idx]
  const snippet = DID_YOU_KNOW_BANK[pick.rsid] || dynamicDidYouKnow(pick.card)
  const query = VARIANT_QUERY_MAP[pick.rsid]?.q || pick.gene || ''
  return {
    text: snippet,
    variantLabel: pick.gene || (pick.rsid ? pick.rsid.toUpperCase() : 'Your genome'),
    rsid: pick.rsid,
    query,
    isCurated: !!DID_YOU_KNOW_BANK[pick.rsid],
  }
}

/* ---------------------------- Card 1 fetcher -------------------------- */

async function fetchPubmedForVariant(variant, days) {
  const info = VARIANT_QUERY_MAP[variant.rsid]
  const params = new URLSearchParams()
  if (info?.q) params.set('q', info.q)
  else if (variant.gene) params.set('gene', variant.gene)
  else return []
  params.set('limit', '3')
  if (days > 0) params.set('days', String(days))
  try {
    const r = await fetch(`/api/pubmed-search?${params.toString()}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null)
    return Array.isArray(j?.results) ? j.results : []
  } catch { return [] }
}

export async function fetchWeeklyPaper(digestVariants) {
  if (!digestVariants.length) return null
  // Tier 1: last 7 days across all top variants, pick the newest.
  // Tier 2: last 30 days.
  // Tier 3: no window — the most recently published paper for the top variant.
  for (const days of [7, 30, 0]) {
    const buckets = await Promise.all(digestVariants.map((v) => fetchPubmedForVariant(v, days)))
    const flat = []
    buckets.forEach((rows, i) => {
      const v = digestVariants[i]
      rows.forEach((row) => flat.push({ ...row, matchedGene: v.gene, matchedRsid: v.rsid }))
    })
    if (flat.length) {
      flat.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
      return flat[0]
    }
  }
  return null
}

/* ---------------------------- Card 3 fetcher -------------------------- */

async function fetchTrialsForGene(gene) {
  if (!gene) return []
  try {
    const r = await fetch(`/api/clinical-trials/gene?gene=${encodeURIComponent(gene)}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null)
    return Array.isArray(j?.top) ? j.top.map((t) => ({ ...t, gene })) : []
  } catch { return [] }
}

const RECRUITING = new Set(['RECRUITING', 'NOT_YET_RECRUITING', 'ENROLLING_BY_INVITATION'])

export async function fetchWeeklyTrial(digestVariants) {
  if (!digestVariants.length) return null
  const uniqueGenes = [...new Set(digestVariants.map((v) => v.gene).filter(Boolean))]
  const buckets = await Promise.all(uniqueGenes.map((g) => fetchTrialsForGene(g)))
  const flat = buckets.flat().filter((t) => RECRUITING.has(String(t.status || '').toUpperCase()))
  if (!flat.length) return null
  // Rank by location preference then recency.
  flat.sort((a, b) => {
    const ra = locationRank(a.locations)
    const rb = locationRank(b.locations)
    if (ra !== rb) return ra - rb
    return (b.year || 0) - (a.year || 0)
  })
  return flat[0]
}

/* ---------------------------- Cache helpers --------------------------- */

const LS_LAST = 'ss_digest_last_refreshed'
const LS_CACHE = 'ss_digest_cache'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function readDigestCache() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LS_CACHE)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function writeDigestCache(payload) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_CACHE, JSON.stringify(payload))
    window.localStorage.setItem(LS_LAST, new Date().toISOString())
  } catch { /* quota / disabled */ }
}

export function digestIsFresh() {
  if (typeof window === 'undefined') return false
  const iso = window.localStorage.getItem(LS_LAST)
  if (!iso) return false
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return false
  return Date.now() - t < WEEK_MS
}

export function currentWeekIndex() {
  return isoWeekIndex()
}
