'use client'

// /app/components/ContinueJourneyPill.jsx
// Persistent affordance shown to Explorer-mode users who already have
// a saved My Path. Two variants:
//   - <ContinueJourneyPill variant="nav"    /> \u2192 header chip
//   - <ContinueJourneyPill variant="banner" /> \u2192 wide dashboard card
// Clicking either flips ss_mode back to 'guided' and routes to
// /my-path. Renders null when the user is already guided or has never
// completed the intent quiz (no saved path to continue).

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Route, ArrowRight, Sparkles } from 'lucide-react'
import { useMode, setMode, usePath } from '@/lib/userPath'

export default function ContinueJourneyPill({ variant = 'nav' }) {
  const router = useRouter()
  const mode = useMode()
  const path = usePath()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Only show for explorer users who have a saved path to return to.
  if (!mounted) return null
  if (mode !== 'explorer') return null
  if (!path?.primary) return null

  const resume = () => {
    setMode('guided')
    router.push('/my-path')
  }

  if (variant === 'banner') {
    return (
      <div className="ss-glow-orange rounded-2xl border-2 border-ss-orange bg-ss-orange/[0.06] p-5 md:p-6">
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
            <Route size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">Your Journey</div>
            <h3 className="mt-1 text-[16.5px] font-extrabold text-ss-text">You have a Path waiting.</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ss-muted">
              Pick up where your guided curriculum left off \u2014 one focused step at a time.
            </p>
          </div>
          <button
            type="button"
            onClick={resume}
            className="ss-glow-orange-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ss-orange px-5 text-[13.5px] font-bold text-white transition hover:bg-ss-orange-dark"
          >
            Continue My Journey <ArrowRight size={13} />
          </button>
        </div>
      </div>
    )
  }

  // Compact nav pill.
  return (
    <button
      type="button"
      onClick={resume}
      title="Continue your guided path"
      className="ss-glow-orange-btn hidden items-center gap-1.5 rounded-full bg-ss-orange px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-ss-orange-dark md:inline-flex"
    >
      <Sparkles size={11} /> Continue My Journey
    </button>
  )
}
