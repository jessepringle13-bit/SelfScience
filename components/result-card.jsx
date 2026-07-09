'use client'

import { useState } from 'react'
import {
  ExternalLink,
  Share2,
  FileDown,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'

const SOURCE_META = {
  'peer-reviewed': { label: 'Peer-Reviewed', color: '#1B474D', bg: 'bg-ss-teal' },
  preprint: { label: 'Preprint', color: '#B07D00', bg: 'bg-[#B07D00]' },
  editorial: { label: 'Editorial', color: '#006494', bg: 'bg-[#006494]' },
  blog: { label: 'Blog', color: '#7A7974', bg: 'bg-ss-muted' },
}

const reliabilityLabel = (n) =>
  ['', 'Preliminary', 'Limited', 'Moderate', 'Strong', 'Excellent'][n] || null

export function SignalBars({ filled = 0, size = 'md', dim = false }) {
  const heights = size === 'sm' ? [6, 9, 12, 15, 18] : [8, 12, 16, 20, 24]
  const filledClass = dim ? 'bg-ss-border-warm' : 'bg-ss-teal'
  return (
    <div className="flex items-end gap-1">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: h, width: size === 'sm' ? 4 : 5 }}
          className={`rounded-sm ${i < filled ? filledClass : 'bg-ss-border-warm'}`}
        />
      ))}
    </div>
  )
}

export function SourceBadge({ type }) {
  const meta = SOURCE_META[type] || SOURCE_META['peer-reviewed']
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ${meta.bg}`}
    >
      {meta.label}
    </span>
  )
}

export function FlagPill({ label, tone = 'amber' }) {
  const bg = tone === 'critical' ? 'bg-ss-critical' : 'bg-ss-amber'
  return (
    <span className={`inline-flex items-center rounded-full ${bg} px-2.5 py-0.5 text-[11px] font-semibold text-white`}>
      {label}
    </span>
  )
}

/**
 * Result card. Layout matches Section E spec.
 * - When item.reliability is null, shows a "Pending analysis" placeholder
 *   so the AI-powered fields plug in cleanly once Gemini scoring is wired.
 */
export function ResultCard({ item, variant = 'stacked' }) {
  const [expanded, setExpanded] = useState(false)
  const meta = SOURCE_META[item.source] || SOURCE_META['peer-reviewed']
  const hasReliability = typeof item.reliability === 'number' && item.reliability > 0

  const widthClass =
    variant === 'carousel' ? 'w-[340px] shrink-0 md:w-[380px]' : 'w-full'

  return (
    <article
      className={`group flex ${widthClass} flex-col rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md`}
      style={{ borderLeft: `4px solid ${meta.color}` }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SourceBadge type={item.source} />
          {item.provider && (
            <span className="text-[10px] uppercase tracking-wider text-ss-muted">
              {item.provider}
            </span>
          )}
        </div>
        <span className="text-xs text-ss-muted">{item.year || '—'}</span>
      </div>

      {/* Title */}
      <a
        href={item.url || '#'}
        target={item.url ? '_blank' : undefined}
        rel="noreferrer noopener"
        className="mt-3 block text-[17px] font-bold leading-snug text-ss-teal hover:underline"
      >
        {item.title}
      </a>
      <p className="mt-1 text-xs text-ss-muted">
        {item.journal || '—'}
        {item.authorsShort ? <span className="ml-2">· {item.authorsShort}</span> : null}
      </p>

      {/* Reliability row */}
      <div className="mt-4 flex items-center gap-3">
        <SignalBars filled={hasReliability ? item.reliability : 0} size="sm" dim={!hasReliability} />
        {hasReliability ? (
          <span className="text-sm font-bold text-ss-teal">
            {item.reliabilityLabel || reliabilityLabel(item.reliability)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-ss-privacy-tint px-2 py-0.5 text-[11px] font-semibold text-ss-teal">
            <Sparkles size={11} /> Pending AI analysis
          </span>
        )}
      </div>
      {item.reliabilityNote ? (
        <p className="mt-1 text-xs italic text-ss-muted">{item.reliabilityNote}</p>
      ) : null}

      {/* Bias flags */}
      {item.flags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.flags.map((f) => (
            <FlagPill key={f.label} label={f.label} tone={f.tone} />
          ))}
        </div>
      ) : null}

      {/* Plain language */}
      {item.plain ? (
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">
            In Plain Terms:
          </div>
          <p className="mt-1 text-sm text-ss-text">{item.plain}</p>
        </div>
      ) : item.abstract ? (
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ss-muted">
            Abstract preview:
          </div>
          <p className="mt-1 line-clamp-3 text-sm text-ss-text/90">{item.abstract}</p>
        </div>
      ) : (
        <div className="mt-4 text-sm italic text-ss-muted">
          No abstract available from source.
        </div>
      )}

      {/* Expand */}
      {item.abstract ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex w-fit items-center gap-1 text-xs font-semibold text-ss-muted hover:text-ss-teal"
          >
            Full Abstract {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <div className="mt-2 rounded-md bg-ss-bg p-3 text-[13px] leading-relaxed text-ss-muted">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ss-muted">
                Original Abstract — Source: {item.journal || item.provider}
              </div>
              {item.abstract}
            </div>
          )}
        </>
      ) : null}

      {/* Actions */}
      <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-ss-muted">
        <a
          href={item.url || '#'}
          target={item.url ? '_blank' : undefined}
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 hover:text-ss-teal"
        >
          <ExternalLink size={13} /> View Study
        </a>
        <button type="button" className="inline-flex items-center gap-1 hover:text-ss-teal">
          <Share2 size={13} /> Share
        </button>
        <button type="button" className="inline-flex items-center gap-1 hover:text-ss-teal">
          <FileDown size={13} /> Export
        </button>
        <button type="button" className="inline-flex items-center gap-1 hover:text-ss-teal">
          <Bookmark size={13} /> Save
        </button>
      </div>
    </article>
  )
}

export default ResultCard
