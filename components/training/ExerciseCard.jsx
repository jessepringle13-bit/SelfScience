'use client'

// /app/components/training/ExerciseCard.jsx
// Single interactive exercise card. Renders in two modes:
//   * BROWSE (default) — image, muscle target, prescription strip, cues, and
//     "Find alternative" for a same-muscle swap.
//   * SESSION (interactive=true) — tappable set-tracker circles, an
//     auto-starting rest timer between sets, RPE picker after the last set,
//     coaching cue always visible, and an injury-load flag for
//     connective-tissue-risk users.
//
// Set/RPE state is lifted via onProgress so a parent WorkoutSession can
// aggregate per-exercise progress and save the whole session to
// localStorage when the user's done.

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown, ChevronUp, RefreshCw, Target, Image as ImgIcon,
  AlertCircle, CheckCircle2, Timer as TimerIcon, Play, Pause, ShieldAlert,
} from 'lucide-react'

// Parse a tempo string like "2-1-2-0" or "3-0-1-0" into 4 phase seconds:
// [eccentric, bottom pause, concentric, top pause].
function parseTempo(t) {
  const parts = String(t || '')
    .split(/[-·:x\s]/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((p) => {
      const n = parseInt(p, 10)
      return isNaN(n) ? 0 : Math.max(0, Math.min(10, n))
    })
  if (parts.length !== 4) return null
  if (parts.every((n) => n === 0)) return null
  return parts
}

// TempoBars — a 4-bar visualiser that loops through Eccentric → Iso →
// Concentric → Iso, filling each bar over its per-phase seconds. If the
// tempo is unparsable, renders the raw text.
function TempoBars({ tempo }) {
  const phases = useMemo(() => parseTempo(tempo), [tempo])
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!phases) return
    const total = phases.reduce((a, b) => a + b, 0)
    if (total <= 0) return
    let cancelled = false
    const tick = (now) => {
      if (cancelled) return
      if (startRef.current == null) startRef.current = now
      const elapsedMs = (now - startRef.current) % (total * 1000)
      let cursor = 0
      for (let i = 0; i < phases.length; i++) {
        const durMs = phases[i] * 1000
        if (elapsedMs < cursor + durMs) {
          setPhaseIdx(i)
          setPhaseProgress(durMs === 0 ? 1 : (elapsedMs - cursor) / durMs)
          break
        }
        cursor += durMs
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      startRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phases])

  if (!phases) return <span>{tempo}</span>

  const LABELS = ['Ecc', 'Iso', 'Con', 'Iso']
  return (
    <span className="inline-flex items-end gap-1 align-middle" aria-label={`Tempo ${tempo}`}>
      {phases.map((sec, i) => {
        const active = i === phaseIdx && sec > 0
        const isPause = sec === 0
        const fillPct = active ? Math.round(phaseProgress * 100) : (i < phaseIdx ? 100 : 0)
        return (
          <span key={i} className="flex flex-col items-center leading-none">
            <span
              className="relative block h-4 w-2.5 overflow-hidden rounded-sm bg-ss-border-warm/60"
              title={`${LABELS[i]} · ${sec}s`}
            >
              {!isPause && (
                <span
                  className="absolute inset-x-0 bottom-0 bg-ss-teal transition-[height] duration-150 ease-linear"
                  style={{ height: `${fillPct}%`, opacity: active ? 1 : 0.5 }}
                />
              )}
              {isPause && (
                <span
                  className="absolute left-1/2 top-1/2 h-[2px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ss-muted/60"
                />
              )}
            </span>
            <span className={`mt-0.5 text-[8px] font-bold uppercase tracking-wider ${active ? 'text-ss-teal' : 'text-ss-muted'}`}>
              {sec}
            </span>
          </span>
        )
      })}
    </span>
  )
}

// Genes whose high-risk genotypes correlate with soft-tissue/tendon injury
// susceptibility per published associations. We flag exercises that load
// tendons heavily (deadlifts, plyos, etc.) when the user carries these.
const TENDON_RISK_GENES = new Set(['COL5A1', 'MMP3', 'COL1A1', 'GDF5'])
const HIGH_TENDON_LOAD_TAGS = new Set([
  'deadlift', 'squat', 'plyometric', 'jump', 'olympic', 'clean', 'snatch',
  'sprint', 'depth', 'pistol',
])

// Detect from exercise name/mechanic if it's high tendon load.
function isHighTendonLoad(ex) {
  const hay = `${ex?.name || ''} ${ex?.mechanic || ''}`.toLowerCase()
  for (const tag of HIGH_TENDON_LOAD_TAGS) if (hay.includes(tag)) return true
  return false
}

function parseSetCount(setsField) {
  if (typeof setsField === 'number') return Math.max(1, Math.min(8, setsField))
  const m = String(setsField || '').match(/(\d+)/)
  const n = m ? parseInt(m[1], 10) : 3
  return Math.max(1, Math.min(8, isNaN(n) ? 3 : n))
}

function parseRestSeconds(restField) {
  if (typeof restField === 'number') return restField
  const s = String(restField || '')
  const m = s.match(/(\d+)\s*(s|sec|second|m|min|minute)?/i)
  if (!m) return 90
  const num = parseInt(m[1], 10)
  const unit = (m[2] || 's').toLowerCase()
  return unit.startsWith('m') ? num * 60 : num
}

export default function ExerciseCard({
  exercise, equipment, level,
  interactive = false,
  riskGenes = [], // e.g. ['COL5A1', 'MMP3']
  onProgress,     // ({ id, sets, rpe, done }) => void
}) {
  const [ex, setEx] = useState(exercise)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Session-mode state
  const setCount = useMemo(() => parseSetCount(ex.sets), [ex.sets])
  const restSec = useMemo(() => parseRestSeconds(ex.rest), [ex.rest])
  const [sets, setSets] = useState(() => Array.from({ length: setCount }, () => ({ done: false })))
  const [rpe, setRpe] = useState(null)
  const [rest, setRest] = useState(0) // seconds remaining
  const [restPaused, setRestPaused] = useState(false)
  const timerRef = useRef(null)

  // Countdown ticker.
  useEffect(() => {
    if (!interactive) return
    if (rest <= 0 || restPaused) return
    timerRef.current = setInterval(() => {
      setRest((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current)
          // Haptic buzz on completion (Vibration API — no-op on unsupported)
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([200, 80, 200]) } catch { /* noop */ }
          }
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [rest, restPaused, interactive])

  const allDone = sets.every((s) => s.done)
  const showRpe = allDone && rpe === null

  // Bubble progress up.
  useEffect(() => {
    if (!interactive || !onProgress) return
    onProgress({ id: ex.id, name: ex.name, sets, rpe, done: allDone && rpe !== null })
  }, [sets, rpe, allDone, ex.id, ex.name, interactive, onProgress])

  const markSet = (idx) => {
    if (!interactive) return
    setSets((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], done: !next[idx].done }
      return next
    })
    // Trigger rest timer after a set completion, but not after the last set
    // (RPE picker replaces it). Also skip if we're un-checking a set.
    const nextDoneCount = sets.filter((s) => s.done).length + 1
    if (nextDoneCount < setCount && !sets[idx].done) {
      setRest(restSec)
      setRestPaused(false)
    }
    // Haptic pulse on tap
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(35) } catch { /* noop */ }
    }
  }

  const findAlternative = async () => {
    setBusy(true)
    try {
      const params = new URLSearchParams({
        muscle: exercise.targetMuscle || (exercise.primaryMuscles?.[0] || 'chest'),
        exclude: ex.id,
      })
      if (equipment?.length) params.append('equipment', equipment.join(','))
      if (level) params.append('level', level)
      const res = await fetch(`/api/training/exercise-find?${params.toString()}`)
      const data = await res.json()
      if (data?.item) {
        setEx({
          ...data.item,
          targetMuscle: exercise.targetMuscle,
          sets: exercise.sets,
          reps: exercise.reps,
          rest: exercise.rest,
          tempo: exercise.tempo,
          cues: exercise.cues,
        })
      }
    } catch { /* noop */ }
    finally { setBusy(false) }
  }

  const hasImage = ex.imageUrls?.length > 0
  const coachingCue = ex.cues?.[0] || null
  const tendonRiskCarrier = riskGenes.some((g) => TENDON_RISK_GENES.has(String(g).toUpperCase()))
  const highTendon = tendonRiskCarrier && isHighTendonLoad(ex)
  const isComplete = interactive && allDone && rpe !== null

  return (
    <div className={`overflow-hidden rounded-2xl border border-ss-border-warm bg-white shadow-sm transition ${
      isComplete ? 'opacity-70' : ''
    }`}>
      <div className="flex gap-3 p-3">
        <div className="relative flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ss-bg">
          {hasImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={ex.imageUrls[0]} alt={ex.name} className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          ) : (
            <ImgIcon size={22} className="text-ss-muted" />
          )}
          {isComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-ss-green/25">
              <CheckCircle2 size={28} className="text-ss-green" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-extrabold leading-tight text-ss-teal">{ex.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-ss-muted">
                <span className="inline-flex items-center gap-0.5"><Target size={10} /> {(ex.primaryMuscles || []).join(', ') || ex.targetMuscle}</span>
                <span>· {ex.equipment}</span>
                <span>· {ex.level}</span>
                {ex.mechanic && <span>· {ex.mechanic}</span>}
              </div>
              {highTendon && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-ss-amber/15 px-2 py-0.5 text-[10px] font-bold text-ss-amber">
                  <ShieldAlert size={10} /> High tendon load — extend warm-up
                </div>
              )}
            </div>
            <button type="button" onClick={findAlternative} disabled={busy}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-teal px-2 py-1 text-[10px] font-semibold text-ss-teal transition hover:bg-ss-teal/10 disabled:opacity-40">
              <RefreshCw size={10} className={busy ? 'animate-spin' : ''} /> {busy ? '...' : 'Find alt'}
            </button>
          </div>

          {/* Prescription strip */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <span><span className="font-semibold text-ss-teal">Sets:</span> {ex.sets}</span>
            <span><span className="font-semibold text-ss-teal">Reps:</span> {ex.reps}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-ss-teal">Tempo:</span>
              <TempoBars tempo={ex.tempo} />
            </span>
            <span><span className="font-semibold text-ss-teal">Rest:</span> {ex.rest}</span>
          </div>

          {/* Coaching cue — always visible */}
          {coachingCue && (
            <div className="mt-2 rounded-lg bg-ss-orange/10 px-2 py-1.5 text-[11px] leading-snug text-ss-text">
              <span className="font-bold text-ss-orange">Cue: </span>{coachingCue}
            </div>
          )}
        </div>
      </div>

      {/* Interactive session controls */}
      {interactive && (
        <div className="border-t border-ss-border-warm/60 bg-ss-bg/30 px-4 py-3">
          {/* Set tracker */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ss-muted">Sets</span>
            {sets.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => markSet(i)}
                aria-label={`Set ${i + 1} ${s.done ? 'complete' : 'incomplete'}`}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                  s.done ? 'border-ss-green bg-ss-green text-white' : 'border-ss-border-warm bg-white text-ss-muted hover:border-ss-teal'
                }`}
              >
                {s.done ? <CheckCircle2 size={18} /> : i + 1}
              </button>
            ))}
          </div>

          {/* Rest timer */}
          {rest > 0 && !allDone && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-2 ring-1 ring-ss-border-warm/60">
              <TimerIcon size={16} className="text-ss-teal" />
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ss-muted">Rest</div>
                <div className="text-2xl font-black tabular-nums text-ss-teal">
                  {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestPaused((p) => !p)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ss-teal text-ss-teal hover:bg-ss-teal hover:text-white"
                aria-label={restPaused ? 'Resume rest timer' : 'Pause rest timer'}
              >
                {restPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setRest(0)}
                className="min-h-11 rounded-full px-3 text-xs font-bold text-ss-muted hover:text-ss-teal"
              >
                Skip
              </button>
            </div>
          )}

          {/* RPE picker after last set */}
          {showRpe && (
            <div className="mt-3">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ss-muted">
                How hard was that? (1 easy — 10 max)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRpe(n)}
                    className={`h-11 w-11 rounded-full border-2 text-sm font-bold transition ${
                      rpe === n
                        ? 'border-ss-orange bg-ss-orange text-white'
                        : 'border-ss-border-warm bg-white text-ss-muted hover:border-ss-orange'
                    }`}
                    aria-label={`RPE ${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ss-green/15 px-3 py-1 text-[11px] font-bold text-ss-green">
              <CheckCircle2 size={12} /> Exercise complete · RPE {rpe}
            </div>
          )}
        </div>
      )}

      {/* Non-interactive details toggle (BROWSE mode) */}
      {!interactive && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)}
            className="ml-4 mb-2 inline-flex min-h-11 items-center gap-1 text-[11px] font-semibold text-ss-orange">
            {open ? <>Hide details <ChevronUp size={11} /></> : <>Show details <ChevronDown size={11} /></>}
          </button>
          {open && (
            <div className="space-y-3 border-t border-ss-border-warm/50 bg-ss-bg/30 px-4 py-3 text-[11.5px] leading-relaxed text-ss-text">
              {ex.instructions?.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">Step-by-step</div>
                  <ol className="mt-1 list-decimal space-y-1 pl-4">
                    {ex.instructions.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
              {ex.cues?.length > 1 && (
                <div className="rounded border-l-4 border-ss-orange bg-orange-50 p-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-orange">More coaching notes</div>
                  {ex.cues.slice(1).map((c, i) => <div key={i} className="mt-1 flex gap-1"><AlertCircle size={11} className="mt-0.5 shrink-0 text-ss-orange" /><span>{c}</span></div>)}
                </div>
              )}
              {ex.imageUrls?.length > 1 && (
                <div className="flex gap-2">
                  {ex.imageUrls.slice(0, 2).map((u, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img key={i} src={u} alt={`${ex.name} ${i+1}`} className="h-24 w-32 rounded object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
