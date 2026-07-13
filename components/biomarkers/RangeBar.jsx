// /app/components/biomarkers/RangeBar.jsx
// Visual bar showing standard clinical range vs SelfScience optimization
// range vs the user's current value — the single most credibility-building
// element of the redesigned biomarker card.

'use client'

export function RangeBar({ biomarker, value }) {
  const [oMin, oMax]  = biomarker.optimization.optimal
  const [bMin, bMax]  = biomarker.optimization.borderline
  const [sMin, sMax]  = biomarker.standard.interval

  // Bar spans from a little below the smaller of {stdMin, borderMin} to
  // a little above the larger of {stdMax, borderMax}.
  const lo = Math.min(sMin, bMin, oMin)
  const hi = Math.max(sMax, bMax, oMax)
  const pad = (hi - lo) * 0.08 || 1
  const start = Math.max(0, lo - pad)
  const end   = hi + pad
  const span  = end - start || 1

  const pct = (v) => `${Math.max(0, Math.min(100, ((v - start) / span) * 100))}%`

  const hasValue = typeof value === 'number' && Number.isFinite(value)
  const valuePct = hasValue ? pct(value) : null

  return (
    <div className="space-y-1.5">
      <div className="relative h-6 w-full overflow-hidden rounded-full bg-ss-border-warm/40">
        {/* Standard clinical range (soft grey) */}
        <div
          className="absolute top-1 h-4 rounded-full bg-slate-300/70"
          style={{ left: pct(sMin), width: `calc(${pct(sMax)} - ${pct(sMin)})` }}
          title={`Standard clinical: ${sMin}–${sMax}`}
        />
        {/* Borderline zone (amber) */}
        <div
          className="absolute top-2 h-2 rounded-full bg-amber-300/80"
          style={{ left: pct(bMin), width: `calc(${pct(bMax)} - ${pct(bMin)})` }}
          title={`Borderline: ${bMin}–${bMax}`}
        />
        {/* Optimization target (teal) */}
        <div
          className="absolute top-2 h-2 rounded-full bg-ss-teal"
          style={{ left: pct(oMin), width: `calc(${pct(oMax)} - ${pct(oMin)})` }}
          title={`SelfScience target: ${oMin}–${oMax}`}
        />
        {/* User value marker */}
        {valuePct != null && (
          <div
            className="absolute top-0 h-6 w-0.5 -translate-x-1/2 bg-ss-orange shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
            style={{ left: valuePct }}
            title={`Your value: ${value}`}
          >
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-ss-orange" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-ss-muted">
        <span>{start.toFixed(start < 10 ? 1 : 0)}</span>
        <div className="flex flex-wrap items-center gap-2">
          <LegendChip color="bg-slate-300/70" text={`Standard ${sMin}–${sMax}`} />
          <LegendChip color="bg-ss-teal" text={`SelfScience ${oMin}–${oMax}`} />
        </div>
        <span>{end.toFixed(end < 10 ? 1 : 0)}</span>
      </div>
    </div>
  )
}

function LegendChip({ color, text }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-ss-muted">
      <span className={`inline-block h-2 w-3 rounded-full ${color}`} />
      {text}
    </span>
  )
}

export default RangeBar
