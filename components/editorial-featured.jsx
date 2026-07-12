// /app/components/editorial-featured.jsx
// Fetches featured, published articles from Supabase and renders them
// in the homepage "Featured Research" section BEFORE the hardcoded
// featured items. Silently renders nothing if Supabase has no featured
// articles or the query fails.

'use client'

import { useEffect, useState } from 'react'
import { EditorialCard } from './editorial-card'

export function EditorialFeatured({ limit = 6 }) {
  const [articles, setArticles] = useState([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/editorial/featured?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((j) => {
        if (cancelled) return
        setArticles(Array.isArray(j?.results) ? j.results : [])
      })
      .catch(() => {
        if (cancelled) return
        setArticles([])
      })
    return () => { cancelled = true }
  }, [limit])

  if (articles.length === 0) return null

  return (
    <div className="no-scrollbar mb-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
      {articles.map((a) => (
        <div key={a.id} className="snap-start">
          <EditorialCard article={a} variant="carousel" />
        </div>
      ))}
    </div>
  )
}

export default EditorialFeatured
