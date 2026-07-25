'use client'

// /app/components/JournalEntryModal.jsx
// Modal for creating (or editing) a journal entry. Handles all four
// entry types with dynamic conditional fields, mood rating, tags,
// and date backdating.

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Eye, MessageCircle, CheckCircle2, HelpCircle, Star, Calendar } from 'lucide-react'
import {
  TYPE_META, TYPES, ACTION_CATEGORIES, MIN_TEXT_LEN, MOOD_LABELS,
  addEntry, updateEntry, collectFindings,
} from '@/lib/journal'
import { getGenomeResults } from '@/lib/genomeSession'

const TYPE_ICONS = {
  observation: Eye,
  reflection: MessageCircle,
  action: CheckCircle2,
  question: HelpCircle,
}

function todayLocalISODate() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function JournalEntryModal({ onClose, preset = null, editing = null }) {
  // If we're editing, pre-fill from the entry; otherwise honor preset
  // (from search-page trigger or dashboard quick-add).
  const [type, setType] = useState(editing?.type || preset?.type || 'reflection')
  const [text, setText] = useState(editing?.text || preset?.text || '')
  const [findingId, setFindingId] = useState(editing?.findingId || preset?.findingId || '')
  const [findingName, setFindingName] = useState(editing?.findingName || preset?.findingName || '')
  const [actionCategory, setActionCategory] = useState(editing?.actionCategory || 'Supplement')
  const [moodRating, setMoodRating] = useState(editing?.moodRating || 0)
  const [tagsInput, setTagsInput] = useState((editing?.tags || preset?.tags || []).join(', '))
  const [dateStr, setDateStr] = useState(
    editing?.createdAt ? new Date(editing.createdAt).toISOString().slice(0, 10) : todayLocalISODate()
  )
  const [searchQuery] = useState(preset?.searchQuery || null)
  const textareaRef = useRef(null)

  const findings = useMemo(() => collectFindings(getGenomeResults()), [])

  useEffect(() => {
    // Focus the text area after paint.
    const t = setTimeout(() => textareaRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // ESC closes
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Body scroll lock while modal open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const canSubmit = text.trim().length >= MIN_TEXT_LEN
  const meta = TYPE_META[type]

  const parseTags = () => tagsInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 12)

  const submit = () => {
    if (!canSubmit) return
    const iso = new Date(`${dateStr}T${new Date().toISOString().slice(11)}`).toISOString()
    const payload = {
      type,
      text: text.trim(),
      findingId: type === 'observation' ? findingId || null : null,
      findingName: type === 'observation' ? findingName || null : null,
      actionCategory: type === 'action' ? actionCategory : null,
      moodRating: moodRating >= 1 && moodRating <= 5 ? moodRating : null,
      tags: parseTags(),
      createdAt: iso,
      searchQuery,
    }
    if (editing?.id) {
      updateEntry(editing.id, payload)
    } else {
      addEntry(payload)
    }
    onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-modal-title"
        className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ss-border-warm/70 px-4 py-3">
          <div>
            <div
              className={`font-mono text-[10px] font-bold uppercase ${meta.accent}`}
              style={{ letterSpacing: '0.14em' }}
            >
              {editing ? 'Edit entry' : 'New journal entry'}
            </div>
            <h2 id="journal-modal-title" className="text-lg font-extrabold text-ss-text">
              {editing ? 'Update your thought' : 'Capture a thought'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-teal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {/* Entry-type chips */}
          <div className="mb-3">
            <div className="mb-1.5 font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
              Entry type
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {TYPES.map((t) => {
                const Icon = TYPE_ICONS[t]
                const m = TYPE_META[t]
                const active = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? `${m.softBg} ${m.accent} border-transparent ring-1 ${m.ring}/40`
                        : 'border-ss-border-warm text-ss-muted hover:border-ss-teal/30 hover:text-ss-text'
                    }`}
                  >
                    <Icon size={14} />
                    {m.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-ss-muted">Prompt: <span className="italic">{meta.hint}</span></p>
          </div>

          {/* Conditional field: finding selector (Observation) */}
          {type === 'observation' && (
            <div className="mb-3">
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
                Related finding (optional)
              </label>
              {findings.length ? (
                <select
                  value={findingId}
                  onChange={(e) => {
                    const id = e.target.value
                    setFindingId(id)
                    const f = findings.find((x) => x.id === id)
                    setFindingName(f?.name || '')
                  }}
                  className="w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
                >
                  <option value="">— Select a finding —</option>
                  {findings.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}{f.gene ? ` · ${f.gene}` : ''}{f.pillar ? ` — ${f.pillar}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-dashed border-ss-border-warm bg-ss-bg/60 p-3 text-[12px] text-ss-muted">
                  Upload a genome to link this observation to a specific finding.
                </div>
              )}
            </div>
          )}

          {/* Conditional field: action category (Action) */}
          {type === 'action' && (
            <div className="mb-3">
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
                What kind of action?
              </label>
              <select
                value={actionCategory}
                onChange={(e) => setActionCategory(e.target.value)}
                className="w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
              >
                {ACTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Text area */}
          <div className="mb-3">
            <label className="mb-1 flex items-center justify-between font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
              <span>Your entry</span>
              <span className={text.trim().length < MIN_TEXT_LEN ? 'text-ss-muted' : 'text-ss-green'}>
                {text.trim().length}/{MIN_TEXT_LEN}
              </span>
            </label>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={meta.hint}
              className="w-full resize-y rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
            />
          </div>

          {/* Mood rating */}
          <div className="mb-3">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
              How are you feeling? (optional)
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMoodRating(moodRating === v ? 0 : v)}
                  aria-label={`Mood ${v} — ${MOOD_LABELS[v]}`}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                    moodRating >= v ? 'text-ss-amber' : 'text-ss-border-warm hover:text-ss-amber/60'
                  }`}
                >
                  <Star size={20} fill={moodRating >= v ? 'currentColor' : 'none'} strokeWidth={2} />
                </button>
              ))}
              {moodRating > 0 && (
                <span className="ml-2 text-xs font-semibold text-ss-amber">{MOOD_LABELS[moodRating]}</span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-3">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
              Tags (comma-separated, optional)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. sleep, methylation, magnesium"
              className="w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
            />
          </div>

          {/* Date */}
          <div className="mb-2">
            <label className="mb-1 flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
              <Calendar size={11} /> Date
            </label>
            <input
              type="date"
              value={dateStr}
              max={todayLocalISODate()}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
            />
          </div>

          {searchQuery && (
            <div className="mt-3 rounded-lg bg-ss-bg px-3 py-2 text-[11px] text-ss-muted">
              Attached search context: <span className="font-semibold text-ss-teal">{searchQuery}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-ss-border-warm/70 bg-ss-bg/60 px-4 py-3">
          <div className="text-[11px] text-ss-muted">
            {canSubmit ? 'Saved locally — never leaves your device.' : `Add at least ${MIN_TEXT_LEN - text.trim().length} more characters to save.`}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ss-border-warm px-4 py-1.5 text-xs font-semibold text-ss-muted hover:bg-white hover:text-ss-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
                canSubmit ? 'bg-ss-teal hover:bg-ss-teal-dark' : 'cursor-not-allowed bg-ss-border-warm'
              }`}
            >
              {editing ? 'Save changes' : 'Save entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
