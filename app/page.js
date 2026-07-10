'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Upload,
  Lock,
  Dna,
  ArrowRight,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import SiteNav, { PILLARS } from '@/components/site-nav'
import { ResultCard } from '@/components/result-card'
import { trackEvent, EVENTS } from '@/lib/analytics'

/* -------------------------------- Sample data ------------------------------ */

const FEATURED = [
  {
    id: 'f1',
    provider: 'PubMed',
    source: 'peer-reviewed',
    year: 2024,
    title: 'Time-restricted eating and metabolic markers in adults with prediabetes',
    journal: 'Cell Metabolism',
    authorsShort: 'Chen L, Patel A, et al.',
    reliability: 4,
    reliabilityLabel: 'Strong',
    reliabilityNote: 'Randomized controlled trial, n=180, 12-week follow-up.',
    flags: [],
    plain:
      'Eating within an 8-hour window improved fasting glucose and insulin sensitivity compared to unrestricted eating in this 12-week trial.',
    abstract:
      'This 12-week randomized controlled trial of 180 adults with prediabetes compared time-restricted eating (8-hour window) to unrestricted eating. Time-restricted eating produced statistically significant improvements in fasting glucose (-7.4 mg/dL) and HOMA-IR (-0.6), with no difference in weight loss between arms.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'f2',
    provider: 'PubMed',
    source: 'peer-reviewed',
    year: 2023,
    title: 'MTHFR C677T variant and folate metabolism: implications for supplementation',
    journal: 'American Journal of Clinical Nutrition',
    authorsShort: 'Nguyen T, et al.',
    reliability: 3,
    reliabilityLabel: 'Moderate',
    reliabilityNote: 'Meta-analysis of 22 observational studies.',
    flags: [{ label: 'Small Study', tone: 'amber' }],
    plain:
      'People with two copies of the MTHFR C677T variant convert folic acid less efficiently. Methylfolate may be a better form for this group.',
    abstract:
      'Meta-analysis of 22 studies (n=14,320) examined the MTHFR C677T polymorphism and folate metabolism. Homozygous TT carriers demonstrated 30–50% reduced enzyme activity, supporting methylfolate over folic acid in this subgroup.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'f3',
    provider: 'Semantic Scholar',
    source: 'preprint',
    year: 2025,
    title: 'Resistance training frequency and long-term muscle retention after 60',
    journal: 'bioRxiv',
    authorsShort: 'Alvarez R, et al.',
    reliability: 2,
    reliabilityLabel: 'Limited',
    reliabilityNote: 'Preprint, awaiting peer review.',
    flags: [{ label: 'Not Yet Peer Reviewed', tone: 'amber' }],
    plain:
      'Two full-body sessions per week appeared sufficient to maintain lean mass in older adults over a 24-month period.',
    abstract:
      'Prospective cohort of 240 adults aged 60–78 tracked over 24 months. Two full-body resistance sessions/week were associated with preserved lean mass (DXA) versus a control group, with no additional benefit at 3+ sessions/week in this population.',
    url: 'https://www.biorxiv.org/',
  },
  {
    id: 'f4',
    provider: 'PubMed',
    source: 'peer-reviewed',
    year: 2024,
    title: 'Rapamycin, mTOR inhibition, and healthspan: current evidence in humans',
    journal: 'Nature Aging',
    authorsShort: 'Kim H, et al.',
    reliability: 3,
    reliabilityLabel: 'Moderate',
    reliabilityNote: 'Narrative review with mechanistic emphasis.',
    flags: [{ label: 'Industry Funded', tone: 'amber' }],
    plain:
      'Human data remains early. Animal evidence is strong but translation to human longevity outcomes has not yet been demonstrated.',
    abstract:
      'This narrative review synthesizes preclinical and early human data on rapamycin and mTOR inhibition. Animal models consistently show lifespan extension, but human evidence remains limited to biomarker studies with short follow-up.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'f5',
    provider: 'SelfScience',
    source: 'editorial',
    year: 2025,
    title: 'Understanding APOE genotypes: what your Alzheimer’s risk really means',
    journal: 'SelfScience Editorial',
    authorsShort: 'SelfScience Editors',
    reliability: 4,
    reliabilityLabel: 'Strong',
    reliabilityNote: 'Curated summary of consensus literature.',
    flags: [],
    plain:
      'APOE4 raises statistical risk but is not deterministic. Lifestyle, sleep, and cardiovascular health strongly modify outcomes.',
    abstract:
      'This editorial reviews the current literature on APOE variants and Alzheimer’s risk, emphasizing the interplay of genetics with modifiable lifestyle factors including sleep, exercise, and cardiovascular health.',
    url: '/articles/apoe-explained',
  },
]

export const BOOKS = [
  {
    id: 'outlive',
    title: 'Outlive',
    subtitle: 'The Science and Art of Longevity',
    author: 'Peter Attia, MD',
    pillar: 'Longevity',
    coverFrom: '#006494',
    coverTo: '#1B474D',
    searchQuery: 'healthspan biomarkers Peter Attia longevity',
  },
  {
    id: 'genome-odyssey',
    title: 'The Genome Odyssey',
    subtitle: 'Medical Mysteries and the Quest to Solve Them',
    author: 'Euan Angus Ashley',
    pillar: 'Genomics',
    coverFrom: '#1B474D',
    coverTo: '#123539',
    searchQuery: 'whole genome sequencing rare disease diagnosis',
  },
  {
    id: 'why-we-sleep',
    title: 'Why We Sleep',
    subtitle: 'Unlocking the Power of Sleep and Dreams',
    author: 'Matthew Walker, PhD',
    pillar: 'General Wellness',
    coverFrom: '#A12C7B',
    coverTo: '#6B1B4F',
    searchQuery: 'sleep deprivation cognition memory consolidation',
  },
  {
    id: 'comfort-crisis',
    title: 'The Comfort Crisis',
    subtitle: 'Embrace Discomfort to Reclaim Your Wild, Happy, Healthy Self',
    author: 'Michael Easter',
    pillar: 'Sports Performance',
    coverFrom: '#C45820',
    coverTo: '#8B3E15',
    searchQuery: 'physical activity resilience VO2 max longevity',
  },
]

const CATEGORY_PILLS = [
  'Genomics',
  'Nutrition',
  'Performance',
  'Longevity',
  'Wellness',
  'Pharmacogenomics',
  'Mental Health',
  'Environment',
  'Hormones',
]

// Map pill short-label to full pillar name (for URL param)
const PILL_TO_PILLAR = {
  'Genomics': 'Genomics',
  'Nutrition': 'Nutrition',
  'Performance': 'Sports Performance',
  'Longevity': 'Longevity',
  'Wellness': 'General Wellness',
  'Pharmacogenomics': 'Pharmacogenomics',
  'Mental Health': 'Mental Health & Neurochemistry',
  'Environment': 'Environmental Sensitivity',
  'Hormones': 'Hormones & Endocrine Health',
}

/* --------------------------------- Page ------------------------------------ */

function App() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activePill, setActivePill] = useState(null)

  const goSearch = (q, pillar) => {
    const term = (q ?? query).trim()
    if (!term) return
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      source: 'homepage',
      has_pillar: !!pillar,
    })
    const usp = new URLSearchParams()
    usp.set('q', term)
    if (pillar) usp.set('pillar', pillar)
    router.push(`/search?${usp.toString()}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    goSearch()
  }

  const handlePill = (pillLabel) => {
    setActivePill(pillLabel)
    const pillar = PILL_TO_PILLAR[pillLabel] || pillLabel
    goSearch(query.trim() || pillar, pillar)
  }

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* ============================= HERO ============================= */}
      <section className="relative flex min-h-[100vh] flex-col justify-center overflow-hidden bg-ss-teal text-white">
        <SiteNav variant="dark" />

        {/* Horizontal DNA image band */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full md:w-[72%]"
          aria-hidden="true"
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1633167606207-d840b5070fc2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxETkElMjBhYnN0cmFjdHxlbnwwfHx8fDE3ODM2MjA0NDV8MA&ixlib=rb-4.1.0&q=85')",
              opacity: 0.85,
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 28%, black 82%, transparent 100%)',
              maskImage:
                'linear-gradient(to right, transparent 0%, black 28%, black 82%, transparent 100%)',
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(27,71,77,0.98) 0%, rgba(27,71,77,0.70) 32%, rgba(27,71,77,0.35) 55%, rgba(27,71,77,0.55) 85%, rgba(27,71,77,0.95) 100%)',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
          style={{
            background:
              'radial-gradient(45% 55% at 70% 45%, rgba(196,88,32,0.35) 0%, rgba(27,71,77,0) 70%)',
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24"
          style={{ background: 'linear-gradient(to bottom, rgba(27,71,77,0) 0%, rgba(27,71,77,1) 100%)' }}
        />

        <div className="container relative z-10 flex flex-col items-center pt-24 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Search the science.<br className="hidden sm:block" /> Understand your biology.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            AI-scored research across nine health pillars. Personalized by your own genome, if you choose.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="mt-10 w-full max-w-3xl">
            <div className="flex items-center overflow-hidden rounded-full bg-white text-ss-text shadow-lg ring-1 ring-black/5">
              <Search className="ml-5 shrink-0 text-ss-muted" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a topic, gene, molecule, or study…  e.g. MTHFR, zone 2 training, rapamycin"
                className="w-full bg-transparent px-4 py-4 text-base placeholder:text-ss-muted focus:outline-none md:py-5 md:text-lg"
              />
              <button
                type="submit"
                className="m-1.5 rounded-full bg-ss-orange px-6 py-3 text-sm font-semibold text-white transition hover:bg-ss-orange-dark"
              >
                Search
              </button>
            </div>
            <p className="mt-3 text-xs text-white/60">
              Sources: PubMed · Semantic Scholar · OpenAlex · Crossref · SelfScience Editorial. Every result gets an AI reliability score.
            </p>
          </form>

          {/* 9 category pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_PILLS.map((p) => (
              <button
                key={p}
                onClick={() => handlePill(p)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  activePill === p
                    ? 'border-ss-orange bg-ss-orange text-white'
                    : 'border-white/25 bg-white/5 text-white/90 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="container relative z-10 mt-16 flex justify-center pb-10">
          <a
            href="#genome-upload"
            className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            Explore ↓
          </a>
        </div>
      </section>

      {/* ======================= GENOME UPLOAD CARD ====================== */}
      <section id="genome-upload" className="bg-white py-20">
        <div className="container">
          <div
            className="grid grid-cols-1 gap-8 rounded-2xl bg-ss-surface p-6 shadow-sm ring-1 ring-black/5 md:grid-cols-5 md:gap-10 md:p-10"
            style={{ borderLeft: '4px solid #1B474D' }}
          >
            <div className="md:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-ss-privacy-tint px-3 py-1 text-xs font-semibold text-ss-teal">
                <Dna size={14} /> Personalized · Optional
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-ss-teal md:text-4xl">
                Your Genome. Your Research Starting Point.
              </h2>
              <p className="mt-4 max-w-xl text-ss-text">
                Upload your raw DNA data file from 23andMe, AncestryDNA, or a whole genome service. Get a personalized research roadmap built around your specific genetic variants — processed entirely in your browser, never stored.
              </p>
              <div className="mt-5 flex items-start gap-2 text-sm text-ss-muted">
                <Lock size={16} className="mt-0.5 shrink-0 text-ss-teal" />
                <span>
                  <b className="text-ss-teal">Your file never leaves your device.</b> No storage. No exposure.
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="/genome"
                  className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark"
                >
                  <Upload size={16} /> Upload Your Genome File
                </a>
                <span className="text-xs text-ss-muted">
                  Formats: <b>.txt</b> · <b>.zip</b> · <b>.vcf</b>
                </span>
              </div>
              <div className="mt-3 text-xs text-ss-muted">
                Supported: 23andMe · AncestryDNA · MyHeritage
              </div>
            </div>

            {/* Right side illustration */}
            <div className="relative hidden md:col-span-2 md:block">
              <GenomeFlowIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ======================= FEATURED RESEARCH ======================= */}
      <section className="bg-ss-bg py-20">
        <div className="container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
                Featured Research
              </div>
              <h2 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
                Start Exploring
              </h2>
              <p className="mt-2 max-w-xl text-ss-muted">
                Editor-curated studies across the nine pillars, each with an AI reliability score and plain-language summary.
              </p>
            </div>
            <a
              href="/search?q=longevity"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-ss-teal hover:underline md:inline-flex"
            >
              Browse all <ArrowRight size={14} />
            </a>
          </div>

          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
            {FEATURED.map((item) => (
              <div key={item.id} className="snap-start">
                <ResultCard item={item} variant="carousel" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ 9 PILLARS ========================== */}
      <section id="pillars" className="bg-white py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              The Nine Pillars
            </div>
            <h2 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Explore by Topic
            </h2>
            <p className="mt-3 text-ss-muted">
              Research grouped into the nine domains that shape human health and performance.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map(({ key, name, Icon, description }) => (
              <div
                key={key}
                className="flex flex-col rounded-xl bg-ss-surface p-6 ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ss-teal">{name}</h3>
                <p className="mt-1.5 text-sm text-ss-muted">{description}</p>
                <a
                  href={`/search?pillar=${encodeURIComponent(name)}`}
                  className="mt-6 inline-flex w-fit items-center gap-1 rounded-full border-2 border-ss-orange px-4 py-1.5 text-xs font-semibold text-ss-orange transition hover:bg-ss-orange hover:text-white"
                >
                  Explore <ArrowRight size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== READING LIST ========================= */}
      <section id="reading-list" className="bg-ss-bg py-20">
        <div className="container">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
                <BookOpen size={14} /> Reading List
              </div>
              <h2 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
                The SelfScience Reading List
              </h2>
              <p className="mt-2 max-w-xl text-ss-muted">
                Books that connect to the research. Curated and annotated.
              </p>
            </div>
            <a
              href="/reading-list"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-ss-teal hover:underline md:inline-flex"
            >
              Browse all <ArrowRight size={14} />
            </a>
          </div>

          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
            {BOOKS.map((book) => (
              <BookCard key={book.id} book={book} onSearch={goSearch} />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href="/reading-list"
              className="inline-flex items-center gap-2 rounded-full border-2 border-ss-teal px-6 py-2.5 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
            >
              <BookOpen size={14} /> Browse All Books
            </a>
          </div>
        </div>
      </section>

      {/* ========================= MISSION STATEMENT ===================== */}
      <section className="bg-ss-teal py-24 text-white">
        <div className="container">
          <blockquote className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 h-1 w-14 rounded-full bg-ss-orange" />
            <p className="text-2xl font-medium leading-relaxed md:text-3xl md:leading-relaxed">
              “Most people have more genetic data than they know what to do with. SelfScience turns that data into a starting point — connecting your genomic profile to the research, resources, and plain-language explanations you need to begin your wellness journey.”
            </p>
            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/60">
              For educational purposes only. Not medical advice or diagnosis.
            </p>
          </blockquote>
        </div>
      </section>

      {/* ============================== FOOTER =========================== */}
      <footer className="bg-[#0F2C30] py-12 text-white/80">
        <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-extrabold text-white">SelfScience</div>
            <p className="mt-1 text-sm text-white/60">
              Search the science. Understand your biology.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm">
            <a href="/about" className="hover:text-white">About</a>
            <a href="/how-it-works" className="hover:text-white">How It Works</a>
            <a href="/reading-list" className="hover:text-white">Reading List</a>
            <a href="/terms" className="hover:text-white">Terms of Use</a>
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
          </nav>
        </div>
        <div className="container mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
          <p>© {new Date().getFullYear()} SelfScience. For educational purposes only. Not medical advice.</p>
        </div>
      </footer>
    </main>
  )
}

/* --------------------------- Book cover component -------------------------- */

function BookCard({ book, onSearch }) {
  return (
    <article className="flex w-[240px] shrink-0 flex-col rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md md:w-[260px]">
      {/* Stylized cover */}
      <div
        className="relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-md p-4 text-white shadow-inner"
        style={{
          background: `linear-gradient(140deg, ${book.coverFrom} 0%, ${book.coverTo} 100%)`,
        }}
      >
        <div className="absolute left-0 top-0 h-full w-1.5 bg-black/25" />
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">
            SelfScience Reading List
          </div>
        </div>
        <div>
          <div className="text-lg font-bold leading-tight md:text-xl">{book.title}</div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-widest opacity-80">
            {book.author}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-sm font-bold text-ss-teal">{book.title}</div>
        <div className="text-xs text-ss-muted">by {book.author}</div>
      </div>
      <span className="mt-2 inline-flex w-fit rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-teal">
        {book.pillar}
      </span>
      <button
        onClick={() => onSearch(book.searchQuery, book.pillar)}
        className="mt-4 inline-flex items-center justify-center gap-1 rounded-full bg-ss-orange px-4 py-2 text-xs font-semibold text-white transition hover:bg-ss-orange-dark"
      >
        Find the Research <ArrowRight size={12} />
      </button>
    </article>
  )
}

/* ------------------- DNA → research flow illustration ---------------------- */

function GenomeFlowIllustration() {
  return (
    <svg viewBox="0 0 320 240" className="h-full w-full" aria-hidden="true">
      {/* DNA helix */}
      <g stroke="#1B474D" strokeWidth="2" fill="none">
        {Array.from({ length: 6 }).map((_, i) => {
          const y = 30 + i * 32
          return (
            <g key={i}>
              <path
                d={`M40 ${y} Q60 ${y - 12}, 80 ${y} T120 ${y}`}
                stroke="#1B474D"
                strokeWidth="2.5"
              />
              <line x1="50" y1={y - 6} x2="50" y2={y + 6} stroke="#C45820" strokeWidth="2" />
              <line x1="90" y1={y - 6} x2="90" y2={y + 6} stroke="#C45820" strokeWidth="2" />
              <line x1="110" y1={y - 6} x2="110" y2={y + 6} stroke="#C45820" strokeWidth="2" />
            </g>
          )
        })}
      </g>
      {/* Arrow */}
      <g stroke="#7A7974" strokeWidth="1.5" fill="none">
        <line x1="140" y1="120" x2="185" y2="120" strokeDasharray="3 3" />
        <path d="M180 114 L190 120 L180 126" />
      </g>
      {/* Research list */}
      <g fill="#1B474D">
        <rect x="205" y="60" width="90" height="120" rx="6" fill="#F9F8F5" stroke="#D4D1CA" />
        <rect x="215" y="75" width="70" height="6" rx="3" fill="#1B474D" />
        <rect x="215" y="90" width="55" height="4" rx="2" fill="#7A7974" />
        <rect x="215" y="100" width="65" height="4" rx="2" fill="#7A7974" />
        <line x1="215" y1="115" x2="285" y2="115" stroke="#D4D1CA" />
        <rect x="215" y="125" width="70" height="6" rx="3" fill="#1B474D" />
        <rect x="215" y="140" width="55" height="4" rx="2" fill="#7A7974" />
        <rect x="215" y="150" width="65" height="4" rx="2" fill="#7A7974" />
      </g>
      {/* Labels */}
      <text x="80" y="220" fill="#7A7974" fontSize="10" textAnchor="middle" fontFamily="Inter">
        Your DNA
      </text>
      <text x="250" y="200" fill="#7A7974" fontSize="10" textAnchor="middle" fontFamily="Inter">
        Research Roadmap
      </text>
    </svg>
  )
}

export default App
