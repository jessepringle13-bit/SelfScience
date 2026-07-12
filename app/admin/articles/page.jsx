// /app/app/admin/articles/page.jsx
// Admin table view of all editorial articles (published + drafts).
// - Inline toggles for is_published and is_featured (PATCH on click)
// - Delete with confirmation
// - New Article + Import CSV entry points

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Upload, Loader2, ExternalLink, Trash2, Pencil, Sparkles, Search,
} from 'lucide-react'
import AdminGate from '@/components/admin/AdminGate'

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return String(d) }
}

export default function AdminArticlesPage() {
  return (
    <AdminGate title="Articles">
      <ArticlesTable />
    </AdminGate>
  )
}

function ArticlesTable() {
  const router = useRouter()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [busyId, setBusyId] = useState(null) // id of row being toggled/deleted

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/articles', { cache: 'no-store' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed to load')
      setArticles(j.articles || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return articles
    return articles.filter((a) => {
      return (
        (a.title || '').toLowerCase().includes(q) ||
        (a.slug || '').toLowerCase().includes(q) ||
        (a.authors || '').toLowerCase().includes(q) ||
        (a.pillars || []).join(' ').toLowerCase().includes(q)
      )
    })
  }, [articles, filter])

  const toggleField = async (article, field) => {
    setBusyId(article.id + ':' + field)
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !article[field] }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Update failed')
      setArticles((prev) => prev.map((a) => (a.id === article.id ? j.article : a)))
    } catch (e) {
      alert(`Toggle failed: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  const removeArticle = async (article) => {
    if (!confirm(`Delete “${article.title}”? This cannot be undone.`)) return
    setBusyId(article.id + ':delete')
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Delete failed')
      setArticles((prev) => prev.filter((a) => a.id !== article.id))
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Editorial Articles</h1>
          <p className="text-sm text-slate-400">{articles.length} total · {articles.filter((a) => a.is_published).length} published</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/articles/import"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            <Upload size={14} /> Import CSV
          </Link>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-500 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-400"
          >
            <Plus size={14} /> New Article
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
        <Search size={14} className="text-slate-500" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by title, slug, author, pillar…"
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Loading articles…
        </div>
      )}

      {error && (
        <div className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/40">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
          {articles.length === 0
            ? 'No articles yet. Click “New Article” or “Import CSV” to add some.'
            : 'No matches for that filter.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900">
              <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">Cover</th>
                <th className="px-3 py-2">Title / Slug</th>
                <th className="px-3 py-2">Pillars</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Evidence</th>
                <th className="px-3 py-2 text-center">Published</th>
                <th className="px-3 py-2 text-center">Featured</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950 text-sm">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-900/50">
                  <td className="px-3 py-2">
                    {a.cover_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={a.cover_image_url} alt="" className="h-10 w-14 rounded object-cover ring-1 ring-slate-800" />
                    ) : (
                      <div className="flex h-10 w-14 items-center justify-center rounded bg-slate-800/60 text-slate-600">
                        <Sparkles size={12} />
                      </div>
                    )}
                  </td>
                  <td className="max-w-md px-3 py-2">
                    <div className="font-semibold text-white line-clamp-1">{a.title}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <code className="rounded bg-slate-800/70 px-1.5 py-0.5">{a.slug}</code>
                      {a.is_published && (
                        <a
                          href={`/articles/${a.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-teal-400 hover:underline"
                          title="Open public page"
                        >
                          view <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(a.pillars || []).map((p) => (
                        <span key={p} className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-300">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {typeof a.ai_reliability_score === 'number' ? `${a.ai_reliability_score}/100` : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{a.evidence_quality || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <Toggle busy={busyId === a.id + ':is_published'} on={a.is_published} onClick={() => toggleField(a, 'is_published')} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Toggle busy={busyId === a.id + ':is_featured'} on={a.is_featured} onClick={() => toggleField(a, 'is_featured')} />
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{formatDate(a.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/admin/articles/${a.id}/edit`)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        disabled={busyId === a.id + ':delete'}
                        onClick={() => removeArticle(a)}
                        className="rounded p-1.5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-40"
                        title="Delete"
                      >
                        {busyId === a.id + ':delete'
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Toggle({ on, onClick, busy }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex h-5 w-9 items-center rounded-full transition ${
        on ? 'bg-teal-500' : 'bg-slate-700'
      } disabled:opacity-50`}
      aria-pressed={on}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
