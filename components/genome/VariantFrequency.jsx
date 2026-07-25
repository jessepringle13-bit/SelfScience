'use client'

// /app/components/genome/VariantFrequency.jsx
// 'How common is this' block inserted into every variant / finding
// card. Renders a global bar, plain-English rarity sentence, gnomAD
// source note, and an expandable ancestry breakdown when data exists.

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  getAncestryData, globalFrequencyPercent, ANCESTRY_LABELS,
  rarityStatement,
} from '@/lib/ancestryFrequencies'

export default function VariantFrequency({ card, className = '' }) {
  const [open, setOpen] = useState(false)
  const globalPct = globalFrequencyPercent(card)
  if (globalPct == null) return null // Hide entirely when no data.
  const ancestry = getAncestryData(card?.rsid)
  const gt = ancestry?.genotype || card?.genotype || null

  return (
    <div className={`mt-3 border-t border-dashed border-ss-border-warm/70 pt-3 ${className}`}>
      <div
        className="font-mono text-[10px] font-bold uppercase text-ss-teal"
        style={{ letterSpacing: '0.14em' }}
      >
        How common is this
      </div>

      {/* Global frequency bar */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ss-border-warm/40">
        <div className="h-full rounded-full bg-ss-teal" style={{ width: `${Math.min(100, globalPct)}%` }} />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-ss-text">
          {gt ? <>Your genotype: <span className="font-semibold text-ss-teal">{gt}</span></> : 'Your genotype'}
        </span>
        <span className="font-mono text-[10px] text-ss-muted">{globalPct}% of people carry this</span>
      </div>
      <p className="mt-2 text-[12.5px] text-ss-text">{rarityStatement(globalPct)}</p>
      <p className="mt-1 font-mono text-[9px] italic text-ss-muted">Frequency from gnomAD v3.1.2 global population</p>

      {/* Ancestry breakdown (expandable) */}
      {ancestry && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-ss-teal hover:underline"
          >
            See frequency by ancestry background {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {open && (
            <div className="mt-3">
              <ul className="space-y-1.5">
                {ANCESTRY_LABELS.map(({ key, label }) => {
                  const v = ancestry[key] ?? 0
                  return (
                    <li key={key} className="flex items-center gap-2">
                      <span className="w-[160px] flex-shrink-0 font-mono text-[10px] text-ss-text md:w-[180px]">{label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ss-border-warm/40">
                        <div className="h-full rounded-full bg-ss-teal" style={{ width: `${Math.min(100, v)}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono text-[10px] text-ss-muted">{v}%</span>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 text-[0.8rem] italic text-ss-muted">
                Population labels reflect gnomAD research categories and do not represent individual ancestry. This data is for educational context only and should not be used for ancestry inference.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
