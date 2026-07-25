'use client'

// /app/components/genome/VariantInterpretation.jsx
// Expandable "What does this mean for me?" layer, appended to every
// finding/variant card. Additive — nothing else on the card is
// removed. State is local React state (per product spec), NOT
// localStorage.
//
// Sections (all rendered when expanded):
//   Part A — What it means         (plain English)
//   Part B — What you can do       (bullet list, 2-4 items)
//   Part C — Research confidence   (colored pill)
//
// Visual spec:
//   • Trigger: monospace 11px, ss-teal, dashed border-top
//   • Panel bg: rgba(14,122,110,0.04)  ← ss-teal @ 4% opacity
//   • Mobile-safe (no horizontal overflow at 375px)

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  getVariantInterpretation,
  getConfidenceMeta,
} from '@/lib/variantInterpretations'
import ExplainToDoctorButton from '@/components/genome/ExplainToDoctorModal'
import ShareToCommunityButton from '@/components/community/ShareToCommunityButton'
import { emitVariantExpanded } from '@/lib/learningPath'
import SaveButton from '@/components/SaveButton'

export default function VariantInterpretation({ card, className = '' }) {
  const [open, setOpen] = useState(false)
  const interp = getVariantInterpretation(card || {})
  const conf = getConfidenceMeta(interp.confidence)

  return (
    <div
      // dashed border-top separates this section from the rest of the
      // card content. `min-w-0` guarantees no horizontal overflow on
      // narrow screens (the parent card is `overflow-hidden` by design).
      className={`mt-3 min-w-0 border-t border-dashed border-ss-border-warm/70 pt-3 ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => {
          const next = !v
          if (next) {
            // Signal to any listening LearningPath component that a
            // variant card was expanded on this pillar page — Step 2
            // completes automatically. No-op if pillar tag is missing.
            emitVariantExpanded(card?.pillar || null)
          }
          return next
        })}
        aria-expanded={open}
        // Font-mono + 11px + teal per product spec. Full-width click
        // target with min-h-11 for mobile ergonomics.
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left font-mono text-[11px] font-semibold text-ss-teal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ss-teal/40"
      >
        <span className="truncate">
          What does this mean for me?
        </span>
        {open ? (
          <ChevronUp size={12} className="flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown size={12} className="flex-shrink-0" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          // ss-teal @ 4% opacity per spec. Rounded, small vertical
          // padding, tight horizontal padding so the panel never
          // touches the card edge. `overflow-hidden` + `break-words`
          // guarantee no horizontal overflow at 375px.
          className="mt-2 space-y-3 overflow-hidden break-words rounded-lg p-3"
          style={{ backgroundColor: 'rgba(14, 122, 110, 0.04)' }}
        >
          {/* Part A — What it means */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ss-teal">
              What it means
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-ss-text">
              {interp.meaning}
            </p>
          </div>

          {/* Part B — What you can do */}
          {interp.actions && interp.actions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-ss-teal">
                What you can do about it
              </div>
              <ul className="mt-1 space-y-1.5 pl-4 text-[13px] leading-relaxed text-ss-text">
                {interp.actions.map((a, i) => (
                  <li key={i} className="list-disc marker:text-ss-teal">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Part C — Research confidence pill */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">
              Research confidence:
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${conf.className}`}
            >
              {conf.label}
            </span>
            {!interp.isCurated && (
              <span className="text-[10px] italic text-ss-muted">
                (interpretation generated from your report)
              </span>
            )}
          </div>

          {/* "Explain this to my doctor" — only visible in the expanded
              state per product spec. Opens a modal with a formatted
              clinical conversation summary + copy-to-clipboard and
              add-to-practitioner-report actions. */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-3">
              <ExplainToDoctorButton card={card} />
              {/* Opt-in members can share this finding's plain-English
                  interpretation to the community feed. Auto-hides when
                  the user isn't a community member. */}
              <ShareToCommunityButton
                initialText={card?.plain || card?.classification_text || ''}
                pillar={card?.pillar || null}
                label="Share to community"
              />
            </div>
            {/* Save button — records this finding in ss_reading_list so
                the user can revisit it from the Saved Reading List. */}
            <SaveButton
              item={{
                id: `finding:${card?.rsid || card?.gene}:${card?.genotype || ''}`,
                type: 'finding',
                title: `${card?.gene || 'Finding'}${card?.trait ? ' · ' + card.trait : ''}`,
                source: card?.rsid ? String(card.rsid).toUpperCase() : '',
                url: null,
                pillar: card?.pillar || null,
                variantTag: card?.gene || null,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
