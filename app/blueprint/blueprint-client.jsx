'use client'

// /app/app/blueprint/blueprint-client.jsx
// The Personal Health Blueprint — unified 7-section synthesis of
// everything the platform knows about the user. Additive only.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Printer, Sun, Zap, Moon, Sparkles, CheckCircle2, Circle,
  BookOpen, Utensils, AlertTriangle, Clock, ArrowRight, ArrowLeft,
  FlaskConical, Dna, Compass,
} from 'lucide-react'
import SiteNav, { PILLARS } from '@/components/site-nav'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'
import {
  getGenomeStats, getTopPillar, getGenomeSummarySentence,
  getTopPriorities, getDailyProtocol, getSupplementPicture,
  getNutritionProfile, getNextSteps, useLastUpdated,
} from '@/lib/blueprint'
import {
  pickTopDigestVariants, fetchWeeklyPaper, readDigestCache, writeDigestCache, digestIsFresh,
} from '@/lib/weeklyDigest'
import SaveButton from '@/components/SaveButton'

export default function BlueprintClient() {
  const [report, setReport] = useState(null)
  useEffect(() => {
    setReport(getGenomeResults())
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const lastUpdated = useLastUpdated()
  const stats = useMemo(() => getGenomeStats(report), [report])
  const topPillar = useMemo(() => getTopPillar(report), [report])
  const summary = useMemo(() => getGenomeSummarySentence(report), [report])
  const priorities = useMemo(() => getTopPriorities(report, 5), [report])
  const protocol = useMemo(() => getDailyProtocol(report), [report])
  const supps = useMemo(() => getSupplementPicture(report), [report])
  const nutrition = useMemo(() => getNutritionProfile(report), [report])
  const [nextSteps, setNextSteps] = useState([])
  useEffect(() => {
    // Recompute next-steps whenever anything relevant changes.
    const recompute = () => setNextSteps(getNextSteps())
    recompute()
    const events = [
      'selfscience:journal-changed', 'selfscience:reading-list-changed',
      'selfscience:achievements-changed', 'selfscience:genome-changed',
      'selfscience:profile-changed',
    ]
    events.forEach((e) => window.addEventListener(e, recompute))
    return () => events.forEach((e) => window.removeEventListener(e, recompute))
  }, [report])

  // Determine the top pillar object for icon rendering.
  const topPillarObj = topPillar ? PILLARS.find((p) => p.name === topPillar.name) : null

  const openQuiz = () => {
    try { window.dispatchEvent(new Event('selfscience:open-health-story-quiz')) } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24">
      {/* Scoped print CSS — hides interactive scaffolding, keeps 7 sections */}
      <style jsx global>{`
        @media print {
          @page { margin: 15mm; }
          html, body { background: #fff !important; }
          header, nav, footer, .no-print { display: none !important; }
          /* Hide global floating elements */
          [aria-label="Add journal entry"],
          [aria-labelledby="journey-guide-heading"],
          [role="status"],
          [data-tour-target] .no-print { display: none !important; }
          .bp-print-page-break { page-break-before: always; break-before: page; }
          .bp-section { break-inside: avoid; }
          .bp-card, .bp-priority, .bp-tier, .bp-next-step { break-inside: avoid; }
          .bp-container { padding-top: 0 !important; }
          .bp-hero-bg { background: none !important; }
          a { color: #1B474D; text-decoration: none; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="no-print">
        <SiteNav />
      </div>

      <div className="bp-container container pt-24 md:pt-28">
        {/* Header */}
        <div className="no-print">
          <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
            <ArrowLeft size={12} /> Dashboard
          </Link>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              className="font-mono text-[10px] font-bold uppercase text-ss-teal"
              style={{ letterSpacing: '0.14em' }}
            >
              Personalized Synthesis
            </div>
            <h1
              className="mt-1 font-extrabold text-ss-teal"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.05 }}
            >
              Your Health Blueprint
            </h1>
            <p className="mt-2 max-w-2xl text-base text-ss-muted">
              Everything SelfScience knows about your biology — synthesized into one place. Updated as you explore.
            </p>
            <div
              className="mt-2 font-mono text-[10px] text-ss-muted"
              style={{ letterSpacing: '0.02em' }}
            >
              Last updated: {lastUpdated.toLocaleString(undefined, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-teal-dark"
          >
            <Printer size={14} /> Print Blueprint
          </button>
        </div>

        <div className="mt-10 space-y-14">
          {/* ============= SECTION 1 — GENETIC IDENTITY ============= */}
          <Section eyebrow="Section 1 of 7" title="Your Genetic Identity">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Card A — At a Glance */}
              <BPCard title="Your Genome at a Glance">
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Total variants" value={stats.total} />
                  <Stat label="Strengths" value={stats.positive} accent="text-ss-green" />
                  <Stat label="Explore" value={stats.awareness} accent="text-ss-amber" />
                  <Stat label="Neutral" value={stats.neutral} accent="text-ss-muted" />
                </div>
              </BPCard>

              {/* Card B — Top Pillar */}
              <BPCard title="Your Top Pillar">
                {topPillar && topPillarObj ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
                        <topPillarObj.Icon size={20} strokeWidth={1.5} />
                      </span>
                      <div>
                        <div className="text-base font-extrabold text-ss-teal">{topPillar.name}</div>
                        <div className="text-xs text-ss-muted">{topPillar.count} finding{topPillar.count === 1 ? '' : 's'}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-ss-muted">
                      Your most active research area is <span className="font-semibold text-ss-teal">{topPillar.name}</span> with {topPillar.count} findings.
                    </p>
                  </div>
                ) : (
                  <EmptyLine copy="Upload your genome to identify your top pillar." />
                )}
              </BPCard>

              {/* Card C — Summary Sentence */}
              <BPCard title="Your Summary" accent="ss-teal">
                {summary ? (
                  <p className="text-sm leading-relaxed text-ss-text">{summary}</p>
                ) : (
                  <EmptyLine copy="Upload your genome to generate your summary." />
                )}
              </BPCard>
            </div>
          </Section>

          {/* ============= SECTION 2 — TOP PRIORITIES ============= */}
          <Section eyebrow="Section 2 of 7" title="Your Top Priorities Right Now"
            subtitle="The findings with the highest practical impact for your daily life — ranked by action urgency.">
            {priorities.length === 0 ? (
              <EmptyLine copy="Upload your genome to see your top priorities." />
            ) : (
              <div className="space-y-3">
                {priorities.map((p, i) => <PriorityRow key={p.id || i} p={p} />)}
              </div>
            )}
            <SeeAllLink href="/genome/findings" label="See all findings" />
          </Section>

          {/* ============= SECTION 3 — DAILY PROTOCOL ============= */}
          <Section eyebrow="Section 3 of 7" title="Your Daily Protocol"
            subtitle="What your genome suggests you focus on every day — organized by morning, training, and evening.">
            <div className="grid gap-4 md:grid-cols-3">
              <ProtocolColumn Icon={Sun}   label="Morning"   items={protocol.morning} accent="text-ss-amber" />
              <ProtocolColumn Icon={Zap}   label="Training" items={protocol.training} accent="text-ss-teal" />
              <ProtocolColumn Icon={Moon}  label="Evening"   items={protocol.evening} accent="text-ss-teal" />
            </div>
            <p className="mt-4 text-[0.82rem] italic text-ss-muted">
              This protocol is derived from your genetic findings — not medical advice. Discuss with your healthcare provider before making changes.
            </p>
          </Section>

          {/* ============= SECTION 4 — SUPPLEMENTS ============= */}
          <Section eyebrow="Section 4 of 7" title="Your Supplement Picture"
            subtitle="Supplements with the strongest genetic rationale for your specific profile.">
            {!report ? (
              <EmptyLine copy="Upload your genome to see your personalized supplement picture." />
            ) : (
              <div className="space-y-4">
                <SupplementTier
                  title="Most Supported by Your Genome"
                  tone="green"
                  items={supps.tier1}
                  emptyCopy="No priority-tier variant matches surfaced. Explore your Findings for the full picture."
                />
                <SupplementTier
                  title="Worth Considering"
                  tone="amber"
                  items={supps.tier2}
                  emptyCopy={null}
                />
                <SupplementTier
                  title="General Foundation (Provider Discussion)"
                  tone="teal"
                  items={supps.tier3}
                  emptyCopy={null}
                />
              </div>
            )}
            <SeeAllLink href="/tools/supplements" label="Explore Supplement Discovery" />
          </Section>

          {/* ============= SECTION 5 — NUTRITION ============= */}
          <Section eyebrow="Section 5 of 7" title="Your Nutrition Profile"
            subtitle="How your genes shape what and when to eat.">
            <div className="grid gap-4 md:grid-cols-3">
              <NutritionColumn Icon={CheckCircle2} label="Foods to Prioritize" items={nutrition.prioritize} tone="green" />
              <NutritionColumn Icon={AlertTriangle} label="Foods to Be Mindful Of" items={nutrition.mindful} tone="amber" />
              <NutritionColumn Icon={Clock} label="Eating Timing" items={nutrition.timing} tone="teal" />
            </div>
            <SeeAllLink href="/nutrition" label="Explore Nutrition Hub" />
          </Section>

          {/* ============= SECTION 6 — RESEARCH SNAPSHOT ============= */}
          <Section eyebrow="Section 6 of 7" title="Your Research Snapshot"
            subtitle="The most relevant recent papers from the scientific literature matched to your genome.">
            <ResearchSnapshot report={report} />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <SeeAllLink href="/search" label="Search research for your genome" />
              <SeeAllLink href="/" label="View this week’s digest" />
            </div>
          </Section>

          {/* ============= SECTION 7 — NEXT STEPS ============= */}
          <Section eyebrow="Section 7 of 7" title="Your Next Steps"
            subtitle="The highest-value actions you have not taken yet — based on your genome and your progress on the platform.">
            {nextSteps.length === 0 ? (
              <EmptyLine copy="Loading recommendations…" />
            ) : (
              <ul className="space-y-2">
                {nextSteps.map((s) => (
                  <NextStep key={s.id} step={s} onQuizOpen={openQuiz} />
                ))}
              </ul>
            )}
          </Section>

          {/* Footer disclaimer + print-only closing */}
          <div className="rounded-2xl border-l-4 border-ss-teal bg-white/70 p-4">
            <p className="text-sm text-ss-muted">
              <span className="font-semibold text-ss-teal">Educational only.</span> This Blueprint summarizes research associations, not medical predictions. Talk to a qualified clinician before making health decisions from this information.
            </p>
          </div>
          <div className="print-only mt-6 text-center text-[10px] text-ss-muted">
            SelfScience Blueprint — {lastUpdated.toLocaleString()} — Educational only. Not medical advice.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================ Sub-components ============================ */

function Section({ eyebrow, title, subtitle, children }) {
  return (
    <section className="bp-section">
      <div className="mb-4">
        <div
          className="font-mono text-[10px] font-bold uppercase text-ss-teal"
          style={{ letterSpacing: '0.14em' }}
        >
          {eyebrow}
        </div>
        <h2 className="mt-1 text-2xl font-extrabold text-ss-text">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ss-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function BPCard({ title, children, accent = null }) {
  return (
    <div className={`bp-card rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 ${accent ? `border-l-4 border-${accent}` : ''}`}>
      <div
        className="mb-3 font-mono text-[10px] font-bold uppercase text-ss-muted"
        style={{ letterSpacing: '0.14em' }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, accent = 'text-ss-teal' }) {
  return (
    <div>
      <div className={`text-[2.2rem] font-extrabold leading-none ${accent}`}>{value ?? 0}</div>
      <div
        className="mt-1 font-mono text-[10px] font-bold uppercase text-ss-muted"
        style={{ letterSpacing: '0.12em' }}
      >
        {label}
      </div>
    </div>
  )
}

function EmptyLine({ copy }) {
  return <p className="rounded-lg border border-dashed border-ss-border-warm bg-ss-bg/50 p-3 text-sm text-ss-muted">{copy}</p>
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

function PriorityRow({ p }) {
  const cls = String(p.classification || '').toLowerCase()
  const isAware = cls === 'awareness' || cls === 'aware' || cls === 'be_aware'
  const isStrength = cls === 'positive' || cls === 'strength' || cls === 'benefit'
  const badgeBg  = isAware ? 'bg-ss-amber/15 text-ss-amber' : isStrength ? 'bg-ss-green/15 text-ss-green' : 'bg-ss-border-warm/30 text-ss-muted'
  const badgeText = isAware ? 'Explore' : isStrength ? 'Strength' : 'Neutral'
  const confLabel = p.confidence === 'established' ? 'Established research' : p.confidence === 'emerging' ? 'Emerging research' : 'Preliminary research'
  return (
    <div className="bp-priority rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60 md:flex md:gap-4">
      <div className="md:w-[30%]">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${badgeBg}`} style={{ letterSpacing: '0.14em' }}>
          {badgeText}
        </span>
        <div className="mt-1 text-base font-extrabold text-ss-teal">{p.gene || p.name}</div>
        {p.pillar && (
          <div className="mt-1 inline-block rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">{p.pillar}</div>
        )}
      </div>
      <div className="mt-3 md:mt-0 md:w-[70%]">
        {p.plain && <p className="text-sm text-ss-text">{p.plain}</p>}
        <p
          className="mt-2 font-mono text-[11px] text-ss-green"
          style={{ letterSpacing: '0.02em' }}
        >
          Action: {p.action}
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-ss-bg px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
            {confLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

function ProtocolColumn({ Icon, label, items, accent }) {
  return (
    <div className="bp-card rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className={accent} />
        <h3 className="text-base font-extrabold text-ss-text">{label}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ss-muted italic">No specific items surfaced for your genotype in this window.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2">
              <Circle size={14} className="mt-0.5 flex-shrink-0 text-ss-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-relaxed text-ss-text">{it.text}</p>
                {it.gene && (
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                    it.isGeneral ? 'bg-ss-bg text-ss-muted' : 'bg-ss-green/15 text-ss-green'
                  }`} style={{ letterSpacing: '0.12em' }}>
                    {it.gene}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SupplementTier({ title, tone, items, emptyCopy }) {
  if (!items.length && !emptyCopy) return null
  const bg = tone === 'green' ? 'bg-ss-green/[0.06]' : tone === 'amber' ? 'bg-ss-amber/[0.06]' : 'bg-ss-teal/[0.04]'
  const border = tone === 'green' ? 'border-ss-green' : tone === 'amber' ? 'border-ss-amber' : 'border-ss-teal'
  const accent = tone === 'green' ? 'text-ss-green' : tone === 'amber' ? 'text-ss-amber' : 'text-ss-teal'
  return (
    <div className={`bp-tier rounded-2xl border-l-[3px] ${border} ${bg} p-4 md:p-5`}>
      <h3 className={`mb-3 text-base font-extrabold ${accent}`}>{title}</h3>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-xl bg-white/80 p-3 ring-1 ring-ss-border-warm/60">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[0.95rem] font-semibold text-ss-text">{it.name}</span>
                    {it.dose && (
                      <span
                        className="font-mono text-[10px] text-ss-muted"
                        style={{ letterSpacing: '0.02em' }}
                      >
                        {it.dose}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[0.85rem] leading-snug text-ss-muted">{it.why}</p>
                </div>
                {it.gene && (
                  <span className={`inline-block rounded-full ${tone === 'green' ? 'bg-ss-green' : tone === 'amber' ? 'bg-ss-amber' : 'bg-ss-teal'} px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white`} style={{ letterSpacing: '0.14em' }}>
                    {it.gene}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ss-muted italic">{emptyCopy}</p>
      )}
    </div>
  )
}

function NutritionColumn({ Icon, label, items, tone }) {
  const accent = tone === 'green' ? 'text-ss-green' : tone === 'amber' ? 'text-ss-amber' : 'text-ss-teal'
  const chipBg = tone === 'green' ? 'bg-ss-green' : tone === 'amber' ? 'bg-ss-amber' : 'bg-ss-teal'
  return (
    <div className="bp-card rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={14} className={accent} />
        <span
          className={`font-mono text-[10px] font-bold uppercase ${accent}`}
          style={{ letterSpacing: '0.14em' }}
        >
          {label}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ss-muted italic">No specific items surfaced for your genotype.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1 text-[13px] text-ss-text leading-snug">
                {it.text}
                {it.gene && (
                  <span className={`ml-1.5 inline-block rounded-full ${it.isGeneral ? 'bg-ss-bg text-ss-muted' : `${chipBg} text-white`} px-1.5 py-0.5 align-middle font-mono text-[9px] font-bold uppercase`} style={{ letterSpacing: '0.12em' }}>
                    {it.gene}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ResearchSnapshot({ report }) {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const cards = useMemo(() => (report ? flattenReportCards(report) : []), [report])
  const topVariants = useMemo(() => pickTopDigestVariants(cards), [cards])

  useEffect(() => {
    let alive = true
    const load = async () => {
      if (!topVariants.length) { setPapers([]); setLoading(false); return }
      // 1. Reuse the digest cache if fresh.
      if (digestIsFresh()) {
        const cached = readDigestCache()
        if (cached?.paper) {
          // Cache holds one paper; try to pull more by fetching if we need 3.
          // For simplicity we still fetch 3 if the cache only has 1.
          if (!alive) return
          setPapers([cached.paper])
          // Continue to fetch 2 more matches for other variants below.
        }
      }
      // 2. Fetch up to 3 papers spanning the user's top variants.
      // Reuse fetchWeeklyPaper but call once per top-3 variants to get 3 papers.
      const picks = topVariants.slice(0, 3)
      const results = await Promise.all(picks.map((v) => fetchWeeklyPaper([v])))
      const dedup = new Map()
      for (const p of results) {
        if (!p) continue
        const key = p.pmid || p.url || p.title
        if (!dedup.has(key)) dedup.set(key, p)
      }
      if (!alive) return
      const merged = [...dedup.values()].slice(0, 3)
      setPapers(merged)
      // Update cache with the first paper so digest stays consistent.
      if (merged[0]) writeDigestCache({ paper: merged[0], didYouKnow: null, trial: null })
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [topVariants])

  if (!report) return <EmptyLine copy="Upload your genome to see matched research." />
  if (loading && !papers.length) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bp-card animate-pulse rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60">
            <div className="mb-2 h-3 w-16 rounded bg-ss-border-warm/60" />
            <div className="h-4 w-11/12 rounded bg-ss-border-warm/40" />
            <div className="mt-2 h-4 w-3/4 rounded bg-ss-border-warm/40" />
            <div className="mt-3 h-3 w-1/2 rounded bg-ss-border-warm/30" />
          </div>
        ))}
      </div>
    )
  }
  if (!papers.length) {
    return <EmptyLine copy="No recent research surfaced for your top variants right now — try again later." />
  }
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {papers.map((p, i) => <ResearchCard key={p.pmid || p.url || i} paper={p} />)}
    </div>
  )
}

function ResearchCard({ paper }) {
  const yr = paper?.year || (paper?.pubDate ? new Date(paper.pubDate).getFullYear() : '')
  const url = paper.url || paper.pubmedUrl || (paper.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/` : null)
  const saveEntry = url ? {
    id: `research:${paper.pmid || url}`,
    type: 'research',
    title: paper.title,
    source: [paper.journal, yr].filter(Boolean).join(' · '),
    url,
    variantTag: paper.matchedGene || null,
  } : null
  return (
    <div className="bp-card flex flex-col gap-2 rounded-2xl border border-ss-border-warm bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <BookOpen size={12} className="text-ss-green" />
          <span
            className="font-mono text-[10px] font-bold uppercase text-ss-green"
            style={{ letterSpacing: '0.14em' }}
          >
            Matched paper
          </span>
        </div>
        {saveEntry && <div className="no-print"><SaveButton item={saveEntry} /></div>}
      </div>
      <h3 className="line-clamp-3 text-[0.95rem] font-bold leading-snug text-ss-text">{paper.title}</h3>
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ss-muted">
        {paper.journal && <span className="line-clamp-1">{paper.journal}</span>}
        {yr && <span>· {yr}</span>}
      </div>
      {paper.matchedGene && (
        <span className="inline-flex items-center rounded-full bg-ss-green px-2 py-0.5 font-mono text-[10px] font-bold text-white" style={{ letterSpacing: '0.02em' }}>
          Matched: {paper.matchedGene}
        </span>
      )}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ss-teal hover:underline">
          Read study <ArrowRight size={11} />
        </a>
      )}
    </div>
  )
}

function NextStep({ step, onQuizOpen }) {
  const inner = (
    <span className={`bp-next-step flex items-start gap-3 rounded-xl p-3 transition ${step.done ? 'bg-white/50 opacity-60' : 'bg-white shadow-sm ring-1 ring-ss-border-warm/60 hover:ring-ss-teal/40'}`}>
      {step.done ? (
        <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-ss-green" fill="currentColor" strokeWidth={0} />
      ) : (
        <Circle size={20} className="mt-0.5 flex-shrink-0 text-ss-muted" />
      )}
      <span className="min-w-0 flex-1">
        <span className={`text-[0.93rem] ${step.done ? 'line-through text-ss-muted' : 'text-ss-text'}`}>
          {step.text}
        </span>
      </span>
      {!step.done && (
        <span
          className="ml-2 flex-shrink-0 font-mono text-[10px] font-bold uppercase text-ss-teal"
          style={{ letterSpacing: '0.14em' }}
        >
          Start <ArrowRight size={10} className="inline" />
        </span>
      )}
    </span>
  )
  if (step.done) return <li>{inner}</li>
  if (step.onClickEvent === 'selfscience:open-health-story-quiz') {
    return (
      <li>
        <button type="button" onClick={onQuizOpen} className="block w-full text-left no-print">
          {inner}
        </button>
      </li>
    )
  }
  if (step.href) {
    return (
      <li>
        <Link href={step.href} className="block">
          {inner}
        </Link>
      </li>
    )
  }
  return <li>{inner}</li>
}
