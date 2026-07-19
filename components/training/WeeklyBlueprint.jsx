'use client'

// /app/components/training/WeeklyBlueprint.jsx
// Visual 7-day weekly training calendar — interactive:
//   • Highlights TODAY (only when viewing "This week")
//   • Marks completed days with a green checkmark from sessionStore
//   • Tapping a day fires onDayClick so the parent can navigate into that
//     day's session
//   • Streak counter + weekly completion summary
//   • Left/right chevrons navigate weeks; footer summarises "X of Y
//     sessions completed" for the visible week
//
// All localStorage reads are wrapped so SSR stays clean.

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar, Zap, Heart, Timer, Coffee, Wind, CheckCircle2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  getCompletedDaySet,
  getStreakDays,
  getSessionsForWeek,
} from '@/lib/training/sessionStore'

const INTENSITY_META = {
  easy:     { label: 'Easy',     bg: '#DCFCE7', text: '#059669' },
  moderate: { label: 'Moderate', bg: '#FEF3C7', text: '#B45309' },
  hard:     { label: 'Hard',     bg: '#FED7AA', text: '#C2410C' },
  max:      { label: 'Max',      bg: '#FECACA', text: '#B91C1C' },
}

function iconFor(type) {
  if (type?.startsWith('strength')) return Zap
  if (type === 'zone2_cardio') return Heart
  if (type === 'intervals') return Timer
  if (type === 'skill_power') return Zap
  if (type === 'mobility') return Wind
  if (type === 'active_recovery') return Coffee
  if (type === 'rest') return Coffee
  return Calendar
}

// Monday of the current calendar week for a given date.
function mondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

// YYYY-MM-DD for a Monday + weekday offset (0=Mon…6=Sun).
function isoForMondayAndWeekday(monday, weekdayIdx) {
  const target = new Date(monday)
  target.setDate(monday.getDate() + weekdayIdx)
  return target.toISOString().slice(0, 10)
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatWeekRange(monday) {
  const end = new Date(monday)
  end.setDate(monday.getDate() + 6)
  const sameMonth = monday.getMonth() === end.getMonth()
  const startPart = `${MONTH_ABBR[monday.getMonth()]} ${monday.getDate()}`
  const endPart = sameMonth ? `${end.getDate()}` : `${MONTH_ABBR[end.getMonth()]} ${end.getDate()}`
  return `${startPart}–${endPart}`
}

export default function WeeklyBlueprint({ blueprint, onDayClick, onStartToday }) {
  // weekOffset = 0 (current week), -1 = last week, +1 = next week, etc.
  const [weekOffset, setWeekOffset] = useState(0)
  const [completed, setCompleted] = useState(() => new Set())
  const [streak, setStreak] = useState(0)
  const [sessionsInView, setSessionsInView] = useState(0)

  const thisMonday = useMemo(() => mondayOf(new Date()), [])
  const viewMonday = useMemo(() => {
    const d = new Date(thisMonday)
    d.setDate(thisMonday.getDate() + weekOffset * 7)
    return d
  }, [thisMonday, weekOffset])

  useEffect(() => {
    const refresh = () => {
      setCompleted(getCompletedDaySet(180))
      setStreak(getStreakDays())
      setSessionsInView(getSessionsForWeek(viewMonday).length)
    }
    refresh()
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:training-session-saved', refresh)
      return () => window.removeEventListener('selfscience:training-session-saved', refresh)
    }
  }, [viewMonday])

  if (!blueprint?.days) return null

  const isCurrentWeek = weekOffset === 0
  const todayISO = new Date().toISOString().slice(0, 10)
  const activeDays = blueprint.days.filter((d) => d.type !== 'rest')
  const activeCount = activeDays.length

  const weekLabel = weekOffset === 0
    ? 'This week'
    : weekOffset === -1
      ? 'Last week'
      : weekOffset === 1
        ? 'Next week'
        : formatWeekRange(viewMonday)

  return (
    <div
      className="rounded-2xl border-2 border-ss-teal/30 bg-white p-5 shadow-md"
      style={{ background: 'linear-gradient(135deg, #F8FAFA 0%, #FFFFFF 60%, #F0F7F6 100%)' }}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-ss-teal" />
          <h3 className="text-sm font-extrabold text-ss-teal">Your Weekly Blueprint</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ss-orange/15 px-2 py-0.5 text-ss-orange">
              🔥 {streak}-day streak
            </span>
          )}
        </div>
      </div>

      {/* Week nav */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-ss-border-warm/60 bg-white/60 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ss-teal hover:bg-ss-teal/10"
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">{weekLabel}</span>
          <span className="text-[10px] text-ss-muted">{formatWeekRange(viewMonday)}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="min-h-11 rounded-full px-2 text-[10px] font-bold uppercase tracking-wider text-ss-muted hover:text-ss-teal"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ss-teal hover:bg-ss-teal/10"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {blueprint.days.map((d, i) => {
          const meta = INTENSITY_META[d.intensity] || INTENSITY_META.easy
          const Icon = iconFor(d.type)
          const iso = isoForMondayAndWeekday(viewMonday, i)
          const isToday = iso === todayISO
          const isCompleted = completed.has(iso)
          const clickable = typeof onDayClick === 'function' && d.type !== 'rest' && isCurrentWeek
          const Component = clickable ? 'button' : 'div'
          return (
            <Component
              key={i}
              type={clickable ? 'button' : undefined}
              onClick={clickable ? () => onDayClick(i, d) : undefined}
              className={`relative flex min-h-11 flex-col overflow-hidden rounded-xl border-2 text-left shadow-md transition ${
                clickable ? 'hover:shadow-lg hover:-translate-y-0.5' : ''
              } ${isToday ? 'ring-2 ring-ss-teal ring-offset-1' : ''}`}
              style={{
                background: `linear-gradient(160deg, ${d.color}18 0%, #FFFFFF 60%, ${d.color}10 100%)`,
                borderColor: `${d.color}60`,
              }}
            >
              {isToday && (
                <span className="absolute right-1 top-1 z-10 rounded-full bg-ss-teal px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  Today
                </span>
              )}
              {isCompleted && (
                <span className="absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-ss-green text-white shadow-sm">
                  <CheckCircle2 size={12} />
                </span>
              )}
              <div
                className="border-b-2 px-2 pt-1.5 text-center text-[10px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: d.color, borderColor: `${d.color}30`, background: `${d.color}12` }}
              >
                {d.day}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3">
                <Icon size={18} style={{ color: d.color }} />
                <div className="text-center text-[11.5px] font-extrabold leading-tight" style={{ color: d.color }}>
                  {d.label}
                </div>
                <div className="text-center text-[10px] italic text-ss-muted line-clamp-2">{d.focus}</div>
              </div>
              <div
                className="flex items-center justify-between border-t px-2 py-1 text-[9.5px]"
                style={{ borderColor: `${d.color}30`, background: 'rgba(255,255,255,0.7)' }}
              >
                <span className="text-ss-muted">{d.duration}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 font-extrabold"
                  style={{ background: meta.bg, color: meta.text }}
                >
                  {meta.label}
                </span>
              </div>
            </Component>
          )
        })}
      </div>

      {/* Weekly completion summary */}
      <WeekSummary sessions={sessionsInView} target={activeCount} isFuture={weekOffset > 0} />

      {/* Start today's workout CTA — only on current week */}
      {isCurrentWeek && typeof onStartToday === 'function' && (() => {
        const jsDay = new Date().getDay()
        const idx = (jsDay + 6) % 7
        return blueprint.days[idx]?.type !== 'rest'
      })() && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onStartToday}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-teal px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            ▶ Start today&apos;s workout
          </button>
        </div>
      )}
    </div>
  )
}

function WeekSummary({ sessions, target, isFuture }) {
  const pct = target > 0 ? Math.min(100, Math.round((sessions / target) * 100)) : 0
  const complete = sessions >= target && target > 0
  return (
    <div className="mt-4 rounded-xl border border-ss-teal/20 bg-white/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-1 text-[11.5px] font-semibold">
        <span className="text-ss-teal">
          {isFuture
            ? `${target} session${target === 1 ? '' : 's'} planned`
            : <><span className="text-lg font-black">{sessions}</span> of {target} session{target === 1 ? '' : 's'} completed</>
          }
        </span>
        {!isFuture && (
          <span className={complete ? 'text-ss-green' : 'text-ss-muted'}>
            {complete ? '🎉 Week complete' : `${pct}%`}
          </span>
        )}
      </div>
      {!isFuture && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ss-border-warm/60">
          <div
            className={`h-full transition-all ${complete ? 'bg-ss-green' : 'bg-gradient-to-r from-ss-teal to-ss-green'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
