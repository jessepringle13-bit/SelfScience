'use client'
// Inline confirmation prompt for the compare-mode family conflict.
// Renders as a centred modal when CompareContext.pendingConflict is set.
// User chooses: Keep both / Replace old list / Cancel.
import { useEffect } from 'react'
import { useCompare } from './CompareContext'
import { AlertTriangle, X } from 'lucide-react'

export default function CompareConflictDialog() {
  const { pendingConflict, acceptConflictReplace, acceptConflictKeepBoth, dismissConflict } = useCompare()

  useEffect(() => {
    if (!pendingConflict) return
    const onKey = (e) => { if (e.key === 'Escape') dismissConflict() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingConflict, dismissConflict])

  if (!pendingConflict) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={dismissConflict} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <header className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 bg-amber-50">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-700 shrink-0" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-amber-800 font-semibold">Different ingredient family</div>
            <h3 className="text-base font-semibold text-slate-900">
              Comparing across families
            </h3>
          </div>
          <button onClick={dismissConflict} className="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-5 py-4 text-sm text-slate-700 space-y-2 leading-snug">
          <p>
            Your compare list is on <strong>{pendingConflict.prevFamily}</strong>, but you just added a
            product from <strong>{pendingConflict.newFamily}</strong>.
          </p>
          <p className="text-xs text-slate-600">
            Cross-family compares can feel like apples-to-oranges (different serving formats, dosing units, evidence bases). What would you like to do?
          </p>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismissConflict}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={acceptConflictReplace}
            className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-300 hover:border-[#1B474D] hover:text-[#1B474D] text-slate-700 text-xs font-semibold px-3 py-1.5"
          >
            Replace old list
          </button>
          <button
            type="button"
            onClick={acceptConflictKeepBoth}
            className="inline-flex items-center gap-1 rounded-lg bg-[#1B474D] hover:bg-[#0f2f34] text-white text-xs font-semibold px-3 py-1.5"
          >
            Keep both anyway
          </button>
        </div>
      </div>
    </div>
  )
}
