// /app/components/admin/AdminGate.jsx
// Client component that calls /api/admin/me on mount and redirects to
// /admin/login when unauthenticated. Renders children only after the
// auth check passes. Also renders the shared admin top bar with logout.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Loader2, ArrowLeft } from 'lucide-react'

export default function AdminGate({ children, title, backHref }) {
  const router = useRouter()
  const [state, setState] = useState('checking') // checking | ok | denied

  useEffect(() => {
    fetch('/api/admin/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.authenticated) setState('ok')
        else { setState('denied'); router.replace('/admin/login') }
      })
      .catch(() => { setState('denied'); router.replace('/admin/login') })
  }, [router])

  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } finally {
      router.replace('/admin/login')
    }
  }

  if (state !== 'ok') {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {backHref && (
              <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                <ArrowLeft size={12} /> Back
              </Link>
            )}
            <div className="text-sm font-semibold text-slate-200">
              SelfScience Admin · <span className="text-slate-400">{title || 'Articles'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
          >
            <LogOut size={12} /> Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
