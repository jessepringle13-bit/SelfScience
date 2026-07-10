'use client'

import { Coffee, Heart } from 'lucide-react'
import { trackEvent, EVENTS } from '@/lib/analytics'

/**
 * Support / donation button that opens Buy Me a Coffee in a new tab.
 * If NEXT_PUBLIC_BMC_URL is not yet configured, falls back to the /support page
 * so the flow never breaks while the BMC account is being created.
 *
 * Variants:
 *   'nav'      -> subtle inline link with coffee icon (fits the desktop nav row)
 *   'footer'   -> pill button with tinted background for the footer CTA card
 *   'hero'     -> large primary orange button for /support page
 *   'ghost'    -> outlined variant for secondary spots
 */
export default function SupportButton({
  variant = 'nav',
  source = 'unknown',
  label,
  className = '',
}) {
  const bmc = process.env.NEXT_PUBLIC_BMC_URL
  const href = bmc && bmc.startsWith('http') ? bmc : '/support'
  const isExternal = href.startsWith('http')

  const onClick = () => {
    trackEvent(EVENTS.SUPPORT_CLICKED, { source })
  }

  const common = {
    onClick,
    href,
    ...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }

  if (variant === 'hero') {
    return (
      <a
        {...common}
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#C45820] px-7 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#A5471A] ${className}`}
      >
        <Coffee size={18} />
        {label || 'Buy me a coffee'}
      </a>
    )
  }

  if (variant === 'footer') {
    return (
      <a
        {...common}
        className={`inline-flex items-center gap-2 rounded-full bg-[#C45820] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#A5471A] ${className}`}
      >
        <Heart size={13} />
        {label || 'Support SelfScience'}
      </a>
    )
  }

  if (variant === 'ghost') {
    return (
      <a
        {...common}
        className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1B474D] px-6 py-3 text-sm font-semibold text-[#1B474D] transition hover:bg-[#1B474D] hover:text-white ${className}`}
      >
        <Heart size={14} />
        {label || 'Support SelfScience'}
      </a>
    )
  }

  // Default: nav variant — subtle text link with icon
  return (
    <a
      {...common}
      className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}
    >
      <Coffee size={14} />
      {label || 'Support'}
    </a>
  )
}
