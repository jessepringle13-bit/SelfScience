'use client'

// /app/components/EmptyStatePrompt.jsx
// Phase B · Part 6 — reusable empty-state card that follows a consistent
// pattern across every tool page that requires a genome upload:
//
//   [Icon]
//   [Why it's empty — 1 sentence]
//   [Action button]
//   [Reassurance — one short line]
//
// Usage:
//   <EmptyStatePrompt
//     emoji="🥦"
//     headline="Upload your genome file to see which foods work best for your genes."
//     ctaLabel="Upload Your File →"
//     ctaHref="/genome"
//     reassurance="Your file is read locally — we never store your raw DNA."
//   />
//
// If already-uploaded users could land here (e.g. dashboard summary said
// results were ready but the tool sees no report yet), pass
// alreadyUploaded="…" for the small greyed line ABOVE the emoji.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Compass } from 'lucide-react'
import { showGuideAgain, fireToast } from '@/lib/journeyReset'

export default function EmptyStatePrompt({
  emoji,
  Icon,
  headline,
  ctaLabel = 'Upload Your File →',
  ctaHref  = '/genome',
  reassurance = 'Takes less than 1 minute. Your data never leaves your device.',
  alreadyUploaded,
  className = '',
}) {
  return (
    <section
      className={`mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-ss-border-warm bg-white/60 px-6 py-10 text-center shadow-sm ${className}`}
      aria-label="Feature requires genome upload"
    >
      {alreadyUploaded && (
        <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ss-muted">
          {alreadyUploaded}
        </p>
      )}

      <div aria-hidden="true" className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ss-green/10 text-3xl">
        {Icon ? <Icon size={28} className="text-ss-green" strokeWidth={1.75} /> : (emoji || '🧬')}
      </div>

      <h2 className="max-w-md text-lg font-extrabold leading-snug text-ss-teal">
        {headline}
      </h2>

      <Link
        href={ctaHref}
        aria-label={ctaLabel}
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-ss-green px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-green/90"
      >
        {ctaLabel} <ArrowRight size={14} />
      </Link>

      <p className="mt-4 text-xs text-ss-muted">
        {reassurance}
      </p>
      {/* Phase D · Part 3 · Location B — surfaces the Guide only when
          the user has explicitly hidden it. Silent otherwise so we
          don't clutter the empty state. */}
      <ReopenGuideLink />
    </section>
  )
}

function ReopenGuideLink() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      try { setHidden(window.localStorage.getItem('ss_guide_dismissed') === '1') } catch {}
    }
    check()
    window.addEventListener('selfscience:guide-changed', check)
    return () => window.removeEventListener('selfscience:guide-changed', check)
  }, [])
  if (!hidden) return null
  return (
    <button
      type="button"
      onClick={() => { showGuideAgain(); fireToast('Guide reopened') }}
      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline"
    >
      <Compass size={12} /> Need help getting started? Reopen the guide →
    </button>
  )
}
