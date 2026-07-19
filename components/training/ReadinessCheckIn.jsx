'use client'

// /app/components/training/ReadinessCheckIn.jsx
// Morning readiness check-in — 5 tap-stars (sleep), 5 tap-bars (soreness),
// 5 tap-faces (subjective readiness), optional numeric HRV. Score updates
// live; below-threshold surfaces a banner suggesting active recovery.

import { useEffect, useState } from 'react'
import {
  Star, Zap, Smile, Frown, Meh, Battery, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import {
  saveReadiness,
  getTodayReadiness,
  isLowReadiness,
  LOW_THRESHOLD,
} from '@/lib/training/readinessStore'

const FACES = [Frown, Frown, Meh, Smile, Smile]

export default function ReadinessCheckIn({ onLowReadiness }) {
  const [existing, setExisting] = useState(null)
  const [sleep, setSleep] = useState(0)
  const [soreness, setSoreness] = useState(0)
  const [readiness, setReadiness] = useState(0)
  const [hrv, setHrv] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const t = getTodayReadiness()
    setExisting(t)
    if (t) {
      setSleep(t.sleep)
      setSoreness(t.soreness)
      setReadiness(t.readiness)
      setHrv(t.hrv ?? '')
      setSaved(true)
    }
  }, [])

  const canSave = sleep > 0 && soreness > 0 && readiness > 0
  const liveTotal = sleep + (soreness > 0 ? 6 - soreness : 0) + readiness
  const low = canSave && liveTotal <= LOW_THRESHOLD

  const handleSave = () => {
    const rec = saveReadiness({ sleep, soreness, readiness, hrv })
    if (rec) {
      setSaved(true)
      setExisting(rec)
      if (isLowReadiness(rec) && typeof onLowReadiness === 'function') onLowReadiness(rec)
    }
  }

  return (
    <div className="rounded-2xl border border-ss-teal/25 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Battery size={16} className="text-ss-teal" />
        <h3 className="text-sm font-extrabold text-ss-teal">Daily Readiness Check-In</h3>
      </div>
      <p className="mb-3 text-[11px] text-ss-muted">
        Takes 15 seconds — helps tune today's training. Stored locally, never sent to any server.
      </p>

      {/* Sleep */}
      <RowRating
        label="Sleep quality"
        Icon={Star}
        value={sleep}
        onChange={setSleep}
        emptyClass="text-ss-muted"
        activeClass="text-ss-orange fill-ss-orange"
      />

      {/* Soreness — more filled = more sore = worse */}
      <RowRating
        label="Muscle soreness (5 = very sore)"
        Icon={Zap}
        value={soreness}
        onChange={setSoreness}
        emptyClass="text-ss-muted"
        activeClass="text-red-500 fill-red-500"
      />

      {/* Readiness — 5 faces */}
      <div className="mt-2">
        <div className="mb-1.5 text-[11px] font-semibold text-ss-teal">Subjective readiness</div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const Face = FACES[n - 1]
            const on = readiness >= n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setReadiness(n)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                  on ? 'border-ss-green bg-ss-green/15 text-ss-green' : 'border-ss-border-warm bg-white text-ss-muted hover:border-ss-teal'
                }`}
                aria-label={`Readiness ${n} of 5`}
              >
                <Face size={18} />
              </button>
            )
          })}
        </div>
      </div>

      {/* HRV optional */}
      <div className="mt-3">
        <label className="text-[11px] font-semibold text-ss-teal">HRV (optional)</label>
        <input
          type="number"
          inputMode="numeric"
          value={hrv}
          onChange={(e) => setHrv(e.target.value)}
          placeholder="e.g. 62"
          className="mt-1 h-11 w-full rounded-lg border border-ss-border-warm bg-white px-3 text-sm outline-none focus:border-ss-teal"
        />
      </div>

      {/* Score bar */}
      {canSave && (
        <div className="mt-4 rounded-lg bg-ss-bg p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-ss-muted">Readiness score</span>
            <span className={low ? 'text-red-600' : 'text-ss-green'}>{liveTotal} / 15</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ss-border-warm">
            <div
              className={`h-full transition-all ${low ? 'bg-red-500' : 'bg-ss-green'}`}
              style={{ width: `${Math.max(0, Math.min(100, (liveTotal / 15) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Low readiness banner */}
      {low && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <strong>Your readiness is low today.</strong> Consider swapping to active recovery — a short walk, mobility flow, or breathwork will get you further than pushing through a hard session.
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-40"
        >
          {saved ? <><CheckCircle2 size={14} /> Update check-in</> : 'Save today\u2019s check-in'}
        </button>
        {existing && saved && (
          <span className="text-[11px] text-ss-muted">Saved locally · {new Date(existing.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
        )}
      </div>
    </div>
  )
}

function RowRating({ label, Icon, value, onChange, activeClass, emptyClass }) {
  return (
    <div className="mt-2">
      <div className="mb-1.5 text-[11px] font-semibold text-ss-teal">{label}</div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value >= n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                on ? 'border-ss-orange bg-ss-orange/10' : 'border-ss-border-warm bg-white hover:border-ss-teal'
              }`}
              aria-label={`${label} ${n} of 5`}
            >
              <Icon size={16} className={on ? activeClass : emptyClass} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
