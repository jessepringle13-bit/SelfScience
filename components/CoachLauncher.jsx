'use client'

// /app/components/CoachLauncher.jsx
// Persistent floating chat launcher for the AI Coach.
// - Bottom-right FAB visible on every page except /coach, /onboarding,
//   the FirstLook Tier 1 flow, and admin routes.
// - Small "New" pulse when the user hasn't opened the Coach yet in this
//   session (encourages first click).
// - Respects a per-session "hide launcher" toggle so users can dismiss it.

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, X } from 'lucide-react'
import { useTierState } from '@/lib/tierState'

const HIDDEN_KEY   = 'ss_coach_launcher_hidden'
const OPENED_KEY   = 'ss_coach_launcher_opened'

// Routes where the launcher should NOT appear \u2014 either it's redundant
// (the Coach page itself) or the user is mid-onboarding / mid-Tier-1
// and we don't want to distract them.
const HIDE_PATHS = [
  '/coach',
  '/onboarding',
  '/admin',
  '/get-started',
]

function shouldHideOnPath(pathname) {
  if (!pathname) return false
  return HIDE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default function CoachLauncher() {
  const pathname = usePathname() || ''
  const router = useRouter()
  const tier = useTierState()
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      setDismissed(!!window.sessionStorage.getItem(HIDDEN_KEY))
      setOpened(!!window.localStorage.getItem(OPENED_KEY))
    } catch {}
  }, [])

  // Hide during SSR / hydration and on excluded paths.
  if (!mounted) return null
  if (shouldHideOnPath(pathname)) return null
  // Hide during Tier 1 First Look flow \u2014 those users are still in
  // guided onboarding; a persistent floating chat would compete for
  // attention.
  if (tier?.tier === 1 && !tier?.findingsCompleted) return null

  const openCoach = () => {
    try { window.localStorage.setItem(OPENED_KEY, '1') } catch {}
    router.push('/coach')
  }

  const dismiss = (e) => {
    e.stopPropagation()
    try { window.sessionStorage.setItem(HIDDEN_KEY, '1') } catch {}
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9990] print:hidden">
      <button
        type="button"
        onClick={openCoach}
        aria-label="Ask the AI Coach"
        title="Ask the AI Coach"
        className={`group relative flex h-12 items-center gap-2 rounded-full px-4 pl-3.5 pr-4 text-[13px] font-bold text-white shadow-lg transition hover:scale-[1.03] hover:shadow-xl ${
          !opened ? 'ss-glow-orange-btn bg-ss-orange' : 'bg-ss-orange'
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <Bot size={16} />
        </span>
        <span className="hidden sm:inline">Ask Coach</span>
        {!opened && (
          <span
            className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ss-teal text-[9px] font-bold text-white ring-2 ring-ss-canvas"
            aria-hidden="true"
            title="New"
          >
            !
          </span>
        )}
        {/* Dismiss X \u2014 becomes visible on hover for desktop. */}
        <span
          onClick={dismiss}
          className="absolute -top-2 -left-2 hidden h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-ss-surface text-ss-muted opacity-0 ring-1 ring-ss-border-warm/60 transition group-hover:opacity-100 md:flex hover:text-ss-text"
          role="button"
          aria-label="Hide the Coach launcher for this session"
          title="Hide for this session"
        >
          <X size={10} />
        </span>
      </button>
    </div>
  )
}
