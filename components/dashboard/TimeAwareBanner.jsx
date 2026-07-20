'use client'

// /app/components/dashboard/TimeAwareBanner.jsx
// Ambient one-liner beneath the dashboard headline. Time- and
// genome-aware — pulls MTNR1B timing rules from the same nutrition
// genomics rule system used by the Nutrition Hub pinned banner so we
// never hardcode variant/time knowledge in the UI.
//
// Behavior:
//   • MTNR1B GG (or TT interpreted as risk in some maps) present in the
//     user's report → show a note keyed on the current local time.
//   • Within 2 h of the 6:30 PM eating cutoff → 'closing soon' variant.
//   • Morning (before noon) → 'today's window closes by 6:30 PM' variant.
//   • Otherwise (mid-day) → no banner.
//   • No matching variant → render nothing.
//
// Rendered as muted small text — not a colored banner — so it feels
// ambient rather than alarming per spec.

import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { NUTRITION_RULES } from '@/lib/nutritionGenomics'

// Extract the MTNR1B eating cutoff time from the shared rule system so
// the banner and the Nutrition Hub always agree.
function getMtnr1bCutoff() {
  try {
    const rules = NUTRITION_RULES?.mtnr1b_risk?.timing_rules || []
    const cutoffRule = rules.find((r) => r.rule === 'eating_cutoff')
    return cutoffRule?.cutoff_time || '18:30' // fallback
  } catch { return '18:30' }
}

function parseCutoffToMinutes(t) {
  const [h, m] = String(t).split(':').map((n) => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return 18 * 60 + 30
  return h * 60 + m
}

function fmtCutoff(t) {
  const [h, m] = String(t).split(':').map((n) => parseInt(n, 10))
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Detect whether the user carries the MTNR1B risk allele (rs10830963 G).
// Checks both the flattened variants_recognized map and the fullReport
// groups — the same two sources the rest of the dashboard uses.
function detectMtnr1bRisk(report) {
  if (!report) return null
  const check = (v) => {
    if (!v) return false
    const rsid = String(v.rsid || v.id || '').toLowerCase()
    if (rsid !== 'rs10830963') return false
    const gt = String(v.genotype_called || v.genotype || '').toUpperCase()
    // Risk carriers: any G present
    return /G/.test(gt)
  }
  for (const v of report.variants_recognized || []) if (check(v)) return v
  for (const grp of report.fullReport || []) {
    for (const v of grp.variants || []) if (check(v)) return v
  }
  return null
}

export default function TimeAwareBanner({ report }) {
  const risk = useMemo(() => detectMtnr1bRisk(report), [report])

  // Re-check the current time every minute so the banner shifts phase
  // (morning → warning) without a page refresh.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!risk) return null

  const cutoff = getMtnr1bCutoff()
  const cutoffMin = parseCutoffToMinutes(cutoff)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const cutoffLabel = fmtCutoff(cutoff)

  let message = null
  // "Within 2 h of eating cutoff" — actively closing.
  if (nowMin >= cutoffMin - 120 && nowMin < cutoffMin + 60) {
    message = (
      <>
        <span aria-hidden="true">⏰</span>{' '}
        Your eating window closes at <strong className="font-semibold text-ss-teal">{cutoffLabel}</strong> tonight —
        your MTNR1B variant makes this your highest-impact daily rule.
      </>
    )
  } else if (now.getHours() < 12) {
    // Morning framing.
    message = (
      <>
        Good morning. Your MTNR1B variant means today's eating window should close by{' '}
        <strong className="font-semibold text-ss-teal">{cutoffLabel}</strong>.
      </>
    )
  }

  if (!message) return null

  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-ss-muted md:text-sm">
      <Clock size={13} className="shrink-0 text-ss-teal/70" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
