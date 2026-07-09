'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowRight, Search } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { PILLARS } from '@/components/site-nav'

export const dynamic = 'force-dynamic'

// Combined book catalog (would come from Supabase once keys are provided).
export const READING_LIST = [
  { slug: 'outlive',        title: 'Outlive',                subtitle: 'The Science and Art of Longevity', author: 'Peter Attia, MD',     pillar: 'Longevity',                       year: 2023, reason: 'A cardiologist\u2019s framework for extending healthspan grounded in metabolic health, exercise, sleep, and emotional wellbeing. Strong on training and nutrition; more speculative on frontier interventions.', searchQuery: 'healthspan biomarkers Zone 2 training longevity' },
  { slug: 'genome-odyssey', title: 'The Genome Odyssey',     subtitle: 'Medical Mysteries and the Quest to Solve Them', author: 'Euan Angus Ashley', pillar: 'Genomics',                     year: 2021, reason: 'A geneticist\u2019s inside view of clinical genome sequencing \u2014 what it can and cannot tell you today.', searchQuery: 'whole genome sequencing rare disease diagnosis' },
  { slug: 'why-we-sleep',   title: 'Why We Sleep',           subtitle: 'Unlocking the Power of Sleep and Dreams', author: 'Matthew Walker, PhD', pillar: 'General Wellness',                year: 2017, reason: 'Sleep\u2019s role in cognition, immune function, and long-term brain health. Some individual claims have been criticized; the broader case for sleep quality is well supported.', searchQuery: 'sleep deprivation cognition memory consolidation' },
  { slug: 'comfort-crisis', title: 'The Comfort Crisis',     subtitle: 'Embrace Discomfort to Reclaim Your Wild, Happy, Healthy Self', author: 'Michael Easter', pillar: 'Sports Performance',           year: 2021, reason: 'Argues that modern comfort undermines resilience \u2014 backed by research on VO2 max, physical stress, and cognitive resilience.', searchQuery: 'physical activity resilience VO2 max longevity' },
  { slug: 'inheritance',    title: 'Inheritance',            subtitle: 'How Our Genes Change Our Lives', author: 'Sharon Moalem, MD',   pillar: 'Genomics',                        year: 2014, reason: 'Accessible primer on how gene expression is shaped by environment and behavior.', searchQuery: 'epigenetics gene expression environment' },
  { slug: 'lifespan',       title: 'Lifespan',               subtitle: 'Why We Age \u2014 and Why We Don\u2019t Have To', author: 'David A. Sinclair', pillar: 'Longevity',                   year: 2019, reason: 'Bold theory of aging as an information problem. The mechanism claims are contested; the underlying biology is worth understanding.', searchQuery: 'sirtuins NAD+ epigenetic aging' },
  { slug: 'diet-myth',      title: 'The Diet Myth',          subtitle: 'The Real Science Behind What We Eat', author: 'Tim Spector',        pillar: 'Nutrition',                       year: 2015, reason: 'Introduces gut-microbiome-based thinking about nutrition with citations to peer-reviewed studies.', searchQuery: 'gut microbiome dietary patterns metabolic health' },
  { slug: 'hormonal',       title: 'Hormonal',               subtitle: 'The Hidden Intelligence of Hormones', author: 'Martie Haselton',    pillar: 'Hormones & Endocrine Health',     year: 2018, reason: 'Reviews research on menstrual-cycle-linked mood and behavior.', searchQuery: 'estrogen cycle behavior mood' },
  { slug: 'the-gene',       title: 'The Gene',               subtitle: 'An Intimate History', author: 'Siddhartha Mukherjee', pillar: 'Genomics',                        year: 2016, reason: 'Beautifully written history of genetics from Mendel to CRISPR.', searchQuery: 'genetic history molecular biology inheritance' },
  { slug: 'mind-illuminated', title: 'The Mind Illuminated', subtitle: 'A Complete Meditation Guide', author: 'John Yates, PhD',    pillar: 'Mental Health & Neurochemistry',  year: 2015, reason: 'A neuroscientist\u2019s framework for meditation practice grounded in attention research.', searchQuery: 'meditation prefrontal cortex attention' },
  { slug: 'good-energy',    title: 'Good Energy',            subtitle: 'The Surprising Connection Between Metabolism and Health', author: 'Casey Means, MD',    pillar: 'Nutrition',                       year: 2024, reason: 'Metabolic health as a lens on chronic disease \u2014 strong on continuous glucose monitoring evidence.', searchQuery: 'metabolic health insulin resistance CGM' },
  { slug: 'body-electric',  title: 'The Body Electric',      subtitle: 'How the Digital World Is Reshaping Our Health', author: 'Michael J. Easter', pillar: 'Environmental Sensitivity',       year: 2024, reason: 'Reviews research on screen exposure, light, and modern environmental stressors.', searchQuery: 'blue light circadian rhythm sedentary behavior' },
]

const FILTER_PILLS = ['All', ...PILLARS.map((p) => p.short)]

// Map short pill label back to full pillar name
const SHORT_TO_FULL = Object.fromEntries(PILLARS.map((p) => [p.short, p.name]))

export default function ReadingListPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const [covers, setCovers] = useState({}) // slug -> imageUrl

  // Fetch cover images from Google Books once (parallel)
  useEffect(() => {
    let alive = true
    Promise.all(
      READING_LIST.map(async (book) => {
        try {
          const q = encodeURIComponent(`intitle:${book.title} inauthor:${book.author}`)
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
          if (!res.ok) return [book.slug, null]
          const data = await res.json()
          const url = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
          return [book.slug, url ? url.replace(/^http:/, 'https:') : null]
        } catch {
          return [book.slug, null]
        }
      })
    ).then((pairs) => {
      if (!alive) return
      setCovers(Object.fromEntries(pairs))
    })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'All') return READING_LIST
    const fullPillar = SHORT_TO_FULL[filter] || filter
    return READING_LIST.filter((b) => b.pillar === fullPillar)
  }, [filter])

  const goSearch = (q, pillar) => {
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (pillar) usp.set('pillar', pillar)
    router.push(`/search?${usp.toString()}`)
  }

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      <section className="relative bg-ss-teal pb-14 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <BookOpen size={13} /> Reading List
            </div>
            <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">The SelfScience Reading List</h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/80 md:text-lg">
              Books that connect to the research. Every recommendation includes the peer-reviewed studies behind the ideas — and an honest note on where the evidence is strong and where it is still emerging.
            </p>
          </div>
        </div>
      </section>

      {/* Filter pills */}
      <section className="border-b border-ss-border-warm bg-white sticky top-0 z-10">
        <div className="container flex flex-wrap items-center gap-2 py-4">
          {FILTER_PILLS.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === p
                  ? 'border-ss-orange bg-ss-orange text-white'
                  : 'border-ss-border-warm bg-white text-ss-muted hover:border-ss-teal hover:text-ss-teal'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section className="container py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <article key={book.slug} className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
              <div className="flex gap-4">
                <div className="aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-md ring-1 ring-black/5">
                  {covers[book.slug] ? (
                    <img src={covers[book.slug]} alt={book.title} className="h-full w-full object-cover" />
                  ) : (
                    <PlaceholderCover book={book} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-ss-teal leading-tight">{book.title}</div>
                  {book.subtitle && <div className="text-[11px] italic text-ss-muted">{book.subtitle}</div>}
                  <div className="mt-0.5 text-xs text-ss-muted">by {book.author}</div>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-teal">
                    {book.pillar}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm text-ss-text/90 leading-relaxed">{book.reason}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <button
                  onClick={() => goSearch(book.searchQuery, book.pillar)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-ss-orange px-3 py-2 text-xs font-semibold text-white transition hover:bg-ss-orange-dark"
                >
                  <Search size={12} /> Find the Research
                </button>
                <a
                  href={`/reading-list/${book.slug}`}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border-2 border-ss-teal px-3 py-2 text-xs font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
                >
                  Read More <ArrowRight size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-lg border border-ss-border-warm bg-white p-6 text-center text-sm text-ss-muted">
            No books in this pillar yet.
          </div>
        )}
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

export function PlaceholderCover({ book }) {
  return (
    <div
      className="flex h-full w-full flex-col justify-between p-2 text-white"
      style={{ background: `linear-gradient(140deg, ${book.coverFrom || '#1B474D'} 0%, ${book.coverTo || '#123539'} 100%)` }}
    >
      <div className="text-[7px] font-semibold uppercase tracking-[0.15em] opacity-70">SelfScience</div>
      <div>
        <div className="text-[10px] font-bold leading-tight">{book.title}</div>
        <div className="mt-0.5 text-[7px] font-medium uppercase tracking-widest opacity-80">{book.author}</div>
      </div>
    </div>
  )
}
