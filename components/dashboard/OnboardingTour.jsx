'use client'

// /app/components/dashboard/OnboardingTour.jsx
// Slice 4A first-time tooltip tour. Mounted on the Dashboard; renders
// nothing at all when ss_onboarding_complete is already true so we
// don't leak DOM into returning-user sessions (spec addendum requires
// this — do NOT render tooltip nodes if onboarding is complete).
//
// Behavior:
//   * 4 steps highlighting Top Findings → Strengths → Explore Pillars
//     → Search nav item.
//   * Each tooltip anchors to a target element via a data-tour-target
//     attribute. Attribute-based anchoring keeps the tour decoupled
//     from the Dashboard's internal DOM layout.
//   * On mobile (< 768 px) tooltips render as a bottom-sheet step
//     instead of floating tooltips so they never collide with content.
//   * Next / Back / Skip buttons.
//   * Sets ss_onboarding_complete: 'true' when the user finishes or
//     skips.
//   * Escape key + backdrop click also dismiss (interpreted as skip).

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'

const LS_KEY = 'ss_onboarding_complete'

const STEPS = [
  {
    target: 'top-findings',
    title: 'Your Top Findings',
    body: 'The most notable "be aware" variants your genome flagged — start here.',
  },
  {
    target: 'strengths',
    title: 'Your Strengths',
    body: 'Favorable variants that research links to positive traits or protection.',
  },
  {
    target: 'pillar-grid',
    title: 'Explore Your Pillars',
    body: 'Ten health pillars — tap any to filter your dashboard by that domain.',
  },
  {
    target: 'nav-search',
    title: 'Search the Research',
    body: 'Find peer-reviewed papers matched to your specific genes.',
  },
]

export default function OnboardingTour() {
  // Mount guard — SSR-safe. Never render tour DOM until we've checked
  // the localStorage flag on the client.
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setMounted(true)
    // Never re-open the tour once completed.
    try {
      const done = window.localStorage.getItem(LS_KEY)
      if (done === 'true') return
    } catch {}
    // Only auto-start when at least one target exists on the page.
    const anyTarget = STEPS.some((s) => document.querySelector(`[data-tour-target="${s.target}"]`))
    if (!anyTarget) return
    // Small delay so the dashboard finishes hydrating & the ambient
    // TimeAwareBanner slots into place before we overlay.
    const t = setTimeout(() => setActive(true), 800)
    return () => clearTimeout(t)
  }, [])

  // Track viewport for mobile bottom-sheet vs floating tooltip.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Recompute anchor position when step changes, on window resize, and on scroll.
  useLayoutEffect(() => {
    if (!active) return
    const step = STEPS[stepIdx]
    const target = document.querySelector(`[data-tour-target="${step.target}"]`)
    if (!target) { setAnchorRect(null); return }
    const compute = () => {
      const r = target.getBoundingClientRect()
      setAnchorRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height })
      // Scroll the target into view so the highlight isn't off-screen.
      if (r.top < 80 || r.bottom > window.innerHeight - 100) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [active, stepIdx])

  const finish = () => {
    setActive(false)
    try { window.localStorage.setItem(LS_KEY, 'true') } catch {}
  }
  const next = () => {
    if (stepIdx >= STEPS.length - 1) finish()
    else setStepIdx((i) => i + 1)
  }
  const back = () => setStepIdx((i) => Math.max(0, i - 1))
  const skip = () => finish()

  // Escape dismisses the tour (interpreted as skip).
  useEffect(() => {
    if (!active) return
    const onKey = (e) => { if (e.key === 'Escape') skip() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active])

  if (!mounted || !active) return null

  const step = STEPS[stepIdx]
  const stepCount = STEPS.length

  return (
    <>
      {/* Backdrop \u2014 dark overlay with a "punch-out" for the anchor.
          The punch-out is a box-shadow trick: we draw a transparent
          rectangle around the anchor with an outer spread that goes to
          screen-fill. That way the anchor stays interactive while the
          rest of the page is dimmed. */}
      {anchorRect && !isMobile && (
        <div
          onClick={skip}
          className="fixed inset-0 z-[65] cursor-pointer"
          style={{
            pointerEvents: 'auto',
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.55)`,
            top: Math.max(0, anchorRect.top - 8),
            left: Math.max(0, anchorRect.left - 8),
            width: anchorRect.width + 16,
            height: anchorRect.height + 16,
            borderRadius: 12,
            border: '2px solid rgba(220, 108, 30, 0.9)',
          }}
          aria-hidden="true"
        />
      )}
      {(!anchorRect || isMobile) && (
        <div
          onClick={skip}
          className="fixed inset-0 z-[65] cursor-pointer bg-black/55"
          aria-hidden="true"
        />
      )}

      {/* Tooltip / bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className={
          isMobile
            ? 'fixed inset-x-3 bottom-24 z-[70] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10'
            : 'fixed z-[70] w-80 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10'
        }
        style={!isMobile && anchorRect ? floatPosition(anchorRect) : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-ss-orange">
              Step {stepIdx + 1} of {stepCount}
            </div>
            <h3 id="tour-title" className="mt-1 text-base font-extrabold text-ss-teal">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Skip tour"
            onClick={skip}
            className="rounded-full p-1.5 text-ss-muted transition hover:bg-ss-bg hover:text-ss-teal"
          >
            <X size={14} />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ss-text">{step.body}</p>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={skip}
            className="text-[11px] font-semibold text-ss-muted underline underline-offset-4 hover:text-ss-teal"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={back}
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-[11px] font-bold text-ss-teal transition hover:border-ss-teal"
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-ss-teal px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:brightness-110"
            >
              {stepIdx === stepCount - 1 ? 'Done' : 'Next'} <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Position a floating tooltip near the anchor. Prefers below, falls back
// above, clamps to viewport horizontally. Called only in non-mobile mode.
function floatPosition(rect) {
  if (typeof window === 'undefined') return {}
  const TOOLTIP_W = 320
  const TOOLTIP_H_EST = 180
  const margin = 12
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Prefer below the target.
  let top = rect.bottom + margin
  if (top + TOOLTIP_H_EST > vh - 20) {
    // Not enough room — try above.
    top = Math.max(20, rect.top - TOOLTIP_H_EST - margin)
  }
  // Horizontal: center on target then clamp.
  let left = rect.left + rect.width / 2 - TOOLTIP_W / 2
  left = Math.max(12, Math.min(vw - TOOLTIP_W - 12, left))

  return { top: `${top}px`, left: `${left}px`, width: `${TOOLTIP_W}px` }
}
