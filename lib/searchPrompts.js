'use client'

// /app/lib/searchPrompts.js
// "You might be wondering..." pre-built search prompts for the Search
// page empty state. Two-tier:
//
//   1. CURATED — 15 priority rsIDs get hand-written question + query.
//   2. DYNAMIC — every other variant assembles a question using its
//      gene, pillar, and plain-language trait description.
//
// Selection & rotation rules (per product spec):
//   • Top 3 slots go to awareness findings (in order of report appearance)
//   • Remaining 2 slots go to strength findings
//   • Deprioritize rsIDs already tracked in ss_clicked_prompts
//   • Fully client-side / privacy-safe; nothing hits a server.

import { flattenReportCards } from '@/lib/supplementProtocol'

/* ---------------------- Curated question map -------------------------- */

const CURATED_PROMPTS = {
  rs1801133: {
    question: 'Why do I need methylfolate instead of folic acid?',
    query: 'MTHFR C677T methylfolate folic acid methylation',
  },
  rs1801131: {
    question: 'How does MTHFR affect my homocysteine levels?',
    query: 'MTHFR A1298C homocysteine methylation B vitamins',
  },
  rs8192678: {
    question: 'What does PPARGC1A mean for my workouts?',
    query: 'PPARGC1A mitochondrial biogenesis aerobic exercise adaptation',
  },
  rs12722: {
    question: 'Should people with COL5A1 TT do collagen loading before exercise?',
    query: 'COL5A1 collagen tendon injury prevention exercise',
  },
  rs10830963: {
    question: 'How does MTNR1B affect my blood sugar?',
    query: 'MTNR1B melatonin insulin secretion fasting glucose',
  },
  rs4253778: {
    question: 'Why does fasted training work better for my metabolism?',
    query: 'PPARA fat oxidation fasted exercise ketosis metabolism',
  },
  rs1799750: {
    question: 'What does faster collagen breakdown mean for my recovery?',
    query: 'MMP1 collagen degradation recovery tissue repair',
  },
  rs9420907: {
    question: 'What can I do to protect my telomere length?',
    query: 'OBFC1 telomere length aging lifestyle intervention',
  },
  rs12778366: {
    question: 'How do I activate my sirtuin pathways without the genetic advantage?',
    query: 'SIRT1 sirtuin activation NAD fasting longevity',
  },
  rs1360780: {
    question: 'Why does stress affect me more and linger longer?',
    query: 'FKBP5 cortisol clearance HPA axis stress response',
  },
  rs174547: {
    question: 'Why should I get omega-3 from fish instead of flaxseed?',
    query: 'FADS1 omega-3 ALA EPA DHA conversion efficiency',
  },
  rs1815739: {
    question: 'What does my ACTN3 variant mean for endurance vs power sports?',
    query: 'ACTN3 R577X muscle fiber type endurance power performance',
  },
  rs4680: {
    question: 'How does my COMT variant affect my stress response and focus?',
    query: 'COMT Val158Met dopamine catabolism stress cognition',
  },
  rs4149056: {
    question: 'Why is my statin transport variant important to tell my doctor?',
    query: 'SLCO1B1 statin myopathy muscle toxicity pharmacogenomics',
  },
  rs3918290: {
    question: 'What medications are affected by my DPD enzyme variant?',
    query: 'DPYD dihydropyrimidine dehydrogenase fluorouracil chemotherapy toxicity',
  },
}

/* --------------------------- Generic fallbacks ------------------------ */

const GENERIC_PROMPTS = [
  {
    id: 'generic:nutrigenomics',
    question: 'What is nutrigenomics and how does it apply to me?',
    query: 'nutrigenomics diet gene interaction personalized nutrition',
  },
  {
    id: 'generic:pgx',
    question: 'How do genes affect how medications work in my body?',
    query: 'pharmacogenomics drug metabolism CYP genetic variation',
  },
  {
    id: 'generic:classifications',
    question: 'What is the difference between a strength and an awareness finding?',
    query: 'genome variant classification strength awareness interpretation',
  },
  {
    id: 'generic:consumer-dna',
    question: 'How reliable is consumer DNA data for health insights?',
    query: 'consumer DNA test 23andMe accuracy reliability clinical validation',
  },
  {
    id: 'generic:blood-tests',
    question: 'What blood tests should I ask my doctor about?',
    query: 'genetic variants biomarker blood test screening health',
  },
]

/* ---------------------- Dynamic-fallback builder ---------------------- */

function classificationBucket(c) {
  const s = String(c || '').toLowerCase()
  if (s === 'positive' || s === 'strength') return 'strength'
  if (s === 'awareness' || s === 'be_aware' || s === 'aware' || s === 'finding') return 'awareness'
  return 'neutral'
}

function buildDynamicPrompt(card) {
  const gene = String(card?.gene || '').split(/[\s(/·+,]/)[0] || null
  const pillar = String(card?.pillar || '').trim()
  const trait = String(card?.trait || '').trim()
  const desc  = String(card?.classification_text || card?.summary || card?.plain || card?.description || '').trim()
  if (!gene && !card?.rsid) return null
  const label = gene || (card?.rsid || 'this gene')
  const pillarPhrase = pillar ? pillar.toLowerCase() : 'day-to-day health'
  const question = `What does ${label} mean for my ${pillarPhrase} health?`
  // Query: gene + trait (or first few words of the description) — this
  // produces a well-scoped search on PubMed and Semantic Scholar.
  let queryTail = trait
  if (!queryTail && desc) queryTail = desc.split(/[.!?]/)[0].split(/\s+/).slice(0, 6).join(' ')
  const query = [label, queryTail].filter(Boolean).join(' ') || label
  return { question, query }
}

/* -------------------- Clicked-prompt localStorage --------------------- */

const LS_CLICKED = 'ss_clicked_prompts'

export function getClickedPromptIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_CLICKED)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function writeClickedPromptIds(arr) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_CLICKED, JSON.stringify(arr.slice(-50))) } catch {}
}

export function markPromptClicked(id) {
  if (!id) return
  const cur = getClickedPromptIds()
  if (cur.includes(id)) return
  cur.push(id)
  writeClickedPromptIds(cur)
}

export function resetClickedPrompts() {
  writeClickedPromptIds([])
}

/* -------------- Deterministic per-session shuffle helper -------------- */
// Fisher-Yates using a lightweight seeded RNG so identical inputs give a
// stable ordering across the same session but rotate each time the user
// loads the page (seed derives from Date.now bucketed to 15-min windows).

function seededShuffle(arr, seed) {
  const a = [...arr]
  let s = seed >>> 0
  const rand = () => {
    // xorshift32
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17; s >>>= 0
    s ^= s << 5;  s >>>= 0
    return (s & 0xffffffff) / 0x100000000
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sessionSeed() {
  // 15-minute buckets — rotates across visits without changing during a
  // single page interaction.
  return Math.floor(Date.now() / (15 * 60 * 1000))
}

/* ---------------- Convert a card → prompt entry ----------------------- */

function cardToPrompt(card) {
  const rsid = String(card?.rsid || '').toLowerCase()
  const curated = CURATED_PROMPTS[rsid]
  if (curated) {
    return {
      id: rsid,
      question: curated.question,
      query: curated.query,
      rsid,
      gene: String(card?.gene || '').split(/[\s(/·+,]/)[0] || '',
      isCurated: true,
    }
  }
  const dyn = buildDynamicPrompt(card || {})
  if (!dyn) return null
  return {
    id: rsid || `gene:${String(card?.gene || '').toUpperCase()}`,
    question: dyn.question,
    query: dyn.query,
    rsid,
    gene: String(card?.gene || '').split(/[\s(/·+,]/)[0] || '',
    isCurated: false,
  }
}

/* -------------------------- Public selector --------------------------- */

/**
 * Return the 5 prompts to render, in display order.
 *
 * Priority:
 *   1) Top 3 awareness findings (deduped, in report order)
 *   2) Fill remaining slots with strength findings
 *   3) If still < 5, top up with fallback generic prompts
 *
 * Within each slot pool, prompts NOT yet in ss_clicked_prompts win over
 * prompts that have been clicked, with a stable per-session shuffle so
 * the 5 change gently across visits.
 */
export function selectSearchPrompts(genomeReport) {
  const cards = genomeReport ? flattenReportCards(genomeReport) : []
  const awareness = []
  const strengths = []
  const seenIds = new Set()

  for (const c of cards) {
    const p = cardToPrompt(c)
    if (!p) continue
    if (seenIds.has(p.id)) continue
    seenIds.add(p.id)
    const bucket = classificationBucket(c?.classification)
    if (bucket === 'awareness' && awareness.length < 8) awareness.push(p)
    else if (bucket === 'strength' && strengths.length < 8) strengths.push(p)
  }

  const clicked = new Set(getClickedPromptIds())
  const seed = sessionSeed()

  // Helper: split a pool into unclicked-first, click-later; shuffle each half.
  const orderPool = (pool, s) => {
    const un = pool.filter((p) => !clicked.has(p.id))
    const cl = pool.filter((p) => clicked.has(p.id))
    return [...seededShuffle(un, s), ...seededShuffle(cl, s + 1)]
  }

  const orderedAwareness = orderPool(awareness, seed)
  const orderedStrengths = orderPool(strengths, seed + 100)

  const out = []
  const push = (p) => {
    if (!p) return
    if (out.some((o) => o.id === p.id)) return
    out.push(p)
  }
  // Slots 1–3: awareness
  for (let i = 0; i < 3 && i < orderedAwareness.length; i++) push(orderedAwareness[i])
  // Slots 4–5: strengths, then more awareness if needed
  for (let i = 0; out.length < 5 && i < orderedStrengths.length; i++) push(orderedStrengths[i])
  for (let i = 3; out.length < 5 && i < orderedAwareness.length; i++) push(orderedAwareness[i])

  // Fill any remaining slots with generic prompts (also rotated).
  if (out.length < 5) {
    const genericOrdered = orderPool(GENERIC_PROMPTS, seed + 200)
    for (let i = 0; out.length < 5 && i < genericOrdered.length; i++) push(genericOrdered[i])
  }

  return out.slice(0, 5)
}

/**
 * When no genome has been loaded yet — always return the 5 generic
 * fallback prompts in a rotated order (spec §"If fewer than 5 variants...").
 */
export function selectGenericPrompts() {
  const clicked = new Set(getClickedPromptIds())
  const un = GENERIC_PROMPTS.filter((p) => !clicked.has(p.id))
  const cl = GENERIC_PROMPTS.filter((p) => clicked.has(p.id))
  const s = sessionSeed()
  const ordered = [...seededShuffle(un, s), ...seededShuffle(cl, s + 1)]
  // Auto-reset when the user has clicked every generic prompt so they
  // start seeing them again (spec: "Once all questions have been clicked,
  // reset the array and start fresh").
  if (un.length === 0) {
    resetClickedPrompts()
  }
  return ordered.slice(0, 5)
}
