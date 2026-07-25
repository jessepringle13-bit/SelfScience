'use client'

// /app/components/community/CommunityOptInBanner.jsx
// Dashboard-embedded banner promoting the anonymous community.
// Renders only when shouldShowOptInPrompt() returns true — which enforces
// the First-Insight + 3 findings + 2+ sessions rule.

import { useEffect, useState } from 'react'
import { Users, ArrowRight, X } from 'lucide-react'
import {
  shouldShowOptInPrompt, dismissPrompt, CHANGE_EVENT,
  bumpSessionCounterOnce,
} from '@/lib/community'
import CommunityOptInModal from './CommunityOptInModal'

export default function CommunityOptInBanner() {
  const [show, setShow] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    bumpSessionCounterOnce()
    const recompute = () => setShow(shouldShowOptInPrompt())
    recompute()
    window.addEventListener(CHANGE_EVENT, recompute)
    window.addEventListener('storage', recompute)
    return () => {
      window.removeEventListener(CHANGE_EVENT, recompute)
      window.removeEventListener('storage', recompute)
    }
  }, [])

  if (!show) return null

  return (
    <>
      <div
        className="mt-6 flex items-start gap-3 rounded-2xl border border-ss-teal/40 bg-ss-teal/[0.06] p-4 md:p-5"
        style={{ borderLeft: '3px solid #1B474D' }}
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ss-teal/15 text-ss-teal">
          <Users size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold text-ss-teal">You are not alone in your findings.</div>
          <p className="mt-1 text-sm text-ss-muted">
            Join the anonymous SelfScience community to see how your genome compares to others, share what you have learned, and connect with people exploring similar health areas.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ss-green px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Join anonymously <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => { dismissPrompt(); setShow(false) }}
              className="font-mono text-[11px] font-semibold text-ss-muted hover:text-ss-text"
              style={{ letterSpacing: '0.02em' }}
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => { dismissPrompt(); setShow(false) }}
          className="flex-shrink-0 rounded-full p-1 text-ss-muted hover:bg-white hover:text-ss-teal"
        >
          <X size={14} />
        </button>
      </div>
      {modalOpen && <CommunityOptInModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
