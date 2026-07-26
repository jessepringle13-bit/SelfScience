'use client'

// /app/components/goals/GoalCompletionCelebration.jsx
// Full-screen celebration overlay when a goal is marked complete.
// Auto-dismisses after 6 seconds. Confetti respects prefers-reduced-motion.
// Persists ss_goal_celebration_[goalId]=true so it never fires twice.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, X, Sparkles } from 'lucide-react'
import { getCategory, daysActive } from '@/lib/goals'
import { getGenomeContext } from '@/lib/goalGenomeContext'

const STORAGE_PREFIX = 'ss_goal_celebration_'

export function markCelebrationShown(goalId) {
  if (typeof window === 'undefined' || !goalId) return
  try { window.localStorage.setItem(STORAGE_PREFIX + goalId, 'true') } catch {}
}
export function celebrationAlreadyShown(goalId) {
  if (typeof window === 'undefined' || !goalId) return false
  try { return window.localStorage.getItem(STORAGE_PREFIX + goalId) === 'true' } catch { return false }
}

export default function GoalCompletionCelebration({ goal, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
  }, [])

  useEffect(() => {
    if (!goal) return
    const t = setTimeout(() => onClose?.(), 6000)
    return () => clearTimeout(t)
  }, [goal, onClose])

  if (!goal) return null
  const cat = getCategory(goal.category)
  const ctx = goal.variantSource ? getGenomeContext(goal.category) : null
  const days = daysActive(goal)
  const entries = (goal.progressLog || []).length

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} aria-hidden="true" />

      {/* Confetti */}
      {!reduce && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => {
            const colors = ['#2E7D32', '#964219', '#1B474D', '#FFFFFF']
            const delay = (i * 60) + 'ms'
            const left = ((i * 137) % 100) + '%'
            const bg = colors[i % 4]
            return (
              <span
                key={i}
                aria-hidden="true"
                className="absolute -top-6 h-3 w-2 rounded-sm confetti-piece"
                style={{ left, backgroundColor: bg, animationDelay: delay }}
              />
            )
          })}
        </div>
      )}

      {/* Center card */}
      <div
        className="relative w-full max-w-md rounded-3xl border-2 border-ss-green bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
        >
          <X size={14} />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ss-green/15 text-ss-green">
          <CheckCircle2 size={40} strokeWidth={2} />
        </div>

        <h2 className="mt-4 text-3xl font-extrabold text-ss-green">Goal Complete</h2>
        <div className="mt-1 text-lg font-bold text-ss-text">{goal.title}</div>

        <div className="mt-3 font-mono text-[11px] text-ss-muted">
          Started {days} day{days === 1 ? '' : 's'} ago • {entries} progress entr{entries === 1 ? 'y' : 'ies'} logged
        </div>

        {goal.variantSource && ctx && (
          <div className="mt-4 border-t border-dashed border-ss-border-warm pt-4">
            <p className="text-[13px] italic leading-snug text-ss-muted">
              Your <strong className="not-italic text-ss-text">{ctx.gene}</strong> finding made this goal especially relevant for your biology.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <a
            href="/goals?new=1"
            className="inline-flex items-center justify-center gap-1 rounded-full bg-ss-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Sparkles size={13} /> Set a new goal →
          </a>
          <a
            href="/goals?status=completed"
            className="inline-flex items-center justify-center rounded-full border border-ss-border-warm bg-white px-5 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-bg"
          >
            View all completed goals
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(0, 110vh, 0) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          animation: confettiFall 1.2s cubic-bezier(0.2, 0.7, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
