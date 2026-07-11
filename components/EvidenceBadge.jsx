'use client'

// /app/components/EvidenceBadge.jsx
// Small pill/chip showing evidence strength for a genome variant card. Uses
// the app's `ss-*` brand tokens (green = Established, amber = Preliminary)
// and Tailwind's amber-400/500 for the middle "Emerging" tier since the
// brand palette intentionally doesn't include a dedicated yellow.
//
// Accessible tooltip: an on-hover / on-focus popover with the exact copy
// specified in the feature prompt. Uses `aria-describedby` so screen
// readers announce the description as supplementary content.

import { useId, useState } from 'react'
import { EVIDENCE_TIER_META } from '@/lib/evidenceStrength'

const TIER_STYLES = {
  established: {
    // Success green tint
    className: 'bg-ss-green/10 text-ss-green border-ss-green/30',
  },
  emerging: {
    // Amber (yellow) tone — visually distinct from the brand's warning orange.
    className: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  preliminary: {
    // Muted gray tint
    className: 'bg-ss-muted/10 text-ss-text border-ss-border-warm',
  },
}

export default function EvidenceBadge({ tier }) {
  const meta = EVIDENCE_TIER_META[tier]
  const styles = TIER_STYLES[tier]
  const [visible, setVisible] = useState(false)
  const tooltipId = useId()

  if (!meta || !styles) return null

  return (
    <span className="relative inline-flex">
      <span
        role="button"
        tabIndex={0}
        aria-describedby={tooltipId}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className={`inline-flex cursor-help items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.className}`}
      >
        {meta.label}
      </span>
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 w-64 -translate-x-1/2 rounded-lg bg-ss-text px-3 py-2 text-[11px] font-medium leading-snug text-white shadow-lg"
        >
          {meta.description}
        </span>
      )}
    </span>
  )
}
