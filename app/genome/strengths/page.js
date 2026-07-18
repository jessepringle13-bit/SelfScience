'use client'

// Route wrapper for /genome/strengths — filters the genome slice component
// to positive/strength variants only.

import GenomeSlicePage from '@/components/genome/GenomeSlicePage'
export const dynamic = 'force-dynamic'
export default function StrengthsPage() {
  return <GenomeSlicePage mode="strengths" />
}
