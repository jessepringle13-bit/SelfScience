'use client'

// /app/components/dashboard/GoalsWidget.jsx
// Compact goals summary widget for the dashboard. Shows up to 3 active
// goals with progress bars/milestones, plus counts.

import { useState } from 'react'
import Link from 'next/link'
import { Target, ArrowRight, Plus } from 'lucide-react'
import {
  useActiveGoals, useGoals, getCategory, progressPercent,
  daysUntil, onTrack,
} from '@/lib/goals'
import GoalCreationModal from '@/components/goals/GoalCreationModal'

export default function GoalsWidget() {
  const active = useActiveGoals()
  const all = useGoals()
  const [modalOpen, setModalOpen] = useState(false)

  const total = active.length
  const shown = active.slice(0, 3)
  const extras = Math.max(0, total - shown.length)
  const onTrackCount = active.filter(onTrack).length

  return (
    <section className="rounded-2xl border border-ss-border-warm bg-white p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">Progress</div>
          <h3 className="mt-0.5 text-lg font-extrabold text-ss-text">Your Goals</h3>
        </div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm px-3 py-1 text-[11px] font-semibold text-ss-teal hover:bg-ss-bg"
        >
          <Target size={11} /> View all
        </Link>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ss-bg text-ss-muted">
            <Target size={22} />
          </div>
          <div className="text-sm font-bold text-ss-text">No goals set yet.</div>
          <p className="max-w-[280px] text-[12px] text-ss-muted">
            Create goals based on what your genome suggests you focus on.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-full bg-ss-green px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-95"
          >
            Set your first goal →
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {shown.map((g) => {
              const cat = getCategory(g.category)
              const pct = progressPercent(g)
              const dTo = daysUntil(g.targetDate)
              return (
                <li key={g.id}>
                  <Link
                    href="/goals"
                    className="group flex items-center gap-3 rounded-lg border border-transparent p-2 hover:border-ss-border-warm hover:bg-ss-bg"
                    style={{ borderLeft: `3px solid ${cat.color}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-ss-text group-hover:underline">{g.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ss-bg">
                          <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                        </div>
                        <span className="font-mono text-[9px] text-ss-muted">{pct}%</span>
                      </div>
                      <div className="mt-1 font-mono text-[9px] text-ss-muted">
                        {dTo == null ? 'No deadline' : dTo < 0 ? `Overdue ${Math.abs(dTo)}d` : `${dTo} day${dTo === 1 ? '' : 's'} left`}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {extras > 0 && (
            <Link href="/goals" className="mt-3 inline-block text-[11px] font-semibold text-ss-teal hover:underline">
              + {extras} more goal{extras === 1 ? '' : 's'}
            </Link>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-ss-border-warm pt-3">
            <span className="font-mono text-[10px] text-ss-muted">
              {onTrackCount} of {total} goal{total === 1 ? '' : 's'} on track
            </span>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-ss-teal px-3 py-1 text-[11px] font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
            >
              <Plus size={11} /> New goal
            </button>
          </div>
        </>
      )}

      <GoalCreationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  )
}
