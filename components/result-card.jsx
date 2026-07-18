'use client'

import { useEffect, useState } from 'react'
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
import {
  isSaved as isSavedStudy,
  toggleSaveStudy,
  SAVED_STUDIES_CHANGE_EVENT,
} from '@/lib/savedStudies'

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

/**
 * Map the numeric 1-5 reliability score to the 3-tier system used by the
 * evidence-tier filter (see search-client.jsx) and the compact dot:
 *   Strong   = score >= 4  (green)
 *   Moderate = score == 3  (amber)
 *   Limited  = score <= 2  (red)
 * Studies with no numeric score yet (item.reliability == null) return
 * `null` — the card renders a "pending" state and the tier filter skips
 * them so nothing is silently hidden.
 */
export function reliabilityTier(score) {
  if (typeof score !== 'number' || score <= 0) return null
  if (score >= 4) return 'strong'
  if (score === 3) return 'moderate'
  return 'limited'
}

const TIER_META = {
  strong:   { dot: 'bg-ss-green',  label: 'Strong Evidence',   ring: 'ring-ss-green/40' },
  moderate: { dot: 'bg-ss-amber',  label: 'Moderate Evidence', ring: 'ring-ss-amber/40' },
  limited:  { dot: 'bg-[#c2513a]', label: 'Limited Evidence',  ring: 'ring-[#c2513a]/40' },
}

/**
 * Compact reliability dot (default) or full badge (expanded card). Reads
 * only from `score`; label / note come from the props if provided so the
 * dot's aria-label can include the note.
 */
function ReliabilityDot({ score, label, className = '' }) {
  const tier = reliabilityTier(score)
  if (!tier) return null
  const meta = TIER_META[tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-ss-muted ${className}`}
      title={`${meta.label}${label ? ` — ${label}` : ''}`}
      aria-label={`${meta.label}${label ? `, ${label}` : ''}`}
    >
      <span className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${meta.dot} ${meta.ring}`} />
      <span className="hidden sm:inline">{meta.label.split(' ')[0]}</span>
    </span>
  )
}

/**
 * Compact, expandable study card. Collapsed by default; expand reveals the
 * full reliability badge, plain-language summary or abstract preview, and
 * the "View / Share / Save / Export" action row.
 *
 * Props:
 *   item             — normalised study record from /api/search
 *   variant          — 'stacked' (default) or 'carousel' for horizontal layout
 *   highlightGenes   — array of gene symbols to highlight + surface as chips
 *   corpus           — sibling studies from the same result set. Used to
 *                      compute the "Related Studies" cluster on expand.
 */
export function ResultCard({ item, variant = 'stacked', highlightGenes = [], corpus = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [copyState, setCopyState] = useState('idle')  // idle | copied
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  // Subscribe to save-state changes so the bookmark icon reflects other tabs.
  useEffect(() => {
    let mounted = true
    setSaved(isSavedStudy(item?.id))
    const onChange = () => { if (mounted) setSaved(isSavedStudy(item?.id)) }
    window.addEventListener(SAVED_STUDIES_CHANGE_EVENT, onChange)
    return () => { mounted = false; window.removeEventListener(SAVED_STUDIES_CHANGE_EVENT, onChange) }
  }, [item?.id])

  const meta = SOURCE_META[item.source] || SOURCE_META['peer-reviewed']
  const hasReliability = typeof item.reliability === 'number' && item.reliability > 0
  const analysisError = item._analysisError === true
  const fundingWarn = item.funding && item.funding.score <= 2
  const tier = reliabilityTier(item.reliability)

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

  // Related-studies cluster — only computed on expand to save cycles. Sibling
  // studies from `corpus` that share ≥1 matched gene OR ≥2 title keyword
  // hits. Capped at 3, deduped against self.
  const related = expanded ? findRelated(item, corpus, matchedGenes) : []

  const leftBorderColor = fundingWarn ? AMBER : meta.color
  const widthClass = variant === 'carousel' ? 'w-[340px] shrink-0 md:w-[380px]' : 'w-full'

  const openStudy = (e) => {
    e?.preventDefault?.()
    try { sessionStorage.setItem(`ss:study:${item.id}`, JSON.stringify(item)) } catch {}
    router.push(`/study/${encodeURIComponent(item.id)}`)
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/study/${encodeURIComponent(item.id)}`
      : `/study/${encodeURIComponent(item.id)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      // Very rare fallback: legacy copy via textarea
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopyState('copied')
        setTimeout(() => setCopyState('idle'), 2000)
      } catch { /* ignore */ }
    }
  }

  const handleSave = (e) => {
    e.stopPropagation()
    const nowSaved = toggleSaveStudy(item)
    setSaved(nowSaved)
  }

  // Plain-English title if available, else fall back to the academic title.
  // Both are rendered together on the card so the credibility of the
  // original is preserved beneath the accessible headline.
  const plainTitle = (item.plainTitle || '').trim()
  const showBothTitles = !!plainTitle && plainTitle.toLowerCase() !== (item.title || '').toLowerCase().replace(/[.!?]+$/, '')

  return (
    <article
      className={`group flex ${widthClass} flex-col rounded-2xl border border-ss-border-warm bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md md:p-5`}
      style={{ borderLeft: `4px solid ${leftBorderColor}` }}
    >
      {/* --- COLLAPSED HEADER — always visible --- */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: badges (single row, scrolls on mobile) */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap md:flex-wrap md:overflow-visible md:whitespace-normal">
          <SourceBadge type={item.source} />
          {item.providers?.length > 1 ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ss-privacy-tint px-2 py-0.5 text-[10px] font-semibold text-ss-teal"
              title={`Also found in: ${item.providers.slice(1).join(', ')}`}
            >
              +{item.providers.length - 1}
            </span>
          ) : null}
          {item.oaUrl ? (
            <a
              href={item.oaUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ss-green/10 px-2 py-0.5 text-[10px] font-semibold text-ss-green ring-1 ring-ss-green/30 hover:bg-ss-green hover:text-white"
              title="Free full text (open access)"
              onClick={(e) => e.stopPropagation()}
            >
              ● Free
            </a>
          ) : null}
          {/* Animal / in-vitro badge — pulled from the LLM-scored flags.
              Renders in amber to be visually distinct from the reliability
              tier dot. Users can hide these entirely via the toolbar filter. */}
          {Array.isArray(item.flags) && item.flags.some((f) => /animal|in.?vitro|cell study|mouse|rat|mice/i.test(f?.label || '')) && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ss-amber/15 px-2 py-0.5 text-[10px] font-semibold text-ss-amber ring-1 ring-ss-amber/30"
              title="Findings from animal or in-vitro (lab dish) research — may not apply directly to humans"
            >
              🧫 Non-human
            </span>
          )}
          {hasReliability ? (
            <ReliabilityDot score={item.reliability} label={item.reliabilityLabel} className="shrink-0" />
          ) : analysisError ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-ss-muted">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-ss-muted" />
              <span className="hidden sm:inline">Score unavailable</span>
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-ss-muted">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-ss-muted/50" />
              <span className="hidden sm:inline">Analyzing…</span>
            </span>
          )}
        </div>

        {/* Right: share + save (44x44 mobile touch targets) */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ss-muted transition hover:bg-ss-bg hover:text-ss-teal md:h-8 md:w-8"
            title={copyState === 'copied' ? 'Copied!' : 'Copy link to this study'}
            aria-label="Share this study"
          >
            {copyState === 'copied' ? <Check size={16} className="text-ss-green" /> : <Share2 size={15} />}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition md:h-8 md:w-8 ${saved ? 'text-ss-orange hover:bg-ss-orange/10' : 'text-ss-muted hover:bg-ss-bg hover:text-ss-teal'}`}
            title={saved ? 'Saved to your reading list' : 'Save to your reading list'}
            aria-label={saved ? 'Remove from reading list' : 'Save to reading list'}
            aria-pressed={saved}
          >
            <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* --- TITLES --- */}
      {showBothTitles ? (
        <>
          <button
            type="button"
            onClick={openStudy}
            className="mt-2 block text-left text-[17px] font-extrabold leading-snug text-ss-teal hover:underline line-clamp-2 md:line-clamp-none"
          >
            {matchedGenes.length > 0
              ? <HighlightedText text={plainTitle} terms={matchedGenes} />
              : plainTitle}
          </button>
          <button
            type="button"
            onClick={openStudy}
            className="mt-1 hidden text-left text-[12px] italic leading-snug text-ss-muted hover:text-ss-teal md:block"
            title={item.title}
          >
            <span className="font-semibold not-italic uppercase tracking-wider text-[9px] mr-1">Original:</span>
            {item.title}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={openStudy}
          className="mt-2 block text-left text-[17px] font-extrabold leading-snug text-ss-teal hover:underline line-clamp-2 md:line-clamp-none"
        >
          {matchedGenes.length > 0
            ? <HighlightedText text={item.title} terms={matchedGenes} />
            : item.title}
        </button>
      )}

      {/* Journal + Year (one muted line) */}
      <p className="mt-1 text-[11px] text-ss-muted line-clamp-1">
        {item.journal || '—'}
        {item.year ? <span className="ml-1">· {item.year}</span> : null}
        {item.authorsShort ? <span className="ml-1">· {item.authorsShort}</span> : null}
      </p>

      {/* Genome relevance tag — only when a matched gene is present */}
      {matchedGenes.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
            <span aria-hidden>●</span>
            {matchedGenes.length === 1
              ? `Matches your ${matchedGenes[0]} gene`
              : `Matches your ${matchedGenes.slice(0, 2).join(' + ')} genes${matchedGenes.length > 2 ? ` +${matchedGenes.length - 2}` : ''}`}
          </span>
        </div>
      )}

      {/* Expand / collapse toggle */}
      <button
        type="button"
        onClick={() => {
          setExpanded((v) => {
            const next = !v
            if (next) {
              trackEvent(EVENTS.PLAIN_LANGUAGE_EXPANDED, { source: 'result_card' })
            }
            return next
          })
        }}
        className="mt-3 inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-ss-muted hover:text-ss-teal"
        aria-expanded={expanded}
      >
        {expanded ? <>Show less <ChevronUp size={13} /></> : <>Show more <ChevronDown size={13} /></>}
      </button>

      {/* ============ EXPANDED CONTENT ============ */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Full reliability badge */}
          <div>
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

          {/* Flags + Funding */}
          <FlagRow flags={item.flags} />
          <FundingTrailPanel funding={item.funding} />

          {/* Plain-language summary OR abstract */}
          {item.plain ? (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">
                In Plain Terms:
              </div>
              <p className="mt-1 text-sm text-ss-text">{item.plain}</p>
            </div>
          ) : item.abstract ? (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-ss-muted">
                Abstract preview:
              </div>
              <p className="mt-1 text-sm text-ss-text/90">{item.abstract}</p>
            </div>
          ) : (
            <div className="text-sm italic text-ss-muted">
              No abstract available from source.
            </div>
          )}

          {/* Related Studies cluster */}
          {related.length > 0 && (
            <div className="rounded-lg border border-ss-border-warm bg-ss-bg/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">
                Related Studies
              </div>
              <ul className="mt-2 space-y-1.5">
                {related.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        try { sessionStorage.setItem(`ss:study:${r.id}`, JSON.stringify(r)) } catch {}
                        router.push(`/study/${encodeURIComponent(r.id)}`)
                      }}
                      className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-white"
                    >
                      <ReliabilityDot score={r.reliability} />
                      <span className="flex-1 truncate text-[13px] font-semibold text-ss-teal hover:underline">
                        {r.plainTitle || r.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-ss-muted">{r.year || ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-4 border-t border-ss-border-warm pt-3 text-xs text-ss-muted">
            <a
              href={item.url || '#'}
              target={item.url ? '_blank' : undefined}
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 hover:text-ss-teal"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={13} /> View Full Study
            </a>
            <button type="button" onClick={handleShare} className="inline-flex items-center gap-1 hover:text-ss-teal">
              <Share2 size={13} /> {copyState === 'copied' ? 'Copied!' : 'Share'}
            </button>
            <button type="button" onClick={handleSave} className={`inline-flex items-center gap-1 hover:text-ss-teal ${saved ? 'text-ss-orange' : ''}`}>
              <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="inline-flex items-center gap-1 hover:text-ss-teal">
              <FileDown size={13} /> Export
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

/**
 * Related-studies matcher. Ranks siblings from the same corpus by:
 *   1. Shared matched-gene overlap (weight 3 per gene)
 *   2. Title keyword overlap (weight 1 per shared word ≥5 chars)
 *   3. Same journal (weight 2)
 * Returns top 3.
 */
function findRelated(current, corpus, matchedGenes) {
  if (!Array.isArray(corpus) || corpus.length === 0) return []
  const titleWords = new Set(
    String(current.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5),
  )
  const myGenes = new Set(matchedGenes)
  const scored = []
  for (const it of corpus) {
    if (!it || it.id === current.id) continue
    let score = 0
    const otherGenes = new Set((it._matchedGenes || []).map((g) => (g || '').toUpperCase()))
    for (const g of myGenes) if (otherGenes.has(g)) score += 3
    if (it.journal && it.journal === current.journal) score += 2
    if (it.title) {
      const otherWords = String(it.title)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 5)
      for (const w of otherWords) if (titleWords.has(w)) score += 1
    }
    if (score > 0) scored.push({ it, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 3).map((s) => s.it)
}

export default ResultCard
