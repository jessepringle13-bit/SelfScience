'use client'
// /app/components/MobileNav.jsx
// Bottom tab-bar navigation for mobile viewports. Complements the top
// hamburger menu — the "Tools" tab dispatches an event that opens the
// full drawer from SiteNav so users can reach every tool without the
// bottom bar becoming a scroll-bar. env(safe-area-inset-bottom) handles
// iPhone notch/home-indicator spacing.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Dna, Wrench } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',       label: 'Home',   Icon: Home },
  { href: '/search', label: 'Search', Icon: Search },
  { href: '/genome', label: 'Genome', Icon: Dna },
  // "Tools" is not a route — tapping it opens the site-wide mobile drawer
  // where users can pick Nutrition, Biomarkers, Drug Check, Ancestry, etc.
  { key: 'tools',    label: 'Tools',  Icon: Wrench, action: 'open-tools' },
]

export default function MobileNav() {
  const pathname = usePathname() || '/'
  return (
    <nav
      aria-label="Primary"
      className="ss-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-ss-border-warm bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ href, key, label, Icon, action }) => {
          const active = href ? (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')) : false
          const commonCls = `flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition w-full ${
            active ? 'text-ss-teal font-bold' : 'text-ss-muted hover:text-ss-teal'
          }`
          return (
            <li key={href || key} className="flex-1">
              {action === 'open-tools' ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('selfscience:open-mobile-menu'))}
                  className={commonCls}
                  aria-label="Open tools menu"
                >
                  <Icon size={20} strokeWidth={2} />
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
  )
}
