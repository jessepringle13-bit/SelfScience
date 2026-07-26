'use client'

// /app/components/UnknownsCard.jsx
// Per-finding data-gap surface. Reusable card that identifies the
// single most valuable gap for a specific finding (variant / gene)
// and points the user to the next action. Priority: blood > goal >
// trials. Dismissible per-finding via localStorage.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, TestTube2, Target, FlaskConical } from 'lucide-react'

const DISMISS_PREFIX = 'ss_unknowns_dismissed_'

// Rough gene -> pillar map. Extends the existing pillar taxonomy so
// the goal-gap card can link to /goals with a sensible category.
const GENE_PILLARS = {
  MTHFR: 'nutrients', MTR: 'nutrients', BHMT: 'nutrients', FADS1: 'nutrients', BCMO1: 'nutrients',
  HFE: 'nutrients', TCN2: 'nutrients', SLC23A1: 'nutrients',
  APOE: 'longevity', FOXO3: 'longevity',
  ACTN3: 'performance', ACE: 'performance', PPARGC1A: 'performance', COL5A1: 'performance', COL1A1: 'performance',
  PER3: 'sleep', CLOCK: 'sleep', MTNR1B: 'sleep',
  TCF7L2: 'metabolism',
  COMT: 'cognition', BDNF: 'cognition',
  SLCO1B1: 'pharmacogenetics', CYP2C19: 'pharmacogenetics', TPMT: 'pharmacogenetics', CYP2D6: 'pharmacogenetics',
}

// Rough gene -> plain-English biological effect for the blood-gap
// prose. Falls back to a generic phrase for unknown genes.
const GENE_EFFECT = {
  MTHFR: 'how your body processes folate and B-vitamins',
  MTR:   'how your body recycles B12 and folate',
  BHMT:  'a backup methylation pathway used when folate is low',
  FADS1: 'how efficiently you convert plant omega-3s into EPA/DHA',
  BCMO1: 'how efficiently you convert beta-carotene into vitamin A',
  HFE:   'how your body absorbs and stores iron',
  APOE:  'how your body handles LDL cholesterol and lipid metabolism',
  TCF7L2:'your baseline risk of insulin resistance',
  COMT:  'how quickly your brain clears dopamine — shapes stress response',
  BDNF:  'growth signalling in the brain — shapes learning and mood',
  MTNR1B:'how melatonin regulates late-evening insulin',
  ACTN3: 'the balance between power-fibre and endurance-fibre muscle',
  SLCO1B1:'how you clear statin-class medications',
  CYP2C19:'how you metabolise clopidogrel and PPIs',
  TPMT:   'how you clear thiopurine medications',
  CYP2D6: 'how you metabolise codeine, tramadol and many antidepressants',
}

// Suggested biomarker panel per gene family. Keeps the copy specific.
const GENE_PANEL = {
  MTHFR: 'homocysteine + serum B12 + RBC folate',
  MTR:   'homocysteine + methylmalonic acid',
  FADS1: 'omega-3 index',
  HFE:   'ferritin + transferrin saturation',
  APOE:  'ApoB + LDL-P',
  TCF7L2:'fasting insulin + HbA1c',
  MTNR1B:'HbA1c + fasting insulin',
  BCMO1: 'serum vitamin A + beta-carotene',
  COMT:  'homocysteine + magnesium',
  SLCO1B1:'baseline CK and lipid panel',
}

function readSet(key) {
  try { return JSON.parse(window.localStorage.getItem(key) || '{}') } catch { return {} }
}
function readAny(key, fallback = null) {
  try {
    const v = window.localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export default function UnknownsCard({ findingId, variant, goal, compact = false }) {
  const [dismissed, setDismissed] = useState(true) // start hidden until we've checked LS (SSR-safe)
  const [ready, setReady]         = useState(false)
  const [hasBlood, setHasBlood]   = useState(true) // default true so we don't over-surface
  const [hasGoal, setHasGoal]     = useState(true)

  useEffect(() => {
    // Client-side probe: has this specific finding been dismissed?
    const id = String(findingId || variant?.rsid || variant?.geneSymbol || '')
    setDismissed(!!window.localStorage.getItem(DISMISS_PREFIX + id))

    // Check blood-gap: do we have any biomarker data in ss_biomarkers?
    const bio = readAny('ss_biomarkers') || readAny('ss_blood_data')
    setHasBlood(!!bio && Object.keys(bio || {}).length > 0)

    // Check goal-gap: any goal in ss_goals for this variant's pillar?
    const gene = (variant?.geneSymbol || '').toUpperCase()
    const pillar = GENE_PILLARS[gene] || null
    const goals = readAny('ss_goals') || readSet('ss_goals')
    const list = Array.isArray(goals) ? goals : Object.values(goals || {})
    const hasG = pillar && list.some((g) => (g?.category || g?.pillar || '').toLowerCase() === pillar)
    setHasGoal(!pillar || hasG)

    setReady(true)
  }, [findingId, variant])

  if (!ready || dismissed) return null

  const gene   = (variant?.geneSymbol || '').toUpperCase() || 'this gene'
  const rsid   = variant?.rsid || findingId || ''
  const pillar = GENE_PILLARS[gene] || 'genomics'

  // Priority: blood > goal > trials. We render blood-gap when the
  // finding is genome-based AND the user has no biomarker data logged.
  // Goal-gap when the user has no goal in the finding’s pillar. We
  // do not currently ship a trials feed inside this component; if a
  // future trial-availability signal is provided via props we can add
  // it here.
  let gap = null
  if (!hasBlood) gap = 'blood'
  else if (!hasGoal) gap = 'goal'
  if (!gap) return null

  const dismiss = () => {
    const id = String(findingId || variant?.rsid || variant?.geneSymbol || '')
    try { window.localStorage.setItem(DISMISS_PREFIX + id, '1') } catch {}
    setDismissed(true)
  }

  // ---------------- Compact single-line strip ----------------
  if (compact) {
    const strip = gap === 'blood'
      ? { text: `A blood test would sharpen what ${gene} means for you.`,     href: '/get-started#blood',              cta: 'Blood options →' }
      : { text: `Set a goal in ${pillar} to make this finding actionable.`,   href: `/goals?new=1&category=${pillar}&variant=${encodeURIComponent(rsid)}`, cta: 'Set goal →' }
    return (
      <div className="flex items-center gap-2 py-1.5 text-[13px]">
        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-ss-amber" />
        <span className="min-w-0 flex-1 truncate text-ss-text">{strip.text}</span>
        <Link href={strip.href} className="whitespace-nowrap font-semibold text-ss-teal hover:underline">{strip.cta}</Link>
      </div>
    )
  }

  // ---------------- Full card ----------------
  const content = gap === 'blood'
    ? {
        heading: 'A blood test would tell you more about this variant.',
        body: `Variants in ${gene} affect ${GENE_EFFECT[gene] || 'a biological pathway'}. A ${GENE_PANEL[gene] || 'targeted biomarker'} test would show you the real-world impact.`,
        href: '/get-started#blood',
        cta: 'See blood test options',
        Icon: TestTube2,
      }
    : {
        heading: 'You haven’t set a goal connected to this finding yet.',
        body: `This finding relates to ${pillar}. Setting a goal here turns this data point into something you can actually act on.`,
        href: `/goals?new=1&category=${pillar}&variant=${encodeURIComponent(rsid)}`,
        cta: 'Set a goal for this finding',
        Icon: Target,
      }

  return (
    <div
      className="relative mt-3 rounded-xl border border-ss-teal/40 border-l-[3px] border-l-ss-amber p-4 pl-4"
      style={{ backgroundColor: 'rgba(14,122,110,0.05)' }}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded p-1 text-ss-muted transition hover:text-ss-text"
        aria-label="Dismiss this gap card"
      >
        <X size={11} />
      </button>
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ss-amber">What’s missing</div>
      <div className="mt-1.5 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ss-amber/15 text-ss-amber">
          <content.Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[14.5px] font-bold leading-snug text-ss-text">{content.heading}</h4>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ss-text">{content.body}</p>
          <Link href={content.href} className="mt-2 inline-block text-[13.5px] font-semibold text-ss-teal hover:underline">
            → {content.cta}
          </Link>
        </div>
      </div>
    </div>
  )
}
