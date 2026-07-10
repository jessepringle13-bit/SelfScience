'use client'

import { usePathname } from 'next/navigation'
import { Heart } from 'lucide-react'
import SupportButton from '@/components/support-button'

const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/mission', label: 'Mission' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/reading-list', label: 'Reading List' },
  { href: '/support', label: 'Support' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

export default function SiteFooter() {
  const pathname = usePathname() || ''
  return (
    <footer className="bg-[#0F2C30] text-white/70">
      {/* Support callout */}
      <div className="border-b border-white/10">
        <div className="container flex flex-col items-start justify-between gap-4 py-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3 text-sm">
            <Heart size={16} className="text-[#C45820]" />
            <span>
              <span className="font-semibold text-white">Support our work.</span>{' '}
              <span className="text-white/70">
                Every contribution helps keep SelfScience free of ads, affiliate links, and sponsored studies.
              </span>
            </span>
          </div>
          <SupportButton variant="footer" source="footer_cta" />
        </div>
      </div>

      {/* Bottom links row */}
      <div className="container flex flex-col items-start justify-between gap-4 py-6 text-xs md:flex-row md:items-center">
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
