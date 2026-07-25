'use client'

// /app/components/Dashboard.jsx
// SelfScience — Personalized post-genome-upload dashboard.
//
// Reads genome results from sessionStorage (never a server call) and renders
// 6 sections: Top Findings, Strengths, Pillar Score Overview, Research
// Matched to You, Your Protocol Preview, Explore Your Pillars.
//
// PubMed research is fetched via /api/pubmed-search (server route) with
// graceful loading + empty/error states — PubMed failures never break the
// rest of the dashboard.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Sparkles, ShieldAlert, Loader2, Dna, Globe2, TestTube2, Activity, Pill, Compass, FileText } from 'lucide-react'
import { getGenomeResults } from '@/lib/genomeSession'
import { matchProtocolToUserVariants, flattenReportCards } from '@/lib/supplementProtocol'
import { normalizePillarName } from '@/lib/pillars'
import { PILLARS, default as SiteNav } from '@/components/site-nav'
import { usePillarFilter } from '@/components/PillarFilter'
import PillarChipBar from '@/components/dashboard/PillarChipBar'
import { explainGene } from '@/lib/geneExplanations'
import { useShowTechnicalTerms } from '@/lib/uiPrefs'
import TimeAwareBanner from '@/components/dashboard/TimeAwareBanner'
import GeneChip from '@/components/dashboard/GeneChip'
import { fetchMatchedResearch } from '@/lib/researchMatchedCache'
import StackQualityWidget from '@/components/supplements/StackQualityWidget'
import OnboardingTour from '@/components/dashboard/OnboardingTour'
import PostUploadOrientation from '@/components/PostUploadOrientation'

// localStorage keys \u2014 must stay ss_-namespaced per global rules.
const LS_DASH_PILLAR = 'ss_dashboard_pillar_filter'
const LS_LAST_VISIT = 'ss_last_visit'

export default function Dashboard() {
  const [report, setReport] = useState(null)
  const [orientationDone, setOrientationDone] = useState(false)
  const { pillar: activePillar, setPillar, clear: clearPillar, isFiltering } = usePillarFilter()
  const topFindingsRef = useRef(null)

  // Consult the same LS key the orientation component uses so we don't
  // even mount the interstitial after it's been dismissed.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const seen = window.localStorage.getItem('ss_orientation_seen')
      if (seen) setOrientationDone(true)
    } catch {}
  }, [])

  // \u2014 Persist pillar chip to ss_dashboard_pillar_filter and read it back on
  //   first mount if the URL didn't already carry a ?pillar=. The URL is
  //   still the source of truth so deep-links, back/forward, and refresh
  //   keep working; the localStorage layer is just a preference echo.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activePillar) {
      try { window.localStorage.setItem(LS_DASH_PILLAR, activePillar) } catch {}
    } else {
      try { window.localStorage.removeItem(LS_DASH_PILLAR) } catch {}
    }
  }, [activePillar])
  // Restore preference on first mount only if no ?pillar= param is set.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activePillar) return
    try {
      const saved = window.localStorage.getItem(LS_DASH_PILLAR)
      if (saved) setPillar(saved)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Snapshot the last-visit timestamp on first render so the "new since
  // your last visit" delta can be computed BEFORE we overwrite the
  // timestamp for this session. Update ss_last_visit after snapshotting.
  const [prevVisitISO, setPrevVisitISO] = useState(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const prev = window.localStorage.getItem(LS_LAST_VISIT)
      setPrevVisitISO(prev || null)
      window.localStorage.setItem(LS_LAST_VISIT, new Date().toISOString())
    } catch {}
  }, [])

  // Hydrate from sessionStorage after mount so we don't hit SSR issues.
  useEffect(() => {
    setReport(getGenomeResults())
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const allStrengths = report?.overview?.strengths || []
  const allAreas     = report?.overview?.areasToExplore || []

  // Filter strengths + areas by the active pillar. When no pillar is
  // selected, we behave exactly like before (top 3 of everything).
  // Card `.pillar` names come from the classifier and may not match the
  // canonical UI names — route them through normalizePillarName first.
  const matchesPillar = useCallback(
    (card) => {
      if (!activePillar) return true
      const norm = normalizePillarName((card?.pillar || '').trim())
      return norm === activePillar
    },
    [activePillar],
  )

  const strengths = useMemo(() => allStrengths.filter(matchesPillar).slice(0, 3), [allStrengths, matchesPillar])
  const areas     = useMemo(() => allAreas.filter(matchesPillar).slice(0, 3), [allAreas, matchesPillar])

  const pillarSummary = report?.step1?.pillar_summary || {}

  // Map each pillar name → the user's gene symbols associated with it via
  // the classified variant cards. Used to build "pillar + your genes"
  // hand-off links on the pillar tiles so clicking Environmental Sensitivity
  // from the Dashboard searches for the pillar keyword AND the user's actual
  // Environmental-Sensitivity-tagged genes at once.
  //
  // Names emitted by the classifier ("Brain & Neurochemistry", "Sleep &
  // Circadian", …) don't always match the canonical UI PILLARS
  // ("Mental Health & Neurochemistry", "General Wellness"). We route every
  // classifier pillar through normalizePillarName() before bucketing so no
  // gene-set gets orphaned.
  const pillarGenes = useMemo(() => {
    if (!report) return {}
    const map = {}
    for (const c of flattenReportCards(report)) {
      const pillar = normalizePillarName((c.pillar || '').trim())
      const gene = (c.gene || '').trim()
      if (!pillar || !gene) continue
      // Strip haplotype-style noise from combined labels like
      // "MTHFR (C677T)" or "APOE ε3/ε4" — keep the primary gene symbol.
      const symbol = gene.split(/[\s(/·+,]/)[0].toUpperCase()
      if (!symbol || symbol.length > 12 || /^RS\d/i.test(symbol)) continue
      if (!map[pillar]) map[pillar] = new Set()
      map[pillar].add(symbol)
    }
    // Convert Sets to sorted arrays for stable URL params.
    const out = {}
    for (const [k, v] of Object.entries(map)) out[k] = [...v].sort()
    return out
  }, [report])

  // Fast lookup Set of the active pillar's gene symbols (uppercased).
  // Empty Set when no pillar selected.
  const pillarGeneSetForActive = useMemo(() => {
    if (!activePillar) return new Set()
    return new Set((pillarGenes[activePillar] || []).map((g) => g.toUpperCase()))
  }, [activePillar, pillarGenes])

  // Derive top gene symbols for research matching.
  // Sourced from ALL classified variant cards (not just the trimmed
  // overview.strengths/areasToExplore lists) so we don't miss genes that
  // ONLY appear in report.fullReport or variants_recognized. We keep
  // "benefit" (positive) + "awareness" categories \u2014 skip "neutral" per
  // spec since neutral variants aren't actionable enough to warrant a
  // dedicated PubMed lookup.
  const topGenes = useMemo(() => {
    if (!report) return []
    if (activePillar) {
      // Pillar-filtered mode: mirror the tile's tagged gene set.
      return (pillarGenes[activePillar] || []).slice(0, 8)
    }
    const cards = flattenReportCards(report) || []
    const seen = new Set()
    const out = []
    // Priority order: awareness (Areas to Explore) first \u2014 these are the
    // ones the user most wants research on \u2014 then benefit (Strengths).
    const rank = (c) => {
      const cat = String(c?.category || '').toLowerCase()
      if (cat === 'awareness') return 0
      if (cat === 'benefit' || cat === 'positive' || cat === 'strength') return 1
      return 9 // neutral / unknown \u2014 skipped by the filter below anyway
    }
    const sorted = [...cards].sort((a, b) => rank(a) - rank(b))
    for (const c of sorted) {
      const cat = String(c?.category || '').toLowerCase()
      if (cat === 'neutral') continue
      const raw = (c?.gene || '').trim()
      if (!raw) continue
      // Split combined labels like "MTHFR (C677T)" or "APOE \u03b53/\u03b54" \u2014 keep the
      // primary gene symbol. Skip rsid-shaped tokens.
      const symbol = raw.split(/[\s(/\u00b7+,]/)[0].toUpperCase()
      if (!symbol || symbol.length > 12 || /^RS\d/i.test(symbol)) continue
      if (seen.has(symbol)) continue
      seen.add(symbol)
      out.push(symbol)
      if (out.length >= 8) break
    }
    return out
  }, [report, activePillar, pillarGenes])

  const protocolPreview = useMemo(() => {
    if (!report) return []
    const g = matchProtocolToUserVariants(report)
    const merged = [...g.priority, ...g.lifestyle, ...g.awareness]
    if (!activePillar) return merged.slice(0, 3)
    // When pillar is active, prefer entries whose gene belongs to that
    // pillar's classifier-tagged gene set. Fall back to the untagged mix
    // if nothing matches so this card isn't empty on sparse reports.
    const filtered = merged.filter((e) => {
      const symbol = String(e?.gene || '').split(/[\s(/·+,]/)[0].toUpperCase()
      return pillarGeneSetForActive.has(symbol)
    })
    return (filtered.length ? filtered : merged).slice(0, 3)
  }, [report, activePillar, pillarGeneSetForActive])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-20">
      <SiteNav />
      {/* Post-upload orientation screen (Phase A · Part 4) — shown once
          per genome upload BEFORE the full dashboard. If already dismissed
          this returns null and we render the dashboard normally. */}
      {!orientationDone && report && (
        <PostUploadOrientation
          report={report}
          onDismiss={() => setOrientationDone(true)}
        />
      )}
      {/* Only render the rest of the dashboard once the orientation has
          been dismissed (or was already seen for this report). */}
      {(orientationDone || !report) && (
      <>
      {/* Header — pt-24 clears the absolute-positioned SiteNav (~64px) + a
          gap for the fixed dashboard/discover toggle beneath it. */}
      <div className="container pt-24 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              Your Dashboard
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Welcome back — here&apos;s what your genome says today.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              Personalized snapshot of your top findings, protocol, and matching research — all in one place.
            </p>
            {/* Ambient time- and genome-aware note (rendered only when a
                matching variant is present). */}
            <TimeAwareBanner report={report} />
          </div>
          <Link
            href="/genome/overview"
            className="inline-flex items-center gap-2 rounded-full border-2 border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
          >
            See your full genome report <ArrowRight size={14} />
          </Link>
        </div>

        {/* Horizontal, scrollable pillar chip bar. Replaces the older
            dropdown filter per Section 2 spec. Persisted to both the URL
            (?pillar=) and localStorage (ss_dashboard_pillar_filter). */}
        <div className="mt-6">
          <PillarChipBar value={activePillar} onChange={setPillar} />
        </div>
      </div>

      <div ref={topFindingsRef} className="container mt-10 space-y-14">
        {/* 1. TOP FINDINGS (Be Aware) */}
        <div data-tour-target="top-findings">
          <DashSection title="Your Top Findings" subtitle="The most notable Be Aware findings from your genome." toneClass="text-ss-amber">
            {areas.length === 0 ? (
              <EmptyRow copy="No awareness findings surfaced — every recognized variant is in favorable or neutral range." />
            ) : (
              <CardRow items={areas} tone="aware" />
            )}
            <SeeAllLink
              href="/genome/findings"
              label={`See all ${allAreas.length} awareness finding${allAreas.length === 1 ? '' : 's'}`}
            />
          </DashSection>
        </div>

        {/* 2. STRENGTHS */}
        <div data-tour-target="strengths">
          <DashSection title="Your Strengths" subtitle="Your top favorable variants." toneClass="text-ss-green">
            {strengths.length === 0 ? (
              <EmptyRow copy="No positive findings surfaced yet — explore your full report for the complete picture." />
            ) : (
              <CardRow items={strengths} tone="strength" />
            )}
            <SeeAllLink
              href="/genome/strengths"
              label={`See all ${allStrengths.length} strength${allStrengths.length === 1 ? '' : 's'}`}
            />
          </DashSection>
        </div>

        {/* 3. YOUR PILLARS (merged: was "Pillar Score Overview" + "Explore Your Pillars")
             Every card shows icon + name + description + colored progress bar
             + Benefit/Aware/Neutral counts + your matched gene chips, and
             navigates to /search?pillar=X&genes=A,B,C so the search page
             immediately fans out on arrival. In-page pillar filtering is
             handled exclusively by the horizontal chip bar above. */}
        <div data-tour-target="pillar-grid">
          <DashSection title="Explore Your Pillars" subtitle="Tap any pillar to search the research with your matched genes." toneClass="text-ss-teal">
            {/* Legend */}
            <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-ss-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-ss-green" aria-hidden="true" /> Benefit
              </span>
              <span className="text-ss-border-warm">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-ss-amber" aria-hidden="true" /> Aware
              </span>
              <span className="text-ss-border-warm">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-ss-border-warm" aria-hidden="true" /> Neutral
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((p) => (
                <PillarCard
                  key={p.key}
                  pillar={p}
                  summary={pillarSummary[p.name]}
                  genes={pillarGenes[p.name] || []}
                />
              ))}
            </div>
          </DashSection>
        </div>

        {/* 4. RESEARCH MATCHED TO YOU */}
        <ResearchMatched genes={topGenes} prevVisitISO={prevVisitISO} />

        {/* Stack Quality Widget */}
        <div className="mt-8">
          <StackQualityWidget />
        </div>

        {/* 5. YOUR PROTOCOL PREVIEW */}
        <DashSection title="Your Protocol Preview" subtitle="First 3 variant-driven recommendations. Full protocol is in the Genome tab." toneClass="text-ss-teal">
          {protocolPreview.length === 0 ? (
            <EmptyRow copy="No protocol matches yet — more findings unlock more recommendations." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {protocolPreview.map((entry) => (
                <ProtocolPreviewCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
          <SeeAllLink href="/genome/protocol" label="See your full protocol" />
        </DashSection>

        {/* 6. DEEP-DIVE TOOLS */}
        <DashSection
          title="Deep-Dive Tools"
          subtitle="Explore what your genome means in specific contexts — labs, training, medications, and global populations."
          toneClass="text-ss-teal"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ToolCard
              href="/biomarkers"
              Icon={TestTube2}
              title="Lab Biomarkers"
              blurb="Log blood work and see how it correlates with your genome findings."
            />
            <ToolCard
              href="/training"
              Icon={Activity}
              title="Training Protocol"
              blurb="Personalized zone-based training + sport affinity based on your variants."
            />
            <ToolCard
              href="/drug-check"
              Icon={Pill}
              title="Drug Check"
              blurb="Look up a medication and see estimated pharmacogenomic guidance."
            />
            <ToolCard
              href="/population-compare"
              Icon={Globe2}
              title="Population Compare"
              blurb="See how rare your genotype is and where in the world it&rsquo;s most common."
            />
            <ToolCard
              href="/ancestry"
              Icon={Compass}
              title="Ancestry Report"
              blurb="A rough educational ancestry sketch from your geographically stratified variants."
            />
            <ToolCard
              href="/practitioner-report"
              Icon={FileText}
              title="Practitioner Report"
              blurb="Clinician-facing single-page summary, ready to print or save as PDF."
            />
          </div>
        </DashSection>

        {/* Educational disclaimer footer */}
        <div className="rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-ss-amber" />
            <p className="text-sm text-ss-text">
              <span className="font-semibold">Educational only.</span> This dashboard summarizes research associations, not medical predictions. Talk to a qualified clinician before making health decisions from this information.
            </p>
          </div>
        </div>
      </div>
      {/* Slice 4A: first-time tooltip tour. Only renders when the
          ss_onboarding_complete flag is falsy. Safe to mount always —
          the component short-circuits internally. */}
      <OnboardingTour />
      </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function DashSection({ title, subtitle, toneClass, children }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className={`text-xl font-extrabold ${toneClass || 'text-ss-teal'}`}>{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ss-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function SeeAllLink({ href, label }) {
  return (
    <div className="mt-4">
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-ss-teal hover:underline">
        {label} <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function EmptyRow({ copy }) {
  return (
    <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-6 text-center text-sm text-ss-muted">
      {copy}
    </div>
  )
}

function CardRow({ items, tone }) {
  const border = tone === 'strength' ? '#2E7D32' : tone === 'aware' ? '#964219' : '#7A7974'
  const showTech = useShowTechnicalTerms()
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((c, i) => {
        const explainer = explainGene(c.gene, c.rsid)
        return (
        <div
          key={c.rsid || i}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          style={{ borderLeft: `4px solid ${border}` }}
        >
          <div className="text-sm font-bold text-ss-teal">{c.name || c.gene}</div>
          {/* Associated-with row: shows the pillar (and trait if available) so
              users immediately see what health area each variant relates to. */}
          {(c.pillar || c.trait) && (
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10.5px] text-ss-muted">
              <span className="font-semibold uppercase tracking-wider text-ss-teal/70">Associated with</span>
              {c.pillar && (
                <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 font-semibold text-ss-teal">{c.pillar}</span>
              )}
              {c.trait && c.trait !== (c.name || c.gene) && (
                <span className="text-ss-muted">· {c.trait}</span>
              )}
            </div>
          )}
          {/* Plain-English gene job description — shown ABOVE the
              variant's classification text so users see WHAT the gene
              does first, then WHAT the finding says. */}
          {explainer && (
            <p className="mt-2 text-xs leading-relaxed text-ss-text">
              <span className="font-semibold text-ss-teal">What it does — </span>
              {explainer}
            </p>
          )}
          <p className="mt-2 line-clamp-3 text-sm text-ss-text">{c.plain || ''}</p>
          {showTech ? (
            <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-ss-muted">
              {c.gene && <code className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{c.gene}</code>}
              {c.rsid && <code className="rounded bg-ss-bg px-1.5 py-0.5">{c.rsid}</code>}
              {c.genotype && <span className="font-semibold">{c.genotype}</span>}
            </div>
          ) : (
            c.gene && (
              <div className="mt-3 text-[10px] text-ss-muted">
                <span className="font-semibold text-ss-teal">Gene:</span> {c.gene}
              </div>
            )
          )}
        </div>
      )})}
    </div>
  )
}

// Unified pillar card — merges the former PillarTile (colored progress bar +
// counts + gene chip preview) and ExplorePillarCard (description + Search
// navigation) into a single grid card. Click always navigates to
// /search?pillar=X&genes=A,B,... so the Search page can fan out immediately.
function PillarCard({ pillar, summary, genes = [] }) {
  const positive  = summary?.positive  || 0
  const awareness = summary?.awareness || 0
  const neutral   = summary?.neutral   || 0
  const total     = positive + awareness + neutral
  const isZeroVariant = total === 0

  // High-Aware pillars (≥3 aware, 0 benefit) get a reassurance line.
  const showHighAwareNote = awareness >= 3 && positive === 0

  // Build the /search hand-off URL with the user's classified genes for this
  // pillar. Capped at 12 to keep URLs reasonable and matches the Search
  // page's own cap.
  const params = new URLSearchParams({ pillar: pillar.name })
  if (genes.length) params.set('genes', genes.slice(0, 12).join(','))

  return (
    <Link
      href={`/search?${params.toString()}`}
      className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
      aria-label={`Search research for ${pillar.name}${genes.length ? ` with ${genes.length} of your genes` : ''}`}
    >
      {/* Header row: icon + name + arrow */}
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
          <pillar.Icon size={20} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-ss-teal">{pillar.name}</div>
          <div className="mt-1 text-xs text-ss-muted line-clamp-2">{pillar.description}</div>
        </div>
        <ArrowRight size={14} className="mt-2 flex-shrink-0 text-ss-muted transition group-hover:translate-x-0.5 group-hover:text-ss-teal" />
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-ss-border-warm/40" aria-hidden="true">
        {total === 0 ? (
          <div className="h-full w-full" />
        ) : (
          <>
            {positive  > 0 && <div className="h-full bg-ss-green"       style={{ width: `${(positive  / total) * 100}%` }} />}
            {awareness > 0 && <div className="h-full bg-ss-amber"       style={{ width: `${(awareness / total) * 100}%` }} />}
            {neutral   > 0 && <div className="h-full bg-ss-border-warm" style={{ width: `${(neutral   / total) * 100}%` }} />}
          </>
        )}
      </div>

      {/* Count row */}
      {isZeroVariant ? (
        <div className="mt-2 text-[10.5px] italic text-ss-muted">
          No notable variants detected — a favorable signal.
        </div>
      ) : (
        <div className="mt-2 text-[10.5px] text-ss-muted">
          <span className="font-semibold text-ss-green">{positive}</span> Benefit
          <span className="mx-1.5 text-ss-border-warm">·</span>
          <span className="font-semibold text-ss-amber">{awareness}</span> Aware
          <span className="mx-1.5 text-ss-border-warm">·</span>
          <span className="font-semibold text-ss-muted">{neutral}</span> Neutral
        </div>
      )}

      {/* Gene chips — the actual genes that will be passed to Search */}
      {genes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {genes.slice(0, 6).map((g) => (
            <GeneChip key={g} gene={g} size="sm" />
          ))}
          {genes.length > 6 && (
            <span className="self-center text-[10px] font-semibold text-ss-muted">+{genes.length - 6}</span>
          )}
        </div>
      )}

      {showHighAwareNote && (
        <div className="mt-3 border-t border-ss-border-warm/60 pt-2 text-[10.5px] leading-snug text-ss-muted">
          These findings relate to manageable exposures — not deterministic health outcomes.
        </div>
      )}
    </Link>
  )
}

function ToolCard({ href, Icon, title, blurb }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal transition group-hover:bg-ss-teal group-hover:text-white">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <ArrowRight size={14} className="text-ss-muted transition group-hover:translate-x-0.5 group-hover:text-ss-teal" />
      </div>
      <div className="mt-3 text-sm font-bold text-ss-teal">{title}</div>
      <div className="mt-1 text-xs text-ss-muted">{blurb}</div>
    </Link>
  )
}

function ProtocolPreviewCard({ entry }) {
  const first = entry.recommendations?.[0]
  if (!first) return null
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-ss-teal" />
        <span className="text-xs font-bold uppercase tracking-wider text-ss-teal">{entry.gene}</span>
      </div>
      <div className="mt-2 text-base font-bold text-ss-text">{first.name}</div>
      <p className="mt-2 text-xs text-ss-muted line-clamp-3">{first.mechanism}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Research Matched section \u2014 fetches PubMed per top gene (max 8), dedupes
// across genes by PMID, keeps the top 6 papers, and tags each with the
// gene(s) it was matched against. Uses a session-scoped cache to avoid
// re-querying on every render / tab-switch.
// ---------------------------------------------------------------------------

function ResearchMatchedSkeleton({ count = 6 }) {
  // Card-shaped placeholders so the layout doesn't jump when the real
  // cards arrive. Count matches the max we'll display.
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60"
        >
          <div className="mb-3 h-4 w-24 rounded bg-ss-border-warm/60" />
          <div className="mb-2 h-4 w-full rounded bg-ss-border-warm/40" />
          <div className="mb-2 h-4 w-11/12 rounded bg-ss-border-warm/40" />
          <div className="mb-3 h-4 w-3/4 rounded bg-ss-border-warm/40" />
          <div className="h-3 w-1/3 rounded bg-ss-border-warm/30" />
        </div>
      ))}
    </div>
  )
}

function ResearchMatched({ genes, prevVisitISO }) {
  const [loading, setLoading] = useState(false)
  const [papers, setPapers] = useState([]) // deduped, max 6
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!genes || genes.length === 0) {
      setPapers([])
      setAttempted(true)
      return
    }
    let alive = true
    setLoading(true)
    setAttempted(false)
    ;(async () => {
      const map = await fetchMatchedResearch(genes, { perGene: 3, concurrency: 4 })
      if (!alive) return
      // Merge across genes with dedupe by PMID. Track which genes each
      // paper is relevant to so we can display "Relevant to your <GENE>"
      // tags per card.
      const byPmid = new Map() // pmid -> paper object with genes[]
      // Iterate in the same order as `genes` so earlier (higher-priority)
      // genes anchor the tag order.
      for (const g of genes) {
        const G = String(g).toUpperCase()
        const list = map.get(G) || []
        for (const p of list) {
          const id = p.pmid || p.id || `${p.title || ''}`
          if (!id) continue
          const existing = byPmid.get(id)
          if (existing) {
            if (!existing.genes.includes(G)) existing.genes.push(G)
          } else {
            byPmid.set(id, { ...p, genes: [G] })
          }
        }
      }
      // Interleave: take the first paper for gene 1, then gene 2, etc.,
      // then round back to gene 1 for the second paper. This surfaces
      // breadth-first coverage across the user's top variants rather than
      // 3 papers all about the same gene.
      const perGene = new Map()
      for (const g of genes) perGene.set(String(g).toUpperCase(), [])
      for (const p of byPmid.values()) {
        const anchor = p.genes[0]
        if (perGene.has(anchor)) perGene.get(anchor).push(p)
      }
      const interleaved = []
      const seenIds = new Set()
      let progressed = true
      while (progressed && interleaved.length < 6) {
        progressed = false
        for (const g of genes) {
          const G = String(g).toUpperCase()
          const q = perGene.get(G)
          if (!q || q.length === 0) continue
          const item = q.shift()
          const id = item.pmid || item.id || item.title
          if (seenIds.has(id)) continue
          seenIds.add(id)
          interleaved.push(item)
          progressed = true
          if (interleaved.length >= 6) break
        }
      }
      setPapers(interleaved)
      setLoading(false)
      setAttempted(true)
    })()
    return () => {
      alive = false
    }
  }, [genes])

  // "See all matched research" fires a full fan-out on the Search page
  // using the user's top-8 genes so they can drill into the long tail.
  const seeAllHref = useMemo(() => {
    if (!genes || genes.length === 0) return '/search'
    const params = new URLSearchParams({ genes: genes.slice(0, 8).join(',') })
    return `/search?${params.toString()}`
  }, [genes])

  // "New since your last visit" delta \u2014 count papers whose year is
  // greater than the year of the previous visit timestamp, or whose
  // pubDate (if present) is after the previous visit. Skipped entirely
  // for first-time visitors (prevVisitISO === null).
  const newSincePrev = useMemo(() => {
    if (!prevVisitISO || papers.length === 0) return 0
    const prev = new Date(prevVisitISO)
    if (Number.isNaN(prev.getTime())) return 0
    const prevYear = prev.getFullYear()
    let count = 0
    for (const p of papers) {
      let isNew = false
      if (p.pubDate) {
        const d = new Date(p.pubDate)
        if (!Number.isNaN(d.getTime()) && d > prev) isNew = true
      }
      if (!isNew && p.year && Number(p.year) > prevYear) isNew = true
      if (isNew) count += 1
    }
    return count
  }, [papers, prevVisitISO])

  // Never show empty state unless we've completed a fetch AND all genes
  // returned zero results.
  const allFailed = attempted && !loading && papers.length === 0

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-ss-teal">
            Research Matched to You
            {newSincePrev > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-ss-orange/15 px-2 py-0.5 align-middle text-[10px] font-extrabold uppercase tracking-wide text-ss-orange">
                <Sparkles size={10} /> {newSincePrev} new since your last visit
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-ss-muted">Recent papers touching your top variant genes.</p>
        </div>
      </div>
      {loading ? (
        <ResearchMatchedSkeleton count={6} />
      ) : allFailed ? (
        <EmptyRow copy={
          genes.length === 0
            ? 'Load a genome to see research matched to your top variants.'
            : 'No recent research found for your top genes right now \u2014 try again later.'
        } />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {papers.map((p, i) => (
              <ResearchMatchedCard key={p.pmid || p.id || i} paper={p} />
            ))}
          </div>
          <div className="mt-3 text-right">
            <Link
              href={seeAllHref}
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-ss-teal hover:underline"
            >
              See all matched research <ArrowRight size={12} />
            </Link>
          </div>
        </>
      )}
    </section>
  )
}

function ResearchMatchedCard({ paper }) {
  const genes = paper.genes || []
  const title = paper.title || '(untitled)'
  const journal = paper.journal || ''
  const year = paper.year || null
  const url = paper.pubmedUrl || (paper.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/` : paper.url) || null
  const reliability = paper.reliabilityLabel || paper.reliability || null
  const dotColor =
    reliability === 'high' || String(reliability).toLowerCase().includes('high') ? 'bg-ss-green' :
    reliability === 'moderate' || String(reliability).toLowerCase().includes('moderate') ? 'bg-ss-amber' :
    reliability === 'low' || String(reliability).toLowerCase().includes('low') ? 'bg-red-500' :
    'bg-ss-border-warm'
  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
      {/* Gene relevance tag(s) */}
      <div className="mb-2 flex flex-wrap gap-1">
        {genes.slice(0, 2).map((g) => (
          <span
            key={g}
            className="inline-flex items-center gap-1 rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold text-ss-teal"
          >
            <Dna size={10} /> Relevant to your {g} variant
          </span>
        ))}
      </div>
      <div className="line-clamp-3 text-sm font-semibold text-ss-text">{title}</div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-ss-muted">
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} aria-hidden="true" />
        <span className="line-clamp-1">
          {journal}{year ? ` \u00b7 ${year}` : ''}
        </span>
      </div>
      {url && (
        <div className="mt-3 flex justify-end">
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-teal px-3 py-1.5 text-xs font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
          >
            View <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}
