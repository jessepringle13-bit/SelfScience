// /app/app/pillars/page.js
// SelfScience — /pillars explainer landing.
//
// Purpose (Issue #3, Phase 4 UX): give visitors a single page that
// (1) explains what a "pillar" is and why the whole site is organised
// this way, (2) lists all 10 pillars with a plain-English description
// and the specific tools/content that live inside each, and (3) makes
// it explicit that genetic/lab data is optional and never gates access
// to a pillar.
//
// Constraints held throughout:
//   \u2022 No new features. Every link points to an existing route.
//   \u2022 Client Component (needed because PILLARS lives in
//     components/site-nav.jsx which is a Client Component; RSC
//     boundaries block non-component values from crossing).
//   \u2022 metadata for the route lives in /pillars/layout.js so this
//     stays a Client Component while OG/canonical still work.
//   \u2022 Icons + typography only \u2014 no busy imagery.
//   \u2022 Dark cards / white headings / orange CTAs / teal accents,
//     matching /how-it-works and the rest of the app.

'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Compass,
  ShieldAlert,
  Sparkles,
  Search as SearchIcon,
  Dna,
  TestTube2,
  Salad,
  Activity,
  Pill,
  Baby,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { PILLARS } from '@/components/site-nav'

// (Route-level metadata lives in /pillars/layout.js — see file header.)

// -------------------------------------------------------------------------
// Pillar \u2192 tools / content mapping.
//
// Keys must match the `key` field on the canonical PILLARS array in
// components/site-nav.jsx. Every href points at a route that already
// exists (verified via `ls app/*`). "Explore this pillar" always uses
// /search?pillar=<Name> because the Search page is the one route that
// already fans out with per-pillar filtering.
// -------------------------------------------------------------------------
const PILLAR_TOOLS = {
  genomics: [
    { href: '/genome',           label: 'Genome interpreter',    blurb: 'Upload a 23andMe or AncestryDNA file to see your variants in plain English.' },
    { href: '/genome/findings',  label: 'Your findings',         blurb: 'Strengths and things to be aware of, once a file is loaded.' },
  ],
  nutrition: [
    { href: '/nutrition',        label: 'Nutrition scanner',     blurb: 'Look up foods, ingredients, and supplements against your biology.' },
    { href: '/reading-list',     label: 'Reading list',          blurb: 'Curated books and papers on nutritional science.' },
  ],
  'sports-performance': [
    { href: '/training',         label: 'Training Protocol',     blurb: 'Zone-based training and sport affinity built from your variants.' },
    { href: '/tools/training',   label: 'Training toolkit',      blurb: 'Additional performance planning tools.' },
  ],
  longevity: [
    { href: '/goals',            label: 'Goals',                 blurb: 'Track long-horizon health goals with progress bars.' },
    { href: '/tracker',          label: 'Habit tracker',         blurb: 'The daily behaviour behind healthspan.' },
  ],
  wellness: [
    { href: '/journal',          label: 'Health journal',        blurb: 'Log daily observations and see them alongside findings.' },
    { href: '/tracker',          label: 'Habit tracker',         blurb: 'Sleep, stress, movement, hydration \u2014 the boring levers that matter.' },
    { href: '/goals',            label: 'Goals',                 blurb: 'Turn intentions into progress you can see.' },
  ],
  pharmacogenomics: [
    { href: '/drug-check',       label: 'Drug Check',            blurb: 'Look up a medication and see estimated pharmacogenomic guidance.' },
  ],
  'mental-health': [
    { href: '/search?pillar=Mental+Health+%26+Neurochemistry', label: 'Research', blurb: 'Papers on mood, stress response, and brain chemistry.' },
    { href: '/reading-list',     label: 'Reading list',          blurb: 'Books on neurochemistry and the science of mood.' },
  ],
  environment: [
    { href: '/search?pillar=Environmental+Sensitivity', label: 'Research', blurb: 'Papers on toxin exposure, air quality, and chemical sensitivity.' },
  ],
  hormones: [
    { href: '/biomarkers',       label: 'Lab Biomarkers',        blurb: 'Log hormones, thyroid, cortisol and see them in context.' },
  ],
  pediatric: [
    { href: '/pillars/youth',    label: 'Developmental & Lifespan pillar page', blurb: 'Growth, focus, digestion, sleep, and lifespan wellness.' },
    { href: '/ancestry',         label: 'Ancestry Report',       blurb: 'Rough educational sketch from your geographically stratified variants.' },
  ],
}

// Plain-English one-sentence descriptions, simplified further than the
// canonical `description` field where useful. Falls back to the
// canonical description at render time if a pillar isn't listed here.
const PILLAR_PLAIN_DESC = {
  genomics:            'The genes you were born with \u2014 what current research suggests they mean, and what it doesn\u2019t.',
  nutrition:           'How your body handles food, nutrients, and dietary patterns \u2014 for you, not for average people.',
  'sports-performance': 'The genetics of movement, training, recovery, and injury risk.',
  longevity:           'What the research really says about extending healthspan, not just lifespan.',
  wellness:            'Sleep, stress, gut health, hydration \u2014 the daily habits that quietly compound.',
  pharmacogenomics:    'How your genes shape the way medications and supplements work in your body.',
  'mental-health':     'Mood, focus, stress response, and the brain chemistry behind them.',
  environment:         'How your body responds to what\u2019s in the air, water, and everyday products around you.',
  hormones:            'Thyroid, cortisol, sex hormones \u2014 the messengers that set the rhythm of your biology.',
  pediatric:           'Growth, development, and wellness across every life stage \u2014 useful whether the person is 4 or 84.',
}

export default function PillarsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24 dark:from-ss-canvas dark:via-ss-bg dark:to-ss-canvas">
      <SiteNav />

      {/* ================================================================
          1. HERO — What a pillar is and why the site is organised this way
          ================================================================ */}
      <section className="container pt-24 md:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ss-orange/40 bg-ss-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
            <Compass size={12} /> The SelfScience taxonomy
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ss-teal md:text-6xl dark:text-white">
            Ten pillars. One taxonomy for your whole biology.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ss-text/90 md:text-xl">
            A pillar is a slice of your health with its own research, its own tools, and its own plain-English lens.
            Instead of a hundred scattered topics, everything on SelfScience lives inside one of ten pillars &mdash;
            so no matter what you&rsquo;re curious about, you know exactly where to look.
          </p>
          <p className="mt-4 text-base text-ss-muted">
            Pillars aren&rsquo;t categories we invented for design. They&rsquo;re the shape the actual research already comes in.
          </p>
        </div>
      </section>

      {/* ================================================================
          2. BEFORE YOU EXPLORE — data is optional callout
          ================================================================ */}
      <section className="container mt-14">
        <div className="mx-auto max-w-4xl rounded-2xl border-l-4 border-ss-teal/60 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert size={22} className="mt-0.5 flex-shrink-0 text-ss-teal" />
            <div>
              <h2 className="text-lg font-extrabold text-ss-teal dark:text-white">
                Before you explore
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ss-text/90">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ss-teal" aria-hidden="true" />
                  <span>
                    SelfScience is <span className="font-semibold text-ss-teal dark:text-white">educational, not diagnostic</span>.
                    Every pillar summarizes research associations &mdash; it doesn&rsquo;t hand out verdicts or prescriptions.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ss-teal" aria-hidden="true" />
                  <span>
                    Genetic and lab data are <span className="font-semibold text-ss-teal dark:text-white">completely optional</span>.
                    Uploading a DNA file or logging a biomarker only <em>personalizes</em> what you see &mdash;
                    it never gates access to a pillar&rsquo;s research or tools.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ss-teal" aria-hidden="true" />
                  <span>
                    You can enter any pillar as an anonymous reader, come back later with data,
                    and pick up right where you left off. Your progress stays on your device.
                  </span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-ss-muted">
                Prefer a broader orientation first?{' '}
                <Link href="/how-it-works" className="font-semibold text-ss-teal underline hover:no-underline dark:text-white">
                  Take the 2-minute tour of the site
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          3. PILLAR CARDS — one per canonical pillar
          ================================================================ */}
      <section className="container mt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
            The ten pillars
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ss-teal md:text-4xl dark:text-white">
            Pick a lens. Read the research. Bring data later if you want.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, idx) => (
            <PillarCard
              key={p.key}
              number={idx + 1}
              pillar={p}
              plainDesc={PILLAR_PLAIN_DESC[p.key] || p.description}
              tools={PILLAR_TOOLS[p.key] || []}
            />
          ))}
        </div>
      </section>

      {/* ================================================================
          4. WHAT NEXT — three natural next steps
          ================================================================ */}
      <section className="container mt-24">
        <div className="rounded-3xl border border-ss-border-warm/60 bg-white p-8 text-center shadow-sm md:p-12">
          <h2 className="text-3xl font-extrabold text-ss-teal md:text-4xl dark:text-white">
            Wherever you start, you can&rsquo;t break anything.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ss-text/90">
            Pillars are open. Data is optional. Come back tomorrow with the same you and pick up where you left off.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StartDoor
              href="/search"
              Icon={SearchIcon}
              badge="I have a question"
              title="Search the research"
              copy="Type any topic. Read what the science actually says."
            />
            <StartDoor
              href="/how-it-works"
              Icon={Sparkles}
              badge="I&rsquo;m new here"
              title="Take the 2-minute tour"
              copy="A plain-English walkthrough of everything on the site."
              emphasize
            />
            <StartDoor
              href="/genome"
              Icon={Dna}
              badge="I have a DNA file"
              title="Personalize with your genome"
              copy="Optional. Sharpens every pillar around your biology."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Local presentational helpers
// ---------------------------------------------------------------------------

function PillarCard({ number, pillar, plainDesc, tools }) {
  const Icon = pillar.Icon
  const pillarHref = pillar.route || `/search?pillar=${encodeURIComponent(pillar.name)}`
  return (
    <article className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal transition group-hover:bg-ss-teal group-hover:text-white">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-muted">
          Pillar {String(number).padStart(2, '0')}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-extrabold text-ss-teal dark:text-white">{pillar.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ss-text/85">{plainDesc}</p>

      {tools.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-ss-muted">
            Tools &amp; content inside
          </div>
          <ul className="space-y-1.5">
            {tools.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="group/tool flex flex-col gap-0.5 rounded-md border border-transparent px-2 py-1.5 transition hover:border-ss-border-warm hover:bg-ss-bg/40"
                >
                  <span className="flex items-center gap-1 text-sm font-semibold text-ss-teal group-hover/tool:underline dark:text-white">
                    {t.label} <ArrowRight size={12} className="transition group-hover/tool:translate-x-0.5" />
                  </span>
                  <span className="text-xs text-ss-muted">{t.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary CTA — always the pre-filtered research feed for this pillar */}
      <div className="mt-auto pt-5">
        <Link
          href={`/search?pillar=${encodeURIComponent(pillar.name)}`}
          className="inline-flex items-center gap-1 rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark"
        >
          Explore this pillar <ArrowRight size={14} />
        </Link>
        {pillar.route && pillar.route !== `/search?pillar=${pillar.name}` && (
          <Link
            href={pillar.route}
            className="ml-2 text-xs font-semibold text-ss-muted underline underline-offset-4 hover:text-ss-teal"
          >
            or open the pillar page &rarr;
          </Link>
        )}
      </div>
    </article>
  )
}

function StartDoor({ href, Icon, badge, title, copy, emphasize }) {
  const base = 'group flex flex-col items-center rounded-2xl p-6 text-center transition hover:-translate-y-0.5'
  const scheme = emphasize
    ? 'bg-ss-orange text-white shadow-lg hover:bg-ss-orange-dark'
    : 'bg-white text-ss-text shadow-sm ring-1 ring-ss-border-warm/60 hover:shadow-md'
  return (
    <Link href={href} className={`${base} ${scheme}`}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${emphasize ? 'bg-white/20 text-white' : 'bg-ss-teal/10 text-ss-teal'}`}>
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <div
        className={`mt-4 text-[10.5px] font-extrabold uppercase tracking-[0.18em] ${emphasize ? 'text-white/80' : 'text-ss-orange'}`}
        dangerouslySetInnerHTML={{ __html: badge }}
      />
      <div className={`mt-1 text-lg font-extrabold ${emphasize ? 'text-white' : 'text-ss-teal dark:text-white'}`}>
        {title}
      </div>
      <p className={`mt-2 text-sm ${emphasize ? 'text-white/90' : 'text-ss-text/85'}`}>{copy}</p>
      <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${emphasize ? 'text-white' : 'text-ss-orange'}`}>
        Start here <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
