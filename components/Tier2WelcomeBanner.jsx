'use client'

// /app/components/Tier2WelcomeBanner.jsx
// Persistent "you just unlocked Explorer" celebration banner. Renders
// on the Dashboard when:
//   - tier === 2
//   - ss_tier2_just_unlocked_at is set and less than 7 days old
//   - ss_tier2_banner_dismissed is not set
// Explains exactly what changed and points the user at the new tools.
// Also pulses the top-nav "Tools" button once via a sessionStorage flag
// picked up by site-nav.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, X, Search, FileSearch, Bot, Compass, ArrowRight, PartyPopper } from 'lucide-react'
import { useTierState } from '@/lib/tierState'

const UNLOCK_KEY   = 'ss_tier2_just_unlocked_at'
const DISMISS_KEY  = 'ss_tier2_banner_dismissed'
const MAX_AGE_MS   = 7 * 24 * 60 * 60 * 1000  // Show for one week after unlock

const HIGHLIGHTS = [
  { Icon: Compass,    label: 'Full findings',   body: 'Every variant across every pillar in one dashboard.',        href: '/genome' },
  { Icon: Search,     label: 'Search research', body: 'Query PubMed + Semantic Scholar + OpenAlex with reliability scores.', href: '/search' },
  { Icon: Bot,        label: 'AI Coach',        body: 'Ask questions about your variants with citation chips.',     href: '/coach' },
  { Icon: FileSearch, label: 'Deep Research',   body: 'Generate a structured, cited report on any research question.', href: '/research' },
]

export default function Tier2WelcomeBanner() {
  const tier = useTierState()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Only for Tier 2 users.
    if (tier?.tier !== 2) { setVisible(false); return }
    // Respect user-dismiss.
    if (window.localStorage.getItem(DISMISS_KEY)) { setVisible(false); return }

    // Prefer the explicit unlock-timestamp flag, but fall back to
    // ss_tier_state.tier2UnlockedAt so users who unlocked via a code
    // path that didn't set the just-unlocked flag still get the banner.
    let ts = null
    try { ts = window.localStorage.getItem(UNLOCK_KEY) || null } catch {}
    if (!ts && tier?.tier2UnlockedAt) ts = tier.tier2UnlockedAt
    if (!ts) { setVisible(false); return }

    const age = Date.now() - new Date(ts).getTime()
    setVisible(!isNaN(age) && age >= 0 && age < MAX_AGE_MS)
  }, [tier?.tier, tier?.tier2UnlockedAt, dismissed])

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setDismissed(true)
    setVisible(false)
  }

  const pulseTools = () => {
    try { window.sessionStorage.setItem('ss_tier2_tour_pulse', '1') } catch {}
    // Dispatch an event site-nav can listen for to briefly pulse the
    // Tools button. Falls back to a plain link click if nav ignores it.
    try { window.dispatchEvent(new CustomEvent('selfscience:pulse-tools')) } catch {}
  }

  if (!visible) return null

  return (
    <div className="ss-glow-orange relative overflow-hidden rounded-2xl border-2 border-ss-orange bg-gradient-to-br from-ss-orange/[0.08] via-ss-surface to-ss-surface p-5 shadow-lg md:p-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss the Explorer unlock banner"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ss-muted transition hover:bg-ss-canvas/40 hover:text-ss-text"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <span className="ss-glow-orange-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ss-orange text-white">
          <PartyPopper size={22} />
        </span>
        <div className="min-w-0 pr-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">Tier 2 unlocked</div>
          <h2 className="mt-1 text-xl font-extrabold text-ss-text md:text-2xl">Welcome to Explorer Mode.</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ss-muted">
            Your full toolkit just came online. Here&rsquo;s what you can do now that you couldn&rsquo;t before:
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {HIGHLIGHTS.map(({ Icon, label, body, href }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={pulseTools}
              className="flex items-start gap-3 rounded-xl border border-ss-border-warm/60 bg-ss-canvas/30 p-3 transition hover:border-ss-orange/60 hover:bg-ss-orange/[0.06]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[13.5px] font-bold text-ss-text">
                  {label}
                  <ArrowRight size={11} className="text-ss-orange" />
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-ss-muted">{body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ss-border-warm/40 pt-3 text-[11.5px] text-ss-muted">
        <Sparkles size={11} className="text-ss-orange" />
        Open the <button type="button" onClick={pulseTools} className="font-bold text-ss-orange underline decoration-dotted underline-offset-4 hover:text-ss-orange-dark">Tools menu</button> in the top nav to see everything at once.
        <button type="button" onClick={dismiss} className="ml-auto font-semibold text-ss-muted underline decoration-dotted underline-offset-4 hover:text-ss-text">
          Dismiss
        </button>
      </div>
    </div>
  )
}
