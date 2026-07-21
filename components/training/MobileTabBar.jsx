'use client'

// /app/components/training/MobileTabBar.jsx
// Fixed bottom tab bar for the training tool on <md screens. 4 primary
// anchor tabs (Today / Blueprint / History / Supplements) + a "More"
// button that opens a bottom sheet listing EVERY remaining tab so mobile
// users can reach any part of the training tool the same way desktop
// users can.

import { useEffect } from 'react'
import {
  Dumbbell, Calendar, History, Pill, MoreHorizontal,
  Target, Home, Wind, Coffee, Wrench, LineChart, X, Share2, Dna,
} from 'lucide-react'
import { useState } from 'react'

// Primary tabs on the bottom bar — kept small to preserve tap targets.
const PRIMARY = [
  { key: 'workouts',    label: 'Today',       Icon: Dumbbell },
  { key: 'blueprint',   label: 'Blueprint',   Icon: Calendar },
  { key: 'history',     label: 'History',     Icon: History },
  { key: 'supplements', label: 'Supplements', Icon: Pill },
]

// Full tab set, mirrored from the desktop TabNav so mobile has parity.
const ALL_TABS = [
  { key: 'overview',    label: 'Overview',        Icon: Home,      hint: 'Program summary' },
  { key: 'profile',     label: 'Genetic Profile', Icon: Dna,       hint: 'How your DNA shapes training' },
  { key: 'workouts',    label: "Today's Workout", Icon: Dumbbell,  hint: 'Active sessions + set trackers' },
  { key: 'blueprint',   label: 'Weekly Blueprint', Icon: Calendar, hint: 'Your 7-day plan' },
  { key: 'history',     label: 'History',         Icon: History,   hint: 'Past sessions + PRs' },
  { key: 'mobility',    label: 'Mobility',        Icon: Wind,      hint: 'Warm-up + cooldown flows' },
  { key: 'recovery',    label: 'Recovery',        Icon: Coffee,    hint: 'Readiness + active recovery' },
  { key: 'supplements', label: 'Supplements',     Icon: Pill,      hint: 'Timing schedule + doses' },
  { key: 'equipment',   label: 'Equipment',       Icon: Wrench,    hint: 'Gear + substitutions' },
  { key: 'metrics',     label: 'Metrics',         Icon: LineChart, hint: 'Body comp + biomarkers' },
  { key: 'goals',       label: 'Goals',           Icon: Target,    hint: 'Milestones + progress' },
  { key: 'coach',       label: 'Coach Share',     Icon: Share2,    hint: 'Printable brief for your coach' },
]

export default function MobileTabBar({ active, onChange, hide = false }) {
  const [moreOpen, setMoreOpen] = useState(false)

  // Close More sheet on Escape
  useEffect(() => {
    if (!moreOpen || typeof window === 'undefined') return
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  if (hide) return null

  // If the active tab isn't in the primary set, keep the primary bar's
  // active state clean AND highlight the More button instead.
  const activeIsPrimary = PRIMARY.some((t) => t.key === active)

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ss-teal-ink/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Training tabs"
      >
        <div className="grid grid-cols-5">
          {PRIMARY.map(({ key, label, Icon }) => {
            const isActive = active === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setMoreOpen(false); onChange(key) }}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition ${
                  isActive ? 'text-ss-teal' : 'text-white/70 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isActive ? 'bg-white text-ss-teal shadow-md' : ''
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span className={isActive ? 'text-white' : ''}>{label}</span>
              </button>
            )
          })}

          {/* MORE button */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More training tabs"
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition ${
              (moreOpen || !activeIsPrimary) ? 'text-ss-teal' : 'text-white/70 hover:text-white'
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                (moreOpen || !activeIsPrimary) ? 'bg-white text-ss-teal shadow-md' : ''
              }`}
            >
              <MoreHorizontal size={18} />
            </span>
            <span className={(moreOpen || !activeIsPrimary) ? 'text-white' : ''}>More</span>
          </button>
        </div>
      </nav>

      {/* MORE sheet — all 10 tabs so mobile users have full parity */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 md:hidden"
          onClick={() => setMoreOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="training-more-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-white p-4 shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" aria-hidden="true" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div id="training-more-title" className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
                  Training tabs
                </div>
                <div className="text-[11px] text-ss-muted">Tap any section to jump there.</div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TABS.map(({ key, label, Icon, hint }) => {
                const isActive = active === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setMoreOpen(false); onChange(key) }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition ${
                      isActive
                        ? 'border-ss-teal bg-ss-teal/10 shadow-sm'
                        : 'border-ss-border-warm/60 bg-white hover:border-ss-teal/60 hover:shadow-sm'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isActive ? 'bg-ss-teal text-white' : 'bg-ss-bg text-ss-teal'
                      }`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-ss-text">{label}</span>
                      {hint && <span className="mt-0.5 block text-[10.5px] text-ss-muted line-clamp-1">{hint}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
