// /app/components/biomarkers/EmptyStateOnboarding.jsx
// Guided starting-state card shown when the user has entered zero values.
// Sets expectations before the form: what the tool does, what data to
// bring, and how the genome upload changes the experience.

'use client'

import { FileText, Dna, TestTube2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  {
    icon: TestTube2,
    title: 'Bring a recent basic panel',
    body: 'Even 3–4 values (HbA1c, ApoB, hs-CRP, vitamin D) surface useful patterns. You don’t need to fill in all 17.',
  },
  {
    icon: FileText,
    title: 'Interpret patterns, not isolated numbers',
    body: 'Every biomarker links to related markers. A single value in isolation rarely tells the story — clusters and trends do.',
  },
  {
    icon: Dna,
    title: 'Upload a genome for personalized context',
    body: 'Once uploaded, we cross-reference each biomarker against variants with meaningful published associations (MTHFR→homocysteine, HFE→ferritin, APOE→lipids, etc.).',
  },
  {
    icon: ShieldCheck,
    title: 'Educational, not diagnostic',
    body: 'Every range shown is traceable to a source and a confidence label. This is a discussion tool for you and your clinician — never a diagnosis.',
  },
]

export function EmptyStateOnboarding() {
  return (
    <div className="rounded-2xl border-l-4 border-ss-teal bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60 md:p-8">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ss-orange">Start here</div>
      <h2 className="mt-1 text-2xl font-extrabold text-ss-teal md:text-3xl">
        How to get the most out of this tool
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ss-muted">
        Enter what you have. The panel is designed to be useful with 3 values or 17 — and to make uncertainty visible rather than hidden.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-sm font-bold text-ss-teal">{title}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-ss-muted">{body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
        <Link
          href="/genome"
          className="inline-flex items-center gap-1 rounded-full border-2 border-ss-teal px-3 py-1 font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
        >
          <Dna size={12} /> Upload genome (optional)
        </Link>
        <span className="text-ss-muted">or scroll down and start typing what you have.</span>
      </div>
    </div>
  )
}

export default EmptyStateOnboarding
