// /app/lib/genomeAIGenerator.js
// SelfScience Step 2 — AI plain-language card generator.
//
// This module runs on the client (as the user requested — pure server calls
// isolate Together AI credentials). It:
//   1. Takes a ClassifiedGenome from Step 1 (see genomeClassifier.js).
//   2. Builds a strict system + user prompt.
//   3. POSTs to our dedicated /api/genome/generate endpoint.
//   4. Merges the AI-written text with Step 1's authoritative classifications.
//
// INVARIANT: The AI never changes a badge. `classification` is passed through
// unchanged. If the AI returns garbage or skips a variant, we still emit a
// valid GenomeCard using the Step 1 fields as a fallback.

/** Map Step 1 classification → user-facing badge label */
function getBadgeLabel(classification) {
  if (classification === 'positive')  return 'Benefit'
  if (classification === 'awareness') return 'Consider'
  return 'Neutral'
}

/**
 * Generate plain-language cards for every classified variant worth showing.
 * ONE batched API call — minimizes cost and latency.
 *
 * @param {import('./genomeClassifier').ClassifiedGenome} classified
 * @returns {Promise<{cards: object[], pillar_summary: object, variant_count: number, classified_count: number, ai_source?: string}>}
 */
export async function generateGenomeReport(classified) {
  // Skip pure-neutral variants with placeholder text; keep positive/awareness
  // and any neutral that has meaningful description.
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
    classification: v.classification,          // DO NOT CHANGE — passed only for context
    classification_text: v.classification_text, // Source of truth for the AI's writing
    is_haplotype: v.is_haplotype,
    haplotype_name: v.haplotype_name,
  }))

  const systemPrompt = `You are the SelfScience genome insight writer.

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

  const userPrompt = `Generate plain language card content for these ${variantSummaries.length} classified genetic variants.

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

  // Call the server-side endpoint (keys never touch the browser).
  const response = await fetch('/api/genome/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: systemPrompt,
      user: userPrompt,
      variant_count: variantSummaries.length,
    }),
  })
  if (!response.ok) throw new Error(`Genome generation failed: ${response.status}`)
  const { content, source } = await response.json()

  // Parse the AI's JSON array. Be forgiving: extract the first JSON array
  // found in the response so we tolerate stray reasoning-model preambles.
  let aiCards = []
  try {
    const match = String(content || '').match(/\[[\s\S]*\]/)
    if (match) aiCards = JSON.parse(match[0])
  } catch (err) {
    console.warn('[genomeAIGenerator] failed to parse AI response:', err?.message)
  }
  const byRsid = new Map(aiCards.map((c) => [c.rsid, c]))

  // Merge — Step 1 wins on classification/badge; AI wins on text (with fallback).
  const cards = variantsToShow.map((v) => {
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

  return {
    cards,
    pillar_summary: classified.pillar_summary,
    variant_count: classified.variant_count,
    classified_count: classified.classified_count,
    ai_source: source, // 'together_ai' | 'openrouter_fallback'
  }
}

/** Convenience: build a PubMed URL from a search query string. */
export function pubmedUrlFor(query) {
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query || '')}`
}
