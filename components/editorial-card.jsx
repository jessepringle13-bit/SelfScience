// /app/components/editorial-card.jsx
// Card for a single Supabase editorial article. Visual language matches
// the existing Featured Research cards — same rounded surface, teal title,
// pillar chip row — with the addition of a small teal "SelfScience Editorial"
// badge so users can distinguish curated content from external results.

'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

const EVIDENCE_STYLES = {
  Settled:      { bg: 'bg-[#2E7D32]', label: 'Settled' },
  Emerging:     { bg: 'bg-ss-teal',   label: 'Emerging' },
  Preliminary: { bg: 'bg-[#B07D00]',  label: 'Preliminary' },
  Conflicting:  { bg: 'bg-[#A12C7B]', label: 'Conflicting' },
}

function truncate(str, n) {
  if (!str) return ''
  const s = String(str).trim()
  return s.length > n ? s.slice(0, n).trim() + '…' : s
}

export function EditorialCard({ article, variant = 'default' }) {
  if (!article) return null
  const {
    slug, title, authors, journal, publish_date,
    plain_terms_summary, pillars, cover_image_url,
    ai_reliability_score, evidence_quality,
  } = article

  const ev = EVIDENCE_STYLES[evidence_quality] || null
  const year = publish_date ? new Date(publish_date).getFullYear() : null

  return (
    <Link
      href={`/articles/${slug}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-ss-border-warm/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        variant === 'carousel' ? 'w-[320px] shrink-0 md:w-[360px]' : 'h-full'
      }`}
    >
      {cover_image_url && (
        <div className="relative h-40 w-full overflow-hidden bg-ss-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover_image_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Row 1: SelfScience Editorial badge + evidence quality */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            <Sparkles size={10} />
            SelfScience Editorial
          </span>
          {ev && (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white ${ev.bg}`}>
              {ev.label}
            </span>
          )}
          {typeof ai_reliability_score === 'number' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ss-bg px-2 py-0.5 text-[10px] font-semibold text-ss-teal ring-1 ring-ss-border-warm">
              AI Reliability: {ai_reliability_score}/100
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold leading-snug text-ss-teal group-hover:underline">
          {title}
        </h3>

        {/* Meta line */}
        {(authors || journal || year) && (
          <div className="text-xs text-ss-muted">
            {[authors, journal, year].filter(Boolean).join(' · ')}
          </div>
        )}

        {/* Plain terms preview */}
        {plain_terms_summary && (
          <p className="text-sm text-ss-text/85 line-clamp-3">
            {truncate(plain_terms_summary, 220)}
          </p>
        )}

        {/* Pillar chips */}
        {Array.isArray(pillars) && pillars.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {pillars.slice(0, 4).map((p) => (
              <span key={p} className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
                {p}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 pt-1 text-xs font-semibold text-ss-orange opacity-0 transition group-hover:opacity-100">
          Read the SelfScience take <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  )
}

export default EditorialCard
