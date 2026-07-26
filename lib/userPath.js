'use client'

// /app/lib/userPath.js
// Onboarding quiz output + Guided/Explorer mode gating.
// All state client-side under ss_user_path + ss_mode.

import { useEffect, useState } from 'react'

export const LS_PATH = 'ss_user_path'
export const LS_MODE = 'ss_mode'
export const LS_QUIZ_SKIPPED_ONCE = 'ss_quiz_skipped_once'
export const LS_MODULE_PROGRESS = 'ss_learning_progress'
export const CHANGE_EVENT = 'selfscience:path-changed'

export const GOALS = [
  { id: 'energy',      label: 'Energy',              hint: 'Fatigue, stamina, day-to-day drive' },
  { id: 'longevity',   label: 'Longevity',           hint: 'Healthspan, aging, prevention' },
  { id: 'performance', label: 'Performance',         hint: 'Training, recovery, athletic output' },
  { id: 'sleep',       label: 'Sleep',               hint: 'Falling asleep, staying asleep, quality' },
  { id: 'hormones',    label: 'Hormones',            hint: 'Cortisol, thyroid, sex hormones' },
  { id: 'metabolism',  label: 'Metabolism',          hint: 'Blood sugar, body composition, appetite' },
  { id: 'cognition',   label: 'Cognition',           hint: 'Focus, memory, mental clarity' },
  { id: 'supplements', label: 'Supplements',         hint: 'What to take, when, why' },
  { id: 'genome',      label: 'My genome broadly',   hint: 'Just curious what it says' },
]

export const LITERACY = [
  { id: 'beginner', label: 'Curious beginner' },
  { id: 'reading',  label: 'Some reading' },
  { id: 'basics',   label: 'I know the basics' },
  { id: 'advanced', label: "I'm advanced" },
]

export const MOTIVATIONS = [
  { id: 'curiosity',  label: 'Curiosity' },
  { id: 'symptom',    label: "A symptom I'm working through" },
  { id: 'prevention', label: 'Preventing something' },
  { id: 'family',     label: 'Family history' },
  { id: 'optimizing', label: 'Optimizing what already works' },
]

export const STYLES = [
  { id: 'paragraphs', label: 'Read short paragraphs' },
  { id: 'evidence',   label: 'Study the evidence' },
  { id: 'visual',     label: 'See it visually' },
  { id: 'practical',  label: 'Practical steps only' },
]

export const CADENCE = [
  { id: '15min',    label: '15 min' },
  { id: '30min',    label: '30 min' },
  { id: '1hr',      label: '1 hour' },
  { id: 'whenever', label: 'Whenever' },
]

function fire() { try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {} }

export function readPath() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LS_PATH)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function savePath(p) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_PATH, JSON.stringify(p))
    fire()
  } catch {}
}

export function usePath() {
  const [p, setP] = useState(null)
  useEffect(() => {
    const load = () => setP(readPath())
    load()
    const onCh = () => load()
    const onStorage = (e) => { if (e?.key === LS_PATH) load() }
    window.addEventListener(CHANGE_EVENT, onCh)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onCh)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return p
}

export function readMode() {
  if (typeof window === 'undefined') return 'explorer'
  try {
    const m = window.localStorage.getItem(LS_MODE)
    if (m === 'guided' || m === 'explorer') return m
  } catch {}
  // Default: new users start guided, returning users (any prior state) stay explorer.
  const hasGenome  = typeof window !== 'undefined' && (window.sessionStorage.getItem('selfscience_genome_results') || window.localStorage.getItem('ss_features_explored'))
  return hasGenome ? 'explorer' : 'guided'
}

export function setMode(m) {
  if (m !== 'guided' && m !== 'explorer') return
  try { window.localStorage.setItem(LS_MODE, m); fire() } catch {}
}

export function useMode() {
  const [m, setM] = useState('explorer')
  useEffect(() => {
    const load = () => setM(readMode())
    load()
    const onCh = () => load()
    window.addEventListener(CHANGE_EVENT, onCh)
    return () => window.removeEventListener(CHANGE_EVENT, onCh)
  }, [])
  return m
}

// Priority module chain for a given primary goal. Universal 3 first,
// then the goal-specific chain (V2 will expand). For MVP we just
// return the universal 3 for every user.
export function modulePathFor(_primary) {
  return ['foundations', 'genes', 'biomarkers']
}

// Graduation: any 2 triggers Explorer nudge.
export function graduationSignals() {
  if (typeof window === 'undefined') return { ready: false, count: 0, signals: [] }
  const signals = []
  try {
    const progress = JSON.parse(window.localStorage.getItem(LS_MODULE_PROGRESS) || '{}')
    const done = Object.values(progress).filter((v) => v?.completedAt).length
    if (done >= 3) signals.push('3+ modules complete')
    const explored = JSON.parse(window.localStorage.getItem('ss_explored_findings') || '[]')
    if (Array.isArray(explored) && explored.length >= 1) signals.push('Explored a finding')
    if (window.sessionStorage.getItem('selfscience_genome_results')) signals.push('Genome loaded')
    const goals = JSON.parse(window.localStorage.getItem('ss_goals') || '[]')
    if (goals.length >= 1) signals.push('Set a goal')
  } catch {}
  return { ready: signals.length >= 2, count: signals.length, signals }
}

export function useGraduation() {
  const [g, setG] = useState({ ready: false, count: 0, signals: [] })
  useEffect(() => { setG(graduationSignals()) }, [])
  return g
}
