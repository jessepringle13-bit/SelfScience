'use client'

// Route wrapper for /genome/overview. All logic + rendering lives in the
// shared GenomeSlicePage component so the three genome slice pages stay
// consistent.

import GenomeSlicePage from '@/components/genome/GenomeSlicePage'
export const dynamic = 'force-dynamic'
export default function OverviewPage() {
  return <GenomeSlicePage mode="overview" />
}
