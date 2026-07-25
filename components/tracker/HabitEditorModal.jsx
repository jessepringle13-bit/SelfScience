'use client'

// /app/components/tracker/HabitEditorModal.jsx
// Create / edit a habit. Handles validation, category chips, frequency
// chips, color swatch, and (optional) linked variant selector.

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  CATEGORIES, CATEGORY_META, FREQUENCIES, COLOR_SWATCHES,
  addHabit, updateHabit,
} from '@/lib/habits'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'

export default function HabitEditorModal({ initial = null, prefill = null, onClose, onSaved }) {
  const editing = !!initial?.id
  const src = initial || prefill || {}
  const [name, setName] = useState(src.name || '')
  const [category, setCategory] = useState(src.category || 'wellness')
  const [frequency, setFrequency] = useState(src.frequency || 'daily')
  const [frequencyDetail, setFrequencyDetail] = useState(src.frequencyDetail || '')
  const [why, setWhy] = useState(src.why || '')
  const [variantSource, setVariantSource] = useState(src.variantSource || src.gene || '')
  const [color, setColor] = useState(src.color || CATEGORY_META[src.category || 'wellness'].color)
  const [error, setError] = useState(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  // Load user's findings for the variant dropdown.
  const findings = useMemo(() => {
    const r = getGenomeResults(); if (!r) return []
    const cards = flattenReportCards(r)
    const seen = new Set(); const out = []
    for (const c of cards) {
      const g = c?.gene; if (!g || seen.has(g)) continue
      seen.add(g); out.push({ gene: g, name: c.name || g })
      if (out.length >= 60) break
    }
    return out
  }, [])

  const canSave = name.trim().length > 0 && !!category

  const submit = () => {
    if (!canSave) return
    const payload = {
      name: name.trim().slice(0, 60),
      category,
      frequency,
      frequencyDetail: frequency === 'custom' ? (frequencyDetail || '').slice(0, 60) : null,
      why: (why || '').slice(0, 200) || null,
      variantSource: variantSource || null,
      color,
    }
    if (editing) {
      updateHabit(initial.id, payload)
      onSaved?.({ ...initial, ...payload }); onClose?.()
      return
    }
    const { ok, error: err, habit } = addHabit(payload)
    if (!ok) {
      if (err === 'max') setError('You have reached the maximum of 20 active habits.')
      else setError('Could not save. Please try again.')
      return
    }
    onSaved?.(habit); onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 backdrop-blur-sm md:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ss-border-warm/70 px-4 py-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>Habit tracker</div>
            <h2 className="text-lg font-extrabold text-ss-text">{editing ? 'Edit habit' : 'New habit'}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="h-9 w-9 rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-teal">
            <X size={18} className="m-auto" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {/* Name */}
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>Habit name</span>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Morning collagen, Evening walk, Methylfolate dose"
              className="w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
            />
          </label>

          {/* Category chips */}
          <div className="mt-3">
            <div className="mb-1 font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>Category</div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const m = CATEGORY_META[c]
                const active = category === c
                return (
                  <button
                    key={c} type="button"
                    onClick={() => { setCategory(c); if (!editing) setColor(m.color) }}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      active ? 'text-white border-transparent' : 'border-ss-border-warm text-ss-muted hover:border-ss-teal/40'
                    }`}
                    style={active ? { backgroundColor: m.color } : {}}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Frequency chips */}
          <div className="mt-3">
            <div className="mb-1 font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>Frequency</div>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENCIES.map((f) => {
                const active = frequency === f.key
                return (
                  <button key={f.key} type="button" onClick={() => setFrequency(f.key)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      active ? 'border-ss-teal bg-ss-teal text-white' : 'border-ss-border-warm text-ss-muted hover:border-ss-teal/40'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
            {frequency === 'custom' && (
              <input type="text" value={frequencyDetail} onChange={(e) => setFrequencyDetail(e.target.value)} maxLength={60}
                placeholder="e.g. 2x per week on Tue + Thu"
                className="mt-2 w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
              />
            )}
          </div>

          {/* Why */}
          <div className="mt-3">
            <label className="block">
              <span className="mb-1 flex items-center justify-between font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
                <span>Why (optional)</span>
                <span className="text-ss-muted">{why.length}/200</span>
              </span>
              <textarea
                rows={3} value={why} onChange={(e) => setWhy(e.target.value.slice(0, 200))}
                placeholder="What does your genome say about this habit?"
                className="w-full resize-y rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
              />
            </label>
          </div>

          {/* Linked variant */}
          {findings.length > 0 && (
            <div className="mt-3">
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>Linked finding (optional)</span>
                <select value={variantSource} onChange={(e) => setVariantSource(e.target.value)}
                  className="w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20">
                  <option value="">— None —</option>
                  {findings.map((f) => <option key={f.gene} value={f.gene}>{f.name} · {f.gene}</option>)}
                </select>
              </label>
            </div>
          )}

          {/* Color swatches */}
          <div className="mt-3">
            <div className="mb-1 font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>Color</div>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`}
                  className={`h-7 w-7 rounded-full ring-2 transition ${color === c ? 'ring-offset-2 ring-ss-teal' : 'ring-transparent hover:ring-ss-teal/40'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-ss-border-warm/70 bg-ss-bg/60 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-ss-border-warm px-4 py-1.5 text-xs font-semibold text-ss-muted hover:bg-white">Cancel</button>
          <button type="button" onClick={submit} disabled={!canSave}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
              canSave ? 'bg-ss-green hover:brightness-110' : 'cursor-not-allowed bg-ss-border-warm'
            }`}
          >
            {editing ? 'Save changes' : 'Save habit'}
          </button>
        </div>
      </div>
    </div>
  )
}
