'use client'

// /app/app/explore/page.js
// Gene Explorer List — the checklist-style entry point for exploring
// findings one at a time. Renders three sections (priority / strengths /
// rest), filter chips, sort dropdown, mark-as-explored circles, and
// an all-explored celebration state.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Compass, ChevronDown, Check, ArrowRight, Sparkles, Filter, SlidersHorizontal,
  Dna, Star,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import {
  getFindings, impactRankedFindings, useExploredIds, markExplored, unmarkExplored,
  CLASSIFICATION_META, hasGenomeResults, getConfidenceMeta,
} from '@/lib/explore'
import { getPopulationFrequency, formatFrequency } from '@/lib/populationFrequencies'

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'unexplored', label: 'Unexplored' },
  { key: 'positive',   label: 'Strengths' },
  { key: 'awareness',  label: 'Awareness' },
  { key: 'neutral',    label: 'Neutral' },
]

const SORTS = [
  { key: 'impact', label: 'Impact' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'pillar', label: 'Pillar' },
  { key: 'az',     label: 'A to Z' },
]

export default function ExplorePage() {
  const [genomeLoaded, setGenomeLoaded] = useState(null) // null = still checking
  const [findings, setFindings] = useState([])
  const explored = useExploredIds()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('impact')
  const [showStrengths, setShowStrengths] = useState(false)
  const [showRest, setShowRest] = useState(false)
  const [showExplored1, setShowExplored1] = useState(false)
  const [showExplored2, setShowExplored2] = useState(false)
  const [showExplored3, setShowExplored3] = useState(false)

  // Hydrate genome + findings on mount / when genome changes.
  useEffect(() => {
    const load = () => {
      const ok = hasGenomeResults()
      setGenomeLoaded(ok)
      setFindings(ok ? getFindings() : [])
    }
    load()
    const onChange = () => load()
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const exploredSet = useMemo(() => new Set(explored.map((x) => String(x).toLowerCase())), [explored])
  const total = findings.length
  const exploredCount = findings.filter((f) => exploredSet.has(f.id)).length
  const remaining = total - exploredCount
  const pct = total ? Math.round((exploredCount / total) * 100) : 0

  // Apply filter first — the sections themselves apply the priority split.
  const filtered = useMemo(() => {
    let list = findings
    if (filter === 'unexplored') list = list.filter((f) => !exploredSet.has(f.id))
    else if (filter === 'positive' || filter === 'awareness' || filter === 'neutral') {
      list = list.filter((f) => f.classification === filter)
    }
    return list
  }, [findings, filter, exploredSet])

  const sorted = useMemo(() => sortFindings(filtered, sort), [filtered, sort])

  // Build the three sections from the sorted list.
  const priority = useMemo(() => impactRankedFindings(sorted).filter((f) => f.classification === 'awareness').slice(0, 5), [sorted])
  const prioritySet = new Set(priority.map((f) => f.id))
  const strengths = sorted.filter((f) => f.classification === 'positive' && !prioritySet.has(f.id))
  const rest = sorted.filter((f) => f.classification !== 'positive' && !prioritySet.has(f.id))

  // No-genome state — render dedicated empty state (Part 8).
  if (genomeLoaded === false) return <NoGenomeState />
  if (genomeLoaded === null) return <LoadingState />

  // All-explored celebration state (Part 8 + Achievement).
  const allExplored = total > 0 && exploredCount === total

  return (
    <div className="min-h-screen bg-ss-bg pb-20">
      <SiteNav />
      <div className="container pt-24 md:pt-28">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Explore at your own pace</div>
          <h1 className="mt-2 text-3xl font-extrabold text-ss-text md:text-4xl lg:text-[2.6rem]">Your Gene Explorer</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ss-muted">
            Your genome has <strong className="text-ss-text">{total} finding{total === 1 ? '' : 's'}</strong> to explore. Work through them whenever you are ready — no rush, no pressure.
          </p>
        </div>

        {/* Progress */}
        <div className="mt-6 max-w-3xl">
          {allExplored ? (
            <div className="rounded-2xl border-2 border-ss-green bg-ss-green/[0.05] px-6 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ss-green/15 text-ss-green">
                <Star size={26} strokeWidth={2} />
              </div>
              <h2 className="mt-3 text-2xl font-extrabold text-ss-green">You have explored all {total} of your findings.</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ss-muted">
                That is a remarkable level of health literacy. Your genome has no more surprises — only deeper understanding from here.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/search" className="inline-flex items-center gap-1 rounded-full border border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white">
                  Read the latest research →
                </Link>
                <Link href="/blueprint" className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">
                  View your Blueprint →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between font-mono text-[11px] text-ss-muted">
                <span>{exploredCount} explored • {remaining} remaining</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ss-bg">
                <div className="h-full bg-ss-green transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </>
          )}
        </div>

        {/* Filter + sort row */}
        {total > 0 && !allExplored && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter size={13} className="text-ss-muted" />
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    filter === f.key ? 'bg-ss-teal text-white' : 'bg-white text-ss-muted hover:text-ss-teal ring-1 ring-ss-border-warm'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ss-muted">
              <SlidersHorizontal size={13} />
              <span>Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ss-teal ring-1 ring-ss-border-warm focus:outline-none focus:ring-ss-teal"
              >
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Sections */}
        {!allExplored && (
          <div className="mt-8 space-y-8">
            {priority.length > 0 && (
              <Section
                title="Start here — your most important"
                subtitle={`Top ${priority.length} finding${priority.length === 1 ? '' : 's'} ranked by impact for your biology.`}
                priority
                items={priority}
                exploredSet={exploredSet}
                showExplored={showExplored1}
                setShowExplored={setShowExplored1}
              />
            )}

            {strengths.length > 0 && (
              <CollapsibleSection
                title="Your strengths to know about"
                subtitle={`${strengths.filter((f) => !exploredSet.has(f.id)).length} unexplored, ${strengths.length} total`}
                open={showStrengths}
                onToggle={() => setShowStrengths(!showStrengths)}
                items={strengths}
                exploredSet={exploredSet}
                showExplored={showExplored2}
                setShowExplored={setShowExplored2}
                toggleLabel={showStrengths ? 'Hide' : `Show ${strengths.length} strengths`}
              />
            )}

            {rest.length > 0 && (
              <CollapsibleSection
                title="The rest of your findings"
                subtitle={`${rest.filter((f) => !exploredSet.has(f.id)).length} unexplored, ${rest.length} total`}
                open={showRest}
                onToggle={() => setShowRest(!showRest)}
                items={rest}
                exploredSet={exploredSet}
                showExplored={showExplored3}
                setShowExplored={setShowExplored3}
                toggleLabel={showRest ? 'Hide' : `Show ${rest.length} more findings`}
              />
            )}

            {priority.length + strengths.length + rest.length === 0 && (
              <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white px-6 py-14 text-center">
                <p className="text-sm text-ss-muted">No findings match this filter. Try a different one.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------- Section wrappers --------------------- */

function Section({ title, subtitle, priority, items, exploredSet, showExplored, setShowExplored }) {
  const unexplored = items.filter((f) => !exploredSet.has(f.id))
  const exp = items.filter((f) => exploredSet.has(f.id))
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-xl font-extrabold text-ss-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-ss-muted">{subtitle}</p>}
      </div>
      <ul className="space-y-2">
        {unexplored.map((f) => <ExplorerRow key={f.id} finding={f} priority={priority} />)}
      </ul>
      {exp.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowExplored(!showExplored)}
            className="text-[11px] font-semibold text-ss-teal hover:underline"
          >
            {showExplored ? 'Hide' : `Show ${exp.length} explored`}
          </button>
          {showExplored && (
            <ul className="mt-2 space-y-2">
              {exp.map((f) => <ExplorerRow key={f.id} finding={f} explored priority={priority} />)}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function CollapsibleSection({ title, subtitle, open, onToggle, toggleLabel, items, exploredSet, showExplored, setShowExplored }) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl border border-ss-border-warm bg-white px-4 py-3 text-left transition hover:bg-ss-bg"
      >
        <div>
          <h2 className="text-base font-extrabold text-ss-text">{title}</h2>
          <p className="mt-0.5 text-[11px] text-ss-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-ss-teal">
          {toggleLabel}
          <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="mt-3">
          <Section
            title=""
            subtitle=""
            items={items}
            exploredSet={exploredSet}
            showExplored={showExplored}
            setShowExplored={setShowExplored}
          />
        </div>
      )}
    </section>
  )
}

/* --------------------------- Row component ------------------------ */

function ExplorerRow({ finding, explored, priority }) {
  const router = useRouter()
  const classMeta = CLASSIFICATION_META[finding.classification] || CLASSIFICATION_META.neutral
  const [justChecked, setJustChecked] = useState(false)

  const toggleExplored = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (explored) {
      unmarkExplored(finding.id)
    } else {
      markExplored(finding.id)
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 260)
    }
  }

  return (
    <li
      className={`relative flex items-center gap-3 rounded-xl px-4 transition ${
        priority ? 'border-l-4 border-ss-teal bg-ss-teal/[0.04] pl-3' : 'border border-ss-border-warm bg-white'
      } ${explored ? 'opacity-50' : ''}`}
      style={{ minHeight: 52 }}
    >
      {priority && !explored && (
        <span className="absolute right-3 top-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ss-teal">
          Priority
        </span>
      )}

      <button
        type="button"
        onClick={toggleExplored}
        aria-label={explored ? 'Mark as unexplored' : 'Mark as explored'}
        title={explored ? 'Mark as unexplored' : 'Mark as explored'}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
          explored ? 'border-ss-green bg-ss-green text-white' : 'border-ss-teal bg-white text-transparent hover:border-ss-green'
        } ${justChecked ? 'animate-in zoom-in-50 duration-200' : ''}`}
      >
        {explored && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1 py-2">
        <div className={`text-[13.5px] font-semibold text-ss-text ${explored ? 'line-through' : ''}`}>
          {finding.gene}
          {finding.rsid && (
            <span className="ml-2 font-mono text-[9.5px] font-normal text-ss-muted">{finding.rsid}</span>
          )}
        </div>
        {finding.name && finding.name !== finding.gene && (
          <div className="font-mono text-[9px] text-ss-muted">{finding.name}</div>
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        {finding.pillar && (
          <span className="inline-flex rounded-full bg-ss-bg px-2 py-0.5 font-mono text-[9px] font-semibold text-ss-muted">
            {finding.pillar}
          </span>
        )}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${classMeta.bg} ${classMeta.text}`}>
          {classMeta.label}
        </span>
      </div>

      <Link
        href={`/explore/${finding.id}`}
        onClick={() => markExplored(finding.id)}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] font-semibold transition ${
          explored ? 'text-ss-muted hover:text-ss-teal' : 'text-ss-teal hover:underline'
        }`}
      >
        {explored ? 'Revisit' : 'Go deeper'} <ArrowRight size={10} />
      </Link>
    </li>
  )
}

/* --------------------------- Sort helper -------------------------- */

function sortFindings(list, sort) {
  const arr = (list || []).slice()
  if (sort === 'impact') return impactRankedFindings(arr)
  if (sort === 'az') return arr.sort((a, b) => (a.gene || '').localeCompare(b.gene || ''))
  if (sort === 'pillar') return arr.sort((a, b) => (a.pillar || 'zzz').localeCompare(b.pillar || 'zzz') || (a.gene || '').localeCompare(b.gene || ''))
  if (sort === 'rarity') {
    return arr.sort((a, b) => {
      const fa = a.rsid ? (getPopulationFrequency(a.rsid)?.freq ?? 1) : 1
      const fb = b.rsid ? (getPopulationFrequency(b.rsid)?.freq ?? 1) : 1
      return fa - fb
    })
  }
  return arr
}

/* --------------------------- Empty states ------------------------- */

function NoGenomeState() {
  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />
      <div className="container flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ss-bg text-ss-muted/60">
          <Dna size={30} />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-ss-text">Your Explorer list is waiting.</h1>
        <p className="mt-2 max-w-md text-[14px] text-ss-muted">
          Upload your genome file to generate your personal list of genes to explore — each one explained in plain English at your own pace.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/genome/upload" className="inline-flex items-center gap-1 rounded-full bg-ss-green px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-95">
            Upload your genome →
          </Link>
          <Link href="/start" className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm bg-white px-5 py-2.5 text-sm font-semibold text-ss-teal hover:bg-ss-bg">
            Try with sample data →
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />
      <div className="container pt-24">
        <div className="max-w-3xl">
          <div className="h-3 w-40 animate-pulse rounded bg-ss-border-warm" />
          <div className="mt-3 h-10 w-72 animate-pulse rounded bg-ss-border-warm" />
          <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-ss-border-warm" />
        </div>
        <ul className="mt-8 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="h-[52px] animate-pulse rounded-xl bg-white ring-1 ring-ss-border-warm" />
          ))}
        </ul>
      </div>
    </div>
  )
}
