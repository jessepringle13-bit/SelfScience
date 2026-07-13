'use client'

// /app/components/practitioner/IntakeForm.jsx
// Pre-report intake form — collects patient + practitioner + clinical context.
// All data lives ONLY in localStorage on the user's device.

import { useEffect, useState } from 'react'
import { ClipboardList, Save, Trash2, ChevronDown, ChevronUp, CheckCircle2, Ruler } from 'lucide-react'
import {
  loadIntake, saveIntake, clearIntake, INTAKE_DEFAULTS,
  cmToFtIn, ftInToCm, kgToLb, lbToKg,
} from '@/lib/practitionerIntake'

const SEX_OPTIONS = [
  { v: '', label: 'Prefer not to say' },
  { v: 'female', label: 'Female' },
  { v: 'male', label: 'Male' },
  { v: 'intersex', label: 'Intersex / Other' },
]

export default function IntakeForm({ onChange }) {
  const [state, setState] = useState(INTAKE_DEFAULTS)
  const [expanded, setExpanded] = useState(true)
  const [savedAt, setSavedAt] = useState(null)
  const [loaded, setLoaded] = useState(false)

  // Load persisted intake once on mount.
  useEffect(() => {
    const l = loadIntake()
    setState(l)
    if (l.patientName || l.reasonForVisit) setExpanded(false)
    setLoaded(true)
  }, [])

  // Notify parent whenever `state` changes — but only after the first load,
  // and only from an effect (never inside a setState updater or during render).
  useEffect(() => {
    if (!loaded) return
    onChange?.(state)
    // We intentionally omit `onChange` from deps to avoid re-firing when the
    // parent recreates its handler; parent should pass a stable/memoized ref
    // if it cares, but the intake payload itself is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, loaded])

  const update = (patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      // Persist synchronously so refresh keeps the latest value.
      saveIntake(next)
      return next
    })
    setSavedAt(Date.now())
  }

  const handleClear = () => {
    if (!confirm('Clear all intake information? This cannot be undone.')) return
    clearIntake()
    setState({ ...INTAKE_DEFAULTS })
    setSavedAt(Date.now())
  }

  const filledCount = Object.entries(state).filter(([k, v]) => {
    if (k === 'consentShare' || k === 'consentUnderstand') return false
    return v !== '' && v !== null && v !== undefined
  }).length

  return (
    <div className="ss-screen-only rounded-2xl border border-ss-border-warm bg-white p-5 shadow-sm no-print">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-ss-teal" />
          <div>
            <div className="text-left text-sm font-extrabold text-ss-teal">
              Pre-Report Intake Form
            </div>
            <div className="text-left text-[11px] text-ss-muted">
              {filledCount} field{filledCount === 1 ? '' : 's'} completed · stays on your device
              {savedAt && (
                <span className="ml-2 inline-flex items-center gap-1 text-ss-green">
                  <CheckCircle2 size={11} /> auto-saved
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-ss-muted">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Patient identity */}
          <Field label="Patient name or initials" full>
            <input
              type="text"
              value={state.patientName}
              onChange={(e) => update({ patientName: e.target.value })}
              placeholder="e.g. Jane Doe or J.D."
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              value={state.dob}
              onChange={(e) => update({ dob: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Sex assigned at birth">
            <select
              value={state.sex}
              onChange={(e) => update({ sex: e.target.value })}
              className={INPUT_CLS}
            >
              {SEX_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </Field>

          {/* Unit-system toggle spans both columns */}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded border border-ss-border-warm/70 bg-ss-bg/40 px-3 py-2">
            <Ruler size={13} className="text-ss-teal" />
            <span className="text-[11px] font-semibold text-ss-teal">Enter height &amp; weight in:</span>
            <div className="ml-auto inline-flex rounded-full bg-white p-0.5 ring-1 ring-ss-border-warm">
              <button
                type="button"
                onClick={() => update({ unitSystem: 'metric' })}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  state.unitSystem === 'metric'
                    ? 'bg-ss-teal text-white shadow-sm'
                    : 'text-ss-muted hover:text-ss-text'
                }`}
              >
                Metric (cm · kg)
              </button>
              <button
                type="button"
                onClick={() => update({ unitSystem: 'imperial' })}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  state.unitSystem === 'imperial'
                    ? 'bg-ss-teal text-white shadow-sm'
                    : 'text-ss-muted hover:text-ss-text'
                }`}
              >
                Imperial (ft/in · lb)
              </button>
            </div>
          </div>

          <HeightField state={state} update={update} />
          <WeightField state={state} update={update} />

          {/* Practitioner target */}
          <Field label="Practitioner name">
            <input
              type="text"
              value={state.practitionerName}
              onChange={(e) => update({ practitionerName: e.target.value })}
              placeholder="Dr. name"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Practitioner role">
            <input
              type="text"
              value={state.practitionerRole}
              onChange={(e) => update({ practitionerRole: e.target.value })}
              placeholder="e.g. Primary care physician"
              className={INPUT_CLS}
            />
          </Field>

          {/* Clinical context — full-width text areas */}
          <Field label="Reason for this visit / chief concern" full>
            <textarea
              rows={2}
              value={state.reasonForVisit}
              onChange={(e) => update({ reasonForVisit: e.target.value })}
              placeholder="What are you hoping the practitioner will help with?"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Current medications (name, dose, frequency)" full>
            <textarea
              rows={3}
              value={state.currentMedications}
              onChange={(e) => update({ currentMedications: e.target.value })}
              placeholder="e.g. Metformin 500mg twice daily, Lisinopril 10mg daily"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Current supplements" full>
            <textarea
              rows={2}
              value={state.currentSupplements}
              onChange={(e) => update({ currentSupplements: e.target.value })}
              placeholder="e.g. Vitamin D3 2000IU, Omega-3, Methylfolate 400mcg"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Known allergies / adverse drug reactions" full>
            <textarea
              rows={2}
              value={state.allergies}
              onChange={(e) => update({ allergies: e.target.value })}
              placeholder="e.g. Penicillin (rash), Sulfa drugs (nausea)"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Relevant family medical history" full>
            <textarea
              rows={2}
              value={state.familyHistory}
              onChange={(e) => update({ familyHistory: e.target.value })}
              placeholder="e.g. Father: T2DM at 55, Mother: breast cancer at 62"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Lifestyle — exercise, sleep, alcohol, nicotine" full>
            <textarea
              rows={2}
              value={state.lifestyle}
              onChange={(e) => update({ lifestyle: e.target.value })}
              placeholder="e.g. 4x/wk running, 7hrs sleep, 4 drinks/wk, non-smoker"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Current symptoms & timeline" full>
            <textarea
              rows={2}
              value={state.symptomsTimeline}
              onChange={(e) => update({ symptomsTimeline: e.target.value })}
              placeholder="e.g. Fatigue for 6 months, brain fog after meals since Jan"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Recent labs or imaging (dates, key results)" full>
            <textarea
              rows={2}
              value={state.priorLabs}
              onChange={(e) => update({ priorLabs: e.target.value })}
              placeholder="e.g. CBC + CMP Oct 2024 normal, thyroid panel pending"
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Goals for this consultation" full>
            <textarea
              rows={2}
              value={state.goals}
              onChange={(e) => update({ goals: e.target.value })}
              placeholder="e.g. Understand my MTHFR result, review current supplement stack"
              className={TEXTAREA_CLS}
            />
          </Field>

          {/* Consent checkboxes */}
          <div className="sm:col-span-2 mt-2 space-y-2 rounded border border-ss-border-warm/60 bg-ss-bg/50 p-3">
            <label className="flex items-start gap-2 text-[12px] text-ss-text">
              <input
                type="checkbox"
                checked={state.consentShare}
                onChange={(e) => update({ consentShare: e.target.checked })}
                className="mt-1"
              />
              <span>
                <span className="font-semibold">I authorize sharing this printed report with the practitioner named above.</span>{' '}
                I understand SelfScience does not transmit any of my data — I am the one physically or digitally handing this document over.
              </span>
            </label>
            <label className="flex items-start gap-2 text-[12px] text-ss-text">
              <input
                type="checkbox"
                checked={state.consentUnderstand}
                onChange={(e) => update({ consentUnderstand: e.target.checked })}
                className="mt-1"
              />
              <span>
                <span className="font-semibold">I understand this report is educational, not diagnostic.</span>{' '}
                It summarizes consumer-grade single-SNP data and self-reported context, and it is not a substitute for clinical genetic testing, diagnosis, or medical advice.
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between border-t border-ss-border-warm/60 pt-3">
            <div className="text-[11px] text-ss-muted">
              <Save size={11} className="mr-1 inline" /> Stored on your device only — never sent to a server.
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm px-3 py-1 text-[11px] font-semibold text-ss-muted transition hover:border-ss-amber hover:text-ss-amber"
            >
              <Trash2 size={11} /> Clear intake
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Small helpers ----
const INPUT_CLS =
  'w-full rounded border border-ss-border-warm bg-white px-2.5 py-1.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-teal/30'
const TEXTAREA_CLS = INPUT_CLS + ' resize-y'

function Field({ label, children, full = false }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ss-muted">{label}</span>
      {children}
    </label>
  )
}

/**
 * Height field — switches between:
 *  • metric: single cm input, showing "= 5'6"" beside as it types
 *  • imperial: paired ft + in inputs (local string state so keystrokes are
 *    never overwritten by round-trip conversion), showing "= 168 cm" beside.
 * Canonical storage is always heightCm.
 */
function HeightField({ state, update }) {
  const isImperial = state.unitSystem === 'imperial'
  const ftin = cmToFtIn(state.heightCm)

  // Local string state for imperial inputs so the user's typing is authoritative.
  // We only sync FROM canonical cm when the unit system changes.
  const [ftStr, setFtStr] = useState(ftin?.ft != null ? String(ftin.ft) : '')
  const [inStr, setInStr] = useState(ftin?.in != null ? String(ftin.in) : '')

  useEffect(() => {
    if (!isImperial) return
    const canon = cmToFtIn(state.heightCm)
    // Only overwrite local state if it does NOT already round-trip back to
    // the same canonical value — that means the change came from outside
    // (a mount, unit toggle, or Clear). Do not overwrite as the user types.
    const localCanon = ftInToCm(ftStr || 0, inStr || 0)
    const externalCm = state.heightCm ? parseFloat(state.heightCm) : NaN
    if (!Number.isFinite(externalCm)) {
      if (ftStr !== '' || inStr !== '') { setFtStr(''); setInStr('') }
    } else if (!Number.isFinite(localCanon) || Math.abs(localCanon - externalCm) > 0.9) {
      setFtStr(canon?.ft != null ? String(canon.ft) : '')
      setInStr(canon?.in != null ? String(canon.in) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImperial, state.heightCm])

  if (!isImperial) {
    return (
      <Field label="Height (cm)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="50"
            max="250"
            value={state.heightCm}
            onChange={(e) => update({ heightCm: e.target.value })}
            placeholder="e.g. 172"
            className={INPUT_CLS}
          />
          <span className="whitespace-nowrap text-[11px] text-ss-muted">
            = {ftin ? `${ftin.ft}'${ftin.in}"` : '—'}
          </span>
        </div>
      </Field>
    )
  }

  const handleFtChange = (e) => {
    const raw = e.target.value
    setFtStr(raw)
    if (raw === '' && inStr === '') { update({ heightCm: '' }); return }
    const cm = ftInToCm(raw || 0, inStr || 0)
    update({ heightCm: cm != null ? String(cm) : '' })
  }
  const handleInChange = (e) => {
    const raw = e.target.value
    setInStr(raw)
    if (raw === '' && ftStr === '') { update({ heightCm: '' }); return }
    const cm = ftInToCm(ftStr || 0, raw || 0)
    update({ heightCm: cm != null ? String(cm) : '' })
  }

  return (
    <Field label="Height (ft &amp; in)">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="9"
            value={ftStr}
            onChange={handleFtChange}
            placeholder="ft"
            className={INPUT_CLS}
          />
          <span className="text-[11px] text-ss-muted">ft</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="11"
            value={inStr}
            onChange={handleInChange}
            placeholder="in"
            className={INPUT_CLS}
          />
          <span className="text-[11px] text-ss-muted">in</span>
        </div>
        <span className="whitespace-nowrap text-[11px] text-ss-muted">
          = {state.heightCm ? `${state.heightCm} cm` : '—'}
        </span>
      </div>
    </Field>
  )
}

/**
 * Weight field — switches between:
 *  • metric: kg input, showing "= 149.9 lb" beside
 *  • imperial: lb input with LOCAL string state so keystrokes are never
 *    corrupted by round-trip conversion. Canonical storage is always kg.
 */
function WeightField({ state, update }) {
  const isImperial = state.unitSystem === 'imperial'
  const lb = kgToLb(state.weightKg)

  const [lbStr, setLbStr] = useState(lb != null ? String(lb) : '')

  useEffect(() => {
    if (!isImperial) return
    const externalKg = state.weightKg ? parseFloat(state.weightKg) : NaN
    if (!Number.isFinite(externalKg)) {
      if (lbStr !== '') setLbStr('')
      return
    }
    // Only overwrite local when external changes don't round-trip.
    const localKg = lbStr ? parseFloat(lbStr) * 0.45359237 : NaN
    if (!Number.isFinite(localKg) || Math.abs(localKg - externalKg) > 0.2) {
      const newLb = kgToLb(state.weightKg)
      setLbStr(newLb != null ? String(newLb) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImperial, state.weightKg])

  if (!isImperial) {
    return (
      <Field label="Weight (kg)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="20"
            max="400"
            value={state.weightKg}
            onChange={(e) => update({ weightKg: e.target.value })}
            placeholder="e.g. 68"
            className={INPUT_CLS}
          />
          <span className="whitespace-nowrap text-[11px] text-ss-muted">
            = {lb != null ? `${lb} lb` : '—'}
          </span>
        </div>
      </Field>
    )
  }

  const handleLbChange = (e) => {
    const raw = e.target.value
    setLbStr(raw)
    if (raw === '') { update({ weightKg: '' }); return }
    const kg = lbToKg(raw)
    update({ weightKg: kg != null ? String(kg) : '' })
  }

  return (
    <Field label="Weight (lb)">
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min="20"
          max="900"
          value={lbStr}
          onChange={handleLbChange}
          placeholder="e.g. 150"
          className={INPUT_CLS}
        />
        <span className="whitespace-nowrap text-[11px] text-ss-muted">
          = {state.weightKg ? `${state.weightKg} kg` : '—'}
        </span>
      </div>
    </Field>
  )
}
