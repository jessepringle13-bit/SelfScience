// /app/lib/ai/coachGrounding.js
//
// Lightweight grounding helper for the AI Coach. Takes the user's
// latest message + a slim context payload (already client-assembled)
// and returns:
//   * `groundedFacts`  — curated facts pulled from platform catalogs
//                        (variant classifications, gene descriptions,
//                        supplement stack summaries).
//   * `entities`       — what the coach detected (rsIDs, gene symbols,
//                        pillar keywords) — used to render citation
//                        chips in the UI.
//   * `citations`      — { rsid | pmid | url }[] ready to render.
//
// Grounding is intentionally cheap: keyword matching against catalogs
// already loaded server-side, no extra LLM call. Cheaper + more
// reliable than a full RAG stack for the v1 launch.

import { VARIANT_CATALOG } from '@/lib/variant-catalog'
import { getEvidenceStrength } from '@/lib/evidenceStrength'

// Well-known gene aliases the coach should recognise even if the
// user doesn't type the exact rsid.
const GENE_ALIASES = {
  MTHFR:   ['methylenetetrahydrofolate', 'folate'],
  APOE:    ['alzheimer', 'lipid'],
  CYP1A2:  ['caffeine'],
  ALDH2:   ['alcohol', 'flush'],
  COMT:    ['dopamine', 'stress', 'catechol'],
  ACTN3:   ['sprint', 'muscle', 'athletic'],
  FTO:     ['obesity', 'weight'],
  BDNF:    ['depression', 'memory', 'neurotroph'],
  VDR:     ['vitamin d'],
  ACE:     ['endurance', 'blood pressure'],
}

// Build a set of all known gene symbols from the RSID-keyed catalog so
// we can detect "MTHFR", "APOE", etc. without hardcoding.
const KNOWN_GENES = (() => {
  const s = new Set()
  try {
    for (const entry of Object.values(VARIANT_CATALOG || {})) {
      if (entry?.gene) s.add(String(entry.gene).toUpperCase())
    }
  } catch {}
  Object.keys(GENE_ALIASES).forEach((g) => s.add(g))
  return s
})()

// Map: gene symbol -> array of { rsid, ...entry } so we can surface
// curated descriptions + evidence tier when a user asks about a gene.
const GENE_TO_RSIDS = (() => {
  const m = new Map()
  try {
    for (const [rsid, entry] of Object.entries(VARIANT_CATALOG || {})) {
      const g = (entry?.gene || '').toUpperCase()
      if (!g) continue
      if (!m.has(g)) m.set(g, [])
      m.get(g).push({ rsid, ...entry })
    }
  } catch {}
  return m
})()

function cleanText(s) { return String(s || '').toLowerCase() }

/**
 * Detect any variant IDs, gene symbols, or well-known aliases mentioned
 * in `text`. Returns a de-duplicated array of gene symbols.
 */
export function detectGenes(text) {
  const t = cleanText(text)
  const hits = new Set()
  // Direct gene-symbol match (uppercase word 2-8 chars).
  const symMatches = String(text || '').match(/\b[A-Z]{2,8}\d?[A-Z]?\b/g) || []
  symMatches.forEach((s) => { if (KNOWN_GENES.has(s)) hits.add(s) })
  // Alias match.
  for (const gene of Object.keys(GENE_ALIASES)) {
    for (const alias of GENE_ALIASES[gene]) {
      if (t.includes(alias)) { hits.add(gene); break }
    }
  }
  // rsID match — map back to gene via catalog.
  const rsMatches = t.match(/rs\d{2,}/g) || []
  for (const rs of rsMatches) {
    const entry = VARIANT_CATALOG[rs]
    if (entry?.gene) hits.add(String(entry.gene).toUpperCase())
  }
  return Array.from(hits).slice(0, 6)
}

/**
 * Build a ground-truth block for the LLM prompt from detected genes +
 * the client-supplied context (active pillar, variant IDs, supplement
 * names, biomarker flags). Kept short so the LLM re-phrases rather than
 * dumps.
 */
export function buildGroundingBlock({ userText, context }) {
  const ctx = context || {}
  const detected = detectGenes([userText, ctx.activePillar, (ctx.userVariants || []).map((v) => v?.gene).join(' ')].filter(Boolean).join(' '))

  const facts = []
  const citations = []

  // 1) Grounded facts about detected genes.
  for (const gene of detected) {
    const rsEntries = GENE_TO_RSIDS.get(gene) || []
    const firstEntry = rsEntries[0]
    if (firstEntry) {
      const desc = firstEntry.description || firstEntry.summary || ''
      if (desc) facts.push(`• ${gene} — ${desc.slice(0, 300)}`)
      citations.push({ rsid: firstEntry.rsid, gene })
      if (rsEntries[1]?.description) {
        facts.push(`  Additional variant — ${rsEntries[1].description.slice(0, 200)}`)
        citations.push({ rsid: rsEntries[1].rsid, gene })
      }
    } else if (GENE_ALIASES[gene]) {
      facts.push(`• ${gene} — well-known gene relevant to: ${GENE_ALIASES[gene].join(', ')}.`)
    }
    try {
      const ev = getEvidenceStrength?.(gene, firstEntry?.rsid)
      if (ev?.tier) facts.push(`  Evidence tier for ${gene}: ${ev.tier}${ev.summary ? ' — ' + String(ev.summary).slice(0, 200) : ''}`)
    } catch {}
  }

  // 2) User's own variants (from the client-supplied context).
  const uv = Array.isArray(ctx.userVariants) ? ctx.userVariants.slice(0, 5) : []
  if (uv.length) {
    facts.push('User’s own variants in scope for this question:')
    for (const v of uv) {
      const gene = v?.gene || v?.geneSymbol
      const rs   = v?.rsid || ''
      const cls  = v?.classification || v?.class || ''
      if (gene || rs) {
        facts.push(`  · ${gene || 'gene?'}${rs ? ' (' + rs + ')' : ''}${cls ? ' — classified as ' + cls : ''}`)
      }
    }
  }

  // 3) Supplement stack (names only).
  const supps = Array.isArray(ctx.supplements) ? ctx.supplements.slice(0, 10) : []
  if (supps.length) {
    facts.push(`Current supplement stack (names only): ${supps.map((s) => s?.name || s).filter(Boolean).join(', ')}.`)
  }

  // 4) Biomarker flags (marker name + genome-cross-reference flag).
  const bio = Array.isArray(ctx.biomarkerFlags) ? ctx.biomarkerFlags.slice(0, 8) : []
  if (bio.length) {
    facts.push('Biomarker flags:')
    for (const b of bio) facts.push(`  · ${b?.name || b?.marker || 'marker'}${b?.status ? ' — ' + b.status : ''}`)
  }

  return {
    detectedGenes: detected,
    factsBlock: facts.join('\n'),
    citations,
  }
}

/**
 * Master system prompt for the AI Coach. Bakes in the platform's tone
 * rules: never "take this," no numeric risk %, always frame findings as
 * "the current research suggests" or the user’s Strength/Awareness
 * classification. Ends every gene/supplement/drug answer with the
 * standard disclaimer.
 */
export function coachSystemPrompt({ groundedFacts, activePillar, isPersonalized }) {
  return `You are the SelfScience AI Coach — a friendly, plainspoken research assistant for a privacy-first health-research platform.

HARD RULES (must never be broken):
1. NEVER prescribe. Do not say "take X," "start Y," "stop Z," or any imperative dose/treatment advice.
2. NEVER state a numeric personal risk ("you have X% risk of Y"). If asked, redirect to the user’s variant classification (Strength / Awareness / Neutral) or general research findings.
3. NEVER invent a specific study, PMID, effect size, or citation. Only reference studies present in the GROUND TRUTH block below.
4. Always frame findings as: "the current research suggests…", "your variant is classified as [Strength/Awareness/Neutral], meaning…", or "studies indicate…". Not as personal medical advice.
5. If the user asks about a specific gene, drug, supplement, or biomarker present in GROUND TRUTH, use those facts verbatim rather than your own training data.
6. If you don’t have grounded info to answer, say so and suggest a better place to look (e.g. "open Search and query 'gene name + phenotype'").
7. End any answer that touches medications, supplements, or biomarkers with: "Educational only — not medical advice. Talk to your practitioner before changing your regimen."
8. Keep answers concise: 2–5 short paragraphs, or a short bulleted list when comparing options.

CONTEXT:
• Active pillar: ${activePillar || 'not specified'}
• Personalized: ${isPersonalized ? 'YES — user has uploaded genome / biomarker data' : 'NO — general research-literacy mode; do not invent personal findings'}

GROUND TRUTH (curated facts you must use verbatim when relevant):
${groundedFacts || '(no personal data in scope for this question)'}

Write in warm, calm prose. Avoid alarmism. Avoid hype. Never assume the user is unwell.`
}
