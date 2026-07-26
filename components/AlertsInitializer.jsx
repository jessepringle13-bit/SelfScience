'use client'

// /app/components/AlertsInitializer.jsx
// Fires the alert-check pipeline once per page load. Non-blocking:
// runs inside requestIdleCallback / setTimeout so it never delays
// first paint. Also re-runs when the tab regains focus (bounded by
// the CHECK_INTERVAL_MS debounce inside lib/alerts).

import { useEffect } from 'react'
import { runAlertChecks } from '@/lib/alerts'

export default function AlertsInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    runAlertChecks()
    const onFocus = () => runAlertChecks()
    window.addEventListener('focus', onFocus)
    // Also re-run when genome changes (new upload might unlock alerts).
    const onGenome = () => runAlertChecks({ force: true })
    window.addEventListener('selfscience:genome-changed', onGenome)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('selfscience:genome-changed', onGenome)
    }
  }, [])
  return null
}
