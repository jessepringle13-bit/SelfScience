'use client'
// Curated vs All-products view toggle. Segmented control style.
import { LayoutList, Rows } from 'lucide-react'

export default function ViewToggle({ value, onChange, curatedCount, totalCount }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('curated')}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
          value === 'curated'
            ? 'bg-[#1B474D] text-white shadow-sm'
            : 'text-slate-600 hover:text-[#1B474D]'
        }`}
        aria-pressed={value === 'curated'}
      >
        <Rows className="h-4 w-4" />
        Curated
        {typeof curatedCount === 'number' && (
          <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${value === 'curated' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{curatedCount}</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
          value === 'all'
            ? 'bg-[#1B474D] text-white shadow-sm'
            : 'text-slate-600 hover:text-[#1B474D]'
        }`}
        aria-pressed={value === 'all'}
      >
        <LayoutList className="h-4 w-4" />
        All products
        {typeof totalCount === 'number' && (
          <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${value === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{totalCount}</span>
        )}
      </button>
    </div>
  )
}
