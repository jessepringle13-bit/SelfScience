'use client'
import { FlaskConical } from 'lucide-react'

export default function CategoryStrip({ goal, selectedCategoryId, onSelect }) {
  if (!goal) return null
  return (
    <div className="rounded-2xl border border-[#1B474D]/10 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-[#1B474D]" />
        <h3 className="text-lg font-semibold text-[#1B474D]">Research-backed categories for {goal.label}</h3>
      </div>
      <p className="text-sm text-slate-600 mt-1">
        Tap a category to see supplement products from the NIH label database, ranked by ingredient FORM (not marketing).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {goal.categories.map((c) => {
          const selected = c.id === selectedCategoryId
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect?.(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                selected
                  ? 'border-[#1B474D] bg-[#1B474D] text-white shadow'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-[#1B474D] hover:text-[#1B474D]'
              }`}
              title={c.notes}
            >
              {c.label}
            </button>
          )
        })}
      </div>
      {selectedCategoryId && (
        <p className="mt-3 text-xs italic text-slate-500">
          {goal.categories.find((c) => c.id === selectedCategoryId)?.notes}
        </p>
      )}
    </div>
  )
}
