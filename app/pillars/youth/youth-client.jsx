'use client'

// /app/app/pillars/youth/youth-client.jsx
// The Youth pillar page. Nine expandable domain sections, warm framing, and
// a persistent "discuss with your pediatrician" youth-specific disclaimer.
//
// UX detail: on a user’s first visit the first domain (Nutrition from Birth)
// is expanded so the page immediately shows depth. On subsequent visits all
// sections are collapsed by default — tracked via localStorage.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, ExternalLink, Info, Sparkles } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import { YOUTH_DOMAINS, YOUTH_BOOK_SLUGS } from '@/lib/youth-content'
import { BOOKS } from '@/lib/books'

const FIRST_VISIT_KEY = 'selfscience_youth_pillar_visited_v1'

function DomainSection({ domain, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = domain.icon
  return (
    <section id={domain.slug} className="scroll-mt-24 rounded-2xl bg-white shadow-sm ring-1 ring-ss-border-warm/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left"
        aria-expanded={open}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ss-teal/10 text-ss-teal">
          <Icon size={22} />
        </span>
        <span className="flex-1">
          <span className="block text-xs font-bold uppercase tracking-widest text-ss-muted">Domain</span>
          <span className="mt-0.5 block text-xl font-extrabold text-ss-teal">{domain.title}</span>
          <span className="mt-0.5 block text-sm text-ss-muted">{domain.subtitle}</span>
        </span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-ss-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-ss-border-warm/60 px-5 py-5 md:px-6 md:py-6">
          <p className="text-[15px] leading-relaxed text-ss-text">{domain.overview}</p>

          {domain.sensitive && (
            <div className="mt-4 flex gap-3 rounded-lg border border-ss-teal/30 bg-ss-teal/5 p-3 text-[13px] leading-relaxed text-ss-teal">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span>{domain.sensitiveNote}</span>
            </div>
          )}

          {/* Variant grid */}
          <div className="mt-6 space-y-4">
            {domain.variants.map((v, i) => (
              <div key={i} className="rounded-lg border border-ss-border-warm/60 p-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-lg font-extrabold text-ss-teal">{v.gene}</span>
                  <span className="text-[11px] font-semibold text-ss-muted">{v.rsid}</span>
                  <span className="rounded-full bg-ss-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ss-orange">
                    {v.finding}
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-ss-text">{v.implication}</p>
                <div className="mt-3 rounded-md bg-ss-bg p-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ss-teal">
                    What parents can do
                  </div>
                  <p className="text-[14px] leading-relaxed text-ss-text">{v.action}</p>
                </div>
              </div>
            ))}
          </div>

          {domain.parentChecklist && (
            <div className="mt-6 rounded-lg bg-ss-bg p-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ss-teal">
                Practical parent checklist (applies to all children)
              </div>
              <ul className="space-y-1.5 text-[14px] text-ss-text">
                {domain.parentChecklist.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ss-orange" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {domain.extraNote && (
            <div className="mt-4 rounded-lg border-l-4 border-ss-orange bg-ss-orange/10 p-3 text-[13px] leading-relaxed text-ss-text">
              {domain.extraNote}
            </div>
          )}

          {/* Pediatrician nudge — required per PRD on every domain */}
          <p className="mt-5 text-[13px] italic text-ss-muted">
            These insights are for educational purposes. Discuss any genomic findings for your child with your child’s pediatrician or a genetic counselor.
          </p>

          {/* Research links */}
          <div className="mt-5">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ss-muted">Research</div>
            <div className="flex flex-wrap gap-2">
              {domain.research.map((q) => (
                <Link
                  key={q}
                  href={`/search?q=${encodeURIComponent(q)}&pillar=${encodeURIComponent('Pediatric & Youth Wellness')}`}
                  className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm bg-white px-3 py-1 text-[12px] font-semibold text-ss-teal hover:bg-ss-bg"
                >
                  {q} <ArrowRight size={11} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function YouthClient() {
  // First-visit detection — open Domain 1 (Nutrition from Birth) only the
  // first time the user lands on the page. Subsequent visits keep all
  // domains collapsed so users can scan without a wall of text.
  //
  // `firstVisit` starts as null (unknown) so we don't SSR the wrong state.
  // Once the effect runs client-side it flips to true/false and the domain
  // sections re-mount via key change to pick up the new defaultOpen prop.
  const [firstVisit, setFirstVisit] = useState(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const seen = window.localStorage.getItem(FIRST_VISIT_KEY)
      if (!seen) {
        window.localStorage.setItem(FIRST_VISIT_KEY, String(Date.now()))
        setFirstVisit(true)
      } else {
        setFirstVisit(false)
      }
    } catch {
      setFirstVisit(false)
    }
  }, [])

  const youthBooks = useMemo(() => {
    const bySlug = new Map(BOOKS.map((b) => [b.slug, b]))
    return YOUTH_BOOK_SLUGS.map((s) => bySlug.get(s)).filter(Boolean)
  }, [])

  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1B474D] pb-20 pt-24 text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#C45820]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <SiteNav variant="dark" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/25">
              <Sparkles size={13} /> Youth Pillar
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              The Earlier You Know, The More You Can Do
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/85 md:text-lg">
              Most adults discover their genomic profile in their 30s or 40s — after decades of suboptimal nutrition, the wrong athletic path, or unrecognized mental health needs. A child whose parents understand their genome can start with that advantage on day one.
            </p>
          </div>

          <blockquote className="mx-auto mt-10 max-w-3xl border-l-4 border-[#F5B840] bg-white/5 p-5 text-white/95 backdrop-blur-sm md:text-[17px]">
            “The children who benefit most from genomic health science are the ones whose parents act on it early — not the ones who discover it as adults wishing they had known sooner.”
          </blockquote>

          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3">
            <Link
              href="/pillars/youth/early-advantage"
              className="inline-flex items-center gap-2 rounded-full bg-[#F5B840] px-5 py-2.5 text-sm font-bold text-[#1B474D] shadow transition hover:brightness-95"
            >
              Read: The Early Advantage <ArrowRight size={14} />
            </Link>
            <Link
              href="/pillars/youth/genome-for-parents"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
            >
              For Parents: Using Your Child’s Genome
            </Link>
          </div>
        </div>
      </section>

      {/* Persistent youth-specific disclaimer (teal, informational) */}
      <section className="border-b border-ss-border-warm bg-ss-teal/10">
        <div className="container flex gap-3 py-4 text-sm text-ss-teal">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong className="font-bold">Important:</strong> Genomic information for children should be discussed with your child’s pediatrician or a genetic counselor before making health decisions. Genetic variants describe research associations in populations — they do not diagnose conditions or predict individual outcomes. The content on this page is for educational awareness to support better conversations with your healthcare team, not to replace professional guidance.
          </p>
        </div>
      </section>

      {/* Intro + domain jump-nav */}
      <section className="container py-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-extrabold text-ss-teal">Nine domains, one mission</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ss-text">
            The Youth pillar covers nine domains where genomic variants meaningfully influence a child’s development, health, and long-term trajectory. Every section includes what to look for, what the research shows, and what parents can do now — not someday.
          </p>
        </div>

        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-2 md:grid-cols-3">
          {YOUTH_DOMAINS.map((d, i) => {
            const Icon = d.icon
            return (
              <a
                key={d.slug}
                href={`#${d.slug}`}
                className="flex items-center gap-2 rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-[12px] font-semibold text-ss-teal transition hover:bg-ss-bg"
              >
                <Icon size={14} />
                <span className="truncate">{i + 1}. {d.title}</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* Nine domains */}
      <section className="container pb-16">
        <div className="mx-auto max-w-4xl space-y-4">
          {YOUTH_DOMAINS.map((d, i) => (
            <DomainSection
              key={`${d.slug}-${firstVisit === null ? 'wait' : firstVisit ? 'first' : 'return'}`}
              domain={d}
              defaultOpen={firstVisit === true && i === 0}
            />
          ))}
        </div>
      </section>

      {/* Reading list */}
      {youthBooks.length > 0 && (
        <section className="border-t border-ss-border-warm bg-white">
          <div className="container py-12">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-2xl font-extrabold text-ss-teal">Books for parents</h2>
              <p className="mt-2 text-[15px] text-ss-muted">Curated for the Youth pillar. Each book links to the peer-reviewed research behind its claims.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {youthBooks.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/reading-list/${b.slug}`}
                    className="group flex gap-4 rounded-xl border border-ss-border-warm p-4 transition hover:bg-ss-bg"
                  >
                    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-ss-teal text-[9px] font-bold uppercase leading-tight text-white">
                      {(b.title.split(' ')[0] || 'BOOK').slice(0, 8)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ss-teal">{b.title}</div>
                      <div className="text-[12px] text-ss-muted">{b.author}{b.year ? ` · ${b.year}` : ''}</div>
                      <p className="mt-1 line-clamp-2 text-[13px] text-ss-text">{b.plainReason}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/reading-list?filter=youth"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-ss-teal hover:underline"
                >
                  See all Youth pillar books <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA row */}
      <section className="container py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-ss-border-warm/60">
          <h2 className="text-2xl font-extrabold text-ss-teal">Starting today</h2>
          <p className="text-[15px] text-ss-text">
            Upload your genome, upload a family member’s genome, explore the research, and bring what you find to your child’s pediatrician. Every one of the interventions on this page is educational — the medical decisions belong with your family and your healthcare team.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/genome"
              className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-ss-orange-dark"
            >
              Upload a genome <ArrowRight size={14} />
            </Link>
            <Link
              href={`/search?pillar=${encodeURIComponent('Pediatric & Youth Wellness')}`}
              className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-5 py-2.5 text-sm font-semibold text-ss-teal hover:bg-ss-teal/5"
            >
              Explore the research <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
