'use client'

// /app/app/pro/deep-research/page.js
// Pro placeholder — Deep Research Reports.

import Link from 'next/link'
import { FileSearch, Sparkles, ArrowLeft, BookOpen } from 'lucide-react'
import SiteNav from '@/components/site-nav'

const SAMPLE_REPORTS = [
  { pillar: 'Longevity',       size: '18 pages', body: 'Telomere biology + NAD+ pathways + your carrier status.' },
  { pillar: 'Nutrition',       size: '22 pages', body: 'Macronutrient response, folate cycle, caffeine, alcohol.' },
  { pillar: 'Sports Performance', size: '16 pages', body: 'ACTN3, ACE, injury risk, recovery kinetics.' },
  { pillar: 'Mental Health',   size: '20 pages', body: 'COMT, MAO-A, BDNF and daily coping strategies.' },
]

export default function DeepResearchPage() {
  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container max-w-2xl pt-24 pb-16">
        <Link href="/pro" className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ss-muted hover:text-ss-text">
          <ArrowLeft size={11} /> SelfScience Pro
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
            <FileSearch size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-ss-text md:text-3xl">Deep Research Reports</h1>
              <span className="inline-flex items-center rounded-full bg-ss-orange px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-widest text-white">Pro</span>
            </div>
            <p className="text-[13.5px] text-ss-muted">Long-form, pillar-level dossiers built around your variants.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">
            <Sparkles size={11} className="mr-1 inline" /> Coming soon
          </div>
          <h2 className="mt-2 text-[17px] font-extrabold text-ss-text">Peer-reviewed depth, personally scoped.</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ss-text">
            Each report walks you through methodology, effect sizes, protocols, and the papers behind them — for the exact variants you carry. Save them as PDF for your practitioner or your future self.
          </p>

          <div className="mt-5 space-y-2">
            {SAMPLE_REPORTS.map((r) => (
              <div key={r.pillar} className="flex items-start gap-3 rounded-xl border border-ss-border-warm/60 bg-ss-canvas/40 p-3">
                <BookOpen size={15} className="mt-1 shrink-0 text-ss-orange" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="text-[13.5px] font-bold text-ss-text">{r.pillar} — Deep Report</div>
                    <div className="font-mono text-[10px] text-ss-muted">{r.size}</div>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-ss-muted">{r.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
