'use client'
// Compact, non-truncating advisory. Shows a one-line pill by default with a
// "Read full advisory" toggle. When expanded, the full non-medical /
// non-prescriptive language becomes visible and stays fully readable at any
// viewport width.
import { useState } from 'react'
import { ShieldAlert, ChevronDown } from 'lucide-react'

export default function AdvisoryBanner() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/70 text-amber-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 md:p-4 text-left"
        aria-expanded={open}
      >
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
        <div className="flex-1 text-sm">
          <span className="font-semibold">Educational information only. Not medical advice.</span>
          <span className="hidden sm:inline ml-1 text-amber-800/80">Talk to a licensed clinician before starting any supplement.</span>
        </div>
        <span className="hidden md:inline text-xs font-semibold text-amber-800/80 whitespace-nowrap">
          {open ? 'Hide advisory' : 'Read full advisory'}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-amber-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm leading-relaxed text-amber-900/90 border-t border-amber-200/70">
          <p>
            SelfScience does not diagnose, treat, cure, or prevent any disease and does not
            prescribe supplements. Product data is sourced from the NIH Dietary Supplement
            Label Database (DSLD) and is provided for educational purposes only. Talk to a
            licensed clinician before starting any supplement, especially if you are pregnant,
            nursing, on medications, or managing a health condition. We link only to official
            brand stores &mdash; never Amazon or third-party marketplaces.
          </p>
        </div>
      )}
    </div>
  )
}
