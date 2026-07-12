'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

/**
 * Sticky, dismissible disclaimer banner shown on Terms and Privacy pages.
 * Persists dismissal in sessionStorage for the current tab only.
 */
export default function DisclaimerBanner({
  storageKey = 'ss:legal-disclaimer',
  message = 'SelfScience is for educational purposes only. Not medical advice.',
}) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(storageKey) === '1'
      setHidden(dismissed)
    } catch {
      setHidden(false)
    }
  }, [storageKey])

  if (hidden) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {
      /* storage disabled — non-fatal */
    }
    setHidden(true)
  }

  return (
    <div className="sticky top-16 z-40 bg-[#EEF7F7] text-[#1B474D] ring-1 ring-[#1B474D]/10">
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-6 py-2.5 text-[13px] font-medium md:text-sm">
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss disclaimer"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#1B474D] transition hover:bg-[#1B474D]/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
