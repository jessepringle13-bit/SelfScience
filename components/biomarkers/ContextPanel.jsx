// /app/components/biomarkers/ContextPanel.jsx
// Progressive-disclosure chip UI for annotating draw context.
// Collapsed by default; shows a summary line + chevron. When expanded,
// renders one chip group per CONTEXT_FIELDS entry. Clicking an active
// chip toggles it off.

'use client'

import { useState } from 'react'
import { ChevronDown, Sparkles, X } from 'lucide-react'
import { CONTEXT_FIELDS, countAnswered } from '@/lib/biomarkers/context'

export function ContextPanel({ context = {}, sex = 'male', onChange }) {
  const [open, setOpen] = useState(false)
  const answered = countAnswered(context)
  const fields = CONTEXT_FIELDS.filter((f) => !f.onlyIfSex || f.onlyIfSex === sex)

  const setField = (id, value) => {
    if (context[id] === value) {
      const next = { ...context }; delete next[id]; onChange?.(next)
    } else {
      onChange?.({ ...context, [id]: value })
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60 md:p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-orange">
            <Sparkles size={11} /> Draw context (optional)
          </span>
          {answered > 0 && (
            <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
              {answered} noted
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-ss-muted">
          <span className="hidden md:inline">
            {answered === 0
              ? 'Fasting? Recent illness? Time of draw? Sharpens interpretation.'
              : 'Context influences the interpretation below.'}
          </span>
          <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-ss-border-warm/60 pt-4">
          {fields.map((f) => (
            <div key={f.id}>
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">
                  {f.label}
                </label>
                {context[f.id] && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...context }; delete next[f.id]; onChange?.(next)
                    }}
                    className="inline-flex items-center gap-0.5 text-[10px] text-ss-muted hover:text-ss-teal"
                  >
                    <X size={10} /> clear
                  </button>
                )}
              </div>
              {f.hint && <div className="mt-0.5 text-[11px] italic text-ss-muted">{f.hint}</div>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.options.map((o) => {
                  const active = context[f.id] === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setField(f.id, o.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? 'border-ss-teal bg-ss-teal text-white shadow-sm'
                          : 'border-ss-border-warm bg-white text-ss-text hover:border-ss-teal hover:text-ss-teal'
                      }`}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="pt-1 text-[10px] italic text-ss-muted">
            Context stored locally in your browser only. Never sent to a server.
          </div>
        </div>
      )}
    </div>
  )
}

export default ContextPanel
