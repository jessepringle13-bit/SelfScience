// /app/app/admin/login/page.jsx
// Password login for the SelfScience editorial admin.

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // If already authenticated, skip login.
  useEffect(() => {
    fetch('/api/admin/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (j?.authenticated) router.replace('/admin/articles') })
      .catch(() => {})
  }, [router])

  async function onSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j?.error || 'Login failed')
      } else {
        router.replace('/admin/articles')
      }
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-2xl ring-1 ring-slate-800">
        <div className="mb-6 flex items-center gap-2 text-slate-400">
          <Lock size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">SelfScience Editorial Admin</span>
        </div>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Enter the admin password to continue.</p>

        <label className="mt-6 block text-xs font-semibold text-slate-300">Password</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />

        {error && (
          <div className="mt-4 rounded-md bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/40">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:opacity-50"
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
