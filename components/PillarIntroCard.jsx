'use client'

// /app/components/PillarIntroCard.jsx
// Additive inline card shown the first time the user activates a
// specific pillar filter. Not a modal — renders as the topmost item
// in the filtered content area, above all finding cards.
//
// Behaviour:
//   • Reads localStorage on mount + whenever `pillarName` changes.
//   • If never dismissed for this pillar → fade-in + slide-down 300ms.
//   • On "Got it ↓" click → collapse height + fade-out 200ms, then
//     write ss_pillar_intro_<slug>=true so it never comes back.
//   • `pillarName === null` (All Pillars) → renders nothing.

import { useEffect, useMemo, useRef, useState } from 'react'
import { PILLARS } from '@/components/site-nav'
import { normalizePillarName } from '@/lib/pillars'
import {
  getPillarDescription,
  isPillarIntroDismissed,
  dismissPillarIntro,
  countPillarFindings,
} from '@/lib/pillarIntro'

// Accent colour per pillar. Kept subtle so it works in both light and
// dark themes. Any pillar not listed here falls back to ss-teal.
const PILLAR_ACCENT = {
  'Nutrition':                          '#0E7A6E',
  'Longevity':                          '#8A5FBF',
  'Sports Performance':                 '#C45820',
  'General Wellness':                   '#2E7D32',
  'Pharmacogenomics':                   '#A12C7B',
  'Mental Health & Neurochemistry':     '#3A67B8',
  'Environmental Sensitivity':          '#4A8F4A',
  'Hormones & Endocrine Health':        '#B23A3A',
  'Genomics':                           '#1B474D',
  'Developmental & Lifespan Wellness':  '#B07D00',
}

// hex #RRGGBB → rgba string with the given alpha.
function hexToRgba(hex, alpha) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''))
  if (!m) return `rgba(27,71,77,${alpha})` // fallback ss-teal
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export default function PillarIntroCard({ pillarName, genomeReport }) {
  // "All Pillars" is signalled by null/empty. Skip entirely — per spec.
  const active = !!pillarName

  const dismissed = useMemo(() => (active ? isPillarIntroDismissed(pillarName) : true), [pillarName, active])
  const [hidden, setHidden] = useState(dismissed)     // final unmount signal
  const [entered, setEntered] = useState(false)       // fade-in trigger
  const [leaving, setLeaving] = useState(false)       // fade-out trigger
  const rafRef = useRef(null)

  // When the user toggles pillars, re-run the dismissal check + reset
  // the enter/leave state machine.
  useEffect(() => {
    if (!active) { setHidden(true); return }
    if (isPillarIntroDismissed(pillarName)) { setHidden(true); return }
    setHidden(false)
    setLeaving(false)
    setEntered(false)
    // Fire the entry transition on the next paint so the initial
    // opacity:0 / translateY(-8px) values commit before we flip them.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setEntered(true))
    })
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [pillarName, active])

  const accent = PILLAR_ACCENT[pillarName] || '#1B474D'
  const pillarMeta = PILLARS.find((p) => p.name === pillarName)
  const Icon = pillarMeta?.Icon
  const description = getPillarDescription(pillarName)
  const counts = useMemo(
    () => countPillarFindings(genomeReport, pillarName),
    [genomeReport, pillarName]
  )

  if (hidden) return null

  const handleDismiss = () => {
    dismissPillarIntro(pillarName)
    setLeaving(true)
    // Match the 200ms transition; then unmount so downstream cards
    // reflow into place.
    setTimeout(() => setHidden(true), 220)
  }

  // Enter animation: opacity 0 → 1 (300ms), translateY(-8px) → 0
  // Leave animation: opacity → 0 (200ms), max-height → 0
  const enterStyle = {
    transition:
      'opacity 300ms ease, transform 300ms ease, max-height 200ms ease, margin 200ms ease, padding 200ms ease',
    opacity: leaving ? 0 : entered ? 1 : 0,
    transform: entered ? 'translateY(0)' : 'translateY(-8px)',
    maxHeight: leaving ? 0 : 800,
    marginBottom: leaving ? 0 : 16,
    paddingTop: leaving ? 0 : 24,
    paddingBottom: leaving ? 0 : 24,
    overflow: 'hidden',
    borderLeft: `4px solid ${accent}`,
    border: `1px solid ${hexToRgba(accent, 0.3)}`,
    borderLeftWidth: '4px',
    borderLeftColor: accent,
    background: `linear-gradient(180deg, ${hexToRgba(accent, 0.08)}, transparent)`,
  }

  const { strengths, awareness, total } = counts
  const noFindings = total === 0

  return (
    <div
      role="region"
      aria-label={`${pillarName} pillar overview`}
      className="rounded-2xl px-5 md:px-[22px]"
      style={enterStyle}
    >
      {/* Row 1: pillar icon + name */}
      <div className="flex items-center gap-2.5">
        {Icon ? (
          <Icon size={22} style={{ color: accent }} aria-hidden="true" />
        ) : (
          <span aria-hidden="true" className="inline-block h-[10px] w-[10px] rounded-full" style={{ backgroundColor: accent }} />
        )}
        <h3 className="text-[1.3rem] font-semibold leading-tight text-ss-text">
          {pillarName}
        </h3>
      </div>

      {/* Row 2: description */}
      <p className="mt-3 text-[0.95rem] leading-[1.6] text-ss-text">
        {description}
      </p>

      {/* Row 3: findings count */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-ss-muted">
        {noFindings ? (
          <span>No significant findings in this pillar based on your variants.</span>
        ) : (
          <>
            <span>
              You have {total} finding{total === 1 ? '' : 's'} in this pillar —
              {' '}{strengths} strength{strengths === 1 ? '' : 's'} and {awareness} area{awareness === 1 ? '' : 's'} to explore.
            </span>
            <span className="flex flex-wrap gap-1.5">
              {strengths > 0 && (
                <span className="inline-flex items-center rounded-full bg-ss-green px-[10px] py-[3px] font-mono text-[10px] font-bold text-white">
                  {strengths} strength{strengths === 1 ? '' : 's'}
                </span>
              )}
              {awareness > 0 && (
                <span className="inline-flex items-center rounded-full bg-ss-amber px-[10px] py-[3px] font-mono text-[10px] font-bold text-white">
                  {awareness} to explore
                </span>
              )}
            </span>
          </>
        )}
      </div>

      {/* Row 4: dismiss link — bottom-right */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="font-mono text-[11px] font-semibold text-ss-muted hover:text-ss-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-ss-teal/40"
          aria-label={`Dismiss ${pillarName} intro`}
        >
          Got it ↓
        </button>
      </div>
    </div>
  )
}
