'use client'

// /app/components/SaveButton.jsx
// Universal bookmark/save button — placed in the top-right of any
// content card. Uses lib/readingList.js.

import { Bookmark, BookmarkCheck } from 'lucide-react'
import {
  saveItem, unsaveItem, useIsSaved, fireToast,
  markLimitToastShown, limitToastAlreadyShown,
} from '@/lib/readingList'

export default function SaveButton({ item, className = '' }) {
  const saved = useIsSaved(item?.id)
  if (!item?.id) return null

  const handle = () => {
    if (saved) {
      unsaveItem(item.id)
      fireToast({ message: 'Removed from Reading List', tone: 'muted' })
      return
    }
    const res = saveItem(item)
    if (res.ok) {
      fireToast({
        message: 'Saved to your Reading List',
        tone: 'success',
        href: '/reading-list/saved',
      })
    } else if (res.reason === 'full') {
      if (!limitToastAlreadyShown()) {
        fireToast({
          message: `Your Reading List is full (${res.limit} items). Remove some to save more.`,
          tone: 'warning',
        })
        markLimitToastShown()
      }
    }
  }

  const Icon = saved ? BookmarkCheck : Bookmark
  const label = saved ? 'Saved — view in Reading List' : 'Save for later'

  return (
    <button
      type="button"
      onClick={handle}
      title={label}
      aria-label={label}
      aria-pressed={saved}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
        saved ? 'text-ss-green hover:bg-ss-green/10' : 'text-ss-muted hover:text-ss-teal hover:bg-ss-bg'
      } ${className}`}
    >
      <Icon size={18} strokeWidth={saved ? 2.4 : 2} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
