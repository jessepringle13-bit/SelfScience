'use client'

// /app/components/training/WeeklyBlueprint.jsx
// Visual 7-day weekly training calendar — now interactive:
//   • Highlights TODAY with a teal border + "Today" pill
//   • Marks completed days with a green checkmark from sessionStore
//   • Tapping a day fires the onDayClick handler so the parent can
//     navigate into that day's session
//   • Renders a streak counter + weekly completion summary
//
// All localStorage reads are wrapped so SSR stays clean.

import { useEffect, useState } from 'react'
import {
  Calendar, Zap, Heart, Timer, Coffee, Wind, CheckCircle2,
} from 'lucide-react'
import {
  getCompletedDaySet,
  getStreakDays,
  getSessionsThisWeek,
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

// Given a day index (0=Mon,...,6=Sun), return the calendar YYYY-MM-DD for
// the current week's occurrence of that day.
function isoForWeekdayIndex(weekdayIdx) {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const target = new Date(monday)
  target.setDate(monday.getDate() + weekdayIdx)
  return target.toISOString().slice(0, 10)
}

function todayWeekdayIndex() {
  const jsDay = new Date().getDay()
  return (jsDay + 6) % 7 // Mon=0 … Sun=6
}

export default function WeeklyBlueprint({ blueprint, onDayClick, onStartToday }) {
  const [completed, setCompleted] = useState(() => new Set())
  const [streak, setStreak] = useState(0)
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0)

  useEffect(() => {
    const refresh = () => {
      setCompleted(getCompletedDaySet(14))
      setStreak(getStreakDays())
      setSessionsThisWeek(getSessionsThisWeek().length)
    }
    refresh()
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:training-session-saved', refresh)
      return () => window.removeEventListener('selfscience:training-session-saved', refresh)
    }
  }, [])

  if (!blueprint?.days) return null

  const todayIdx = todayWeekdayIndex()
  const activeDays = blueprint.days.filter((d) => d.type !== 'rest')
  const activeCount = activeDays.length

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
          <span className="text-ss-muted">
            {sessionsThisWeek} of {activeCount} sessions this week
          </span>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {blueprint.days.map((d, i) => {
          const meta = INTENSITY_META[d.intensity] || INTENSITY_META.easy
          const Icon = iconFor(d.type)
          const isToday = i === todayIdx
          const iso = isoForWeekdayIndex(i)
          const isCompleted = completed.has(iso)
          const clickable = typeof onDayClick === 'function' && d.type !== 'rest'
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

      {/* Start today's workout CTA */}
      {typeof onStartToday === 'function' && blueprint.days[todayIdx]?.type !== 'rest' && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onStartToday}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-teal px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            ▶ Start today's workout
          </button>
        </div>
      )}
    </div>
  )
}
