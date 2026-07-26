'use client'

// /app/components/explore/FocusOnThisGene.jsx
// Small, unobtrusive link that appears in the footer of every finding
// card platform-wide. Clicking navigates to /explore/<id> where the
// user can deep-dive on this one variant in Focus Mode.
//
// Accepts a genome-report-shaped card ({rsid, gene}) and derives the
// finding ID (rsid lowercased or slugified gene fallback).

import Link from 'next/link'
import { Focus } from 'lucide-react'
import { findingIdFor } from '@/lib/explore'

export default function FocusOnThisGene({ card, className = '' }) {
  if (!card || (!card.rsid && !card.gene)) return null
  const id = findingIdFor(card)
  return (
    <Link
      href={`/explore/${id}`}
      className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ss-teal transition hover:underline ${className}`}
      title="Open this finding in Focus Mode"
    >
      <Focus size={10} strokeWidth={2.4} /> Focus on this gene →
    </Link>
  )
}
