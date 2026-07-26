// /app/lib/learningModules.js
// Learning module registry + progress tracking. Content drafted from
// research consensus. Voice: teacher first, interpreter second.

'use client'
import { useEffect, useState } from 'react'
import { LS_MODULE_PROGRESS, CHANGE_EVENT } from '@/lib/userPath'

export const MODULES = [
  {
    id: 'foundations',
    order: 1,
    title: 'How SelfScience Works',
    subtitle: 'The mental model behind everything you’ll see here.',
    readMinutes: 4,
    hook: 'SelfScience is not a health tracker. It’s a translator between three things: your biology, the research literature, and what to actually do about it.',
    why: (goal) => `Before we personalize anything to your ${goal || 'goal'}, it helps to know how the platform thinks. Once you understand the model, every insight you see later will feel earned instead of arbitrary.`,
    mentalModel: {
      heading: 'The three-layer model',
      body: 'SelfScience shows you findings on three layers, always in this order: (1) what your biology suggests (genome, biomarkers), (2) what the research consensus says about that biology, (3) what a reasonable person would do about it. When any of those three layers is thin — weak evidence, missing data, or unclear action — we tell you. That transparency is the point.',
    },
    dataShows: [
      { label: 'Your genome file', role: 'Tells us what your biology tends toward.' },
      { label: 'Your bloodwork',   role: 'Tells us what your biology is actually doing right now.' },
      { label: 'Neither yet',      role: 'That’s fine. We can still teach you what to look for.' },
    ],
    misconceptions: [
      { myth: 'A genetic finding means it will happen.',       truth: 'Almost all common variants nudge probability, not destiny.' },
      { myth: 'More data always equals better answers.',       truth: 'The right data for your question beats a firehose of unrelated data.' },
      { myth: 'One study proves it.',                          truth: 'Single studies are hypotheses. Consensus across independent studies is evidence.' },
    ],
    nextStep: 'Read module 2 — what your genes can and cannot tell you.',
    nextModuleId: 'genes',
    sources: ['Ioannidis 2005 (single-study limits)', 'GWAS Catalog (variant effect sizes)', 'NHGRI plain-language framing'],
  },
  {
    id: 'genes',
    order: 2,
    title: 'What Your Genes Can and Cannot Tell You',
    subtitle: 'The honest limits and real value of your genome file.',
    readMinutes: 5,
    hook: 'Your genome is a probability document, not a prophecy. Learn where it’s powerful, where it’s weak, and why the second matters as much as the first.',
    why: (goal) => `If your primary interest is ${goal || 'your health'}, knowing which questions genetics can answer well — and which it can’t — saves you from chasing wrong signals later.`,
    mentalModel: {
      heading: 'Effect size is everything',
      body: 'The vast majority of common gene variants change your risk or response by a small amount — typically a factor of 1.1x to 1.4x. A handful of variants (like MTHFR, APOE, or pharmacogenetic markers) change outcomes meaningfully. The rest are context. When SelfScience shows you a variant, we tell you the effect size, the confidence tier, and whether it’s actionable.',
    },
    dataShows: [
      { label: 'Pharmacogenetics',       role: 'Strong. Drug metabolism variants (SLCO1B1, CYP2C19, TPMT) genuinely change medication decisions.' },
      { label: 'Nutrient handling',      role: 'Moderate. MTHFR, FADS1, BCMO1 change how you process folate, omega-3s, vitamin A.' },
      { label: 'Common complex traits',  role: 'Weak individually, meaningful in aggregate. Depression, heart disease, longevity — no single gene explains much.' },
      { label: 'Rare disease',            role: 'Not what SelfScience is for. See a medical genetics specialist.' },
    ],
    misconceptions: [
      { myth: '23andMe told me I have the “Alzheimer’s gene”.',    truth: 'APOE4 raises risk. Most APOE4 carriers do not develop Alzheimer’s. Lifestyle changes the trajectory more than the variant.' },
      { myth: 'Genetic tests give you a permanent answer.', truth: 'Your genome doesn’t change, but the science interpreting it does. We update as consensus shifts.' },
      { myth: 'Ancestry data reveals health risk.',        truth: 'Population frequency ≠ personal risk. It’s useful context, not a diagnosis.' },
    ],
    nextStep: 'Read module 3 — how biomarkers show what’s actually happening right now.',
    nextModuleId: 'biomarkers',
    sources: ['NHGRI GWAS Catalog', 'CPIC pharmacogenetic guidelines', 'Manolio 2009 (missing heritability)'],
  },
  {
    id: 'biomarkers',
    order: 3,
    title: 'How Biomarkers Add Context Your Genes Can’t',
    subtitle: 'Present-state biology completes the picture your genome starts.',
    readMinutes: 5,
    hook: 'Your genome tells us what your biology tends toward. Your bloodwork tells us what your biology is actually doing today. Both matter. Neither is enough alone.',
    why: (goal) => `For ${goal || 'most goals'}, present-state biomarkers are usually the higher-signal data. A recent CBC, lipid panel, and a few targeted markers often tell us more than an entire genome.`,
    mentalModel: {
      heading: 'The genome-biomarker complementarity',
      body: 'Genes suggest tendencies over years. Biomarkers show reality this month. When they agree — the signal is strong. When they disagree — that’s the interesting question. Example: someone with an MTHFR variant that suggests slower folate processing whose homocysteine is nonetheless normal. The genome flagged a risk. The biomarker showed compensation is working. That gap is what SelfScience helps you notice.',
    },
    dataShows: [
      { label: 'Basic panel (CBC, CMP, lipid)',     role: 'Cheapest, highest-signal starting point for almost any goal.' },
      { label: 'Inflammation (hs-CRP, ferritin)',    role: 'Reveals low-grade inflammation invisible on standard panels.' },
      { label: 'Metabolic (HbA1c, fasting insulin)', role: 'Two-decade lead time on metabolic dysfunction. Better than fasting glucose alone.' },
      { label: 'Hormones (in context)',              role: 'Meaningful only interpreted against symptoms, age, and time-of-day.' },
      { label: 'Micronutrients (Vit D, B12, iron)',  role: 'Fill in what genes suggest and diet may not cover.' },
    ],
    misconceptions: [
      { myth: 'Normal range means healthy.',              truth: 'Normal ranges are population averages. Optimal ranges for your goals are often tighter and different.' },
      { myth: 'One test result is the answer.',           truth: 'Biomarkers move with sleep, stress, food, illness. Trends across 2–3 measurements beat single snapshots.' },
      { myth: 'You need every marker to learn anything.', truth: 'Five well-chosen markers tied to your goal beat a 100-marker panel with no framing.' },
    ],
    nextStep: 'You’ve got the foundation. Time to see what your data says about you specifically.',
    nextModuleId: null,
    sources: ['Ridker 2003 (hs-CRP)', 'DeFronzo 2009 (fasting insulin)', 'Institute of Medicine reference ranges'],
  },
]

export function moduleById(id) { return MODULES.find((m) => m.id === id) || null }

function fire() { try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {} }

export function readProgress() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(LS_MODULE_PROGRESS) || '{}') } catch { return {} }
}

export function markModuleComplete(id) {
  if (!id || typeof window === 'undefined') return
  const p = readProgress()
  p[id] = { completedAt: new Date().toISOString() }
  try { window.localStorage.setItem(LS_MODULE_PROGRESS, JSON.stringify(p)); fire() } catch {}
}

export function useModuleProgress() {
  const [p, setP] = useState({})
  useEffect(() => {
    const load = () => setP(readProgress())
    load()
    const onCh = () => load()
    window.addEventListener(CHANGE_EVENT, onCh)
    return () => window.removeEventListener(CHANGE_EVENT, onCh)
  }, [])
  return p
}
