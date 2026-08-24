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
import { getUserNickname } from '@/lib/userProfile'
import { PILLARS } from '@/components/site-nav'

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

// Read the journey progress from ss_tier_state and return a fraction
// between 0 and 1. Tier 3 is always fully complete; Tier 2 is at least
// 66 % complete (Tier 1 findings are done); Tier 1 progress is the
// ratio of findings read to total findings capped at 0.66. Returns
// null when no tier state exists so callers can hide the ring.
function readJourneyProgress() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('ss_tier_state')
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return null
    const tier = Number(s.tier) || 1
    const total = Math.max(1, Number(s.findingsTotal) || 0)
    const read = Array.isArray(s.findingsRead) ? s.findingsRead.length : 0
    if (tier >= 3) return 1
    if (tier === 2) {
      // Tier-2 users have finished the Tier-1 gate; extra reading pushes
      // toward 100 %. Scale remaining 34 % across findingsRead beyond
      // the total, capped at 1.
      const extra = Math.min(1, read / total)
      return Math.min(1, 0.66 + extra * 0.34)
    }
    // Tier 1: linear ratio, capped just below the Tier-2 threshold.
    if (s.findingsCompleted) return 0.66
    return Math.min(0.65, (read / total) * 0.66)
  } catch { return null }
}

export default function WelcomeBackStrip() {
  // Start closed so we don't SSR-flash the strip for brand-new users.
  const [visible, setVisible] = useState(false)
  const [nickname, setNickname] = useState('')
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let dismissed = false
    try {
      dismissed = window.sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'
    } catch {}
    if (!dismissed && isReturningUser()) setVisible(true)
    setNickname(getUserNickname())
    setProgress(readJourneyProgress())

    const onNick = () => setNickname(getUserNickname())
    const onTier = () => setProgress(readJourneyProgress())
    window.addEventListener('selfscience:nickname-changed', onNick)
    window.addEventListener('selfscience:tier-changed', onTier)
    window.addEventListener('storage', onTier)
    return () => {
      window.removeEventListener('selfscience:nickname-changed', onNick)
      window.removeEventListener('selfscience:tier-changed', onTier)
      window.removeEventListener('storage', onTier)
    }
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
  }, [visible, progress])

  if (!visible) return null

  const dismiss = () => {
    try { window.sessionStorage.setItem(SESSION_DISMISS_KEY, '1') } catch {}
    setVisible(false)
  }

  // Personalised greeting title. Falls back to generic "Jump straight
  // in." when there's no nickname stored.
  const title = nickname
    ? `Welcome back, ${nickname} \u2014 jump straight in.`
    : 'Jump straight in.'

  // Only draw a progress ring on the "Continue my journey" tile when
  // we actually have journey progress to show.
  const showRing = hasJourney && progress !== null

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
            <Sparkles size={11} /> Welcome back{nickname ? `, ${nickname}` : ''}
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-white md:text-3xl">
            {title}
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
              copy={progressCopy(progress)}
              emphasize
              progress={showRing ? progress : null}
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

        {/* Pillar shortcuts — second row of chips lets returning users
            jump straight into a topic they already care about. Uses
            /search?pillar=X because Search is the one route that
            already fans out with per-pillar filtering. */}
        <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-1.5">
          <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-white/50">
            Or by topic:
          </span>
          {PILLARS.map((p) => (
            <Link
              key={p.key}
              href={`/search?pillar=${encodeURIComponent(p.name)}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/85 transition hover:border-ss-orange/40 hover:bg-ss-orange/10 hover:text-white"
            >
              <p.Icon size={11} strokeWidth={1.75} />
              <span>{p.short || p.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Turns 0..1 progress into a warm one-liner used on the "Continue my
// journey" tile. Progress can be null (no journey started yet, though
// we won't render the ring in that case anyway).
function progressCopy(progress) {
  if (progress === null || progress === undefined) return 'Pick up your guided path.'
  const pct = Math.round(progress * 100)
  if (pct >= 100) return 'You\u2019ve completed the path. Revisit any step.'
  if (pct >= 66) return `${pct}% complete \u2014 Explorer mode.`
  if (pct >= 33) return `${pct}% complete \u2014 keep going.`
  if (pct > 0)  return `${pct}% complete \u2014 nice start.`
  return 'Pick up your guided path.'
}

function QuickTab({ href, Icon, label, copy, emphasize, progress }) {
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
      {progress !== undefined && progress !== null ? (
        <ProgressRing progress={progress} Icon={Icon} />
      ) : (
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconWrap}`}>
          <Icon size={18} strokeWidth={1.75} />
        </span>
      )}
      <div className="w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-extrabold text-white">{label}</div>
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

// Small SVG progress ring that surrounds the tile icon. 36x36 viewbox,
// stroke-width 3, aria label reads the percentage aloud for screen
// readers. The unfilled portion uses a low-contrast white/20 stroke
// so the ring reads on any background tint.
function ProgressRing({ progress, Icon }) {
  const clamped = Math.max(0, Math.min(1, progress))
  const pct = Math.round(clamped * 100)
  const size = 40
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped)
  return (
    <span
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`Journey ${pct}% complete`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Icon size={16} strokeWidth={1.75} className="relative z-10 text-white" />
    </span>
  )
}
