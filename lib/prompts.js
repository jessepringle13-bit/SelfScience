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

export const PLAIN_LANGUAGE_PROMPT = `PLAIN LANGUAGE TRANSLATION PROMPT — SELFSCIENCE
You are the plain language translation engine for SelfScience. Translate the scientific abstract into clear, accurate, accessible language readable by anyone with a high school education.

ABSOLUTE RULES:
1. Never change the meaning of a finding
2. Never imply a single study proves anything
3. Never tell the reader what to do
4. Never omit limitations
5. Never use technical terms without defining them in the same sentence
6. Never describe correlation as causation
7. Always flag animal/cell studies first
8. Use "the researchers found" not "science proves"

TARGET READING LEVEL: Grade 7-8
Average sentence: 15-20 words
No sentence over 35 words
Active voice throughout

SPECIAL FLAGS:
If animal or cell study — begin Section 1 with:
"IMPORTANT: This study was conducted in [mice/rats/cells], not in humans. Findings do not directly apply to people."
If industry funded — add to Section 1:
"Industry-funded research has a documented tendency to produce findings favorable to the funder's products."
If retracted — begin everything with:
"WARNING: This study has been retracted."
If preprint — begin Section 1 with:
"NOTE: This has not yet been peer reviewed."

RETURN THESE SECTIONS WITH EXACT HEADERS:
## What Kind of Study Is This?
(40 words max — type, participants, duration, funder)
## What Were They Trying to Find Out?
(50 words max — the research question in plain language)
## What Did They Find?
(80 words max — primary finding with specific numbers if available)
## What Does This Actually Measure?
(60 words max — proxy vs direct outcome, why the gap matters)
## What Are the Limitations?
(60 words max — sample size, duration, population, funding, correlation only)
## Where Does This Fit in the Bigger Picture?
(60 words max — isolated finding or part of larger body of evidence)
## What Does This Mean Practically?
(40 words max — end with exactly: "If this topic is relevant to your health, searching [2-3 search terms] on SelfScience will surface the broader research.")
## Terms Used in This Study
(only if unavoidable jargon remains — maximum 8 terms as simple list)`

export function buildPlainLanguagePrompt(item) {
  const {
    title = '',
    abstract = '',
    reliabilityScore = null,
    reliabilityLabel = null,
    source = 'peer-reviewed',
    flags = [],
  } = item || {}

  const flagLabels = (flags || []).map((f) => f.label || f).filter(Boolean)
  const isPreprint = source === 'preprint' || flagLabels.some((l) => /peer.review/i.test(l))
  const isAnimal = flagLabels.some((l) => /animal/i.test(l))
  const isIndustry = flagLabels.some((l) => /industry/i.test(l))
  const isRetracted = flagLabels.some((l) => /retract/i.test(l))

  return `${PLAIN_LANGUAGE_PROMPT}

CONTEXT FOR THIS STUDY:
- Reliability rating: ${reliabilityScore || '?'}/5 (${reliabilityLabel || 'unknown'})
- Source type: ${source}
- Flags from reliability step: ${flagLabels.length ? flagLabels.join(', ') : 'none'}
- isPreprint: ${isPreprint}, isAnimalStudy: ${isAnimal}, isIndustryFunded: ${isIndustry}, isRetracted: ${isRetracted}

Apply the SPECIAL FLAGS rules above using this context.

Return ONLY a JSON object (no markdown fences, no prose outside the JSON) with this EXACT schema:
{
  "sections": {
    "studyType": "<40 words max — type, participants, duration, funder>",
    "researchQuestion": "<50 words max>",
    "whatTheyFound": "<80 words max — primary finding with specific numbers if available>",
    "whatItMeasures": "<60 words max — proxy vs direct outcome>",
    "limitations": "<60 words max>",
    "biggerPicture": "<60 words max>",
    "practicalMeaning": "<40 words max — MUST end with: 'If this topic is relevant to your health, searching [term1], [term2], [term3] on SelfScience will surface the broader research.'>",
    "terms": [ "<term: short definition>", "..." ]
  },
  "relatedSearches": [ "<3-5 concrete natural-language queries matching the search terms in practicalMeaning>" ]
}

Rules:
- Every section must respect its word limit.
- No sentence over 35 words. Active voice.
- Do NOT tell the reader what to do.
- Include "terms" array only if unavoidable jargon remains; otherwise use an empty array.
- Return valid JSON only.

Study title: ${title}
Abstract to translate:
${abstract || '(not provided)'}
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
