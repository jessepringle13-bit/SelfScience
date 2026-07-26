'use client'

// /app/components/UnknownsPanel.jsx
// Data-gap → next-best-data recommender. Reads the user path + genome/
// biomarker state and surfaces the single most valuable data collection
// step for their current goal. Not a scary "missing data" nag — an
// invitation to move the needle.

import { useMemo } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Upload, TestTube2, BookOpen, Info } from 'lucide-react'
import { usePath, GOALS } from '@/lib/userPath'
import { useModuleProgress } from '@/lib/learningModules'

function goalLabel(id) { return (GOALS.find((g) => g.id === id) || {}).label?.toLowerCase() || 'your goal' }

// Ranked recommendations per goal. Each entry keyed by data-gap type.
// Explanations are goal-aware where it matters.
const RECS = {
  genome:     { title: 'Upload your genome', href: '/genome', Icon: Upload,     tone: 'teal',
                body: (g) => `A raw 23andMe / AncestryDNA file unlocks the personalised findings that make everything else on SelfScience specific to ${g}. Nothing leaves your browser.` },
  bloodwork:  { title: 'Add recent bloodwork', href: '/biomarkers', Icon: TestTube2, tone: 'orange',
                body: (g) => `Present-state biomarkers are the single highest-signal data source for ${g}. Even a basic CBC + CMP + lipid + hs-CRP tightens interpretation dramatically.` },
  learn:      { title: 'Read the foundation module', href: '/learn/foundations', Icon: BookOpen, tone: 'muted',
                body: () => 'Before we personalise anything, the first module explains how SelfScience translates data into signal. Four minutes, and every later insight lands harder.' },
}

// Goal-specific priority chains for what to collect next.
const PRIORITY = {
  energy:      ['bloodwork', 'genome', 'learn'],
  longevity:   ['bloodwork', 'genome', 'learn'],
  performance: ['genome',    'bloodwork', 'learn'],
  sleep:       ['bloodwork', 'genome', 'learn'],
  metabolism:  ['bloodwork', 'genome', 'learn'],
  cognition:   ['bloodwork', 'genome', 'learn'],
  hormones:    ['bloodwork', 'genome', 'learn'],
  supplements: ['genome',    'bloodwork', 'learn'],
  genome:      ['genome',    'bloodwork', 'learn'],
}

function toneClasses(tone) {
  switch (tone) {
    case 'orange': return { ring: 'border-ss-orange/60 bg-ss-orange/[0.05]', chip: 'bg-ss-orange text-white', label: 'text-ss-orange' }
    case 'teal':   return { ring: 'border-ss-teal/60 bg-ss-teal/[0.05]',     chip: 'bg-ss-teal text-white',   label: 'text-ss-teal' }
    default:       return { ring: 'border-ss-border-warm bg-white',           chip: 'bg-ss-muted/20 text-ss-text', label: 'text-ss-muted' }
  }
}

export default function UnknownsPanel({ className = '' }) {
  const path = usePath()
  const progress = useModuleProgress()

  const gap = useMemo(() => {
    if (typeof window === 'undefined') return null
    const hasGenome = !!path?.data?.hasGenome || !!window.sessionStorage.getItem('selfscience_genome_results')
    const hasBlood  = !!path?.data?.hasBloodwork
    const foundationDone = !!progress?.foundations?.completedAt
    const primary = path?.primary || 'genome'
    const chain = PRIORITY[primary] || PRIORITY.genome
    // Walk the chain, return the first unmet gap.
    for (const key of chain) {
      if (key === 'genome'    && !hasGenome) return 'genome'
      if (key === 'bloodwork' && !hasBlood)  return 'bloodwork'
      if (key === 'learn'     && !foundationDone) return 'learn'
    }
    return null
  }, [path, progress])

  if (!gap) return null
  const rec = RECS[gap]
  const t   = toneClasses(rec.tone)
  const gl  = goalLabel(path?.primary)

  return (
    <section className={`rounded-2xl border-2 ${t.ring} p-5 ${className}`}>
      <div className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${t.label}`}>
        <AlertCircle size={11} /> Your next-best data
      </div>
      <div className="mt-2 flex items-start gap-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.chip}`}>
          <rec.Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold text-ss-text">{rec.title}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ss-text">{rec.body(gl)}</p>
          <Link href={rec.href} className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition ${t.chip} hover:brightness-95`}>
            {rec.title} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 border-t border-ss-border-warm/50 pt-3">
        <Info size={11} className="mt-0.5 shrink-0 text-ss-muted" />
        <p className="text-[11.5px] leading-relaxed text-ss-muted">
          We rank data collection by expected value for <span className="font-semibold text-ss-text">{gl}</span>. As you complete steps this recommendation updates.
        </p>
      </div>
    </section>
  )
}
