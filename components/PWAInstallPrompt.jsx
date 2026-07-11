'use client'
// /app/components/PWAInstallPrompt.jsx
// Shows a subtle install banner on the user's second visit. iOS gets manual
// instructions (Safari does not support beforeinstallprompt). Respects user
// dismissal via localStorage.

import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa_dismissed') === 'true') return

    const visits = parseInt(localStorage.getItem('visit_count') || '0', 10) + 1
    localStorage.setItem('visit_count', String(visits))

    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iosDevice)

    if (visits < 2) return

    if (iosDevice) {
      const t = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(t)
    }
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowPrompt(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowPrompt(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div
      role="dialog"
      aria-label="Install SelfScience"
      className="fixed left-1/2 z-[9999] flex w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 items-start gap-3 rounded-xl bg-ss-teal px-5 py-4 text-ss-bg shadow-2xl"
      style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
    >
      <img src="/icons/icon-192.png" alt="SelfScience" className="h-11 w-11 shrink-0 rounded-lg" />
      <div className="flex-1">
        <p className="text-sm font-semibold">Add SelfScience to your home screen</p>
        <p className="mt-1 text-xs leading-relaxed text-ss-bg/80">
          {isIOS ? 'Tap the Share button below, then "Add to Home Screen"' : 'Install for quick access anytime, even offline'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2">
        {!isIOS && (
          <button onClick={handleInstall} className="whitespace-nowrap rounded-md bg-ss-amber px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110">
            Install
          </button>
        )}
        <button onClick={handleDismiss} className="text-center text-[11px] text-ss-bg/70 transition hover:text-ss-bg">
          Not now
        </button>
      </div>
    </div>
  )
}
