'use client'

// /app/components/StartHereBanner.jsx
// Homepage banner for first-time visitors. Sits above the hero and disappears
// after the visitor dismisses it ("I know my way around ×") — tracked in
// localStorage so returning visitors don't see it again. It also self-hides
// if the user has already interacted with core features (uploaded a genome,
// performed a search, etc.), which is the actual signal that they've onboarded.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, ArrowRight, Microscope, Dna, Apple } from 'lucide-react'
import { trackEvent, EVENTS } from '@/lib/analytics'

const DISMISS_KEY = 'selfscience_welcomed'

export default function StartHereBanner() {
  // `null` while we haven't checked storage yet — avoids SSR/CSR flicker.
  const [visible, setVisible] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const dismissed = window.localStorage.getItem(DISMISS_KEY) === 'true'
      setVisible(!dismissed)
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, 'true') } catch { /* ignore */ }
    trackEvent(EVENTS.SUPPORT_CLICKED, { source: 'start_here_dismiss' })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ss-teal to-[#163a3e] text-white">
      {/* Subtle DNA-helix pattern via SVG background — non-interactive */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'><path d='M0 30 Q30 0 60 30 T120 30' stroke='white' stroke-width='1' fill='none' opacity='0.5'/><path d='M0 30 Q30 60 60 30 T120 30' stroke='white' stroke-width='1' fill='none' opacity='0.5'/></svg>\")",
          backgroundSize: '120px 60px',
        }}
      />

      <div className="container relative py-10 md:py-12">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85 hover:bg-white/20 hover:text-white md:right-6 md:top-6"
        >
          I know my way around <X size={12} />
        </button>

        <span className="inline-block rounded bg-ss-orange px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
          Start Here
        </span>

        <h2 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight md:text-3xl lg:text-[32px]">
          Not sure where to begin? That's exactly where everyone starts.
        </h2>

        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/85 md:text-base">
          SelfScience can feel like a lot at first. We built a short guided journey that walks you through everything — from your first search to understanding what your genome actually tells you. Five minutes, and you'll know exactly what to do next.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/start"
            onClick={() => trackEvent(EVENTS.SUPPORT_CLICKED, { source: 'start_here_banner_cta' })}
            className="inline-flex items-center gap-2 rounded-lg bg-ss-orange px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
          >
            Take me through it <ArrowRight size={14} />
          </Link>
          <span className="text-xs text-white/75">No account needed. Start in seconds.</span>
        </div>

        <div className="mt-8 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-3">
          {[
            { Icon: Microscope, text: 'Find peer-reviewed research on any health topic' },
            { Icon: Dna,        text: 'Upload your genome and get personalized insights' },
            { Icon: Apple,      text: 'Scan any food and see how it fits your biology' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <Icon size={18} className="mt-0.5 shrink-0 text-white/85" />
              <span className="text-[13.5px] leading-snug text-white/85">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
