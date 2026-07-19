'use client'

// /app/components/nutrition/MealPlannerTab.jsx
// 7-day meal planner. On desktop: 7-column grid (Mon-Sun) × 4 rows
// (Breakfast / Lunch / Dinner / Snacks). On mobile: single-day
// horizontal scroller. Users pick foods from a compact search panel and
// tap a day/slot to assign. Persists in localStorage under ss_meal_plan.
//
// The planner intentionally uses tap-to-assign (not native HTML5 drag)
// so it works on touch devices too.

import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X, Plus, Search, ArrowRight } from 'lucide-react'

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const STORAGE_KEY = 'ss_meal_plan'

// Empty grid: { Mon: { Breakfast: [], Lunch: [], ... }, ... }
function emptyPlan() {
  const out = {}
  for (const d of DAYS) {
    out[d] = {}
    for (const m of MEALS) out[d][m] = []
  }
  return out
}

function readPlan() {
  if (typeof window === 'undefined') return emptyPlan()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyPlan()
    const parsed = JSON.parse(raw)
    // Merge with empty scaffold to be safe against missing keys.
    const base = emptyPlan()
    for (const d of DAYS) for (const m of MEALS) {
      if (Array.isArray(parsed?.[d]?.[m])) base[d][m] = parsed[d][m]
    }
    return base
  } catch { return emptyPlan() }
}

function writePlan(plan) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
    window.dispatchEvent(new CustomEvent('selfscience:meal-plan-changed'))
  } catch { /* noop */ }
}

// Flatten activeRules into a searchable food catalogue (prioritize + limit).
function buildCatalog(activeRules) {
  const out = []
  for (const rule of activeRules || []) {
    for (const f of rule.prioritize_foods || []) {
      out.push({ ...f, name: f.food, tone: 'good', ruleKey: rule.key, ruleTitle: rule.title })
    }
    for (const f of rule.limit_foods || []) {
      out.push({ ...f, name: f.food, tone: 'limit', ruleKey: rule.key, ruleTitle: rule.title })
    }
    for (const f of rule.avoid_foods || []) {
      out.push({ ...f, name: f.food, tone: 'warn', ruleKey: rule.key, ruleTitle: rule.title })
    }
  }
  // Dedupe by name (a food can appear in multiple rules).
  const seen = new Map()
  for (const f of out) {
    if (!seen.has(f.name)) seen.set(f.name, f)
  }
  return Array.from(seen.values())
}

// Estimate day-level macros (rough — sum of any nutrient-tagged carbs).
function estimateDayMacros(dayPlan) {
  let carbs = 0, protein = 0, fat = 0
  for (const meal of MEALS) {
    for (const item of dayPlan[meal] || []) {
      const nutrients = (item.nutrients || []).map((n) => n.toLowerCase())
      // Very rough heuristic — we don't have per-food macros in the rule
      // dataset. Tag-based increments give a directional signal:
      if (nutrients.some((n) => /protein|meat|fish|dairy|egg/.test(n))) protein += 15
      if (nutrients.some((n) => /carb|starch|grain|sugar/.test(n)))     carbs   += 20
      if (nutrients.some((n) => /fat|omega|oil|nut|seed/.test(n)))      fat     += 8
    }
  }
  return { carbs, protein, fat }
}

export default function MealPlannerTab({ activeRules, onCopyToJournal }) {
  const [plan, setPlan] = useState(emptyPlan)
  const [query, setQuery] = useState('')
  const [assignTarget, setAssignTarget] = useState(null) // { day, meal } — pending assignment
  const [visibleDayIdx, setVisibleDayIdx] = useState(0)  // mobile day pager
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setPlan(readPlan())
    const onEvt = () => setPlan(readPlan())
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:meal-plan-changed', onEvt)
      const storage = (e) => { if (e.key === STORAGE_KEY) setPlan(readPlan()) }
      window.addEventListener('storage', storage)
      return () => {
        window.removeEventListener('selfscience:meal-plan-changed', onEvt)
        window.removeEventListener('storage', storage)
      }
    }
  }, [])

  const catalog = useMemo(() => buildCatalog(activeRules), [activeRules])

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog.slice(0, 24)
    return catalog.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.reason || '').toLowerCase().includes(q) ||
        (f.nutrients || []).some((n) => n.toLowerCase().includes(q)),
    ).slice(0, 24)
  }, [catalog, query])

  const totalItems = useMemo(() => {
    let n = 0
    for (const d of DAYS) for (const m of MEALS) n += plan[d][m].length
    return n
  }, [plan])

  const assignFood = (food) => {
    if (!assignTarget) return
    const { day, meal } = assignTarget
    setPlan((prev) => {
      const next = { ...prev, [day]: { ...prev[day] } }
      // Dedupe by name inside the slot.
      const already = next[day][meal].some((f) => f.name === food.name)
      next[day][meal] = already ? next[day][meal] : [...next[day][meal], food]
      writePlan(next)
      return next
    })
    setAssignTarget(null)
    setQuery('')
  }

  const removeFood = (day, meal, name) => {
    setPlan((prev) => {
      const next = { ...prev, [day]: { ...prev[day], [meal]: prev[day][meal].filter((f) => f.name !== name) } }
      writePlan(next)
      return next
    })
  }

  const clearAll = () => {
    if (!confirm('Clear the whole meal plan?')) return
    const empty = emptyPlan()
    setPlan(empty); writePlan(empty)
  }

  const goToDay = (delta) => setVisibleDayIdx((i) => Math.max(0, Math.min(DAYS.length - 1, i + delta)))
  const activeDay = DAYS[visibleDayIdx]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
            <Calendar size={16} />
          </span>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">Weekly meal plan</div>
            <div className="text-[11px] text-ss-muted">
              {mounted ? `${totalItems} foods planned across the week` : 'Loading…'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {typeof onCopyToJournal === 'function' && (
            <button
              type="button"
              onClick={() => onCopyToJournal(plan)}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-teal bg-white px-3 py-1.5 text-[11px] font-bold text-ss-teal hover:bg-ss-teal hover:text-white"
            >
              Copy week to journal <ArrowRight size={11} />
            </button>
          )}
          {totalItems > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="min-h-11 rounded-full px-3 py-1.5 text-[11px] font-bold text-ss-muted hover:text-ss-red"
            >
              Clear plan
            </button>
          )}
        </div>
      </div>

      {/* Mobile day switcher */}
      <div className="flex items-center justify-between rounded-2xl border border-ss-border-warm/60 bg-white p-2 lg:hidden">
        <button
          type="button"
          onClick={() => goToDay(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ss-teal hover:bg-ss-teal/10"
          aria-label="Previous day"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-ss-teal">
          {activeDay}
        </div>
        <button
          type="button"
          onClick={() => goToDay(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ss-teal hover:bg-ss-teal/10"
          aria-label="Next day"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid — 7 cols on lg+, single day on mobile */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
        {DAYS.map((d, idx) => (
          <DayColumn
            key={d}
            day={d}
            dayPlan={plan[d]}
            className={idx !== visibleDayIdx ? 'hidden lg:block' : ''}
            onAssignStart={(meal) => setAssignTarget({ day: d, meal })}
            onRemove={(meal, name) => removeFood(d, meal, name)}
            highlighted={assignTarget?.day === d}
          />
        ))}
      </div>

      {/* Assignment / food picker panel */}
      {assignTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setAssignTarget(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-ss-border-warm/60 px-4 py-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">
                  Add to {assignTarget.day} · {assignTarget.meal}
                </div>
                <div className="text-[11px] text-ss-muted">Tap any food to assign it. Foods come from your active variant rules.</div>
              </div>
              <button
                type="button"
                onClick={() => setAssignTarget(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
                aria-label="Close picker"
              >
                <X size={16} />
              </button>
            </header>
            <div className="p-4">
              <div className="relative">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ss-muted" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search foods, nutrients, keywords…"
                  className="h-11 w-full rounded-full border border-ss-border-warm bg-white pl-8 pr-3 text-sm outline-none focus:border-ss-teal"
                />
              </div>
              <div className="mt-3 max-h-72 overflow-y-auto">
                {filteredCatalog.length === 0 ? (
                  <p className="p-4 text-center text-[12px] text-ss-muted">No foods match your search.</p>
                ) : (
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {filteredCatalog.map((f) => (
                      <li key={f.name}>
                        <button
                          type="button"
                          onClick={() => assignFood(f)}
                          className={`flex w-full items-start justify-between gap-2 rounded-lg border p-2 text-left transition hover:shadow-sm ${
                            f.tone === 'warn'  ? 'border-ss-orange/40 bg-ss-orange/5' :
                            f.tone === 'limit' ? 'border-ss-amber/40 bg-ss-amber/5' :
                                                  'border-ss-green/40 bg-ss-green/5'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[12.5px] font-bold text-ss-text">{f.name}</span>
                            <span className="mt-0.5 line-clamp-2 block text-[10.5px] text-ss-muted">{f.reason || f.notes || ''}</span>
                            {f.ruleTitle && (
                              <span className="mt-1 inline-block rounded-full bg-ss-teal/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ss-teal">
                                {f.ruleTitle}
                              </span>
                            )}
                          </span>
                          <Plus size={13} className="mt-1 shrink-0 text-ss-teal" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] italic text-ss-muted">
        For educational purposes only. Not a substitute for professional medical advice.
      </p>
    </div>
  )
}

function DayColumn({ day, dayPlan, onAssignStart, onRemove, highlighted, className = '' }) {
  const macros = estimateDayMacros(dayPlan)
  const totalItems = MEALS.reduce((s, m) => s + (dayPlan[m]?.length || 0), 0)
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border ${highlighted ? 'border-ss-teal ring-2 ring-ss-teal/30' : 'border-ss-border-warm/60'} bg-white ${className}`}>
      <div className="border-b border-ss-border-warm/60 bg-ss-bg/40 px-2 py-1.5 text-center">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">{day}</div>
        {totalItems > 0 && (
          <div className="text-[9px] text-ss-muted">{totalItems} planned</div>
        )}
      </div>
      <div className="flex-1 space-y-2 p-2">
        {MEALS.map((meal) => (
          <div key={meal} className="rounded-lg border border-dashed border-ss-border-warm/50 bg-ss-bg/20 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-ss-muted">{meal}</span>
              <button
                type="button"
                onClick={() => onAssignStart(meal)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ss-teal hover:bg-ss-teal/10"
                aria-label={`Add food to ${meal}`}
              >
                <Plus size={13} />
              </button>
            </div>
            {dayPlan[meal]?.length ? (
              <ul className="space-y-1">
                {dayPlan[meal].map((f) => (
                  <li key={f.name} className={`flex items-center justify-between gap-1 rounded-md px-1.5 py-1 text-[10.5px] ${
                    f.tone === 'warn'  ? 'bg-ss-orange/10 text-ss-orange' :
                    f.tone === 'limit' ? 'bg-ss-amber/10 text-ss-amber'   :
                                          'bg-ss-green/10 text-ss-green'
                  }`}>
                    <span className="line-clamp-1 font-semibold">
                      {f.tone === 'good'  ? '✅ ' : f.tone === 'limit' ? '⚠ ' : '⛔ '}
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(meal, f.name)}
                      className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ss-muted hover:text-ss-red"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X size={9} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-[10px] italic text-ss-muted">Empty</div>
            )}
          </div>
        ))}
      </div>
      {(macros.carbs > 0 || macros.protein > 0 || macros.fat > 0) && (
        <div className="grid grid-cols-3 border-t border-ss-border-warm/50 bg-white text-[9px]">
          <div className="border-r border-ss-border-warm/40 py-1 text-center">
            <div className="font-extrabold text-ss-teal">~{macros.carbs}</div>
            <div className="text-ss-muted">C</div>
          </div>
          <div className="border-r border-ss-border-warm/40 py-1 text-center">
            <div className="font-extrabold text-emerald-700">~{macros.protein}</div>
            <div className="text-ss-muted">P</div>
          </div>
          <div className="py-1 text-center">
            <div className="font-extrabold text-amber-700">~{macros.fat}</div>
            <div className="text-ss-muted">F</div>
          </div>
        </div>
      )}
    </div>
  )
}
