'use client'

// /app/components/training/ExerciseCard.jsx
// Single exercise card — image, muscle target, sets/reps/tempo/rest,
// cues, and "Find alternative" that queries the API for a same-muscle swap.

import { useState } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Target, Image as ImgIcon, AlertCircle } from 'lucide-react'

export default function ExerciseCard({ exercise, equipment, level }) {
  const [ex, setEx] = useState(exercise)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

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
        // Preserve prescription / cues from the original.
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

  return (
    <div className="overflow-hidden rounded-2xl border border-ss-border-warm bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ss-bg">
          {hasImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={ex.imageUrls[0]}
              alt={ex.name}
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <ImgIcon size={22} className="text-ss-muted" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold leading-tight text-ss-teal">{ex.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-ss-muted">
                <span className="inline-flex items-center gap-0.5"><Target size={10} /> {(ex.primaryMuscles || []).join(', ') || ex.targetMuscle}</span>
                <span>· {ex.equipment}</span>
                <span>· {ex.level}</span>
                {ex.mechanic && <span>· {ex.mechanic}</span>}
              </div>
            </div>
            <button type="button" onClick={findAlternative} disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-ss-teal px-2 py-1 text-[10px] font-semibold text-ss-teal transition hover:bg-ss-teal/10 disabled:opacity-40">
              <RefreshCw size={10} className={busy ? 'animate-spin' : ''} /> {busy ? '...' : 'Find alternative'}
            </button>
          </div>

          {/* Prescription strip */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <span><span className="font-semibold text-ss-teal">Sets:</span> {ex.sets}</span>
            <span><span className="font-semibold text-ss-teal">Reps:</span> {ex.reps}</span>
            <span><span className="font-semibold text-ss-teal">Tempo:</span> {ex.tempo}</span>
            <span><span className="font-semibold text-ss-teal">Rest:</span> {ex.rest}</span>
          </div>

          <button type="button" onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-ss-orange">
            {open ? <>Hide details <ChevronUp size={11} /></> : <>Show details <ChevronDown size={11} /></>}
          </button>
        </div>
      </div>

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
          {ex.cues?.length > 0 && (
            <div className="rounded border-l-4 border-ss-orange bg-orange-50 p-2">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-orange">Genetic coaching note</div>
              {ex.cues.map((c, i) => <div key={i} className="mt-1 flex gap-1"><AlertCircle size={11} className="mt-0.5 shrink-0 text-ss-orange" /><span>{c}</span></div>)}
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
    </div>
  )
}
