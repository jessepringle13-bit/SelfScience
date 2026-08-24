'use client'

// /app/components/DashboardAccordion.jsx
// Lightweight collapsible section built on <details>/<summary> so it
// works without JS state and is a11y-friendly out of the box.
// Used by Dashboard (Explorer mode) to fold ~12 flat widgets into
// 3 scannable sections. See /app/memory/phase-3-dashboard-slimming-proposal.md
//
// Design tokens: dark card body via ring/background from existing site
// palette, orange accent for badges, teal heading text.

import { ChevronDown } from 'lucide-react'

export default function DashboardAccordion({
  title,
  subtitle,
  defaultOpen = false,
  badge = null,
  children,
  id,
}) {
  return (
    <details
      className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ss-border-warm/60"
      open={defaultOpen}
      id={id}
    >
      <summary
        className="flex list-none cursor-pointer select-none items-center justify-between gap-3 px-5 py-4 transition hover:bg-ss-bg/40 md:px-6 md:py-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold text-ss-teal md:text-xl">
              {title}
            </h2>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-ss-orange/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ss-orange">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-ss-muted">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="flex-shrink-0 text-ss-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="space-y-10 border-t border-ss-border-warm/40 bg-ss-bg/20 px-5 py-6 md:px-6 md:py-8">
        {children}
      </div>
    </details>
  )
}
