'use client'

// /app/components/HomePillarGrid.jsx
//
// Phase 4 UX (Issue #3) \u2014 pillar-first navigation entry point on
// the homepage. Promotes the 10 canonical pillars from the nav
// dropdown to a persistent, always-visible top-level card set so
// visitors can pick a lens BEFORE they think about data.
//
// Purely descriptive: every link points at an existing route
// (/pillars for the explainer, /search?pillar=X for the pre-filtered
// research feed). No new features.
//
// Uses the canonical PILLARS array from components/site-nav.jsx so
// this stays in sync with the nav, dashboard chips, and Search
// filter without a second source of truth.

import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { PILLARS } from '@/components/site-nav'

export default function HomePillarGrid() {
  return (
    <section
      aria-label="What do you want to explore?"
      className="border-b border-white/10 bg-ss-canvas/60 backdrop-blur"
    >
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ss-orange/40 bg-ss-orange/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">
            <Compass size={11} /> Start with a topic
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">
            What do you want to explore?
          </h2>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            Pick a pillar and dive into the research. Uploading a DNA file is optional and only personalises what you see inside &mdash; it doesn&rsquo;t gate anything.
          </p>
        </div>

        {/* 10 pillar cards. 2 cols mobile, 3 tablet, 5 desktop \u2014
            keeps every pillar visible without scrolling on desktop. */}
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {PILLARS.map((p) => (
            <PillarTile key={p.key} pillar={p} />
          ))}
        </div>

        {/* Footer link \u2014 goes to the /pillars explainer for anyone
            who wants the full descriptions and tool mapping. */}
        <div className="mx-auto mt-6 text-center">
          <Link
            href="/pillars"
            className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-ss-orange/40 hover:bg-white/10"
          >
            Learn what each pillar contains <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function PillarTile({ pillar }) {
  const Icon = pillar.Icon
  // Prefer the pillar's dedicated route if one exists (currently only
  // Developmental & Lifespan has /pillars/youth); otherwise fan out
  // into pre-filtered Search results for that pillar.
  const href = pillar.route || `/search?pillar=${encodeURIComponent(pillar.name)}`
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2 rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-ss-orange/40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition group-hover:bg-ss-orange/20 group-hover:text-ss-orange">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className="w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-extrabold leading-tight text-white">
            {pillar.short || pillar.name}
          </div>
          <ArrowRight
            size={14}
            className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white"
          />
        </div>
        {pillar.name !== (pillar.short || pillar.name) && (
          <div className="mt-0.5 text-[10.5px] text-white/50">{pillar.name}</div>
        )}
      </div>
    </Link>
  )
}
