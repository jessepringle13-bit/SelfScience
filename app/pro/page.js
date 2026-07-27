'use client'

// /app/app/pro/page.js
// SelfScience Pro upgrade landing (architecture placeholder).
// - Marketing hero + feature list
// - Non-functional "Unlock Pro" button that flips ss_tier_state.tier = 3
//   in localStorage so the rest of the app can be demoed end-to-end.
// - Dev-only tier switcher so QA / the user can flip between tiers
//   without wiping progress.

import Link from 'next/link'
import { Sparkles, ArrowRight, CheckCircle2, Bot, Users, FileSearch, Lock } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { useTierState, unlockTier3, downgradeToTier } from '@/lib/tierState'

const FEATURES = [
  {
    key: 'aiCoach',
    Icon: Bot,
    title: 'AI Coach',
    body: 'Ask questions about your specific variants in plain English. The Coach cites the same peer-reviewed sources SelfScience already trusts.',
  },
  {
    key: 'familyComparison',
    Icon: Users,
    title: 'Family Comparison',
    body: 'Upload a second genome and see a side-by-side variant map. Understand which traits run in the family and which are yours alone.',
  },
  {
    key: 'deepResearch',
    Icon: FileSearch,
    title: 'Deep Research Reports',
    body: 'Long-form generated reports per pillar — with methodology, effect sizes, and next-step protocols — tailored to the variants you actually carry.',
  },
]

const ALWAYS_INCLUDED = [
  'Everything in Explorer (full findings, Focus Mode, protocol)',
  'PDF export of anything you can see',
  'Priority editorial reviews on new research',
  'Early-access to new pillars & tools',
]

export default function ProPage() {
  const state = useTierState()
  const isPro = state.tier >= 3

  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container max-w-3xl pt-24 pb-20">
        {/* HERO */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ss-orange/40 bg-ss-orange/[0.08] px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-ss-orange">
            <Sparkles size={11} /> Early Access
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-ss-text md:text-5xl">
            SelfScience <span className="text-ss-orange">Pro</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-ss-muted">
            Deeper interpretation, family comparison, and long-form research reports — all built on the same open, on-device architecture you already trust.
          </p>

          {!isPro && (
            <button
              type="button"
              onClick={() => unlockTier3()}
              className="ss-glow-orange-btn mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ss-orange px-8 text-sm font-bold text-white transition hover:bg-ss-orange-dark"
            >
              Unlock Pro (Preview) <ArrowRight size={14} />
            </button>
          )}
          {isPro && (
            <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-ss-green/40 bg-ss-green/[0.08] px-4 py-2 text-[13px] font-bold text-ss-green">
              <CheckCircle2 size={14} /> Pro is unlocked on this device
            </div>
          )}
          <div className="mt-3 text-[11.5px] text-ss-muted">Preview only — no payment integration yet. Payment coming soon.</div>
        </section>

        {/* PRO FEATURES */}
        <section className="mt-14">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">What Pro Unlocks</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ key, Icon, title, body }) => (
              <div
                key={key}
                className="rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
                  <Icon size={18} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <h3 className="text-[15px] font-extrabold text-ss-text">{title}</h3>
                  <span className="inline-flex items-center rounded-full bg-ss-orange px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-widest text-white">Pro</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ss-muted">{body}</p>
                {isPro && (
                  <Link
                    href={`/pro/${key === 'aiCoach' ? 'ai-coach' : key === 'familyComparison' ? 'family-compare' : 'deep-research'}`}
                    className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-ss-orange hover:text-ss-orange-dark"
                  >
                    Open {title} <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ALWAYS INCLUDED */}
        <section className="mt-10 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-6">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">Always Included</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ALWAYS_INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-2 text-[13.5px] text-ss-text">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ss-green" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* PROMISE */}
        <section className="mt-10 rounded-2xl border border-ss-teal/30 bg-ss-surface p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">Our Promise</div>
          <p className="mt-2 text-[14px] leading-relaxed text-ss-text">
            Even with Pro, your data stays <span className="font-bold">on your device</span>. Nothing about your genome, uploads, or history is shared with SelfScience or third parties without your explicit action. Pro features generate insights locally or via requests you initiate yourself.
          </p>
        </section>

        {/* DEV TIER SWITCHER */}
        <section className="mt-10 rounded-2xl border border-dashed border-ss-border-warm/70 bg-ss-canvas/30 p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
            <Lock size={11} /> Dev tier switcher <span className="font-normal">· preview only</span>
          </div>
          <p className="mt-1 text-[12px] text-ss-muted">
            Flip between tiers to preview locked/unlocked states without wiping your progress.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3].map((n) => {
              const active = state.tier === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => downgradeToTier(n)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
                    active
                      ? 'bg-ss-orange text-white'
                      : 'border border-ss-border-warm/60 bg-ss-surface text-ss-text hover:border-ss-orange/60'
                  }`}
                >
                  Tier {n}{n === 3 ? ' · Pro' : n === 2 ? ' · Explorer' : ' · Understanding'}
                </button>
              )
            })}
          </div>
          <div className="mt-3 text-[11px] text-ss-muted">Current: <span className="font-mono font-bold text-ss-text">tier={state.tier}</span></div>
        </section>
      </main>
    </div>
  )
}
