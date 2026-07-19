'use client'

// /app/components/genome/GenomeSlicePage.jsx
// Shared implementation of /genome/overview, /genome/findings, and
// /genome/strengths. Each of those three route files is a thin wrapper
// that just picks a `mode` and hands it to this component.
//
// mode:
//   'overview'  — all classified variants + snapshot card + narrative
//   'findings'  — only "awareness" (Areas to Explore) variants
//   'strengths' — only "positive" (Strengths) variants
//
// All copy, filtering, cross-linking, and per-card actions are derived
// entirely from the sessionStorage-loaded genome report — no server call.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Sparkles, ShieldCheck, Search, FileText,
  Pill, Activity, Filter, ExternalLink, Check, BookOpen,
} from 'lucide-react'
import SiteNav, { PILLARS } from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { normalizePillarName } from '@/lib/pillars'
import { getPopulationFrequency } from '@/lib/populationFrequencies'
import {
import DashboardBackLink from '@/components/DashboardBackLink'
  addToPractitionerReport,
  isInPractitionerReport,
  PRACTITIONER_CHANGE_EVENT,
} from '@/lib/practitionerReport'

// Evidence-strength → confidence label. See §7 of the platform doc.
function evidenceToConfidence(strength) {
  const s = String(strength || '').toLowerCase()
  if (s === 'strong' || s === 'established') return { label: 'Well-studied', tone: 'text-ss-green' }
  if (s === 'moderate' || s === 'emerging')  return { label: 'Emerging research', tone: 'text-ss-amber' }
  return { label: 'Limited data', tone: 'text-ss-muted' }
}

// Population-frequency copy, e.g. "About 23% of people carry this variant".
function frequencyBlurb(rsid) {
  const rec = getPopulationFrequency(rsid)
  if (!rec) return null
  const freqRaw = typeof rec.global === 'number' ? rec.global
    : typeof rec.eur === 'number' ? rec.eur
    : typeof rec.overall === 'number' ? rec.overall
    : null
  if (typeof freqRaw !== 'number') return null
  const pct = Math.round(freqRaw * 100)
  if (pct < 5)  return `Only about ${pct}% of people carry this variant`
  if (pct < 30) return `About ${pct}% of people carry this variant`
  if (pct < 55) return `Roughly ${pct}% of people share this variant`
  return `Relatively common — about ${pct}% of people share it`
}

function classificationBucket(c) {
  const s = String(c || '').toLowerCase()
  if (s === 'positive' || s === 'strength') return 'strength'
  if (s === 'awareness' || s === 'be_aware' || s === 'aware' || s === 'finding') return 'awareness'
  return 'neutral'
}

const MODE_META = {
  overview: {
    title: 'Your Complete Genome',
    subtitle: 'Every classified variant from your uploaded genome, in one place.',
    accent: 'ss-teal',
  },
  findings: {
    title: 'Your Areas to Explore',
    subtitle: "These variants are worth understanding. They don't predict disease — they give you better questions to ask.",
    accent: 'ss-amber',
  },
  strengths: {
    title: 'Your Genetic Strengths',
    subtitle: 'These are variants where current research associates your genotype with a favorable outcome.',
    accent: 'ss-green',
  },
}

function narrativeForMode(mode, cards) {
  const strengths = cards.filter((c) => classificationBucket(c.classification) === 'strength')
  const findings  = cards.filter((c) => classificationBucket(c.classification) === 'awareness')
  const neutrals  = cards.filter((c) => classificationBucket(c.classification) === 'neutral')
  const pillars   = new Set(cards.map((c) => normalizePillarName(c.pillar || '')).filter(Boolean))
  const pillarCounts = {}
  strengths.forEach((c) => { const p = normalizePillarName(c.pillar || ''); if (p) pillarCounts[p] = (pillarCounts[p] || 0) + 1 })
  const topPillars = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([p]) => p)

  if (mode === 'strengths') {
    if (!strengths.length) return 'No genetic strengths were classified in your report yet. Try re-uploading a genome that includes the SelfScience variant set.'
    const p = new Set(strengths.map((c) => normalizePillarName(c.pillar || '')).filter(Boolean))
    return `You have ${strengths.length} genetic strength${strengths.length === 1 ? '' : 's'} across ${p.size} pillar${p.size === 1 ? '' : 's'}. These are areas where current research associates your genotype with favorable outcomes.`
  }
  if (mode === 'findings') {
    if (!findings.length) return 'No awareness variants were classified in your report. Every recognized variant fell into a Strength or Neutral bucket.'
    const p = new Set(findings.map((c) => normalizePillarName(c.pillar || '')).filter(Boolean))
    return `You have ${findings.length} area${findings.length === 1 ? '' : 's'} to explore across ${p.size} pillar${p.size === 1 ? '' : 's'}. Here's what the research says about each one — and what questions to start asking.`
  }
  const parts = [`Your genome shows ${strengths.length} strength${strengths.length === 1 ? '' : 's'}, ${findings.length} area${findings.length === 1 ? '' : 's'} to explore, and ${neutrals.length} neutral variant${neutrals.length === 1 ? '' : 's'} across ${pillars.size} pillar${pillars.size === 1 ? '' : 's'}.`]
  if (topPillars.length) parts.push(`Your strongest areas are ${topPillars.join(' and ')}.`)
  if (findings.length) parts.push(`Your most notable finding is in the ${normalizePillarName(findings[0].pillar || '') || 'General'} pillar.`)
  return parts.join(' ')
}

/* ------------------------------ Card ---------------------------------- */

function VariantCard({ card, mode, otherPillarHasContent, onCrossLinkClick }) {
  const router = useRouter()
  const [inReport, setInReport] = useState(false)
  useEffect(() => {
    const id = String(card.rsid || card.id || '')
    setInReport(isInPractitionerReport(id))
    const onChange = () => setInReport(isInPractitionerReport(id))
    window.addEventListener(PRACTITIONER_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(PRACTITIONER_CHANGE_EVENT, onChange)
  }, [card.rsid, card.id])

  const bucket = classificationBucket(card.classification)
  const confidence = evidenceToConfidence(card.evidence_strength)
  const freq = frequencyBlurb(card.rsid)
  const pillar = normalizePillarName(card.pillar || '')
  const geneLabel = (card.gene || card.rsid || 'Variant').split(/[\s(/·+,]/)[0]
  const description = card.classification_text || card.summary || card.description || ''

  const borderClass = bucket === 'strength'  ? 'border-l-ss-green'
                    : bucket === 'awareness' ? 'border-l-ss-amber'
                    : 'border-l-ss-muted/40'
  const badgeClass = bucket === 'strength'  ? 'bg-ss-green/10 text-ss-green ring-1 ring-ss-green/30'
                   : bucket === 'awareness' ? 'bg-ss-amber/15 text-ss-amber ring-1 ring-ss-amber/30'
                   : 'bg-ss-muted/10 text-ss-muted ring-1 ring-ss-muted/30'
  const badgeLabel = bucket === 'strength' ? 'Strength' : bucket === 'awareness' ? 'Area to Explore' : 'Neutral'

  const doAdd = () => { if (addToPractitionerReport(card)) setInReport(true) }
  const doSearch = () => router.push(`/search?q=${encodeURIComponent(geneLabel)}`)
  const doSupplements = () => router.push(`/tools/supplements?gene=${encodeURIComponent(geneLabel)}`)

  return (
    <article className={`rounded-2xl border border-ss-border-warm border-l-4 ${borderClass} bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
              {badgeLabel}
            </span>
            {pillar && (
              <span className="inline-flex items-center rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
                {pillar}
              </span>
            )}
            <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider ${confidence.tone}`}>
              {confidence.label}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-extrabold leading-snug text-ss-text">{geneLabel}</h3>
          {description && <p className="mt-1 text-sm leading-relaxed text-ss-muted">{description}</p>}
          {freq && <p className="mt-2 text-[11px] italic text-ss-muted">{freq}</p>}
          <p className="mt-1 font-mono text-[10px] text-ss-muted">
            {card.rsid || '—'}{card.genotype ? ` · ${card.genotype}` : ''}
          </p>
          {otherPillarHasContent && (
            <button
              type="button"
              onClick={onCrossLinkClick}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-ss-teal hover:underline"
            >
              You also have {bucket === 'strength' ? 'an area to explore' : 'a strength'} in this pillar
              <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ss-border-warm pt-3">
        <button type="button" onClick={doSearch}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-teal px-3 text-xs font-semibold text-ss-teal hover:bg-ss-teal hover:text-white md:min-h-8">
          <Search size={12} /> Read the research
        </button>
        <button type="button" onClick={doAdd}
          className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-semibold md:min-h-8 ${inReport ? 'border border-ss-green bg-ss-green/10 text-ss-green' : 'border border-ss-border-warm bg-white text-ss-muted hover:border-ss-teal hover:text-ss-teal'}`}>
          {inReport ? <><Check size={12} /> In report</> : <><FileText size={12} /> Add to practitioner report</>}
        </button>
        <button type="button" onClick={doSupplements}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-border-warm bg-white px-3 text-xs font-semibold text-ss-muted hover:border-ss-teal hover:text-ss-teal md:min-h-8">
          <Pill size={12} /> Related supplements
        </button>
        {mode === 'strengths' && (
          <Link href="/tools/training" className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-border-warm bg-white px-3 text-xs font-semibold text-ss-muted hover:border-ss-teal hover:text-ss-teal md:min-h-8">
            <Activity size={12} /> Training protocol
          </Link>
        )}
      </div>
    </article>
  )
}

/* ------------------------- Main slice component ------------------------ */

export default function GenomeSlicePage({ mode = 'overview' }) {
  const [report, setReport] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [pillarFilter, setPillarFilter] = useState('all')
  const [sortMode, setSortMode]         = useState('evidence')  // evidence | pillar | alphabet
  const [classFilter, setClassFilter]   = useState('all')       // overview only

  useEffect(() => {
    setReport(getGenomeResults())
    setHydrated(true)
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const allCards = useMemo(() => report ? flattenReportCards(report) : [], [report])
  const strengthPillars = useMemo(() => new Set(allCards.filter((c) => classificationBucket(c.classification) === 'strength').map((c) => normalizePillarName(c.pillar || ''))), [allCards])
  const findingPillars  = useMemo(() => new Set(allCards.filter((c) => classificationBucket(c.classification) === 'awareness').map((c) => normalizePillarName(c.pillar || ''))), [allCards])

  // Mode filter
  let modeCards = allCards
  if (mode === 'strengths') modeCards = allCards.filter((c) => classificationBucket(c.classification) === 'strength')
  if (mode === 'findings')  modeCards = allCards.filter((c) => classificationBucket(c.classification) === 'awareness')

  // Overview classification filter
  let displayCards = modeCards
  if (mode === 'overview' && classFilter !== 'all') {
    displayCards = displayCards.filter((c) => classificationBucket(c.classification) === classFilter)
  }
  // Pillar filter
  if (pillarFilter !== 'all') {
    displayCards = displayCards.filter((c) => normalizePillarName(c.pillar || '') === pillarFilter)
  }
  // Sort
  const evOrder = { strong: 0, established: 0, moderate: 1, emerging: 1, preliminary: 2, weak: 2 }
  displayCards = [...displayCards].sort((a, b) => {
    if (sortMode === 'alphabet') return String(a.gene || '').localeCompare(String(b.gene || ''))
    if (sortMode === 'pillar')   return String(a.pillar || '').localeCompare(String(b.pillar || ''))
    return (evOrder[String(a.evidence_strength || '').toLowerCase()] ?? 3) - (evOrder[String(b.evidence_strength || '').toLowerCase()] ?? 3)
  })

  // Group by pillar for findings + strengths modes
  const grouped = useMemo(() => {
    if (mode === 'overview') return null
    const map = {}
    for (const c of displayCards) {
      const p = normalizePillarName(c.pillar || '') || 'Other'
      if (!map[p]) map[p] = []
      map[p].push(c)
    }
    return map
  }, [displayCards, mode])

  const meta = MODE_META[mode]
  const narrative = narrativeForMode(mode, allCards)

  // Empty / no-genome guard — friendly upload prompt, NOT redirect.
  if (hydrated && !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] to-white">
        <SiteNav />
        <DashboardBackLink className="container pt-20 md:pt-24 -mb-4" />
        <main className="container py-16">
          <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ss-muted hover:text-ss-teal">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="mx-auto max-w-xl rounded-2xl border border-ss-border-warm bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-extrabold text-ss-teal">Upload your genome to see this page</h1>
            <p className="mt-2 text-sm text-ss-muted">{meta.subtitle} Once you upload a genome file, this page will populate with your personal results.</p>
            <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Link href="/genome" className="inline-flex items-center gap-2 rounded-full bg-ss-teal px-5 py-3 text-sm font-bold text-white hover:brightness-110">
                Upload a genome file
              </Link>
              <Link href="/genome?sample=1" className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-5 py-3 text-sm font-bold text-ss-teal hover:bg-ss-teal hover:text-white">
                Try with sample data
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Not yet hydrated — server-render a shell to avoid flash
  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] to-white"><SiteNav /><main className="container py-16"><div className="h-8 w-40 animate-pulse rounded bg-ss-muted/20" /></main></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] to-white">
      <SiteNav />
      <main className="container py-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ss-muted hover:text-ss-teal">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Snapshot header (overview only) */}
        {mode === 'overview' && (
          <div className="mb-6 rounded-2xl border border-ss-teal/30 bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-ss-teal">Genome Snapshot</div>
                <h1 className="mt-1 text-3xl font-extrabold text-ss-text">{meta.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/practitioner-report" className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-teal px-3 text-xs font-semibold text-ss-teal hover:bg-ss-teal hover:text-white md:min-h-8">
                  <FileText size={12} /> Practitioner Report
                </Link>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ss-muted">{narrative}</p>
          </div>
        )}
        {mode !== 'overview' && (
          <div className={`mb-6 rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-black/5 ${mode === 'strengths' ? 'border-ss-green/30' : 'border-ss-amber/30'}`}>
            <h1 className="text-3xl font-extrabold text-ss-text">{meta.title}</h1>
            <p className="mt-1 text-sm text-ss-muted">{meta.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-ss-text">{narrative}</p>
          </div>
        )}

        {/* Pillar tiles (overview only) */}
        {mode === 'overview' && (
          <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
            {PILLARS.map((p) => {
              const inPillar = allCards.filter((c) => normalizePillarName(c.pillar || '') === p.name)
              if (!inPillar.length) return null
              const s = inPillar.filter((c) => classificationBucket(c.classification) === 'strength').length
              const a = inPillar.filter((c) => classificationBucket(c.classification) === 'awareness').length
              const n = inPillar.length - s - a
              const active = pillarFilter === p.name
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPillarFilter(active ? 'all' : p.name)}
                  className={`rounded-2xl border p-3 text-left transition ${active ? 'border-ss-teal bg-ss-teal/5' : 'border-ss-border-warm bg-white hover:border-ss-teal'}`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ss-muted">{p.short}</div>
                  <div className="mt-1 flex gap-2 text-[11px] font-bold">
                    <span className="text-ss-green">{s}▲</span>
                    <span className="text-ss-amber">{a}◆</span>
                    <span className="text-ss-muted">{n}·</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Filter + sort bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {mode === 'overview' && (
            <div className="flex gap-1">
              {[
                { k: 'all', label: 'All' },
                { k: 'strength', label: 'Strengths' },
                { k: 'awareness', label: 'Areas' },
                { k: 'neutral', label: 'Neutral' },
              ].map((f) => (
                <button
                  key={f.k}
                  type="button"
                  onClick={() => setClassFilter(f.k)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${classFilter === f.k ? 'bg-ss-teal text-white' : 'bg-white text-ss-muted ring-1 ring-ss-border-warm hover:text-ss-teal'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          {(mode !== 'overview' || pillarFilter !== 'all') && (
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="rounded-full border border-ss-border-warm bg-white px-3 py-1 text-xs font-semibold text-ss-muted"
            >
              <option value="all">All pillars</option>
              {PILLARS.map((p) => <option key={p.key} value={p.name}>{p.short}</option>)}
            </select>
          )}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="rounded-full border border-ss-border-warm bg-white px-3 py-1 text-xs font-semibold text-ss-muted"
          >
            <option value="evidence">Sort: Evidence</option>
            <option value="pillar">Sort: Pillar</option>
            <option value="alphabet">Sort: Alphabetical</option>
          </select>
          <span className="ml-auto text-[11px] text-ss-muted">
            {displayCards.length} shown
          </span>
        </div>

        {/* Cards — grouped by pillar in strengths/findings, flat in overview */}
        {mode === 'overview' ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {displayCards.map((c, i) => (
              <VariantCard
                key={`${c.rsid || c.id}-${i}`}
                card={c}
                mode={mode}
                otherPillarHasContent={false}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped || {}).map(([pillar, cards]) => (
              <div key={pillar}>
                <h2 className={`mb-2 text-xs font-bold uppercase tracking-widest ${mode === 'strengths' ? 'text-ss-green' : 'text-ss-amber'}`}>{pillar}</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {cards.map((c, i) => {
                    const otherHas = mode === 'strengths'
                      ? findingPillars.has(normalizePillarName(c.pillar || ''))
                      : strengthPillars.has(normalizePillarName(c.pillar || ''))
                    return (
                      <VariantCard
                        key={`${c.rsid || c.id}-${i}`}
                        card={c}
                        mode={mode}
                        otherPillarHasContent={otherHas}
                        onCrossLinkClick={() => window.location.href = mode === 'strengths' ? '/genome/findings' : '/genome/strengths'}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {displayCards.length === 0 && (
          <div className="rounded-2xl border border-ss-border-warm bg-white p-8 text-center text-sm text-ss-muted">
            No variants match the current filters.
          </div>
        )}

        {/* "What to do next" */}
        <div className="mt-10">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ss-muted">What to do next</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link href="/practitioner-report" className="rounded-2xl border border-ss-border-warm bg-white p-4 shadow-sm hover:border-ss-teal">
              <FileText size={18} className="text-ss-teal" />
              <div className="mt-2 text-sm font-bold text-ss-text">Bring this to your doctor</div>
              <div className="mt-1 text-xs text-ss-muted">Open your practitioner report — everything you added is pre-filled.</div>
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(allCards.filter((c) => classificationBucket(c.classification) === (mode === 'strengths' ? 'strength' : 'awareness'))[0]?.gene?.split(/[\s(/·+,]/)[0] || 'genome')}`}
              className="rounded-2xl border border-ss-border-warm bg-white p-4 shadow-sm hover:border-ss-teal"
            >
              <Search size={18} className="text-ss-teal" />
              <div className="mt-2 text-sm font-bold text-ss-text">Search the research</div>
              <div className="mt-1 text-xs text-ss-muted">Read what the literature says about your top {mode === 'strengths' ? 'strength' : 'finding'}.</div>
            </Link>
            <Link href="/tools/supplements" className="rounded-2xl border border-ss-border-warm bg-white p-4 shadow-sm hover:border-ss-teal">
              <Pill size={18} className="text-ss-teal" />
              <div className="mt-2 text-sm font-bold text-ss-text">See your supplement matches</div>
              <div className="mt-1 text-xs text-ss-muted">Discover supplements aligned with your genotype.</div>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
