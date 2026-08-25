'use client'

// /app/components/HomePillarGrid.jsx
//
// Phase 4 UX (Issue #3) \u2014 pillar-first navigation entry point on
// the homepage. Promotes the 10 canonical pillars from the nav
// dropdown to a persistent, always-visible top-level card set so
// visitors can pick a lens BEFORE they think about data.
//
// Purely descriptive: every link points at an existing route. No new
// features.
//
// Follow-ups added on top of the base grid:
//
//   1. CTA tracking \u2014 each tile click POSTs to /api/cta-track so
//      admins can see which pillars visitors actually pick first.
//      Uses location='homepage-pillar-grid', cta=<pillar.key>.
//   2. Personalised ordering \u2014 when a genome is loaded, the tiles
//      re-sort so the pillars with the most recognised variants
//      lead. Ordering falls back to the canonical PILLARS order
//      whenever no genome is present.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { PILLARS } from '@/components/site-nav'
import { hasGenomeResults, getGenomeResults } from '@/lib/genomeSession'
import { normalizePillarName } from '@/lib/pillars'

// Small helper \u2014 fires cta-track without ever blocking navigation.
// Uses keepalive so the request survives the page transition when
// the user follows the tile\u2019s href in the same click.
function trackPillarClick(pillarKey) {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/cta-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'homepage-pillar-grid',
        cta: String(pillarKey || 'unknown').slice(0, 60),
        variant: 'a',
        kind: 'click',
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

// Walk the current genome session and count how many recognised
// variants map into each pillar. Mirrors the exact accumulator used
// by site-nav.jsx (Section 5) so numbers agree between the nav
// dropdown chip counts and the homepage ordering.
function computePillarCounts() {
  if (typeof window === 'undefined') return {}
  try {
    const g = getGenomeResults()
    if (!g) return {}
    const counts = {}
    const bump = (name) => {
      const normal = normalizePillarName(name)
      if (!normal) return
      counts[normal] = (counts[normal] || 0) + 1
    }
    for (const v of g.variants_recognized || []) {
      const pillars = Array.isArray(v?.pillar) ? v.pillar : v?.pillar ? [v.pillar] : []
      for (const p of pillars) bump(p)
    }
    for (const grp of g.fullReport || []) {
      for (const v of grp.variants || []) {
        const pillars = Array.isArray(v?.pillar) ? v.pillar : v?.pillar ? [v.pillar] : []
        for (const p of pillars) bump(p)
      }
    }
    return counts
  } catch { return {} }
}

export default function HomePillarGrid() {
  // Deferred to after mount so SSR delivers the canonical order and
  // hydration reshuffles once the genome session becomes readable.
  const [genomeLoaded, setGenomeLoaded] = useState(false)
  const [counts, setCounts] = useState({})

  useEffect(() => {
    const refresh = () => {
      setGenomeLoaded(hasGenomeResults())
      setCounts(computePillarCounts())
    }
    refresh()
    window.addEventListener('selfscience:genome-changed', refresh)
    return () => window.removeEventListener('selfscience:genome-changed', refresh)
  }, [])

  // Personalised ordering: when a genome is loaded, sort by variant
  // count descending; ties fall back to the canonical PILLARS order
  // so behaviour is deterministic. When no genome is loaded, order
  // is exactly the canonical PILLARS array.
  const orderedPillars = useMemo(() => {
    if (!genomeLoaded) return PILLARS
    const withIdx = PILLARS.map((p, i) => ({ p, i, n: counts[p.name] || 0 }))
    withIdx.sort((a, b) => (b.n - a.n) || (a.i - b.i))
    return withIdx.map((x) => x.p)
  }, [genomeLoaded, counts])

  return (
    <section
      aria-label="What do you want to explore?"
      className="border-b border-white/10 bg-ss-canvas/60 backdrop-blur"
    >
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ss-orange/40 bg-ss-orange/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">
            <Compass size={11} /> {genomeLoaded ? 'Sorted by your variants' : 'Start with a topic'}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">
            What do you want to explore?
          </h2>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            {genomeLoaded
              ? 'The pillars with the most recognised variants in your genome are shown first \u2014 but you can pick any of them.'
              : 'Pick a pillar and dive into the research. Uploading a DNA file is optional and only personalises what you see inside \u2014 it doesn\u2019t gate anything.'}
          </p>
        </div>

        {/* 10 pillar cards. 2 cols mobile, 3 tablet, 5 desktop \u2014
            keeps every pillar visible without scrolling on desktop. */}
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {orderedPillars.map((p) => (
            <PillarTile
              key={p.key}
              pillar={p}
              count={genomeLoaded ? counts[p.name] || 0 : 0}
            />
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

function PillarTile({ pillar, count }) {
  const Icon = pillar.Icon
  // Prefer the pillar's dedicated landing route if one exists;
  // otherwise fan out into pre-filtered Search results for that
  // pillar. Every route below is verified to exist.
  const href = pillar.route || `/search?pillar=${encodeURIComponent(pillar.name)}`
  return (
    <Link
      href={href}
      onClick={() => trackPillarClick(pillar.key)}
      className="group flex flex-col items-start gap-2 rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-ss-orange/40"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition group-hover:bg-ss-orange/20 group-hover:text-ss-orange">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        {count > 0 && (
          <span
            className="inline-flex items-center rounded-full bg-ss-orange/15 px-2 py-0.5 text-[10px] font-extrabold text-ss-orange"
            title={`${count} recognised variant${count === 1 ? '' : 's'} in your genome`}
          >
            {count}
          </span>
        )}
      </div>
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
