'use client'

// /app/components/training/WorkoutSession.jsx
// Renders a single day's session with an optional "session mode" that turns
// the exercise list into an interactive workout — set trackers, rest timers,
// RPE inputs, and a summary screen at the end that saves to localStorage.

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Timer, Heart, Coffee, Moon, Zap, Play, CheckCircle2, Clock, Award,
} from 'lucide-react'
import ExerciseCard from './ExerciseCard'
import FullscreenSession from './FullscreenSession'
import { saveCompletedSession, writeActiveSession, clearActiveSession } from '@/lib/training/sessionStore'

export default function WorkoutSession({ session, equipment, level, riskGenes = [] }) {
  if (!session) return null

  // Non-exercise session types unchanged
  if (session.type === 'rest') {
    return (
      <Card icon={Moon} title={`${session.day} — ${session.label}`} accent="#94A3B8">
        <div className="text-[12px] leading-relaxed text-ss-text">{session.rest?.notes}</div>
      </Card>
    )
  }
  if (session.type === 'active_recovery') {
    return (
      <Card icon={Coffee} title={`${session.day} — ${session.label}`} accent="#94A3B8" duration={session.recovery?.duration}>
        <div className="text-[12px] leading-relaxed text-ss-text">
          <div><span className="font-semibold text-ss-teal">Pick one:</span> {session.recovery?.modalities.join(', ')}.</div>
          <div className="mt-1 italic text-ss-muted">{session.recovery?.intensity}</div>
        </div>
      </Card>
    )
  }
  if (session.type === 'zone2_cardio') {
    return (
      <Card icon={Heart} title={`${session.day} — ${session.label}`} accent="#0891B2" duration={session.duration}>
        <div className="space-y-1.5 text-[12px] leading-relaxed text-ss-text">
          <div><span className="font-semibold text-ss-teal">Target:</span> {session.cardio.targetHR}</div>
          <div><span className="font-semibold text-ss-teal">Talk test:</span> {session.cardio.talkTest}</div>
          <div className="italic text-ss-muted">Modality is your choice: easy running, cycling, rowing, swimming, brisk hiking — whatever keeps you in Zone 2.</div>
        </div>
      </Card>
    )
  }
  if (session.type === 'intervals') {
    return (
      <Card icon={Timer} title={`${session.day} — ${session.label}`} accent="#EA580C" duration={session.duration}>
        <div className="text-[12px] leading-relaxed text-ss-text">
          <div><span className="font-semibold text-ss-teal">Sets:</span> {session.prescription?.sets}</div>
          <div><span className="font-semibold text-ss-teal">Work / rest:</span> {session.prescription?.reps}</div>
          <div className="mt-1 italic text-ss-muted">Warm up thoroughly (10 min easy + dynamic mobility) before starting intervals.</div>
        </div>
      </Card>
    )
  }

  // ---------------------- Exercise-based sessions ---------------------------
  return <ExerciseWorkout session={session} equipment={equipment} level={level} riskGenes={riskGenes} />
}

function ExerciseWorkout({ session, equipment, level, riskGenes }) {
  const [active, setActive] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [progress, setProgress] = useState({}) // id -> { sets, rpe, done }
  const [summary, setSummary] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const startedAt = useRef(null)

  // Detect mobile viewport at mount + resize so "Start workout" opens the
  // immersive full-screen mode on phones and the inline flow on desktop.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Aggregated progress reporting from each ExerciseCard.
  const handleProgress = (item) => {
    setProgress((prev) => ({ ...prev, [item.id]: item }))
  }

  // Persist in-flight state so a browser reload doesn't lose progress.
  useEffect(() => {
    if (!active) return
    writeActiveSession({
      dateISO: new Date().toISOString(),
      dayType: session.type,
      label: session.label,
      progress,
      startedAt: startedAt.current,
    })
  }, [active, progress, session])

  const startWorkout = () => {
    startedAt.current = Date.now()
    setActive(true)
    setSummary(null)
    setProgress({})
    if (isMobile) setFullscreen(true)
  }

  const finishWorkout = (overrideProgress) => {
    const finalProgress = overrideProgress || progress
    const durationSec = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0
    const exercises = (session.exercises || []).map((e) => {
      const p = finalProgress[e.id] || {}
      return {
        id: e.id,
        name: e.name,
        sets: p.sets || [],
        rpe: p.rpe ?? null,
      }
    })
    const rpes = exercises.map((e) => e.rpe).filter((v) => typeof v === 'number')
    const avgRpe = rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null
    const completedCount = exercises.filter((e) => e.sets.some((s) => s.done)).length
    const record = saveCompletedSession({
      dayType: session.type,
      label: session.label,
      durationSec,
      avgRpe,
      exercises,
    })
    clearActiveSession()
    setSummary({
      record,
      durationSec,
      completedCount,
      totalCount: (session.exercises || []).length,
      avgRpe,
    })
    setActive(false)
    setFullscreen(false)
  }

  // Auto-detect "everything done" so we can nudge the user to finish.
  const totalExercises = session.exercises?.length || 0
  const doneExercises = Object.values(progress).filter((p) => p?.done).length
  const canFinish = active && doneExercises > 0

  if (summary) {
    return <SummaryScreen summary={summary} onRestart={startWorkout} />
  }

  return (
    <Card icon={Zap} title={`${session.day} — ${session.label}`} accent="#059669" duration={session.duration}>
      {session.exercises?.length > 0 ? (
        <>
          {/* Start button banner */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ss-teal/30 bg-ss-teal/5 p-2">
            {!active ? (
              <>
                <div className="text-[12px] font-semibold text-ss-teal">
                  Ready to train? Track sets, rest and RPE as you go.
                </div>
                <button
                  type="button"
                  onClick={startWorkout}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-bold text-white shadow hover:brightness-110"
                >
                  <Play size={14} /> Start workout
                </button>
              </>
            ) : (
              <>
                <div className="text-[12px] font-semibold text-ss-teal">
                  <span className="tabular-nums">{doneExercises}</span> / {totalExercises} exercises complete
                </div>
                <div className="flex flex-wrap gap-2">
                  {isMobile && !fullscreen && (
                    <button
                      type="button"
                      onClick={() => setFullscreen(true)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ss-teal px-3 py-2 text-sm font-bold text-ss-teal hover:bg-ss-teal hover:text-white"
                    >
                      Resume in fullscreen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => finishWorkout()}
                    disabled={!canFinish}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-orange px-4 py-2 text-sm font-bold text-white shadow hover:brightness-110 disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} /> Finish & save
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="space-y-3">
            {session.exercises.map((e) => (
              <ExerciseCard
                key={e.id}
                exercise={e}
                equipment={equipment}
                level={level}
                interactive={active && !fullscreen}
                riskGenes={riskGenes}
                onProgress={handleProgress}
              />
            ))}
          </div>
          {/* Mobile immersive session mode. Renders as a portal overlay so
              it lives above the site nav / bottom tab bar. Progress
              flows back through handleProgress; Finish saves via
              finishWorkout(overrideProgress). */}
          <FullscreenSession
            open={fullscreen}
            exercises={session.exercises}
            riskGenes={riskGenes}
            onProgress={handleProgress}
            onFinish={(finalProgress) => finishWorkout(finalProgress)}
            onClose={() => setFullscreen(false)}
          />
        </>
      ) : (
        <div className="rounded border border-dashed border-ss-border-warm/70 p-3 text-center text-[11px] italic text-ss-muted">
          No exercises matched your equipment filter for this session. Try widening your equipment selection in the intake.
        </div>
      )}
    </Card>
  )
}

function SummaryScreen({ summary, onRestart }) {
  const { durationSec, completedCount, totalCount, avgRpe } = summary
  const mins = Math.floor(durationSec / 60)
  const secs = durationSec % 60
  return (
    <div className="rounded-2xl border-2 border-ss-green/40 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <Award className="text-ss-green" size={22} />
        <h3 className="text-lg font-extrabold text-ss-green">Session complete</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={Clock} label="Total time" value={`${mins}m ${secs}s`} />
        <Stat icon={CheckCircle2} label="Exercises done" value={`${completedCount} / ${totalCount}`} />
        <Stat icon={Zap} label="Avg RPE" value={avgRpe != null ? `${avgRpe} / 10` : '—'} />
      </div>
      <div className="mt-4 rounded-lg bg-ss-green/10 p-3 text-[12px] text-ss-text">
        Nice work. Saved to your history — the Weekly Blueprint will show today with a green check.
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onRestart}
          className="min-h-11 rounded-full px-3 text-xs font-semibold text-ss-muted hover:text-ss-teal"
        >
          Start another set
        </button>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-ss-border-warm bg-ss-bg/40 p-3">
      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ss-muted">
        <Icon size={12} /> {label}
      </div>
      <div className="text-lg font-extrabold text-ss-teal">{value}</div>
    </div>
  )
}

function Card({ icon: Icon, title, accent, duration, children }) {
  return (
    <div className="rounded-2xl border border-ss-border-warm bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: accent }} />
          <h3 className="text-sm font-extrabold" style={{ color: accent }}>{title}</h3>
        </div>
        {duration && <div className="text-[10px] font-semibold text-ss-muted">{duration}</div>}
      </div>
      {children}
    </div>
  )
}
