'use client'

// /app/components/goals/GoalCreationModal.jsx
// 3-screen modal (Category → Goal text → Details) for creating a goal.
// Renders via portal to escape any ancestor backdrop-filter that would
// otherwise trap fixed positioning.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ChevronLeft, ChevronRight, Check, Plus, Trash2,
  Zap, Leaf, FlaskConical, TestTube2, Heart, BookOpen, Stethoscope, CheckCircle2,
} from 'lucide-react'
import { CATEGORIES, createGoal, MAX_MILESTONES } from '@/lib/goals'
import { getGenomeContext } from '@/lib/goalGenomeContext'
import { readHabits } from '@/lib/habits'

const ICON_MAP = { Zap, Leaf, FlaskConical, TestTube2, Heart, BookOpen, Stethoscope, CheckCircle2 }

const BIOMARKER_OPTIONS = [
  'Homocysteine', 'HbA1c', 'Vitamin D', 'CRP (hs-CRP)', 'Ferritin', 'LDL cholesterol',
  'HDL cholesterol', 'Triglycerides', 'Fasting glucose', 'Fasting insulin', 'TSH',
]

export default function GoalCreationModal({ open, onClose, onCreated, initialCategory = null, initialVariant = null }) {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [categoryId, setCategoryId] = useState(null)
  const [goalText, setGoalText] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [targetUnit, setTargetUnit] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [milestones, setMilestones] = useState([])
  const [linkedHabits, setLinkedHabits] = useState([])
  const [linkedBiomarkers, setLinkedBiomarkers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Reset when modal opens. If a category is pre-selected (deep-link
  // from Focus Mode "Set a goal based on this finding"), skip Screen 1
  // and open Screen 2 with the category already chosen.
  useEffect(() => {
    if (open) {
      const hasInitial = initialCategory && CATEGORIES.some((c) => c.id === initialCategory)
      setStep(hasInitial ? 2 : 1)
      setCategoryId(hasInitial ? initialCategory : null)
      setGoalText('')
      setTargetValue(''); setTargetUnit(''); setTargetDate('')
      setMilestones([]); setLinkedHabits([]); setLinkedBiomarkers([]); setSaving(false)
    }
  }, [open, initialCategory])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const cat = useMemo(() => CATEGORIES.find((c) => c.id === categoryId) || null, [categoryId])
  const genomeCtx = useMemo(() => (categoryId ? getGenomeContext(categoryId) : null), [categoryId])
  const habits = useMemo(() => (typeof window !== 'undefined' ? readHabits().filter((h) => h.isActive !== false) : []), [open])

  const chooseCategory = (id) => {
    setCategoryId(id)
    setTimeout(() => setStep(2), 300)
  }

  const pickSuggestion = (s) => {
    setGoalText(s.text.replace(/\[X\]/g, '').replace(/\[time\]/g, '').replace(/\s+/g, ' ').trim())
    if (s.unit) setTargetUnit(s.unit)
    if (s.placeholder) setTargetValue(s.placeholder)
  }

  const addMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) return
    setMilestones([...milestones, { title: '', targetValue: '' }])
  }
  const updateMilestone = (idx, patch) => {
    setMilestones(milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  }
  const removeMilestone = (idx) => {
    setMilestones(milestones.filter((_, i) => i !== idx))
  }

  const canContinueStep2 = goalText.trim().length > 0
  const canSave = canContinueStep2 && !saving

  const handleSave = () => {
    if (!canSave) return
    setSaving(true)
    // Prefer a deep-link-provided variant (from Focus Mode "Set a goal
    // based on this finding") over the auto-detected genome context so
    // the user's explicit intent wins.
    const variantSource = initialVariant || genomeCtx?.variantSource || null
    const { ok, goal, error } = createGoal({
      category: categoryId,
      title: goalText.trim(),
      targetValue: targetValue || null,
      targetUnit: targetUnit || null,
      targetDate: targetDate || null,
      milestones: milestones.filter((m) => (m.title || '').trim()),
      linkedHabits,
      linkedBiomarkers,
      variantSource,
    })
    if (!ok) {
      alert(error === 'max_active' ? 'You have reached the maximum of 30 active goals. Complete or pause one first.' : 'Could not save.')
      setSaving(false)
      return
    }
    onCreated?.(goal)
    onClose?.()
  }

  if (!open) return null

  const content = (
    <div
      role="dialog" aria-modal="true" aria-labelledby="goal-modal-title"
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 md:items-center md:p-6"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 md:max-h-[720px] md:w-[560px] md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-ss-border-warm md:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-ss-border-warm/60 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Genome-Informed Goals</div>
            <h2 id="goal-modal-title" className="mt-1 text-xl font-extrabold text-ss-text md:text-2xl">
              {step === 1 ? 'What area do you want to focus on?' :
               step === 2 ? 'Choose a goal or create your own' :
                            'Set your target and timeline'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg">
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition ${s <= step ? 'bg-ss-teal' : 'bg-ss-border-warm'}`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="grid gap-2.5 md:grid-cols-2">
              {CATEGORIES.map((c) => {
                const Icon = ICON_MAP[c.icon] || CheckCircle2
                const selected = categoryId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => chooseCategory(c.id)}
                    className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'bg-opacity-10 border-2 shadow-md'
                        : 'border-ss-border-warm bg-white hover:bg-ss-bg'
                    }`}
                    style={selected ? { backgroundColor: c.color + '14', borderColor: c.color } : undefined}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: c.color + '18', color: c.color }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ss-text">{c.name}</span>
                      <span className="mt-0.5 block text-[11px] text-ss-muted">{c.suggestions.length} suggested goals</span>
                    </span>
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: c.color }}>
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && cat && (
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: cat.color }}>
                {cat.name}
              </div>

              <div className="space-y-1.5">
                {cat.suggestions.map((s, i) => {
                  const cleanText = s.text.replace(/\[X\]/g, '—').replace(/\[time\]/g, '—')
                  const isPicked = goalText === s.text.replace(/\[X\]/g, '').replace(/\[time\]/g, '').replace(/\s+/g, ' ').trim()
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pickSuggestion(s)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                        isPicked ? 'border-ss-teal bg-ss-teal/5' : 'border-ss-border-warm bg-white hover:bg-ss-bg'
                      }`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        isPicked ? 'border-ss-teal bg-ss-teal' : 'border-ss-border-warm'
                      }`}>
                        {isPicked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-ss-text">{cleanText}</span>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-ss-muted">Or create your own</label>
                <input
                  type="text"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value.slice(0, 100))}
                  placeholder="Describe your goal…"
                  maxLength={100}
                  className="mt-2 w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2.5 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none"
                />
                <div className="mt-1 text-[10px] text-ss-muted">{goalText.length}/100</div>
              </div>

              {genomeCtx && (
                <div
                  className="rounded-lg border-l-4 border-ss-teal p-3"
                  style={{ background: 'rgba(14,122,110,0.04)' }}
                >
                  <div className="flex items-start gap-2">
                    <span className="inline-flex shrink-0 items-center rounded-full bg-ss-teal/10 px-2 py-0.5 font-mono text-[9px] font-bold text-ss-teal">
                      {genomeCtx.variantSource}
                    </span>
                    <p className="text-[12.5px] leading-snug text-ss-text/85">
                      Your <strong>{genomeCtx.gene}</strong> variant suggests: {genomeCtx.line}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && cat && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-ss-muted">What does success look like?</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder={cat.suggestions[0]?.placeholder || 'e.g. 50'}
                    className="w-32 rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none"
                  />
                  <input
                    type="text"
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value.slice(0, 20))}
                    placeholder="units (kg, days, %)"
                    className="flex-1 rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ss-muted">Optional — leave blank if success is milestone-based.</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-ss-muted">By when?</label>
                <input
                  type="date"
                  value={targetDate}
                  min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-ss-muted">Setting a date creates a timeline for your milestones.</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ss-muted">Break it into steps (optional)</label>
                  <button
                    type="button"
                    onClick={addMilestone}
                    disabled={milestones.length >= MAX_MILESTONES}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-ss-teal disabled:opacity-40"
                  >
                    <Plus size={12} /> Add milestone
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => updateMilestone(i, { title: e.target.value.slice(0, 80) })}
                        placeholder="e.g. Complete first week"
                        className="flex-1 rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeMilestone(i)}
                        aria-label="Remove milestone"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <p className="text-[10.5px] text-ss-muted">{milestones.length}/{MAX_MILESTONES} milestones</p>
                </div>
              </div>

              {habits.length > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ss-muted">Link to a habit (optional)</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {habits.map((h) => {
                      const sel = linkedHabits.includes(h.id)
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setLinkedHabits(sel ? linkedHabits.filter((id) => id !== h.id) : [...linkedHabits, h.id])}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                            sel ? 'bg-ss-teal text-white' : 'bg-ss-bg text-ss-muted hover:text-ss-teal'
                          }`}
                        >
                          {sel ? '✓ ' : ''}{h.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {categoryId === 'biomarkers' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ss-muted">Which biomarker?</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {BIOMARKER_OPTIONS.map((b) => {
                      const sel = linkedBiomarkers.includes(b)
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setLinkedBiomarkers(sel ? linkedBiomarkers.filter((x) => x !== b) : [...linkedBiomarkers, b])}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                            sel ? 'bg-ss-teal text-white' : 'bg-ss-bg text-ss-muted hover:text-ss-teal'
                          }`}
                        >
                          {sel ? '✓ ' : ''}{b}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-ss-border-warm/60 bg-ss-bg/40 px-6 py-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ss-muted hover:text-ss-teal"
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <div className="text-[11px] text-ss-muted">Select a category to continue</div>
          ) : step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canContinueStep2}
              className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex items-center gap-1 rounded-full bg-ss-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={14} /> Save Goal
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
