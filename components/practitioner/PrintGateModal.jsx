'use client'

// /app/components/practitioner/PrintGateModal.jsx
// Section 6 spec: gate the Print / Save-as-PDF action behind a one-shot
// prompt that asks the user to fill in the three most valuable intake
// fields — current medications, known allergies, and chief concern —
// before generating the report. All three are OPTIONAL: the user may
// tap "Generate anyway" to bypass. Never blocks generation.
//
// Behavior:
//   * Opens when the parent calls open() (imperative ref) OR when the
//     `open` prop flips true.
//   * If ALL three fields already have content, the modal short-circuits
//     to onProceed() without ever rendering — so returning users who
//     already filled it in aren't nagged.
//   * "Complete now" writes the field values to intake via saveIntake()
//     and then calls onProceed(). "Generate anyway" simply calls
//     onProceed() without writing anything.
//   * Dismissible with Escape and by clicking the backdrop.

import { useEffect, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { loadIntake, saveIntake } from '@/lib/practitionerIntake'

// Fields we prompt for — must match keys in INTAKE_DEFAULTS.
const FIELDS = [
  {
    key: 'currentMedications',
    label: 'Current medications',
    placeholder: 'e.g. metformin 500 mg BID, sertraline 50 mg QD',
    hint: 'Helps the practitioner spot PGx conflicts against your genome.',
  },
  {
    key: 'allergies',
    label: 'Known allergies',
    placeholder: 'e.g. penicillin (hives), NSAIDs (GI upset)',
    hint: 'Any drug, food, or environmental allergies to disclose.',
  },
  {
    key: 'reasonForVisit',
    label: 'Chief concern',
    placeholder: 'e.g. investigating chronic fatigue + suspected MTHFR issues',
    hint: 'One-sentence summary of what you want to discuss with your clinician.',
  },
]

export default function PrintGateModal({ open, onClose, onProceed }) {
  const [values, setValues] = useState({ currentMedications: '', allergies: '', reasonForVisit: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const intake = loadIntake()
    setValues({
      currentMedications: intake?.currentMedications || '',
      allergies: intake?.allergies || '',
      reasonForVisit: intake?.reasonForVisit || '',
    })
  }, [open])

  // Escape closes the modal.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    // Lock background scroll while modal open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const handleCompleteNow = async () => {
    setSaving(true)
    try {
      saveIntake(values)
    } finally {
      setSaving(false)
      onProceed?.({ completed: true })
    }
  }

  const handleGenerateAnyway = () => {
    onProceed?.({ completed: false })
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-gate-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-ss-border-warm px-5 py-4">
          <div className="pr-6">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">
              Before you print
            </div>
            <h2 id="print-gate-title" className="mt-1 text-lg font-extrabold text-ss-teal">
              Your practitioner report will be more useful if you complete a few details first.
            </h2>
            <p className="mt-1 text-xs text-ss-muted">
              These fields are optional but strongly recommended. All values stay on your device — nothing is uploaded.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-ss-muted transition hover:bg-ss-bg hover:text-ss-teal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-bold uppercase tracking-wider text-ss-teal" htmlFor={`gate-${f.key}`}>
                {f.label}
              </label>
              <textarea
                id={`gate-${f.key}`}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                className="mt-1 w-full rounded-md border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none focus:ring-1 focus:ring-ss-teal"
                style={{ fontSize: '16px' }} // prevent iOS zoom
              />
              <p className="mt-1 text-[11px] text-ss-muted">{f.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-stretch gap-2 border-t border-ss-border-warm bg-ss-bg/40 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleGenerateAnyway}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ss-border-warm bg-white px-4 py-2 text-sm font-semibold text-ss-text transition hover:border-ss-teal hover:text-ss-teal"
          >
            Generate anyway
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleCompleteNow}
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? 'Saving…' : (<>Complete now &amp; generate <ArrowRight size={13} /></>)}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Convenience helper: given a loaded intake object, return true if any of
 * the three gate fields are empty. Used by the client to decide whether
 * to open the modal at all.
 */
export function shouldPromptGate(intake) {
  if (!intake) return true
  const empty = (v) => !v || String(v).trim() === ''
  return empty(intake.currentMedications) || empty(intake.allergies) || empty(intake.reasonForVisit)
}
