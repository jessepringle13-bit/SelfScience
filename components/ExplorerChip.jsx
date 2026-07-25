'use client'

// /app/components/ExplorerChip.jsx
// After a user completes both Tier 1 and Tier 2 of the Journey Guide,
// the full guide is replaced by this compact "Explorer" chip in the
// header (permanent — not affected by the 3-day auto-hide rule).
//
// Clicking the chip opens a small summary modal listing every step the
// user completed, with green checkmarks.

import { useEffect, useState } from 'react'
import { Star, Check, X } from 'lucide-react'
import { TIER1_STEPS, TIER2_STEPS, LS_EXPLORER, LS_PROGRESS, LS_TIER2 } from '@/components/JourneyGuide'

function readSet(key) {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch { return new Set() }
}

export default function ExplorerChip({ isDark = false }) {
  const [mounted, setMounted] = useState(false)
  const [active,  setActive]  = useState(false)
  const [open,    setOpen]    = useState(false)

  useEffect(() => {
    setMounted(true)
    try { setActive(window.localStorage.getItem(LS_EXPLORER) === '1') } catch {}
    // Poll on storage events (other tabs) + a soft custom event we
    // dispatch from the guide when Explorer is reached.
    const onStorage = (e) => {
      if (!e || e.key === LS_EXPLORER) {
        try { setActive(window.localStorage.getItem(LS_EXPLORER) === '1') } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!mounted || !active) return null

  const tier1 = readSet(LS_PROGRESS)
  const tier2 = readSet(LS_TIER2)
  const btnClass = isDark
    ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
    : 'border-ss-green bg-ss-green/10 text-ss-green hover:bg-ss-green/20'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition ${btnClass}`}
        aria-label="Explorer — you completed the full SelfScience journey"
      >
        <Star size={12} strokeWidth={2.5} />
        Explorer
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ss-explorer-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ss-green/10 text-ss-green">
                <Star size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="ss-explorer-title" className="text-lg font-extrabold text-ss-teal">
                  You&apos;ve explored everything SelfScience has to offer.
                </h2>
                <p className="mt-1 text-xs text-ss-muted">Here&apos;s what you discovered:</p>
              </div>
              <button
                type="button"
                aria-label="Close Explorer summary"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ss-teal/80">Getting Started</div>
              <ul className="mt-2 space-y-1.5">
                {TIER1_STEPS.map((s) => (
                  <SummaryRow key={s.key} done={tier1.has(s.key)} label={s.label} />
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ss-green">Go Deeper</div>
              <ul className="mt-2 space-y-1.5">
                {TIER2_STEPS.map((s) => (
                  <SummaryRow key={s.key} done={tier2.has(s.key)} label={s.label} />
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ss-teal px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function SummaryRow({ done, label }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-ss-green text-white' : 'bg-ss-border-warm/50 text-ss-muted'
        }`}
      >
        {done && <Check size={11} strokeWidth={3} />}
      </span>
      <span className={done ? 'text-ss-text' : 'text-ss-muted'}>{label}</span>
    </li>
  )
}
