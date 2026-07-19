'use client'

// /app/components/DashboardBackLink.jsx
// Small reusable "← Dashboard" back link for every page reachable from the
// Dashboard. Muted, subtle, but has a 44px min touch target on mobile so
// it's still comfortably tappable.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DashboardBackLink({ className = '' }) {
  return (
    <div className={className}>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 py-2 text-sm text-ss-muted transition hover:text-ss-teal"
      >
        <ArrowLeft size={14} />
        <span className="font-medium">Dashboard</span>
      </Link>
    </div>
  )
}
