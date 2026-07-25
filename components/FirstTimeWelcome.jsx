'use client'

// /app/components/FirstTimeWelcome.jsx
// Phase A · Part 2 — full-screen welcome modal shown once on first visit.
// Not a popup — it's a welcome screen. Collects 0-N interest checkboxes,
// sets ss_interests + ss_onboarded, then dispatches
// 'selfscience:interests-changed' so downstream widgets (dashboard pillar
// chip bar) can re-order themselves.

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { INTERESTS, needsOnboarding, setInterests, LS_ONBOARDED } from '@/lib/interests'
import { openHealthStoryQuiz, markQuizSkipped } from '@/lib/userProfile'

export default function FirstTimeWelcome() {
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState(() => new Set())

  useEffect(() => {
    // Only run in the browser after mount to avoid SSR flashes.
    if (needsOnboarding()) setOpen(true)
    if (typeof window !== 'undefined') {
      // Full "Clear & Reset" fires 'selfscience:interests-changed' after
      // wiping ss_onboarded — re-check so we re-open immediately without
      // waiting for a full page reload.
      const onChange = () => { if (needsOnboarding()) setOpen(true) }
      window.addEventListener('selfscience:interests-changed', onChange)
      return () => window.removeEventListener('selfscience:interests-changed', onChange)
    }
  }, [])

  if (!open) return null

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (key === 'everything') {
        // Selecting "everything" clears others and stands alone.
        return next.has('everything') ? new Set() : new Set(['everything'])
      }
      // Selecting a specific interest removes 'everything' if set.
      next.delete('everything')
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const finish = (persistSelection) => {
    // If they clicked "Let's get started" without picking anything, default
    // to 'everything' so the safe-default pathway kicks in.
    if (persistSelection) {
      const keys = selected.size ? Array.from(selected) : ['everything']
      setInterests(keys)
    } else {
      // Skip → mark onboarded but empty selection.
      try { window.localStorage.setItem(LS_ONBOARDED, '1') } catch {}
      // Skipping the welcome also skips the quiz per product spec.
      markQuizSkipped(true)
      window.dispatchEvent(new Event('selfscience:interests-changed'))
    }
    setOpen(false)
    // After the welcome modal closes with "Let's get started", chain
    // into the Health Story quiz (Phase K). Delay one animation frame
    // so the welcome modal's exit doesn't paint over the quiz.
    if (persistSelection) {
      setTimeout(() => openHealthStoryQuiz(), 100)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ss-welcome-heading"
      className="fixed inset-0 z-[70] flex items-stretch justify-center overflow-y-auto bg-ss-teal/95 backdrop-blur-sm"
    >
      {/* Close (X) — always available */}
      <button
        type="button"
        aria-label="Close welcome"
        onClick={() => finish(false)}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} />
      </button>

      <div className="relative m-auto w-full max-w-2xl px-5 py-10 text-white md:px-8 md:py-14">
        {/* Brand mark */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-ss-orange" aria-hidden="true" />
          <span className="text-lg font-extrabold tracking-tight">SelfScience</span>
        </div>

        <h2 id="ss-welcome-heading" className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
          Welcome to SelfScience
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-white/85">
          Most people who get a DNA test never find out what their results actually
          mean for their daily life. SelfScience changes that.
        </p>

        <div className="mt-10">
          <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            What would you like to learn about?
          </div>
          <div className="mt-1 text-center text-[11px] text-white/50">(Select all that apply)</div>

          <ul className="mx-auto mt-6 grid max-w-lg grid-cols-1 gap-2">
            {INTERESTS.map((i) => {
              const active = selected.has(i.key)
              return (
                <li key={i.key}>
                  <button
                    type="button"
                    onClick={() => toggle(i.key)}
                    aria-pressed={active}
                    className={`flex w-full min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'border-ss-orange bg-ss-orange text-white'
                        : 'border-white/25 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                        active ? 'border-white bg-white text-ss-orange' : 'border-white/50 bg-transparent'
                      }`}
                    >
                      {active && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">{i.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => finish(true)}
            className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-ss-orange px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark md:w-auto"
          >
            Let&apos;s get started →
          </button>
          <button
            type="button"
            onClick={() => finish(false)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
