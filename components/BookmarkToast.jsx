'use client'

// /app/components/BookmarkToast.jsx
// Global reading-list bookmark confirmation toast. Listens for the
// `selfscience:bookmark-toast` event that ResultCard (and any other
// bookmark-capable card, e.g. Discover) dispatches on save/remove.
//
// Behavior per Message 580 \u00a74:
//   * Shows "Saved to Reading List" or "Removed from Reading List"
//     depending on the payload.
//   * Auto-dismisses after 3 seconds.
//   * Offers an "Undo" action when the paper was just saved (undo
//     removes it) or just removed (undo re-saves it). Undo calls
//     toggleSaveStudy() on the original item payload and dispatches
//     a second, silent toast to update the copy.
//   * Positioned bottom-center on mobile, bottom-right on desktop so it
//     doesn't collide with the mobile bottom tab bar.

import { useEffect, useState, useRef, useCallback } from 'react'
import { Check, Bookmark, X } from 'lucide-react'
import { toggleSaveStudy } from '@/lib/savedStudies'

export default function BookmarkToast() {
  const [toast, setToast] = useState(null) // { message, saved, item, ts }
  const timerRef = useRef(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const scheduleDismiss = useCallback(() => {
    clearTimer()
    timerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    const onEvent = (e) => {
      const d = e?.detail
      if (!d?.message) return
      setToast({ message: d.message, saved: !!d.saved, item: d.item, ts: Date.now() })
    }
    window.addEventListener('selfscience:bookmark-toast', onEvent)
    return () => window.removeEventListener('selfscience:bookmark-toast', onEvent)
  }, [])

  // (Re-)start the auto-dismiss timer any time a new toast arrives.
  useEffect(() => {
    if (!toast) return
    scheduleDismiss()
    return () => clearTimer()
  }, [toast, scheduleDismiss])

  if (!toast) return null

  const handleUndo = () => {
    if (!toast.item) return
    // toggleSaveStudy flips the save state, which is exactly what "undo"
    // should do here \u2014 saved becomes removed, removed becomes saved.
    const nowSaved = toggleSaveStudy(toast.item)
    setToast({
      message: nowSaved ? 'Saved to Reading List' : 'Removed from Reading List',
      saved: nowSaved,
      item: toast.item,
      ts: Date.now(),
    })
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-3 md:bottom-6 md:right-6 md:left-auto md:inset-x-auto md:justify-end"
    >
      <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full bg-ss-teal px-4 py-2.5 text-sm font-semibold text-white shadow-2xl ring-1 ring-black/10">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
          {toast.saved ? <Check size={14} /> : <Bookmark size={14} />}
        </span>
        <span className="min-w-0 truncate">{toast.message}</span>
        {toast.item && (
          <button
            type="button"
            onClick={handleUndo}
            className="ml-1 shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-white/25"
          >
            Undo
          </button>
        )}
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Dismiss"
          className="ml-0.5 shrink-0 rounded-full p-1 text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
