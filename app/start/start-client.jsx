'use client'

// /app/app/start/start-client.jsx
// The guided "Start Here" journey page. Scroll-driven, six sections plus a
// welcome hero. IntersectionObserver drives the sticky progress bar. The
// tone throughout is knowledgeable-friend-not-tutorial — warm, specific,
// low on jargon, high on "here is exactly what to do next."

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Search as SearchIcon, ArrowRight, Dna, Apple, BookOpen, Copy, Check,
  Sparkles, ShieldCheck, ChevronDown,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import { trackEvent, EVENTS } from '@/lib/analytics'

const STEPS = [
  { id: 'welcome',  label: 'Welcome' },
  { id: 'step-1',   label: 'What is this' },
  { id: 'step-2',   label: 'Search' },
  { id: 'step-3',   label: 'Genome' },
  { id: 'step-4',   label: 'Food' },
  { id: 'step-5',   label: 'Deeper' },
  { id: 'step-6',   label: 'Done' },
]

// ---------- Sticky progress bar ----------
function ProgressBar({ activeIndex }) {
  const pct = (activeIndex / (STEPS.length - 1)) * 100
  return (
    <div className="sticky top-16 z-40 flex items-center gap-3 border-b border-ss-border-warm bg-white/95 px-4 py-2.5 backdrop-blur md:px-6">
      <span className="hidden shrink-0 text-[11px] font-bold uppercase tracking-widest text-ss-teal sm:inline">
        Your journey
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ss-border-warm">
        <div
          className="h-full rounded-full bg-ss-teal transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-semibold text-ss-muted">
        Step {activeIndex + 1} of {STEPS.length}
      </span>
      <Link href="/" className="hidden shrink-0 text-[11px] font-semibold text-ss-muted hover:text-ss-teal md:inline">
        Skip to homepage →
      </Link>
    </div>
  )
}

// ---------- Step header ----------
function StepNumber({ number, label, color = 'text-ss-muted' }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ss-teal text-base font-extrabold text-white">
        {number}
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${color}`}>{label}</span>
    </div>
  )
}

// ---------- Next step button ----------
function NextStepButton({ href, label }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
      className="mt-10 inline-flex items-center gap-2 border-b-2 border-ss-teal pb-1 text-sm font-semibold text-ss-teal hover:opacity-90"
    >
      {label} <ChevronDown size={16} />
    </a>
  )
}

// ---------- Mini search bar (embedded in step 2) ----------
function MiniSearchBar() {
  const [q, setQ] = useState('')
  const go = () => {
    const query = q.trim()
    if (!query) return
    trackEvent(EVENTS.SEARCH_PERFORMED, { source: 'start_page_mini_search', has_pillar: false })
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-ss-border-warm bg-ss-bg px-3 py-2">
      <SearchIcon size={16} className="text-ss-muted" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') go() }}
        placeholder="e.g. MTHFR and folate, Zone 2 training, ADHD nutrition…"
        className="flex-1 bg-transparent text-sm focus:outline-none"
      />
      <button
        type="button"
        onClick={go}
        disabled={!q.trim()}
        className="rounded-md bg-ss-teal px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
      >
        Search
      </button>
    </div>
  )
}

// ---------- Share buttons (step 6) ----------
function ShareButtons() {
  const [copied, setCopied] = useState(false)
  const url = 'https://selfscience.io'
  const text = "Understanding your biology shouldn't require a medical degree. SelfScience makes the research accessible."
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* ignore */ }
  }
  const btn = 'inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20'
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={doCopy} className={btn}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <a
        href={`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer" className={btn}
      >Share on X</a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer" className={btn}
      >Share on Facebook</a>
    </div>
  )
}

// ---------- The page ----------
export default function StartClient() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionsRef = useRef([])

  // Progress bar tracks whichever section is closest to the top of the viewport.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible entry — largest intersectionRatio wins.
        let best = null
        for (const e of entries) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e
        }
        if (best) {
          const idx = STEPS.findIndex((s) => s.id === best.target.id)
          if (idx >= 0) setActiveIndex(idx)
        }
      },
      { threshold: [0.3, 0.5, 0.7] },
    )
    sectionsRef.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const setRef = (i) => (el) => { sectionsRef.current[i] = el }

  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      <SiteNav />
      <ProgressBar activeIndex={activeIndex} />

      {/* ---------- STEP 0 — Welcome ---------- */}
      <section id="welcome" ref={setRef(0)} className="container flex min-h-[80vh] flex-col items-start justify-center py-16">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
          <Sparkles size={12} /> Your journey starts here
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] text-ss-teal md:text-5xl lg:text-[52px]">
          Most people discover SelfScience because something isn't adding up.
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ss-text md:text-lg">
          Maybe you downloaded your 23andMe results and have no idea what to do with them. Maybe you're a parent trying to understand why your child struggles with focus or digestion. Maybe you just feel like something is off and the standard answers haven't helped.
        </p>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ss-text md:text-lg">
          You're in the right place. SelfScience doesn't tell you what's wrong with you. It shows you what the research actually says about how your specific biology works — and what questions to start asking.
        </p>
        <p className="mt-6 max-w-xl text-sm italic text-ss-muted">
          This page walks you through exactly where to start. No account. No commitment. Just the first step.
        </p>
        <NextStepButton href="#step-1" label="Scroll to begin" />
      </section>

      {/* ---------- STEP 1 — What is this ---------- */}
      <section id="step-1" ref={setRef(1)} className="border-t-4 border-ss-teal bg-white">
        <div className="container py-20">
          <StepNumber number={1} label="Understand what this is" />
          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight text-ss-teal md:text-4xl">
            SelfScience is a research discovery tool — not a diagnosis.
          </h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">
            Everything on this platform is built on one idea: the research exists. The science that explains why you feel the way you do, why certain things work for you and not others, why your child struggles with the same things you struggled with — that research is sitting in medical journals most people will never see.
          </p>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">
            SelfScience helps you find it, understand it, and know what questions to bring to your doctor. It does not replace your doctor. It makes every conversation with your doctor more informed.
          </p>

          <div className="mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
            <div className="rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-5">
              <p className="text-sm font-extrabold uppercase tracking-widest text-emerald-700">SelfScience IS</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ss-text">
                {['A research search engine for health and genomics',
                  'An AI tool that scores study quality honestly',
                  'A way to understand what your genome means',
                  'A food scanner tied to your biology',
                  'An educational starting point for better conversations'].map((t) => (
                  <li key={t} className="flex gap-2"><span className="font-bold text-emerald-700">✓</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border-l-4 border-ss-orange bg-ss-orange/10 p-5">
              <p className="text-sm font-extrabold uppercase tracking-widest text-ss-orange">SelfScience is NOT</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ss-text">
                {['A medical diagnosis tool',
                  'A replacement for your doctor',
                  'A supplement store or affiliate site',
                  'A diet plan or meal program',
                  "Something that tells you what is wrong with you"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="font-bold text-ss-orange">✕</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <blockquote className="mt-10 max-w-2xl border-l-4 border-ss-teal pl-5 text-[17px] italic leading-relaxed text-ss-text">
            “The research exists. SelfScience helps you find it, understand it, and know what questions to ask next.”
          </blockquote>

          <NextStepButton href="#step-2" label="Got it. What do I do first?" />
        </div>
      </section>

      {/* ---------- STEP 2 — Search ---------- */}
      <section id="step-2" ref={setRef(2)} className="bg-ss-bg">
        <div className="container py-20">
          <StepNumber number={2} label="Your first search" />
          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight text-ss-teal md:text-4xl">
            Start by searching something you already wonder about.
          </h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">
            You don't need your genome to use SelfScience. The search tool connects directly to PubMed, Semantic Scholar, and other research databases and returns real peer-reviewed studies — with an AI score showing you how strong the evidence actually is.
          </p>

          <div className="mt-8 max-w-xl rounded-xl border border-ss-border-warm bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-ss-muted">Try a search right now</p>
            <MiniSearchBar />
            <p className="mt-2.5 text-[11px] text-ss-muted">Opens the full search results page — you can always come back here.</p>
          </div>

          <p className="mt-8 text-sm font-bold text-ss-teal">Or start with one of these:</p>
          <div className="mt-4 grid max-w-3xl gap-3">
            {[
              { label: 'I have downloaded my 23andMe or AncestryDNA results',   color: 'text-ss-teal', searches: ['MTHFR methylation research', 'ACTN3 athletic performance', 'COMT dopamine processing'] },
              { label: "I'm researching my child's health",                     color: 'text-emerald-700', searches: ['ADHD nutrition children research', 'gut microbiome children immunity', 'food dyes children behavior'] },
              { label: "I'm working on my fitness and recovery",                color: 'text-[#964219]', searches: ['Zone 2 training cardiovascular', 'collagen tendon injury prevention', 'sleep recovery performance'] },
              { label: "I'm navigating medication or mental health",            color: 'text-ss-muted', searches: ['CYP2D6 antidepressant metabolism', 'MTHFR depression methylfolate', 'pharmacogenomics SSRI'] },
              { label: 'I want to understand what I am eating',                  color: 'text-ss-orange', searches: ['seed oils inflammation research', 'ultra-processed food health effects', 'organic pesticide exposure children'] },
            ].map((cat) => (
              <div key={cat.label} className="rounded-xl border border-ss-border-warm bg-white p-4">
                <p className={`mb-2.5 text-sm font-bold ${cat.color}`}>{cat.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.searches.map((s) => (
                    <Link
                      key={s}
                      href={`/search?q=${encodeURIComponent(s)}`}
                      className="inline-flex items-center gap-1 rounded-md border border-ss-border-warm bg-ss-bg px-2.5 py-1.5 text-[12px] font-medium text-ss-text hover:bg-white"
                    >
                      {s} <ArrowRight size={11} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-xl rounded-xl bg-ss-teal p-6 text-white">
            <p className="mb-3 text-sm font-bold">How to read your search results</p>
            {[
              ['Reliability score',   '1–5 rating of how strong the evidence is. A single small study scores 1–2. A large randomized trial or meta-analysis scores 4–5. Always check this before taking a result seriously.'],
              ['Study type badges',   'RCT (randomized controlled trial) is the gold standard. Observational means researchers watched what happened — not tested. Preprint means it has not yet been peer-reviewed.'],
              ['In Plain Terms',      'Every result has a plain-language translation of what the study found. Start here — then read the abstract if you want more.'],
              ['Funding trail',       'If a study was funded by the industry it benefits, we flag it. You decide what to do with that information.'],
            ].map(([label, desc]) => (
              <div key={label} className="mb-2.5 last:mb-0">
                <span className="font-bold text-ss-orange">{label}: </span>
                <span className="text-[13px] leading-relaxed text-white/85">{desc}</span>
              </div>
            ))}
          </div>

          <NextStepButton href="#step-3" label="Next: your genome" />
        </div>
      </section>

      {/* ---------- STEP 3 — Genome ---------- */}
      <section id="step-3" ref={setRef(3)} className="bg-white">
        <div className="container py-20">
          <StepNumber number={3} label="Your genome — optional but powerful" />
          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight text-ss-teal md:text-4xl">
            If you have a 23andMe or AncestryDNA file, this is where it gets personal.
          </h2>

          <div className="mt-6 max-w-xl rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><ShieldCheck size={16} /> Your privacy is protected</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ss-text">
              Your genome file never leaves your device. It's read entirely in your browser. Anonymous variant calls are used to generate your results — nothing is stored or retained after you close the page. We mean this literally.
            </p>
          </div>

          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed">
            Uploading your raw genome file gives SelfScience the ability to cross-reference approximately 500 specific genetic variants against peer-reviewed research. The result is not a diagnosis — it's a research starting point that's specific to your biology, not the population average.
          </p>

          <p className="mt-8 text-sm font-bold text-ss-teal">Here's what people discover:</p>
          <div className="mt-3 grid max-w-3xl gap-2.5">
            {[
              { g: 'MTHFR',    f: 'I can\u2019t efficiently convert synthetic folic acid — the kind added to every bread and cereal in the US. This directly affects how I make serotonin and dopamine.', a: 'Switch from folic acid to methylfolate. Avoid fortified cereals. A starting point to discuss with your doctor.' },
              { g: 'ACTN3',    f: 'My muscle fiber genetics are built for endurance, not power. 18 years of training the wrong way for my biology.', a: 'Structure training around aerobic base building. Adaptation is fastest there.' },
              { g: 'MTNR1B',   f: 'Eating late at night activates a melatonin receptor that impairs my insulin secretion. My HbA1c makes complete sense now.', a: 'Last meal by 6:30 PM. Single behavioral change with the strongest documented metabolic impact for this genotype.' },
              { g: 'COL5A1',   f: 'My connective tissue has structurally different collagen. The reason I keep getting injured is not bad luck — it\u2019s biology.', a: 'Collagen loading protocol before every training session. Progressive volume increases.' },
            ].map((ex) => (
              <div key={ex.g} className="rounded-xl border border-ss-border-warm bg-ss-bg p-4">
                <span className="inline-block rounded bg-ss-teal px-2 py-0.5 text-[11px] font-bold text-white">{ex.g}</span>
                <p className="mt-2 text-[14px] italic leading-relaxed text-ss-text">“{ex.f}”</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ss-muted">→ {ex.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-xl">
            <p className="mb-3 text-sm font-bold text-ss-teal">How to get your raw genome file</p>
            {[
              ['23andMe',       'Sign in → Browse Raw Data → Download. The file is a .txt or .zip (v3, v4, or v5 all work).'],
              ['AncestryDNA',   'Settings → Privacy → Download DNA Data. Downloads as a .zip.'],
              ['MyHeritage DNA','DNA → Manage DNA Kits → Actions → Download Raw DNA Data.'],
            ].map(([svc, steps]) => (
              <div key={svc} className="border-b border-ss-border-warm py-2 last:border-b-0">
                <span className="font-bold text-ss-teal">{svc}: </span>
                <span className="text-[13.5px] text-ss-muted">{steps}</span>
              </div>
            ))}
            <p className="mt-3 text-[12.5px] text-ss-muted">
              Don't have a genome file yet? You can still explore the research and use the food scanner without one. The genome analysis is optional.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/genome" className="inline-flex items-center gap-2 rounded-full bg-ss-teal px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110">
              <Dna size={14} /> Upload my genome
            </Link>
            <span className="text-xs text-ss-muted">or continue to the next step first</span>
          </div>

          <NextStepButton href="#step-4" label="Next: food and products" />
        </div>
      </section>

      {/* ---------- STEP 4 — Food ---------- */}
      <section id="step-4" ref={setRef(4)} className="bg-ss-bg">
        <div className="container py-20">
          <StepNumber number={4} label="What you eat matters more than you think" />
          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight text-ss-teal md:text-4xl">
            SelfScience can analyze any food or product against your genomic profile.
          </h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">
            The nutrition scanner connects to a database of millions of food products. Search any brand, scan a barcode on your phone, or look up any ingredient. The result tells you two things: how this food rates for anyone (universal quality score) and how it specifically fits your genomic profile.
          </p>

          <div className="mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
            {[
              { p: 'A popular protein bar',          f: 'Contains enriched wheat flour (synthetic folic acid) — a problem for MTHFR variants. Contains sucralose — gut microbiome concern for NOD2 variants.', v: 'C — Consider alternatives',    tone: 'bg-amber-500' },
              { p: 'An organic grass-fed beef jerky', f: 'Grass-fed. No seed oils. No artificial preservatives. High protein. No synthetic fortification.', v: 'A — Strong choice',            tone: 'bg-emerald-600' },
              { p: 'A standard salad dressing',       f: 'Soybean oil (high omega-6 — relevant for FADS1/2 reduced conversion). Contains carrageenan (gut concern for NOD2 variant).', v: 'D — Better alternatives exist', tone: 'bg-rose-600' },
            ].map((ex) => (
              <div key={ex.p} className="rounded-xl border border-ss-border-warm bg-white p-4">
                <p className="text-sm font-bold text-ss-teal">{ex.p}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ss-muted">{ex.f}</p>
                <span className={`mt-3 inline-block rounded px-2 py-0.5 text-[11px] font-bold text-white ${ex.tone}`}>{ex.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/nutrition" className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110">
              <Apple size={14} /> Try the food scanner
            </Link>
          </div>

          <NextStepButton href="#step-5" label="Next: reading and going deeper" />
        </div>
      </section>

      {/* ---------- STEP 5 — Deeper ---------- */}
      <section id="step-5" ref={setRef(5)} className="bg-white">
        <div className="container py-20">
          <StepNumber number={5} label="Going deeper" />
          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight text-ss-teal md:text-4xl">
            When you're ready for more, the depth is here.
          </h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">
            SelfScience is designed to grow with you. Start with a search. Upload your genome when you're ready. Use the food scanner for the products you buy every week. Then come back to go deeper through the nine research pillars.
          </p>

          <div className="mt-8 grid max-w-4xl gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[
              { name: 'Genomics',            icon: '🧬', desc: 'Your variants and what they mean',                             href: `/search?pillar=${encodeURIComponent('Genomics & DNA')}` },
              { name: 'Nutrition',           icon: '🥗', desc: 'How your genes shape what you should eat',                    href: `/search?pillar=${encodeURIComponent('Nutrition')}` },
              { name: 'Sports Performance',  icon: '⚡', desc: 'Athletic optimization for your biology',                       href: `/search?pillar=${encodeURIComponent('Sports Performance')}` },
              { name: 'Longevity',           icon: '⏳', desc: 'Cellular aging and what slows it',                              href: `/search?pillar=${encodeURIComponent('Longevity')}` },
              { name: 'General Wellness',    icon: '💚', desc: 'Sleep, stress, gut health, habits',                             href: `/search?pillar=${encodeURIComponent('General Wellness')}` },
              { name: 'Mental Health',       icon: '🧠', desc: 'Dopamine, serotonin, and your brain',                          href: `/search?pillar=${encodeURIComponent('Mental Health & Neurochemistry')}` },
              { name: 'Pharmacogenomics',    icon: '💊', desc: 'How your genes affect medications',                            href: `/search?pillar=${encodeURIComponent('Pharmacogenomics')}` },
              { name: 'Hormones',            icon: '⚖️', desc: 'Thyroid, testosterone, cortisol',                                href: `/search?pillar=${encodeURIComponent('Hormones & Endocrine Health')}` },
              { name: 'Youth & Pediatric',   icon: '👶', desc: 'The earlier you know, the more you can do',                    href: '/pillars/youth' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="rounded-xl border border-ss-border-warm bg-ss-bg p-4 transition hover:border-ss-teal hover:bg-white">
                <span className="mb-2 block text-2xl">{p.icon}</span>
                <p className="text-sm font-bold text-ss-teal">{p.name}</p>
                <p className="mt-0.5 text-xs leading-snug text-ss-muted">{p.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 max-w-xl rounded-xl bg-ss-teal p-6 text-white">
            <p className="flex items-center gap-2 text-sm font-bold"><BookOpen size={15} /> The SelfScience Reading List</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">
              69 books across all nine pillars — each with honest notes on where the evidence is strong and where it's still emerging. No affiliate links. No sponsored recommendations.
            </p>
            <Link href="/reading-list" className="mt-4 inline-flex items-center gap-1 rounded-full bg-ss-orange px-4 py-2 text-xs font-bold text-white hover:brightness-110">
              Browse the reading list <ArrowRight size={12} />
            </Link>
          </div>

          <NextStepButton href="#step-6" label="Almost there — one last thing" />
        </div>
      </section>

      {/* ---------- STEP 6 — The most important thing ---------- */}
      <section id="step-6" ref={setRef(6)} className="bg-gradient-to-br from-ss-teal to-[#163a3e] text-white">
        <div className="container py-20">
          <StepNumber number={6} label="The most important thing" color="text-white/60" />
          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-4xl">
            You're not looking for what's wrong with you. You're building a more accurate picture of how you work.
          </h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/85">
            Every variant on this platform is presented as a research association found in population studies — not a verdict about your health. Genetics describes tendencies. It doesn't predict your future.
          </p>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/85">
            The people who get the most from SelfScience are not the ones who use it to worry. They're the ones who use it to ask better questions — of their doctors, of their diet, of their training, of the things they've been told to believe about their own bodies.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110">
              <SearchIcon size={14} /> Start searching
            </Link>
            <Link href="/genome" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20">
              <Dna size={14} /> Upload my genome
            </Link>
            <Link href="/nutrition" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20">
              <Apple size={14} /> Scan a food
            </Link>
          </div>

          <div className="mt-12 max-w-xl border-t border-white/15 pt-8">
            <p className="text-sm leading-relaxed text-white/85">
              Know someone who would benefit from this? SelfScience is free, ad-free, and has no commercial interests. If it helped you, sharing it is the most valuable thing you can do.
            </p>
            <div className="mt-4"><ShareButtons /></div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
