'use client'

// /app/components/PillarLandingTemplate.jsx
//
// Slim pillar landing template used by /pillars/mental-health,
// /pillars/environment, /pillars/longevity, and /pillars/wellness.
// Mirrors the *layout* of /pillars/youth but keeps the copy short and
// focused: this is a permanent home for each pillar's tool list, not
// a marketing page.
//
// No new features. Every href is an existing route (/nutrition,
// /biomarkers, /drug-check, /journal, /goals, /tracker, /training,
// /reading-list, /genome, /search?pillar=...).

import Link from 'next/link'
import {
  ArrowRight,
  Compass,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'

/**
 * Props:
 *   Icon          lucide-react icon component (usually pillar.Icon)
 *   pillarName    canonical pillar name (matches PILLARS array)
 *   headline      hero headline, second-person
 *   lede          one or two short sentences
 *   whatItCovers  string[] – three or four "this pillar looks at" bullets
 *   tools[]       [{ href, label, blurb, tag? }] – tools/content inside
 *   related[]     [{ href, label }] – siblings/related pillars
 */
export default function PillarLandingTemplate({
  Icon,
  pillarName,
  headline,
  lede,
  whatItCovers = [],
  tools = [],
  related = [],
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24 dark:from-ss-canvas dark:via-ss-bg dark:to-ss-canvas">
      <SiteNav />

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="container pt-24 md:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ss-orange/40 bg-ss-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
            <Compass size={12} /> Pillar &middot; {pillarName}
          </div>
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-ss-teal/10 text-ss-teal">
            <Icon size={30} strokeWidth={1.75} />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ss-teal md:text-5xl dark:text-white">
            {headline}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ss-text/90 md:text-lg">
            {lede}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/search?pillar=${encodeURIComponent(pillarName)}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ss-orange px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-ss-orange-dark"
            >
              Explore the research <ArrowRight size={14} />
            </Link>
            <Link
              href="/pillars"
              className="text-sm font-semibold text-ss-teal underline underline-offset-4 hover:no-underline dark:text-white"
            >
              See all 10 pillars
            </Link>
          </div>
          <p className="mt-4 text-xs text-ss-muted">
            Educational only. Uploading a DNA file or lab is optional and only personalises what you see here.
          </p>
        </div>
      </section>

      {/* ================================================================
          WHAT THIS PILLAR COVERS
          ================================================================ */}
      {whatItCovers.length > 0 && (
        <section className="container mt-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
              What this pillar covers
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-ss-text md:text-base">
              {whatItCovers.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ss-teal" aria-hidden="true" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ================================================================
          TOOLS & CONTENT INSIDE
          ================================================================ */}
      {tools.length > 0 && (
        <section className="container mt-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
              Tools &amp; content inside this pillar
            </h2>
            <h3 className="mx-auto mt-3 max-w-2xl text-center text-2xl font-extrabold text-ss-teal md:text-3xl dark:text-white">
              Everything you need to explore {pillarName.toLowerCase()} on SelfScience.
            </h3>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {tools.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="group flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-base font-extrabold text-ss-teal dark:text-white">{t.label}</div>
                    {t.tag && (
                      <span className="rounded-full bg-ss-orange/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ss-orange">
                        {t.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex-1 text-sm text-ss-text/85">{t.blurb}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ss-orange">
                    Open <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================
          BEFORE YOU EXPLORE
          ================================================================ */}
      <section className="container mt-16">
        <div className="mx-auto max-w-4xl rounded-2xl border-l-4 border-ss-teal/60 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-teal" />
            <div className="text-sm leading-relaxed text-ss-text/90">
              <span className="font-semibold text-ss-teal dark:text-white">Educational, not diagnostic.</span>{' '}
              This pillar summarises research associations. Genetic and lab data are optional and only personalise what you see &mdash; they never gate access.{' '}
              <Link href="/how-it-works" className="font-semibold text-ss-teal underline hover:no-underline dark:text-white">
                See how SelfScience works
              </Link>
              .
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          RELATED PILLARS
          ================================================================ */}
      {related.length > 0 && (
        <section className="container mt-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
              Related pillars
            </h2>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {related.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-sm font-semibold text-ss-teal transition hover:border-ss-teal hover:bg-ss-teal hover:text-white dark:text-white"
                >
                  <Sparkles size={12} className="text-ss-orange" /> {r.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
