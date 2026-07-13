'use client'
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { Loader2 } from 'lucide-react'

export default function ProductList({ category }) {
  const [state, setState] = useState({ loading: false, error: null, results: [], query: null })

  useEffect(() => {
    if (!category?.dsldQuery) return
    let cancelled = false
    const q = category.dsldQuery
    setState({ loading: true, error: null, results: [], query: q })

    fetch(`/api/supplements/dsld/search?q=${encodeURIComponent(q)}&size=12&onMarket=1`)
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

  if (!category) return null

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-[#1B474D]">
          {category.label}
          {state.results?.length ? <span className="ml-2 text-sm font-normal text-slate-500">{state.results.length} products</span> : null}
        </h3>
        <span className="text-xs text-slate-500">Query: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{category.dsldQuery}</code></span>
      </div>

      {state.loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" /> Searching NIH DSLD label database…
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

      {state.results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
