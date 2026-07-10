'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { ResultCard } from '@/components/result-card'
import { READING_LIST, PlaceholderCover } from '../page'
import { trackEvent, EVENTS } from '@/lib/analytics'

export default function BookClient({ slug }) {
  const router = useRouter()
  const book = READING_LIST.find((b) => b.slug === slug)

  const [cover, setCover] = useState(null)
  const [research, setResearch] = useState(null)
  const [researchLoading, setResearchLoading] = useState(false)

  useEffect(() => {
    if (!book) return
    // Cover from Google Books
    ;(async () => {
      try {
        const q = encodeURIComponent(`intitle:${book.title} inauthor:${book.author}`)
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
        if (res.ok) {
          const data = await res.json()
          const url = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
          if (url) setCover(url.replace(/^http:/, 'https:'))
        }
      } catch {}
    })()

    // Auto-search the book's query
    setResearchLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(book.searchQuery)}&limit=20`)
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((data) => setResearch(data))
      .catch(() => setResearch({ results: [] }))
      .finally(() => setResearchLoading(false))
  }, [slug, book])

  const goSearch = (q, pillar) => {
    trackEvent(EVENTS.BOOK_RESEARCH_CLICKED, {
      book_slug: slug,
      pillar: pillar || 'unknown',
      source: 'book_detail',
    })
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (pillar) usp.set('pillar', pillar)
    router.push(`/search?${usp.toString()}`)
  }

  if (!book) {
    return (
      <main className="min-h-screen bg-ss-bg text-ss-text">
        <section className="relative bg-ss-teal pb-10 pt-24 text-white"><SiteNav variant="dark" /></section>
        <section className="container py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ss-teal">Book not found</h1>
          <a href="/reading-list" className="mt-4 inline-block text-ss-orange underline">Back to Reading List</a>
        </section>
      </main>
    )
  }

  const relatedBooks = READING_LIST.filter((b) => b.slug !== book.slug && b.pillar === book.pillar).slice(0, 3)

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* Header */}
      <section className="relative bg-ss-teal pb-14 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white">
            <ArrowLeft size={14} /> Back to Reading List
          </button>
        </div>
      </section>

      <section className="container -mt-8 pb-6">
        <div className="grid grid-cols-1 gap-8 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5 md:grid-cols-[220px_1fr]">
          <div className="aspect-[2/3] w-[220px] overflow-hidden rounded-lg ring-1 ring-black/10">
            {cover ? <img src={cover} alt={book.title} className="h-full w-full object-cover" /> : <PlaceholderCover book={book} />}
          </div>
          <div>
            <span className="inline-flex rounded-full bg-ss-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-teal">{book.pillar}</span>
            <h1 className="mt-3 text-3xl font-extrabold text-ss-teal md:text-4xl">{book.title}</h1>
            {book.subtitle && <p className="mt-1 italic text-ss-muted">{book.subtitle}</p>}
            <p className="mt-2 text-sm text-ss-muted">by {book.author}{book.year ? ` · ${book.year}` : ''}</p>

            <div className="mt-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">Plain Reason</div>
              <p className="mt-2 text-[15px] leading-relaxed text-ss-text">{book.reason}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => goSearch(book.searchQuery, book.pillar)} className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2 text-sm font-semibold text-white transition hover:bg-ss-orange-dark">
                <Search size={13} /> Find the Research
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The Research Behind This Book */}
      <section className="container py-10">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-ss-orange" />
          <h2 className="text-xl font-extrabold text-ss-teal">The Research Behind This Book</h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm text-ss-muted">Auto-searched on SelfScience with the query “{book.searchQuery}”.</p>

        {researchLoading && (
          <div className="animate-pulse rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <div className="h-4 w-32 rounded-full bg-ss-border-warm" />
            <div className="mt-3 h-5 w-3/4 rounded bg-ss-border-warm" />
          </div>
        )}

        {!researchLoading && research?.results?.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {research.results.slice(0, 5).map((item) => <ResultCard key={item.id} item={item} />)}
          </div>
        )}

        {!researchLoading && (!research || research.results?.length === 0) && (
          <div className="rounded-lg border border-ss-border-warm bg-white p-6 text-sm text-ss-muted">No related studies surfaced. Try a broader query.</div>
        )}
      </section>

      {/* Reliability Note */}
      <section className="container pb-10">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5" style={{ borderLeft: '4px solid #2E7D32' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-ss-green" />
            <h2 className="text-lg font-extrabold text-ss-teal">Reliability Note</h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-ss-text">
            The core ideas of “{book.title}” are broadly supported by the peer-reviewed literature returned above. As with any popular-science book, individual claims should be checked against primary sources. Use the reliability meters on the studies here to gauge which parts of the book’s argument rest on stronger evidence and which are still emerging.
          </p>
        </div>
      </section>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <section className="container pb-14">
          <h2 className="mb-6 text-xl font-extrabold text-ss-teal">Related Books</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {relatedBooks.map((b) => (
              <a key={b.slug} href={`/reading-list/${b.slug}`} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                <div className="aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-black/5">
                  <PlaceholderCover book={b} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ss-teal leading-tight">{b.title}</div>
                  <div className="mt-0.5 text-xs text-ss-muted">by {b.author}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal">Read <ArrowRight size={11} /></div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="bg-[#0F2C30] py-8 text-white/70">
        <div className="container flex flex-col items-start justify-between gap-4 text-xs md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} SelfScience. Educational only. Not medical advice.</div>
          <nav className="flex gap-5">
            <a href="/about">About</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/reading-list">Reading List</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
