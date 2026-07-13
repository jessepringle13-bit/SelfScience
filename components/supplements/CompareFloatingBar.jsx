'use client'
// Floating compare pill anchored bottom-centre when the user has selected
// >=1 products from the results grid.
import { useCompare } from './CompareContext'
import { Scale, X } from 'lucide-react'

export default function CompareFloatingBar() {
  const { items, clear, setOpen } = useCompare()
  if (!items?.length) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full bg-[#1B474D] text-white shadow-2xl border border-white/10 pl-4 pr-1 py-1 flex items-center gap-2">
      <Scale className="h-4 w-4" />
      <span className="text-sm font-semibold">Compare ({items.length})</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={items.length < 2}
        className="ml-2 rounded-full bg-[#C45820] hover:bg-[#a94a1a] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold"
      >
        {items.length < 2 ? 'Add 1 more to compare' : 'Open comparison'}
      </button>
      <button
        type="button"
        onClick={clear}
        className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        title="Clear comparison list"
        aria-label="Clear"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
