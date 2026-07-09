'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, ArrowRight } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { BOOKS } from '@/app/page'

export const dynamic = 'force-dynamic'

// Extra placeholder books to make the page feel populated.
const EXTRA_BOOKS = [
  { id: 'inheritance', title: 'Inheritance', subtitle: 'How Our Genes Change Our Lives', author: 'Sharon Moalem, MD', pillar: 'Genomics',        coverFrom: '#123539', coverTo: '#1B474D', searchQuery: 'epigenetics gene expression environment' },
  { id: 'mindchange',  title: 'The Mind Illuminated', subtitle: 'A Complete Meditation Guide', author: 'John Yates, PhD', pillar: 'Mental Health & Neurochemistry', coverFrom: '#6B1B4F', coverTo: '#A12C7B', searchQuery: 'meditation prefrontal cortex attention' },
  { id: 'lifespan',    title: 'Lifespan', subtitle: 'Why We Age — and Why We Don\u2019t Have To', author: 'David A. Sinclair', pillar: 'Longevity', coverFrom: '#1B474D', coverTo: '#006494', searchQuery: 'sirtuins NAD+ epigenetic aging' },
  { id: 'diet-myth',   title: 'The Diet Myth', subtitle: 'The Real Science Behind What We Eat', author: 'Tim Spector',        pillar: 'Nutrition', coverFrom: '#2E7D32', coverTo: '#1B4A1F', searchQuery: 'gut microbiome dietary patterns metabolic health' },
  { id: 'hormonal',    title: 'Hormonal', subtitle: 'The Hidden Intelligence of Hormones', author: 'Martie Haselton',       pillar: 'Hormones & Endocrine Health',   coverFrom: '#C45820', coverTo: '#8B3E15', searchQuery: 'estrogen cycle behavior mood' },
  { id: 'genes-book',  title: 'The Gene', subtitle: 'An Intimate History', author: 'Siddhartha Mukherjee',                    pillar: 'Genomics', coverFrom: '#006494', coverTo: '#123539', searchQuery: 'genetic history molecular biology inheritance' },
]

const ALL_BOOKS = [...BOOKS, ...EXTRA_BOOKS]

export default function ReadingListPage() {
  const router = useRouter()
  const onSearch = (q, pillar) => {
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (pillar) usp.set('pillar', pillar)
    router.push(`/search?${usp.toString()}`)
  }

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      <section className="relative bg-ss-teal pb-16 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <BookOpen size={13} /> Reading List
            </div>
            <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">
              The SelfScience Reading List
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/80 md:text-lg">
              Books that connect to the research. Every recommendation links to the underlying literature you can search on SelfScience.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_BOOKS.map((book) => (
            <article key={book.id} className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 md:flex-row md:gap-5">
              <div
                className="relative flex aspect-[2/3] w-full shrink-0 flex-col justify-between overflow-hidden rounded-md p-3 text-white shadow-inner md:w-32"
                style={{ background: `linear-gradient(140deg, ${book.coverFrom} 0%, ${book.coverTo} 100%)` }}
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-black/25" />
                <div className="text-[8px] font-semibold uppercase tracking-[0.15em] opacity-70">
                  SelfScience
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight">{book.title}</div>
                  <div className="mt-1 text-[8px] font-medium uppercase tracking-widest opacity-80">
                    {book.author}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex min-w-0 flex-col md:mt-0">
                <div className="text-sm font-bold text-ss-teal">{book.title}</div>
                {book.subtitle ? <div className="text-xs italic text-ss-muted">{book.subtitle}</div> : null}
                <div className="mt-0.5 text-xs text-ss-muted">by {book.author}</div>
                <span className="mt-2 inline-flex w-fit rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-teal">
                  {book.pillar}
                </span>
                <button
                  onClick={() => onSearch(book.searchQuery, book.pillar)}
                  className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-ss-orange px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-ss-orange-dark"
                >
                  Find the Research <ArrowRight size={12} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs italic text-ss-muted">
          Editorial reading-list content will be backed by Supabase once you provide project keys.
        </p>
      </section>

      <footer className="bg-[#0F2C30] py-8 text-white/70">
        <div className="container flex flex-col items-start justify-between gap-4 text-xs md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} SelfScience. Educational only. Not medical advice.</div>
          <nav className="flex gap-5">
            <a href="/about">About</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
