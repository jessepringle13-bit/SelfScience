// /app/lib/genomeAIGenerator.js
// SelfScience Step 2 — AI plain-language card generator.
//
// This module is dual-mode:
//   • Client-side  (browser)  — call `generateGenomeReport(classified)`.
//                               Uses `fetch('/api/genome/generate')` under the
//                               hood so server-only env keys stay private.
//   • Server-side (route.js)  — call `generateGenomeReportServer(classified,
//                               callProviderFn)`. Lets the API route inject
//                               its own provider adapter (Together AI,
//                               OpenRouter, etc.), avoiding a self-fetch.
//
// INVARIANT: The AI never changes a badge. Step 1 classifications pass
// through unchanged. If the AI returns garbage or skips a variant, we still
// emit a valid GenomeCard using the Step 1 fields as a fallback.

/** Map Step 1 classification → user-facing badge label */
function getBadgeLabel(classification) {
  if (classification === 'positive')  return 'Benefit'
  if (classification === 'awareness') return 'Consider'
  return 'Neutral'
}

/**
 * Build the strict {system, user, variantsToShow, variantSummaries} payload
 * fed to whichever LLM caller is chosen (client fetch or server-injected).
 * Extracted so the same prompt is used by both browser and server callers.
 */
export function buildGenomePrompt(classified) {
  const variantsToShow = classified.variants.filter((v) =>
    v.classification === 'positive' ||
    v.classification === 'awareness' ||
    (v.classification === 'neutral' && (v.classification_text || '').length > 20)
  )

  const variantSummaries = variantsToShow.map((v) => ({
    rsid: v.rsid,
    gene: v.gene,
    trait: v.trait,
    pillar: v.pillar,
    genotype: v.genotype,
    classification: v.classification,
    classification_text: v.classification_text,
    is_haplotype: v.is_haplotype,
    haplotype_name: v.haplotype_name,
  }))

  const system = `You are the SelfScience genome insight writer.

Your job is to write plain language card content for genetic variant results.

CRITICAL RULES:
1. You receive a classification for each variant. This is FINAL. Do not change it.
   classification "positive" = a benefit for this user
   classification "awareness" = something to understand and potentially act on
   classification "neutral" = no strong directional signal
2. Write for a general audience — no jargon without explanation
3. Every card body must be 2-3 sentences maximum
4. Never use the words: diagnose, disease, disorder, risk, cure, treat, medical
5. Use instead: "research associates", "population studies show", "in research populations"
6. Never make absolute claims — always use research framing
7. The card_title must be 6 words or fewer, plain language
8. what_this_means must be one sentence, practical, actionable
9. search_queries must be real PubMed-style queries that will return relevant papers

PLATFORM CONTEXT:
SelfScience is an educational research platform. All content is for educational
insight only, not medical advice. Users are health-curious adults who want to
understand their genetics in the context of published research.

EDUCATIONAL DISCLAIMER ALWAYS APPLIES:
Every insight describes research associations, not personal health predictions.
Genetics describes tendencies in populations, not certainties for individuals.`

  const user = `Generate plain language card content for these ${variantSummaries.length} classified genetic variants.

Return a JSON array. Each object must have these exact fields:
- rsid: string (copy from input)
- card_title: string (6 words max, plain language)
- card_body: string (2-3 sentences, research-framed)
- what_this_means: string (one sentence practical takeaway)
- search_queries: string[] (2-3 PubMed search queries)

DO NOT include classification in your output — it is already set.
DO NOT change any classification.
DO use the classification_text as your primary source of truth for what to write.

VARIANTS TO PROCESS:
${JSON.stringify(variantSummaries, null, 2)}`

  return { system, user, variantSummaries, variantsToShow }
}

/**
 * Parse the AI response text into an array of card objects. Forgiving of stray
 * preambles / trailing junk — we grab the first JSON array in the string.
 */
export function parseGenomeAiResponse(content) {
  try {
    const match = String(content || '').match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0])
  } catch (err) {
    console.warn('[genomeAIGenerator] failed to parse AI response:', err?.message)
    return []
  }
}

/**
 * Merge AI text with Step 1 classifications to build final GenomeCards.
 * Step 1 wins on `classification` + `badge_label`; AI wins on titles/bodies
 * with safe fallbacks when the AI dropped a variant.
 */
export function mergeAiCardsWithStep1(variantsToShow, aiCards) {
  const byRsid = new Map((aiCards || []).map((c) => [c.rsid, c]))
  return variantsToShow.map((v) => {
    const ai = byRsid.get(v.rsid)
    return {
      rsid: v.rsid,
      gene: v.gene,
      trait: v.trait,
      pillar: v.pillar,
      genotype: v.genotype,
      // FROM STEP 1 — NEVER OVERRIDDEN
      classification: v.classification,
      badge_label: getBadgeLabel(v.classification),
      // From AI when available; safe fallbacks otherwise
      card_title:      ai?.card_title      || v.trait,
      card_body:       ai?.card_body       || v.classification_text || '',
      what_this_means: ai?.what_this_means || '',
      search_queries:  Array.isArray(ai?.search_queries) && ai.search_queries.length
        ? ai.search_queries.slice(0, 3)
        : [ `${v.gene} ${v.trait}`, `${v.gene} ${v.pillar} research` ],
      is_haplotype:   v.is_haplotype,
      haplotype_name: v.haplotype_name,
    }
  })
}

/**
 * Client-side entrypoint. Calls the dedicated /api/genome/generate endpoint
 * so provider keys stay server-only.
 */
export async function generateGenomeReport(classified) {
  const { system, user, variantsToShow, variantSummaries } = buildGenomePrompt(classified)

  const response = await fetch('/api/genome/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, variant_count: variantSummaries.length }),
  })
  if (!response.ok) throw new Error(`Genome generation failed: ${response.status}`)
  const { content, source } = await response.json()

  const aiCards = parseGenomeAiResponse(content)
  const cards = mergeAiCardsWithStep1(variantsToShow, aiCards)

  return {
    cards,
    pillar_summary: classified.pillar_summary,
    variant_count: classified.variant_count,
    classified_count: classified.classified_count,
    ai_source: source,
  }
}

/**
 * Server-side entrypoint. Same output shape as `generateGenomeReport` but
 * accepts a provider callable `callProvider({system, user, variant_count})`
 * that returns `{ content, source }`. Lets an API route reuse the exact
 * Step 2 pipeline without an internal HTTP round-trip.
 */
export async function generateGenomeReportServer(classified, callProvider) {
  const { system, user, variantsToShow, variantSummaries } = buildGenomePrompt(classified)
  let content = ''
  let source = 'unavailable'
  try {
    const out = await callProvider({ system, user, variant_count: variantSummaries.length })
    content = out?.content || ''
    source  = out?.source  || 'unknown'
  } catch (err) {
    console.warn('[genomeAIGenerator] server callProvider threw:', err?.message)
  }
  const aiCards = parseGenomeAiResponse(content)
  const cards = mergeAiCardsWithStep1(variantsToShow, aiCards)
  return {
    cards,
    pillar_summary: classified.pillar_summary,
    variant_count: classified.variant_count,
    classified_count: classified.classified_count,
    ai_source: source,
  }
}

/** Convenience: build a PubMed URL from a search query string. */
export function pubmedUrlFor(query) {
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query || '')}`
}

/**
 * Adapter — map a Step-2 GenomeReport into the legacy UI response shape used
 * by /app/app/genome/genome-client.jsx today (overview.strengths /
 * overview.areasToExplore / fullReport / researchRoadmap). Lets us ship the
 * two-step architecture without rewriting the tab components.
 */
export function adaptReportToLegacyShape(report, classified) {
  const cards = report.cards || []

  // ---- overview: strengths (positive) vs areasToExplore (awareness+neutral) ----
  const toOverviewCard = (c) => ({
    name: c.card_title || c.trait || c.gene,
    plain: c.card_body || '',
    what_this_means: c.what_this_means || '',
    pillar: c.pillar,
    rsid: c.rsid,
    gene: c.gene,
    genotype: c.genotype,
    // Map Step 2 classification → legacy string values consumed by the UI
    classification:
      c.classification === 'positive'  ? 'Strength'
      : c.classification === 'awareness' ? 'Awareness'
      : 'Neutral',
    // Provide the pre-computed PubMed search queries (used by "Explore research")
    searches: (c.search_queries || []).slice(0, 3),
  })
  const overviewCards = cards.map(toOverviewCard)
  const overview = {
    strengths:      overviewCards.filter((c) => c.classification === 'Strength'),
    areasToExplore: overviewCards.filter((c) => c.classification !== 'Strength'),
    systemView:
      'Genetics is not destiny. Every card shows a research association — not a personal prediction. Explore the studies to learn more.',
  }

  // ---- fullReport: cards grouped by pillar ----
  const byPillar = new Map()
  for (const c of cards) {
    const p = c.pillar || 'General'
    if (!byPillar.has(p)) byPillar.set(p, [])
    byPillar.get(p).push({
      gene: c.gene,
      rsid: c.rsid,
      genotype: c.genotype,
      classification:
        c.classification === 'positive'  ? 'Strength'
        : c.classification === 'awareness' ? 'Awareness'
        : 'Neutral',
      explanation: c.card_body,
      what_this_means: c.what_this_means,
      landmarkStudy: '', // Step 2 doesn't emit landmark studies today — leave blank for the UI to hide
      searches: (c.search_queries || []).slice(0, 3),
    })
  }
  const fullReport = Array.from(byPillar.entries()).map(([pillar, variants]) => ({ pillar, variants }))

  // ---- researchRoadmap: 1 row per pillar with all its searches merged ----
  const pillarPriority = Array.from(byPillar.keys()).sort()
  const researchRoadmap = pillarPriority.map((pillar, i) => {
    const summary = report.pillar_summary?.[pillar] || { total: byPillar.get(pillar)?.length || 0 }
    const searches = [...new Set(
      (byPillar.get(pillar) || []).flatMap((v) => v.searches || [])
    )].slice(0, 8)
    return {
      priority: i + 1,
      pillar,
      why: `You have ${summary.total || 0} recognized variant${(summary.total || 0) === 1 ? '' : 's'} in ${pillar}.`,
      searches,
    }
  })

  return {
    session_id: Math.random().toString(36).slice(2, 10),
    variants_recognized: (classified?.variants || []).map((v) => ({
      rsid: v.rsid,
      gene: v.gene,
      variant_name: v.trait,
      genotype_called: v.genotype,
      pillar: v.pillar,
      classification:
        v.classification === 'positive'  ? 'Strength'
        : v.classification === 'awareness' ? 'Awareness'
        : 'Neutral',
    })),
    overview,
    fullReport,
    researchRoadmap,
    step1: {
      variant_count: report.variant_count,
      classified_count: report.classified_count,
      pillar_summary: report.pillar_summary,
    },
    aiProvider: report.ai_source || 'unavailable',
    aiModel: '',
    privacy_confirmation: {
      data_received: 'Variant calls only',
      data_retained: false,
      session_ends: 'Data cleared on session close',
      file_processed: 'Client-side only',
    },
    disclaimer: {
      user_facing: 'This report is for educational purposes only. Not a medical diagnosis.',
      display: 'always_visible',
    },
  }
}
