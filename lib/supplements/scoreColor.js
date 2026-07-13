// /app/lib/supplements/scoreColor.js
// Deterministic colour map for the 0-5 transparency score.
// Used in the score chip on cards AND the drawer meter.
//   5 = emerald (best-in-class)
//   4 = teal    (excellent)
//   3 = amber   (fair)
//   2 = orange  (limited)
//   1 = red     (concerning)
//   0 = slate   (unknown)

export const SCORE_STYLES = {
  5: { chip: 'bg-emerald-100 text-emerald-800 border-emerald-300',      bar: 'bg-emerald-500',     label: 'Best-in-class' },
  4: { chip: 'bg-teal-100 text-teal-800 border-teal-300',                bar: 'bg-teal-500',        label: 'Excellent' },
  3: { chip: 'bg-amber-100 text-amber-800 border-amber-300',             bar: 'bg-amber-500',       label: 'Fair' },
  2: { chip: 'bg-orange-100 text-orange-800 border-orange-300',          bar: 'bg-orange-500',      label: 'Limited' },
  1: { chip: 'bg-red-100 text-red-800 border-red-300',                   bar: 'bg-red-500',         label: 'Concerning' },
  0: { chip: 'bg-slate-100 text-slate-700 border-slate-300',             bar: 'bg-slate-400',       label: 'Unknown' },
}

export function getScoreStyle(score) {
  if (typeof score !== 'number') return SCORE_STYLES[0]
  const clamped = Math.max(0, Math.min(5, Math.round(score)))
  return SCORE_STYLES[clamped]
}
