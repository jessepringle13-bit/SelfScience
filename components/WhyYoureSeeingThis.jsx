'use client'

// /app/components/WhyYoureSeeingThis.jsx
// Universal explainer footer. Shows a small collapsed link that
// expands to reveal the reasoning behind a recommendation or insight.
// Reused across My Path, Insights, module recommendations.

import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'

export default function WhyYoureSeeingThis({ items = [], improveWith = null, className = '' }) {
  const [open, setOpen] = useState(false)
  if (!items.length) return null
  return (
    <div className={`mt-4 rounded-lg border border-ss-border-warm/60 bg-ss-bg/40 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-ss-bg"
      >
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">
          <Info size={11} /> Why you're seeing this
        </span>
        <ChevronDown size={12} className={`text-ss-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-ss-border-warm/60 px-3 py-3 text-[12.5px] leading-relaxed text-ss-text">
          <ul className="space-y-1">
            {items.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ss-teal" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {improveWith && (
            <div className="mt-2 border-t border-dashed border-ss-border-warm/60 pt-2 text-[11.5px] text-ss-muted">
              <span className="font-semibold text-ss-teal">Confidence would improve with:</span> {improveWith}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
