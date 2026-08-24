'use client'

// /app/components/WelcomeBackStrip.jsx
// Inline "welcome back" strip that renders on the homepage BETWEEN the
// hero and the first-time-visitor step explainer. New visitors never
// see it \u2014 they get the current onboarding path (FirstTimeWelcome +
// hero CTA). Returning visitors see a compact row of quick-jump tabs
// so they can bypass the landing-page framing and go straight to a
// tool, quiz, tour, or their saved journey.
//
// Detection of "returning":
//   \u2022 ss_onboarded === '1' (canonical first-visit flag)   OR
//   \u2022 hasGenomeResults() is true (mid-flow session)         OR
//   \u2022 ss_mode is set (they picked guided/explorer)          OR
//   \u2022 ss_tier_state key exists (they progressed through tiers)
//
// Dismiss = sessionStorage-scoped so it doesn't nag within the tab,
// but re-appears next visit. No new features \u2014 all links go to
// existing routes.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ClipboardList,
  Wrench,
  Sparkles,
  Route,
  X as XIcon,
} from 'lucide-react'
import { hasGenomeResults } from '@/lib/genomeSession'

const SESSION_DISMISS_KEY = 'ss_welcome_back_dismissed'

function isReturningUser() {
  if (typeof window === 'undefined') return false
  try {
    if (window.localStorage.getItem('ss_onboarded') === '1') return true
    if (window.localStorage.getItem('ss_mode')) return true
    if (window.localStorage.getItem('ss_tier_state')) return true
    if (hasGenomeResults()) return true
  } catch {}
  return false
}

export default function WelcomeBackStrip() {
  // Start closed so we don't SSR-flash the strip for brand-new users.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let dismissed = false
    try {
      dismissed = window.sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'
    } catch {}
    if (!dismissed && isReturningUser()) setVisible(true)
  }, [])

  // Whether the user has ANY saved journey signal (used to relabel the
  // primary tab from "Take the quiz" to "Continue my journey" when
  // appropriate). Recomputed on every render — cheap, LS reads only.
  const hasJourney = useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      if (window.localStorage.getItem('ss_tier_state')) return true
      if (window.localStorage.getItem('ss_mode')) return true
    } catch {}
    return false
  }, [visible])

  if (!visible) return null

  const dismiss = () => {
    try { window.sessionStorage.setItem(SESSION_DISMISS_KEY, '1') } catch {}
    setVisible(false)
  }

  return (
    <section
      aria-label="Welcome back — quick shortcuts"
      className="relative border-y border-white/10 bg-ss-canvas/70 backdrop-blur"
    >
      <div className="container relative py-8 md:py-10">
        {/* Dismiss button — top-right, low-emphasis. */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide welcome-back shortcuts for this session"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <XIcon size={16} />
        </button>

        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ss-orange/40 bg-ss-orange/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">
            <Sparkles size={11} /> Welcome back
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-white md:text-3xl">
            Jump straight in.
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Skip the intro &mdash; pick up where you left off, or explore something new.
          </p>
        </div>

        {/* 4-tab grid. Primary tab (orange) adapts to whether the user
            has a saved journey (guided/tier state) or not. */}
        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {hasJourney ? (
            <QuickTab
              href="/my-path"
              Icon={Route}
              label="Continue my journey"
              copy="Pick up your guided path."
              emphasize
            />
          ) : (
            <QuickTab
              href="/onboarding/quiz"
              Icon={ClipboardList}
              label="Take the quiz"
              copy="2 minutes to a personal path."
              emphasize
            />
          )}

          {hasJourney && (
            <QuickTab
              href="/onboarding/quiz"
              Icon={ClipboardList}
              label="Retake the quiz"
              copy="Reset your reading path."
            />
          )}

          <QuickTab
            href="/tools"
            Icon={Wrench}
            label="Explore tools"
            copy="Genome, labs, nutrition, more."
          />

          <QuickTab
            href="/how-it-works"
            Icon={Sparkles}
            label="Learn the tools"
            copy="A 2-minute plain-English tour."
          />

          {!hasJourney && (
            <QuickTab
              href="/search"
              Icon={ArrowRight}
              label="Read articles"
              copy="Search the research directly."
            />
          )}
        </div>
      </div>
    </section>
  )
}

function QuickTab({ href, Icon, label, copy, emphasize }) {
  const base =
    'group flex h-full flex-col items-start justify-between gap-2 rounded-2xl p-4 text-left transition hover:-translate-y-0.5'
  const scheme = emphasize
    ? 'bg-ss-orange text-white shadow-lg hover:bg-ss-orange-dark'
    : 'bg-white/5 text-white ring-1 ring-white/15 hover:bg-white/10'
  const iconWrap = emphasize
    ? 'bg-white/20 text-white'
    : 'bg-white/10 text-white/90 group-hover:bg-white/20'
  return (
    <Link href={href} className={`${base} ${scheme}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconWrap}`}>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="w-full">
        <div className="flex items-center justify-between gap-2">
          <div className={`text-sm font-extrabold ${emphasize ? 'text-white' : 'text-white'}`}>
            {label}
          </div>
          <ArrowRight
            size={14}
            className={`transition group-hover:translate-x-0.5 ${emphasize ? 'text-white' : 'text-white/70'}`}
          />
        </div>
        <div className={`mt-0.5 text-xs ${emphasize ? 'text-white/85' : 'text-white/60'}`}>
          {copy}
        </div>
      </div>
    </Link>
  )
}
