'use client'
// Non-medical, non-prescriptive advisory. Anchored at top of every supplement page.
import { ShieldAlert } from 'lucide-react'

export default function AdvisoryBanner({ compact = false }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/70 text-amber-900">
      <div className={compact ? 'flex items-start gap-3 p-3' : 'flex items-start gap-3 p-4 md:p-5'}>
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-700" />
        <div className="text-sm leading-snug">
          <p className="font-semibold">
            Educational information only. Not medical advice.
          </p>
          <p className="mt-1 text-amber-800">
            SelfScience does not diagnose, treat, cure, or prevent any disease and does not
            prescribe supplements. Product data is sourced from the NIH Dietary Supplement
            Label Database (DSLD). Talk to a licensed clinician before starting any supplement,
            especially if you are pregnant, nursing, on medications, or managing a health condition.
          </p>
        </div>
      </div>
    </div>
  )
}
