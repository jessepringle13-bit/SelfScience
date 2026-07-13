'use client'

// /app/components/training/WeeklyBlueprint.jsx
// Visual 7-day weekly training calendar.

import { Calendar, Zap, Heart, Timer, Coffee, Wind } from 'lucide-react'

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

export default function WeeklyBlueprint({ blueprint }) {
  if (!blueprint?.days) return null
  return (
    <div className="rounded-2xl border border-ss-border-warm bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar size={16} className="text-ss-teal" />
        <h3 className="text-sm font-extrabold text-ss-teal">Your Weekly Blueprint</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {blueprint.days.map((d, i) => {
          const meta = INTENSITY_META[d.intensity] || INTENSITY_META.easy
          const Icon = iconFor(d.type)
          return (
            <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-ss-border-warm/70 bg-ss-bg/40">
              <div className="px-2 pt-1.5 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-muted">
                {d.day}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3">
                <Icon size={16} style={{ color: d.color }} />
                <div className="text-center text-[11px] font-extrabold" style={{ color: d.color }}>
                  {d.label}
                </div>
                <div className="text-center text-[10px] italic text-ss-muted line-clamp-2">{d.focus}</div>
              </div>
              <div className="flex items-center justify-between border-t border-ss-border-warm/50 bg-white/70 px-2 py-1 text-[9px]">
                <span className="text-ss-muted">{d.duration}</span>
                <span className="rounded-full px-1.5 py-0.5 font-semibold" style={{ background: meta.bg, color: meta.text }}>
                  {meta.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
