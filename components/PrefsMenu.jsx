'use client'

// /app/components/PrefsMenu.jsx
// Phase C — small header dropdown that hosts user-facing UI preferences.
// Right now it contains a single "Show technical terms" toggle. Kept
// visually light so it doesn't compete with the rest of the top-nav.
//
// Click / touch outside or Escape closes the menu.

import { useEffect, useRef, useState } from 'react'
import { Settings2, Compass, RefreshCw, Trash2, ShieldAlert, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useShowTechnicalTerms, setShowTechnicalTerms } from '@/lib/uiPrefs'
import { resetGuideOnly, showGuideAgain, resetGenomeAndGuide, fireToast } from '@/lib/journeyReset'
import ThemeToggle from '@/components/ThemeToggle'

export default function PrefsMenu({ isDark = false }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const showTech = useShowTechnicalTerms()
  const wrapRef = useRef(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey  = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const btnClass = isDark
    ? 'text-white/80 hover:text-white'
    : 'text-ss-muted hover:text-ss-teal'

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Display preferences"
        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${btnClass}`}
      >
        <Settings2 size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-ss-border-warm bg-white shadow-xl ring-1 ring-black/5"
        >
          <div className="border-b border-ss-border-warm/60 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ss-muted">Display preferences</div>
          </div>

          {/* Colour theme — light / system / dark. Additive: nothing
              else in the menu changes. */}
          <div className="border-b border-ss-border-warm/60 px-4 py-3">
            <div className="mb-2 text-sm font-bold text-ss-teal">Colour theme</div>
            <ThemeToggle />
            <div className="mt-1.5 text-[11px] leading-snug text-ss-muted">
              Dark mode is optimised for the core reading surfaces. Some pages may still render in light shades.
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-ss-bg">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ss-teal">Show technical terms</div>
              <div className="mt-0.5 text-[11px] leading-snug text-ss-muted">
                Show rsIDs, "heterozygous / homozygous", pillar names, and other scientific
                terminology in card summaries.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showTech}
              onClick={() => setShowTechnicalTerms(!showTech)}
              className={`relative mt-1 h-6 w-11 flex-shrink-0 rounded-full transition ${
                showTech ? 'bg-ss-green' : 'bg-ss-border-warm'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  showTech ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </label>

          <div className="border-t border-ss-border-warm/60 bg-ss-bg/60 px-4 py-2.5 text-[11px] text-ss-muted">
            Detail views always show both plain English and technical labels.
          </div>

          {/* Guide actions (Parts 2 + 3) */}
          <div className="border-t border-ss-border-warm/60">
            <MenuItem
              Icon={Compass}
              label="Show getting started guide"
              hint="Bring back the Guide if it's hidden"
              onClick={() => { showGuideAgain(); setOpen(false); fireToast('Guide reopened') }}
            />
            <MenuItem
              Icon={RefreshCw}
              label="Replay getting started guide"
              hint="Reset only your Guide progress"
              onClick={() => { resetGuideOnly(); setOpen(false); fireToast('Guide restarted — follow the steps to explore your results') }}
            />
          </div>

          {/* Danger zone (Part 1) */}
          <div className="border-t border-ss-border-warm/60">
            <MenuItem
              Icon={Trash2}
              label="Clear all data & reset"
              hint="Remove genome + guide progress"
              danger
              onClick={() => { setOpen(false); setConfirmReset(true) }}
            />
          </div>
        </div>
      )}

      {/* Full-reset confirmation modal (Part 1 — invoked from the header
          menu; the dashboard button uses ResetGenomeButton's own modal). */}
      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ss-reset-menu-heading"
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/50 md:items-center"
          onClick={() => setConfirmReset(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-6 shadow-2xl md:w-full md:max-w-md md:rounded-2xl md:p-8"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ss-border-warm md:hidden" aria-hidden="true" />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                <ShieldAlert size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="ss-reset-menu-heading" className="text-lg font-extrabold text-ss-teal">Clear your genome data?</h2>
                <p className="mt-2 text-sm text-ss-text">
                  This will remove your uploaded genome file and all personalized results from this session. Your Guide progress will also reset so you can experience the full walkthrough again.
                </p>
                <p className="mt-2 text-[11px] italic text-ss-muted">Your data never left your device — nothing is stored on our servers.</p>
              </div>
              <button
                type="button"
                aria-label="Close reset dialog"
                onClick={() => setConfirmReset(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmReset(false)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-ss-border-warm bg-white px-5 text-sm font-semibold text-ss-teal transition hover:bg-ss-bg">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  resetGenomeAndGuide()
                  setConfirmReset(false)
                  setTimeout(() => { router.push('/'); router.refresh?.() }, 60)
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Yes, clear everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ Icon, label, hint, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ss-bg ${danger ? 'text-red-600' : 'text-ss-teal'}`}
    >
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] font-normal text-ss-muted">{hint}</span>}
      </span>
    </button>
  )
}
