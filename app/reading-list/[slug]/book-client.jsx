'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import { ResultCard } from '@/components/result-card'
import { BOOKS, PILLAR_LABELS, fetchOpenLibraryCover } from '@/lib/books'
import { trackEvent, EVENTS } from '@/lib/analytics'

const PILLAR_COLORS = {
  genomics: '#1B474D', nutrition: '#2E7D32', performance: '#C45820',
  longevity: '#5E4B8B', wellness: '#0F6B6B', pharmacogenomics: '#8A2C6E',
  'mental-health': '#3B5BA5', environment: '#556B2F', hormones: '#B45309',
}

export default function BookClient({ slug }) {
  const router = useRouter()
  const book = BOOKS.find((b) => b.slug === slug)
  const [cover, setCover] = useState(null)
  const [related, setRelated] = useState({ loading: true, items: [] })

  useEffect(() => {
    if (!book) return
    fetchOpenLibraryCover(book.title, book.author).then(setCover)
    // Auto-search for related research using searchQueries[0]
    fetch(`/api/search?q=${encodeURIComponent(book.searchQueries[0])}&limit=4`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setRelated({ loading: false, items: (d.results || []).slice(0, 4) }))
      .catch(() => setRelated({ loading: false, items: [] }))
  }, [book])

  if (!book) {
    return (
      <div className="min-h-screen bg-ss-bg">
        <SiteNav variant="light" />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-ss-teal">Book not found</h1>
          <a href="/reading-list" className="mt-4 inline-block text-ss-orange underline">Back to reading list</a>
        </div>
      </div>
    )
  }

  const bg = PILLAR_COLORS[book.pillar[0]] || '#1B474D'
  const relatedBooks = BOOKS.filter((b) => b.slug !== book.slug && b.pillar.some((p) => book.pillar.includes(p))).slice(0, 3)

  const goSearch = (q, source) => {
    trackEvent(EVENTS.BOOK_RESEARCH_CLICKED, { book_slug: book.slug, source })
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(`${book.title} ${book.author}`)}`

  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      <SiteNav variant="light" />

      {/* Book hero */}
      <section className="bg-[#F9F8F5] pt-24 pb-14">
        <div className="container">
          <a href="/reading-list" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1B474D] hover:text-[#C45820]">
            <ArrowLeft size={14} /> Back to reading list
          </a>
          <div className="grid gap-8 md:grid-cols-[300px_1fr]">
            <div className="flex items-start justify-center md:justify-start">
              <div className="w-[240px] overflow-hidden rounded-xl shadow-xl ring-1 ring-black/10 md:w-[300px]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={book.title} className="h-auto w-full object-cover" />
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center p-8 text-center" style={{ background: bg }}>
                    <div className="text-lg font-bold leading-tight text-white/95">{book.title}</div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-3 flex flex-wrap gap-1">
                {book.pillar.map((p) => (
                  <span key={p} className="rounded-full bg-[#1B474D] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">{PILLAR_LABELS[p]}</span>
                ))}
              </div>
              <h1 className="text-3xl font-extrabold leading-tight text-[#1B474D] md:text-4xl">{book.title}</h1>
              <div className="mt-2 text-lg text-[#7A7974]">{book.author}</div>
              <div className="text-sm text-[#7A7974]">{book.year}</div>

              {/* Why it's on the SelfScience reading list — the personal, variant-aware hook. */}
              <p className="mt-5 text-base leading-relaxed text-[#28251D]">{book.plainReason}</p>

              {book.honestyNote && (
                <div className="mt-5 rounded-lg border-l-4 border-[#B07D00] bg-[#FFFBEA] p-4">
                  <div className="text-sm font-bold text-[#7A7974]">Honesty Note:</div>
                  <div className="mt-1 text-sm italic leading-relaxed text-[#7A7974]">{book.honestyNote}</div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => goSearch(book.searchQueries[0], 'book_detail_primary')}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B474D] px-5 py-2.5 text-sm font-semibold text-[#1B474D] transition hover:bg-[#1B474D] hover:text-white"
                >
                  <Search size={14} /> Find the Research
                </button>
                <a
                  href={amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#C45820] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A5471A]"
                >
                  Buy This Book <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Book — synopsis + cultural impact, before the research. */}
      {(book.synopsis || book.knownFor) && (
        <section className="bg-white py-12">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-2">
              {book.synopsis && (
                <div className="rounded-2xl bg-[#F9F8F5] p-6 ring-1 ring-black/5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C45820]">
                    <BookInfoDot /> What&rsquo;s Inside
                  </div>
                  <h2 className="mt-2 text-xl font-extrabold text-[#1B474D]">A quick synopsis</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#28251D]">{book.synopsis}</p>
                </div>
              )}
              {book.knownFor && (
                <div className="rounded-2xl bg-[#F9F8F5] p-6 ring-1 ring-black/5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C45820]">
                    <BookInfoDot /> Why It Matters
                  </div>
                  <h2 className="mt-2 text-xl font-extrabold text-[#1B474D]">What it&rsquo;s known for</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#28251D]">{book.knownFor}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* The Research Behind This Book */}
      <section className="container py-12">
        <h2 className="text-2xl font-extrabold text-[#1B474D] md:text-3xl">The Research Behind This Book</h2>
        <p className="mt-2 max-w-2xl text-ss-muted">
          These peer-reviewed studies connect to the core ideas in this book. Each result has been scored for reliability.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {related.loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-white ring-1 ring-black/5" />
            ))
          ) : related.items.length > 0 ? (
            related.items.map((item) => (
              <ResultCard key={item.id} item={item} analysis={null} />
            ))
          ) : (
            <div className="col-span-full rounded-xl bg-white p-6 text-center text-sm text-ss-muted ring-1 ring-black/5">
              No related research found. Try one of the search queries below.
            </div>
          )}
        </div>
        {related.items.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => goSearch(book.searchQueries[0], 'book_detail_more_research')}
              className="inline-flex items-center gap-2 rounded-full bg-[#C45820] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A5471A]"
            >
              Search More Research <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      {/* Explore Further */}
      <section className="bg-[#F9F8F5] py-12">
        <div className="container">
          <h2 className="text-2xl font-extrabold text-[#1B474D] md:text-3xl">Explore Further on SelfScience</h2>
          <div className="mt-2 text-sm font-semibold text-ss-muted">Search these topics:</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {book.searchQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => goSearch(q, 'book_detail_topic_pill')}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#1B474D] bg-white px-4 py-2 text-sm font-medium text-[#1B474D] transition hover:bg-[#1B474D] hover:text-white"
              >
                <Search size={13} /> {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* More Books in This Area */}
      {relatedBooks.length > 0 && (
        <section className="container py-12">
          <h2 className="text-2xl font-extrabold text-[#1B474D] md:text-3xl">More Books in This Area</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedBooks.map((rb) => (
              <a
                key={rb.slug}
                href={`/reading-list/${rb.slug}`}
                className="group rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-lg"
              >
                <div className="mb-2 flex flex-wrap gap-1">
                  {rb.pillar.slice(0, 2).map((p) => (
                    <span key={p} className="rounded-full bg-[#1B474D] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{PILLAR_LABELS[p]}</span>
                  ))}
                </div>
                <h3 className="text-base font-bold text-[#28251D] group-hover:text-[#C45820]">{rb.title}</h3>
                <div className="mt-1 text-sm text-[#7A7974]">{rb.author}</div>
                <p className="mt-2 line-clamp-2 text-xs text-[#28251D]">{rb.plainReason}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  )
}

/** Small decorative dot used as an eyebrow marker for the About/Impact panels. */
function BookInfoDot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C45820]" aria-hidden="true" />
}
