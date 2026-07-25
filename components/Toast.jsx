'use client'

// /app/components/Toast.jsx
// Global toast host. Mounted once in root layout; any component fires
// window.dispatchEvent(new CustomEvent('selfscience:toast', { detail: { message, tone, ttl } }))
// and this component renders + auto-dismisses.

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

export default function Toast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let timer
    const onToast = (e) => {
      const msg = e?.detail?.message
      if (!msg) return
      setToast({
        message: msg,
        tone: e.detail.tone || 'success',
        ttl:  e.detail.ttl  || 3000,
      })
      clearTimeout(timer)
      timer = setTimeout(() => setToast(null), e.detail.ttl || 3000)
    }
    window.addEventListener('selfscience:toast', onToast)
    return () => {
      window.removeEventListener('selfscience:toast', onToast)
      clearTimeout(timer)
    }
  }, [])

  if (!toast) return null
  const isSuccess = toast.tone === 'success'
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 z-[80] flex justify-center px-4 md:px-0`}
      style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
          isSuccess ? 'bg-ss-green text-white' : 'bg-ss-teal text-white'
        }`}
      >
        <Check size={14} strokeWidth={3} aria-hidden="true" />
        <span>{toast.message}</span>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => setToast(null)}
          className="ml-2 -mr-1 rounded-full p-1 text-white/80 hover:bg-white/15 hover:text-white"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
