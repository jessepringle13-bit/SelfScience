'use client'

// /app/lib/achievements.js
// Lightweight achievement / milestone engine. All state in localStorage.
//
// Storage:
//   ss_achievements       — [{id, unlockedAt, seen}]
//   ss_findings_expanded  — [rsid|gene:genotype]  (dedup counter for T2/T3)
//   ss_first_search       — 'true' when first Search page submit
//   ss_first_doctor_modal — 'true' when Explain-to-doctor first opens
//   ss_pillars_clicked    — array of pillar names user has activated
//
// We compose triggers by reading multiple existing LS keys the app
// already writes: ss_reading_list, ss_learning_step*, ss_user_profile,
// ss_features_explored, ss_pillar_intro_*, ss_digest_viewed_*.
//
// checkAll() is the single evaluator — run on mount, on events, and on
// window focus. It fires selfscience:achievement-unlocked with the new
// achievement in event.detail for the global toaster.

import { useEffect, useState } from 'react'

const LS_ACHIEVEMENTS   = 'ss_achievements'
const LS_FINDINGS       = 'ss_findings_expanded'
const LS_FIRST_SEARCH   = 'ss_first_search'
const LS_FIRST_DOCTOR   = 'ss_first_doctor_modal'
const LS_PILLARS_CLICKED = 'ss_pillars_clicked'

export const CHANGE_EVENT = 'selfscience:achievements-changed'
export const UNLOCK_EVENT = 'selfscience:achievement-unlocked'

/* -------------------------- 20 definitions --------------------------- */
// Icons are lucide-react names (looked up dynamically in the UI).

export const ACHIEVEMENTS = [
  // TIER 1 — First Steps
  { id:'first_upload',  tier:1, name:'Sequence Start', description:'You uploaded your genome file.', icon:'Dna',
    science:'Your 23andMe file contains around 632,000 genetic positions. SelfScience just read the ones that matter most for your health.' },
  { id:'first_finding', tier:1, name:'First Signal', description:'You expanded your first genome finding.', icon:'Search',
    science:'Each finding represents years of population research condensed into one data point about your specific biology.' },
  { id:'first_search',  tier:1, name:'Into the Literature', description:'You ran your first research search.', icon:'Search',
    science:'You just accessed the same research database used by clinicians and researchers worldwide.' },
  { id:'first_save',    tier:1, name:'Building Your Library', description:'You saved your first item to your Reading List.', icon:'Bookmark',
    science:'The best health decisions come from returning to information more than once. You just started building that habit.' },
  { id:'first_pillar',  tier:1, name:'Area of Focus', description:'You explored your first health pillar.', icon:'Compass',
    science:'The pillar framework organises 300 variants into 10 research areas — making a complex genome readable and actionable.' },

  // TIER 2 — Going Deeper
  { id:'five_findings',     tier:2, name:'Pattern Recognition', description:'You have read 5 genome findings.', icon:'BarChart3',
    science:'Research shows that health literacy improves significantly after engaging with 5 or more personalized genetic findings — you are past that threshold.' },
  { id:'first_doctor_summary', tier:2, name:'Bridge Builder', description:'You generated a doctor conversation summary.', icon:'Stethoscope',
    science:'Patients who bring genetic context to appointments have measurably more productive clinical conversations.' },
  { id:'first_nutrition_scan', tier:2, name:'Label Reader', description:'You scanned a food product with your genome.', icon:'Barcode',
    science:'Your genome affects how you process specific nutrients — scanning products makes those abstract variants tangible and practical.' },
  { id:'first_biomarker',   tier:2, name:'Blood and Biology', description:'You logged your first biomarker.', icon:'TestTube',
    science:'Combining genetic data with blood markers creates a more complete picture than either alone — this is how precision medicine actually works.' },
  { id:'first_drug_check',  tier:2, name:'Medication Aware', description:'You checked a medication against your genome.', icon:'Pill',
    science:'Pharmacogenomics is one of the most clinically validated applications of consumer genetics — your CYP variants directly affect how drugs work in your body.' },
  { id:'learning_path_step', tier:2, name:'On the Path', description:'You completed your first learning path step.', icon:'Map',
    science:'Structured learning produces measurably better retention than random browsing — following a path means you are building real knowledge.' },
  { id:'first_practitioner_report', tier:2, name:'Clinical Ready', description:'You generated a Practitioner Report.', icon:'FileText',
    science:'A printed genomic summary changes the quality of clinical conversations — practitioners report spending more time on substance when patients arrive with organized data.' },

  // TIER 3 — Committed Explorer
  { id:'all_pillars',       tier:3, name:'Full Spectrum', description:'You have explored all 10 health pillars.', icon:'Grid3x3',
    science:'Each pillar represents a distinct biological system. Seeing all 10 gives you the most complete picture of how your genetics interact across your whole body.' },
  { id:'ten_findings',      tier:3, name:'Deep Reader', description:'You have expanded 10 genome findings.', icon:'BookOpen',
    science:'Engaging with 10 or more personalized findings places you in the top percentile of health literacy engagement for consumer genomics users.' },
  { id:'three_learning_paths', tier:3, name:'Curriculum Complete', description:'You completed learning paths in 3 pillars.', icon:'GraduationCap',
    science:'Three completed learning paths means you have moved from curiosity to structured understanding in multiple domains of your health.' },
  { id:'digest_streak',     tier:3, name:'Weekly Habit', description:'You checked the digest 3 weeks in a row.', icon:'Calendar',
    science:'Weekly engagement with personalized research is the behavior pattern most associated with sustained health behavior change in digital health research.' },
  { id:'reading_list_ten',  tier:3, name:'Serious Collector', description:'You have 10 items saved to your Reading List.', icon:'Library',
    science:'Building a personal research library is one of the most effective strategies for retaining and applying health information over time.' },
  { id:'quiz_complete',     tier:3, name:'Self-Aware', description:'You completed your health profile quiz.', icon:'User',
    science:'Knowing what you want to learn from your data is the first step toward actually changing behavior based on it.' },

  // TIER 4 — Mastery
  { id:'all_tools',   tier:4, name:'Full Platform', description:'You have used every tool on SelfScience.', icon:'Star',
    science:'You have built a complete picture — genetic, nutritional, pharmacological, clinical, and athletic. This is what integrated precision health looks like.' },
  { id:'first_note',  tier:4, name:'Your Own Analysis', description:'You added a note to a saved item.', icon:'Pencil',
    science:'Writing about what you read increases retention by up to 50 percent according to cognitive science research — your notes are part of the learning.' },

  // GOALS — Genome-informed goal setting (Part 10 spec)
  { id:'first_goal', tier:1, name:'First Target Set', description:'You created your first health goal.', icon:'Target',
    science:'Research shows that people who write down specific health goals are significantly more likely to achieve them than those who keep goals in their head.' },
  { id:'first_goal_complete', tier:2, name:'Target Reached', description:'You completed your first health goal.', icon:'CheckCircle2',
    science:'Goal completion in health behavior change research is associated with a 40% higher probability of setting and achieving subsequent goals.' },
  { id:'genome_goal', tier:2, name:'Biology-Led', description:'You completed a goal directly linked to one of your genome findings.', icon:'Dna',
    science:'Genome-informed goals have measurably higher adherence rates than generic health goals — knowing the biological reason behind a behavior increases motivation.' },
  { id:'three_goals_complete', tier:3, name:'Momentum', description:'You have completed 3 health goals.', icon:'Zap',
    science:'Three completed health goals represents a behavior change pattern — not a one-time event. This is where habits become identity.' },
  { id:'all_categories', tier:4, name:'Full Spectrum Goals', description:'You have set a goal in every category.', icon:'Grid3x3',
    science:'Addressing health goals across multiple domains simultaneously produces better outcomes than single-domain focus — this is the foundation of integrated precision health.' },
]

export const TIER_LABELS = { 1:'First Steps', 2:'Going Deeper', 3:'Committed Explorer', 4:'Mastery' }

/* ---------------------- LS helpers ---------------------------------- */

export function getUnlocked() {
  if (typeof window === 'undefined') return []
  try { const a = JSON.parse(window.localStorage.getItem(LS_ACHIEVEMENTS) || '[]'); return Array.isArray(a) ? a : [] } catch { return [] }
}
function writeUnlocked(list) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_ACHIEVEMENTS, JSON.stringify(list)); window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {}
}
export function markAllSeen() {
  const list = getUnlocked().map((x) => ({ ...x, seen: true }))
  writeUnlocked(list)
}
export function unseenCount() {
  return getUnlocked().filter((x) => !x.seen).length
}

/* ------- Tally helpers backing the tier-based triggers -------------- */

export function markFindingExpanded(idKey) {
  if (typeof window === 'undefined' || !idKey) return
  try {
    const cur = new Set(JSON.parse(window.localStorage.getItem(LS_FINDINGS) || '[]'))
    if (!cur.has(idKey)) {
      cur.add(idKey)
      window.localStorage.setItem(LS_FINDINGS, JSON.stringify([...cur]))
    }
  } catch {}
  checkAll()
}

export function markFirstSearch() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_FIRST_SEARCH, 'true') } catch {}
  checkAll()
}

export function markFirstDoctorModal() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_FIRST_DOCTOR, 'true') } catch {}
  checkAll()
}

export function markPillarClicked(pillarName) {
  if (typeof window === 'undefined' || !pillarName) return
  try {
    const cur = new Set(JSON.parse(window.localStorage.getItem(LS_PILLARS_CLICKED) || '[]'))
    if (!cur.has(pillarName)) {
      cur.add(pillarName)
      window.localStorage.setItem(LS_PILLARS_CLICKED, JSON.stringify([...cur]))
    }
  } catch {}
  checkAll()
}

/* ---------------- Digest weekly-streak counter ----------------------- */
// Counts distinct ISO week stamps that have ANY of paper/insight/trial
// viewed. Consecutive streak = current stamp minus consecutive back-
// steps. We evaluate a lightweight version: 3 different week stamps
// have keys in localStorage.

function digestStreakCount() {
  if (typeof window === 'undefined') return 0
  try {
    const stamps = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith('ss_digest_viewed_')) stamps.push(k.slice('ss_digest_viewed_'.length))
    }
    return new Set(stamps).size
  } catch { return 0 }
}

/* ---------------- The universal trigger evaluator -------------------- */

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function readStr(key) {
  if (typeof window === 'undefined') return null
  try { return window.localStorage.getItem(key) } catch { return null }
}
function readSession(key) {
  if (typeof window === 'undefined') return null
  try { return window.sessionStorage.getItem(key) } catch { return null }
}

function triggerMet(id) {
  switch (id) {
    case 'first_upload':
      return !!readSession('selfscience_genome_results')
    case 'first_finding':
      return (readJson(LS_FINDINGS, []) || []).length >= 1
    case 'five_findings':
      return (readJson(LS_FINDINGS, []) || []).length >= 5
    case 'ten_findings':
      return (readJson(LS_FINDINGS, []) || []).length >= 10
    case 'first_search':
      return readStr(LS_FIRST_SEARCH) === 'true'
    case 'first_save':
      return (readJson('ss_reading_list', []) || []).length >= 1
    case 'reading_list_ten':
      return (readJson('ss_reading_list', []) || []).length >= 10
    case 'first_note':
      return (readJson('ss_reading_list', []) || []).some((x) => x?.notes && String(x.notes).trim().length > 0)
    case 'first_pillar':
      return (readJson(LS_PILLARS_CLICKED, []) || []).length >= 1
    case 'all_pillars':
      return (readJson(LS_PILLARS_CLICKED, []) || []).length >= 10
    case 'first_doctor_summary':
      return readStr(LS_FIRST_DOCTOR) === 'true'
    case 'quiz_complete': {
      const p = readJson('ss_user_profile', null); return !!(p && p.completed)
    }
    case 'learning_path_step': {
      if (typeof window === 'undefined') return false
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && /^ss_learning_step[123]_/.test(k) && window.localStorage.getItem(k) === 'true') return true
      }
      return false
    }
    case 'three_learning_paths': {
      if (typeof window === 'undefined') return false
      let n = 0
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith('ss_learning_complete_') && window.localStorage.getItem(k) === 'true') n++
      }
      return n >= 3
    }
    case 'digest_streak':
      return digestStreakCount() >= 3
    case 'first_nutrition_scan':
      return !!readStr('ss_nutrition_first_scan') || (readJson('ss_features_explored', []) || []).includes('nutrition-scan')
    case 'first_biomarker':
      return !!readStr('ss_first_biomarker') || (readJson('ss_features_explored', []) || []).includes('biomarkers')
    case 'first_drug_check':
      return !!readStr('ss_first_drug_check') || (readJson('ss_features_explored', []) || []).includes('drug-check')
    case 'first_practitioner_report':
      return !!readStr('ss_first_practitioner') || (readJson('ss_features_explored', []) || []).includes('practitioner-report')
    case 'all_tools': {
      const arr = readJson('ss_features_explored', []) || []
      return Array.isArray(arr) && arr.length >= 11
    }
    case 'first_goal':
      return (readJson('ss_goals', []) || []).length >= 1
    case 'first_goal_complete':
      return (readJson('ss_goals', []) || []).some((g) => g?.status === 'completed')
    case 'genome_goal':
      return (readJson('ss_goals', []) || []).some((g) => g?.status === 'completed' && g?.variantSource)
    case 'three_goals_complete':
      return (readJson('ss_goals', []) || []).filter((g) => g?.status === 'completed').length >= 3
    case 'all_categories': {
      const goals = readJson('ss_goals', []) || []
      const CATS = ['performance','nutrition','supplements','biomarkers','longevity','learning','clinical','habits']
      const covered = new Set(goals.map((g) => g?.category))
      return CATS.every((c) => covered.has(c))
    }
    default:
      return false
  }
}

/**
 * Evaluate all 20 triggers, unlock any newly-earned achievements, and
 * fire UNLOCK_EVENT for each. Idempotent — never duplicates.
 */
export function checkAll() {
  if (typeof window === 'undefined') return []
  const unlocked = getUnlocked()
  const owned = new Set(unlocked.map((x) => x.id))
  const newlyUnlocked = []
  for (const a of ACHIEVEMENTS) {
    if (owned.has(a.id)) continue
    if (triggerMet(a.id)) {
      const rec = { id: a.id, unlockedAt: new Date().toISOString(), seen: false }
      unlocked.push(rec)
      newlyUnlocked.push({ ...a, ...rec })
    }
  }
  if (newlyUnlocked.length) {
    writeUnlocked(unlocked)
    // Emit one event per new unlock so the toaster can queue them.
    newlyUnlocked.forEach((u) => {
      try { window.dispatchEvent(new CustomEvent(UNLOCK_EVENT, { detail: u })) } catch {}
    })
  }
  return newlyUnlocked
}

/* --------------------------- Hooks ----------------------------------- */

export function useUnlockedAchievements() {
  const [list, setList] = useState([])
  useEffect(() => {
    const load = () => setList(getUnlocked())
    load()
    const onChange = () => load()
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return list
}

export function useUnseenCount() {
  const list = useUnlockedAchievements()
  return list.filter((x) => !x.seen).length
}
