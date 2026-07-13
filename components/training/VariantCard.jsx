'use client'

// /app/components/training/VariantCard.jsx
// Single genetic-variant card for the Training Profile grid.
// Color-coded by category (strength/endurance/injury/recovery/metabolic/neuro).

import { useState } from 'react'
import { ChevronDown, ChevronUp, Dna, AlertCircle } from 'lucide-react'
import { CATEGORY_META } from '@/lib/training/variants'
import Link from 'next/link'

export default function VariantCard({ card }) {
  const [open, setOpen] = useState(false)
  const meta = CATEGORY_META[card.category] || { label: card.category, color: '#6B7280' }
  const isCovered = card.covered

  return (
    <div className="overflow-hidden rounded-2xl border border-ss-border-warm bg-white shadow-sm">
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: `${meta.color}18`, borderBottom: `1px solid ${meta.color}30` }}
      >
        <span className="text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color: meta.color }}>{meta.label}</span>
        <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 font-mono text-[9px] text-ss-muted">{card.rsid}</span>
      </div>

      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <Dna size={14} className="text-ss-teal" />
        <div className="flex-1">
          <div className="text-sm font-extrabold text-ss-teal">{card.gene} — {card.title}</div>
          <div className="mt-0.5 text-[11px] font-semibold" style={{ color: meta.color }}>
            {isCovered ? (card.interp?.label || card.genotype) : 'Not covered by your chip'}
          </div>
        </div>
        {open ? <ChevronUp size={14} className="text-ss-muted" /> : <ChevronDown size={14} className="text-ss-muted" />}
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-ss-border-warm/50 bg-ss-bg/30 px-4 py-3 text-[12px] leading-relaxed text-ss-text">
          <p className="italic text-ss-muted">{card.oneLiner}</p>
          {isCovered ? (
            <>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">What it means</div>
                <div className="mt-0.5">{card.interp.implication}</div>
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-orange">How this protocol adapts</div>
                <div className="mt-0.5">{card.interp.training}</div>
              </div>
              <div>
                <Link
                  href={`/search?q=${encodeURIComponent(card.gene + ' ' + card.title.toLowerCase() + ' exercise')}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ss-teal underline underline-offset-2">
                  Explore research on {card.gene} →
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <div>
                Your genome file did not include this rsID (or a surrogate). Consumer chips vary in what they cover — this is normal, especially on older 23andMe or AncestryDNA versions. WGS providers like Nebula cover it.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
