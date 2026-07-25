'use client'

// /app/lib/learningPath.js
// Data + LS helpers for the pillar Learning Path feature.
// Three steps per pillar:
//   1. Understand the basics  — link to an editorial overview
//   2. Read your findings     — scroll to the finding cards below
//   3. Apply it to daily life — link to a pillar-specific tool page
//
// Completion is tracked per pillar via three LS keys plus a rollup:
//   ss_learning_step1_<slug> = 'true'
//   ss_learning_step2_<slug> = 'true'
//   ss_learning_step3_<slug> = 'true'
//   ss_learning_complete_<slug> = 'true'   (written when all three done)
//
// The slug is the same one used by the pillar-intro feature — lowercase
// with all non-alphanumeric characters (including &) stripped.

import { normalizePillarName } from '@/lib/pillars'
import { flattenReportCards } from '@/lib/supplementProtocol'

/* ----------------------- Pillar-specific spec ------------------------ */
// One entry per canonical pillar name. Each entry describes the copy +
// destination for steps 1 and 3. Step 2 is dynamic (per-user counts).
//
// For step 1 we prefer an in-app article route; if it does not exist,
// clicking still works — Next.js will render the article's not-found
// which links back to Search. In practice we default to the search
// fallback URL directly so the flow is instant and dependable.

const PILLAR_SPEC = {
  'Nutrition': {
    step1Url:  '/search?pillar=Nutrition&q=nutrigenomics+basics',
    step1Time: '~10 min read',
    step3Label:'See which foods and nutrients are most aligned with your specific variants.',
    step3Cta:  'Explore Nutrition Hub',
    step3Url:  '/nutrition',
    step3Time: '~5 min',
  },
  'Longevity': {
    step1Url:  '/search?pillar=Longevity&q=longevity+genetics',
    step1Time: '~10 min read',
    step3Label:'Explore supplement and lifestyle protocols that support your longevity findings.',
    step3Cta:  'Explore Supplements',
    step3Url:  '/tools/supplements?goal=longevity',
    step3Time: '~5 min',
  },
  'Sports Performance': {
    step1Url:  '/search?pillar=Sports+Performance&q=athletic+genetics',
    step1Time: '~10 min read',
    step3Label:'Review your personalized training zones and sport affinity profile.',
    step3Cta:  'See Training Protocol',
    step3Url:  '/tools/training',
    step3Time: '~5 min',
  },
  'General Wellness': {
    step1Url:  '/search?pillar=General+Wellness&q=sleep+stress+genetics',
    step1Time: '~10 min read',
    step3Label:'Check your sleep, stress, and gut health supplement matches.',
    step3Cta:  'Explore Supplements',
    step3Url:  '/tools/supplements?goal=wellness',
    step3Time: '~5 min',
  },
  'Pharmacogenomics': {
    step1Url:  '/search?pillar=Pharmacogenomics&q=pharmacogenomics+explained',
    step1Time: '~10 min read',
    step3Label:'Review how your variants affect the medications and supplements you currently take.',
    step3Cta:  'Check Drug Interactions',
    step3Url:  '/drug-check',
    step3Time: '~5 min',
  },
  'Mental Health & Neurochemistry': {
    step1Url:  '/search?pillar=Mental+Health+%26+Neurochemistry&q=neurotransmitter+genetics',
    step1Time: '~10 min read',
    step3Label:'Explore supplement and lifestyle approaches matched to your neurochemistry profile.',
    step3Cta:  'Explore Supplements',
    step3Url:  '/tools/supplements?goal=mood',
    step3Time: '~5 min',
  },
  'Environmental Sensitivity': {
    step1Url:  '/search?pillar=Environmental+Sensitivity&q=detox+pathways+genetics',
    step1Time: '~10 min read',
    step3Label:'See which antioxidant and detox supports are most relevant for your variants.',
    step3Cta:  'Explore Supplements',
    step3Url:  '/tools/supplements?goal=detox',
    step3Time: '~5 min',
  },
  'Hormones & Endocrine Health': {
    step1Url:  '/search?pillar=Hormones+%26+Endocrine+Health&q=hormone+genetics',
    step1Time: '~10 min read',
    step3Label:'Review hormone-relevant supplements and lifestyle factors matched to your findings.',
    step3Cta:  'Explore Supplements',
    step3Url:  '/tools/supplements?goal=hormones',
    step3Time: '~5 min',
  },
  'Genomics': {
    step1Url:  '/search?pillar=Genomics&q=how+to+read+your+genome',
    step1Time: '~10 min read',
    step3Label:'Generate your full genome report and Practitioner Report for clinical discussion.',
    step3Cta:  'View Full Report',
    step3Url:  '/genome',
    step3Time: '~5 min',
  },
  'Developmental & Lifespan Wellness': {
    step1Url:  '/search?pillar=Developmental+%26+Lifespan+Wellness&q=youth+genetics+guide',
    step1Time: '~10 min read',
    step3Label:"Review the research and guidance relevant to your child's developmental stage.",
    step3Cta:  'Visit Youth Hub',
    step3Url:  '/pillars/youth',
    step3Time: '~5 min',
  },
}

const DEFAULT_STEP1 = {
  step1Url:  '/search',
  step1Time: '~10 min read',
  step3Label:'Explore supplements and tools most relevant to this pillar.',
  step3Cta:  'Explore Supplements',
  step3Url:  '/tools/supplements',
  step3Time: '~5 min',
}

export function getPillarLearningSpec(pillarName) {
  return PILLAR_SPEC[pillarName] || DEFAULT_STEP1
}

/* ---------------------------- LS key helpers -------------------------- */

export function pillarSlug(pillarName) {
  return String(pillarName || '')
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function stepKey(n, pillarName) {
  return `ss_learning_step${n}_${pillarSlug(pillarName)}`
}

function completeKey(pillarName) {
  return `ss_learning_complete_${pillarSlug(pillarName)}`
}

export function isStepComplete(step, pillarName) {
  if (typeof window === 'undefined' || !pillarName) return false
  try { return window.localStorage.getItem(stepKey(step, pillarName)) === 'true' } catch { return false }
}

export function isPathComplete(pillarName) {
  if (typeof window === 'undefined' || !pillarName) return false
  try { return window.localStorage.getItem(completeKey(pillarName)) === 'true' } catch { return false }
}

/** Mark a step complete + roll up to the path-complete flag when all done. */
export function markStepComplete(step, pillarName) {
  if (typeof window === 'undefined' || !pillarName || !step) return
  try {
    window.localStorage.setItem(stepKey(step, pillarName), 'true')
    const done = [1, 2, 3].every((n) => window.localStorage.getItem(stepKey(n, pillarName)) === 'true')
    if (done) window.localStorage.setItem(completeKey(pillarName), 'true')
    window.dispatchEvent(new CustomEvent('selfscience:learning-changed', { detail: { pillar: pillarName } }))
  } catch {}
}

/** Wipe all four keys for a pillar — used by "Restart guide from beginning". */
export function resetPillarLearning(pillarName) {
  if (typeof window === 'undefined' || !pillarName) return
  try {
    ;[1, 2, 3].forEach((n) => window.localStorage.removeItem(stepKey(n, pillarName)))
    window.localStorage.removeItem(completeKey(pillarName))
    window.dispatchEvent(new CustomEvent('selfscience:learning-changed', { detail: { pillar: pillarName } }))
  } catch {}
}

/* -------------------- Findings-count helper --------------------------- */
// Reuses normalizePillarName so classifier variants collapse correctly.

function classificationBucket(c) {
  const s = String(c || '').toLowerCase()
  if (s === 'positive' || s === 'strength') return 'strength'
  if (s === 'awareness' || s === 'be_aware' || s === 'aware' || s === 'finding') return 'awareness'
  return 'neutral'
}

export function pillarFindingsCounts(genomeReport, pillarName) {
  const out = { strengths: 0, awareness: 0, total: 0 }
  if (!genomeReport || !pillarName) return out
  const target = normalizePillarName(pillarName)
  if (!target) return out
  const cards = flattenReportCards(genomeReport)
  const seen = new Set()
  for (const c of cards) {
    if (normalizePillarName(String(c?.pillar || '')) !== target) continue
    const key = String(c?.rsid || c?.gene || '') + ':' + String(c?.genotype || '')
    if (seen.has(key)) continue
    seen.add(key)
    const bucket = classificationBucket(c?.classification)
    if (bucket === 'strength') out.strengths++
    else if (bucket === 'awareness') out.awareness++
    out.total++
  }
  return out
}

/* ---------------------- Cross-component event glue -------------------- */
// Fire this from other components (e.g. VariantInterpretation) when the
// user opens a variant card inside a pillar's page — Step 2 completes
// automatically.

export const LEARNING_STEP2_EVT = 'selfscience:variant-expanded'

export function emitVariantExpanded(pillarName) {
  if (typeof window === 'undefined') return
  if (!pillarName) return
  try {
    window.dispatchEvent(new CustomEvent(LEARNING_STEP2_EVT, { detail: { pillar: pillarName } }))
  } catch {}
}
