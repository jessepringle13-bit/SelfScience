'use client'

// /app/components/LockedProPage.jsx
// Full-screen splash shown when a non-Tier-3 user hits a Pro-gated
// tool. Consistent with LockedToolPage but branded "SelfScience Pro".

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import SiteNav from '@/components/site-nav'

export default function LockedProPage({ toolName = 'this tool' }) {
  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <div className="container flex min-h-[calc(100vh-80px)] max-w-lg items-center justify-center pt-24">
        <div className="w-full rounded-2xl border border-ss-border-warm/50 bg-ss-surface p-8 text-center shadow-lg md:p-10">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ss-orange/15 ring-1 ring-ss-orange/40">
            <Sparkles size={20} className="text-ss-orange" />
          </div>
          <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-ss-orange">SelfScience Pro</div>
          <h1 className="mt-2 text-2xl font-extrabold text-ss-text md:text-3xl">Unlock {toolName}.</h1>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-ss-muted">
            {toolName} is part of SelfScience Pro — deeper interpretation, family comparison, and long-form research reports tailored to your genome.
          </p>
          <Link
            href="/pro"
            className="ss-glow-orange-btn mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ss-orange px-6 text-sm font-bold text-white transition hover:bg-ss-orange-dark"
          >
            Explore SelfScience Pro <ArrowRight size={14} />
          </Link>
          <div className="mt-4 text-[11.5px] text-ss-muted">No payment required to preview — it&rsquo;s an early access invite.</div>
        </div>
      </div>
    </div>
  )
}
