'use client'

// /app/components/InsightLadder.jsx
// A five-rung reveal that walks a user from the raw signal up to the
// action, with a checkpoint at each rung. Progressive disclosure so
// users don’t confuse "I saw the study" with "I understood the study."

import { useState } from 'react'
import { ChevronDown, Check, Circle, Sparkles } from 'lucide-react'

// Default 5-rung template. Callers pass a `data` object shaped:
//   { signal, science, personal, tradeoffs, action }
// Each field is a short paragraph string. If a field is missing we
// render a placeholder that reads honestly (“not enough data yet”).
const RUNGS = [
  { key: 'signal',    label: 'Know now',            hint: 'What we know right now — the raw observation.' },
  { key: 'science',   label: 'Connected concepts',  hint: 'How this ties into the broader research picture.' },
  { key: 'personal',  label: 'Unknowns',            hint: 'What is still unclear, and what would clarify it.' },
  { key: 'tradeoffs', label: 'Next best step',      hint: 'The single most useful thing you could do this week.' },
  { key: 'action',    label: 'Explore deeper',      hint: 'Where to go if you want to keep pulling this thread.' },
]

export default function InsightLadder({ title, data = {}, className = '' }) {
  const [openIdx, setOpenIdx] = useState(0)
  const total = RUNGS.length
  const revealed = Math.min(total, Math.max(1, (openIdx + 1)))
  const pct = Math.round((revealed / total) * 100)

  return (
    <div className={`rounded-2xl border border-ss-border-warm bg-white p-5 md:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal"><Sparkles size={11} /> Insight ladder</div>
          {title && <h3 className="mt-1 text-xl font-extrabold text-ss-text">{title}</h3>}
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ss-muted">From what you know now to what you should do next.</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[10.5px] font-bold text-ss-teal">{revealed}/{total}</div>
          <div className="mt-0.5 h-1 w-16 overflow-hidden rounded-full bg-ss-border-warm">
            <div className="h-full bg-ss-teal transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <ol className="mt-5 space-y-2">
        {RUNGS.map((r, i) => {
          const body = data[r.key]
          const open = i <= openIdx
          const done = i < openIdx
          return (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => setOpenIdx(open && i === openIdx ? Math.max(0, i - 1) : i)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  open ? 'border-ss-teal bg-ss-teal/[0.04]' : 'border-ss-border-warm bg-white hover:border-ss-teal/50'
                }`}
                aria-expanded={open}
              >
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                  done ? 'bg-ss-green text-white' : open ? 'bg-ss-teal text-white' : 'bg-ss-border-warm text-ss-muted'
                }`}>
                  {done ? <Check size={13} /> : (i + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-ss-text">{r.label}</span>
                    <ChevronDown size={13} className={`shrink-0 text-ss-muted transition ${open ? 'rotate-180' : ''}`} />
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-ss-muted">{r.hint}</span>
                </span>
              </button>
              {open && (
                <div className="ml-10 mt-2 rounded-lg border-l-2 border-ss-teal bg-ss-bg/60 px-3.5 py-3 text-[13.5px] leading-relaxed text-ss-text">
                  {body ? body : <span className="italic text-ss-muted">Not enough data yet at this rung. Log more input to unlock a specific answer.</span>}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-4 flex items-center gap-1.5 font-mono text-[10.5px] text-ss-muted">
        <Circle size={9} className="fill-current opacity-60" />
        Tap each rung to reveal at your pace. Skipping is allowed — the ladder waits.
      </div>
    </div>
  )
}
