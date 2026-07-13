// /app/components/editorial-picks.jsx
// "Editorial Picks" section rendered above external search results.
// Fetches from /api/editorial/search in parallel with the main search;
// hides itself entirely on empty result / failure.

'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { EditorialCard } from './editorial-card'

export function EditorialPicks({ query = '', pillar = '' }) {
  const [articles, setArticles] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const q = (query || '').trim()
    const p = (pillar || '').trim()
    if (!q && !p) {
      setArticles([])
      setLoaded(true)
      return
    }

    setLoaded(false)
    const usp = new URLSearchParams()
    if (q) usp.set('q', q)
    if (p) usp.set('pillar', p)
    usp.set('limit', '8')

    fetch(`/api/editorial/search?${usp.toString()}&_=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((j) => {
        if (cancelled) return
        setArticles(Array.isArray(j?.results) ? j.results : [])
        setLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setArticles([])
        setLoaded(true)
      })

    return () => { cancelled = true }
  }, [query, pillar])

  if (!loaded || articles.length === 0) return null

  return (
    <section className="mb-8 rounded-3xl bg-gradient-to-br from-ss-teal/[0.06] to-transparent p-5 ring-1 ring-ss-teal/15 md:p-7">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ss-teal">
            <Sparkles size={12} /> SelfScience Editorial
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-ss-teal md:text-2xl">
            Editorial Picks
          </h2>
          <p className="mt-0.5 text-xs text-ss-muted md:text-sm">
            Curated by our editors with a plain-language summary and evidence rating.
          </p>
        </div>
        <span className="whitespace-nowrap text-xs text-ss-muted">
          {articles.length} match{articles.length === 1 ? '' : 'es'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <EditorialCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  )
}

export default EditorialPicks
