'use client'

// /app/components/dashboard/JournalWidget.jsx
// Compact Dashboard widget — sits below the Weekly Digest and shows
// the 3 most-recent journal entries plus a quick-add button. Wires to
// lib/journal.js and the global floating-button open event.

import { useMemo } from 'react'
import Link from 'next/link'
import { PenLine, ArrowRight, BookOpen, Eye, MessageCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useJournal, TYPE_META, relativeTime } from '@/lib/journal'

const ICONS = { observation: Eye, reflection: MessageCircle, action: CheckCircle2, question: HelpCircle }

export default function JournalWidget() {
  const entries = useJournal()
  const recent = useMemo(() => entries.slice(0, 3), [entries])
  const openAdd = () => {
    try { window.dispatchEvent(new CustomEvent('selfscience:journal-open')) } catch {}
  }

  return (
    <section aria-labelledby="journal-widget-heading" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="mb-1 font-mono text-[10px] font-bold uppercase text-ss-teal"
            style={{ letterSpacing: '0.14em' }}
          >
            Your Journal
          </div>
          <h2 id="journal-widget-heading" className="text-xl font-extrabold text-ss-text">
            {entries.length ? 'Recent entries' : 'Start your health journal'}
          </h2>
          <p className="mt-1 text-sm text-ss-muted">
            {entries.length
              ? 'Your longitudinal record — private, on-device, exportable.'
              : 'Capture observations, reflections, actions, and questions as you explore your biology.'}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-ss-teal-dark"
          >
            <PenLine size={12} /> New entry
          </button>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-ss-border-warm bg-ss-bg/60 p-6 text-center">
          <BookOpen size={22} className="mx-auto text-ss-muted" />
          <p className="mt-2 text-sm text-ss-text">Your first entry starts your timeline.</p>
          <p className="mt-1 text-xs text-ss-muted">
            Tap the pencil button (bottom-left) any time you have a thought about your health.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {recent.map((e) => {
            const meta = TYPE_META[e.type] || TYPE_META.reflection
            const Icon = ICONS[e.type] || MessageCircle
            return (
              <li key={e.id} className="flex gap-3 rounded-xl border border-ss-border-warm/60 bg-white p-3">
                <span className={`mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${meta.softBg} ${meta.accent}`}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] font-bold uppercase ${meta.accent}`} style={{ letterSpacing: '0.14em' }}>
                      {meta.label}
                    </span>
                    <span className="text-[10.5px] text-ss-muted">{relativeTime(e.createdAt)}</span>
                    {e.moodRating ? (
                      <span className="ml-auto text-[10.5px] font-semibold text-ss-amber">Mood {e.moodRating}/5</span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] text-ss-text">{e.text}</p>
                  {e.findingName || e.actionCategory ? (
                    <div className="mt-1 text-[11px] text-ss-muted">
                      {e.findingName ? <>Finding: <span className="font-semibold text-ss-teal">{e.findingName}</span></> : null}
                      {e.actionCategory ? <span className="font-semibold text-ss-green">{e.actionCategory}</span> : null}
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-4 flex justify-end">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ss-teal hover:underline"
        >
          Open full journal <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  )
}
