'use client'

// /app/components/training/IntakeForm.jsx
// Training Protocol — Section A/B/C/D intake form.
// Auto-saves to localStorage; notifies parent via post-render effect.

import { useEffect, useState } from 'react'
import { Sparkles, Rocket, Trash2, ChevronDown, ChevronUp, ClipboardList, Save } from 'lucide-react'
import {
  loadTrainingIntake, saveTrainingIntake, clearTrainingIntake,
  TRAINING_INTAKE_DEFAULTS,
  EXPERIENCE_LEVELS, SEX_OPTIONS, SESSION_LENGTHS, ACTIVITY_SUGGESTIONS,
  GOAL_OPTIONS, EQUIPMENT_OPTIONS,
} from '@/lib/training/intake'
import {
  cmToFtIn, ftInToCm, kgToLb, lbToKg,
} from '@/lib/practitionerIntake'

export default function TrainingIntakeForm({ hasGenome, hasBiomarkers, onSubmit, onChange }) {
  const [state, setState] = useState(TRAINING_INTAKE_DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const l = loadTrainingIntake()
    setState({ ...l, hasGenome: !!hasGenome, hasBiomarkers: !!hasBiomarkers })
    setLoaded(true)
     
  }, [hasGenome, hasBiomarkers])

  useEffect(() => {
    if (!loaded) return
    onChange?.(state)
     
  }, [state, loaded])

  const update = (patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      saveTrainingIntake(next)
      return next
    })
  }

  const toggleArray = (field, value) => {
    setState((prev) => {
      const arr = new Set(prev[field] || [])
      if (arr.has(value)) arr.delete(value); else arr.add(value)
      const next = { ...prev, [field]: Array.from(arr) }
      saveTrainingIntake(next)
      return next
    })
  }

  const handleClear = () => {
    if (!confirm('Clear all training intake? This cannot be undone.')) return
    clearTrainingIntake()
    setState({ ...TRAINING_INTAKE_DEFAULTS, hasGenome: !!hasGenome, hasBiomarkers: !!hasBiomarkers })
  }

  const canSubmit = state.primaryActivity && state.daysPerWeek > 0 && (state.goals?.length > 0)
  const handleSubmit = (e) => { e.preventDefault(); if (canSubmit) onSubmit?.(state) }

  const isImp = state.unitSystem === 'imperial'
  const ftin  = cmToFtIn(state.heightCm)
  const lb    = kgToLb(state.weightKg)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------- Section A ---------- */}
      <Section title="Section A — Who You Are">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Experience level">
            <select value={state.experienceLevel} onChange={(e) => update({ experienceLevel: e.target.value })} className={INPUT_CLS}>
              {EXPERIENCE_LEVELS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Age">
            <input type="number" min="10" max="100" value={state.age} onChange={(e) => update({ age: e.target.value })} placeholder="e.g. 34" className={INPUT_CLS} />
          </Field>
          <Field label="Biological sex">
            <select value={state.sex} onChange={(e) => update({ sex: e.target.value })} className={INPUT_CLS}>
              {SEX_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </Field>

          {/* Unit toggle */}
          <div className="flex items-center justify-between rounded border border-ss-border-warm/70 bg-ss-bg/40 px-3 py-2">
            <span className="text-[11px] font-semibold text-ss-teal">Height &amp; weight units</span>
            <div className="inline-flex rounded-full bg-white p-0.5 ring-1 ring-ss-border-warm">
              <button type="button" onClick={() => update({ unitSystem: 'metric' })}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${state.unitSystem === 'metric' ? 'bg-ss-teal text-white' : 'text-ss-muted'}`}>Metric</button>
              <button type="button" onClick={() => update({ unitSystem: 'imperial' })}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${state.unitSystem === 'imperial' ? 'bg-ss-teal text-white' : 'text-ss-muted'}`}>Imperial</button>
            </div>
          </div>

          {isImp ? (
            <TrainingHeightImperial state={state} update={update} />
          ) : (
            <Field label="Height (cm)">
              <div className="flex items-center gap-2">
                <input type="number" min="50" max="250" value={state.heightCm}
                  onChange={(e) => update({ heightCm: e.target.value })} placeholder="e.g. 172" className={INPUT_CLS} />
                <span className="text-[10px] text-ss-muted">= {ftin ? `${ftin.ft}'${ftin.in}"` : '—'}</span>
              </div>
            </Field>
          )}
          {isImp ? (
            <TrainingWeightImperial state={state} update={update} />
          ) : (
            <Field label="Weight (kg)">
              <div className="flex items-center gap-2">
                <input type="number" min="20" max="400" value={state.weightKg}
                  onChange={(e) => update({ weightKg: e.target.value })} placeholder="e.g. 68" className={INPUT_CLS} />
                <span className="text-[10px] text-ss-muted">= {lb != null ? `${lb} lb` : '—'}</span>
              </div>
            </Field>
          )}
        </div>
      </Section>

      {/* ---------- Section B ---------- */}
      <Section title="Section B — What You Do">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Primary activity / sport" full>
            <input
              type="text"
              list="activity-list"
              value={state.primaryActivity}
              onChange={(e) => update({ primaryActivity: e.target.value })}
              placeholder="e.g. Running, Powerlifting, CrossFit, Soccer…"
              className={INPUT_CLS}
              required
            />
            <datalist id="activity-list">
              {ACTIVITY_SUGGESTIONS.map((a) => <option key={a} value={a} />)}
            </datalist>
          </Field>
          <Field label={`Days per week: ${state.daysPerWeek}`}>
            <input type="range" min="0" max="7" value={state.daysPerWeek}
              onChange={(e) => update({ daysPerWeek: Number(e.target.value) })}
              className="w-full accent-ss-teal" />
            <div className="mt-0.5 flex justify-between text-[9px] text-ss-muted"><span>0</span><span>7</span></div>
          </Field>
          <Field label="Typical session length">
            <select value={state.sessionLength} onChange={(e) => update({ sessionLength: e.target.value })} className={INPUT_CLS}>
              {SESSION_LENGTHS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Primary goals (choose all that apply)" full>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((g) => {
                const active = (state.goals || []).includes(g.v)
                return (
                  <button type="button" key={g.v} onClick={() => toggleArray('goals', g.v)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      active ? 'border-ss-teal bg-ss-teal text-white' : 'border-ss-border-warm text-ss-muted hover:border-ss-teal hover:text-ss-teal'
                    }`}>{g.label}</button>
                )
              })}
            </div>
          </Field>
        </div>
      </Section>

      {/* ---------- Section C ---------- */}
      <Section title="Section C — Your Situation">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current injuries or pain areas" full>
            <textarea rows={2} value={state.currentInjuries} onChange={(e) => update({ currentInjuries: e.target.value })}
              placeholder='e.g. "left knee, lower back"' className={TEXTAREA_CLS} />
          </Field>
          <Field label="Past injuries or surgeries" full>
            <textarea rows={2} value={state.pastInjuries} onChange={(e) => update({ pastInjuries: e.target.value })}
              placeholder="e.g. ACL reconstruction 2018, meniscus 2021" className={TEXTAREA_CLS} />
          </Field>
          <Field label="Equipment available (choose all that apply)" full>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const active = (state.equipment || []).includes(eq.v)
                return (
                  <button type="button" key={eq.v} onClick={() => toggleArray('equipment', eq.v)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      active ? 'border-ss-orange bg-ss-orange text-white' : 'border-ss-border-warm text-ss-muted hover:border-ss-orange hover:text-ss-orange'
                    }`}>{eq.label}</button>
                )
              })}
            </div>
          </Field>
          <Field label='Any activity you absolutely do NOT want to give up' full>
            <textarea rows={2} value={state.protectedActivity} onChange={(e) => update({ protectedActivity: e.target.value })}
              placeholder="e.g. Sunday long runs, weekly deadlift PR attempts, my judo class"
              className={TEXTAREA_CLS} />
            <div className="mt-0.5 text-[10px] italic text-ss-orange">Protected — the tool will never recommend stopping this.</div>
          </Field>
          <Field label="Anything you want to avoid" full>
            <textarea rows={2} value={state.avoidances} onChange={(e) => update({ avoidances: e.target.value })}
              placeholder='e.g. "no running", "no heavy barbell work"' className={TEXTAREA_CLS} />
          </Field>
        </div>
      </Section>

      {/* ---------- Section D ---------- */}
      <Section title="Section D — Data Sources">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DataStatus
            label="Genome data"
            ok={hasGenome}
            okMsg="Your genetic variants will be used to personalise this protocol."
            nokMsg="Protocol will be based on your intake answers and general evidence — upload your genome for deeper personalisation."
          />
          <DataStatus
            label="Biomarker data"
            ok={hasBiomarkers}
            okMsg="Recent biomarker values will inform recovery and metric-tracking guidance."
            nokMsg="You can still get a full protocol. Log biomarkers later at /biomarkers for tighter personalisation."
          />
        </div>
      </Section>

      {/* Submit */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ss-border-warm pt-4">
        <button type="button" onClick={handleClear}
          className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm px-3 py-1.5 text-[11px] font-semibold text-ss-muted transition hover:border-ss-amber hover:text-ss-amber">
          <Trash2 size={11} /> Clear intake
        </button>
        <button type="submit" disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
          <Sparkles size={15} /> Generate My Training Protocol
          <Rocket size={13} className="ml-1" />
        </button>
      </div>
      <div className="text-[10px] italic text-ss-muted"><Save size={10} className="mr-1 inline" /> All answers stay on your device. Never uploaded.</div>
    </form>
  )
}

// ---- Small helpers ----
const INPUT_CLS = 'w-full rounded border border-ss-border-warm bg-white px-2.5 py-1.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-teal/30'
const TEXTAREA_CLS = INPUT_CLS + ' resize-y'

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-ss-border-warm bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList size={15} className="text-ss-teal" />
        <h3 className="text-sm font-extrabold text-ss-teal">{title}</h3>
      </div>
      {children}
    </div>
  )
}
function Field({ label, children, full = false }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ss-muted">{label}</span>
      {children}
    </label>
  )
}
function DataStatus({ label, ok, okMsg, nokMsg }) {
  return (
    <div className={`rounded border p-3 ${ok ? 'border-emerald-300 bg-emerald-50' : 'border-ss-border-warm bg-ss-bg/50'}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span className={ok ? 'text-emerald-700' : 'text-amber-700'}>{label} — {ok ? 'Available' : 'Not uploaded'}</span>
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-ss-text">{ok ? okMsg : nokMsg}</div>
    </div>
  )
}


// ─────────────────── Imperial input sub-components ───────────────────
// These use LOCAL string state so the user's keystrokes are authoritative.
// Canonical storage stays in metric (heightCm / weightKg). Without local
// state the controlled input would clobber typing on every keystroke due
// to lb↔kg / ft-in↔cm rounding round-trips.

function TrainingHeightImperial({ state, update }) {
  const ftin = cmToFtIn(state.heightCm)
  const [ftStr, setFtStr] = useState(ftin?.ft != null ? String(ftin.ft) : '')
  const [inStr, setInStr] = useState(ftin?.in != null ? String(ftin.in) : '')

  useEffect(() => {
    const externalCm = state.heightCm ? parseFloat(state.heightCm) : NaN
    if (!Number.isFinite(externalCm)) {
      if (ftStr !== '' || inStr !== '') { setFtStr(''); setInStr('') }
      return
    }
    const localCm = ftInToCm(ftStr || 0, inStr || 0)
    if (!Number.isFinite(localCm) || Math.abs(localCm - externalCm) > 0.9) {
      const canon = cmToFtIn(state.heightCm)
      setFtStr(canon?.ft != null ? String(canon.ft) : '')
      setInStr(canon?.in != null ? String(canon.in) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.heightCm])

  const handleFt = (e) => {
    const raw = e.target.value
    setFtStr(raw)
    if (raw === '' && inStr === '') { update({ heightCm: '' }); return }
    const cm = ftInToCm(raw || 0, inStr || 0)
    update({ heightCm: cm != null ? String(cm) : '' })
  }
  const handleIn = (e) => {
    const raw = e.target.value
    setInStr(raw)
    if (raw === '' && ftStr === '') { update({ heightCm: '' }); return }
    const cm = ftInToCm(ftStr || 0, raw || 0)
    update({ heightCm: cm != null ? String(cm) : '' })
  }

  return (
    <Field label="Height (ft &amp; in)">
      <div className="flex items-center gap-1">
        <input type="number" min="0" max="9" value={ftStr} onChange={handleFt} placeholder="ft" className={INPUT_CLS} />
        <span className="text-[10px] text-ss-muted">ft</span>
        <input type="number" min="0" max="11" value={inStr} onChange={handleIn} placeholder="in" className={INPUT_CLS} />
        <span className="text-[10px] text-ss-muted">in</span>
      </div>
      <div className="text-[10px] text-ss-muted">= {state.heightCm ? `${state.heightCm} cm` : '—'}</div>
    </Field>
  )
}

function TrainingWeightImperial({ state, update }) {
  const [lbStr, setLbStr] = useState(() => {
    const lb = kgToLb(state.weightKg)
    return lb != null ? String(lb) : ''
  })

  useEffect(() => {
    const externalKg = state.weightKg ? parseFloat(state.weightKg) : NaN
    if (!Number.isFinite(externalKg)) {
      if (lbStr !== '') setLbStr('')
      return
    }
    const localKg = lbStr ? parseFloat(lbStr) * 0.45359237 : NaN
    if (!Number.isFinite(localKg) || Math.abs(localKg - externalKg) > 0.2) {
      const newLb = kgToLb(state.weightKg)
      setLbStr(newLb != null ? String(newLb) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.weightKg])

  const handle = (e) => {
    const raw = e.target.value
    setLbStr(raw)
    if (raw === '') { update({ weightKg: '' }); return }
    const kg = lbToKg(raw)
    update({ weightKg: kg != null ? String(kg) : '' })
  }

  return (
    <Field label="Weight (lb)">
      <div className="flex items-center gap-2">
        <input type="number" min="20" max="900" value={lbStr} onChange={handle} placeholder="e.g. 150" className={INPUT_CLS} />
        <span className="text-[10px] text-ss-muted">= {state.weightKg ? `${state.weightKg} kg` : '—'}</span>
      </div>
    </Field>
  )
}
