'use client'

// /app/components/FeaturesProgressBar.jsx
// Phase D · Part 4 — "Your SelfScience journey · N of 11 features
// explored" bar. Sits on the Dashboard directly under the welcome
// message. Updates in real time via the featuresExplored hook.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FEATURES, useFeaturesExplored } from '@/lib/featuresExplored'

export default function FeaturesProgressBar() {
  const explored = useFeaturesExplored()
  const total = FEATURES.length
  const done  = FEATURES.filter((f) => explored.includes(f.key)).length
  const pct   = Math.min(100, Math.round((done / total) * 100))
  const next  = FEATURES.find((f) => !explored.includes(f.key))

  return (
    <div className="mb-8 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ss-teal">
              Your SelfScience journey
            </div>
            <div className="font-mono text-[11px] text-ss-muted">
              {done} of {total} features explored
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin="0"
            aria-valuemax={total}
            aria-label="Features explored"
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ss-border-warm/40"
          >
            <div
              className="h-full rounded-full bg-ss-green transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {next && (
          <Link
            href={next.href}
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-full bg-ss-green px-4 text-xs font-semibold text-white shadow-sm hover:bg-ss-green/90 md:flex-shrink-0"
            aria-label={`Continue exploring — ${next.label}`}
          >
            Continue exploring <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  )
}
