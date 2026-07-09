/**
 * Prompt templates for SelfScience.
 *
 * Consolidated reliability + plain-language into ONE Gemini call for efficiency.
 * Produces exactly the fields the ResultCard component consumes.
 */

export function buildAnalysisPrompt(item) {
  const {
    title = '',
    journal = '',
    year = '',
    authorsShort = '',
    abstract = '',
    source = 'peer-reviewed',
  } = item || {}

  return `You are a scientific reliability analyst for SelfScience, an educational health research platform. Your job is to evaluate a single study's reliability and write a plain-language summary for a general audience.

Return ONLY a JSON object (no markdown fences, no prose, no comments) with this exact schema:
{
  "score": <integer 1-5>,
  "label": "Preliminary" | "Limited" | "Moderate" | "Strong" | "Excellent",
  "note": "<one line, <=110 chars, the single strongest reason for this score, e.g. 'Randomized controlled trial, n=180, 12-week follow-up.'>",
  "flags": [ { "label": "<flag label>", "tone": "amber" | "critical" } ],
  "plainLanguage": "<2-3 sentences, 40-90 words, plain English, no jargon. State what the study found in everyday terms. Do not editorialize. Do not give medical advice.>"
}

Scoring rubric (choose the best fit):
1 Preliminary  — opinion/editorial, single case study, or unreviewed with major methodological concerns
2 Limited      — small observational study, animal-only, preprint pending review, narrow scope, or serious limitations
3 Moderate     — solid observational study, well-designed small RCT, or systematic review of mixed evidence
4 Strong       — well-powered RCT, high-quality meta-analysis with consistent findings, or large cohort with strong controls
5 Excellent    — large multi-center RCT, gold-standard meta-analysis, or established scientific consensus

Flag catalog (only include flags that actually apply based on the abstract; empty array if none apply):
Amber (caution):   "Industry Funded", "Small Study", "Animal Study Only", "Not Yet Peer Reviewed", "Observational Only", "Short Follow-up"
Critical:          "RETRACTED", "Conflict Not Disclosed"

Rules:
- If source is "preprint", the flags MUST include { "label": "Not Yet Peer Reviewed", "tone": "amber" }.
- If the abstract is empty or missing, still return a score but base it on title/journal/year only, set score ≤ 2, and add note "Insufficient information in metadata."
- Never include markdown, code fences, or any text outside the JSON.
- Return valid JSON only.

Study metadata:
Title: ${title}
Journal: ${journal}
Source type: ${source}
Year: ${year}
Authors: ${authorsShort}
Abstract: ${abstract || '(not provided)'}
`
}

/**
 * Reserved for a later milestone: the client-side genome parser will send
 * a plain { rsid: genotype } object to this prompt.
 */
export function buildGenomePrompt(variantsObject) {
  const list = Object.entries(variantsObject || {})
    .map(([rs, gt]) => `${rs}:${gt}`)
    .join(', ')
  return `You are a genomics research educator for SelfScience. The user has provided a list of rsID:genotype pairs from their personal DNA data. Return a JSON object with structured findings organized by pillar (Genomics, Nutrition, Performance, Longevity, Wellness, Cognition, Metabolism, Detoxification). No medical advice. Educational only.

Variants: ${list}
`
}
