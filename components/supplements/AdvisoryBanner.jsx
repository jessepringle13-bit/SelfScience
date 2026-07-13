'use client'
// Full-text non-medical advisory. No collapse - the entire "SelfScience does
// not diagnose..." language is always visible for trust and legal clarity.
// Compact visual weight (small type, tight padding) but never truncated.
import { ShieldAlert } from 'lucide-react'

export default function AdvisoryBanner() {
  return (
    <aside
      role="note"
      aria-label="Non-medical advisory"
      className="rounded-xl border border-amber-300 bg-amber-50/80 text-amber-900"
    >
      <div className="flex items-start gap-3 p-3 md:p-4">
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-700" />
        <div className="text-sm leading-snug space-y-1">
          <p>
            <strong>Educational information only. Not medical advice.</strong>{' '}
            SelfScience does not diagnose, treat, cure, or prevent any disease
            and does not prescribe supplements.
          </p>
          <p className="text-amber-900/85">
            Product data is sourced from the NIH Dietary Supplement Label Database
            (DSLD). Talk to a licensed clinician before starting any supplement,
            especially if you are pregnant, nursing, on medications, or managing a
            health condition. We link only to official brand stores &mdash; never
            Amazon or third-party marketplaces.
          </p>
        </div>
      </div>
    </aside>
  )
}
