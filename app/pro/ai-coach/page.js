'use client'

// /app/app/pro/ai-coach/page.js
// Pro placeholder — the actual AI Coach chat surface will replace this
// once we wire an LLM key. Non-Pro users see the LockedProPage overlay
// via TierRouteGate; Pro users see this teaser.

import Link from 'next/link'
import { Bot, Sparkles, MessageSquareText, ArrowLeft } from 'lucide-react'
import SiteNav from '@/components/site-nav'

export default function AICoachPage() {
  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container max-w-2xl pt-24 pb-16">
        <Link href="/pro" className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ss-muted hover:text-ss-text">
          <ArrowLeft size={11} /> SelfScience Pro
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
            <Bot size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-ss-text md:text-3xl">AI Coach</h1>
              <span className="inline-flex items-center rounded-full bg-ss-orange px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-widest text-white">Pro</span>
            </div>
            <p className="text-[13.5px] text-ss-muted">Ask questions about your specific variants — in plain English.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">
            <Sparkles size={11} className="mr-1 inline" /> Coming soon
          </div>
          <h2 className="mt-2 text-[17px] font-extrabold text-ss-text">Your on-device research assistant.</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ss-text">
            AI Coach will let you ask about your variants and always cite the same peer-reviewed sources SelfScience trusts. Under the hood, the assistant reads your local genome results and searches only the papers you’ve unlocked.
          </p>

          <div className="mt-5 rounded-xl border border-ss-border-warm/60 bg-ss-canvas/40 p-4">
            <div className="flex items-center gap-2 text-[12.5px] font-bold text-ss-text">
              <MessageSquareText size={13} className="text-ss-orange" /> Example questions
            </div>
            <ul className="mt-2 space-y-1.5 text-[13px] text-ss-muted">
              <li>“Do any of my variants affect how I metabolize caffeine?”</li>
              <li>“What does my MTHFR result mean for folate?”</li>
              <li>“Summarize my sleep-related genes and cite the strongest studies.”</li>
            </ul>
          </div>

          <p className="mt-5 text-[12px] text-ss-muted">
            We’ll open a beta invite when the assistant is ready. Nothing about your genome leaves your device without your explicit action.
          </p>
        </div>
      </main>
    </div>
  )
}
