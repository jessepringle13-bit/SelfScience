'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Coffee, DollarSign, LayoutDashboard } from 'lucide-react'
import { hasGenomeResults, getGenomeResults } from '@/lib/genomeSession'
import { normalizePillarName } from '@/lib/pillars'
import {
  Menu,
  X,
  ChevronDown,
  Dna,
  Apple,
  Activity,
  Hourglass,
  Heart,
  Pill,
  Brain,
  Leaf,
  Droplet,
  Baby,
  TestTube2,
  Globe2,
  Compass,
  FileText,
  Rocket,
  Award,
  Target,
  BookOpen as BookOpenIcon,
  CheckCircle2 as CheckCircleIcon,
} from 'lucide-react'
import { trackEvent, EVENTS } from '@/lib/analytics'
import PrefsMenu from '@/components/PrefsMenu'
import AlertBell from '@/components/AlertBell'
import ExplorerChip from '@/components/ExplorerChip'
import { useSavedCount } from '@/lib/readingList'
import { useMode } from '@/lib/userPath'
import { useTierState } from '@/lib/tierState'
import { Route, Lock } from 'lucide-react'

export const PILLARS = [
  { key: 'genomics',           name: 'Genomics',                        short: 'Genomics',          Icon: Dna,       description: 'Understanding your genetic variants and what current research says about them.' },
  { key: 'nutrition',          name: 'Nutrition',                       short: 'Nutrition',         Icon: Apple,     description: 'How your genes influence the way your body processes food, nutrients, and dietary patterns.' },
  { key: 'sports-performance', name: 'Sports Performance',              short: 'Performance',       Icon: Activity,  description: 'The genetics of athletic ability, training adaptation, injury risk, and recovery.' },
  { key: 'longevity',          name: 'Longevity',                       short: 'Longevity',         Icon: Hourglass, description: 'Cellular aging, telomeres, NAD+ pathways, and what research shows about extending healthspan.' },
  { key: 'wellness',           name: 'General Wellness',                short: 'Wellness',          Icon: Heart,     description: 'Sleep, stress, gut health, and the daily habits that research connects to better health.' },
  { key: 'pharmacogenomics',   name: 'Pharmacogenomics',                short: 'Pharmacogenomics',  Icon: Pill,      description: 'How your genes affect the way your body processes medications and supplements.' },
  { key: 'mental-health',      name: 'Mental Health & Neurochemistry',  short: 'Mental Health',     Icon: Brain,     description: 'The genetics of mood, stress response, dopamine, serotonin, and brain chemistry.' },
  { key: 'environment',        name: 'Environmental Sensitivity',       short: 'Environment',       Icon: Leaf,      description: 'How your genes influence your response to environmental exposures, toxins, and chemical sensitivity.' },
  { key: 'hormones',           name: 'Hormones & Endocrine Health',     short: 'Hormones',          Icon: Droplet,   description: 'Testosterone, estrogen, thyroid, cortisol, leptin, and the genetics of hormonal health.' },
  // Section 5 rename: broadened from "Pediatric & Youth Wellness" so
  // adults researching their own developmental biology see themselves in
  // the pillar too. Route + key kept as `pediatric` / `/pillars/youth`
  // so existing bookmarks and internal links do not break.
  { key: 'pediatric',          name: 'Developmental & Lifespan Wellness', short: 'Development',    Icon: Baby,      description: 'Growth, development, nutrition, sleep, ADHD, allergies, and the research shaping health across the lifespan.', route: '/pillars/youth' },
]

export function SiteNav({ variant = 'light' }) {
  const isDark = variant === 'dark'
  const pathname = usePathname() || ''
  const mode = useMode() // 'explorer' | 'guided'
  const tier = useTierState()
  // Track genome presence via sessionStorage on mount. This lets us
  // detect Tier 1 users reliably even if initTierStateIfNew hasn't
  // fired yet on the current route (which only happens on /). Without
  // this the nav simplification and the search banner would silently
  // skip for anyone landing directly on /search, /goals, etc.
  // (See tier1 derivation below \u2014 uses the shared `genomeLoaded`
  // useState declared a few lines further down.)
  const [pillarsOpen, setPillarsOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // Track whether a genome has been uploaded in this session. When true,
  // we surface a "Dashboard" nav item so the user can always get home
  // without hunting for the SelfScience logo. Re-checks on the
  // selfscience:genome-changed event that /lib/genomeSession fires.
  const [genomeLoaded, setGenomeLoaded] = useState(false)
  // Section 5 spec: variant counts per pillar. Refreshed when the
  // genome-changed event fires so the dropdown always reflects the
  // current session. Silent when no genome is loaded.
  const [pillarCounts, setPillarCounts] = useState({})
  useEffect(() => {
    if (typeof window === 'undefined') return
    const recompute = () => {
      setGenomeLoaded(hasGenomeResults())
      try {
        const g = getGenomeResults()
        if (!g) { setPillarCounts({}); return }
        const counts = {}
        // Walk both the flat recognized list and the fullReport groups
        // so we mirror the Pillar Score Overview totals exactly.
        const bump = (name) => {
          const normal = normalizePillarName(name)
          if (!normal) return
          counts[normal] = (counts[normal] || 0) + 1
        }
        for (const v of g.variants_recognized || []) {
          const pillars = Array.isArray(v?.pillar) ? v.pillar : v?.pillar ? [v.pillar] : []
          for (const p of pillars) bump(p)
        }
        for (const grp of g.fullReport || []) {
          for (const v of grp.variants || []) {
            const pillars = Array.isArray(v?.pillar) ? v.pillar : v?.pillar ? [v.pillar] : []
            for (const p of pillars) bump(p)
          }
        }
        setPillarCounts(counts)
      } catch { setPillarCounts({}) }
    }
    recompute()
    window.addEventListener('selfscience:genome-changed', recompute)
    return () => window.removeEventListener('selfscience:genome-changed', recompute)
  }, [])
  const pillarsRef = useRef(null)
  const toolsRef = useRef(null)
  const aboutRef = useRef(null)

  // Close dropdowns on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPillarsOpen(false)
        setToolsOpen(false)
        setAboutOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // The bottom-nav "Tools" tab used to dispatch this event to open the full
  // drawer. We now scope the bottom "Tools" tab to a dedicated Tools sheet
  // (see MobileNav.jsx), so this listener is kept only as a defensive
  // fallback for any legacy caller that still expects the drawer to open.
  useEffect(() => {
    const onOpen = () => setMobileOpen(true)
    window.addEventListener('selfscience:open-mobile-menu', onOpen)
    return () => window.removeEventListener('selfscience:open-mobile-menu', onOpen)
  }, [])

  // Close dropdowns when clicking outside. This is the click-based UX pattern:
  // the dropdown stays open (regardless of where you move your cursor) until
  // you either pick a link, hit Escape, or click somewhere else on the page.
  // Fixes the previous hover-based UX where the panel would disappear whenever
  // the cursor briefly crossed the gap between the button and the menu.
  useEffect(() => {
    if (!pillarsOpen && !toolsOpen && !aboutOpen) return
    const onDocClick = (e) => {
      if (pillarsOpen && pillarsRef.current && !pillarsRef.current.contains(e.target)) {
        setPillarsOpen(false)
      }
      if (toolsOpen && toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false)
      }
      if (aboutOpen && aboutRef.current && !aboutRef.current.contains(e.target)) {
        setAboutOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [pillarsOpen, toolsOpen, aboutOpen])

  // Nav is `fixed top-0 z-50` so it stays visible while the user scrolls.
  // Previously it was `absolute` which meant it scrolled off with the hero.
  // The dark variant keeps its frosted-teal backdrop so text stays legible
  // regardless of what's underneath (works over both the teal hero and any
  // white/cream section below). Light variant already has an opaque white
  // bg, which handles the same scenario in reverse.
  const base = isDark
    ? 'border-white/15 bg-ss-teal/85 backdrop-blur-md text-white'
    : 'border-ss-border-warm bg-white/95 backdrop-blur text-ss-text'
  const linkBase = isDark ? 'text-white/85 hover:text-white' : 'text-ss-text hover:text-ss-orange'
  // Tier 1 = Understanding. Fires the moment a genome is uploaded and
  // tier hasn't been graduated to 2 yet. Uses the pre-existing
  // genomeLoaded state so it's always in sync with sessionStorage.
  const tier1 = genomeLoaded && tier.tier < 2
  const guided = tier1 || mode === 'guided'
  // Design audit: active nav item = white/high-contrast text with a subtle
  // orange underline. No teal in the nav to keep colour hierarchy clean.
  const linkActive = isDark
    ? 'text-white font-semibold border-b-2 border-ss-orange pb-0.5'
    : 'text-ss-text font-semibold border-b-2 border-ss-orange pb-0.5'
  const wordmarkClass = isDark ? 'text-white' : 'text-ss-teal'
  const linkClass = (href) => (pathname === href ? linkActive : linkBase)
  const ABOUT_ITEMS = [
    { href: '/about',         label: 'About',         blurb: 'The story behind the platform.' },
    { href: '/mission',       label: 'Mission',       blurb: 'Why SelfScience exists.' },
    { href: '/how-it-works',  label: 'How It Works',  blurb: 'A tour under the hood.' },
  ]
  const aboutActive = ABOUT_ITEMS.some((i) => i.href === pathname)
  // Section 7 spec: order by most commonly used first. Nutrition Hub,
  // Drug Check, and Supplement Discovery lead. "Supplements" was
  // renamed to "Supplement Discovery" and "Biomarkers" to "Lab
  // Biomarkers" to match the spec-required labels.
  const TOOL_ITEMS = [
    { href: '/blueprint',                  label: 'My Health Blueprint',   Icon: Compass,   blurb: 'Unified synthesis of your genome, protocol, nutrition, and next steps.' },
    { href: '/explore',                    label: 'Explore Your Genes',    Icon: Compass,   blurb: 'A checklist-style deep dive \u2014 one finding at a time, at your own pace.' },
    { href: '/goals',                      label: 'Health Goals',           Icon: Target,   blurb: 'Genome-informed goals with progress tracking, milestones, and insights.' },
    { href: '/nutrition',                 label: 'Nutrition Hub',         Icon: Apple,     blurb: 'Genomic food, journal & product scanner.' },
    { href: '/drug-check',                label: 'Drug Check',            Icon: Pill,      blurb: 'Pharmacogenomic guidance by medication.' },
    { href: '/tools/supplements',         label: 'Supplement Discovery',  Icon: Pill,      blurb: 'Discover supplements by ingredient form. NIH label data. Brand-direct only.' },
    { href: '/biomarkers',                label: 'Lab Biomarkers',        Icon: TestTube2, blurb: 'Log blood work + genome correlations.' },
    { href: '/tools/training',            label: 'Training Protocol',     Icon: Activity,  blurb: 'Genome-driven training plan for your sport.' },
    { href: '/population-compare',        label: 'Population Compare',    Icon: Globe2,    blurb: 'How your variants compare globally.' },
    { href: '/ancestry',                  label: 'Ancestry Report',       Icon: Compass,   blurb: 'A rough educational ancestry sketch.' },
    { href: '/practitioner-report',       label: 'Practitioner Report',   Icon: FileText,  blurb: 'Print-ready summary for your clinician.' },
    { href: '/journal',                    label: 'Health Journal',        Icon: BookOpenIcon, blurb: 'Private, on-device journal & progress timeline.' },
    { href: '/tracker',                    label: 'Habit Tracker',         Icon: CheckCircleIcon, blurb: 'Genome-informed habits with streaks, heatmaps, and insights.' },
    { href: '/tools/supplements/brands',  label: 'Brand Leaderboard',     Icon: Award,     blurb: 'Every curated supplement brand ranked by transparency score.' },
    { href: '/get-started',               label: 'Get Started',           Icon: Rocket,    blurb: 'Which DNA + blood kits work with SelfScience.' },
  ]
  const toolsActive = TOOL_ITEMS.some((i) => i.href === pathname)

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b ${base}`}>
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className={`flex items-center gap-2 text-xl font-extrabold tracking-tight ${wordmarkClass}`}>
          <span className="inline-block h-2 w-2 rounded-full bg-ss-orange" />
          SelfScience
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {/* Start Here \u2014 first item, orange accent, drives first-time visitors
              into the guided journey. Uses a subtle background so it's warm
              rather than shouty. */}
          <a
            href="/start"
            className={`inline-flex items-center gap-1 px-2 py-1 font-bold transition ${
              pathname === '/start'
                ? 'text-ss-orange border-b-2 border-ss-orange'
                : 'text-ss-orange/90 hover:text-ss-orange'
            }`}
          >
            Start Here
          </a>
          {/* Guided mode: dedicated "My Path" pill immediately after Start Here.
              Only shown when the user is in guided mode so it's a clear next-step
              anchor for their curriculum. */}
          {tier1 && (
            <a
              href="/genome/overview"
              className={`inline-flex items-center gap-1 px-2 py-1 font-semibold transition ${
                pathname === '/genome/overview' || pathname === '/'
                  ? 'text-ss-text border-b-2 border-ss-orange pb-0.5'
                  : 'text-ss-text/85 hover:text-ss-text'
              }`}
            >
              My Findings
            </a>
          )}
          {tier1 && (
            <span
              title="Complete your findings to unlock full access"
              className="inline-flex items-center gap-1 rounded-full border border-ss-teal/40 bg-ss-teal/[0.05] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ss-label"
            >
              <Lock size={9} /> Tier 1 · Understanding
            </span>
          )}
          {guided && !tier1 && (
            <a
              href="/my-path"
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition ${
                pathname === '/my-path'
                  ? 'text-ss-text font-semibold border-b-2 border-ss-orange pb-0.5'
                  : 'text-ss-text/85 hover:text-ss-text'
              }`}
            >
              <Route size={13} /> My Path
            </a>
          )}
          {guided && !tier1 && (
            <a
              href="/my-insights"
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition ${
                pathname === '/my-insights'
                  ? 'text-ss-text font-semibold border-b-2 border-ss-orange pb-0.5'
                  : 'text-ss-text/85 hover:text-ss-text'
              }`}
            >
              My Insights
            </a>
          )}
          {/* Dashboard \u2014 only surfaces once the user has actually loaded a
              genome. Positioned right after Start Here so the reload path
              is obvious. */}
          {genomeLoaded && (
            <a
              href="/"
              className={`inline-flex items-center gap-1 ${
                pathname === '/' ? linkActive : linkBase
              }`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </a>
          )}
          <a href="/search" data-tour-target="nav-search" className={linkClass('/search')}>Search</a>

          {/* Guided-mode short nav ends here. The Pillars / Reading List /
              Community / Tools / About items only surface for Explorer users
              so the guided curriculum stays focused. All routes remain
              directly reachable by URL in either mode. */}
          {!guided && (
            <div className="contents">
          {/* Pillars dropdown — click to open, click outside/Escape to close */}
          <div className="relative" ref={pillarsRef}>
            <button
              type="button"
              onClick={() => {
                setPillarsOpen((v) => !v)
                setToolsOpen(false)
                setAboutOpen(false)
              }}
              className={`inline-flex items-center gap-1 ${linkBase}`}
              aria-expanded={pillarsOpen}
              aria-haspopup="menu"
            >
              Pillars <ChevronDown size={14} className={`transition ${pillarsOpen ? 'rotate-180' : ''}`} />
            </button>
            {pillarsOpen && (
              <div
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-2 w-[720px] -translate-x-1/2 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-black/10"
              >
                <div className="grid grid-cols-3 gap-1">
                  {PILLARS.map(({ key, name, Icon, description, route }) => {
                    // Section 5: show a small variant count when a genome
                    // is loaded and this pillar has any recognised variants.
                    const count = genomeLoaded ? pillarCounts[name] || 0 : 0
                    return (
                      <a
                        key={key}
                        href={route || `/search?pillar=${encodeURIComponent(name)}`}
                        onClick={() => setPillarsOpen(false)}
                        className="group flex items-start gap-3 rounded-lg p-3 transition hover:bg-ss-bg"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ss-teal/10 text-ss-teal group-hover:bg-ss-teal group-hover:text-white">
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-1.5 text-sm font-bold leading-tight text-ss-teal">
                            <span className="min-w-0 flex-1 break-words">{name}</span>
                            {count > 0 && (
                              <span
                                className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-ss-orange/15 px-1.5 py-0.5 text-[10px] font-extrabold text-ss-orange"
                                title={`${count} variant${count === 1 ? '' : 's'} recognised in your genome`}
                              >
                                {count}
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-ss-muted">{description}</span>
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <ReadingListNavLink linkClass={linkClass('/reading-list')} />

          <a href="/community" className={linkClass('/community')}>Community</a>

          {/* Tools dropdown — consolidates Biomarkers / Training / Drug Check /
              Populations / Ancestry so the desktop nav doesn't get crowded. */}
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => {
                setToolsOpen((v) => !v)
                setPillarsOpen(false)
                setAboutOpen(false)
              }}
              className={`inline-flex items-center gap-1 ${toolsActive ? linkActive : linkBase}`}
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
            >
              Tools <ChevronDown size={14} className={`transition ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>
            {toolsOpen && (
              <div
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-2 w-[420px] -translate-x-1/2 rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/10"
              >
                {TOOL_ITEMS.map(({ href, label, Icon, blurb }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setToolsOpen(false)}
                    className={`flex items-start gap-3 rounded-lg p-3 transition hover:bg-ss-bg ${
                      pathname === href ? 'bg-ss-bg' : ''
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ss-teal/10 text-ss-teal">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ss-teal">{label}</span>
                      <span className="mt-0.5 block text-[12px] text-ss-muted">{blurb}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* About dropdown: About / Mission / How It Works — same click pattern */}
          <div className="relative" ref={aboutRef}>
            <button
              type="button"
              onClick={() => {
                setAboutOpen((v) => !v)
                setPillarsOpen(false)
                setToolsOpen(false)
              }}
              className={`inline-flex items-center gap-1 ${aboutActive ? linkActive : linkBase}`}
              aria-expanded={aboutOpen}
              aria-haspopup="menu"
            >
              About <ChevronDown size={14} className={`transition ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>
            {aboutOpen && (
              <div role="menu" className="absolute left-1/2 top-full z-50 mt-2 w-[300px] -translate-x-1/2 rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/10">
                {ABOUT_ITEMS.map((it) => (
                  <a
                    key={it.href}
                    href={it.href}
                    onClick={() => setAboutOpen(false)}
                    className={`block rounded-lg p-3 transition hover:bg-ss-bg ${
                      pathname === it.href ? 'bg-ss-bg' : ''
                    }`}
                  >
                    <span className="block text-sm font-bold text-ss-teal">{it.label}</span>
                    <span className="mt-0.5 block text-[12px] text-ss-muted">{it.blurb}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
            </div>
          )}

          <SupportLink pathname={pathname} />
        </nav>

        <div className="flex items-center gap-2">
          {/* Explorer chip — permanent header pill that replaces the
              Journey Guide once the user completes both Tier 1 and
              Tier 2. Renders null otherwise. */}
          <ExplorerChip isDark={isDark} />
          {/* Alert Bell — Genome Alert System. Badge shows unread count. */}
          <AlertBell isDark={isDark} />
          {/* Display prefs (Phase C) — small gear menu with the
              "Show technical terms" toggle. Kept adjacent to the
              other end-of-nav controls so it's discoverable but not
              shouty. Visible on both desktop and mobile so mobile
              users can toggle without opening the drawer. */}
          <PrefsMenu isDark={isDark} />
          {/* Support pill — links to /support which lists Buy Me a Coffee +
              other ways to help. Replaces the standalone Donate button; a
              single call-to-action reduces nav clutter on both desktop
              and mobile. */}
          <a
            href="/support"
            onClick={() => trackEvent(EVENTS.SUPPORT_CLICKED, { source: 'nav_support_mobile' })}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#C45820] text-white shadow-sm transition hover:bg-[#A5471A] md:hidden"
            aria-label="Support SelfScience"
          >
            <Coffee size={15} strokeWidth={2.25} />
          </a>

          <a
            href="/genome"
            className={`hidden rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark ${
              guided ? 'md:hidden' : 'md:inline-flex'
            }`}
          >
            Upload Genome
          </a>

          {/* Mobile menu button \u2014 visible on <md. Complements the bottom
              tab bar so mobile users can reach the full Tools + About +
              Pillars menu without leaving the top of the page. */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={`md:hidden ${isDark ? 'text-white' : 'text-ss-teal'}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-ss-teal text-white md:hidden">
          <nav className="container flex flex-col gap-3 py-4 text-sm">
            <a
              href="/start"
              onClick={() => setMobileOpen(false)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ss-orange px-3 py-1 font-bold text-white shadow-sm"
            >
              ✨ Start Here
            </a>
            {/* Mobile Dashboard link \u2014 top of the drawer when a genome
                is loaded so users on phones don't have to hunt for the
                logo to get back home. */}
            {genomeLoaded && (
              <a
                href="/"
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-semibold text-white hover:bg-white/20"
              >
                <LayoutDashboard size={14} /> Dashboard
              </a>
            )}
            {guided && (
              <a
                href="/my-path"
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-2 font-semibold text-white hover:bg-white/25"
              >
                <Route size={14} /> My Path
              </a>
            )}
            {guided && (
              <a
                href="/my-insights"
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-2 font-semibold text-white hover:bg-white/25"
              >
                My Insights
              </a>
            )}
            <a href="/search" onClick={() => setMobileOpen(false)} className="hover:opacity-80">Search</a>
            <a href="/genome" onClick={() => setMobileOpen(false)} className="hover:opacity-80">{guided ? 'My Data (upload genome)' : 'Upload Genome'}</a>

            {!guided && (
              <div className="contents">
            <a href="/genome"                      onClick={() => setMobileOpen(false)} className="hover:opacity-80">Genome (upload)</a>
            <a href="/genome/overview"             onClick={() => setMobileOpen(false)} className="ml-3 text-white/80 hover:opacity-80">— Overview</a>
            <a href="/genome/findings"             onClick={() => setMobileOpen(false)} className="ml-3 text-white/80 hover:opacity-80">— Findings</a>
            <a href="/genome/strengths"            onClick={() => setMobileOpen(false)} className="ml-3 text-white/80 hover:opacity-80">— Strengths</a>
            <div className="mt-2 border-t border-white/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/60">Tools</div>
            <a href="/blueprint"                   onClick={() => setMobileOpen(false)} className="hover:opacity-80">My Health Blueprint</a>
            <a href="/explore"                     onClick={() => setMobileOpen(false)} className="hover:opacity-80">Explore Your Genes</a>
            <a href="/goals"                       onClick={() => setMobileOpen(false)} className="hover:opacity-80">Health Goals</a>
            <a href="/nutrition"                   onClick={() => setMobileOpen(false)} className="hover:opacity-80">Nutrition Hub</a>
            <a href="/drug-check"                  onClick={() => setMobileOpen(false)} className="hover:opacity-80">Drug Check</a>
            <a href="/tools/supplements"           onClick={() => setMobileOpen(false)} className="hover:opacity-80">Supplement Discovery</a>
            <a href="/biomarkers"                  onClick={() => setMobileOpen(false)} className="hover:opacity-80">Lab Biomarkers</a>
            <a href="/tools/training"              onClick={() => setMobileOpen(false)} className="hover:opacity-80">Training Protocol</a>
            <a href="/population-compare"          onClick={() => setMobileOpen(false)} className="hover:opacity-80">Population Compare</a>
            <a href="/ancestry"                    onClick={() => setMobileOpen(false)} className="hover:opacity-80">Ancestry Report</a>
            <a href="/practitioner-report"         onClick={() => setMobileOpen(false)} className="hover:opacity-80">Practitioner Report</a>
            <a href="/journal"                     onClick={() => setMobileOpen(false)} className="hover:opacity-80">Health Journal</a>
            <a href="/tracker"                     onClick={() => setMobileOpen(false)} className="hover:opacity-80">Habit Tracker</a>
            <a href="/tools/supplements/brands"    onClick={() => setMobileOpen(false)} className="hover:opacity-80">Brand Leaderboard</a>
            <a href="/get-started"                 onClick={() => setMobileOpen(false)} className="hover:opacity-80">Get Started (Kits)</a>

            <div className="mt-2 border-t border-white/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/60">Browse</div>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between hover:opacity-80">
                <span>Pillars</span>
                <ChevronDown size={14} className="transition group-open:rotate-180" />
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1 pl-3 text-[13px]">
                {PILLARS.map((p) => (
                  <a key={p.key} href={p.route || `/search?pillar=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className="py-1 hover:opacity-80">
                    {p.short}
                  </a>
                ))}
              </div>
            </details>
            <a href="/reading-list" onClick={() => setMobileOpen(false)} className="hover:opacity-80">Reading List</a>
            <a href="/community" onClick={() => setMobileOpen(false)} className="hover:opacity-80">Community</a>

            <div className="mt-2 border-t border-white/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/60">About</div>
            <a href="/about"        onClick={() => setMobileOpen(false)} className="py-0.5 hover:opacity-80">About</a>
            <a href="/mission"      onClick={() => setMobileOpen(false)} className="py-0.5 hover:opacity-80">Mission</a>
            <a href="/how-it-works" onClick={() => setMobileOpen(false)} className="py-0.5 hover:opacity-80">How It Works</a>
              </div>
            )}

            <a href="/support" onClick={() => setMobileOpen(false)} className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#C45820] px-4 py-2 text-sm font-semibold text-white">☕ Support SelfScience</a>
          </nav>
        </div>
      )}
    </header>
  )
}

export default SiteNav

/** Reading List link with a small ss-green badge showing saved-item count. */
function ReadingListNavLink({ linkClass }) {
  const count = useSavedCount()
  return (
    <a href="/reading-list" className={`relative ${linkClass}`}>
      <span>Reading List</span>
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-3 inline-flex min-w-[18px] items-center justify-center rounded-full bg-ss-green px-1 font-mono text-[9px] font-bold text-white"
          style={{ height: 18 }}
          aria-label={`${count} saved items`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  )
}

/**
 * "Support" pill for the desktop nav — filled orange to match the site brand.
 * Sends the user to /support (which then links out to Buy Me a Coffee), so we
 * can migrate to Stripe or another provider later without touching the nav.
 */
function SupportLink({ pathname }) {
  const active = pathname === '/support'
  return (
    <a
      href="/support"
      onClick={() => trackEvent(EVENTS.SUPPORT_CLICKED, { source: 'nav_header' })}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition ${
        active ? 'bg-[#A5471A] text-white' : 'bg-[#C45820] text-white hover:bg-[#A5471A]'
      }`}
    >
      <Coffee size={13} />
      Support
    </a>
  )
}
