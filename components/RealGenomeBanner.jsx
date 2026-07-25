'use client'

// /app/components/RealGenomeBanner.jsx
// Phase D · Part 5 — one-time banner shown after a user replaces sample
// data with a real genome upload. Detects the transition by watching for
// a report whose `session_id` differs from the previous sample session,
// then flags `ss_seen_real_upload` so the banner never re-fires on
// subsequent uploads.

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { getGenomeResults } from '@/lib/genomeSession'

const LS_DISMISSED = 'ss_real_genome_banner_dismissed'
const LS_SEEN_SAMPLE = 'ss_seen_sample'  // '1' if the user ever saw sample data
const LS_SEEN_REAL   = 'ss_seen_real_upload'

function isSampleReport(r) {
  if (!r) return false
  // Sample fixtures carry an explicit flag or a session_id starting with "sample".
  if (r.sampleData === true) return true
  const sid = String(r.session_id || '')
  return sid.startsWith('sample')
}

export default function RealGenomeBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const evaluate = () => {
      try {
        if (window.localStorage.getItem(LS_DISMISSED) === '1') return
        const r = getGenomeResults()
        if (!r) return
        const sample = isSampleReport(r)
        if (sample) {
          window.localStorage.setItem(LS_SEEN_SAMPLE, '1')
          return
        }
        // Real report present. Only banner when we've previously seen
        // sample data and haven't already announced real.
        const sawSample = window.localStorage.getItem(LS_SEEN_SAMPLE) === '1'
        const sawReal   = window.localStorage.getItem(LS_SEEN_REAL)   === '1'
        if (sawSample && !sawReal) {
          window.localStorage.setItem(LS_SEEN_REAL, '1')
          setVisible(true)
        }
      } catch {}
    }

    evaluate()
    const onChange = () => evaluate()
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try { window.localStorage.setItem(LS_DISMISSED, '1') } catch {}
    setVisible(false)
  }

  return (
    <div
      role="status"
      className="relative mb-6 flex items-center gap-3 rounded-xl bg-ss-green px-4 py-3 pr-10 text-sm text-white shadow-sm"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20"
      >
        <Check size={16} strokeWidth={3} />
      </span>
      <p className="min-w-0 flex-1 font-medium">
        You&apos;re now viewing your real genome results — not the sample data.
        Welcome to your personalized experience.
      </p>
      <button
        type="button"
        aria-label="Dismiss real-genome banner"
        onClick={dismiss}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  )
}
