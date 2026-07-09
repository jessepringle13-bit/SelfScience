'use client'

import { useState } from 'react'
import {
  Search,
  Upload,
  Lock,
  Dna,
  Apple,
  Activity,
  Hourglass,
  Heart,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Share2,
  FileDown,
  Bookmark,
} from 'lucide-react'

/* ----------------------------- Small primitives ---------------------------- */

const SignalBars = ({ filled = 3, size = 'md' }) => {
  const heights = size === 'sm' ? [6, 9, 12, 15, 18] : [8, 12, 16, 20, 24]
  return (
    <div className="flex items-end gap-1">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: h, width: size === 'sm' ? 4 : 5 }}
          className={`rounded-sm ${i < filled ? 'bg-ss-teal' : 'bg-ss-border-warm'}`}
        />
      ))}
    </div>
  )
}

const SourceBadge = ({ type }) => {
  const map = {
    'peer-reviewed': { label: 'Peer-Reviewed', color: 'bg-ss-teal' },
    'preprint': { label: 'Preprint', color: 'bg-[#B07D00]' },
    'editorial': { label: 'Editorial', color: 'bg-[#006494]' },
    'blog': { label: 'Blog', color: 'bg-ss-muted' },
  }
  const c = map[type] || map['peer-reviewed']
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ${c.color}`}>
      {c.label}
    </span>
  )
}

const FlagPill = ({ label, tone = 'amber' }) => {
  const bg = tone === 'critical' ? 'bg-ss-critical' : 'bg-ss-amber'
  return (
    <span className={`inline-flex items-center rounded-full ${bg} px-2.5 py-0.5 text-[11px] font-semibold text-white`}>
      {label}
    </span>
  )
}

/* ------------------------------ Result Card -------------------------------- */

const reliabilityLabel = (n) =>
  ['', 'Preliminary', 'Limited', 'Moderate', 'Strong', 'Excellent'][n] || 'Moderate'

const ResultCard = ({ item }) => {
  const borderColor = {
    'peer-reviewed': '#1B474D',
    'preprint': '#B07D00',
    'editorial': '#006494',
    'blog': '#7A7974',
  }[item.source] || '#1B474D'

  return (
    <article
      className="group flex w-[340px] shrink-0 flex-col rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md md:w-[380px]"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between">
        <SourceBadge type={item.source} />
        <span className="text-xs text-ss-muted">{item.year}</span>
      </div>

      <h3 className="mt-3 text-[17px] font-bold leading-snug text-ss-teal group-hover:underline">
        {item.title}
      </h3>
      <p className="mt-1 text-xs text-ss-muted">{item.journal}</p>

      <div className="mt-4 flex items-center gap-3">
        <SignalBars filled={item.reliability} size="sm" />
        <span className="text-sm font-bold text-ss-teal">{reliabilityLabel(item.reliability)}</span>
      </div>
      <p className="mt-1 text-xs italic text-ss-muted">{item.reliabilityNote}</p>

      {item.flags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.flags.map((f) => (
            <FlagPill key={f.label} label={f.label} tone={f.tone} />
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">In Plain Terms:</div>
        <p className="mt-1 text-sm text-ss-text">{item.plain}</p>
      </div>

      <button className="mt-3 self-start text-xs font-semibold text-ss-muted hover:text-ss-teal">
        Full Abstract ▾
      </button>

      <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-ss-muted">
        <button className="inline-flex items-center gap-1 hover:text-ss-teal">
          <ExternalLink size={13} /> View Study
        </button>
        <button className="inline-flex items-center gap-1 hover:text-ss-teal">
          <Share2 size={13} /> Share
        </button>
        <button className="inline-flex items-center gap-1 hover:text-ss-teal">
          <FileDown size={13} /> Export
        </button>
        <button className="inline-flex items-center gap-1 hover:text-ss-teal">
          <Bookmark size={13} /> Save
        </button>
      </div>
    </article>
  )
}

/* -------------------------------- Sample data ------------------------------ */

const FEATURED = [
  {
    id: '1',
    source: 'peer-reviewed',
    year: 2024,
    title: 'Time-restricted eating and metabolic markers in adults with prediabetes',
    journal: 'Cell Metabolism',
    reliability: 4,
    reliabilityNote: 'Randomized controlled trial, n=180, 12-week follow-up.',
    flags: [],
    plain:
      'Eating within an 8-hour window improved fasting glucose and insulin sensitivity compared to unrestricted eating in this 12-week trial.',
  },
  {
    id: '2',
    source: 'peer-reviewed',
    year: 2023,
    title: 'MTHFR C677T variant and folate metabolism: implications for supplementation',
    journal: 'American Journal of Clinical Nutrition',
    reliability: 3,
    reliabilityNote: 'Meta-analysis of 22 observational studies.',
    flags: [{ label: 'Small Study', tone: 'amber' }],
    plain:
      'People with two copies of the MTHFR C677T variant convert folic acid less efficiently. Methylfolate may be a better form for this group.',
  },
  {
    id: '3',
    source: 'preprint',
    year: 2025,
    title: 'Resistance training frequency and long-term muscle retention after 60',
    journal: 'bioRxiv',
    reliability: 2,
    reliabilityNote: 'Preprint, awaiting peer review.',
    flags: [{ label: 'Not Yet Peer Reviewed', tone: 'amber' }],
    plain:
      'Two full-body sessions per week appeared sufficient to maintain lean mass in older adults over a 24-month period.',
  },
  {
    id: '4',
    source: 'peer-reviewed',
    year: 2024,
    title: 'Rapamycin, mTOR inhibition, and healthspan: current evidence in humans',
    journal: 'Nature Aging',
    reliability: 3,
    reliabilityNote: 'Narrative review with mechanistic emphasis.',
    flags: [{ label: 'Industry Funded', tone: 'amber' }],
    plain:
      'Human data remains early. Animal evidence is strong but translation to human longevity outcomes has not yet been demonstrated.',
  },
  {
    id: '5',
    source: 'editorial',
    year: 2025,
    title: 'Understanding APOE genotypes: what your Alzheimer’s risk really means',
    journal: 'SelfScience Editorial',
    reliability: 4,
    reliabilityNote: 'Curated summary of consensus literature.',
    flags: [],
    plain:
      'APOE4 raises statistical risk but is not deterministic. Lifestyle, sleep, and cardiovascular health strongly modify outcomes.',
  },
]

const PILLARS = [
  {
    key: 'genomics',
    name: 'Genomics',
    Icon: Dna,
    desc: 'How your genetic variants shape metabolism, sensitivity, and long-term risk.',
    items: [
      'MTHFR variants and folate metabolism',
      'APOE genotypes and cognitive aging',
      'CYP1A2 and caffeine clearance',
    ],
  },
  {
    key: 'nutrition',
    name: 'Nutrition',
    Icon: Apple,
    desc: 'Evidence on diet patterns, macronutrients, and personalized nutrition.',
    items: [
      'Time-restricted eating in prediabetes',
      'Protein timing and muscle synthesis',
      'Omega-3 dosing and inflammation',
    ],
  },
  {
    key: 'performance',
    name: 'Performance',
    Icon: Activity,
    desc: 'Training, recovery, and adaptation research for real-world athletes.',
    items: [
      'Zone 2 training and mitochondrial density',
      'Creatine monohydrate — cognitive effects',
      'Sleep debt and next-day power output',
    ],
  },
  {
    key: 'longevity',
    name: 'Longevity',
    Icon: Hourglass,
    desc: 'Interventions and biomarkers linked to healthspan and biological age.',
    items: [
      'Rapamycin — current human evidence',
      'GlycanAge vs epigenetic clocks',
      'Senolytics: state of the field 2025',
    ],
  },
  {
    key: 'wellness',
    name: 'Wellness',
    Icon: Heart,
    desc: 'Sleep, stress, mental health, and daily practice research.',
    items: [
      'Morning light exposure and circadian rhythm',
      'HRV, breath-work, and vagal tone',
      'Sauna use and cardiovascular outcomes',
    ],
  },
]

const CATEGORY_PILLS = ['Genomics', 'Nutrition', 'Performance', 'Longevity', 'Wellness']

/* ---------------------------------- Nav ------------------------------------ */

const NavBar = ({ transparent = false }) => (
  <header
    className={`absolute inset-x-0 top-0 z-30 border-b ${
      transparent
        ? 'border-white/15 bg-ss-teal/40 backdrop-blur-md'
        : 'border-ss-border-warm bg-white'
    }`}
  >
    <div className="container flex h-16 items-center justify-between">
      <a href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
        <span className="inline-block h-2 w-2 rounded-full bg-ss-orange" />
        SelfScience
      </a>
      <nav className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
        <a href="/" className="hover:text-white">Home</a>
        <a href="/genome" className="hover:text-white">Genome</a>
        <a href="/how-it-works" className="hover:text-white">How it works</a>
        <a href="/about" className="hover:text-white">About</a>
      </nav>
      <a
        href="/genome"
        className="hidden rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark md:inline-flex"
      >
        Upload Genome
      </a>
    </div>
  </header>
)

/* --------------------------------- Page ------------------------------------ */

export default function App() {
  const [query, setQuery] = useState('')
  const [activePill, setActivePill] = useState(null)

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* ============================= HERO ============================= */}
      <section className="relative flex min-h-[100vh] flex-col justify-center overflow-hidden bg-ss-teal text-white">
        <NavBar transparent />

        {/* Horizontal DNA image band across the right half, fading into teal on the left */}
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

        {/* Teal color-wash on top of image so it blends into the brand palette */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(27,71,77,0.98) 0%, rgba(27,71,77,0.70) 32%, rgba(27,71,77,0.35) 55%, rgba(27,71,77,0.55) 85%, rgba(27,71,77,0.95) 100%)',
          }}
        />

        {/* Orange radial glow to tie in the accent */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
          style={{
            background:
              'radial-gradient(45% 55% at 70% 45%, rgba(196,88,32,0.35) 0%, rgba(27,71,77,0) 70%)',
          }}
        />

        {/* Bottom fade so hero blends into next section smoothly */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24"
          style={{
            background:
              'linear-gradient(to bottom, rgba(27,71,77,0) 0%, rgba(27,71,77,1) 100%)',
          }}
        />

        <div className="container relative z-10 flex flex-col items-center pt-24 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
            SelfScience
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85 md:text-xl">
            Search the science. Understand your biology.
          </p>

          {/* search bar */}
          <div className="mt-10 w-full max-w-3xl">
            <div className="flex items-center overflow-hidden rounded-full bg-white text-ss-text shadow-lg ring-1 ring-black/5">
              <Search className="ml-5 shrink-0 text-ss-muted" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a topic, gene, molecule, or study…  e.g. MTHFR, zone 2 training, rapamycin"
                className="w-full bg-transparent px-4 py-4 text-base placeholder:text-ss-muted focus:outline-none md:py-5 md:text-lg"
              />
              <button className="m-1.5 hidden rounded-full bg-ss-orange px-6 py-3 text-sm font-semibold text-white transition hover:bg-ss-orange-dark md:inline-flex">
                Search
              </button>
            </div>
            <p className="mt-3 text-xs text-white/60">
              Sources: PubMed · Semantic Scholar · SelfScience Editorial. Every result gets a reliability score.
            </p>
          </div>

          {/* category pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_PILLS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePill(activePill === p ? null : p)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
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
            style={{ borderLeft: '6px solid #1B474D' }}
          >
            {/* left */}
            <div className="md:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-ss-privacy-tint px-3 py-1 text-xs font-semibold text-ss-teal">
                <Dna size={14} /> Personalized · Optional
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-ss-teal md:text-4xl">
                Your Genome. Your Research Starting Point.
              </h2>
              <p className="mt-4 max-w-xl text-ss-text">
                Upload your raw DNA file from 23andMe, AncestryDNA, or a whole-genome service. SelfScience identifies your key genetic variants and builds a personalized research roadmap.
              </p>

              <div className="mt-5 flex items-start gap-2 text-sm text-ss-muted">
                <Lock size={16} className="mt-0.5 shrink-0 text-ss-teal" />
                <span>
                  Processed entirely in your browser. No names. No storage. No transmission. Your session clears when you close the page.
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
                Supported: 23andMe · AncestryDNA · MyHeritage · Whole Genome Sequencing
              </div>
            </div>

            {/* right: DNA → variants → roadmap flow */}
            <div className="relative hidden md:col-span-2 md:block">
              <div className="flex h-full items-center justify-center">
                <div className="flex w-full items-center justify-between gap-3">
                  <FlowStep icon={<Dna size={22} />} label="DNA File" />
                  <ChevronRight className="shrink-0 text-ss-muted" />
                  <FlowStep
                    icon={
                      <div className="flex gap-0.5">
                        <span className="h-4 w-1 rounded-sm bg-ss-teal" />
                        <span className="h-6 w-1 rounded-sm bg-ss-teal" />
                        <span className="h-3 w-1 rounded-sm bg-ss-teal" />
                        <span className="h-5 w-1 rounded-sm bg-ss-teal" />
                      </div>
                    }
                    label="Variants"
                  />
                  <ChevronRight className="shrink-0 text-ss-muted" />
                  <FlowStep icon={<Search size={22} />} label="Research Roadmap" />
                </div>
              </div>
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
                Editor-curated studies across the five pillars, each with an AI reliability score and plain-language summary.
              </p>
            </div>
            <a
              href="/search"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-ss-teal hover:underline md:inline-flex"
            >
              Browse all <ArrowRight size={14} />
            </a>
          </div>

          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
            {FEATURED.map((item) => (
              <div key={item.id} className="snap-start">
                <ResultCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ 5 PILLARS ========================== */}
      <section className="bg-white py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              The Five Pillars
            </div>
            <h2 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Every question, organized around your biology
            </h2>
            <p className="mt-3 text-ss-muted">
              Explore research grouped into the five domains that shape human health and performance.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {PILLARS.map(({ key, name, Icon, desc, items }) => (
              <div
                key={key}
                className="flex flex-col rounded-xl bg-ss-surface p-6 ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ss-teal">{name}</h3>
                <p className="mt-1.5 text-sm text-ss-muted">{desc}</p>

                <ul className="mt-4 space-y-2 text-sm">
                  {items.map((it) => (
                    <li key={it}>
                      <a
                        href="#"
                        className="group flex items-start gap-1.5 text-ss-text hover:text-ss-teal"
                      >
                        <ChevronRight size={14} className="mt-1 shrink-0 text-ss-muted group-hover:text-ss-teal" />
                        <span className="leading-snug">{it}</span>
                      </a>
                    </li>
                  ))}
                </ul>

                <a
                  href={`/${key}`}
                  className="mt-6 inline-flex w-fit items-center gap-1 rounded-full border border-ss-teal px-4 py-1.5 text-xs font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
                >
                  Explore {name} <ArrowRight size={12} />
                </a>
              </div>
            ))}
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
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
          </nav>
        </div>
        <div className="container mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
          <p>© {new Date().getFullYear()} SelfScience. For educational purposes only. Not medical advice, diagnosis, or treatment recommendations.</p>
        </div>
      </footer>
    </main>
  )
}

/* ------------------------------ Flow step ---------------------------------- */

function FlowStep({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-ss-teal ring-1 ring-ss-border-warm">
        {icon}
      </div>
      <div className="text-xs font-semibold text-ss-text">{label}</div>
    </div>
  )
}
