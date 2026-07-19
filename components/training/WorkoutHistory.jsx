'use client'

// /app/components/training/WorkoutHistory.jsx
// Timeline view of past workout sessions. Reads from sessionStore, groups
// by month, shows compact per-session cards (date, day type, duration,
// exercise count, avg RPE). Expanding a card reveals per-exercise
// breakdown with a "Getting stronger" indicator via detectPr().

import { useEffect, useMemo, useState } from 'react'
import {
  History, ChevronDown, ChevronUp, TrendingUp, Clock, Activity, Zap,
} from 'lucide-react'
import { getAllSessions, detectPr } from '@/lib/training/sessionStore'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function formatDuration(sec) {
  const m = Math.floor((sec || 0) / 60)
  const s = (sec || 0) % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function groupByMonth(sessions) {
  const groups = new Map()
  for (const s of sessions) {
    const d = new Date(s.dateISO)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  }
  return [...groups.entries()].map(([key, sessions]) => {
    const [y, m] = key.split('-')
    return { label: `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`, sessions }
  })
}

export default function WorkoutHistory() {
  const [sessions, setSessions] = useState([])
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    const refresh = () => setSessions(getAllSessions())
    refresh()
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:training-session-saved', refresh)
      return () => window.removeEventListener('selfscience:training-session-saved', refresh)
    }
  }, [])

  const months = useMemo(() => groupByMonth(sessions), [sessions])

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white/60 p-8 text-center">
        <History size={22} className="mx-auto text-ss-muted" />
        <p className="mt-2 text-sm font-semibold text-ss-teal">No sessions logged yet</p>
        <p className="mt-1 text-xs text-ss-muted">
          Tap “Start workout” on any day's session to begin tracking. Every session you save shows up here.
        </p>
      </div>
    )
  }

  const totalMins = Math.round(sessions.reduce((s, x) => s + (x.durationSec || 0), 0) / 60)
  const totalReps = sessions.reduce((s, x) => s + (x.exercises?.length || 0), 0)

  return (
    <div className="space-y-4">
      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-2">
        <Stat icon={Activity} label="Total sessions" value={sessions.length} />
        <Stat icon={Clock} label="Total minutes" value={totalMins} />
        <Stat icon={Zap} label="Exercises logged" value={totalReps} />
      </div>

      {months.map((m) => (
        <div key={m.label}>
          <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-muted">
            {m.label}
          </div>
          <ul className="space-y-2">
            {m.sessions.map((s) => {
              const isOpen = expanded.has(s.id)
              return (
                <li key={s.id} className="overflow-hidden rounded-2xl border border-ss-border-warm bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="flex w-full min-h-11 items-center justify-between gap-2 p-3 text-left hover:bg-ss-bg/40"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-ss-teal">{formatDate(s.dateISO)}</span>
                        <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold text-ss-teal">{s.label}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-ss-muted">
                        {(s.exercises || []).length} exercise{(s.exercises || []).length === 1 ? '' : 's'} · {formatDuration(s.durationSec)}{s.avgRpe != null ? ` · RPE ${s.avgRpe}` : ''}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-ss-muted" /> : <ChevronDown size={14} className="text-ss-muted" />}
                  </button>
                  {isOpen && (
                    <div className="space-y-1.5 border-t border-ss-border-warm/60 bg-ss-bg/30 p-3">
                      {(s.exercises || []).map((e, i) => {
                        const doneSets = (e.sets || []).filter((x) => x.done).length
                        const totalSets = (e.sets || []).length
                        const pr = detectPr(e.id, e.sets, e.rpe)
                        return (
                          <div key={`${e.id}-${i}`} className="flex items-center justify-between gap-2 text-[12px]">
                            <span className="line-clamp-1 min-w-0 flex-1 text-ss-text">{e.name}</span>
                            <span className="shrink-0 text-ss-muted">
                              {doneSets}/{totalSets} sets{e.rpe != null ? ` · RPE ${e.rpe}` : ''}
                            </span>
                            {pr && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-ss-green/15 px-2 py-0.5 text-[10px] font-bold text-ss-green">
                                <TrendingUp size={10} /> Getting stronger
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-ss-border-warm bg-white p-2.5 text-center shadow-sm">
      <Icon size={14} className="mx-auto text-ss-teal" />
      <div className="mt-1 text-lg font-extrabold text-ss-teal">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-ss-muted">{label}</div>
    </div>
  )
}
