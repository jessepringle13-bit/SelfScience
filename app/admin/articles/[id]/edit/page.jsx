// /app/app/admin/articles/[id]/edit/page.jsx
// Edit article — fetches by id, then renders ArticleForm.

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import AdminGate from '@/components/admin/AdminGate'
import ArticleForm from '@/components/admin/ArticleForm'

export default function EditArticlePage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, article: null, error: null })

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/articles/${id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.error) setState({ loading: false, article: null, error: j.error })
        else setState({ loading: false, article: j?.article || null, error: null })
      })
      .catch((e) => setState({ loading: false, article: null, error: e?.message || 'load failed' }))
  }, [id])

  return (
    <AdminGate title="Edit Article" backHref="/admin/articles">
      {state.loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}
      {state.error && (
        <div className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/40">{state.error}</div>
      )}
      {state.article && <ArticleForm mode="edit" initial={state.article} />}
    </AdminGate>
  )
}
