'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Search, ArrowRight } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import { BOOKS, PILLAR_LABELS, PILLARS_ORDERED, fetchOpenLibraryCover } from '@/lib/books'
import { trackEvent, EVENTS } from '@/lib/analytics'

// Palette per pillar (used as cover fallback background)
const PILLAR_COLORS = {
  genomics: '#1B474D', nutrition: '#2E7D32', performance: '#C45820',
  longevity: '#5E4B8B', wellness: '#0F6B6B', pharmacogenomics: '#8A2C6E',
  'mental-health': '#3B5BA5', environment: '#556B2F', hormones: '#B45309',
}

function BookCover({ book }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let alive = true
    fetchOpenLibraryCover(book.title, book.author).then((url) => {
      if (alive) setSrc(url)
    })
    return () => { alive = false }
  }, [book.title, book.author])
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
  const [filter, setFilter] = useState('all')

  useEffect(() => { trackEvent(EVENTS.READING_LIST_VIEWED) }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return BOOKS
    return BOOKS.filter((b) => b.pillar.includes(filter))
  }, [filter])

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

      {/* Filter pills */}
      <section className="sticky top-0 z-20 border-b border-ss-border-warm bg-white">
        <div className="container flex flex-wrap items-center gap-2 py-4">
          {['all', ...PILLARS_ORDERED].map((key) => {
            const active = filter === key
            const label = key === 'all' ? 'All' : PILLAR_LABELS[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
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
          <strong className="text-ss-teal">{filtered.length}</strong> {filtered.length === 1 ? 'book' : 'books'}
          {filter !== 'all' && (<> in <strong className="text-ss-teal">{PILLAR_LABELS[filter]}</strong></>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <article key={book.slug} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg">
              <BookCover book={book} />
              <div className="p-4">
                <div className="mb-2 flex flex-wrap gap-1">
                  {book.pillar.map((p) => (
                    <span key={p} className="rounded-full bg-[#1B474D] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{PILLAR_LABELS[p]}</span>
                  ))}
                </div>
                <h3 className="text-base font-bold leading-snug text-[#28251D]">{book.title}</h3>
                <div className="mt-1 text-sm text-[#7A7974]">{book.author}</div>
                <div className="text-xs text-[#7A7974]">{book.year}</div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#28251D]">{book.plainReason}</p>
                {book.honestyNote && (
                  <div className="mt-3 rounded-md border-l-[3px] border-[#B07D00] bg-[#FFFBEA] p-3 text-[13px] italic text-[#7A7974]">
                    <strong className="not-italic text-[#7A7974]">Note: </strong>{book.honestyNote}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => goSearch(book.searchQueries[0], book.slug)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[#1B474D] px-3 py-2 text-xs font-semibold text-[#1B474D] transition hover:bg-[#1B474D] hover:text-white"
                  >
                    <Search size={12} /> Find the Research
                  </button>
                  <a
                    href={`/reading-list/${book.slug}`}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-[#C45820] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#A5471A]"
                  >
                    Learn More <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </article>
          ))}
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
