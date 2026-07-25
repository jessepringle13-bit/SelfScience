'use client'

// /app/components/search/SearchPrompts.jsx
// "You might be wondering…" pre-built question chips shown below the
// search bar when the box is empty. Disappears the moment the user
// types or submits, reappears when the box is cleared.
//
// Emits `onPick(query, promptId)` when a chip is clicked — the parent
// (search-client.jsx) is responsible for pre-filling and running the
// actual search.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { HelpCircle, ArrowUpRight } from 'lucide-react'
import {
  selectSearchPrompts,
  selectGenericPrompts,
  markPromptClicked,
} from '@/lib/searchPrompts'

export default function SearchPrompts({ genomeReport, hasQuery, onPick }) {
  // Recompute the 5-prompt list any time the genomeReport reference
  // changes. We compute once on mount and keep the same list until the
  // page unmounts — spec: "rotate each time the user visits" (not each
  // React re-render).
  const [nonce, setNonce] = useState(0)
  const prompts = useMemo(() => {
    return genomeReport ? selectSearchPrompts(genomeReport) : selectGenericPrompts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genomeReport, nonce])

  // When the user clears the search box after a query, bump `nonce` so
  // the prompts rotate slightly — feels alive without being disruptive.
  useEffect(() => {
    if (!hasQuery) setNonce((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasQuery])

  if (hasQuery) return null
  if (!prompts.length) return null

  const isGenericOnly = !genomeReport

  const handleClick = (p) => {
    markPromptClicked(p.id)
    onPick?.(p.query, p.id)
  }

  return (
    <div
      // 24px top gap from the search bar (see spec).
      className="mt-6 md:mt-6"
      aria-label="Suggested search prompts"
    >
      <div
        // 10px monospace ss-teal uppercase w/ 0.14em letter-spacing.
        // Set inline because Tailwind's arbitrary-value tracking doesn't
        // hit "0.14em" cleanly and we want an exact spec match.
        className="mb-3.5 font-mono text-[10px] font-bold uppercase text-ss-teal"
        style={{ letterSpacing: '0.14em' }}
      >
        You might be wondering
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.filter(Boolean).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleClick(p)}
            // Chip style per spec: white bg, 1px ss-teal border, pill
            // 999px radius, 9px/18px padding, 0.9rem body, ss-text-primary.
            className="group inline-flex items-center gap-2 rounded-full border border-ss-teal/50 bg-white px-[18px] py-[9px] text-left text-[0.9rem] text-ss-text transition-colors duration-200 hover:border-ss-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-ss-teal/40"
            // Hover bg — apply via inline style-on-hover so we can use
            // the exact rgba value from spec without adding a custom
            // Tailwind color.
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,122,110,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
          >
            <HelpCircle
              size={13}
              className="shrink-0 text-ss-teal"
              aria-hidden="true"
            />
            <span className="min-w-0">{p.question}</span>
          </button>
        ))}
      </div>

      {/* Subtext line — italic, ss-muted, 12px gap above per spec. */}
      <div className="mt-3 text-[0.82rem] italic text-ss-muted">
        {isGenericOnly ? (
          <>
            Upload your genome to see questions matched to your DNA.{' '}
            <Link
              href="/genome"
              className="not-italic font-semibold text-ss-teal hover:underline"
            >
              Upload now <ArrowUpRight size={11} className="ml-0.5 inline-block" aria-hidden="true" />
            </Link>
          </>
        ) : (
          'These questions are generated from your genome — tap any to search the research.'
        )}
      </div>
    </div>
  )
}
