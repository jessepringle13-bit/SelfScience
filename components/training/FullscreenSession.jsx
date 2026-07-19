'use client'

// /app/components/training/FullscreenSession.jsx
// Immersive mobile session mode. Renders as a fixed full-viewport overlay
// (portaled to document.body) with a dark ss-teal-ink background. One
// exercise at a time, tap the set circles to mark complete, big rest
// timer with an SVG progress ring, swipe left/right (or tap chevrons) to
// move between exercises, muted "End session" top-right.
//
// Progress is bubbled up via onProgress so the parent WorkoutSession can
// save the completed session when the user hits "Finish & save" in the
// summary screen at the end (or an End Session tap → save).
//
// Vibration API used for tactile feedback on set-complete and rest-end.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, ShieldAlert,
  Pause, Play, SkipForward, Award,
} from 'lucide-react'

const TENDON_RISK_GENES = new Set(['COL5A1', 'MMP3', 'COL1A1', 'GDF5'])
const HIGH_TENDON_TAGS = ['deadlift', 'squat', 'plyometric', 'jump', 'olympic', 'clean', 'snatch', 'sprint', 'depth', 'pistol']

function isHighTendonLoad(ex) {
  const hay = `${ex?.name || ''} ${ex?.mechanic || ''}`.toLowerCase()
  return HIGH_TENDON_TAGS.some((t) => hay.includes(t))
}
function parseSetCount(f) {
  if (typeof f === 'number') return Math.max(1, Math.min(8, f))
  const n = parseInt(String(f || '').match(/\d+/)?.[0] || '3', 10)
  return Math.max(1, Math.min(8, isNaN(n) ? 3 : n))
}
function parseRestSec(f) {
  if (typeof f === 'number') return f
  const m = String(f || '').match(/(\d+)\s*(s|sec|second|m|min|minute)?/i)
  if (!m) return 90
  const n = parseInt(m[1], 10)
  return (m[2] || 's').toLowerCase().startsWith('m') ? n * 60 : n
}
function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern) } catch { /* noop */ }
  }
}

export default function FullscreenSession({
  open, exercises = [], riskGenes = [], onClose, onProgress, onFinish,
}) {
  const [idx, setIdx] = useState(0)
  // Progress map: exerciseId -> { sets:[{done}], rpe }
  const [progress, setProgress] = useState({})
  // Rest timer state (per-exercise session-local)
  const [rest, setRest] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [restPaused, setRestPaused] = useState(false)
  const restRef = useRef(null)
  // Touch swipe tracking
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  // Reset when opened
  useEffect(() => {
    if (open) {
      setIdx(0)
      setProgress({})
      setRest(0)
    }
  }, [open])

  // Body scroll lock while open
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Rest timer tick
  useEffect(() => {
    if (!open || rest <= 0 || restPaused) return
    restRef.current = setInterval(() => {
      setRest((r) => {
        if (r <= 1) {
          clearInterval(restRef.current)
          vibrate([200, 80, 200])
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(restRef.current)
  }, [rest, restPaused, open])

  // Bubble progress up
  useEffect(() => {
    if (!onProgress) return
    for (const [exId, p] of Object.entries(progress)) {
      const ex = exercises.find((e) => e.id === exId)
      onProgress({ id: exId, name: ex?.name, sets: p.sets, rpe: p.rpe, done: p.sets?.every((s) => s.done) && p.rpe != null })
    }
    // Intentionally re-fires on every progress update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  const current = exercises[idx]
  const setCount = useMemo(() => parseSetCount(current?.sets), [current])
  const restSec = useMemo(() => parseRestSec(current?.rest), [current])
  const currentProgress = current ? (progress[current.id] || { sets: Array.from({ length: setCount }, () => ({ done: false })), rpe: null }) : null

  const updateCurrent = (patch) => {
    if (!current) return
    setProgress((prev) => ({
      ...prev,
      [current.id]: { ...(prev[current.id] || { sets: Array.from({ length: setCount }, () => ({ done: false })), rpe: null }), ...patch },
    }))
  }

  const markSet = (i) => {
    if (!current) return
    const existing = currentProgress
    const next = [...existing.sets]
    const wasDone = next[i].done
    next[i] = { done: !wasDone }
    updateCurrent({ sets: next })
    vibrate(35)
    // Start rest if a new set was just completed and there are more sets left
    const doneCount = next.filter((s) => s.done).length
    if (!wasDone && doneCount < setCount) {
      setRest(restSec)
      setRestTotal(restSec)
      setRestPaused(false)
    }
  }

  const setRpe = (n) => {
    updateCurrent({ rpe: n })
    vibrate(30)
  }

  const goNext = () => {
    setRest(0)
    setIdx((v) => Math.min(v + 1, exercises.length - 1))
  }
  const goPrev = () => {
    setRest(0)
    setIdx((v) => Math.max(v - 1, 0))
  }

  const handleTouchStart = (e) => {
    if (e.touches?.length !== 1) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current
    const endY = e.changedTouches?.[0]?.clientY ?? touchStartY.current
    const dx = endX - touchStartX.current
    const dy = endY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    // Ignore vertical swipes; require horizontal delta > 60px
    if (Math.abs(dx) < 60 || Math.abs(dy) > 80) return
    if (dx < 0) goNext()
    else goPrev()
  }

  const handleEndSession = () => {
    // Save whatever was tracked so far
    if (typeof onFinish === 'function') onFinish(progress)
    if (typeof onClose === 'function') onClose()
  }

  if (!open || typeof document === 'undefined') return null

  const isLast = idx === exercises.length - 1
  const isFirst = idx === 0
  const allSetsDone = currentProgress?.sets?.every((s) => s.done)
  const exerciseDone = allSetsDone && currentProgress?.rpe != null
  // Session-wide completion: every exercise has all sets done + RPE set
  const sessionDone = exercises.length > 0 && exercises.every((e) => {
    const p = progress[e.id]
    return p?.sets?.every((s) => s.done) && p?.rpe != null
  })
  const doneCount = exercises.filter((e) => {
    const p = progress[e.id]
    return p?.sets?.every((s) => s.done) && p?.rpe != null
  }).length
  const highTendon = riskGenes.some((g) => TENDON_RISK_GENES.has(String(g).toUpperCase())) && isHighTendonLoad(current)

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col text-white"
      style={{
        background: 'linear-gradient(180deg, #0F2E3E 0%, #123847 60%, #0B242F 100%)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Workout session"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-[11px] font-semibold text-white/60">
          {idx + 1} / {exercises.length} · {doneCount} complete
        </div>
        <button
          type="button"
          onClick={handleEndSession}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/25 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
        >
          <X size={12} /> End session
        </button>
      </div>

      {/* Progress dots */}
      <div className="mb-2 flex justify-center gap-1 px-4">
        {exercises.map((e, i) => {
          const p = progress[e.id]
          const done = p?.sets?.every((s) => s.done) && p?.rpe != null
          return (
            <span
              key={e.id}
              className={`h-1 flex-1 rounded-full transition ${
                done ? 'bg-ss-green' : i === idx ? 'bg-white' : 'bg-white/25'
              }`}
              style={{ maxWidth: 40 }}
            />
          )
        })}
      </div>

      {/* Session complete gate */}
      {sessionDone ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Award size={48} className="text-ss-green" />
          <h2 className="text-2xl font-extrabold">Session complete</h2>
          <p className="text-sm text-white/70">Nice work. Tap below to save and see your summary.</p>
          <button
            type="button"
            onClick={handleEndSession}
            className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-full bg-ss-orange px-6 py-3 text-base font-bold text-white shadow-md hover:brightness-110"
          >
            <CheckCircle2 size={16} /> Finish & save
          </button>
        </div>
      ) : (
        <>
          {/* Exercise image (top half) */}
          <div className="relative mx-4 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
            {current?.imageUrls?.[0] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={current.imageUrls[0]}
                alt={current.name}
                className="h-full w-full object-cover opacity-90"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="text-xs text-white/40">No image</div>
            )}
            {highTendon && (
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-ss-amber/90 px-2 py-0.5 text-[10px] font-bold text-ss-teal-ink">
                <ShieldAlert size={10} /> High tendon load
              </span>
            )}
            {exerciseDone && (
              <div className="absolute inset-0 flex items-center justify-center bg-ss-green/30">
                <CheckCircle2 size={64} className="text-white" />
              </div>
            )}
          </div>

          {/* Name + cue */}
          <div className="px-4 pt-3">
            <div className="text-[11px] uppercase tracking-widest text-white/50">
              {(current?.primaryMuscles || []).join(', ') || current?.targetMuscle}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold leading-tight">{current?.name}</h2>
            {current?.cues?.[0] && (
              <div className="mt-2 rounded-lg bg-white/8 px-3 py-2 text-[12px] leading-snug text-white/90">
                <span className="font-bold text-ss-orange">Cue: </span>{current.cues[0]}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/70">
              <span><span className="font-semibold text-white">Reps:</span> {current?.reps}</span>
              <span><span className="font-semibold text-white">Tempo:</span> {current?.tempo}</span>
              <span><span className="font-semibold text-white">Rest:</span> {current?.rest}</span>
            </div>
          </div>

          {/* Set tracker */}
          <div className="mt-4 px-4">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">Sets</div>
            <div className="flex flex-wrap gap-2">
              {(currentProgress?.sets || []).map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => markSet(i)}
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-bold transition ${
                    s.done
                      ? 'border-ss-green bg-ss-green text-white'
                      : 'border-white/25 bg-white/5 text-white/80 active:bg-white/15'
                  }`}
                  aria-label={`Set ${i + 1} ${s.done ? 'complete' : 'incomplete'}`}
                >
                  {s.done ? <CheckCircle2 size={22} /> : i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Rest timer with progress ring */}
          {rest > 0 && !allSetsDone && (
            <div className="mt-4 flex items-center gap-3 px-4">
              <RestRing seconds={rest} total={restTotal} />
              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => setRestPaused((p) => !p)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/30 text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  {restPaused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
                </button>
                <button
                  type="button"
                  onClick={() => setRest(0)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-semibold text-white/90 hover:bg-white/15"
                >
                  <SkipForward size={14} /> Skip rest
                </button>
              </div>
            </div>
          )}

          {/* RPE picker after last set */}
          {allSetsDone && currentProgress?.rpe == null && (
            <div className="mt-5 px-4">
              <div className="mb-2 text-center text-[12px] font-semibold text-white/80">
                How hard was that? (1 easy — 10 max)
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRpe(n)}
                    className="h-12 w-12 rounded-full border-2 border-white/30 bg-white/5 text-sm font-bold text-white/90 transition active:border-ss-orange active:bg-ss-orange"
                    aria-label={`RPE ${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nav chevrons + auto-advance CTA */}
          <div className="mt-auto flex items-center justify-between gap-2 px-4 py-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 text-white/70 disabled:opacity-30"
              aria-label="Previous exercise"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex-1 text-center text-[11px] italic text-white/40">
              Swipe left / right or tap the arrows
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              className={`inline-flex h-14 items-center justify-center gap-1 rounded-full px-4 text-sm font-semibold transition ${
                exerciseDone ? 'bg-ss-green text-white shadow-md' : 'border border-white/25 text-white/70'
              } disabled:opacity-30`}
              aria-label="Next exercise"
            >
              {exerciseDone ? 'Next ' : ''}<ChevronRight size={22} />
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}

// SVG progress ring for the rest timer.
function RestRing({ seconds, total }) {
  const size = 96
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0
  const dash = c * pct
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#F97316"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 0.5s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-black tabular-nums text-white">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-white/50">Rest</div>
      </div>
    </div>
  )
}
