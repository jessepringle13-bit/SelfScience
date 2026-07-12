'use client'

// /app/components/PWAUpdater.jsx
// Handles two things installed-PWA users can't handle themselves:
//
//   1. When a new service worker takes control (after a deploy), we reload
//      the tab automatically so the user sees the latest HTML/JS/CSS. Without
//      this, even with `skipWaiting` + `clientsClaim` the visible page stays
//      on the previously-rendered old bundle until the user manually refreshes
//      — which many installed-PWA users never do.
//
//   2. If a new SW has been downloaded and is `waiting`, we show a small
//      corner toast with a "Reload" button so the user can pull the update
//      immediately without waiting for the auto-controllerchange path.
//
// This component renders nothing in dev because the SW is disabled there
// (see next.config.js → `disable: NODE_ENV === 'development'`).

import { useEffect, useState } from 'react'

export default function PWAUpdater() {
  const [updateReady, setUpdateReady] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    let reloadArmed = false

    // Auto-reload when a *new* SW takes control of this tab. This fires on
    // the *first* transition — we only reload once so we don't loop.
    const onControllerChange = () => {
      if (reloadArmed) return
      reloadArmed = true
      // Small delay so any in-flight assets finish; still feels instant.
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    // When a registration reports a waiting worker (i.e. update downloaded
    // but not yet active), surface the toast so the user can act on it.
    const attachWaiting = (reg) => {
      if (!reg) return
      const setFromReg = () => {
        if (reg.waiting) {
          setWaitingWorker(reg.waiting)
          setUpdateReady(true)
        }
      }
      setFromReg()
      // Fires when the "installing" SW transitions to "installed" while
      // another SW is already controlling the page.
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(installing)
            setUpdateReady(true)
          }
        })
      })
    }

    navigator.serviceWorker.getRegistration().then(attachWaiting).catch(() => {})
    navigator.serviceWorker.ready.then(attachWaiting).catch(() => {})

    // Poll every 30 minutes for updates. Cheap on the browser but ensures
    // users who leave the PWA open for long stretches get updates promptly.
    const pollId = setInterval(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) reg.update().catch(() => {})
      } catch { /* offline etc. */ }
    }, 30 * 60 * 1000)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      clearInterval(pollId)
    }
  }, [])

  const reloadNow = () => {
    if (waitingWorker) {
      // Tell the new SW to activate. Our sw.js already has skipWaiting: true,
      // but this postMessage covers the rare case where a waiting SW slipped
      // through without it.
      try { waitingWorker.postMessage({ type: 'SKIP_WAITING' }) } catch { /* ignore */ }
    }
    window.location.reload()
  }

  if (!updateReady) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed inset-x-4 bottom-20 z-[60] mx-auto max-w-md rounded-xl border border-ss-border-warm bg-ss-teal p-3 text-white shadow-2xl sm:bottom-6"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg">✨</span>
        <div className="flex-1 text-sm leading-snug">
          <div className="font-bold">A new version of SelfScience is ready</div>
          <div className="text-white/80">Reload to see the latest updates.</div>
        </div>
        <button
          type="button"
          onClick={reloadNow}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ss-teal transition hover:brightness-95"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => setUpdateReady(false)}
          aria-label="Dismiss"
          className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
