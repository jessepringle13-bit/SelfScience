'use client'

// /app/components/LockedToolPage.jsx
// Reusable dark-themed gate shown for Tier 1 users hitting a Tier 2
// tool. Not a hard error — just a friendly “complete your findings
// first” state.

import Link from 'next/link'
import { Lock, ArrowRight } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { useTierState } from '@/lib/tierState'

export default function LockedToolPage({ toolName = 'this tool' }) {
  const state = useTierState()
  const total = state.findingsTotal || 0
  const read  = state.findingsRead?.length || 0

  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <div className="container flex min-h-[calc(100vh-80px)] max-w-lg items-center justify-center pt-24">
        <div className="w-full rounded-2xl border border-ss-border-warm/50 bg-ss-surface p-8 text-center shadow-lg md:p-10">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ss-orange/15 ring-1 ring-ss-orange/40">
            <Lock size={20} className="text-ss-orange" />
          </div>
          <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-ss-label">Tier 1 · Understanding</div>
          <h1 className="mt-2 text-2xl font-extrabold text-ss-text md:text-3xl">This unlocks soon.</h1>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-ss-muted">
            Finish reading your {total || 'key'} findings to access <span className="font-semibold text-ss-text">{toolName}</span>.
            {total > 0 && <> You’ve read <span className="font-semibold text-ss-text">{read}</span> so far.</>}
          </p>
          <Link
            href="/genome/overview"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ss-orange px-6 text-sm font-bold text-white shadow-sm transition hover:bg-ss-orange-dark"
          >
            Continue reading my findings <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
