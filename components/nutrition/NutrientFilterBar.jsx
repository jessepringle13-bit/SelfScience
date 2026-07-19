'use client'

// /app/components/nutrition/NutrientFilterBar.jsx
// Search bar + variant-relevant nutrient chip filter for the Foods tab.
// Chip list is derived at render time from the user's activeRules —
// only nutrients they actually benefit from show up.

import { useMemo, useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'

// Collect unique nutrient tags from the prioritize_foods of every
// active rule. Sorted alphabetically for stable UI.
export function collectVariantNutrients(activeRules) {
  const s = new Set()
  for (const rule of activeRules || []) {
    for (const f of rule.prioritize_foods || []) {
      for (const n of f.nutrients || []) s.add(n)
    }
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b))
}

// Given a food (with .nutrients[]) and a set of selected nutrient tags,
// return true if the food matches. Empty selection matches everything.
export function foodMatchesNutrients(food, selectedSet) {
  if (!selectedSet || selectedSet.size === 0) return true
  const set = new Set((food.nutrients || []).map((n) => n.toLowerCase()))
  for (const s of selectedSet) if (set.has(s.toLowerCase())) return true
  return false
}

// Given a food + a query string, return true if the food name/reason
// contain the query. Empty query matches everything.
export function foodMatchesQuery(food, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return (
    (food.food || '').toLowerCase().includes(q) ||
    (food.reason || '').toLowerCase().includes(q) ||
    (food.notes || '').toLowerCase().includes(q) ||
    (food.nutrients || []).some((n) => n.toLowerCase().includes(q))
  )
}

const QUERY_KEY  = 'ss_nutr_food_query'
const CHIPS_KEY  = 'ss_nutr_food_chips'

export default function NutrientFilterBar({ activeRules, onFilterChange }) {
  const nutrients = useMemo(() => collectVariantNutrients(activeRules), [activeRules])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [mounted, setMounted] = useState(false)

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setMounted(true)
    try {
      const q = localStorage.getItem(QUERY_KEY)
      if (q) setQuery(q)
      const chips = localStorage.getItem(CHIPS_KEY)
      if (chips) setSelected(new Set(JSON.parse(chips)))
    } catch { /* noop */ }
  }, [])

  // Persist + notify parent whenever state changes.
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(QUERY_KEY, query)
      localStorage.setItem(CHIPS_KEY, JSON.stringify(Array.from(selected)))
    } catch { /* noop */ }
    onFilterChange?.({ query, selected })
  }, [query, selected, mounted, onFilterChange])

  const toggle = (n) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  if (nutrients.length === 0 && !query) return null

  return (
    <div className="rounded-2xl border border-ss-border-warm/60 bg-white p-3 shadow-sm">
      <div className="relative">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ss-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods, nutrients, notes…"
          className="h-11 w-full rounded-full border border-ss-border-warm bg-white pl-8 pr-8 text-sm outline-none focus:border-ss-teal"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {nutrients.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">
            <Filter size={10} /> Nutrients your variants prefer
          </span>
          {nutrients.map((n) => {
            const active = selected.has(n)
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggle(n)}
                className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  active
                    ? 'bg-ss-teal text-white border-ss-teal shadow-sm'
                    : 'bg-white text-ss-text border-ss-border-warm/70 hover:border-ss-teal hover:text-ss-teal'
                }`}
              >
                {n}
              </button>
            )
          })}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ss-muted hover:text-ss-red"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
