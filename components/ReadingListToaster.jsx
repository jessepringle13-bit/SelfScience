'use client'

// /app/components/ReadingListToaster.jsx
// Micro-toast overlay listening for TOAST_EVENT from lib/readingList.
// Mounted once in layout.js — no per-page wiring required.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TOAST_EVENT } from '@/lib/readingList'

export default function ReadingListToaster() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const onToast = (e) => {
      const t = e?.detail
      if (!t) return
      setToast(t)
      const dur = t.tone === 'warning' ? 4000 : t.tone === 'muted' ? 2000 : 2200
      const id = setTimeout(() => setToast(null), dur)
      return () => clearTimeout(id)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => window.removeEventListener(TOAST_EVENT, onToast)
  }, [])

  if (!toast) return null

  const tone = {
    success: 'bg-ss-green text-white',
    muted:   'bg-ss-text text-white',
    warning: 'bg-ss-amber text-white',
  }[toast.tone] || 'bg-ss-green text-white'

  return (
    <div
      role="status"
      className={`pointer-events-auto fixed bottom-16 left-1/2 z-[95] -translate-x-1/2 rounded-full px-4 py-2 font-mono text-[11px] font-semibold shadow-lg ${tone}`}
    >
      <span>{toast.message}</span>
      {toast.href && (
        <Link href={toast.href} className="ml-3 underline underline-offset-2 hover:opacity-90">
          View Reading List →
        </Link>
      )}
    </div>
  )
}
