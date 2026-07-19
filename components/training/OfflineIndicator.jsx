'use client'

// /app/components/training/OfflineIndicator.jsx
// "Available offline" pill for the Today/Workouts tab. Shows one of three
// states based on the browser's service-worker + navigator.onLine:
//   • Green "Available offline" — SW is installed & controlling the page
//   • Amber "Offline mode"      — user is currently offline
//   • Grey  "Online only"        — SW not yet registered (first visit, etc.)
//
// The Serwist SW registers on production builds — dev builds intentionally
// don't ship a SW, so we degrade gracefully with the "Online only" state.

import { useEffect, useState } from 'react'
import { WifiOff, CloudDownload, Wifi } from 'lucide-react'

export default function OfflineIndicator({ className = '' }) {
  const [swReady, setSwReady] = useState(false)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setOnline(navigator.onLine !== false)
    setSwReady(!!navigator.serviceWorker?.controller)

    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)
    const onCtrl    = () => setSwReady(!!navigator.serviceWorker?.controller)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', onCtrl)
    }
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('controllerchange', onCtrl)
      }
    }
  }, [])

  let Icon = Wifi
  let label = 'Online only'
  let cls = 'bg-slate-100 text-slate-500 border-slate-200'
  if (!online) {
    Icon = WifiOff
    label = 'Offline mode · using cached data'
    cls = 'bg-amber-50 text-amber-800 border-amber-200'
  } else if (swReady) {
    Icon = CloudDownload
    label = 'Available offline'
    cls = 'bg-ss-green/10 text-ss-green border-ss-green/30'
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls} ${className}`}
      aria-live="polite"
    >
      <Icon size={12} />
      <span>{label}</span>
    </div>
  )
}
