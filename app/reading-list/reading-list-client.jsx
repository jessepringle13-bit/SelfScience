'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Search, ArrowRight } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import { BOOKS, PILLAR_LABELS, PILLARS_ORDERED, TOPIC_COLLECTIONS, fetchOpenLibraryCover } from '@/lib/books'
import { trackEvent, EVENTS } from '@/lib/analytics'

// Palette per pillar (used as cover fallback background)
const PILLAR_COLORS = {
  genomics: '#1B474D', nutrition: '#2E7D32', performance: '#C45820',
  longevity: '#5E4B8B', wellness: '#0F6B6B', pharmacogenomics: '#8A2C6E',
  'mental-health': '#3B5BA5', environment: '#556B2F', hormones: '#B45309',
  youth: '#F5B840',
}

function BookCover({ book }) {
  // Prefer an explicit `book.coverUrl` override when the data file
  // supplies one (used when Open Library's title+author search doesn't
  // resolve reliably, e.g. The Genome Factor).
  const [src, setSrc] = useState(book.coverUrl || null)
  useEffect(() => {
    if (book.coverUrl) return // explicit override — skip lookup
    let alive = true
    fetchOpenLibraryCover(book.title, book.author).then((url) => {
      if (alive) setSrc(url)
    })
    return () => { alive = false }
  }, [book.title, book.author, book.coverUrl])
  const bg = PILLAR_COLORS[book.pillar[0]] || '#1B474D'
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#F9F8F5]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={book.title} className="h-full w-auto object-contain" onError={() => setSrc(null)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-4 text-center" style={{ background: bg }}>
          <div className="text-sm font-bold leading-tight text-white/95 line-clamp-4">{book.title}</div>
        </div>
      )}
    </div>
  )
}

export default function ReadingListClient() {
  const router = useRouter()
  const params = useSearchParams()
  // Deep-link support:
  //   /reading-list?filter=youth              -> pillar filter
  //   /reading-list?topic=environmental-health -> topic collection filter
  const initialFilter = params?.get('filter') || 'all'
  const initialTopic = params?.get('topic') || null
  const [filter, setFilter] = useState(initialFilter)
  const [topic, setTopic] = useState(initialTopic)

  useEffect(() => { trackEvent(EVENTS.READING_LIST_VIEWED) }, [])

  const filtered = useMemo(() => {
    // Topic filter takes precedence \u2014 collection slugs are curated so an
    // active topic overrides the pillar chip until the user clears it.
    if (topic) {
      const col = TOPIC_COLLECTIONS.find((c) => c.slug === topic)
      if (!col) return BOOKS
      const slugSet = new Set(col.slugs)
      return BOOKS.filter((b) => slugSet.has(b.slug))
    }
    if (filter === 'all') return BOOKS
    return BOOKS.filter((b) => b.pillar.includes(filter))
  }, [filter, topic])

  const activeTopic = topic ? TOPIC_COLLECTIONS.find((c) => c.slug === topic) : null

  const goSearch = (q, bookSlug) => {
    trackEvent(EVENTS.BOOK_RESEARCH_CLICKED, { book_slug: bookSlug, source: 'reading_list' })
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#1B474D] pb-16 pt-24 text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#C45820]/20 blur-3xl" />
        <SiteNav variant="dark" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/25">
              <BookOpen size={13} /> Reading List
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">The SelfScience Reading List</h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/85 md:text-lg">
              Books that connect to the research. Every recommendation includes the peer-reviewed studies behind the ideas — and an honest note on where the evidence is strong and where it is still emerging.
            </p>
          </div>
        </div>
      </section>

      {/* Browse by topic \u2014 curated multi-pillar bundles. Sits above the
          pillar filter so first-time visitors see a natural entry point
          into the reading list. */}
      <section className="border-b border-ss-border-warm bg-white">
        <div className="container py-5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ss-muted">Browse by topic</div>
          <div className="flex flex-wrap gap-2">
            {TOPIC_COLLECTIONS.map((c) => {
              const active = topic === c.slug
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => { setTopic(active ? null : c.slug); setFilter('all') }}
                  className={`rounded-lg border px-3 py-2 text-left text-[12px] font-semibold transition ${
                    active ? 'border-[#C45820] bg-[#C45820] text-white' : 'border-ss-border-warm bg-white text-ss-teal hover:bg-ss-bg'
                  }`}
                  title={c.blurb}
                >
                  {c.label}
                </button>
              )
            })}
            {topic && (
              <button
                type="button"
                onClick={() => setTopic(null)}
                className="rounded-lg bg-ss-teal/10 px-3 py-2 text-[12px] font-semibold text-ss-teal hover:bg-ss-teal/20"
              >
                Clear topic
              </button>
            )}
          </div>
          {activeTopic && (
            <p className="mt-2 text-xs text-ss-muted">{activeTopic.blurb}</p>
          )}
        </div>
      </section>

      {/* Filter pills */}
      <section className="sticky top-0 z-20 border-b border-ss-border-warm bg-white">
        <div className="container flex flex-wrap items-center gap-2 py-4">
          {['all', ...PILLARS_ORDERED].map((key) => {
            const active = filter === key && !topic
            const label = key === 'all' ? 'All' : PILLAR_LABELS[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setFilter(key); setTopic(null) }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-[#1B474D] bg-[#1B474D] text-white'
                    : 'border-[#1B474D] bg-white text-[#1B474D] hover:bg-[#1B474D]/5'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Grid */}
      <section className="container py-10 md:py-14">
        <div className="mb-6 text-sm text-ss-muted">
          <strong className="text-ss-teal">{filtered.length}</strong> {filtered.length === 1 ? 'entry' : 'entries'}
          {activeTopic ? (
            <> in <strong className="text-ss-teal">{activeTopic.label}</strong></>
          ) : filter !== 'all' ? (
            <> in <strong className="text-ss-teal">{PILLAR_LABELS[filter]}</strong></>
          ) : null}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => {
            const isResource = book.type === 'featured_resource'
            const isComingSoon = book.type === 'coming_soon'
            return (
              <article
                key={book.slug}
                className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg ${
                  isResource ? 'ring-2 ring-[#C45820]/40' : ''
                } ${isComingSoon ? 'opacity-95' : ''}`}
              >
                <BookCover book={book} />
                <div className="p-4">
                  {/* Status ribbon */}
                  <div className="mb-2 flex flex-wrap gap-1">
                    {isComingSoon && (
                      <span className="rounded-full bg-[#B07D00] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        Coming Soon
                      </span>
                    )}
                    {isResource && (
                      <span className="rounded-full bg-[#C45820] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        Featured Resource
                      </span>
                    )}
                    {book.evidenceQuality && !isResource && !isComingSoon && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          book.evidenceQuality === 'strong'
                            ? 'bg-emerald-600 text-white'
                            : book.evidenceQuality === 'mixed'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                        title="Editorial assessment of evidence quality behind the book's core claims"
                      >
                        {book.evidenceQuality === 'strong'
                          ? 'Evidence: Strong'
                          : book.evidenceQuality === 'mixed'
                          ? 'Evidence: Mixed'
                          : 'More Speculative'}
                      </span>
                    )}
                    {book.pillar.map((p) => (
                      <span key={p} className="rounded-full bg-[#1B474D] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        {PILLAR_LABELS[p]}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-base font-bold leading-snug text-[#28251D]">{book.title}</h3>
                  {book.subtitle && (
                    <div className="mt-0.5 text-[12px] italic text-[#7A7974] line-clamp-2">{book.subtitle}</div>
                  )}
                  <div className="mt-1 text-sm text-[#7A7974]">{book.author}</div>
                  <div className="text-xs text-[#7A7974]">
                    {isComingSoon ? (book.status || 'Coming soon') : (book.year || '')}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#28251D]">{book.plainReason}</p>
                  {book.honestyNote && (
                    <div className="mt-3 rounded-md border-l-[3px] border-[#B07D00] bg-[#FFFBEA] p-3 text-[13px] italic text-[#7A7974]">
                      <strong className="not-italic text-[#7A7974]">Note: </strong>{book.honestyNote}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    {book.searchQueries && book.searchQueries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => goSearch(book.searchQueries[0], book.slug)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[#1B474D] px-3 py-2 text-xs font-semibold text-[#1B474D] transition hover:bg-[#1B474D] hover:text-white"
                      >
                        <Search size={12} /> Find the Research
                      </button>
                    )}
                    {isResource && book.externalUrl ? (
                      <a
                        href={book.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-[#C45820] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#A5471A]"
                      >
                        Visit Site <ArrowRight size={12} />
                      </a>
                    ) : isComingSoon ? (
                      <span className="inline-flex items-center justify-center gap-1 rounded-full bg-[#7A7974] px-3 py-2 text-xs font-semibold text-white">
                        Not yet published
                      </span>
                    ) : (
                      <a
                        href={`/reading-list/${book.slug}`}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-[#C45820] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#A5471A]"
                      >
                        Learn More <ArrowRight size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center ring-1 ring-black/5">
            <div className="text-ss-muted">No books in this pillar yet.</div>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  )
}
