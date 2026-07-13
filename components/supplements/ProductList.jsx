'use client'
import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import GroupedProductCard from './GroupedProductCard'
import ViewToggle from './ViewToggle'
import { groupProducts, buildWhyThisFits } from '@/lib/supplements/grouping'
import { Loader2, Sparkles } from 'lucide-react'

const VIEW_STORAGE_KEY = 'selfscience_supplements_view_v1'

export default function ProductList({ category }) {
  const [state, setState] = useState({ loading: false, error: null, results: [], query: null })
  const [view, setView] = useState('curated')

  // Persist view choice across category changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)
      if (saved === 'curated' || saved === 'all') setView(saved)
    } catch { /* ignore */ }
  }, [])
  const changeView = (v) => {
    setView(v)
    try { window.localStorage.setItem(VIEW_STORAGE_KEY, v) } catch {}
  }

  useEffect(() => {
    if (!category?.dsldQuery) return
    let cancelled = false
    const q = category.dsldQuery
    setState({ loading: true, error: null, results: [], query: q })

    // Fetch 40 to give the group-and-diversify algorithm real material.
    fetch(`/api/supplements/dsld/search?q=${encodeURIComponent(q)}&size=40&onMarket=1`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Search failed (${r.status})`)
        return r.json()
      })
      .then((d) => {
        if (cancelled) return
        setState({ loading: false, error: null, results: d.results || [], query: q, total: d.total })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ loading: false, error: err.message || 'Search failed', results: [], query: q })
      })

    return () => { cancelled = true }
  }, [category?.id])

  const groups = useMemo(() => groupProducts(state.results), [state.results])

  if (!category) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#1B474D]">
            {category.label}
            {view === 'curated'
              ? (groups.length > 0 && <span className="ml-2 text-sm font-normal text-slate-500">{groups.length} trusted brands</span>)
              : (state.results?.length > 0 && <span className="ml-2 text-sm font-normal text-slate-500">{state.results.length} products</span>)
            }
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span>Query: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{category.dsldQuery}</code></span>
          </div>
        </div>
        <ViewToggle
          value={view}
          onChange={changeView}
          curatedCount={groups.length}
          totalCount={state.results.length}
        />
      </div>

      {state.loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" /> Searching NIH DSLD label database&hellip;
        </div>
      )}

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {!state.loading && !state.error && state.results.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No on-market products matched that ingredient query.
        </div>
      )}

      {/* Curated view */}
      {view === 'curated' && groups.length > 0 && (
        <>
          <div className="flex items-start gap-2 rounded-lg border border-[#1B474D]/15 bg-[#F8FBFB] px-3 py-2 text-xs text-slate-600">
            <Sparkles className="h-4 w-4 text-[#1B474D] mt-0.5 shrink-0" />
            <span>
              <strong className="text-[#1B474D]">Trusted brands to consider.</strong> Sorted by ingredient-form quality and brand diversity. Multiple dose or count options from the same brand are grouped into a single card &mdash; use the version chips to switch inside a brand.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((g) => (
              <GroupedProductCard
                key={`${g.brand}-${g.family}`}
                group={g}
                whyThisFits={buildWhyThisFits({ category, group: g })}
              />
            ))}
          </div>
        </>
      )}

      {/* Flat view (all products) */}
      {view === 'all' && state.results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
