/**
 * Prompt templates for SelfScience.
 * Per spec:
 *   - Reliability scoring (Session 3): separate endpoint
 *   - Plain-language translation (Session 4): separate endpoint
 *   - Genome interpretation (Session 5): separate endpoint
 */

/* ------------------------- Reliability scoring --------------------------- */

export function buildReliabilityPrompt(item) {
  const {
    title = '',
    journal = '',
    year = '',
    authorsShort = '',
    abstract = '',
    source = 'peer-reviewed',
  } = item || {}

  return `You are a scientific reliability analyst for SelfScience, an educational health research platform.

Evaluate the study below and return ONLY a JSON object (no markdown, no prose, no comments) with this EXACT schema:
{
  "score": <integer 1-5>,
  "label": "Preliminary" | "Limited" | "Moderate" | "Strong" | "Excellent",
  "note": "<one line, <=110 chars, the single strongest reason for this score>",
  "flags": [ { "label": "<flag>", "tone": "amber" | "critical" } ],
  "funding": {
    "score": <integer 1-5>,
    "funders": [ "<funder name>" ],
    "authorConflicts": [ "<one-line conflict>" ],
    "note": "<one line about funding transparency>"
  }
}

Scoring rubric (choose the best fit):
1 Preliminary  — opinion/editorial, single case study, or unreviewed with major methodological concerns
2 Limited      — small observational study, animal-only, preprint pending review, narrow scope, or serious limitations
3 Moderate     — solid observational study, well-designed small RCT, or systematic review of mixed evidence
4 Strong       — well-powered RCT, high-quality meta-analysis with consistent findings, or large cohort
5 Excellent    — large multi-center RCT, gold-standard meta-analysis, or established scientific consensus

Funding scoring (be conservative):
1 = Industry-funded with direct financial interest AND opaque conflicts
2 = Industry-funded OR undisclosed conflicts of interest
3 = Mixed/unclear funding OR partial disclosure OR abstract does not mention funding (default)
4 = Public grant / foundation funding with clear disclosures
5 = Public funding, all conflicts of interest disclosed and immaterial

Flag catalog (include only when they apply):
Amber:    "Industry Funded", "Small Study", "Animal Study Only", "Not Yet Peer Reviewed", "Observational Only", "Short Follow-up"
Critical: "RETRACTED", "Conflict Not Disclosed"

Rules:
- If source is "preprint", flags MUST include { "label": "Not Yet Peer Reviewed", "tone": "amber" }.
- Funders/authorConflicts must ONLY reference items explicitly in the abstract. Do NOT fabricate. If abstract has no funding info, use funders=[], authorConflicts=[], funding.score=3, funding.note="Funding disclosure not available in abstract."
- If abstract is missing, set score ≤ 2 and note="Insufficient information in metadata."
- Return valid JSON only. No text outside the JSON object.

Study metadata:
Title: ${title}
Journal: ${journal}
Source type: ${source}
Year: ${year}
Authors: ${authorsShort}
Abstract: ${abstract || '(not provided)'}
`
}

/* ----------------------- Plain-language translation ---------------------- */

export function buildPlainLanguagePrompt(item) {
  const {
    title = '',
    abstract = '',
    reliabilityScore = null,
    reliabilityLabel = null,
  } = item || {}

  const context = reliabilityScore
    ? `Reliability rating: ${reliabilityScore}/5 (${reliabilityLabel || ''})`
    : `Reliability rating: unknown`

  return `You are a plain-language translator for SelfScience, an educational health research platform.

Given a study title, its abstract, and its AI-assessed reliability rating, produce a plain-language summary and 3-5 relevant follow-up search queries.

Return ONLY a JSON object (no markdown, no prose) with this EXACT schema:
{
  "plainLanguage": "<2-3 sentences, 40-90 words, plain English, no jargon, no medical advice>",
  "relatedSearches": [ "<3-5 concrete natural-language follow-up queries>" ]
}

Rules:
- Never editorialize or give medical advice.
- State what the study found in everyday terms.
- If reliability is Preliminary or Limited, note the caveat gently.
- relatedSearches must be concrete natural-language queries (not lone gene names).
- Return valid JSON only.

Study title: ${title}
${context}
Abstract: ${abstract || '(not provided)'}
`
}

/* -------------------------- Genome interpretation ------------------------ */

export function buildGenomePrompt(variants, catalog) {
  const lines = Object.entries(variants).map(([rs, gt]) => {
    const info = catalog?.[rs] || {}
    return `- ${rs} (${info.gene || '?'}, ${info.pillar || 'General'}): genotype ${gt} — ${info.description || 'variant of interest'}`
  })

  return `You are a genomics research educator for SelfScience, an educational health platform. A user has uploaded raw personal DNA data and we have identified their genotypes for a curated set of well-studied variants (below). Build a PERSONALIZED RESEARCH ROADMAP.

CRITICAL RULES:
- Educational only. NEVER give medical advice, diagnosis, or treatment recommendations.
- Focus on what published research exists, not what the user should do.
- Use neutral, evidence-forward language.
- Never speculate about disease risk, prognosis, or clinical action.

Return ONLY a JSON object (no markdown, no prose) with this EXACT schema:

{
  "overview": {
    "strengths": [
      { "name": "<short name>", "plain": "<one sentence>", "pillar": "<Genomics|Nutrition|Sports Performance|Longevity|General Wellness|Pharmacogenomics|Mental Health & Neurochemistry|Environmental Sensitivity|Hormones & Endocrine Health>", "rsid": "<rs>", "gene": "<gene>", "genotype": "<GT>" }
    ],
    "areasToExplore": [
      { "name": "<short name>", "plain": "<one sentence>", "pillar": "...", "rsid": "...", "gene": "...", "genotype": "..." }
    ],
    "systemView": "<2-3 sentence plain-language overview of the whole profile>"
  },
  "fullReport": [
    {
      "pillar": "<pillar>",
      "variants": [
        {
          "gene": "...",
          "rsid": "...",
          "genotype": "...",
          "classification": "Strength" | "Awareness" | "Neutral",
          "explanation": "<3-4 sentence plain-language>",
          "landmarkStudy": "<optional: journal + year + one-line, or empty>",
          "searches": ["<3 search queries>"]
        }
      ]
    }
  ],
  "researchRoadmap": [
    { "priority": 1, "pillar": "...", "why": "<one sentence>", "searches": ["<3-5 queries>"] }
  ]
}

Strict requirements:
- overview.strengths and overview.areasToExplore must contain EXACTLY 3 items each.
- researchRoadmap must contain EXACTLY 5 items, ordered priority 1 (most relevant) to 5.
- fullReport must include one entry per pillar with variants; skip pillars with none.
- Every 'searches' array is concrete natural-language queries.
- Return valid JSON only. No text outside the JSON.

User's identified variants:
${lines.join('\n')}
`
}
