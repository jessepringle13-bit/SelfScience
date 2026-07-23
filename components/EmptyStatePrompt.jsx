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
import { ArrowRight } from 'lucide-react'

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
    </section>
  )
}
