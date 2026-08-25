'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Upload,
  Lock,
  Dna,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import SiteNav, { PILLARS } from '@/components/site-nav'
import StartHereBanner from '@/components/StartHereBanner'
import WelcomeBackStrip from '@/components/WelcomeBackStrip'
import HomePillarGrid from '@/components/HomePillarGrid'
import HomeStepsExplainer from '@/components/HomeStepsExplainer'
import { ResultCard } from '@/components/result-card'
import { EditorialFeatured } from '@/components/editorial-featured'
import { trackEvent, EVENTS } from '@/lib/analytics'
import { hasGenomeResults, getGenomeResults } from '@/lib/genomeSession'
import Dashboard from '@/components/Dashboard'
import FirstLook from '@/components/FirstLook'
import { useTierState, initTierStateIfNew } from '@/lib/tierState'
import DiscoverFeed from '@/components/dashboard/DiscoverFeed'

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
  'Development',
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
  'Development': 'Developmental & Lifespan Wellness',
}

/* --------------------------------- Page ------------------------------------ */

/**
 * Root of the homepage. Decides whether to render the personalized
 * Dashboard (once genome results are in sessionStorage) or the general
 * Discover marketing home. Renders a small "My Dashboard / Discover"
 * toggle at the top of the page but only when genome results exist.
 *
 * The sessionStorage check is deferred to a useEffect so we don't cause
 * hydration mismatches (window doesn't exist during server render).
 */
function App() {
  const [hasGenome, setHasGenome] = useState(false)
  const [view, setView] = useState('discover') // 'dashboard' | 'discover'

  useEffect(() => {
    const check = () => {
      const has = hasGenomeResults()
      setHasGenome(has)
      if (has) setView('dashboard') // Default to dashboard when genome data exists
    }
    check()
    window.addEventListener('selfscience:genome-changed', check)
    // Also refresh when the tab regains focus (in case genome was uploaded
    // in another tab).
    window.addEventListener('focus', check)
    return () => {
      window.removeEventListener('selfscience:genome-changed', check)
      window.removeEventListener('focus', check)
    }
  }, [])

  return (
    <>
      {/* View toggle — only shown when genome data exists. Positioned below
          the SiteNav bar (top-20) so it never overlaps the center nav links,
          and z-30 keeps it BELOW the SiteNav dropdowns (z-50) so an open
          Pillars/Tools/About menu properly covers the toggle instead of the
          toggle blocking the menu's top entries. */}
      {hasGenome && (
        <div className="fixed left-1/2 top-20 z-30 -translate-x-1/2 md:top-[76px]">
          <div className="flex items-center gap-1 rounded-full border border-ss-border-warm bg-white/95 p-1 shadow-md backdrop-blur">
            <button
              onClick={() => setView('dashboard')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                view === 'dashboard'
                  ? 'bg-ss-teal text-white'
                  : 'text-ss-muted hover:text-ss-teal'
              }`}
            >
              My Dashboard
            </button>
            <button
              onClick={() => setView('discover')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                view === 'discover'
                  ? 'bg-ss-teal text-white'
                  : 'text-ss-muted hover:text-ss-teal'
              }`}
            >
              Discover
            </button>
          </div>
        </div>
      )}

      {hasGenome && view === 'dashboard' && <DashboardOrFirstLook />}
      {hasGenome && view === 'discover' && <DiscoverFeed />}
      {!hasGenome && <DiscoverHome />}
    </>
  )
}

/**
 * Tier-gated Dashboard renderer. Tier 1 users see the FirstLook pager
 * that walks them through their key findings one at a time. Tier 2
 * users see the existing full Dashboard unchanged.
 */
function DashboardOrFirstLook() {
  const tier = useTierState()
  const [findings, setFindings] = useState([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    try {
      const r = getGenomeResults()
      if (!r) { setLoaded(true); return }
      const key = []
      if (r.classified?.aware)    key.push(...r.classified.aware)
      if (r.classified?.strength) key.push(...r.classified.strength)
      if (key.length === 0 && Array.isArray(r.findings)) key.push(...r.findings)
      const capped = key.slice(0, 8)
      setFindings(capped)
      // Initialize tier state IMMEDIATELY so the nav + gate know the
      // user has just landed post-upload. Without this the parent
      // would render <Dashboard /> for a beat before FirstLook takes
      // over, defeating the whole one-at-a-time UX.
      if (capped.length > 0) initTierStateIfNew(capped.length)
      setLoaded(true)
    } catch { setLoaded(true) }
  }, [])
  // While we’re still resolving findings on the client, render nothing
  // (no Dashboard flash). Server-render outputs an empty shell too.
  if (!loaded) return null
  if (tier.tier >= 2) return <Dashboard />
  if (findings.length === 0) return <Dashboard />
  return <FirstLook findings={findings} />
}

/**
 * The existing marketing / discovery homepage — unchanged content,
 * just renamed from `App` to `DiscoverHome` so `App` can wrap it with
 * the Dashboard toggle logic.
 */
function DiscoverHome() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activePill, setActivePill] = useState(null)

  // Hero quiz CTA — three copy variants, deterministically assigned
  // per-visitor via localStorage so the user sees the same wording on
  // return visits. Track impressions/clicks via the existing analytics
  // pipeline so we can compare CTRs later.
  const [quizVariant, setQuizVariant] = useState(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      let v = window.localStorage.getItem('ss_hero_quiz_cta_variant')
      if (!v || !['a', 'b', 'c'].includes(v)) {
        v = ['a', 'b', 'c'][Math.floor(Math.random() * 3)]
        window.localStorage.setItem('ss_hero_quiz_cta_variant', v)
      }
      setQuizVariant(v)
      // Fire an impression event so the funnel dashboard can count
      // how often each variant was actually shown.
      try {
        trackEvent(EVENTS.CTA_IMPRESSION || 'cta_impression', {
          location: 'homepage-hero',
          cta: 'quiz_secondary',
          variant: v,
        })
      } catch {}
      // Also POST to /api/cta-track so the /admin/hero-cta dashboard
      // has aggregated counts even without GA4 configured.
      try {
        fetch('/api/cta-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: 'homepage-hero', cta: 'quiz_secondary', variant: v, kind: 'impression' }),
          keepalive: true,
        }).catch(() => {})
      } catch {}
    } catch {}
  }, [])
  const QUIZ_COPY = {
    a: 'Not ready to upload DNA? Take the 2-minute quiz →',
    b: 'Don’t have DNA data yet? Take the 2-minute quiz →',
    c: 'Skip DNA — take the quiz →',
  }

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
    const userQ = query.trim()
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      source: userQ ? 'homepage_pill_with_query' : 'homepage_pill_browse',
      has_pillar: true,
    })
    const usp = new URLSearchParams()
    if (userQ) usp.set('q', userQ)
    usp.set('pillar', pillar)
    router.push(`/search?${usp.toString()}`)
  }

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* ============================= HERO ============================= */}
      <section className="relative flex min-h-[70vh] flex-col justify-center overflow-hidden bg-ss-teal text-white">
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
            Your DNA.<br className="hidden sm:block" /> Finally explained in plain English.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Upload your 23andMe or AncestryDNA file and discover what your genes actually mean for your health.
          </p>

          {/* Primary CTA — one dominant action. Full-width on mobile, auto on desktop. */}
          <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3 md:max-w-none md:flex-row md:justify-center md:gap-4">
            <a
              href="/genome"
              aria-label="Start Here — Upload Your File"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ss-orange px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-ss-orange-dark md:w-auto"
            >
              <Upload size={18} /> Start Here — Upload Your File
            </a>
          </div>
          {/* Secondary CTA — surfaces the non-genetic onboarding path
              for visitors without a DNA file. Visually lower-emphasis
              (text link, not a button) so the DNA upload remains the
              dominant action. Copy is A/B-assigned per visitor via
              ss_hero_quiz_cta_variant — impressions + clicks fire
              through the analytics pipeline so we can compare CTRs. */}
          <a
            href="/onboarding/quiz"
            onClick={() => {
              try {
                trackEvent(EVENTS.CTA_CLICKED || 'cta_clicked', {
                  location: 'homepage-hero',
                  cta: 'quiz_secondary',
                  variant: quizVariant || 'a',
                })
              } catch {}
              try {
                fetch('/api/cta-track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ location: 'homepage-hero', cta: 'quiz_secondary', variant: quizVariant || 'a', kind: 'click' }),
                  keepalive: true,
                }).catch(() => {})
              } catch {}
            }}
            data-cta-variant={quizVariant || 'a'}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 underline decoration-white/40 underline-offset-4 hover:text-white hover:decoration-white"
          >
            {QUIZ_COPY[quizVariant] || QUIZ_COPY.a}
          </a>
          <a
            href="#genome-upload"
            className="mt-2 text-xs text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            Don&apos;t have a file yet? See which test to get →
          </a>

          {/* Orientation pill — low-emphasis link to /how-it-works for
              first-time visitors who need to understand what this site
              is and who it's for BEFORE they upload anything. Kept
              smaller than the primary CTA so it doesn't compete. */}
          <a
            href="/how-it-works"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition hover:border-white/50 hover:bg-white/10"
          >
            <Sparkles size={12} className="text-ss-orange" /> New here? Take a 2-minute tour →
          </a>

          {/* Phase 4 UX (issue #3) — reframe the DNA upload as OPTIONAL
              personalisation, not a gate. Anyone can explore any pillar
              without ever uploading a file. */}
          <p className="mt-3 max-w-md text-center text-[11px] leading-relaxed text-white/60">
            Uploading a DNA file is <span className="font-semibold text-white/85">optional</span> &mdash; it only
            personalises what you see inside a pillar. You can{' '}
            <a href="/pillars" className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white">
              explore any pillar first
            </a>{' '}
            and bring data later.
          </p>

          {/* Secondary — small search link for returning visitors. Visually
              de-emphasized so it doesn't compete with the primary CTA. */}
          <form onSubmit={handleSubmit} className="mt-14 hidden w-full max-w-2xl md:block">
            <div className="flex items-center overflow-hidden rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
              <Search className="ml-4 shrink-0 text-white/70" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Already know what you're looking for? Search the research…"
                className="w-full bg-transparent px-3 py-3 text-sm placeholder:text-white/60 focus:outline-none"
              />
              <button
                type="submit"
                className="m-1 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/25"
              >
                Search
              </button>
            </div>
          </form>
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

      {/* Welcome-back strip — inline quick-jump tabs. Only renders
          for returning visitors (has ss_onboarded, ss_mode,
          ss_tier_state, or a live genome session). New visitors see
          nothing here and continue to HomeStepsExplainer below. */}
      <WelcomeBackStrip />

      {/* Phase 4 UX (issue #3) — pillar-first entry point. Persistent
          for every visitor: promotes the 10 canonical pillars to a
          top-level card set so users can pick a lens BEFORE thinking
          about data. Links to /pillars for the full explainer and
          /search?pillar=X for the pre-filtered research feed. */}
      <HomePillarGrid />

      {/* 3-step explainer strip (Phase A · Part 1) — placed directly under
          the hero so first-time visitors see WHY / WHAT / HOW immediately. */}
      <HomeStepsExplainer />

      {/* Phase 2 UX (issue #2) — the following sections previously
          lived on the homepage but were moved to reduce density:
            • StartHereBanner              → /get-started
            • Genome-upload deep-dive card  → /get-started
            • Featured Research carousel   → /search  (and /reading-list)
            • Ten Pillars grid             → /pillars
            • Reading List carousel        → /reading-list
            • Mission blockquote band      → /about
          Only a slim "prefer books?" text link + a one-line
          disclaimer are kept on / to preserve discoverability
          without adding visual noise. */}
      <section className="bg-ss-bg py-10">
        <div className="container flex flex-col items-center gap-2 text-center">
          <a href="/reading-list" className="text-sm font-semibold text-ss-teal underline decoration-ss-teal/40 underline-offset-4 hover:decoration-ss-teal">
            Prefer books? Visit the SelfScience Reading List &rarr;
          </a>
          <p className="text-xs text-ss-muted">
            For educational purposes only. Not medical advice or diagnosis. <a href="/about" className="underline decoration-dotted underline-offset-4 hover:text-ss-text">Read our mission &rarr;</a>
          </p>
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
