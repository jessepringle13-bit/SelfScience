'use client'

// /app/components/dashboard/GeneChip.jsx
// SelfScience — Interactive gene chip with a clinical-trial status badge
// and a hover popover (desktop) / bottom sheet (mobile).
//
// Behaviour:
//   * Renders the gene symbol styled like the original static chip so
//     Dashboard visual language is preserved.
//   * Fetches trial counts on mount via getGeneTrials() (24h localStorage
//     cache + in-flight dedupe — see /app/lib/geneTrialsCache.js).
//   * Coloured dot on the chip:
//        • Green  = at least one Recruiting / Not-yet-recruiting trial
//        • Teal   = trials exist but none recruiting
//        • none   = 0 trials for this gene
//   * Desktop (hover: hover): hover / focus opens a floating popover
//     above the chip. Click also toggles.
//   * Mobile: tap opens a full-width bottom sheet with a backdrop and a
//     large close button so the touch targets are comfortable.
//   * Popover / sheet content:
//        - Count breakdown line (Recruiting · Completed · Terminated)
//        - Top 2 trial titles (2-line clamp) → direct link to
//          clinicaltrials.gov/study/<nctId>
//        - Two CTAs: View recruiting trials / View all trials
//          Both deep-link to /search?q=<gene>&openTrials=1[&trialStatus=...]
//
// Nested inside <Link> is fine because we use a <span role="button"> to
// avoid the invalid "button inside anchor" HTML.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ExternalLink, X, TestTube2 } from 'lucide-react'
import { getGeneTrials, readCache } from '@/lib/geneTrialsCache'

function friendlyStatus(status) {
  switch (String(status || '').toUpperCase()) {
    case 'RECRUITING':
      return 'Recruiting'
    case 'NOT_YET_RECRUITING':
      return 'Not yet recruiting'
    case 'ACTIVE_NOT_RECRUITING':
      return 'Active — not recruiting'
    case 'ENROLLING_BY_INVITATION':
      return 'Enrolling by invitation'
    case 'COMPLETED':
      return 'Completed'
    case 'TERMINATED':
      return 'Terminated'
    case 'WITHDRAWN':
      return 'Withdrawn'
    case 'SUSPENDED':
      return 'Suspended'
    default:
      return String(status || '').replace(/_/g, ' ').toLowerCase() || 'Unknown'
  }
}

function badgeTone(data) {
  if (!data || !data.total) return null
  if (data.recruiting > 0) return 'recruiting'
  return 'other'
}

export default function GeneChip({ gene, size = 'sm', className = '' }) {
  const G = String(gene || '').toUpperCase()
  const [data, setData] = useState(() => (typeof window !== 'undefined' ? readCache(G) : null))
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Fetch trial data on mount. Cache-hit resolves synchronously without
  // showing a loading state, so the badge never flickers.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const d = await getGeneTrials(G)
      if (!alive) return
      setData(d)
      setLoaded(true)
    })()
    return () => {
      alive = false
    }
  }, [G])

  // Escape + outside-click close.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDoc = (e) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDoc)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [open])

  // Body scroll lock while the mobile sheet is open — the sheet takes
  // over the viewport so allowing the page to scroll behind it feels wrong.
  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return
    // Only lock on mobile widths.
    if (window.innerWidth >= 768) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const tone = badgeTone(data)
  const total = data?.total || 0
  const hasAny = total > 0

  // Detect whether we're on a mobile-sized viewport. We branch UI + event
  // handling on this because:
  //   * mobile (< 768px)  \u2192 tap toggles a bottom sheet, hover events ignored
  //   * desktop (>= 768px) \u2192 hover opens a floating popover, click keeps
  //                            it open
  // Using viewport width (not `(hover: hover)`) so emulated mobile
  // viewports \u2014 which incorrectly report hover:hover as true \u2014 still get
  // the mobile behaviour. Real touch devices at desktop widths (tablets)
  // are fine on the hover path.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const stop = useCallback((e) => {
    // Prevent the parent <Link> or clickable card from swallowing the click.
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const onChipClick = (e) => {
    stop(e)
    // Mobile: toggle sheet. Desktop: hover controls open; click just
    // ensures the popover is open (useful for keyboard users too).
    if (isMobile) setOpen((v) => !v)
    else setOpen(true)
  }

  // Size tokens (matches the original static chip so nothing shifts).
  const chipSize =
    size === 'md'
      ? 'px-1.5 py-0.5 text-[10px]'
      : 'px-1.5 py-0.5 text-[9px]'

  const dotColor =
    tone === 'recruiting'
      ? 'bg-ss-green ring-2 ring-white shadow-sm'
      : tone === 'other'
      ? 'bg-ss-teal ring-2 ring-white shadow-sm'
      : ''

  const dotTitle =
    tone === 'recruiting'
      ? `${data.recruiting} recruiting · ${total} total`
      : tone === 'other'
      ? `${total} clinical trial${total === 1 ? '' : 's'}`
      : ''

  return (
    <span ref={wrapRef} className={`relative inline-block ${className}`}>
      <span
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onChipClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onChipClick(e)
        }}
        onMouseEnter={() => {
          if (!isMobile) setOpen(true)
        }}
        onMouseLeave={() => {
          if (!isMobile) setOpen(false)
        }}
        title={dotTitle || G}
        className={`relative inline-flex cursor-pointer items-center gap-1 rounded-full bg-ss-orange/15 font-mono font-bold uppercase tracking-wider text-ss-orange transition hover:bg-ss-orange/25 focus:outline-none focus:ring-2 focus:ring-ss-teal/40 ${chipSize}`}
      >
        {G}
        {tone && (
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
          />
        )}
      </span>

      {/* DESKTOP POPOVER — hidden on mobile via md: gate */}
      {open && (
        <span
          className="pointer-events-auto absolute bottom-full left-1/2 z-40 mb-2 hidden w-[300px] -translate-x-1/2 md:block"
          onClick={stop}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <PopoverBody
            gene={G}
            data={data}
            loaded={loaded}
            hasAny={hasAny}
            onClose={() => setOpen(false)}
          />
          {/* Little pointer arrow */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-px"
          >
            <span className="block h-2 w-2 rotate-45 border-b border-r border-ss-border-warm bg-white" />
          </span>
        </span>
      )}

      {/* MOBILE BOTTOM SHEET — rendered via portal to escape any
          transform-containing-block ancestors (pillar tiles use hover
          transforms which otherwise capture our position:fixed). */}
      {open && isMobile && typeof document !== 'undefined' && createPortal(
        <>
          <div
            aria-hidden="true"
            onClick={(e) => {
              stop(e)
              setOpen(false)
            }}
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Clinical trials for ${G}`}
            className="fixed inset-x-0 bottom-0 z-[61] block max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 shadow-2xl md:hidden"
            onClick={stop}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-ss-teal">
                <TestTube2 size={14} className="text-ss-teal" />
                {G} · Clinical trials
              </span>
              <button
                type="button"
                onClick={(e) => {
                  stop(e)
                  setOpen(false)
                }}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
              >
                <X size={16} />
              </button>
            </div>
            <PopoverBody
              gene={G}
              data={data}
              loaded={loaded}
              hasAny={hasAny}
              onClose={() => setOpen(false)}
              mobile
            />
          </div>
        </>,
        document.body,
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------

function PopoverBody({ gene, data, loaded, hasAny, onClose, mobile = false }) {
  const total = data?.total || 0
  const recruiting = data?.recruiting || 0
  const completed = data?.completed || 0
  const terminated = data?.terminated || 0
  const other = data?.other || 0
  const top = data?.top || []

  const searchAllHref = `/search?q=${encodeURIComponent(gene)}&openTrials=1`
  const searchRecruitingHref = `/search?q=${encodeURIComponent(gene)}&openTrials=1&trialStatus=recruiting`

  if (!loaded && !data) {
    return (
      <span
        className={`block rounded-xl border border-ss-border-warm bg-white p-3 text-xs text-ss-muted shadow-lg ${mobile ? '' : ''}`}
      >
        Checking ClinicalTrials.gov for {gene}…
      </span>
    )
  }

  if (!hasAny) {
    return (
      <span
        className={`block rounded-xl border border-ss-border-warm bg-white p-3 shadow-lg ${mobile ? '' : ''}`}
      >
        <span className="block text-xs font-bold uppercase tracking-wider text-ss-teal">
          {gene} · No trials
        </span>
        <span className="mt-1 block text-xs text-ss-muted">
          No clinical trials on ClinicalTrials.gov currently reference this gene by name.
        </span>
        <Link
          href={searchAllHref}
          onClick={onClose}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline"
        >
          Search the literature instead
        </Link>
      </span>
    )
  }

  const parts = []
  if (recruiting > 0) parts.push(<span key="r" className="font-semibold text-ss-green">{recruiting} Recruiting</span>)
  if (completed > 0) parts.push(<span key="c" className="text-ss-teal">{completed} Completed</span>)
  if (terminated > 0) parts.push(<span key="t" className="text-ss-muted">{terminated} Terminated</span>)
  if (other > 0) parts.push(<span key="o" className="text-ss-muted">{other} Other</span>)

  return (
    <span
      className={`block rounded-xl border border-ss-border-warm bg-white p-3 text-left shadow-lg ${mobile ? '' : ''}`}
    >
      {/* Header */}
      {!mobile && (
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-ss-teal">
          {gene} · Clinical trials
        </span>
      )}

      {/* Counts row */}
      <span className="block text-[11px]">
        {parts.reduce((acc, node, i) => {
          if (i === 0) return [node]
          return [...acc, <span key={`sep-${i}`} className="px-1 text-ss-muted">·</span>, node]
        }, [])}
      </span>

      {/* Top 2 trials */}
      {top.length > 0 && (
        <span className="mt-2 block space-y-1.5">
          {top.slice(0, 2).map((t) => (
            <a
              key={t.nctId || t.url}
              href={t.url}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              className="group flex items-start gap-1.5 text-[12px] leading-snug text-ss-text hover:text-ss-teal"
            >
              <ExternalLink size={10} className="mt-0.5 shrink-0 text-ss-muted group-hover:text-ss-teal" />
              <span className="line-clamp-2 group-hover:underline">{t.title}</span>
            </a>
          ))}
        </span>
      )}

      {/* CTA buttons */}
      <span className="mt-3 flex flex-wrap gap-2">
        {recruiting > 0 && (
          <Link
            href={searchRecruitingHref}
            onClick={onClose}
            className="inline-flex min-h-8 items-center gap-1 rounded-full bg-ss-green px-2.5 py-1 text-[11px] font-bold text-white hover:bg-ss-green/90"
          >
            View recruiting trials
          </Link>
        )}
        <Link
          href={searchAllHref}
          onClick={onClose}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-ss-teal px-2.5 py-1 text-[11px] font-bold text-ss-teal hover:bg-ss-teal hover:text-white"
        >
          View all trials
        </Link>
      </span>
    </span>
  )
}
