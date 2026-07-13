'use client'

// /app/components/training/WorkoutSession.jsx
// Renders a single day's session — either an exercise list, a cardio
// prescription, an active-recovery card, or a rest note.

import { Timer, Heart, Coffee, Moon, Zap } from 'lucide-react'
import ExerciseCard from './ExerciseCard'

export default function WorkoutSession({ session, equipment, level }) {
  if (!session) return null

  if (session.type === 'rest') {
    return (
      <Card icon={Moon} title={`${session.day} — ${session.label}`} accent="#94A3B8">
        <div className="text-[12px] leading-relaxed text-ss-text">
          {session.rest?.notes}
        </div>
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

  // Exercise-based sessions
  return (
    <Card icon={Zap} title={`${session.day} — ${session.label}`} accent="#059669" duration={session.duration}>
      {session.exercises?.length > 0 ? (
        <div className="space-y-3">
          {session.exercises.map((e) => (
            <ExerciseCard key={e.id} exercise={e} equipment={equipment} level={level} />
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-ss-border-warm/70 p-3 text-center text-[11px] italic text-ss-muted">
          No exercises matched your equipment filter for this session. Try widening your equipment selection in the intake.
        </div>
      )}
    </Card>
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
