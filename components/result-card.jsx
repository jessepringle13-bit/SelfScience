'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ExternalLink,
  Share2,
  FileDown,
  Bookmark,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Check,
  ShieldAlert,
  X,
} from 'lucide-react'
import {
  ReliabilityBadge,
  ReliabilityPending,
  ReliabilityError,
} from './reliability-badge'
import { getFlagMeta, TONE_STYLES, allFlags } from '@/lib/flags'
import { trackEvent, EVENTS } from '@/lib/analytics'

const SOURCE_META = {
  'peer-reviewed': { label: 'Peer-Reviewed', color: '#1B474D', bg: 'bg-ss-teal' },
  preprint:        { label: 'Preprint',      color: '#B07D00', bg: 'bg-[#B07D00]' },
  editorial:       { label: 'Editorial',     color: '#006494', bg: 'bg-[#006494]' },
  blog:            { label: 'Blog',          color: '#7A7974', bg: 'bg-ss-muted' },
}

const AMBER = '#964219'

/**
 * Render `text` with word-boundary matches of any string in `terms` wrapped
 * in an orange <mark> tag. Case-insensitive; terms are escaped for regex
 * safety. Returns React children so React handles the DOM.
 */
function HighlightedText({ text, terms }) {
  if (!text || !terms?.length) return text
  // Sort terms longest-first so we don't half-match "CYP1A" inside "CYP1A2".
  const sorted = [...terms].sort((a, b) => b.length - a.length)
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
  const parts = String(text).split(re)
  return parts.map((p, i) => {
    if (i % 2 === 1) {
      return (
        <mark
          key={i}
          className="rounded bg-ss-orange/25 px-0.5 font-mono text-[0.92em] font-bold uppercase text-ss-orange"
          style={{ background: 'transparent' }}
        >
          <span className="rounded bg-ss-orange/20 px-0.5 text-ss-orange">{p.toUpperCase()}</span>
        </mark>
      )
    }
    return p
  })
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

export function FlagPill({ label, tone: aiTone = 'amber', size = 'md' }) {
  const [open, setOpen] = useState(false)
  const meta = getFlagMeta(label, aiTone) || { canonical: label, tone: aiTone, explain: '' }
  const styles = TONE_STYLES[meta.tone] || TONE_STYLES.amber
  const dot = meta.tone === 'good' ? <Check size={10} strokeWidth={3} /> :
               meta.tone === 'critical' ? <ShieldAlert size={10} strokeWidth={2.5} /> :
               <AlertTriangle size={10} strokeWidth={2.5} />

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'

  return (
    <span className="relative inline-flex flex-col">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className={`inline-flex items-center gap-1 rounded-full ${styles.bg} ${padding} font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 ${styles.ring}`}
        aria-expanded={open}
        title={meta.explain}
      >
        <span className="inline-flex items-center">{dot}</span>
        {meta.canonical}
        <Info size={10} className="opacity-70" />
      </button>
      {open && (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-lg bg-white p-3 text-left text-[12px] leading-relaxed text-ss-text shadow-xl ring-1 ring-black/10"
        >
          <span className="mb-1 flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${styles.accent}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${styles.dot}`} />
              {styles.verdictLabel} — {styles.verdict}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              className="rounded-full p-0.5 text-ss-muted hover:bg-ss-bg hover:text-ss-teal"
              aria-label="Close explanation"
            >
              <X size={12} />
            </button>
          </span>
          <span className="mt-1 block font-semibold text-ss-teal">{meta.canonical}</span>
          <span className="mt-1 block text-ss-text/90">{meta.explain}</span>
        </span>
      )}
    </span>
  )
}

/**
 * Wraps a row of FlagPills with a small "What do these mean?" button that
 * opens a full glossary modal. Use this everywhere flags are rendered so the
 * disclosure UX is consistent across the site.
 */
export function FlagRow({ flags = [], size = 'md' }) {
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  if (!flags?.length) return null
  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {flags.map((f) => (
          <FlagPill key={`${f.label}-${f.tone || ''}`} label={f.label} tone={f.tone} size={size} />
        ))}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setGlossaryOpen(true) }}
          className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm bg-white px-2 py-0.5 text-[10px] font-semibold text-ss-muted transition hover:border-ss-teal hover:text-ss-teal"
          title="What do these tags mean?"
        >
          <Info size={11} /> What do these mean?
        </button>
      </div>
      {glossaryOpen && <FlagGlossary onClose={() => setGlossaryOpen(false)} />}
    </>
  )
}

/** Full glossary modal — lists every flag grouped by tone with its explanation. */
export function FlagGlossary({ onClose }) {
  const list = allFlags()
  const groups = { good: [], amber: [], critical: [] }
  for (const f of list) groups[f.tone]?.push(f)
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ss-orange">
              Reading study tags
            </div>
            <h2 className="mt-1 text-2xl font-extrabold text-ss-teal">
              What the tags mean
            </h2>
            <p className="mt-2 text-sm text-ss-muted">
              Every study on SelfScience gets tagged with quality signals so you can tell at a glance whether it&rsquo;s a strong piece of evidence, a preliminary finding, or something to read with real skepticism.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ss-muted hover:bg-ss-bg hover:text-ss-teal"
            aria-label="Close glossary"
          >
            <X size={18} />
          </button>
        </div>

        {(['good', 'amber', 'critical']).map((tone) => {
          const t = TONE_STYLES[tone]
          const items = groups[tone] || []
          if (!items.length) return null
          return (
            <section key={tone} className="mt-6">
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ${t.bg}`}>
                {tone === 'good' ? <Check size={12} strokeWidth={3} /> :
                 tone === 'critical' ? <ShieldAlert size={12} strokeWidth={2.5} /> :
                 <AlertTriangle size={12} strokeWidth={2.5} />}
                {t.verdictLabel} — {t.verdict}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((f) => (
                  <div key={f.canonical} className="rounded-lg bg-ss-surface p-3 ring-1 ring-ss-border-warm/60">
                    <div className={`text-[13px] font-bold ${t.accent}`}>{f.canonical}</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-ss-text">{f.explain}</div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        <div className="mt-6 rounded-lg bg-ss-privacy-tint p-4 text-[12px] italic text-ss-teal">
          Tags come from an AI that reads the abstract, journal, and metadata. They are quality signals, not verdicts. Read the study itself before drawing conclusions.
        </div>
      </div>
    </div>
  )
}

export function FundingTrailPanel({ funding }) {
  const [open, setOpen] = useState(false)
  if (!funding || funding.score > 2) return null
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-ss-amber/40 bg-ss-amber/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12px] font-bold text-ss-amber hover:bg-ss-amber/10"
      >
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle size={13} /> Funding & Conflict of Interest Report
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="space-y-2 border-t border-ss-amber/30 px-3 py-3 text-[12px] text-ss-text">
          {funding.note ? <p className="italic text-ss-muted">{funding.note}</p> : null}
          {funding.funders?.length ? (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ss-amber">Funders / Sponsors</div>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-ss-text">
                {funding.funders.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          ) : null}
          {funding.authorConflicts?.length ? (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ss-amber">Author Conflicts</div>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-ss-text">
                {funding.authorConflicts.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          ) : null}
          <div className="pt-1 text-[10px] italic text-ss-muted">
            Verify via <a href={`https://openpaymentsdata.cms.gov/`} target="_blank" rel="noreferrer noopener" className="underline">CMS Open Payments</a> · <a href={`https://retractionwatch.com/`} target="_blank" rel="noreferrer noopener" className="underline">Retraction Watch</a>
          </div>
        </div>
      )}
    </div>
  )
}

export function ResultCard({ item, variant = 'stacked', highlightGenes = [] }) {
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()

  const meta = SOURCE_META[item.source] || SOURCE_META['peer-reviewed']
  const hasReliability = typeof item.reliability === 'number' && item.reliability > 0
  const analysisError = item._analysisError === true
  const fundingWarn = item.funding && item.funding.score <= 2

  // Genes to visually highlight in the title/abstract + surface as chips at
  // the top of the card. Combines any gene the server-side fan-out flagged
  // (item._matchedGenes) with a client-side scan of the title/abstract for
  // the user's own gene list (highlightGenes). Both are de-duped uppercase.
  const inTextGenes = (highlightGenes && highlightGenes.length)
    ? highlightGenes.filter((g) => {
        const re = new RegExp(`\\b${g}\\b`, 'i')
        return re.test(item.title || '') || re.test(item.abstract || '') || re.test(item.summary || '')
      })
    : []
  const matchedGenes = Array.from(new Set([
    ...(item._matchedGenes || []),
    ...inTextGenes,
  ].map((g) => (g || '').toUpperCase())))
    .filter(Boolean)

  // Border color: amber overrides when funding is a concern
  const leftBorderColor = fundingWarn ? AMBER : meta.color

  const widthClass =
    variant === 'carousel' ? 'w-[340px] shrink-0 md:w-[380px]' : 'w-full'

  const openStudy = (e) => {
    e?.preventDefault?.()
    try {
      sessionStorage.setItem(`ss:study:${item.id}`, JSON.stringify(item))
    } catch {
      /* sessionStorage may be blocked */
    }
    router.push(`/study/${encodeURIComponent(item.id)}`)
  }

  return (
    <article
      className={`group flex ${widthClass} flex-col rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md`}
      style={{ borderLeft: `4px solid ${leftBorderColor}` }}
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
              onClick={(e) => e.stopPropagation()}
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

      {/* Gene chips — only when a Dashboard pillar hand-off flagged this
          study as relevant to one of the user's genes. Rendered in orange
          to match the "your genes" motif elsewhere in the app. */}
      {matchedGenes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {matchedGenes.slice(0, 6).map((g) => (
            <span
              key={g}
              className="rounded-full bg-ss-orange/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ss-orange"
              title={`Study relevant to your ${g} variant`}
            >
              {g}
            </span>
          ))}
          {matchedGenes.length > 6 && (
            <span className="text-[10px] text-ss-muted">+{matchedGenes.length - 6}</span>
          )}
        </div>
      )}

      {/* Title now opens /study/[id] */}
      <button
        type="button"
        onClick={openStudy}
        className="mt-3 block text-left text-[17px] font-bold leading-snug text-ss-teal hover:underline"
      >
        {matchedGenes.length > 0
          ? <HighlightedText text={item.title} terms={matchedGenes} />
          : item.title}
      </button>
      <p className="mt-1 text-xs text-ss-muted">
        {item.journal || '—'}
        {item.authorsShort ? <span className="ml-2">· {item.authorsShort}</span> : null}
      </p>

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

      <FlagRow flags={item.flags} />

      {/* Funding trail (only when score ≤ 2) */}
      <FundingTrailPanel funding={item.funding} />

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
            onClick={() => {
              setExpanded((v) => {
                const next = !v
                if (next) {
                  trackEvent(EVENTS.PLAIN_LANGUAGE_EXPANDED, {
                    source: 'result_card',
                  })
                }
                return next
              })
            }}
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
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={13} /> View Full Study
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
