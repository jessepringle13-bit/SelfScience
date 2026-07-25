'use client'

// /app/components/FirstVisitBanner.jsx
// Reusable "First time here?" contextual banner shown once per page on
// the user's first visit. Storage keys are ss_visited_<page>. Set on
// first mount; the banner stays until the user dismisses it via the X
// or the action button — both cause a permanent hide.
//
// Design tokens (all Tailwind, kept in sync with the rest of the app):
//   surface  : bg-[rgba(14,122,110,0.08)]   (matches --ss-teal 0.08)
//   border   : border border-ss-teal/25
//   accent   : border-l-[3px] border-ss-green
//   radius   : rounded-xl
//   pad      : px-4 py-3.5
//   text     : text-ss-text  (spec: --ss-text-primary)
//   button   : bg-ss-green text-white rounded-full px-4 py-1.5
//   dismiss  : text-ss-muted top-right

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function FirstVisitBanner({
  storageKey,
  Icon,
  text,
  buttonText,
  onAction,
  ariaLabel,
}) {
  const [visible, setVisible] = useState(false)

  // Mount check + immediate LS write per spec:
  //   "Set the localStorage key to true on first visit immediately"
  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return
    try {
      if (window.localStorage.getItem(storageKey) === '1') {
        setVisible(false)
      } else {
        window.localStorage.setItem(storageKey, '1')
        setVisible(true)
      }
    } catch { /* noop */ }
  }, [storageKey])

  const dismiss = () => setVisible(false)
  const handleAction = () => {
    try { if (typeof onAction === 'function') onAction() } catch {}
    dismiss()
  }

  if (!visible) return null

  return (
    <div
      role="note"
      aria-label={ariaLabel || 'First visit tip'}
      // Stacks on mobile (<sm), horizontal on ≥sm. X is absolute-top-right
      // on both. Accent left border via border-l-[3px].
      className="relative mb-6 flex flex-col items-start gap-3 rounded-xl border border-ss-teal/25 border-l-[3px] border-l-ss-green bg-[rgba(14,122,110,0.08)] px-4 py-3.5 sm:flex-row sm:items-center sm:gap-3 sm:px-[18px]"
    >
      {Icon && (
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/70 text-ss-teal" aria-hidden="true">
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      <p className="min-w-0 flex-1 pr-8 text-[0.93rem] leading-snug text-ss-text sm:pr-0">
        {text}
      </p>
      {buttonText && (
        <button
          type="button"
          onClick={handleAction}
          aria-label={buttonText}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-ss-green px-4 py-1.5 text-[0.85rem] font-semibold text-white shadow-sm transition hover:bg-ss-green/90 sm:w-auto"
        >
          {buttonText}
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="First visit tip — dismiss"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-ss-muted hover:bg-white/50 hover:text-ss-teal"
      >
        <X size={16} />
      </button>
    </div>
  )
}
