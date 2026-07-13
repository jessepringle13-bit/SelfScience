// /app/components/biomarkers/Sparkline.jsx
// Tiny SVG sparkline for a single biomarker's history. Rendered inside
// BiomarkerCard when the user has 2+ dated snapshots for that marker.
// Uses the SelfScience target range to color-shade the background so a
// dot moving from grey → teal reads as "moved toward target".

'use client'

import { useMemo } from 'react'
import { seriesFor } from '@/lib/biomarkers/history'

export function Sparkline({ biomarker }) {
  const series = useMemo(() => seriesFor(biomarker.id), [biomarker.id])
  if (series.length < 2) return null // hide until there's a trend to draw

  const [oMin, oMax] = biomarker.optimization.optimal
  const values = series.map((s) => s.value)
  const dataMin = Math.min(...values, oMin)
  const dataMax = Math.max(...values, oMax)
  const pad = (dataMax - dataMin) * 0.15 || 1
  const yLo = dataMin - pad
  const yHi = dataMax + pad
  const yRange = yHi - yLo || 1

  const W = 260, H = 60, PX = 6
  const step = series.length > 1 ? (W - PX * 2) / (series.length - 1) : 0
  const xy = (i, v) => [PX + i * step, PX + ((yHi - v) / yRange) * (H - PX * 2)]

  const path = series.map((s, i) => {
    const [x, y] = xy(i, s.value)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  // Target band as a rectangle overlay
  const [xL] = xy(0, 0)
  const [xR] = xy(series.length - 1, 0)
  const [, yBandTop]    = xy(0, Math.min(oMax, yHi))
  const [, yBandBottom] = xy(0, Math.max(oMin, yLo))
  const bandY = Math.min(yBandTop, yBandBottom)
  const bandH = Math.abs(yBandTop - yBandBottom)

  const first = series[0]
  const last  = series[series.length - 1]
  const delta = last.value - first.value
  const towardTarget = (() => {
    const mid = (oMin + oMax) / 2
    return Math.abs(last.value - mid) < Math.abs(first.value - mid)
  })()

  return (
    <div className="rounded-lg bg-ss-bg/70 p-3">
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="font-bold uppercase tracking-widest text-ss-muted">Trend</span>
        <span className={`font-mono ${towardTarget ? 'text-emerald-700' : 'text-slate-500'}`}>
          {series.length} data points ·
          {' '}
          {delta > 0 ? '+' : ''}{delta.toFixed(delta >= 10 ? 0 : 1)} {biomarker.unit}
          {' '}
          {towardTarget ? '· moving toward target' : '· stable / away from target'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-14 w-full">
        <rect x={xL - 2} y={bandY} width={xR - xL + 4} height={bandH || 4}
              className="fill-ss-teal/15" />
        <path d={path} className="fill-none stroke-ss-teal" strokeWidth={1.5} />
        {series.map((s, i) => {
          const [x, y] = xy(i, s.value)
          return <circle key={i} cx={x} cy={y} r={2.5} className="fill-ss-orange" />
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] font-mono text-ss-muted">
        <span>{first.dateISO}</span>
        <span>{last.dateISO}</span>
      </div>
    </div>
  )
}

export default Sparkline
