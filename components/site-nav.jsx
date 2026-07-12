'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Coffee, DollarSign } from 'lucide-react'
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
} from 'lucide-react'
import { trackEvent, EVENTS } from '@/lib/analytics'

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
  { key: 'pediatric',          name: 'Pediatric & Youth Wellness',      short: 'Youth Wellness',    Icon: Baby,      description: 'Growth, development, nutrition, sleep, ADHD, allergies, and the research shaping children\u2019s health from infancy through adolescence.', route: '/pillars/youth' },
]

export function SiteNav({ variant = 'light' }) {
  const isDark = variant === 'dark'
  const pathname = usePathname() || ''
  const [pillarsOpen, setPillarsOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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

  const base = isDark
    ? 'border-white/15 bg-ss-teal/40 backdrop-blur-md text-white'
    : 'border-ss-border-warm bg-white text-ss-text'
  const linkBase = isDark ? 'text-white/85 hover:text-white' : 'text-ss-text hover:text-ss-teal'
  const linkActive = isDark ? 'text-white font-semibold' : 'text-ss-teal font-semibold'
  const wordmarkClass = isDark ? 'text-white' : 'text-ss-teal'
  const linkClass = (href) => (pathname === href ? linkActive : linkBase)
  const ABOUT_ITEMS = [
    { href: '/about',         label: 'About',         blurb: 'The story behind the platform.' },
    { href: '/mission',       label: 'Mission',       blurb: 'Why SelfScience exists.' },
    { href: '/how-it-works',  label: 'How It Works',  blurb: 'A tour under the hood.' },
  ]
  const aboutActive = ABOUT_ITEMS.some((i) => i.href === pathname)
  // Deep-dive tools that used to live as individual header links. Grouped
  // under a single "Tools" dropdown so the desktop nav stays scannable.
  // On mobile the drawer still lists them individually so nothing is hidden.
  const TOOL_ITEMS = [
    { href: '/nutrition',           label: 'Nutrition Hub',        Icon: Apple,     blurb: 'Genomic food, journal & product scanner.' },
    { href: '/biomarkers',         label: 'Biomarkers',        Icon: TestTube2, blurb: 'Log blood work + genome correlations.' },
    { href: '/training',           label: 'Training Protocol', Icon: Activity,  blurb: 'Zone-based training + sport affinity.' },
    { href: '/drug-check',         label: 'Drug Check',        Icon: Pill,      blurb: 'Pharmacogenomic guidance by medication.' },
    { href: '/population-compare', label: 'Population Compare',Icon: Globe2,    blurb: 'How your variants compare globally.' },
    { href: '/ancestry',            label: 'Ancestry Report',      Icon: Compass,   blurb: 'A rough educational ancestry sketch.' },
    { href: '/practitioner-report', label: 'Practitioner Report',  Icon: FileText,  blurb: 'Print-ready summary for your clinician.' },
  ]
  const toolsActive = TOOL_ITEMS.some((i) => i.href === pathname)

  return (
    <header className={`absolute inset-x-0 top-0 z-40 border-b ${base}`}>
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
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold text-ss-orange transition hover:bg-ss-orange/10 ${
              pathname === '/start' ? 'bg-ss-orange/10' : ''
            }`}
          >
            Start Here
          </a>
          <a href="/search" className={linkClass('/search')}>Search</a>

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
                className="absolute left-1/2 top-full z-50 mt-2 w-[640px] -translate-x-1/2 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-black/10"
              >
                <div className="grid grid-cols-3 gap-1">
                  {PILLARS.map(({ key, name, Icon, description, route }) => (
                    <a
                      key={key}
                      href={route || `/search?pillar=${encodeURIComponent(name)}`}
                      onClick={() => setPillarsOpen(false)}
                      className="group flex items-start gap-3 rounded-lg p-3 transition hover:bg-ss-bg"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ss-teal/10 text-ss-teal group-hover:bg-ss-teal group-hover:text-white">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-ss-teal">{name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-ss-muted">{description}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a href="/reading-list" className={linkClass('/reading-list')}>Reading List</a>

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

          <SupportLink pathname={pathname} />
        </nav>

        <div className="flex items-center gap-2">
          {/* Donate — desktop: icon + label pill. Links straight to Buy Me a
              Coffee so donors don't need an intermediate hop through /support.
              This is deliberately distinct from the "Support" nav link, which
              still points to the internal /support page (roadmap, ways to help
              beyond money, etc.). Yellow/amber to match the "coin" ask and
              differentiate from the orange "Upload Genome" primary CTA. */}
          <a
            href="https://buymeacoffee.com/selfscience"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.SUPPORT_CLICKED, { source: 'nav_donate_desktop' })}
            className="hidden items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-sm ring-1 ring-amber-500/40 transition hover:bg-amber-300 md:inline-flex"
            aria-label="Donate on Buy Me a Coffee"
          >
            <DollarSign size={13} strokeWidth={2.5} />
            Donate
          </a>

          <a
            href="/genome"
            className="hidden rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark md:inline-flex"
          >
            Upload Genome
          </a>

          {/* Mobile-only Donate icon button — placed next to the hamburger per
              the user's request. Icon-only to keep the header uncluttered on
              small viewports. Yellow "coin" for scannability. */}
          <a
            href="https://buymeacoffee.com/selfscience"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.SUPPORT_CLICKED, { source: 'nav_donate_mobile' })}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-500/40 transition hover:bg-amber-300 md:hidden"
            aria-label="Donate on Buy Me a Coffee"
          >
            <DollarSign size={16} strokeWidth={2.75} />
          </a>

          {/* Mobile menu button — visible on <md. Complements the bottom
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
            <a href="/search" onClick={() => setMobileOpen(false)} className="hover:opacity-80">Search</a>
            <a href="/genome" onClick={() => setMobileOpen(false)} className="hover:opacity-80">Upload Genome</a>

            <div className="mt-2 border-t border-white/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/60">Tools</div>
            <a href="/nutrition"           onClick={() => setMobileOpen(false)} className="hover:opacity-80">Nutrition Hub</a>
            <a href="/biomarkers"          onClick={() => setMobileOpen(false)} className="hover:opacity-80">Biomarkers</a>
            <a href="/training"            onClick={() => setMobileOpen(false)} className="hover:opacity-80">Training</a>
            <a href="/drug-check"          onClick={() => setMobileOpen(false)} className="hover:opacity-80">Drug Check</a>
            <a href="/population-compare"  onClick={() => setMobileOpen(false)} className="hover:opacity-80">Populations</a>
            <a href="/ancestry"            onClick={() => setMobileOpen(false)} className="hover:opacity-80">Ancestry</a>
            <a href="/practitioner-report" onClick={() => setMobileOpen(false)} className="hover:opacity-80">Practitioner Report</a>

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

            <div className="mt-2 border-t border-white/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/60">About</div>
            <a href="/about"        onClick={() => setMobileOpen(false)} className="py-0.5 hover:opacity-80">About</a>
            <a href="/mission"      onClick={() => setMobileOpen(false)} className="py-0.5 hover:opacity-80">Mission</a>
            <a href="/how-it-works" onClick={() => setMobileOpen(false)} className="py-0.5 hover:opacity-80">How It Works</a>

            <a href="/support" onClick={() => setMobileOpen(false)} className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#C45820] px-4 py-2 text-sm font-semibold text-white">☕ Support SelfScience</a>
          </nav>
        </div>
      )}
    </header>
  )
}

export default SiteNav

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
