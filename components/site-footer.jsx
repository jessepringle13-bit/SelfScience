'use client'

import { usePathname } from 'next/navigation'

const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/mission', label: 'Mission' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/reading-list', label: 'Reading List' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

export default function SiteFooter() {
  const pathname = usePathname() || ''
  return (
    <footer className="bg-[#0F2C30] py-8 text-white/70">
      <div className="container flex flex-col items-start justify-between gap-4 text-xs md:flex-row md:items-center">
        <div>
          &copy; {new Date().getFullYear()} SelfScience. Educational only. Not medical advice.
        </div>
        <nav className="flex flex-wrap gap-5">
          {FOOTER_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`hover:text-white ${
                pathname === l.href ? 'font-bold text-white' : ''
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
