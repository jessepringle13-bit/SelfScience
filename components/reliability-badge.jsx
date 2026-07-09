'use client'

import { ShieldCheck, Sparkles, AlertCircle } from 'lucide-react'

/**
 * Reliability visualization for scientific evidence.
 * Replaces the old cell-signal bars with a clearer evidence-rating badge:
 *   - shield icon + level word (color-graded)
 *   - N/5 chip on the right
 *   - horizontal gradient meter with 4 tick marks
 *   - Preliminary ↔ Moderate ↔ Excellent scale labels
 *   - one-line note describing the score reason
 */

export const RELIABILITY_LEVELS = [
  { color: '#964219', bg: '#FBEEE4', word: 'Preliminary', desc: 'Very limited evidence' },
  { color: '#B07D00', bg: '#FBF3DC', word: 'Limited', desc: 'Cautious interpretation advised' },
  { color: '#5F6A6D', bg: '#EDEEEC', word: 'Moderate', desc: 'Reasonable evidence' },
  { color: '#2E7D32', bg: '#E4F1E5', word: 'Strong', desc: 'Well-supported evidence' },
  { color: '#1B474D', bg: '#E1EEEF', word: 'Excellent', desc: 'Gold-standard evidence' },
]

export function levelForScore(score) {
  const idx = Math.min(Math.max((score || 3) - 1, 0), 4)
  return RELIABILITY_LEVELS[idx]
}

export function ReliabilityBadge({ score, label, note }) {
  const lvl = levelForScore(score)
  const percent = (score / 5) * 100
  const word = label && typeof label === 'string' ? label : lvl.word

  return (
    <div
      className="rounded-md border p-3"
      style={{ background: lvl.bg, borderColor: lvl.color + '33' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} style={{ color: lvl.color }} />
          <span
            className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color: lvl.color }}
          >
            {word} Evidence
          </span>
        </div>
        <span
          className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-bold ring-1"
          style={{ color: lvl.color, boxShadow: 'none', borderColor: 'transparent' }}
        >
          {score}/5
        </span>
      </div>

      {/* Meter with tick marks */}
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-black/5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: lvl.color }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[19%]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1 w-px bg-black/25" />
          ))}
        </div>
      </div>

      <div className="mt-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.08em] text-ss-muted">
        <span>Preliminary</span>
        <span>Moderate</span>
        <span>Excellent</span>
      </div>

      {note ? (
        <p className="mt-2 border-t border-black/5 pt-2 text-[11.5px] italic leading-snug text-ss-muted">
          {note}
        </p>
      ) : null}
    </div>
  )
}

export function ReliabilityPending() {
  return (
    <div className="rounded-md border border-dashed border-ss-teal/30 bg-ss-privacy-tint/60 p-3">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-ss-teal">
        <Sparkles size={13} className="animate-pulse" />
        Evaluating reliability…
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-black/5">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-ss-teal/50" />
      </div>
      <div className="mt-1 text-[10px] italic text-ss-muted">
        AI is scoring this study’s design, sample, and evidence quality.
      </div>
    </div>
  )
}

export function ReliabilityError() {
  return (
    <div className="rounded-md border border-ss-amber/30 bg-ss-amber/5 p-3">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-ss-amber">
        <AlertCircle size={13} />
        Analysis unavailable
      </div>
      <div className="mt-1 text-[10.5px] italic text-ss-muted">
        Reliability scoring couldn’t complete for this study. Try again later.
      </div>
    </div>
  )
}
