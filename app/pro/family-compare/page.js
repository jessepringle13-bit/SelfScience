'use client'

// /app/app/pro/family-compare/page.js
// Pro placeholder — Family Comparison.

import Link from 'next/link'
import { Users, Sparkles, ArrowLeft, Upload } from 'lucide-react'
import SiteNav from '@/components/site-nav'

export default function FamilyComparePage() {
  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container max-w-2xl pt-24 pb-16">
        <Link href="/pro" className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ss-muted hover:text-ss-text">
          <ArrowLeft size={11} /> SelfScience Pro
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
            <Users size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-ss-text md:text-3xl">Family Comparison</h1>
              <span className="inline-flex items-center rounded-full bg-ss-orange px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-widest text-white">Pro</span>
            </div>
            <p className="text-[13.5px] text-ss-muted">Side-by-side variant maps for two genomes.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">
            <Sparkles size={11} className="mr-1 inline" /> Coming soon
          </div>
          <h2 className="mt-2 text-[17px] font-extrabold text-ss-text">See which traits run in the family.</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ss-text">
            Upload a second genome (a parent, sibling, or child’s file) and get a side-by-side comparison across every SelfScience pillar. Understand shared variants, inherited risk, and what’s uniquely yours.
          </p>

          <div className="mt-5 rounded-xl border border-dashed border-ss-border-warm/60 bg-ss-canvas/40 p-6 text-center">
            <Upload size={22} className="mx-auto text-ss-muted" />
            <div className="mt-2 text-[13px] font-bold text-ss-text">Second-genome upload</div>
            <div className="mt-1 text-[12px] text-ss-muted">Available when Family Comparison ships.</div>
          </div>
        </div>
      </main>
    </div>
  )
}
