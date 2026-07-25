'use client'

// /app/components/JournalFloatingButton.jsx
// Fixed bottom-left pencil FAB that opens the journal entry modal.
// Scoped to a small set of pages (Dashboard, Genome results, Search,
// Training Blueprint) so it appears only where users are actively
// engaging with their health data.

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PenLine } from 'lucide-react'
import JournalEntryModal from '@/components/JournalEntryModal'

const ALLOWED_PREFIXES = ['/', '/genome', '/search', '/tools/training']

function pathAllowed(pathname) {
  if (!pathname) return false
  if (pathname === '/') return true
  return ALLOWED_PREFIXES.some((p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/')))
}

export default function JournalFloatingButton() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Also allow other components (e.g. the widget) to open the modal
  // via a custom event without needing a prop drill.
  useEffect(() => {
    const onOpen = (e) => {
      setOpen(true)
      // event.detail may include a preset type / searchQuery
      if (e?.detail) window.__ss_journal_preset = e.detail
    }
    window.addEventListener('selfscience:journal-open', onOpen)
    return () => window.removeEventListener('selfscience:journal-open', onOpen)
  }, [])

  if (!mounted) return null
  if (!pathAllowed(pathname)) return null

  return (
    <>
      <button
        type="button"
        aria-label="Add journal entry"
        title="Journal a thought"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ss-teal text-white shadow-lg ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:bg-ss-teal-dark md:bottom-6"
      >
        <PenLine size={20} strokeWidth={2} />
      </button>
      {open && (
        <JournalEntryModal
          preset={typeof window !== 'undefined' ? window.__ss_journal_preset : null}
          onClose={() => {
            setOpen(false)
            if (typeof window !== 'undefined') window.__ss_journal_preset = null
          }}
        />
      )}
    </>
  )
}
