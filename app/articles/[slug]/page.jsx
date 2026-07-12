// /app/app/articles/[slug]/page.jsx
// Public detail page for a Supabase editorial article. Server-rendered
// (so it's SEO-friendly and slug-not-found returns a proper 404).
// Only articles with is_published = true are visible — enforced by RLS
// on the anon key.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ExternalLink, Sparkles, Calendar, BookOpen } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { getArticleBySlug } from '@/lib/supabase/articles'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EVIDENCE_STYLES = {
  Settled:      { bg: 'bg-[#2E7D32]', text: 'text-white', label: 'Settled Science' },
  Emerging:     { bg: 'bg-ss-teal',   text: 'text-white', label: 'Emerging Evidence' },
  Preliminary:  { bg: 'bg-[#B07D00]', text: 'text-white', label: 'Preliminary' },
  Conflicting:  { bg: 'bg-[#A12C7B]', text: 'text-white', label: 'Conflicting Evidence' },
}

/** SEO metadata pulled from the article record. */
export async function generateMetadata({ params }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) {
    return { title: 'Article not found | SelfScience' }
  }
  const desc = (article.plain_terms_summary || article.abstract || '').slice(0, 160)
  return {
    title: `${article.title} | SelfScience`,
    description: desc,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: desc,
      type: 'article',
      images: article.cover_image_url ? [{ url: article.cover_image_url }] : undefined,
    },
  }
}

export default async function ArticlePage({ params }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const {
    title, authors, journal, publish_date, abstract, plain_terms_summary,
    doi, source_url, cover_image_url, pillars = [], tags = [],
    ai_reliability_score, evidence_quality,
  } = article

  const ev = EVIDENCE_STYLES[evidence_quality] || null
  const year = publish_date ? new Date(publish_date).getFullYear() : null
  const dateStr = publish_date
    ? new Date(publish_date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const doiUrl = doi ? (doi.startsWith('http') ? doi : `https://doi.org/${doi}`) : null

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      <SiteNav />

      {/* Cover image hero (only when present) */}
      {cover_image_url && (
        <div className="relative h-56 w-full overflow-hidden bg-ss-teal md:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ss-bg/70 to-transparent" />
        </div>
      )}

      <article className={`container pb-24 ${cover_image_url ? '-mt-16 pt-0 md:-mt-24' : 'pt-24 md:pt-28'}`}>
        <div className="mx-auto max-w-3xl">
          {/* Badge stack */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              <Sparkles size={12} /> SelfScience Editorial
            </span>
            {ev && (
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${ev.bg} ${ev.text}`}>
                {ev.label}
              </span>
            )}
            {typeof ai_reliability_score === 'number' && (
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-ss-teal ring-1 ring-ss-border-warm">
                AI Reliability: {ai_reliability_score}/100
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ss-teal md:text-4xl">
            {title}
          </h1>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ss-muted">
            {authors && <span>{authors}</span>}
            {journal && (
              <span className="inline-flex items-center gap-1">
                <BookOpen size={13} /> {journal}
              </span>
            )}
            {dateStr && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} /> {dateStr}
              </span>
            )}
            {!dateStr && year && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} /> {year}
              </span>
            )}
          </div>

          {/* External links */}
          <div className="mt-4 flex flex-wrap gap-3">
            {doiUrl && (
              <a
                href={doiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ss-teal px-4 py-1.5 text-xs font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
              >
                View original paper <ArrowRight size={12} />
              </a>
            )}
            {source_url && source_url !== doiUrl && (
              <a
                href={source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm px-4 py-1.5 text-xs font-semibold text-ss-muted transition hover:border-ss-teal hover:text-ss-teal"
              >
                Source <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* In Plain Terms card */}
          {plain_terms_summary && (
            <div className="mt-8 rounded-2xl border-l-4 border-ss-teal bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60 md:p-7">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ss-orange">
                In Plain Terms
              </div>
              <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-ss-text md:text-xl">
                {plain_terms_summary}
              </p>
            </div>
          )}

          {/* Abstract */}
          {abstract && (
            <details className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60 open:pb-7" open={abstract.length < 800}>
              <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.18em] text-ss-muted hover:text-ss-teal">
                Full Abstract
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ss-text/90">
                {abstract}
              </p>
            </details>
          )}

          {/* Pillars */}
          {pillars.length > 0 && (
            <div className="mt-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ss-muted">Pillars</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {pillars.map((p) => (
                  <Link
                    key={p}
                    href={`/search?pillar=${encodeURIComponent(p)}`}
                    className="rounded-full border-2 border-ss-orange px-3 py-1 text-xs font-semibold text-ss-orange transition hover:bg-ss-orange hover:text-white"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ss-muted">Tags</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="rounded-full bg-ss-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-ss-border-warm/60 pt-6">
            <Link href="/" className="text-sm font-semibold text-ss-teal hover:underline">
              ← Back to SelfScience
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-1 rounded-full border-2 border-ss-teal px-4 py-1.5 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
            >
              Browse more research <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </article>
    </main>
  )
}
