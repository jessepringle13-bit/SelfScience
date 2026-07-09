'use client'

import { useState } from 'react'
import {
  ExternalLink,
  Share2,
  FileDown,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  ReliabilityBadge,
  ReliabilityPending,
  ReliabilityError,
} from './reliability-badge'

const SOURCE_META = {
  'peer-reviewed': { label: 'Peer-Reviewed', color: '#1B474D', bg: 'bg-ss-teal' },
  preprint: { label: 'Preprint', color: '#B07D00', bg: 'bg-[#B07D00]' },
  editorial: { label: 'Editorial', color: '#006494', bg: 'bg-[#006494]' },
  blog: { label: 'Blog', color: '#7A7974', bg: 'bg-ss-muted' },
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
    <span
      className={`inline-flex items-center rounded-full ${bg} px-2.5 py-0.5 text-[11px] font-semibold text-white`}
    >
      {label}
    </span>
  )
}

export function ResultCard({ item, variant = 'stacked' }) {
  const [expanded, setExpanded] = useState(false)
  const meta = SOURCE_META[item.source] || SOURCE_META['peer-reviewed']
  const hasReliability = typeof item.reliability === 'number' && item.reliability > 0
  const analysisError = item._analysisError === true

  const widthClass =
    variant === 'carousel' ? 'w-[340px] shrink-0 md:w-[380px]' : 'w-full'

  return (
    <article
      className={`group flex ${widthClass} flex-col rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md`}
      style={{ borderLeft: `4px solid ${meta.color}` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge type={item.source} />
          {item.providers?.length > 1 ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-ss-privacy-tint px-2 py-0.5 text-[10px] font-semibold text-ss-teal"
              title={`Also found in: ${item.providers.slice(1).join(', ')}`}
            >
              +{item.providers.length - 1} source{item.providers.length > 2 ? 's' : ''}
            </span>
          ) : item.provider ? (
            <span className="text-[10px] uppercase tracking-wider text-ss-muted">
              {item.provider}
            </span>
          ) : null}
          {item.oaUrl ? (
            <a
              href={item.oaUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-full bg-ss-green/10 px-2 py-0.5 text-[10px] font-semibold text-ss-green ring-1 ring-ss-green/30 hover:bg-ss-green hover:text-white"
              title="Free full text (open access)"
            >
              ● Free Full Text
            </a>
          ) : null}
          {typeof item.citationCount === 'number' && item.citationCount > 0 ? (
            <span className="text-[10px] font-semibold text-ss-muted">
              {item.citationCount.toLocaleString()} citation{item.citationCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-ss-muted">{item.year || '—'}</span>
      </div>

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

      {/* Reliability visualization */}
      <div className="mt-4">
        {hasReliability ? (
          <ReliabilityBadge
            score={item.reliability}
            label={item.reliabilityLabel}
            note={item.reliabilityNote}
          />
        ) : analysisError ? (
          <ReliabilityError />
        ) : (
          <ReliabilityPending />
        )}
      </div>

      {item.flags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.flags.map((f) => (
            <FlagPill key={f.label} label={f.label} tone={f.tone} />
          ))}
        </div>
      ) : null}

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
