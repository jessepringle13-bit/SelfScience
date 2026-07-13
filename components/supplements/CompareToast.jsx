'use client'
// Global toast for the compare-mode family-mismatch event. Listens on the
// window custom event dispatched by CompareContext.add().
import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function CompareToast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onEvent = (e) => {
      const d = e.detail || {}
      setToast({
        newFamily: d.newFamily,
        prevFamily: d.prevFamily,
        ts: Date.now(),
      })
    }
    window.addEventListener('selfscience:compare-family-conflict', onEvent)
    return () => window.removeEventListener('selfscience:compare-family-conflict', onEvent)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5500)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90vw]">
      <div className="rounded-xl border border-amber-300 bg-amber-50 shadow-2xl px-3 py-2.5 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
        <div className="flex-1 text-xs text-amber-900 leading-snug">
          <div className="font-semibold">Compare list reset</div>
          <div className="mt-0.5">
            You added a <strong>{toast.newFamily}</strong> product, but the previous compare list was on <strong>{toast.prevFamily}</strong>. To keep comparisons apples-to-apples, we cleared the old list.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="rounded-full p-1 text-amber-700 hover:bg-amber-100"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
