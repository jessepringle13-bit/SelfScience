'use client'

// /app/components/ResetGenomeButton.jsx
// Two-variant button that opens a confirmation modal before wiping every
// genome + guide + first-visit key. On confirm, redirects to the homepage
// so the FirstTimeWelcome modal re-triggers.
//
// Variants:
//   variant="button"  → Dashboard header pill (Trash icon).
//   variant="link"    → Small monospace link for the genome results page
//                       header ("Upload a different file").

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2, RefreshCw, ShieldAlert, X } from 'lucide-react'
import { resetGenomeAndGuide } from '@/lib/journeyReset'

export default function ResetGenomeButton({ variant = 'button' }) {
  const router = useRouter()
  const [open, setOpen]   = useState(false)
  const [busy, setBusy]   = useState(false)

  const confirm = () => {
    setBusy(true)
    try { resetGenomeAndGuide() } catch {}
    // Small delay so the localStorage + event work is committed before nav.
    setTimeout(() => { router.push('/'); router.refresh?.() }, 60)
  }

  return (
    <>
      {variant === 'link' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-ss-muted transition hover:text-ss-teal hover:underline"
          aria-label="Upload a different file — clears current genome"
        >
          <RefreshCw size={11} /> Upload a different file
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-ss-border-warm bg-transparent px-4 py-1.5 text-xs font-semibold text-ss-muted transition hover:border-red-500 hover:text-red-500"
          aria-label="Clear and reset your genome and guide progress"
        >
          <Trash2 size={13} strokeWidth={2} /> Clear &amp; Reset
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ss-reset-heading"
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/50 md:items-center"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-6 shadow-2xl md:w-full md:max-w-md md:rounded-2xl md:p-8"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ss-border-warm md:hidden" aria-hidden="true" />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                <ShieldAlert size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="ss-reset-heading" className="text-lg font-extrabold text-ss-teal">
                  Clear your genome data?
                </h2>
                <p className="mt-2 text-sm text-ss-text">
                  This will remove your uploaded genome file and all personalized results from this session. Your Guide progress will also reset so you can experience the full walkthrough again.
                </p>
                <p className="mt-2 text-[11px] italic text-ss-muted">
                  Your data never left your device — nothing is stored on our servers.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close reset dialog"
                onClick={() => !busy && setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ss-border-warm bg-white px-5 text-sm font-semibold text-ss-teal transition hover:bg-ss-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-70"
              >
                {busy ? 'Clearing…' : 'Yes, clear everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
