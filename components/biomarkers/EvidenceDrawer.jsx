// /app/components/biomarkers/EvidenceDrawer.jsx
// Expandable per-biomarker evidence panel: confidence badge + curated
// citations + optional links to SelfScience editorial articles.

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink, BookOpen } from 'lucide-react'
import { CONFIDENCE_META } from '@/lib/biomarkers/schema'

const TYPE_LABEL = {
  'consensus-guideline': 'Guideline',
  'meta-analysis':       'Meta-analysis',
  'rct':                 'RCT',
  'cohort':              'Cohort study',
  'review':              'Review',
  'mechanistic':         'Mechanistic',
}

export function EvidenceDrawer({ biomarker }) {
  const [open, setOpen] = useState(false)
  const conf = CONFIDENCE_META[biomarker.evidence.confidence] || CONFIDENCE_META.Moderate

  return (
    <div className="rounded-xl border border-ss-border-warm/60 bg-ss-surface/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ring-1 ${conf.tone}`}>
            {conf.label} confidence
          </span>
          <span className="text-xs text-ss-muted">Why this range?</span>
        </div>
        <ChevronDown size={14} className={`text-ss-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-ss-border-warm/60 px-4 pb-4 pt-3">
          <p className="text-xs italic text-ss-muted">{conf.note}</p>

          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
              SelfScience rationale
            </div>
            <p className="text-sm leading-relaxed text-ss-text">
              {biomarker.optimization.rationale}
            </p>
          </div>

          {biomarker.evidence.citations?.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
                Key sources
              </div>
              <ul className="space-y-1.5">
                {biomarker.evidence.citations.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 inline-flex shrink-0 rounded bg-ss-teal/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ss-teal">
                      {TYPE_LABEL[c.type] || c.type}
                    </span>
                    <div>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ss-teal hover:underline">
                          {c.label} <ExternalLink size={10} className="inline" />
                        </a>
                      ) : (
                        <span className="font-semibold text-ss-text">{c.label}</span>
                      )}
                      {c.year && <span className="ml-1 text-ss-muted">({c.year})</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {biomarker.evidence.editorialSlugs?.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
                SelfScience editorial
              </div>
              <ul className="space-y-1">
                {biomarker.evidence.editorialSlugs.map((slug) => (
                  <li key={slug}>
                    <Link href={`/articles/${slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
                      <BookOpen size={10} /> Read our deep dive
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[10px] italic text-ss-muted">
            Interpretation is a synthesis of the sources above and current SelfScience editorial judgment. Ranges are educational, not medical advice.
          </div>
        </div>
      )}
    </div>
  )
}

export default EvidenceDrawer
