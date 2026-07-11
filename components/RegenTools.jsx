'use client'

// /app/components/RegenTools.jsx
// Small "Refresh analysis" pill that appears on the tool pages
// (Biomarkers / Training / Drug Check / Population Compare / Ancestry).
//
// Clicking it re-runs /api/interpret-genome on the currently-cached raw
// variants and writes the fresh report back to sessionStorage. All tool
// pages listen to the `selfscience:genome-changed` event so they refresh
// automatically after this fires.
//
// Rate-limited client-side to one regen per 60 seconds — matches the same
// throttle we already apply on the Genome page.

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { getGenomeResults, saveGenomeResults, notifyGenomeResultsChanged } from '@/lib/genomeSession'

const COOLDOWN_MS = 60_000
const KEY = 'selfscience_regen_locked_until'

export default function RegenTools({ compact = false }) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [tick, setTick] = useState(0)

  // Hydrate the cooldown timer from sessionStorage so navigating between
  // tool pages doesn't reset the throttle window.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem(KEY)
    const v = raw ? Number(raw) : 0
    if (Number.isFinite(v) && v > Date.now()) setLockedUntil(v)
  }, [])

  // Once-a-second ticker while the cooldown is active so the button
  // countdown updates visually.
  useEffect(() => {
    if (lockedUntil <= Date.now()) return
    const iv = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(iv)
  }, [lockedUntil])

  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
  const disabled = running || secondsLeft > 0

  const handleClick = async () => {
    setError(null)
    const report = getGenomeResults()
    const variants = report?._variants
    if (!report || !variants || Object.keys(variants).length === 0) {
      setError('No genome loaded to refresh.')
      return
    }
    setRunning(true)
    try {
      const res = await fetch('/api/interpret-genome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants }),
      })
      if (!res.ok) throw new Error(`Refresh failed (${res.status})`)
      const json = await res.json()
      // Preserve the raw variants map on the new report so the tools can
      // continue reading it. Without this the next refresh would have no
      // input to work with.
      const finalReport = { ...json, _variants: variants }
      saveGenomeResults(finalReport)
      notifyGenomeResultsChanged()

      const until = Date.now() + COOLDOWN_MS
      setLockedUntil(until)
      if (typeof window !== 'undefined') {
        try { sessionStorage.setItem(KEY, String(until)) } catch { /* noop */ }
      }
    } catch (err) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRunning(false)
    }
  }

  const label = running
    ? 'Refreshing…'
    : secondsLeft > 0
      ? `Refresh in ${secondsLeft}s`
      : 'Refresh analysis'

  const Btn = (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-xs font-semibold text-ss-teal shadow-sm transition hover:bg-ss-teal hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? 'py-1 text-[11px]' : ''
      }`}
      aria-label="Refresh analysis"
      title="Re-run the analysis on your currently-loaded variants."
    >
      {running ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      {label}
    </button>
  )

  if (compact) return Btn

  return (
    <div className="flex flex-col items-end gap-1">
      {Btn}
      {error && <span className="text-[11px] text-ss-orange">{error}</span>}
    </div>
  )
}
