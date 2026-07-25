'use client'

// /app/lib/blueprint.js
// Rule engine + selectors for the /blueprint page.
// Pure functions — they take genome cards / LS-derived state as input
// and return the shape each section needs. No network / no side effects.
//
// Note on genotype rules: the classifier stores genotypes as raw letters.
// For safety we match both strand orientations (e.g. 'GG'/'CC') and skip
// silently when a variant is absent.

import { useEffect, useState } from 'react'
import { flattenReportCards, matchProtocolToUserVariants, SUPPLEMENT_PROTOCOL_MAP } from '@/lib/supplementProtocol'
import { EVIDENCE_STRENGTH } from '@/lib/evidenceStrength'

/* ------------------------- Small helpers ---------------------------- */

function cardsByRsid(cards) {
  const m = new Map()
  for (const c of cards) {
    if (c?.rsid) m.set(String(c.rsid).toLowerCase(), c)
  }
  return m
}

function normGT(gt) {
  if (!gt) return ''
  const s = String(gt).toUpperCase().replace(/[^A-Z]/g, '')
  if (s.length !== 2) return s
  return [s[0], s[1]].sort().join('')
}

function hasGenotype(cardMap, rsid, ...genotypes) {
  const c = cardMap.get(String(rsid).toLowerCase())
  if (!c) return false
  const gt = normGT(c.genotype)
  return genotypes.some((g) => normGT(g) === gt)
}

function hasAnyHaplotype(cards, rsidHints, ...statusNames) {
  const hints = Array.isArray(rsidHints) ? rsidHints : [rsidHints]
  for (const c of cards) {
    if (!c?.is_haplotype) continue
    const match = hints.includes(c.rsid) || hints.some((h) => String(c.gene || '').includes(h))
    if (!match) continue
    if (statusNames.includes(c.haplotype_name)) return true
  }
  return false
}

/* ------------------------- Genome identity -------------------------- */

export function getGenomeStats(report) {
  if (!report) return { total: 0, positive: 0, awareness: 0, neutral: 0 }
  const cards = flattenReportCards(report)
  let positive = 0, awareness = 0, neutral = 0
  for (const c of cards) {
    const k = String(c?.classification || '').toLowerCase()
    if (k === 'positive' || k === 'strength' || k === 'benefit') positive += 1
    else if (k === 'awareness' || k === 'aware' || k === 'be_aware') awareness += 1
    else neutral += 1
  }
  return { total: cards.length, positive, awareness, neutral }
}

export function getTopPillar(report) {
  if (!report) return null
  const summary = report?.step1?.pillar_summary || {}
  let best = null
  let bestCount = -1
  for (const [name, s] of Object.entries(summary)) {
    const count = (s?.positive || 0) + (s?.awareness || 0) + (s?.neutral || 0)
    if (count > bestCount) {
      best = { name, count }
      bestCount = count
    }
  }
  return best?.count ? best : null
}

/**
 * Build a single synthesized sentence describing the user's overall
 * profile. Uses their top-2 strengths and top awareness finding when
 * available. Falls back gracefully when fewer are present.
 */
export function getGenomeSummarySentence(report) {
  if (!report) return null
  const strengths = report?.overview?.strengths || []
  const areas = report?.overview?.areasToExplore || []
  const s1 = strengths[0]?.plain || strengths[0]?.name
  const s2 = strengths[1]?.plain || strengths[1]?.name
  const a1 = areas[0]?.plain || areas[0]?.name
  // Take a short, sentence-like snippet from each plain text.
  const trim = (v) => {
    if (!v) return null
    const t = String(v).replace(/[\.\!\?]+$/, '').trim()
    // Try to keep the first clause — anything up to the first period,
    // capped at ~110 chars.
    const first = t.split(/[\.;]/)[0]
    return first.length > 110 ? first.slice(0, 107).trim() + '…' : first
  }
  const parts = [trim(s1), trim(s2)].filter(Boolean)
  if (!parts.length && !a1) return null
  const strengthsPart = parts.length === 2 ? `${parts[0]} and ${parts[1]}` : parts[0] || 'notable strengths'
  const awarenessPart = trim(a1)
  if (awarenessPart) {
    return `Your genome shows ${strengthsPart}, and a need to actively manage ${awarenessPart}.`
  }
  return `Your genome shows ${strengthsPart}. No high-impact awareness findings surfaced — revisit your Findings tab for the full picture.`
}

/* ------------------------- Top Priorities --------------------------- */

function evidenceTier(rsid) {
  return EVIDENCE_STRENGTH[rsid]?.tier || 'preliminary'
}

function rankKey(card) {
  const cls = String(card?.classification || '').toLowerCase()
  const tier = evidenceTier(card?.rsid)
  const isAwareness = cls === 'awareness' || cls === 'aware' || cls === 'be_aware'
  const isStrength = cls === 'positive' || cls === 'strength' || cls === 'benefit'
  const tierRank = tier === 'established' ? 0 : tier === 'emerging' ? 1 : 2
  if (isAwareness && tier === 'established') return 0 * 10 + tierRank
  if (isAwareness) return 1 * 10 + tierRank
  if (isStrength && tier === 'established') return 2 * 10 + tierRank
  if (isStrength) return 3 * 10 + tierRank
  return 4 * 10 + tierRank
}

const ACTION_LIBRARY = {
  rs1801133: 'Take 400–800mcg methylfolate + methylcobalamin daily to bypass the enzyme bottleneck.',
  rs1801131: 'Take 400–800mcg methylfolate + methylcobalamin daily to bypass the enzyme bottleneck.',
  rs174547:  'Use direct EPA/DHA fish oil (1–2g/day) — do not rely on flax or chia for omega-3.',
  rs174537:  'Use direct EPA/DHA fish oil (1–2g/day) — do not rely on flax or chia for omega-3.',
  rs10830963: 'Front-load carbs to earlier in the day; finish eating 2–3 hours before bed.',
  rs12722:   'Take 15–20g hydrolyzed collagen + 50mg vitamin C 30–60 min before training.',
  rs1815739: 'Match training focus to your muscle-fiber profile — endurance vs power emphasis.',
  rs8192678: 'Do more Zone 2 cardio than average (4–5 sessions/week) to overcome the blunted mitochondrial response.',
  rs4680:    'Manage stress load before intense cognitive work — your dopamine clears fast or slow depending on your allele.',
  rs1360780: 'Build post-stress recovery rituals — cortisol clears more slowly for you.',
  rs4253778: 'Higher-fat, lower-carb patterns are metabolically well-suited; consider fasted morning movement.',
  rs12934922:'Prioritize preformed vitamin A (eggs, liver) rather than relying on plant carotenoids.',
  rs7501331: 'Prioritize preformed vitamin A (eggs, liver) rather than relying on plant carotenoids.',
  rs2228570: 'Test your 25(OH)D annually; you likely need higher circulating levels than average.',
  rs1544410: 'Test your 25(OH)D annually; you likely need higher circulating levels than average.',
  rs762551:  'Cap caffeine and cut off by early afternoon — you clear it slowly.',
  rs4149056: 'Bring this variant up with your prescriber if a statin is ever considered.',
  rs429358:  'Focus on the modifiable levers: aerobic fitness, sleep, resistance training, dietary pattern.',
  rs7412:    'Focus on the modifiable levers: aerobic fitness, sleep, resistance training, dietary pattern.',
  rs671:     'Alcohol clearance is impaired — minimize intake and be mindful of flush reactions.',
  rs4988235: 'Lactase persistence is low — favor hard cheese and yogurt over milk-based dairy.',
}

function defaultActionFor(card) {
  const cls = String(card?.classification || '').toLowerCase()
  const gene = String(card?.gene || '').split(/[\s(/·+,]/)[0] || 'this gene'
  if (cls === 'awareness' || cls === 'aware' || cls === 'be_aware') {
    return `Discuss ${gene} with a qualified provider when planning supplements or medications.`
  }
  if (cls === 'positive' || cls === 'strength' || cls === 'benefit') {
    return `Lean into this strength — ${gene}-aligned lifestyle patterns compound over time.`
  }
  return `Review the ${gene} finding in your genome report for full context.`
}

export function getTopPriorities(report, n = 5) {
  if (!report) return []
  const cards = flattenReportCards(report)
  const enriched = cards.map((c) => ({ card: c, rank: rankKey(c) }))
  enriched.sort((a, b) => a.rank - b.rank)
  return enriched.slice(0, n).map(({ card }) => ({
    id: card.rsid || `${card.gene}:${card.name}`,
    gene: card.gene,
    rsid: card.rsid,
    name: card.name || card.gene,
    pillar: card.pillar || '',
    classification: card.classification,
    plain: card.plain || card.classification_text || card.summary || '',
    action: (card.rsid && ACTION_LIBRARY[card.rsid]) || defaultActionFor(card),
    confidence: evidenceTier(card.rsid),
  }))
}

/* --------------------------- Daily Protocol ------------------------- */

const PROTOCOL_RULES = {
  morning: [
    { rsids: ['rs1801133', 'rs1801131'], gene: 'MTHFR',
      test: (m, cards) => hasAnyHaplotype(cards, ['rs1801133', 'rs1801131'], 'compound_heterozygous', '677_homozygous', '1298_homozygous', '677_heterozygous', '1298_heterozygous') || hasGenotype(m, 'rs1801133', 'TT') || hasGenotype(m, 'rs1801131', 'CC'),
      text: 'Take methylfolate + methylcobalamin with water before breakfast.' },
    { rsids: ['rs10830963'], gene: 'MTNR1B',
      test: (m) => hasGenotype(m, 'rs10830963', 'GG'),
      text: 'Eat breakfast within 1 hour of waking to optimize insulin response.' },
    { rsids: ['rs4253778'], gene: 'PPARA',
      test: (m) => hasGenotype(m, 'rs4253778', 'GG', 'CC'),
      text: 'Consider fasted morning movement — your fat-oxidation response is enhanced.' },
    { rsids: ['rs762551'], gene: 'CYP1A2',
      test: (m) => hasGenotype(m, 'rs762551', 'AA'),
      text: 'Enjoy your morning coffee — you clear caffeine quickly. Still cap by early afternoon.' },
    { rsids: ['rs2228570', 'rs1544410'], gene: 'VDR',
      test: (m) => hasGenotype(m, 'rs2228570', 'TT') || hasGenotype(m, 'rs1544410', 'GG'),
      text: 'Take vitamin D3 (2000–4000 IU) with a fat-containing breakfast for better absorption.' },
  ],
  training: [
    { rsids: ['rs12722'], gene: 'COL5A1',
      test: (m) => hasGenotype(m, 'rs12722', 'TT', 'AA'),
      text: 'Take 15–20g hydrolyzed collagen + 50mg vitamin C 30–60 min before any exercise.' },
    { rsids: ['rs8192678'], gene: 'PPARGC1A',
      test: (m) => hasGenotype(m, 'rs8192678', 'CC', 'GG'),
      text: 'Prioritize Zone 2 cardio — your mitochondrial adaptation requires higher frequency than average.' },
    { rsids: ['rs1815739'], gene: 'ACTN3',
      test: (m) => hasGenotype(m, 'rs1815739', 'TT', 'AA'),
      text: 'Your profile favors endurance over power — aerobic base building is your genetic advantage.' },
    { rsids: ['rs1815739'], gene: 'ACTN3',
      test: (m) => hasGenotype(m, 'rs1815739', 'CC', 'GG'),
      text: 'Your profile favors power/sprint work — heavy strength + explosive training suit you.' },
    { rsids: ['rs1360780'], gene: 'FKBP5',
      test: (m) => hasGenotype(m, 'rs1360780', 'CT', 'TC', 'TT', 'AA'),
      text: 'Avoid stacking intense training on top of high-stress days — cortisol compounds for you.' },
  ],
  evening: [
    { rsids: ['rs10830963'], gene: 'MTNR1B',
      test: (m) => hasGenotype(m, 'rs10830963', 'GG'),
      text: 'Stop eating 2–3 hours before bed — late eating impairs your insulin secretion overnight.' },
    { rsids: ['rs1360780'], gene: 'FKBP5',
      test: (m) => hasGenotype(m, 'rs1360780', 'CT', 'TC', 'TT', 'AA'),
      text: 'Wind down actively — your cortisol clears more slowly and needs a deliberate signal to drop.' },
    { rsids: ['rs762551'], gene: 'CYP1A2',
      test: (m) => hasGenotype(m, 'rs762551', 'AC', 'CC'),
      text: 'No caffeine after early afternoon — slow metabolizers feel late-day cups well into the night.' },
    { rsids: [], gene: 'General',
      test: () => true,
      text: 'Take magnesium glycinate (200–400mg) before bed — supports sleep quality and muscle recovery.' },
  ],
}

export function getDailyProtocol(report) {
  if (!report) return { morning: [], training: [], evening: [] }
  const cards = flattenReportCards(report)
  const m = cardsByRsid(cards)
  const bucket = (key) => PROTOCOL_RULES[key]
    .filter((r) => {
      try { return r.test(m, cards) } catch { return false }
    })
    .map((r) => ({ text: r.text, gene: r.gene, isGeneral: !r.rsids?.length }))
  return {
    morning:  bucket('morning'),
    training: bucket('training'),
    evening:  bucket('evening'),
  }
}

/* --------------------------- Supplements ---------------------------- */

// Reuse the app's supplement matcher and reshape into 3 tiers.
export function getSupplementPicture(report) {
  if (!report) return { tier1: [], tier2: [], tier3: [] }
  const groups = matchProtocolToUserVariants(report)
  const tier1 = []
  const tier2 = []
  const tier3 = []
  // Tier 1: variant-priority matches.
  for (const entry of groups.priority) {
    for (const rec of entry.recommendations) {
      tier1.push({
        name: rec.name,
        dose: rec.dose,
        why: rec.mechanism,
        gene: entry.gene,
      })
    }
  }
  // Tier 2: lifestyle protocols reframed as supplement/behavior support.
  for (const entry of groups.lifestyle) {
    for (const rec of entry.recommendations) {
      // Behavioral rows still go in tier 2 as "Worth Considering".
      tier2.push({
        name: rec.name,
        dose: rec.dose,
        why: rec.mechanism,
        gene: entry.gene,
      })
    }
  }
  // Tier 3: awareness — provider discussion points.
  for (const entry of groups.awareness) {
    for (const rec of entry.recommendations) {
      tier3.push({
        name: rec.name,
        dose: rec.dose,
        why: rec.mechanism,
        gene: entry.gene,
      })
    }
  }
  return { tier1, tier2, tier3 }
}

/* ---------------------------- Nutrition ----------------------------- */

const NUTRITION_RULES = {
  prioritize: [
    { rsids: ['rs174547', 'rs174537', 'rs174546'], gene: 'FADS1', test: (m) => hasGenotype(m, 'rs174547', 'TT', 'CT', 'TC') || hasGenotype(m, 'rs174537', 'TT', 'CT', 'TC') || hasGenotype(m, 'rs174546', 'TT', 'CT', 'TC'), text: 'Fatty fish (salmon, sardines, mackerel) 2–3×/week.' },
    { rsids: ['rs12934922', 'rs7501331'], gene: 'BCMO1', test: (m) => hasGenotype(m, 'rs12934922', 'AA', 'TT') || hasGenotype(m, 'rs7501331', 'TT', 'AA'), text: 'Eggs and liver for preformed vitamin A — not just carrots.' },
    { rsids: ['rs1801133', 'rs1801131'], gene: 'MTHFR', test: (m, cards) => hasAnyHaplotype(cards, ['rs1801133', 'rs1801131'], 'compound_heterozygous', '677_homozygous', '1298_homozygous', '677_heterozygous', '1298_heterozygous'), text: 'Dark leafy greens for natural folate (spinach, kale, arugula).' },
    { rsids: ['rs4253778'], gene: 'PPARA', test: (m) => hasGenotype(m, 'rs4253778', 'GG', 'CC'), text: 'Healthy fats — avocado, olive oil, nuts — support your fat oxidation advantage.' },
    { rsids: ['rs10830963'], gene: 'MTNR1B', test: (m) => hasGenotype(m, 'rs10830963', 'GG'), text: 'Low glycemic-index carbohydrates, eaten earlier in the day.' },
    { rsids: ['rs4988235'], gene: 'LCT', test: (m) => hasGenotype(m, 'rs4988235', 'CC'), text: 'Hard cheeses and yogurt — fermented dairy is well-tolerated by your genotype.' },
  ],
  mindful: [
    { rsids: ['rs10830963'], gene: 'MTNR1B', test: (m) => hasGenotype(m, 'rs10830963', 'GG'), text: 'Late-night carbohydrates — impairs your overnight insulin secretion.' },
    { rsids: ['rs1801133', 'rs1801131'], gene: 'MTHFR', test: (m, cards) => hasAnyHaplotype(cards, ['rs1801133', 'rs1801131'], 'compound_heterozygous', '677_homozygous', '1298_homozygous', '677_heterozygous', '1298_heterozygous'), text: 'Folic-acid fortified foods — unmetabolized folic acid accumulates differently for you.' },
    { rsids: ['rs4988235'], gene: 'LCT', test: (m) => hasGenotype(m, 'rs4988235', 'CC'), text: 'Milk-based dairy — lactase drops in adulthood for your genotype.' },
    { rsids: ['rs671'], gene: 'ALDH2', test: (m) => hasGenotype(m, 'rs671', 'AA', 'AG', 'GA'), text: 'Alcohol — your acetaldehyde clearance is impaired; flush reactions are common.' },
    { rsids: ['rs762551'], gene: 'CYP1A2', test: (m) => hasGenotype(m, 'rs762551', 'AC', 'CC'), text: 'High caffeine intake — slow metabolizers may see cardiovascular impact at 3+ cups/day.' },
  ],
  timing: [
    { rsids: ['rs10830963'], gene: 'MTNR1B', test: (m) => hasGenotype(m, 'rs10830963', 'GG'), text: 'Eat your largest meal before 2 PM when possible.' },
    { rsids: ['rs10830963'], gene: 'MTNR1B', test: (m) => hasGenotype(m, 'rs10830963', 'GG'), text: 'Last meal at least 2–3 hours before bed.' },
    { rsids: ['rs4253778'], gene: 'PPARA', test: (m) => hasGenotype(m, 'rs4253778', 'GG', 'CC'), text: 'Fasted morning training suits your fat metabolism profile.' },
    { rsids: [], gene: 'General', test: () => true, text: 'Consistent meal timing supports circadian alignment regardless of genotype.' },
  ],
}

export function getNutritionProfile(report) {
  if (!report) return { prioritize: [], mindful: [], timing: [] }
  const cards = flattenReportCards(report)
  const m = cardsByRsid(cards)
  const bucket = (key) => NUTRITION_RULES[key]
    .filter((r) => {
      try { return r.test(m, cards) } catch { return false }
    })
    .map((r) => ({ text: r.text, gene: r.gene, isGeneral: !r.rsids?.length }))
  return {
    prioritize: bucket('prioritize'),
    mindful:    bucket('mindful'),
    timing:     bucket('timing'),
  }
}

/* ---------------------------- Next Steps ---------------------------- */

function lsJson(key, fb) {
  if (typeof window === 'undefined') return fb
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb }
}
function lsStr(key) {
  if (typeof window === 'undefined') return null
  try { return window.localStorage.getItem(key) } catch { return null }
}
function ssHas(key) {
  if (typeof window === 'undefined') return false
  try { return window.sessionStorage.getItem(key) != null } catch { return false }
}

// Returns [{ id, text, href, done, onClick? }]
export function getNextSteps() {
  if (typeof window === 'undefined') return []
  const journal    = lsJson('ss_journal', [])
  const reading    = lsJson('ss_reading_list', [])
  const features   = lsJson('ss_features_explored', [])
  const profile    = lsJson('ss_user_profile', null)
  const hasGenome  = ssHas('selfscience_genome_results')

  // Learning path completion — any ss_learning_complete_* == 'true'.
  let anyLearningComplete = false
  let anyLearningIncompleteStarted = false
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (!k) continue
      if (k.startsWith('ss_learning_complete_') && window.localStorage.getItem(k) === 'true') anyLearningComplete = true
      if (/^ss_learning_step[123]_/.test(k) && window.localStorage.getItem(k) === 'true') anyLearningIncompleteStarted = true
    }
  } catch {}

  const steps = []

  steps.push({
    id: 'upload_genome',
    text: 'Upload your genome file to unlock your full Blueprint.',
    href: '/genome',
    done: hasGenome,
  })
  steps.push({
    id: 'complete_quiz',
    text: 'Complete your health profile quiz to personalize your experience.',
    href: null,
    onClickEvent: 'selfscience:open-health-story-quiz',
    done: !!profile?.completed,
  })
  steps.push({
    id: 'practitioner_report',
    text: 'Generate your Practitioner Report to share with your doctor.',
    href: '/practitioner-report',
    done: !!lsStr('ss_first_practitioner') || features.includes('practitioner-report'),
  })
  steps.push({
    id: 'log_biomarker',
    text: 'Log your HbA1c or Vitamin D — the blood markers most relevant to your top variants.',
    href: '/biomarkers',
    done: !!lsStr('ss_first_biomarker') || features.includes('biomarkers'),
  })
  steps.push({
    id: 'drug_check',
    text: 'Check your medications against your CYP variants.',
    href: '/drug-check',
    done: !!lsStr('ss_first_drug_check') || features.includes('drug-check'),
  })
  steps.push({
    id: 'learning_path',
    text: anyLearningComplete
      ? 'Explore another pillar’s learning path for structured depth.'
      : 'Complete a pillar learning path to move from curiosity to structured understanding.',
    href: '/',
    done: anyLearningComplete && !anyLearningIncompleteStarted,
  })
  steps.push({
    id: 'start_journal',
    text: 'Start your health journal — record what you notice as you apply your findings.',
    href: '/journal',
    done: journal.length >= 5,
  })
  steps.push({
    id: 'reading_list',
    text: 'Save 3 research papers to build your library.',
    href: '/search',
    done: reading.length >= 3,
  })

  // Return up to 6 undone items first, then all done ones (kept visible per spec).
  const undone = steps.filter((s) => !s.done)
  const done = steps.filter((s) => s.done)
  return [...undone.slice(0, 6), ...done]
}

/* ------------------------- Last-updated timestamp -------------------- */

const TRACKED_KEYS = [
  'ss_journal', 'ss_reading_list', 'ss_features_explored', 'ss_user_profile',
  'ss_achievements', 'ss_digest_cache', 'ss_digest_last_refreshed',
  'ss_first_biomarker', 'ss_first_drug_check', 'ss_first_practitioner',
]

/** Hook: returns a Date reflecting the most recent change to anything the
 *  Blueprint synthesises — including genome (session storage) changes
 *  and any relevant LS write. */
export function useLastUpdated() {
  const [ts, setTs] = useState(() => new Date())
  useEffect(() => {
    const bump = () => setTs(new Date())
    const listeners = [
      'selfscience:journal-changed',
      'selfscience:reading-list-changed',
      'selfscience:achievements-changed',
      'selfscience:genome-changed',
      'selfscience:profile-changed',
    ]
    listeners.forEach((e) => window.addEventListener(e, bump))
    const onStorage = (e) => { if (e?.key && TRACKED_KEYS.includes(e.key)) bump() }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.forEach((e) => window.removeEventListener(e, bump))
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return ts
}
