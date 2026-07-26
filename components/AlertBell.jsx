'use client'

// /app/components/AlertBell.jsx
// Small header pill (nav bell) that shows an unread badge and opens
// the AlertCenterPanel. Kept minimal so it lives peacefully next to
// the PrefsMenu gear.

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/lib/alerts'
import AlertCenterPanel from '@/components/AlertCenterPanel'

export default function AlertBell({ isDark = false }) {
  const [open, setOpen] = useState(false)
  const unread = useUnreadCount()

  const btnClass = isDark
    ? 'text-white/80 hover:text-white'
    : 'text-ss-muted hover:text-ss-teal'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread > 0 ? `Alerts — ${unread} unread` : 'Alerts'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${btnClass}`}
      >
        <Bell size={16} strokeWidth={2} />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-ss-orange px-1 font-mono text-[9px] font-extrabold text-white shadow-sm"
            style={{ height: 16 }}
            aria-hidden="true"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <AlertCenterPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
