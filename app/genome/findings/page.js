'use client'

// Route wrapper for /genome/findings — filters the genome slice component
// to awareness/finding variants only.

import GenomeSlicePage from '@/components/genome/GenomeSlicePage'
export const dynamic = 'force-dynamic'
export default function FindingsPage() {
  return <GenomeSlicePage mode="findings" />
}
