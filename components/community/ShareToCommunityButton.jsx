'use client'

// /app/components/community/ShareToCommunityButton.jsx
// Compact affordance rendered on journal entries and finding cards.
// Auto-hides for non-opted-in users. Uses monospace micro-copy per spec.

import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import { isOptedIn, CHANGE_EVENT } from '@/lib/community'
import ShareToCommunityModal from './ShareToCommunityModal'

export default function ShareToCommunityButton({ initialText, pillar, label }) {
  const [opted, setOpted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const load = () => setOpted(isOptedIn())
    load()
    window.addEventListener(CHANGE_EVENT, load)
    return () => window.removeEventListener(CHANGE_EVENT, load)
  }, [])

  if (!opted) return null
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-ss-teal hover:text-ss-teal-dark hover:underline"
        style={{ letterSpacing: '0.02em' }}
      >
        <Share2 size={11} />
        {label || 'Share to community'}
      </button>
      {open && (
        <ShareToCommunityModal
          initialText={initialText || ''}
          pillar={pillar || null}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
