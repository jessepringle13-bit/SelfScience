'use client'
// /app/components/MobileNav.jsx
// Bottom tab-bar navigation for mobile viewports. The top-right hamburger
// (in site-nav.jsx) is the *global* nav drawer (Pillars, About, Search, etc).
// The bottom "Tools" tab is intentionally scoped — it opens a dedicated
// bottom sheet that lists ONLY the deep-dive tools with a description for
// each, so users can pick a tool without wading through the whole menu.
// env(safe-area-inset-bottom) handles iPhone notch/home-indicator spacing.

import { useEffect } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Dna,
  Wrench,
  X,
  Apple,
  TestTube2,
  Activity,
  Pill,
  Globe2,
  Compass,
  FileText,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',       label: 'Home',   Icon: Home },
  { href: '/search', label: 'Search', Icon: Search },
  { href: '/genome', label: 'Genome', Icon: Dna },
  // "Tools" is not a route — tapping it opens a dedicated bottom sheet
  // listing tools + descriptions (distinct from the global hamburger drawer).
  { key: 'tools',    label: 'Tools',  Icon: Wrench, action: 'open-tools' },
]

// Same list as the desktop Tools dropdown in site-nav.jsx, but with slightly
// more descriptive blurbs suited to the mobile sheet where users have more
// vertical real estate to read.
const TOOL_ITEMS = [
  {
    href: '/nutrition',
    label: 'Nutrition Hub',
    Icon: Apple,
    blurb: 'Scan a barcode, log your day, and see foods matched to your genome.',
  },
  {
    href: '/biomarkers',
    label: 'Biomarker Panel',
    Icon: TestTube2,
    blurb: 'Log blood work and see which of your genes match each marker.',
  },
  {
    href: '/training',
    label: 'Training Protocol',
    Icon: Activity,
    blurb: 'Personalised training zones and sport affinity based on your DNA.',
  },
  {
    href: '/drug-check',
    label: 'Drug Check',
    Icon: Pill,
    blurb: 'Pharmacogenomic guidance for common medications and supplements.',
  },
  {
    href: '/population-compare',
    label: 'Population Compare',
    Icon: Globe2,
    blurb: 'See how your variants compare to global population frequencies.',
  },
  {
    href: '/ancestry',
    label: 'Ancestry Report',
    Icon: Compass,
    blurb: 'A rough educational ancestry sketch from your uploaded genome.',
  },
  {
    href: '/practitioner-report',
    label: 'Practitioner Report',
    Icon: FileText,
    blurb: 'Print-ready summary you can hand to your clinician.',
  },
]

export default function MobileNav() {
  const pathname = usePathname() || '/'
  const [toolsOpen, setToolsOpen] = useState(false)

  // Close on Escape.
  useEffect(() => {
    if (!toolsOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setToolsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toolsOpen])

  // Prevent body scroll while the sheet is open so the tools list scrolls
  // instead of the page underneath.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (toolsOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [toolsOpen])

  // Close the sheet automatically when the user navigates to a new route
  // (they tapped a tool link inside the sheet).
  useEffect(() => {
    setToolsOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        aria-label="Primary"
        className="ss-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-ss-border-warm bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex">
          {NAV_ITEMS.map(({ href, key, label, Icon, action }) => {
            const active = href
              ? (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'))
              : (action === 'open-tools' && toolsOpen)
            const commonCls = `flex w-full flex-col items-center gap-1 py-2 text-[10px] font-medium transition ${
              active ? 'text-ss-teal font-bold' : 'text-ss-muted hover:text-ss-teal'
            }`
            return (
              <li key={href || key} className="flex-1">
                {action === 'open-tools' ? (
                  <button
                    type="button"
                    onClick={() => setToolsOpen((v) => !v)}
                    className={commonCls}
                    aria-label="Open tools menu"
                    aria-expanded={toolsOpen}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </button>
                ) : (
                  <Link href={href} className={commonCls}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Dedicated Tools bottom sheet — mobile only. */}
      {toolsOpen && (
        <div className="md:hidden" role="dialog" aria-modal="true" aria-label="Tools">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close tools menu"
            onClick={() => setToolsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          {/* Sheet */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-ss-border-warm bg-white shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            {/* Drag handle */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ss-border-warm bg-white/95 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ss-teal/10 text-ss-teal">
                  <Wrench size={16} />
                </span>
                <div>
                  <div className="text-sm font-bold text-ss-teal">Tools</div>
                  <div className="text-[11px] text-ss-muted">Pick a deep-dive tool</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                className="rounded-full p-1.5 text-ss-muted transition hover:bg-ss-bg hover:text-ss-teal"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <ul className="divide-y divide-ss-border-warm/60">
              {TOOL_ITEMS.map(({ href, label, Icon, blurb }) => {
                const active = pathname === href
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setToolsOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 transition active:bg-ss-bg ${
                        active ? 'bg-ss-bg' : ''
                      }`}
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ss-teal/10 text-ss-teal">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-ss-teal">{label}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-ss-muted">
                          {blurb}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
