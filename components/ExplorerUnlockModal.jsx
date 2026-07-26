'use client'

// /app/components/ExplorerUnlockModal.jsx
// One-time celebratory unlock moment. Fires on whichever page the
// user is on the instant useGraduation().ready becomes true, if
// ss_explorer_unlock_shown hasn’t been set yet. Sets the LS flag
// immediately on open so it can only ever fire once.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Compass } from 'lucide-react'
import { useGraduation, setMode } from '@/lib/userPath'
import { useModuleProgress } from '@/lib/learningModules'

const LS_SHOWN = 'ss_explorer_unlock_shown'

const CONFETTI_COLORS = ['#FFFFFF', '#F5D9C4', '#F58642'] // white + soft cream + soft orange (reduced palette per design audit)
const CONFETTI_COUNT  = 20

function readAny(key, fallback = null) {
  try {
    const v = window.localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export default function ExplorerUnlockModal() {
  const router = useRouter()
  const grad = useGraduation()
  const progress = useModuleProgress()
  const [open, setOpen] = useState(false)

  // Fire the modal once when graduation crosses the threshold and
  // localStorage has not already recorded the unlock.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!grad?.ready) return
    if (window.localStorage.getItem(LS_SHOWN)) return
    try { window.localStorage.setItem(LS_SHOWN, '1') } catch {}
    setOpen(true)
  }, [grad?.ready])

  // Milestone truth-check: recompute from LS + progress each render.
  const milestones = useMemo(() => {
    if (typeof window === 'undefined') return { modules: false, explored: false, connected: false }
    const modules = Object.values(progress || {}).some((p) => p?.completedAt)

    // "Explored a finding" — align with graduationSignals() which
    // reads ss_explored_findings (an array of finding ids).
    const explored = readAny('ss_explored_findings', []) || []
    const rl       = readAny('ss_reading_list', []) || []
    const focus    = readAny('ss_focus_visits', {}) || {}
    const exploredFlag = (Array.isArray(explored) && explored.length > 0)
                      || (Array.isArray(rl) && rl.length > 0)
                      || Object.keys(focus).length > 0

    // Genome loaded OR at least one goal saved counts as \u201cconnected\u201d
    const genomeLoaded = !!window.sessionStorage.getItem('selfscience_genome_results')
                       || !!window.localStorage.getItem('ss_genome_meta')
    const goals = readAny('ss_goals', []) || []
    const hasGoal = Array.isArray(goals) ? goals.length > 0 : Object.keys(goals).length > 0
    const connected = genomeLoaded || hasGoal

    return { modules, explored: exploredFlag, connected }
  }, [progress, open])

  // Escape = "Stay in Guided Mode" (same as the secondary CTA).
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const enterExplorer = () => {
    setMode('explorer')
    setOpen(false)
    router.push('/')
  }

  const stayGuided = () => {
    // ss_explorer_unlock_shown is already set. The graduation banner
    // on /my-path remains available for later switching.
    setOpen(false)
  }

  const rows = [
    { key: 'modules',   met: milestones.modules,   label: 'Completed at least 1 learning module' },
    { key: 'explored',  met: milestones.explored,  label: 'Explored at least 1 gene in Focus Mode' },
    { key: 'connected', met: milestones.connected, label: 'Connected your data (genome uploaded or goal set)' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="explorer-unlock-title"
      className="fixed inset-0 z-[10001] flex items-center justify-center overflow-hidden bg-black/60 px-4"
    >
      {/* Confetti — pointer-events-none so it never blocks CTAs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
          const left = 20 + Math.random() * 60         // % from viewport left
          const delay = Math.random() * 0.6            // seconds
          const rot   = Math.random() * 720 - 360       // deg
          const size  = 6 + Math.random() * 6           // px
          const bg    = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
          return (
            <span
              key={i}
              className="ss-confetti-particle absolute top-1/4"
              style={{
                left: `${left}%`,
                width:  `${size}px`,
                height: `${size}px`,
                background: bg,
                animationDelay: `${delay}s`,
                transform: `rotate(${rot}deg)`,
              }}
            />
          )
        })}
      </div>

      {/* Modal card */}
      <div className="relative w-full max-w-[460px] rounded-[20px] bg-ss-bg-card p-10 shadow-[0_24px_64px_rgba(0,0,0,0.35)] md:p-9">
        <div className="flex flex-col items-center">
          <Compass size={48} className="text-ss-teal" />
          <div className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">Milestone reached</div>
          <h2 id="explorer-unlock-title" className="mt-2 text-[1.5rem] font-extrabold leading-tight text-ss-text">You’ve unlocked Explorer Mode.</h2>
          <p className="mx-auto mt-3 max-w-[380px] text-center text-[0.92rem] leading-relaxed text-ss-muted">
            You’ve built enough foundation to navigate SelfScience on your own. Explorer Mode gives you the full menus, all tools, and complete freedom — plus you can always return to your guided path whenever you want.
          </p>

          <ul className="mt-7 w-full space-y-2.5">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-3 text-[0.9rem] text-ss-text">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  r.met ? 'bg-ss-teal text-white' : 'border border-ss-muted text-ss-muted'
                }`}>
                  {r.met ? <span className="text-[13px] leading-none">✓</span> : <span className="text-[13px] leading-none">○</span>}
                </span>
                <span className={r.met ? 'text-ss-text' : 'text-ss-muted'}>{r.label}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={enterExplorer}
            className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-[26px] bg-ss-green text-[14.5px] font-bold text-white transition hover:brightness-95"
          >
            → Enter Explorer Mode
          </button>
          <button
            type="button"
            onClick={stayGuided}
            className="mt-3 text-[11px] font-semibold text-ss-muted hover:text-ss-text"
          >
            Stay in Guided Mode for now
          </button>
        </div>
      </div>

      <style jsx>{`
        .ss-confetti-particle {
          border-radius: 2px;
          opacity: 0.95;
          animation: ss-confetti-fall 2s ease-in forwards;
        }
        @keyframes ss-confetti-fall {
          0%   { transform: translate3d(0, -30vh, 0) rotate(0deg);   opacity: 1; }
          70%  {                                                     opacity: 1; }
          100% { transform: translate3d(0,  60vh, 0) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
