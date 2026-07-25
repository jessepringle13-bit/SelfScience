'use client'

// /app/components/PrefsMenu.jsx
// Phase C — small header dropdown that hosts user-facing UI preferences.
// Right now it contains a single "Show technical terms" toggle. Kept
// visually light so it doesn't compete with the rest of the top-nav.
//
// Click / touch outside or Escape closes the menu.

import { useEffect, useRef, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useShowTechnicalTerms, setShowTechnicalTerms } from '@/lib/uiPrefs'

export default function PrefsMenu({ isDark = false }) {
  const [open, setOpen] = useState(false)
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
        </div>
      )}
    </div>
  )
}
