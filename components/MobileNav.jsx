'use client'
// /app/components/MobileNav.jsx
// Bottom tab-bar navigation for mobile viewports. Replaces the hamburger menu
// on <768px screens (PWA users are almost always mobile). env(safe-area-inset
// -bottom) handles iPhone notch/home-indicator spacing.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Dna, BookOpen } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',             label: 'Home',   Icon: Home },
  { href: '/search',       label: 'Search', Icon: Search },
  { href: '/genome',       label: 'Genome', Icon: Dna },
  { href: '/reading-list', label: 'Books',  Icon: BookOpen },
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
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition ${
                  active ? 'text-ss-teal font-bold' : 'text-ss-muted hover:text-ss-teal'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
