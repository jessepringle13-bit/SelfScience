'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Coffee } from 'lucide-react'
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
  { key: 'pediatric',          name: 'Pediatric & Youth Wellness',      short: 'Youth Wellness',    Icon: Baby,      description: 'Growth, development, nutrition, sleep, ADHD, allergies, and the research shaping children\u2019s health from infancy through adolescence.' },
]

export function SiteNav({ variant = 'light' }) {
  const isDark = variant === 'dark'
  const pathname = usePathname() || ''
  const [pillarsOpen, setPillarsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close dropdown on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setPillarsOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const base = isDark
    ? 'border-white/15 bg-ss-teal/40 backdrop-blur-md text-white'
    : 'border-ss-border-warm bg-white text-ss-text'
  const linkBase = isDark ? 'text-white/85 hover:text-white' : 'text-ss-text hover:text-ss-teal'
  const linkActive = isDark ? 'text-white font-semibold' : 'text-ss-teal font-semibold'
  const wordmarkClass = isDark ? 'text-white' : 'text-ss-teal'
  const linkClass = (href) => (pathname === href ? linkActive : linkBase)

  return (
    <header className={`absolute inset-x-0 top-0 z-40 border-b ${base}`}>
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className={`flex items-center gap-2 text-xl font-extrabold tracking-tight ${wordmarkClass}`}>
          <span className="inline-block h-2 w-2 rounded-full bg-ss-orange" />
          SelfScience
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="/" className={linkClass('/')}>Home</a>
          <a href="/search" className={linkClass('/search')}>Search</a>
          <a href="/genome" className={linkClass('/genome')}>Upload Genome</a>

          {/* Pillars dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setPillarsOpen(true)}
            onMouseLeave={() => setPillarsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPillarsOpen((v) => !v)}
              className={`inline-flex items-center gap-1 ${linkBase}`}
              aria-expanded={pillarsOpen}
            >
              Pillars <ChevronDown size={14} className={`transition ${pillarsOpen ? 'rotate-180' : ''}`} />
            </button>
            {pillarsOpen && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-[640px] -translate-x-1/2 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
                <div className="grid grid-cols-3 gap-1">
                  {PILLARS.map(({ key, name, Icon, description }) => (
                    <a
                      key={key}
                      href={`/search?pillar=${encodeURIComponent(name)}`}
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
          <a href="/about" className={linkClass('/about')}>About</a>
          <a href="/mission" className={linkClass('/mission')}>Mission</a>
          <a href="/how-it-works" className={linkClass('/how-it-works')}>How It Works</a>
          <SupportLink isDark={isDark} pathname={pathname} />
        </nav>

        <a
          href="/genome"
          className="hidden rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark md:inline-flex"
        >
          Upload Genome
        </a>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={`md:hidden ${isDark ? 'text-white' : 'text-ss-teal'}`}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-ss-teal text-white md:hidden">
          <nav className="container flex flex-col gap-3 py-4 text-sm">
            <a href="/" className="hover:opacity-80">Home</a>
            <a href="/search" className="hover:opacity-80">Search</a>
            <a href="/genome" className="hover:opacity-80">Upload Genome</a>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between hover:opacity-80">
                <span>Pillars</span>
                <ChevronDown size={14} className="transition group-open:rotate-180" />
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1 pl-3 text-[13px]">
                {PILLARS.map((p) => (
                  <a key={p.key} href={`/search?pillar=${encodeURIComponent(p.name)}`} className="py-1 hover:opacity-80">
                    {p.short}
                  </a>
                ))}
              </div>
            </details>
            <a href="/reading-list" className="hover:opacity-80">Reading List</a>
            <a href="/about" className="hover:opacity-80">About</a>
            <a href="/mission" className="hover:opacity-80">Mission</a>
            <a href="/how-it-works" className="hover:opacity-80">How It Works</a>
            <a href="/support" className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#C45820] px-4 py-2 text-sm font-semibold text-white">☕ Support SelfScience</a>
          </nav>
        </div>
      )}
    </header>
  )
}

export default SiteNav

/**
 * Subtle "Support" pill for the desktop nav. Sends the user to /support
 * (which then explains the mission + links to Buy Me a Coffee), so we can
 * migrate to Stripe or another provider later without touching the nav.
 */
function SupportLink({ isDark, pathname }) {
  const active = pathname === '/support'
  const base = isDark
    ? 'border-white/30 text-white hover:bg-white/10'
    : 'border-[#C45820]/40 text-[#C45820] hover:bg-[#C45820] hover:text-white'
  const activeCls = isDark ? 'bg-white/10 text-white' : 'bg-[#C45820] text-white'
  return (
    <a
      href="/support"
      onClick={() => trackEvent(EVENTS.SUPPORT_CLICKED, { source: 'nav_header' })}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active ? activeCls : base
      }`}
    >
      <Coffee size={13} />
      Support
    </a>
  )
}
