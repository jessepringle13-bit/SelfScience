'use client'

// /app/lib/pillarIntro.js
// Pure content + LS helpers for the pillar-intro card.
// The card appears inline (not a modal) the first time a user
// activates a specific pillar filter, then never again after
// they dismiss it.

import { normalizePillarName } from '@/lib/pillars'
import { flattenReportCards } from '@/lib/supplementProtocol'

/* ------------------- Pillar descriptions (per spec) ------------------- */
// Keyed by the CANONICAL pillar name that shows up on the chip bar
// (matches PILLARS[i].name in components/site-nav.jsx). Every entry is
// a plain-English 1-2 sentence explanation of what the pillar covers.

const PILLAR_DESCRIPTIONS = {
  'Nutrition':
    'How your genes influence the way your body processes food, vitamins, and nutrients — including fat metabolism, carbohydrate sensitivity, vitamin conversion, and which dietary patterns are most aligned with your biology.',
  'Longevity':
    'The genetic factors associated with cellular aging, telomere maintenance, NAD pathways, and the biological processes that influence how well your body holds up over time.',
  'Sports Performance':
    'Your athletic genetics — covering muscle fiber type tendencies, aerobic adaptation speed, injury risk factors, recovery capacity, and which training styles are most compatible with your biology.',
  'General Wellness':
    'The variants that influence your everyday health — sleep quality, stress response, gut function, immune regulation, and the daily habits that have the most impact for your specific genotype.',
  'Pharmacogenomics':
    'How your genes affect the way your body processes medications and supplements — including which drugs may need dose adjustments and which forms of vitamins and nutrients your body can absorb most efficiently.',
  'Mental Health & Neurochemistry':
    'The genetic influences on mood, focus, stress resilience, dopamine and serotonin balance, and the brain chemistry that shapes how you think and feel under pressure.',
  'Environmental Sensitivity':
    'How your body responds to environmental exposures — including toxins, air quality, chemical compounds, and the detoxification pathways that process what you encounter in daily life.',
  'Hormones & Endocrine Health':
    'The variants that influence testosterone, estrogen, cortisol, thyroid function, insulin signaling, and the hormonal systems that regulate energy, mood, metabolism, and recovery.',
  'Genomics':
    'Your foundational genetic variants — the core SNPs that inform the rest of your results, including methylation pathways, DNA repair capacity, and gene expression regulation.',
  'Developmental & Lifespan Wellness':
    'Research findings relevant to growth, development, nutrition, allergies, and adolescent health — curated for parents and caregivers with appropriate context and caution.',
}

/**
 * Return the plain-English description for a pillar. Falls back to
 * a safe generic if we don't have a curated blurb.
 */
export function getPillarDescription(pillarName) {
  if (!pillarName) return null
  return (
    PILLAR_DESCRIPTIONS[pillarName] ||
    `Research and personalised context for the ${pillarName.toLowerCase()} pillar of your genome.`
  )
}

/* ---------------- LS key builder + dismissal helpers ------------------ */
// Per spec: lowercase, no spaces, no punctuation.
//   Nutrition                    → ss_pillar_intro_nutrition
//   Mental Health & Neurochemistry → ss_pillar_intro_mentalhealthneurochemistry

export function pillarLsKey(pillarName) {
  const slug = String(pillarName || '')
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]/g, '')
  return `ss_pillar_intro_${slug}`
}

export function isPillarIntroDismissed(pillarName) {
  if (typeof window === 'undefined' || !pillarName) return true
  try {
    return window.localStorage.getItem(pillarLsKey(pillarName)) === 'true'
  } catch { return true }
}

export function dismissPillarIntro(pillarName) {
  if (typeof window === 'undefined' || !pillarName) return
  try {
    window.localStorage.setItem(pillarLsKey(pillarName), 'true')
    window.dispatchEvent(new CustomEvent('selfscience:pillar-intro-changed'))
  } catch {}
}

/* ------------------- Findings count builder -------------------------- */

function classificationBucket(c) {
  const s = String(c || '').toLowerCase()
  if (s === 'positive' || s === 'strength') return 'strength'
  if (s === 'awareness' || s === 'be_aware' || s === 'aware' || s === 'finding') return 'awareness'
  return 'neutral'
}

/**
 * Given the user's genomeReport and a pillar name, return
 * { strengths, awareness, neutral, total } — the counts of the
 * user's cards that fall into that pillar. Uses normalizePillarName
 * so the classifier's varied labels (e.g. "General Wellness" vs
 * "Wellness") collapse correctly.
 */
export function countPillarFindings(genomeReport, pillarName) {
  const empty = { strengths: 0, awareness: 0, neutral: 0, total: 0 }
  if (!genomeReport || !pillarName) return empty
  const target = normalizePillarName(pillarName)
  if (!target) return empty
  const cards = flattenReportCards(genomeReport)
  const seen = new Set()
  const out = { strengths: 0, awareness: 0, neutral: 0, total: 0 }
  for (const c of cards) {
    const p = normalizePillarName(String(c?.pillar || ''))
    if (!p || p !== target) continue
    const key = String(c?.rsid || c?.gene || '') + ':' + String(c?.genotype || '')
    if (seen.has(key)) continue
    seen.add(key)
    const bucket = classificationBucket(c?.classification)
    if (bucket === 'strength') out.strengths++
    else if (bucket === 'awareness') out.awareness++
    else out.neutral++
    out.total++
  }
  return out
}
