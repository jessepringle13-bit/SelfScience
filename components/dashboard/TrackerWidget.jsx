'use client'

// /app/components/dashboard/TrackerWidget.jsx
// Compact habit-tracker widget for the dashboard. Renders up to 5
// active habits with fully-functional check circles that stay in sync
// with the /tracker page (both dispatch `selfscience:habits-changed`).

import { useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ArrowRight, ClipboardList } from 'lucide-react'
import {
  useHabits, dateKey, toggleCheckIn, streakFor,
} from '@/lib/habits'

export default function TrackerWidget() {
  const habits = useHabits()
  const active = useMemo(() => habits.filter((h) => h.isActive !== false), [habits])
  const today = dateKey()
  const doneToday = useMemo(() => active.filter((h) => (h.checkIns || []).includes(today)).length, [active, today])
  const percent = active.length ? Math.round((doneToday / active.length) * 100) : 0
  const shown = active.slice(0, 5)

  return (
    <section aria-labelledby="tracker-widget-heading" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>Daily check-in</div>
          <h2 id="tracker-widget-heading" className="text-xl font-extrabold text-ss-text">Today’s Habits</h2>
        </div>
        {active.length > 0 && (
          <span className="font-mono text-[10px] text-ss-muted">{doneToday} of {active.length} done</span>
        )}
      </div>

      {active.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-ss-border-warm bg-ss-bg/60 p-6 text-center">
          <ClipboardList size={22} className="mx-auto text-ss-muted" />
          <p className="mt-2 text-sm text-ss-text">No habits set up yet.</p>
          <p className="mt-1 text-xs text-ss-muted">Create habits based on your genome findings.</p>
          <Link href="/tracker" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ss-green px-4 py-1.5 text-xs font-semibold text-white hover:brightness-110">
            Set up habits <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-1">
            {shown.map((h) => {
              const done = (h.checkIns || []).includes(today)
              const s = streakFor(h)
              return (
                <li key={h.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5 transition hover:bg-ss-bg/60">
                  <button
                    type="button" aria-label={done ? 'Uncheck habit' : 'Check habit'} aria-pressed={done}
                    onClick={() => toggleCheckIn(h.id, today)}
                    className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full transition"
                    style={done
                      ? { backgroundColor: h.color, color: 'white' }
                      : { border: `2px solid ${h.color}` }}
                  >
                    {done ? <CheckCircle2 size={16} strokeWidth={0} fill="currentColor" /> : null}
                  </button>
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${done ? 'text-ss-muted line-through' : 'text-ss-text'}`}>
                    {h.name}
                  </span>
                  {s >= 3 && (
                    <span className="flex-shrink-0 font-mono text-[10px] text-ss-muted">
                      🔥 {s}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          {active.length > 5 && (
            <Link href="/tracker" className="mt-2 inline-block font-mono text-[10.5px] font-semibold text-ss-teal hover:underline">
              + {active.length - 5} more habit{active.length - 5 === 1 ? '' : 's'}
            </Link>
          )}

          <div className="mt-4">
            <div className="h-1 w-full overflow-hidden rounded-full bg-ss-border-warm/40">
              <div className="h-full rounded-full bg-ss-green transition-[width] duration-300" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-ss-muted">{doneToday} of {active.length} done today</span>
              <Link href="/tracker" className="inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
                Open tracker <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
