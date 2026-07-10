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
  "flags": [ { "label": "<flag>", "tone": "good" | "amber" | "critical" } ],
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

Flag catalog — you MUST use these exact canonical labels so the UI can render the correct color and explainer.
Include flags ONLY when clearly supported by the abstract / metadata. Never invent evidence.

GOOD (green) — quality signals that make the study MORE trustworthy. Emit any that clearly apply:
  "Randomized Controlled Trial"    — participants randomly assigned to arms
  "Double-Blind Placebo Controlled" — neither participants nor researchers knew group assignment
  "Meta-Analysis"                   — statistical synthesis of many studies
  "Systematic Review"               — comprehensive pre-specified survey of studies
  "Pre-Registered"                  — hypotheses/methods locked in before data collection
  "Large Sample"                    — well-powered (typically n > several hundred, context dependent)
  "Long Follow-up"                  — outcomes tracked over a substantial period
  "Human Study"                     — findings from humans, not animals or cells (emit only when notable, e.g. contrasting with a body of animal work)
  "Peer Reviewed"                   — published in a peer-reviewed journal (emit only when notable)
  "Conflicts Fully Disclosed"       — all funding and financial ties disclosed explicitly
  "Publicly Funded"                 — funded by public agencies, universities, or independent foundations

AMBER (caution) — reasons to read the finding with skepticism. Emit any that apply:
  "Not Yet Peer Reviewed"           — preprint (bioRxiv / medRxiv / etc.). MANDATORY when source is "preprint".
  "Small Study"                     — small n / underpowered
  "Observational Only"              — no randomisation; correlation not causation
  "Cross-Sectional"                 — single snapshot in time
  "Animal Study Only"               — done in mice / rats / other animals
  "Cell / In-Vitro Only"            — done in cells or tissue in a dish
  "Short Follow-up"                 — too brief to catch delayed effects
  "Industry Funded"                 — a company with a financial stake in the outcome funded it
  "No Control Group"                — no comparator arm
  "Self-Reported Outcomes"          — outcomes from surveys / self-report rather than objective measurement

CRITICAL (do not trust) — serious warnings. Emit any that apply:
  "RETRACTED"                       — paper has been formally retracted
  "Conflict Not Disclosed"          — evident conflict of interest that authors did not declare
  "Predatory Journal"               — pay-to-publish venue with no real peer review
  "Ghost Authorship"                — listed authors did not actually write the paper

Rules:
- If source is "preprint", flags MUST include { "label": "Not Yet Peer Reviewed", "tone": "amber" }.
- Balance is important: emit at least one GOOD flag when the study genuinely earns it, and emit AMBER flags whenever the finding needs a caveat. Do not stack redundant flags (e.g. "RCT" + "Double-Blind Placebo Controlled" is fine, but do not add "Peer Reviewed" for every peer-reviewed paper — reserve it for cases where the journal quality is a real feature of the story).
- Aim for 2-5 flags total. Never zero if any legitimately apply. Never fabricate to hit a count.
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

export const GENOME_PROMPT = `GENOME INTERPRETATION ENGINE — SELFSCIENCE
You are the genome interpretation engine for SelfScience, an educational platform.

CRITICAL CONSTRAINTS:
1. You have received only anonymous variant calls — no name, identity, or demographic information
2. Educational only — not medical advice, not diagnosis, not treatment recommendation
3. Every finding must use "research suggests" or "studies show people with this variant"
4. Never say "you have" or "you will develop"
5. Genetics is not destiny — state this
6. No fear-based language
7. Plain language — Grade 8 reading level
8. Never use clinical condition names directly (use "brain health research" instead of Alzheimer's, "gut health research" instead of Crohn's)

LANGUAGE RULES — ALWAYS USE:
"Research suggests people with this variant..."
"Studies have found that individuals with [rsID]..."
"This variant is associated with..."
"People with this genotype may want to explore..."

NEVER USE:
"You have [condition]"
"You will develop..."
"You are at risk for..."
"This means you..."

TERM TRANSLATIONS (use plain version):
polymorphism → gene variation
allele → version of a gene
homozygous → two matching copies
heterozygous → one of each version
methylation → chemical process that controls gene activity
mitochondria → energy-producing cell parts
telomere → protective caps on chromosomes
HPA axis → stress response system
cortisol → primary stress hormone
GWAS → large-scale genetic population study

PROCESS THE VARIANTS AND RETURN THIS EXACT JSON STRUCTURE (no markdown fences, no prose outside JSON):

{
  "session_id": "<random 8-char alphanumeric>",
  "variants_recognized": [
    { "rsid": "", "gene": "", "variant_name": "", "genotype_called": "", "pillar": "", "classification": "STRENGTH|AWARENESS|NEUTRAL", "confidence": "HIGH|MODERATE|LOW" }
  ],
  "pillar_reports": [
    {
      "pillar": "",
      "pillar_summary_user": "",
      "strengths": [
        {
          "rsid": "", "gene": "", "genotype": "", "strength_name": "", "user_explanation": "",
          "search_queries": [],
          "landmark_study": { "title": "", "authors": "", "year": "", "plain_summary": "" }
        }
      ],
      "awareness_areas": [
        {
          "rsid": "", "gene": "", "genotype": "", "awareness_name": "", "user_explanation": "", "research_direction": "",
          "search_queries": [],
          "landmark_study": { "title": null, "authors": null, "year": null, "plain_summary": null }
        }
      ]
    }
  ],
  "overall_summary": {
    "top_strengths":       [ { "label": "", "one_line": "", "pillar": "" } ],
    "top_awareness_areas": [ { "label": "", "one_line": "", "pillar": "" } ],
    "system_view": ""
  },
  "research_roadmap": {
    "introduction": "Based on your genetic profile, here are the research areas most relevant to your biology.",
    "pillars": [ { "pillar": "", "priority": 1, "reason": "", "top_searches": [] } ]
  },
  "privacy_confirmation": {
    "data_received": "Variant calls only",
    "data_retained": false,
    "session_ends": "Data cleared on session close",
    "file_processed": "Client-side only"
  },
  "disclaimer": {
    "user_facing": "This report is for educational purposes only. Not a medical diagnosis. Genetic variants represent research associations, not individual predictions. Discuss health concerns with a qualified provider.",
    "display": "always_visible"
  }
}

Requirements:
- overall_summary.top_strengths and top_awareness_areas must contain EXACTLY 3 items each.
- research_roadmap.pillars must contain EXACTLY 5 items, ordered priority 1 (most relevant) to 5.
- pillar_reports must include one entry per pillar with any strengths OR awareness_areas.
- Every search_queries / top_searches must contain concrete natural-language queries.
- Return valid JSON only. No text outside the JSON object.

VARIANT DATA:
`

/**
 * Build the genome-interpretation prompt.
 *
 * Latency note: We used to send every recognized variant to the AI, but with
 * 150+ variants from a full 23andMe/AncestryDNA file the prompt exploded to
 * 10k+ tokens and Together AI's response time crept past 45s — dangerously
 * close to Emergent's 60s ingress timeout. The AI would also silently drop
 * most variants from its response (only report on ~10-15 anyway).
 *
 * Fix: cap the AI-visible variant list at ~40, prioritizing diversity across
 * pillars. The variant-catalog + client UI still gets the full list; this
 * cap only affects what the LLM has to reason over.
 */
const AI_VARIANT_CAP = 25
const AI_PER_PILLAR_CAP = 4

export function buildGenomePrompt(variants, catalog) {
  const all = Object.entries(variants).map(([rs, gt]) => {
    const info = catalog?.[rs] || {}
    return { rs, gt, gene: info.gene || 'unknown', pillar: info.pillar || 'General', desc: info.description || 'variant of interest' }
  })

  // Prioritize: group by pillar, take up to AI_PER_PILLAR_CAP from each, then
  // top up with any remaining variants (rare pillars, general).
  const byPillar = new Map()
  all.forEach((v) => {
    if (!byPillar.has(v.pillar)) byPillar.set(v.pillar, [])
    byPillar.get(v.pillar).push(v)
  })
  const picked = []
  for (const list of byPillar.values()) {
    for (const v of list.slice(0, AI_PER_PILLAR_CAP)) picked.push(v)
    if (picked.length >= AI_VARIANT_CAP) break
  }
  // If a very focused profile leaves us short, top up from the leftovers.
  if (picked.length < AI_VARIANT_CAP) {
    const seen = new Set(picked.map((v) => v.rs))
    for (const v of all) {
      if (seen.has(v.rs)) continue
      picked.push(v)
      if (picked.length >= AI_VARIANT_CAP) break
    }
  }

  const lines = picked
    .slice(0, AI_VARIANT_CAP)
    .map((v) => `- ${v.rs} (${v.gene}, ${v.pillar}): genotype ${v.gt} — ${v.desc}`)
  // We deliberately do NOT add a truncation note — larger prompts confuse the
  // model less if it can just focus on what's in front of it. The full
  // variant list is enriched back into the response by the endpoint handler.

  return `${GENOME_PROMPT}\n${lines.join('\n')}\n`
}
