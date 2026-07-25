'use client'

// /app/components/genome/ExplainToDoctorModal.jsx
// "Explain this to my doctor" button + modal. Renders a
// clinician-facing single-finding summary. Client-only — uses
// clipboard, sessionStorage, and portal-style overlay.
//
// The button only mounts inside VariantInterpretation's expanded panel,
// so per product spec it's only visible when the interpretation is
// expanded. See VariantInterpretation.jsx for the integration.
//
// Accessibility:
//   • ESC key closes the modal
//   • Backdrop click closes the modal (mobile-friendly)
//   • aria-modal + aria-labelledby on the dialog

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope, Copy, FileText, X, Check } from 'lucide-react'
import {
  buildDoctorExplanation,
  serializeExplanationForClipboard,
} from '@/lib/doctorExplanation'
import {
  addToPractitionerReport,
  isInPractitionerReport,
} from '@/lib/practitionerReport'

/* ---------------------------- Button ---------------------------------- */
// Secondary-style pill button matching product spec: transparent bg,
// 1px ss-teal border, ss-teal text, 999px radius, 7px 16px padding,
// 0.85rem font-size.

export default function ExplainToDoctorButton({ card }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // Secondary-style pill button. Uses arbitrary-value Tailwind
        // padding to match the exact 7px/16px spec.
        className="inline-flex items-center gap-1.5 rounded-full border border-ss-teal bg-transparent px-4 py-[7px] text-[0.85rem] font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ss-teal/40"
        aria-haspopup="dialog"
      >
        <Stethoscope size={14} aria-hidden="true" />
        Explain this to my doctor
      </button>
      {open && (
        <ExplainModal card={card} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

/* ----------------------------- Modal ---------------------------------- */

function ExplainModal({ card, onClose }) {
  const router = useRouter()
  const exp = buildDoctorExplanation(card || {})
  const bodyId = 'explain-to-doctor-body'
  const titleId = 'explain-to-doctor-title'
  const [copied, setCopied] = useState(false)
  const [added, setAdded] = useState(false)
  const timerRef = useRef(null)

  // ESC key + body-scroll lock while modal is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onClose])

  const flash = useCallback((setter) => {
    setter(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setter(false), 2000)
  }, [])

  const doCopy = useCallback(async () => {
    const text = serializeExplanationForClipboard(exp)
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers: hidden textarea + execCommand.
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      flash(setCopied)
    } catch {
      // Silent — clipboard was disabled or blocked. No blocking toast.
      flash(setCopied)
    }
  }, [exp, flash])

  const doAddToReport = useCallback(() => {
    // If nothing is in the report yet, route the user to
    // /practitioner-report with this finding pre-loaded (spec §3).
    const alreadyIn = isInPractitionerReport(card?.rsid || card?.id)
    if (!alreadyIn) {
      addToPractitionerReport({
        ...card,
        // Stash the doctor-facing prose so /practitioner-report can
        // choose to prefer the clinical wording later without needing
        // to rebuild it. Additive — doesn't change practitionerReport
        // schema.
        summary: exp.whatItSuggests,
      })
    }
    flash(setAdded)
  }, [card, exp, flash])

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      // Full-viewport overlay with 50% black backdrop. On desktop the
      // modal is a centered card; on mobile it becomes a bottom sheet
      // pinned to the viewport bottom.
      onClick={onBackdrop}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <div
        // Mobile: full-width bottom sheet, rounded only on top corners.
        // Desktop: centered card, max 560px wide, 16px radius all around.
        className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl ring-1 ring-black/5 md:max-h-[80vh] md:max-w-[560px] md:rounded-2xl"
      >
        {/* Close X — top-right, primarily for mobile ergonomics but
            useful on desktop too. */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-ss-muted transition hover:bg-ss-bg hover:text-ss-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-ss-teal/40"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Scrollable body */}
        <div id={bodyId} className="overflow-y-auto px-5 py-6 md:px-8 md:py-8">
          {/* Eyebrow */}
          <div
            id={titleId}
            className="font-mono text-[11px] font-bold uppercase text-ss-teal"
            style={{ letterSpacing: '0.14em' }}
          >
            For your appointment
          </div>

          {/* Finding block */}
          <section className="mt-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-ss-muted">
              Finding
            </div>
            <div className="mt-1 text-[15px] font-semibold leading-snug text-ss-text">
              {exp.traitName}
              {exp.rsid && (
                <span className="ml-1 font-mono text-[13px] font-normal text-ss-muted">
                  ({exp.rsid})
                </span>
              )}
            </div>
            {exp.genotype && (
              <div className="mt-1 text-[11.5px] text-ss-muted">
                Genotype: <span className="font-mono">{exp.genotype}</span>
              </div>
            )}
            <div className="mt-1 text-[11.5px] text-ss-muted">
              Source: {exp.source}
            </div>

            <div className="mt-4 font-mono text-[11px] uppercase tracking-wider text-ss-muted">
              What it suggests
            </div>
            <p className="mt-1 text-[0.93rem] leading-[1.65] text-ss-text">
              {exp.whatItSuggests}
            </p>
          </section>

          {/* Divider */}
          <div className="my-5 h-px bg-ss-border-warm/70" aria-hidden="true" />

          {/* Questions */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-wider text-ss-muted">
              Questions to ask your doctor
            </div>
            <ul className="mt-2 space-y-[10px] text-[0.93rem] leading-[1.55] text-ss-text">
              {exp.questions.map((q, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[2px] text-ss-teal">→</span>
                  <span className="min-w-0 break-words">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Divider */}
          <div className="my-5 h-px bg-ss-border-warm/70" aria-hidden="true" />

          {/* Note to clinician — amber-tinted callout per spec */}
          <section
            className="rounded-lg border-l-[3px] border-ss-amber px-4 py-3 text-[0.85rem] italic leading-relaxed text-ss-muted"
            style={{ backgroundColor: 'rgba(207,144,24,0.07)' }}
          >
            <div className="not-italic mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ss-amber">
              Note to clinician
            </div>
            {exp.clinicianNote}
          </section>
        </div>

        {/* Action bar — sticky at the bottom on mobile so the buttons
            stay reachable when the body is scrolled. Buttons stack on
            mobile, inline on desktop per spec. */}
        <div className="flex flex-col gap-2 border-t border-ss-border-warm/70 bg-white px-5 py-4 md:flex-row md:flex-wrap md:items-center md:gap-2.5 md:px-8">
          <button
            type="button"
            onClick={doCopy}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ss-teal bg-transparent px-4 text-[0.9rem] font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white md:w-auto"
          >
            {copied ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy to clipboard
              </>
            )}
          </button>
          <button
            type="button"
            onClick={doAddToReport}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ss-teal bg-transparent px-4 text-[0.9rem] font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white md:w-auto"
          >
            {added ? (
              <>
                <Check size={14} /> Added!
              </>
            ) : (
              <>
                <FileText size={14} /> Add to Practitioner Report
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full bg-transparent px-3 text-[0.9rem] font-semibold text-ss-muted transition hover:text-ss-teal md:ml-auto md:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
