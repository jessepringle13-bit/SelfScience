'use client'

// /app/app/explore/[findingId]/page.js
// Focus Mode — single-variant deep dive at /explore/[findingId].
// 7 sections A–G per spec, keyboard nav (←/→), auto-marks explored on
// mount, journal/goal/doctor deep-link prompts, next-3 suggestions.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Check,
  Pencil, Target, Stethoscope, BookOpen, Leaf, FlaskConical, Zap, Pill,
  ExternalLink, AlertTriangle,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import WhyYoureSeeingThis from '@/components/WhyYoureSeeingThis'
import {
  getFindings, getFindingById, impactRankedFindings, useExploredIds,
  markExplored, unmarkExplored, CLASSIFICATION_META, hasGenomeResults,
  getConfidenceMeta, actionTypeBucket,
} from '@/lib/explore'
import { getPopulationFrequency, formatFrequency } from '@/lib/populationFrequencies'

export default function FocusModePage() {
  const params = useParams()
  const router = useRouter()
  const rawId = decodeURIComponent(String(params?.findingId || '').toLowerCase())

  const [ready, setReady] = useState(false)
  const [genomeLoaded, setGenomeLoaded] = useState(false)
  const [allFindings, setAllFindings] = useState([])
  const [micro, setMicro] = useState(null)

  useEffect(() => {
    const ok = hasGenomeResults()
    setGenomeLoaded(ok)
    setAllFindings(ok ? impactRankedFindings(getFindings()) : [])
    setReady(true)
  }, [rawId])

  const explored = useExploredIds()
  const exploredSet = useMemo(() => new Set(explored.map((x) => String(x).toLowerCase())), [explored])

  const finding = useMemo(() => allFindings.find((f) => f.id === rawId) || getFindingById(rawId), [allFindings, rawId])

  // Auto-mark as explored on first mount.
  useEffect(() => {
    if (finding?.id && !exploredSet.has(finding.id)) {
      markExplored(finding.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finding?.id])

  // Neighbours for prev/next navigation.
  const idx = allFindings.findIndex((f) => f.id === rawId)
  const prev = idx > 0 ? allFindings[idx - 1] : null
  const next = idx >= 0 && idx < allFindings.length - 1 ? allFindings[idx + 1] : null

  // Keyboard navigation (Part 2 spec + Part 6-style behaviour).
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowLeft' && prev) router.push(`/explore/${prev.id}`)
      if (e.key === 'ArrowRight' && next) router.push(`/explore/${next.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, router])

  const flashMicro = (msg) => { setMicro(msg); setTimeout(() => setMicro(null), 2800) }

  // No genome — redirect to /explore per spec. Must happen in an
  // effect (not render) or Next.js warns about setState-during-render.
  useEffect(() => {
    if (ready && !genomeLoaded) router.replace('/explore')
  }, [ready, genomeLoaded, router])
  if (!ready) return <div className="min-h-screen bg-ss-bg"><SiteNav /></div>
  if (!genomeLoaded) return <div className="min-h-screen bg-ss-bg"><SiteNav /></div>

  // Finding not found.
  if (!finding) return <NotFoundState />

  const isExplored = exploredSet.has(finding.id)
  const classMeta = CLASSIFICATION_META[finding.classification] || CLASSIFICATION_META.neutral
  const confMeta  = getConfidenceMeta(finding.confidence)
  const popStats  = finding.rsid ? getPopulationFrequency(finding.rsid) : null
  const nextUnread = allFindings.filter((f) => f.id !== finding.id && !exploredSet.has(f.id)).slice(0, 3)

  const relatedTools = getRelatedTools(finding)
  const goalCategory = guessGoalCategory(finding)

  return (
    <div className="min-h-screen bg-ss-bg pb-24">
      <SiteNav />

      {/* Focus-mode nav (breadcrumb + prev/next + mark explored) */}
      <div className="container pt-24 md:pt-28">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ss-border-warm pb-4">
          <div className="flex items-center gap-2 font-mono text-[11px] text-ss-muted">
            <Link href="/explore" className="inline-flex items-center gap-1 hover:text-ss-teal">
              <ArrowLeft size={12} /> Back to Explorer
            </Link>
            <span className="text-ss-border-warm">/</span>
            <span className="text-ss-text">{finding.gene}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={prev ? `/explore/${prev.id}` : '#'}
              aria-disabled={!prev}
              onClick={(e) => { if (!prev) e.preventDefault() }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] font-semibold transition ${
                prev ? 'text-ss-teal hover:bg-ss-bg' : 'cursor-not-allowed text-ss-muted/40'
              }`}
            >
              <ChevronLeft size={12} /> Previous
            </Link>
            <Link
              href={next ? `/explore/${next.id}` : '#'}
              aria-disabled={!next}
              onClick={(e) => { if (!next) e.preventDefault() }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] font-semibold transition ${
                next ? 'text-ss-teal hover:bg-ss-bg' : 'cursor-not-allowed text-ss-muted/40'
              }`}
            >
              Next <ChevronRight size={12} />
            </Link>
            <button
              type="button"
              onClick={() => {
                if (isExplored) { unmarkExplored(finding.id); flashMicro('Unmarked') }
                else { markExplored(finding.id); flashMicro(`${finding.gene} marked as explored`) }
              }}
              className={`ml-2 inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] font-semibold transition ${
                isExplored ? 'bg-ss-green text-white' : 'border border-ss-teal text-ss-teal hover:bg-ss-teal hover:text-white'
              }`}
            >
              <Check size={11} /> {isExplored ? 'Explored' : 'Mark as explored'}
            </button>
          </div>
        </div>

        {/* SECTION A — Identity */}
        <section className="mt-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {finding.pillar && (
              <span className="inline-flex rounded-full bg-ss-bg px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ss-muted">
                {finding.pillar}
              </span>
            )}
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${classMeta.bg} ${classMeta.text}`}>
              {classMeta.label}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: confMeta?.color || '#7A7974' }}>
              {confMeta?.label || finding.confidence} confidence
            </span>
          </div>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ss-text md:text-5xl">{finding.gene}</h1>
          {finding.name && finding.name !== finding.gene && (
            <p className="mt-2 text-xl text-ss-muted">{finding.name}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ss-border-warm pt-4 font-mono text-[12px]">
            {finding.rsid && (
              <div>
                <span className="text-ss-muted">rsID: </span>
                <span className="text-ss-text">{finding.rsid}</span>
              </div>
            )}
            {finding.genotype && (
              <div>
                <span className="text-ss-muted">Your genotype: </span>
                <span className="font-bold text-ss-teal">{finding.genotype}</span>
              </div>
            )}
          </div>
          {popStats && (
            <div className="mt-3">
              <div className="flex items-center justify-between font-mono text-[10px] text-ss-muted">
                <span>Global frequency</span>
                <span>{formatFrequency(popStats.freq)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ss-bg">
                <div className="h-full bg-ss-teal" style={{ width: `${Math.min(100, Math.max(2, (popStats.freq || 0) * 100))}%` }} />
              </div>
            </div>
          )}
        </section>

        {/* SECTION B — What this means for you (expanded by default) */}
        <section className="mt-10 max-w-2xl">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">What this means for you</div>
          <div className="mt-3 space-y-4" style={{ maxWidth: '64ch' }}>
            <p className="text-base leading-[1.75] text-ss-text">
              {finding.meaning || 'A plain-English interpretation for this variant is coming soon. In the meantime, the research links below cover the current evidence base.'}
            </p>
            {finding.actions.length > 0 && (
              <div>
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">What you can do about it</div>
                <ul className="space-y-2">
                  {finding.actions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-[15px] leading-[1.7] text-ss-text">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ss-green" aria-hidden="true" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* SECTION C — The research behind this */}
        <section className="mt-10 max-w-3xl">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">The research behind this</div>
          <ResearchList finding={finding} />
        </section>

        {/* SECTION D — What to do about this (structured action list + tools) */}
        {(finding.actions.length > 0 || relatedTools.length > 0) && (
          <section className="mt-10 max-w-3xl">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">What to do about this</div>
            {finding.actions.length > 0 && (
              <ul className="mt-3 space-y-2.5">
                {finding.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg border border-ss-border-warm bg-white px-3 py-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-ss-border-warm" aria-hidden="true" />
                    <span className="text-[14px] leading-[1.6] text-ss-text">{a}</span>
                  </li>
                ))}
              </ul>
            )}
            {relatedTools.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {relatedTools.map((t) => (
                  <Link key={t.href} href={t.href} className="inline-flex items-center gap-1.5 rounded-full border border-ss-teal bg-white px-3 py-1.5 text-[12px] font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white">
                    <t.Icon size={12} /> {t.label}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION E — How common is this (ancestry breakdown expanded) */}
        <section className="mt-10 max-w-3xl">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">How common is this</div>
          <FrequencyContext finding={finding} popStats={popStats} />
        </section>

        {/* SECTION F — Connect this to your journey */}
        <section className="mt-10 max-w-3xl">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">Connect this to your journey</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {/* TODO T-2 — wire to global modal event when available */}
            <ConnectionCard
              Icon={Pencil}
              title="Write a reflection about this finding"
              body="What does it mean for how you think about your health?"
              cta="Write a note →"
              href={`/journal?type=reflection&finding=${encodeURIComponent(finding.id)}`}
            />
            {/* Goal prompt uses the /goals deep link that IS wired. */}
            <ConnectionCard
              Icon={Target}
              title="Set a goal based on this finding"
              body="Turn this insight into something you actively work toward."
              cta="Set a goal →"
              href={`/goals?new=1&category=${goalCategory}&variant=${encodeURIComponent(finding.id)}`}
            />
            {/* TODO T-2 — wire to global modal event when available */}
            <ConnectionCard
              Icon={Stethoscope}
              title="Discuss this with your doctor"
              body="Generate a one-finding summary formatted for a clinical conversation."
              cta="Explain to my doctor →"
              href={`/practitioner-report?focus=${encodeURIComponent(finding.id)}`}
            />
          </div>
        </section>

        {/* SECTION G — What to explore next */}
        {nextUnread.length > 0 && (
          <section className="mt-10 max-w-3xl">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">What to explore next</div>
            <ul className="mt-3 space-y-2">
              {nextUnread.map((n) => {
                const meta = CLASSIFICATION_META[n.classification] || CLASSIFICATION_META.neutral
                return (
                  <li key={n.id}>
                    <Link
                      href={`/explore/${n.id}`}
                      className="flex items-center gap-3 rounded-xl border border-ss-border-warm bg-white px-4 py-3 transition hover:border-ss-teal hover:bg-ss-teal/[0.03]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ss-teal" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-ss-text">{n.gene}</div>
                        {n.name && n.name !== n.gene && <div className="font-mono text-[9px] text-ss-muted">{n.name}</div>}
                      </div>
                      <span className={`hidden shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider md:inline-flex ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold text-ss-teal">
                        Go deeper <ArrowRight size={10} />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4">
              <Link href="/explore" className="font-mono text-[11px] font-semibold text-ss-teal hover:underline">
                ← Back to full Explorer List
              </Link>
            </div>
          </section>
        )}

        {/* Bottom explored toggle */}
        <section className="mt-14 flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              if (isExplored) { unmarkExplored(finding.id); flashMicro('Unmarked') }
              else {
                markExplored(finding.id)
                const remaining = allFindings.filter((f) => !exploredSet.has(f.id) && f.id !== finding.id).length
                flashMicro(`${finding.gene} marked as explored. ${remaining} finding${remaining === 1 ? '' : 's'} remaining.`)
              }
            }}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              isExplored ? 'bg-ss-green text-white shadow-md' : 'border-2 border-ss-teal bg-white text-ss-teal hover:bg-ss-teal hover:text-white'
            }`}
            aria-label={isExplored ? 'Mark unexplored' : 'Mark as explored'}
          >
            <Check size={20} strokeWidth={3} />
          </button>
          <div className="mt-2 font-mono text-[11px] text-ss-muted">
            {isExplored ? 'Explored ✓' : 'Mark this gene as explored'}
          </div>
        </section>
      </div>

      {/* Explainer: helps the user understand why THIS finding was
          selected \u2014 confidence, classification, provenance. */}
      <div className="container max-w-3xl pb-8">
        <WhyYoureSeeingThis
          items={[
            finding.geneSymbol ? `Gene: ${finding.geneSymbol}${finding.rsid ? ' \u00b7 rsid ' + finding.rsid : ''}.` : 'Selected from your uploaded genome.',
            finding.classification ? `Classification: ${finding.classification}. ${classMeta?.blurb || ''}`.trim() : null,
            'Copy adapts to your data \u2014 more inputs (bloodwork, journal entries) sharpen future rungs.',
          ].filter(Boolean)}
          improveWith={'Add recent bloodwork so we can cross-check whether this variant\u2019s biology is actually expressing in your body right now.'}
        />
      </div>

      {/* Micro toast */}
      {micro && (
        <div className="fixed bottom-8 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-ss-green px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {micro}
        </div>
      )}
    </div>
  )
}

/* ------------------------- Sub components -------------------------- */

function ResearchList({ finding }) {
  const [studies, setStudies] = useState(null)
  useEffect(() => {
    let cancelled = false
    const q = finding.rsid || finding.gene
    if (!q) { setStudies([]); return }
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=3`)
      .then((r) => r.ok ? r.json() : { results: [] })
      .then((json) => { if (!cancelled) setStudies((json?.results || []).slice(0, 3)) })
      .catch(() => { if (!cancelled) setStudies([]) })
    return () => { cancelled = true }
  }, [finding.rsid, finding.gene])

  if (studies === null) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white ring-1 ring-ss-border-warm" />
        ))}
      </div>
    )
  }

  if (!studies.length) {
    const q = finding.rsid || finding.gene
    return (
      <div className="mt-3 rounded-xl border border-ss-border-warm bg-white p-4 text-[13px] text-ss-muted">
        No recent papers found for this variant.{' '}
        <Link href={`/search?q=${encodeURIComponent(q || '')}`} className="font-semibold text-ss-teal hover:underline">
          Search the literature →
        </Link>
      </div>
    )
  }

  return (
    <ul className="mt-3 space-y-2">
      {studies.map((s, i) => (
        <li key={s.pmid || s.id || i}>
          <a
            href={s.url || (s.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/` : '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl border border-ss-border-warm bg-white p-4 transition hover:border-ss-teal"
          >
            <BookOpen size={16} className="mt-0.5 shrink-0 text-ss-teal" />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold leading-snug text-ss-text group-hover:text-ss-teal">{s.title || 'PubMed study'}</div>
              <div className="mt-0.5 font-mono text-[10px] text-ss-muted">
                {s.journal || 'PubMed'}{s.year ? ` • ${s.year}` : ''}
              </div>
            </div>
            <ExternalLink size={12} className="mt-1 shrink-0 text-ss-muted" />
          </a>
        </li>
      ))}
    </ul>
  )
}

function FrequencyContext({ finding, popStats }) {
  if (!popStats) {
    return <p className="mt-3 text-[13px] text-ss-muted">Frequency data is not available for this variant.</p>
  }
  const pct = Math.max(2, Math.min(100, (popStats.freq || 0) * 100))
  const rarity = popStats.freq >= 0.35 ? 'common' : popStats.freq >= 0.15 ? 'moderately common' : popStats.freq >= 0.05 ? 'uncommon' : 'rare'
  return (
    <div className="mt-3 rounded-xl border border-ss-border-warm bg-white p-4">
      <div className="flex items-center justify-between font-mono text-[11px] text-ss-muted">
        <span>Global allele frequency</span>
        <span className="text-ss-text">{formatFrequency(popStats.freq)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ss-bg">
        <div className="h-full bg-ss-teal" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ss-text">
        This variant is <strong className="text-ss-teal">{rarity}</strong> globally. That means {pct.toFixed(0)}% of people worldwide carry the variant allele.
      </p>
      {finding.rsid && (
        <Link
          href={`/population-compare?rsid=${encodeURIComponent(finding.rsid)}`}
          className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ss-teal hover:underline"
        >
          See how it varies by ancestry →
        </Link>
      )}
    </div>
  )
}

function ConnectionCard({ Icon, title, body, cta, href }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-ss-border-warm bg-ss-bg-warm/60 p-5 text-center transition hover:border-ss-teal hover:bg-ss-teal/[0.04]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
        <Icon size={18} />
      </div>
      <div className="text-[14px] font-bold leading-tight text-ss-text">{title}</div>
      <p className="text-[12px] leading-snug text-ss-muted">{body}</p>
      <div className="mt-auto pt-2 font-mono text-[10px] font-semibold text-ss-teal">{cta}</div>
    </Link>
  )
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />
      <div className="container flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
        <AlertTriangle size={30} className="text-ss-amber" />
        <h1 className="mt-3 text-xl font-bold text-ss-text">This finding could not be loaded.</h1>
        <p className="mt-2 text-[14px] text-ss-muted">The variant you're looking for is not in your current genome report.</p>
        <Link href="/explore" className="mt-4 inline-flex items-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
          Back to Explorer →
        </Link>
      </div>
    </div>
  )
}

/* ------------------------- Related tools + goal category ------------ */

function getRelatedTools(finding) {
  const tools = []
  const gene = (finding.gene || '').toUpperCase()
  const pillar = (finding.pillar || '').toLowerCase()
  const actions = (finding.actions || []).join(' ').toLowerCase()
  const bucket = actionTypeBucket(finding)

  const nutritionGenes = new Set(['MTHFR', 'MTNR1B', 'PPARA', 'BCMO1', 'FTO', 'APOE', 'FADS1', 'FADS2'])
  const trainingGenes  = new Set(['ACTN3', 'PPARGC1A', 'COL5A1', 'IL6', 'ACE'])
  const clinicalGenes  = new Set(['SLCO1B1', 'DPYD', 'TPMT', 'CYP2C19', 'CYP2D6', 'CYP3A5', 'VKORC1', 'CYP2C9'])

  if (nutritionGenes.has(gene) || /nutrition|meal|food|diet|eating/.test(pillar) || /vitamin|folate|omega/.test(actions)) {
    tools.push({ href: '/nutrition',            label: 'See food matches',   Icon: Leaf })
  }
  if (/supplement|methylfolate|creatine|magnesium|omega|vitamin|zinc|selenium/.test(actions)) {
    tools.push({ href: '/tools/supplements',    label: 'Find supplements',   Icon: FlaskConical })
  }
  if (trainingGenes.has(gene) || /sport|performance|training|exercise/.test(pillar) || /zone 2|training|workout/.test(actions)) {
    tools.push({ href: '/tools/training',       label: 'Training implications', Icon: Zap })
  }
  if (clinicalGenes.has(gene) || bucket === 'doctor') {
    tools.push({ href: '/drug-check',           label: 'Medication interactions', Icon: Pill })
  }
  return tools.slice(0, 3)
}

function guessGoalCategory(finding) {
  const gene = (finding.gene || '').toUpperCase()
  if (['SLCO1B1', 'DPYD', 'TPMT', 'CYP2C19', 'CYP2D6', 'CYP3A5', 'VKORC1', 'CYP2C9'].includes(gene)) return 'clinical'
  if (['ACTN3', 'PPARGC1A', 'COL5A1'].includes(gene)) return 'performance'
  if (['MTHFR', 'FADS1', 'FADS2'].includes(gene)) return 'supplements'
  if (['MTNR1B', 'PPARA', 'BCMO1', 'FTO', 'APOE'].includes(gene)) return 'nutrition'
  const p = (finding.pillar || '').toLowerCase()
  if (p.includes('sport') || p.includes('performance')) return 'performance'
  if (p.includes('nutrition') || p.includes('metabol')) return 'nutrition'
  if (p.includes('longevity') || p.includes('aging')) return 'longevity'
  return 'nutrition'
}
