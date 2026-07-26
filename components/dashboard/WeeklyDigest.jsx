'use client'

// /app/components/dashboard/WeeklyDigest.jsx
// "This Week for Your Genome" — three-card weekly digest section
// added below Top Findings and above Explore Your Pillars.
//
// Card 1: latest PubMed paper matching the user's top variants
// Card 2: rotating "Did You Know" snippet (curated + dynamic fallback)
// Card 3: recruiting clinical trial, prefer Wisconsin > IL/MN/IA > US
//
// Data flow: on mount we call weeklyDigest lib. If cache is fresh
// (< 7 days), render immediately. Otherwise fetch fresh, show a
// skeleton state during the fetch, and swap in results as they arrive.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Sparkles, FlaskConical, ArrowUpRight, Loader2, Layers,
} from 'lucide-react'
import {
  pickTopDigestVariants,
  pickDidYouKnow,
  fetchWeeklyPaper,
  fetchWeeklyTrial,
  readDigestCache,
  writeDigestCache,
  digestIsFresh,
  currentWeekIndex,
  summarizeTrialLocation,
  VARIANT_QUERY_MAP,
} from '@/lib/weeklyDigest'
import { flattenReportCards } from '@/lib/supplementProtocol'
import SaveButton from '@/components/SaveButton'
import {
  markDigestCardViewed, useDigestViewed, useReadingList,
} from '@/lib/readingList'

/* ============================== Section ============================== */

export default function WeeklyDigest({ report }) {
  const cards = useMemo(() => (report ? flattenReportCards(report) : []), [report])
  const topVariants = useMemo(() => pickTopDigestVariants(cards), [cards])

  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)  // {paper, didYouKnow, trial}
  const [error, setError] = useState(null)

  // Compute DID YOU KNOW immediately (doesn't need network) so even if
  // both API calls fail we still have real content on the card.
  const didYouKnow = useMemo(() => {
    return pickDidYouKnow(topVariants, currentWeekIndex())
  }, [topVariants])

  const loadFresh = useCallback(async () => {
    if (!topVariants.length) {
      setLoading(false)
      setPayload({ paper: null, didYouKnow, trial: null })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [paper, trial] = await Promise.all([
        fetchWeeklyPaper(topVariants),
        fetchWeeklyTrial(topVariants),
      ])
      const next = { paper, didYouKnow, trial }
      setPayload(next)
      writeDigestCache(next)
    } catch (e) {
      setError(e?.message || 'fetch failed')
      // If we have any cache, degrade to it rather than showing nothing.
      const cached = readDigestCache()
      setPayload(cached || { paper: null, didYouKnow, trial: null })
    } finally {
      setLoading(false)
    }
  }, [topVariants, didYouKnow])

  useEffect(() => {
    if (!topVariants.length) {
      setLoading(false)
      setPayload({ paper: null, didYouKnow, trial: null })
      return
    }
    // If the cache is fresh, hydrate immediately (no loading state).
    if (digestIsFresh()) {
      const cached = readDigestCache()
      if (cached) {
        // Always refresh Did You Know from the current week rather than
        // the cached one — snippet rotation should feel weekly even if
        // we cached the paper/trial recently.
        setPayload({ ...cached, didYouKnow })
        setLoading(false)
        return
      }
    }
    loadFresh()
  }, [loadFresh, topVariants.length, didYouKnow])

  // Nothing to show if there's no genome uploaded yet.
  if (!report || !topVariants.length) return null

  return (
    <section
      aria-labelledby="weekly-digest-heading"
      className="rounded-[20px] bg-[#F7EFE3]/60 ring-1 ring-ss-border-warm/60 px-4 py-6 md:px-7 md:py-8"
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="font-mono text-[11px] font-bold uppercase text-ss-teal"
          style={{ letterSpacing: '0.14em' }}
        >
          This Week for Your Genome
        </span>
        {loading && (
          <Loader2 size={13} className="animate-spin text-ss-muted" aria-hidden="true" />
        )}
      </div>
      <h2
        id="weekly-digest-heading"
        className="text-[1.6rem] font-extrabold leading-tight text-ss-text"
      >
        This Week for Your Genome
      </h2>
      <p className="mt-1 text-[0.91rem] text-ss-muted">
        Fresh research and insights matched to your biology — updated weekly.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-3 md:gap-4">
        {loading && !payload ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <NewResearchCard paper={payload?.paper} loading={loading} />
            <DidYouKnowCard snippet={payload?.didYouKnow || didYouKnow} />
            <ClinicalTrialCard trial={payload?.trial} loading={loading} />
          </>
        )}
      </div>

      {error && !payload?.paper && !payload?.trial && (
        <div className="mt-3 text-center text-[11px] text-ss-muted">
          Check your connection — we&apos;ll try again next visit.
        </div>
      )}

      <div
        className="mt-4 text-center font-mono text-[10px] text-ss-muted"
        style={{ letterSpacing: '0.02em' }}
      >
        Updated weekly · Matched to your top variants · Powered by PubMed and ClinicalTrials.gov
      </div>

      {/* Bonus section — appears when the user has clicked into all three
          main digest cards this week. Provides between-refresh
          engagement. */}
      <BonusSection topVariants={topVariants} />
    </section>
  )
}

/* ============================ Bonus =================================== */

function BonusSection({ topVariants }) {
  const viewed = useDigestViewed()
  const list = useReadingList()
  const allViewed = viewed.paper && viewed.insight && viewed.trial
  if (!allViewed) return null

  const primaryVariant = topVariants?.[0]
  const primaryPillar  = primaryVariant?.card?.pillar || 'Genomics'
  const primaryLabel   = primaryVariant?.gene || 'your top variant'
  const oldestSaved    = [...list].sort((a, b) => (a.savedAt || '').localeCompare(b.savedAt || ''))[0]
  const savedDays      = oldestSaved ? Math.max(1, Math.round((Date.now() - Date.parse(oldestSaved.savedAt || 0)) / 86400000)) : 0

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-ss-border-warm/80 bg-ss-surface p-4 md:p-5">
      <div
        className="mb-1 font-mono text-[9px] font-bold uppercase text-ss-muted"
        style={{ letterSpacing: '0.14em' }}
      >
        Bonus content
      </div>
      <div className="font-mono text-[11px] font-bold uppercase text-ss-green">
        You have read this week&apos;s digest
      </div>
      <p className="mt-1 text-[0.9rem] text-ss-muted">
        Here is a little more while you wait for next week&apos;s update.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Bonus 1 — Deep Cut */}
        <BonusCard tone="amber" label="Deep cut">
          <div className="text-[13px] font-semibold text-ss-text">A highly-cited paper on {primaryLabel}</div>
          <div className="mt-1 font-mono text-[10px] text-ss-muted">Older but influential</div>
          <Link href={`/search?q=${encodeURIComponent(primaryLabel + ' review')}`} className="mt-auto inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
            Read <ArrowUpRight size={11} />
          </Link>
        </BonusCard>

        {/* Bonus 2 — From Your Reading List (or CTA) */}
        <BonusCard tone="teal" label="From your list">
          {oldestSaved ? (
            <>
              <div className="line-clamp-2 text-[13px] font-semibold text-ss-text">{oldestSaved.title}</div>
              <div className="mt-1 font-mono text-[10px] text-ss-muted">You saved this {savedDays} day{savedDays === 1 ? '' : 's'} ago — ready to read it?</div>
              <a href={oldestSaved.url || '/reading-list/saved'} target={oldestSaved.url ? '_blank' : undefined} rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
                Read now <ArrowUpRight size={11} />
              </a>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-ss-text">Save research papers to build your reading list.</div>
              <Link href="/search" className="mt-auto inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
                Start saving <ArrowUpRight size={11} />
              </Link>
            </>
          )}
        </BonusCard>

        {/* Bonus 3 — Related SelfScience article */}
        <BonusCard tone="green" label="SelfScience article">
          <div className="text-[13px] font-semibold text-ss-text">Deep dive: {primaryPillar}</div>
          <div className="mt-1 font-mono text-[10px] text-ss-muted">{primaryPillar} · ~6 min read</div>
          <Link href={`/search?pillar=${encodeURIComponent(primaryPillar)}`} className="mt-auto inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
            Read article <ArrowUpRight size={11} />
          </Link>
        </BonusCard>
      </div>
    </div>
  )
}

function BonusCard({ label, tone, children }) {
  const color = tone === 'amber' ? 'text-ss-amber' : tone === 'green' ? 'text-ss-green' : 'text-ss-teal'
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-ss-border-warm/80 bg-white px-3.5 py-3">
      <div className={`font-mono text-[9px] font-bold uppercase ${color}`} style={{ letterSpacing: '0.14em' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

/* ============================== Cards =============================== */

function CardShell({ children }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ss-border-warm bg-white px-4 py-[18px] md:px-5 md:py-[22px]">
      {children}
    </div>
  )
}

function CardLabel({ tone, children }) {
  const color =
    tone === 'green' ? 'text-ss-green'
    : tone === 'amber' ? 'text-ss-amber'
    : tone === 'blue' ? 'text-ss-teal'
    : 'text-ss-muted'
  return (
    <div
      className={`font-mono text-[10px] font-bold uppercase ${color}`}
      style={{ letterSpacing: '0.14em' }}
    >
      {children}
    </div>
  )
}

function MatchedChip({ label, tone = 'green' }) {
  const bg = tone === 'blue' ? 'bg-ss-teal' : 'bg-ss-green'
  return (
    <span
      className={`inline-flex items-center rounded-full px-[9px] py-[3px] font-mono text-[10px] font-bold text-white ${bg}`}
    >
      Matched: {label}
    </span>
  )
}

function ActionLink({ href, children, external = true }) {
  const cls = 'mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ss-teal hover:underline'
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children} <ArrowUpRight size={12} aria-hidden="true" />
      </a>
    )
  }
  return (
    <Link href={href} className={cls}>
      {children} <ArrowUpRight size={12} aria-hidden="true" />
    </Link>
  )
}

/* ---------- Card 1: New Research ---------- */
function NewResearchCard({ paper, loading }) {
  if (loading && !paper) return <SkeletonCard />
  const yr = paper?.year || (paper?.pubDate ? new Date(paper.pubDate).getFullYear() : '')
  const saveEntry = paper && paper.url ? {
    id: `research:${paper.pmid || paper.url}`,
    type: 'research',
    title: paper.title,
    source: [paper.journal, yr].filter(Boolean).join(' · '),
    url: paper.url || paper.pubmedUrl || null,
    variantTag: paper.matchedGene || null,
  } : null
  return (
    <CardShell>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-ss-green" aria-hidden="true" />
          <CardLabel tone="green">New Research</CardLabel>
        </div>
        {saveEntry && <SaveButton item={saveEntry} />}
      </div>
      {paper ? (
        <>
          <h3 className="line-clamp-3 text-[0.95rem] font-bold leading-snug text-ss-text">
            {paper.title}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ss-muted">
            {paper.journal && <span className="line-clamp-1">{paper.journal}</span>}
            {yr && <span>· {yr}</span>}
          </div>
          {paper.matchedGene && <MatchedChip label={paper.matchedGene} tone="green" />}
          <a href={paper.url || paper.pubmedUrl} target="_blank" rel="noopener noreferrer" onClick={() => markDigestCardViewed('paper')}
             className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ss-teal hover:underline">
            Read study <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </>
      ) : (
        <>
          <h3 className="text-[0.95rem] font-bold leading-snug text-ss-text">
            We&apos;re watching PubMed for new research on your top variants.
          </h3>
          <p className="text-[12.5px] text-ss-muted">
            New indexed studies will surface here as they publish. Check back next week.
          </p>
          <ActionLink href="/search" external={false}>
            Search the research now
          </ActionLink>
        </>
      )}
    </CardShell>
  )
}

/* ---------- Card 2: Did You Know ---------- */
function DidYouKnowCard({ snippet }) {
  const saveEntry = snippet ? {
    id: `digest:insight:${snippet.rsid || snippet.variantLabel}`,
    type: 'digest',
    title: snippet.text.slice(0, 120) + (snippet.text.length > 120 ? '…' : ''),
    source: 'SelfScience Weekly Insight',
    url: `/search?q=${encodeURIComponent(snippet.query || snippet.variantLabel || '')}`,
    variantTag: snippet.variantLabel || null,
  } : null
  return (
    <CardShell>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-ss-amber" aria-hidden="true" />
          <CardLabel tone="amber">Did You Know</CardLabel>
        </div>
        {saveEntry && <SaveButton item={saveEntry} />}
      </div>
      {snippet ? (
        <>
          <p className="text-[0.93rem] italic leading-[1.65] text-ss-text">
            {snippet.text}
          </p>
          {snippet.variantLabel && <MatchedChip label={snippet.variantLabel} tone="green" />}
          <Link href={`/search?q=${encodeURIComponent(snippet.query || snippet.variantLabel)}`} onClick={() => markDigestCardViewed('insight')}
                className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ss-teal hover:underline">
            Learn more <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </>
      ) : (
        <p className="text-[12.5px] text-ss-muted">
          Weekly insights will appear here once your genome is analyzed.
        </p>
      )}
    </CardShell>
  )
}

/* ---------- Card 3: Clinical Trial ---------- */
function ClinicalTrialCard({ trial, loading }) {
  if (loading && !trial) return <SkeletonCard />
  const saveEntry = trial ? {
    id: `trial:${trial.nctId}`,
    type: 'trial',
    title: trial.title,
    source: summarizeTrialLocation(trial.locations) + (trial.nctId ? ` · ${trial.nctId}` : ''),
    url: trial.url || (trial.nctId ? `https://clinicaltrials.gov/study/${trial.nctId}` : null),
    variantTag: trial.gene || null,
  } : null
  return (
    <CardShell>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-ss-teal" aria-hidden="true" />
          <CardLabel tone="blue">Clinical Trial</CardLabel>
        </div>
        {saveEntry && <SaveButton item={saveEntry} />}
      </div>
      {trial ? (
        <>
          <h3 className="line-clamp-3 text-[0.95rem] font-bold leading-snug text-ss-text">
            {trial.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-ss-green px-[9px] py-[3px] font-mono text-[10px] font-bold text-white">
              RECRUITING
            </span>
            {trial.phase && (
              <span className="inline-flex items-center rounded-full bg-ss-bg px-[9px] py-[3px] font-mono text-[10px] font-bold uppercase text-ss-muted">
                {String(trial.phase).replace(/PHASE_?/gi, 'Phase ').trim() || trial.phase}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ss-muted">
            <span>{summarizeTrialLocation(trial.locations)}</span>
            {trial.nctId && <span>· {trial.nctId}</span>}
          </div>
          {trial.gene && <MatchedChip label={trial.gene} tone="blue" />}
          <a href={trial.url || `https://clinicaltrials.gov/study/${trial.nctId}`} target="_blank" rel="noopener noreferrer" onClick={() => markDigestCardViewed('trial')}
             className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ss-teal hover:underline">
            See details <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </>
      ) : (
        <>
          <h3 className="text-[0.95rem] font-bold leading-snug text-ss-text">
            Coming soon
          </h3>
          <p className="text-[12.5px] leading-relaxed text-ss-muted">
            We&apos;re monitoring trials that match your genome. Check back as new studies open enrollment.
          </p>
        </>
      )}
    </CardShell>
  )
}

/* ---------- Skeleton ---------- */
function SkeletonCard() {
  // Tailwind's `animate-pulse` gives us the shimmer effect without any
  // custom CSS. We stack three shimmering blocks to mimic label + title
  // + subtitle.
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ss-border-warm bg-white px-4 py-[18px] md:px-5 md:py-[22px]" aria-hidden="true">
      <div className="h-3 w-24 animate-pulse rounded-full bg-ss-border-warm/70" />
      <div className="h-4 w-11/12 animate-pulse rounded bg-ss-border-warm/60" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-ss-border-warm/60" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-ss-border-warm/50" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-ss-border-warm/40" />
    </div>
  )
}
