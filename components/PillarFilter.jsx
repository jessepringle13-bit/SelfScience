'use client'

// /app/components/PillarFilter.jsx
// Shared pillar-filter UI + hook. Powers the "Showing genes relevant to: X"
// facet on Dashboard, Search and the Genome page.
//
// State is persisted in the URL as `?pillar=<name>` so:
//   * Deep links share the active pillar between tabs and pages
//   * The browser back/forward buttons act as an undo/redo for the filter
//   * Refreshing the page keeps the filter (no localStorage race)
//
// Consumers use:
//   const { pillar, setPillar, clear, isFiltering } = usePillarFilter()
//   <PillarFilter value={pillar} onChange={setPillar} />
//   {isFiltering && <PillarFilterBanner pillar={pillar} onClear={clear} />}

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X, Filter } from 'lucide-react'
import { PILLARS } from '@/components/site-nav'

// Match a URL param value case-insensitively against a canonical pillar name
// so `?pillar=longevity`, `?pillar=Longevity` and `?pillar=LONGEVITY` all
// resolve to the same tile.
export function resolvePillarParam(raw) {
  if (!raw) return null
  const target = String(raw).toLowerCase().trim()
  const match = PILLARS.find(
    (p) =>
      p.name.toLowerCase() === target ||
      p.short.toLowerCase() === target ||
      p.key.toLowerCase() === target,
  )
  return match?.name || null
}

/**
 * Sync a pillar selection to the `?pillar=` URL search-param.
 *
 * Returns:
 *   pillar        — canonical pillar name or `null` when "All pillars".
 *   setPillar(v)  — pass a canonical pillar `name` OR `null` to clear.
 *   clear()       — shortcut for setPillar(null).
 *   isFiltering   — boolean (true when pillar is non-null).
 */
export function usePillarFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pillar = useMemo(
    () => resolvePillarParam(searchParams.get('pillar')),
    [searchParams],
  )

  const setPillar = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!next) {
        params.delete('pillar')
      } else {
        params.set('pillar', next)
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const clear = useCallback(() => setPillar(null), [setPillar])

  return {
    pillar,
    setPillar,
    clear,
    isFiltering: !!pillar,
  }
}

/**
 * Compact <select>-like pillar picker. Renders a chevron button that opens
 * a native <select> menu — the native picker is the best mobile UX and
 * requires no extra deps.
 */
export function PillarFilter({ value, onChange, className = '', label = 'Filter genes by pillar' }) {
  return (
    <label className={`inline-flex items-center gap-2 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-xs font-semibold text-ss-teal shadow-sm ring-1 ring-black/5 ${className}`}>
      <Filter size={13} className="text-ss-muted" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">
        Pillar
      </span>
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="cursor-pointer appearance-none bg-transparent pr-4 text-xs font-semibold text-ss-teal outline-none"
        >
          <option value="">All pillars</option>
          {PILLARS.map((p) => (
            <option key={p.key} value={p.name}>
              {p.short}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ss-muted"
        />
      </div>
    </label>
  )
}

/**
 * Persistent banner that appears above filtered content so the user always
 * knows why the list changed. Includes a single-click clear button.
 */
export function PillarFilterBanner({ pillar, onClear, className = '' }) {
  if (!pillar) return null
  const meta = PILLARS.find((p) => p.name === pillar)
  return (
    <div
      role="status"
      className={`mb-3 flex items-center justify-between gap-3 rounded-lg border border-ss-teal/25 bg-ss-teal/5 px-3 py-2 text-xs ${className}`}
    >
      <div className="flex items-center gap-2 text-ss-teal">
        <Filter size={12} className="shrink-0" aria-hidden="true" />
        <span>
          Showing genes relevant to:{' '}
          <strong className="font-bold">{meta?.short || pillar}</strong>
        </span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 rounded-full border border-ss-teal/40 bg-white px-2 py-0.5 text-[11px] font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
        aria-label="Clear pillar filter"
      >
        <X size={10} /> Clear
      </button>
    </div>
  )
}
