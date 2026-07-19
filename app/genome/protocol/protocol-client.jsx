'use client'

// /app/app/genome/protocol/protocol-client.jsx
// Full Protocol destination for the Dashboard "See your full protocol" link.
//
// Two views:
//   • SIMPLE (default) — three sections: Prioritize / Daily habits / Aware of
//   • DETAILED (toggled) — seven collapsible domains:
//        1) Nutrition
//        2) Supplements
//        3) Training & Movement
//        4) Medications & Drug Interactions
//        5) Biomarkers to Watch
//        6) Environmental & Lifestyle
//        7) Questions to Ask Your Doctor
//
// All content is derived from existing SelfScience engines:
//   • matchProtocolToUserVariants (supplements)
//   • inferAllPGxPhenotypes (medications)
//   • deriveCorrelations (biomarkers)
//   • getActiveNutritionRules (nutrition)
// No new data sources are introduced.
//
// Session guard: if no genome is loaded, we render a friendly inline
// prompt — we DO NOT redirect to the upload page.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Sunrise, ShieldAlert,
  Apple, Pill, Activity, Stethoscope,
  TestTube2, Leaf, MessageSquare,
  ChevronDown, ChevronUp, Printer, ClipboardList,
  Search, ArrowRight, Dna, Info,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import DashboardBackLink from '@/components/DashboardBackLink'
import { getGenomeResults, hasGenomeResults } from '@/lib/genomeSession'
import {
  matchProtocolToUserVariants,
  flattenReportCards,
} from '@/lib/supplementProtocol'
import { inferAllPGxPhenotypes } from '@/lib/pgxClassifier'
import { deriveCorrelations } from '@/lib/biomarkerCorrelations'
import {
  getActiveNutritionRules,
  extractGenotypesFromReport,
} from '@/lib/nutritionGenomics'
import {
  addToPractitionerReport,
  PRACTITIONER_CHANGE_EVENT,
} from '@/lib/practitionerReport'

// ---------------------------------------------------------------------------
// UTIL: Turn a supplement rule + user's cards into a compact protocol card.
// ---------------------------------------------------------------------------
function supplementRuleToCard(match) {
  const { rule, cards } = match
  const gene = rule?.gene || (cards?.[0]?.gene) || ''
  const primary = rule?.recommendations?.[0]
  return {
    id: rule?.id || `supp-${gene}`,
    title: primary?.name || `${gene} support`,
    dose: primary?.dose || null,
    reasoning:
      primary?.mechanism ||
      `${gene} variants can benefit from ${primary?.name || 'targeted support'}.`,
    gene,
    genotypePattern: rule?.genotypePattern || '',
    category: rule?.category || 'priority',
    allRecs: rule?.recommendations || [],
    disclaimerNote: rule?.disclaimerNote || null,
    kind: 'supplement',
  }
}

// ---------------------------------------------------------------------------
// Simple view priority-badge tone
// ---------------------------------------------------------------------------
function priorityBadge(category) {
  const c = String(category || '').toLowerCase()
  if (c === 'priority') return { label: 'Prioritize', tone: 'bg-ss-orange text-white' }
  if (c === 'lifestyle') return { label: 'Daily habit', tone: 'bg-ss-teal/15 text-ss-teal' }
  if (c === 'awareness') return { label: 'Be aware', tone: 'bg-ss-amber/20 text-ss-amber' }
  return { label: 'Note', tone: 'bg-ss-muted/20 text-ss-muted' }
}

// ---------------------------------------------------------------------------
// Questions to Ask Your Doctor — auto-generated from the top findings.
// ---------------------------------------------------------------------------
function generateDoctorQuestions({ groups, pgx, biomarkers }) {
  const qs = []
  for (const m of groups.priority.slice(0, 4)) {
    const rec = m.rule?.recommendations?.[0]
    const gene = m.rule?.gene
    const pattern = m.rule?.genotypePattern
    if (rec && gene) {
      qs.push({
        gene,
        text: `Given my ${gene} ${pattern ? `(${pattern}) ` : ''}status, is it worth trialling ${rec.name} at ${rec.dose || 'a low starting dose'}?`,
      })
    }
  }
  for (const m of groups.awareness.slice(0, 2)) {
    const gene = m.rule?.gene
    if (gene) {
      qs.push({
        gene,
        text: `Are there monitoring or lifestyle considerations I should know given my ${gene} variant?`,
      })
    }
  }
  for (const b of (biomarkers || []).slice(0, 2)) {
    if (b.gene && b.marker) {
      qs.push({
        gene: b.gene,
        text: `Would you order a ${b.marker} panel given my ${b.gene} variant?`,
      })
    }
  }
  for (const p of Object.values(pgx || {}).slice(0, 2)) {
    if (p?.phenotype && p.phenotype !== 'unknown' && p.gene) {
      qs.push({
        gene: p.gene,
        text: `I'm classified as a ${p.phenotype} for ${p.gene}. Are any of my current or future medications affected?`,
      })
    }
  }
  // Deduplicate by text.
  const seen = new Set()
  return qs.filter((q) => {
    if (seen.has(q.text)) return false
    seen.add(q.text)
    return true
  }).slice(0, 8)
}

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================
export default function ProtocolClient() {
  const [report, setReport] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState('simple') // 'simple' | 'detailed'

  useEffect(() => {
    setReport(getGenomeResults())
    setLoaded(true)
    const onChange = () => setReport(getGenomeResults())
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:genome-changed', onChange)
      return () => window.removeEventListener('selfscience:genome-changed', onChange)
    }
  }, [])

  // Derived protocol groups.
  const groups = useMemo(() => {
    if (!report) return { priority: [], lifestyle: [], awareness: [] }
    return matchProtocolToUserVariants(report)
  }, [report])

  const cards = useMemo(() => (report ? flattenReportCards(report) : []), [report])

  const pgx = useMemo(() => {
    if (!report) return {}
    try { return inferAllPGxPhenotypes(report) || {} } catch { return {} }
  }, [report])

  const biomarkers = useMemo(() => {
    if (!report) return []
    try {
      const raw = deriveCorrelations({ status: {}, report }) || []
      // Normalise: keep unique gene+marker rows with a one-liner.
      const seen = new Set()
      const out = []
      for (const r of raw) {
        const key = `${r.gene || ''}::${r.marker || r.name || ''}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({
          gene: r.gene || '',
          marker: r.marker || r.name || '',
          reasoning: r.reasoning || r.plain || r.note || '',
        })
      }
      return out
    } catch { return [] }
  }, [report])

  const nutrition = useMemo(() => {
    if (!report) return []
    try {
      const genos = extractGenotypesFromReport(report) || {}
      const active = getActiveNutritionRules(genos, {}) || {}
      const rows = []
      for (const key of Object.keys(active)) {
        const r = active[key]
        rows.push({
          gene: r?.gene || key,
          title: r?.title || r?.label || key,
          reasoning: r?.summary || r?.plain || r?.rationale || '',
          watch: r?.watch || r?.moderate || [],
          prioritize: r?.prioritize || r?.support || [],
        })
      }
      return rows.slice(0, 12)
    } catch { return [] }
  }, [report])

  const questions = useMemo(
    () => generateDoctorQuestions({ groups, pgx, biomarkers }),
    [groups, pgx, biomarkers],
  )

  // "Add everything to practitioner report" — fires one addToPractitionerReport()
  // per top finding + PGx flag + biomarker so the clinician summary is
  // complete in one click.
  const addAllToPractitioner = () => {
    const items = []
    for (const m of [...groups.priority, ...groups.awareness]) {
      const first = m.rule?.recommendations?.[0]
      items.push({
        id: `protocol:${m.rule?.id || m.rule?.gene}`,
        title: `${m.rule?.gene || 'Gene'} — ${first?.name || 'support'}`,
        gene: m.rule?.gene || '',
        rsid: m.rule?.rsids?.[0] || '',
        pillar: 'Protocol',
        note: first?.mechanism || m.rule?.disclaimerNote || '',
        source: 'Full protocol',
      })
    }
    for (const b of biomarkers.slice(0, 8)) {
      items.push({
        id: `biomarker:${b.gene}:${b.marker}`,
        title: `Monitor ${b.marker} (${b.gene})`,
        gene: b.gene,
        rsid: '',
        pillar: 'Biomarkers',
        note: b.reasoning,
        source: 'Full protocol',
      })
    }
    for (const p of Object.values(pgx || {})) {
      if (!p?.phenotype || p.phenotype === 'unknown') continue
      items.push({
        id: `pgx:${p.gene}`,
        title: `${p.gene} — ${p.phenotype}`,
        gene: p.gene,
        rsid: '',
        pillar: 'Pharmacogenomics',
        note: p.note || '',
        source: 'Full protocol',
      })
    }
    for (const q of questions) {
      items.push({
        id: `question:${q.gene}:${q.text.slice(0, 24)}`,
        title: `Question: ${q.text}`,
        gene: q.gene,
        rsid: '',
        pillar: 'Questions',
        note: '',
        source: 'Full protocol',
      })
    }
    let added = 0
    for (const it of items) {
      try {
        if (addToPractitionerReport(it)) added++
      } catch { /* ignore */ }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PRACTITIONER_CHANGE_EVENT))
      alert(`Added ${added} item${added === 1 ? '' : 's'} to your practitioner report.`)
    }
  }

  // Export current view as PDF via the browser's built-in print dialog.
  // "Save as PDF" is a standard destination in every modern browser —
  // this is the most reliable path without shipping a client-side PDF lib.
  const exportPdf = () => {
    if (typeof window !== 'undefined') window.print()
  }

  // ---- Session guard ----------------------------------------------------
  if (loaded && !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] to-white">
        <SiteNav />
        <DashboardBackLink className="container pt-20 md:pt-24 -mb-4" />
        <main className="container pb-20 pt-4">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-ss-border-warm/60">
            <Dna size={32} className="mx-auto mb-4 text-ss-teal" />
            <h1 className="text-2xl font-extrabold text-ss-teal">Load a genome to see your protocol</h1>
            <p className="mt-2 text-sm text-ss-muted">
              Your full protocol is built from your classified variants —
              supplements, biomarkers to watch, medications to flag, and
              questions to ask your doctor. Upload a genome file to unlock it.
            </p>
            <Link
              href="/genome"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ss-orange-dark"
            >
              Upload Genome <ArrowRight size={14} />
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] to-white">
        <SiteNav />
        <DashboardBackLink className="container pt-20 md:pt-24 -mb-4" />
        <main className="container py-16">
          <div className="h-8 w-40 animate-pulse rounded bg-ss-muted/20" />
        </main>
      </div>
    )
  }

  // ---- Real content ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-20 print:bg-white">
      <div className="print:hidden">
        <SiteNav />
        <DashboardBackLink className="container pt-20 md:pt-24 -mb-4" />
      </div>
      <main className="container pt-4 print:pt-0">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              Full Protocol
            </div>
            <h1 className="mt-1 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Your personalized protocol
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ss-muted">
              Every recommendation below is derived from your uploaded
              genome. None of this is medical advice — discuss with a
              clinician before making changes.
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 print:hidden">
            <div className="inline-flex overflow-hidden rounded-full border border-ss-border-warm bg-white text-sm font-semibold">
              <button
                type="button"
                onClick={() => setMode('simple')}
                className={`min-h-11 px-4 py-2 ${mode === 'simple' ? 'bg-ss-teal text-white' : 'text-ss-teal'}`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setMode('detailed')}
                className={`min-h-11 px-4 py-2 ${mode === 'detailed' ? 'bg-ss-teal text-white' : 'text-ss-teal'}`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
          >
            <Printer size={14} /> Export as PDF
          </button>
          <button
            type="button"
            onClick={addAllToPractitioner}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ss-orange-dark"
          >
            <ClipboardList size={14} /> Add everything to practitioner report
          </button>
        </div>

        {mode === 'simple' ? (
          <SimpleView groups={groups} />
        ) : (
          <DetailedView
            groups={groups}
            cards={cards}
            pgx={pgx}
            biomarkers={biomarkers}
            nutrition={nutrition}
            questions={questions}
          />
        )}
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  )
}

// ===========================================================================
// SIMPLE VIEW — 3 columns of compact cards
// ===========================================================================
function SimpleView({ groups }) {
  const priority = groups.priority.map(supplementRuleToCard)
  const lifestyle = groups.lifestyle.map(supplementRuleToCard)
  const awareness = groups.awareness.map(supplementRuleToCard)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SimpleColumn
        Icon={Sparkles}
        color="text-ss-orange"
        title="What to prioritize"
        blurb="High-signal, variant-driven supports."
        items={priority}
      />
      <SimpleColumn
        Icon={Sunrise}
        color="text-ss-teal"
        title="Daily habits to consider"
        blurb="Ongoing lifestyle levers matched to your genes."
        items={lifestyle}
      />
      <SimpleColumn
        Icon={ShieldAlert}
        color="text-ss-amber"
        title="Things to be aware of"
        blurb="Discussion points for your next clinician visit."
        items={awareness}
      />
    </div>
  )
}

function SimpleColumn({ Icon, color, title, blurb, items }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="mb-1 flex items-center gap-2">
        <Icon size={16} className={color} />
        <h2 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h2>
      </div>
      <p className="mb-3 text-xs text-ss-muted">{blurb}</p>
      {items.length === 0 ? (
        <p className="rounded-xl bg-ss-bg p-3 text-xs text-ss-muted">
          Nothing to surface here for your current variants.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-ss-border-warm/60 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-sm font-bold text-ss-text">{it.title}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityBadge(it.category).tone}`}>
                  {priorityBadge(it.category).label}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-mono text-ss-orange">
                {it.gene}{it.dose ? ` · ${it.dose}` : ''}
              </div>
              <p className="mt-1 text-xs text-ss-muted">{it.reasoning}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ===========================================================================
// DETAILED VIEW — 7 collapsible sections
// ===========================================================================
function DetailedView({ groups, cards, pgx, biomarkers, nutrition, questions }) {
  return (
    <div className="space-y-3">
      <Section Icon={Apple} color="text-emerald-700" title="Nutrition">
        <NutritionSection nutrition={nutrition} groups={groups} />
      </Section>

      <Section Icon={Pill} color="text-ss-orange" title="Supplements">
        <SupplementsSection groups={groups} />
      </Section>

      <Section Icon={Activity} color="text-ss-teal" title="Training & Movement">
        <TrainingSection cards={cards} />
      </Section>

      <Section Icon={Stethoscope} color="text-purple-700" title="Medications & Drug Interactions">
        <MedicationsSection pgx={pgx} />
      </Section>

      <Section Icon={TestTube2} color="text-blue-700" title="Biomarkers to Watch">
        <BiomarkersSection biomarkers={biomarkers} />
      </Section>

      <Section Icon={Leaf} color="text-lime-700" title="Environmental & Lifestyle">
        <EnvironmentalSection cards={cards} />
      </Section>

      <Section Icon={MessageSquare} color="text-ss-teal" title="Questions to Ask Your Doctor">
        <QuestionsSection questions={questions} />
      </Section>
    </div>
  )
}

function Section({ Icon, color, title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-ss-border-warm/60 print:break-inside-avoid">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-3 text-left print:hidden"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <span className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</span>
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {/* Print: always show the title + content */}
      <div className="hidden px-4 py-3 print:block">
        <div className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</div>
      </div>
      {(open || true) && (
        <div className={`${open ? '' : 'hidden'} border-t border-ss-border-warm/60 p-4 print:block print:border-t-0 print:pt-0`}>
          {children}
        </div>
      )}
    </section>
  )
}

// --- 1. Nutrition ---------------------------------------------------------
function NutritionSection({ nutrition, groups }) {
  if (nutrition.length === 0 && groups.priority.length === 0) {
    return <EmptyRow copy="Not enough variant data to suggest personalised nutrition tweaks yet." />
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {nutrition.map((n, i) => (
        <ProtocolCard
          key={`nut-${n.gene}-${i}`}
          gene={n.gene}
          title={n.title}
          reasoning={n.reasoning}
          bullets={[
            ...(n.prioritize?.length ? [{ label: 'Prioritize', items: n.prioritize }] : []),
            ...(n.watch?.length ? [{ label: 'Moderate', items: n.watch }] : []),
          ]}
        />
      ))}
      {/* Supplement forms hint: methylfolate / preformed vitamin A / etc.
          Surfaces from the supplement engine's priority recs so the
          Nutrition section can advise on the correct FORM. */}
      {groups.priority.map((m, i) => {
        const gene = m.rule?.gene
        const rec = m.rule?.recommendations?.[0]
        if (!rec?.name || !gene) return null
        return (
          <ProtocolCard
            key={`nut-form-${gene}-${i}`}
            gene={gene}
            title={`Look for ${rec.name} on labels`}
            reasoning={rec.mechanism || ''}
          />
        )
      })}
    </div>
  )
}

// --- 2. Supplements -------------------------------------------------------
function SupplementsSection({ groups }) {
  const all = [...groups.priority, ...groups.lifestyle, ...groups.awareness]
  if (all.length === 0) return <EmptyRow copy="No supplement recommendations for your current variants." />
  return (
    <div className="space-y-3">
      {all.map((m, idx) => {
        const rule = m.rule
        return (
          <div key={rule?.id || idx} className="rounded-xl border border-ss-border-warm/60 bg-ss-bg p-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div>
                <div className="text-sm font-bold text-ss-text">{rule?.gene} · {rule?.genotypePattern}</div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityBadge(rule?.category).tone}`}>
                {priorityBadge(rule?.category).label}
              </span>
            </div>
            <ul className="mt-2 space-y-2">
              {(rule?.recommendations || []).map((r, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="font-semibold text-ss-teal">{r.name}</span>
                  {r.dose && <span className="text-xs font-mono text-ss-muted">{r.dose}</span>}
                  <a
                    href={`/search?q=${encodeURIComponent(r.name)}`}
                    className="ml-auto inline-flex min-h-8 items-center gap-1 rounded-full border border-ss-teal px-2 py-0.5 text-[11px] font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
                  >
                    <Search size={10} /> Search this supplement
                  </a>
                </li>
              ))}
            </ul>
            {rule?.disclaimerNote && (
              <p className="mt-2 text-xs italic text-ss-muted">{rule.disclaimerNote}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- 3. Training ----------------------------------------------------------
function TrainingSection({ cards }) {
  // Surface training-relevant variants (ACTN3, ACE, PPARGC1A, PPARA, etc.)
  // by pattern-matching on gene symbols. Compact per-gene notes so we're
  // not duplicating the /training tool.
  const TRAINING_NOTES = {
    ACTN3: 'Sport-affinity marker. Sprint/power vs endurance leaning depends on your genotype — use as a hint, not a limit.',
    ACE: 'Endurance and power-response marker. Insertion allele (I) tends to endurance; deletion (D) tends to power output.',
    PPARGC1A: 'Mitochondrial biogenesis regulator. Common variants influence training-driven aerobic gains.',
    PPARA: 'Fat oxidation + endurance. Influences fuel usage during long efforts.',
    COL5A1: 'Connective-tissue variant that some studies link to soft-tissue injury susceptibility — warm-up + tempo work matter more than usual.',
    MCT1: 'Lactate transport. Common variants can shift lactate-threshold pacing.',
    IL6: 'Inflammation and recovery.',
    VEGFA: 'Capillary density and endurance adaptation.',
  }
  const hits = new Map()
  for (const c of cards) {
    const g = String(c?.gene || '').toUpperCase()
    if (TRAINING_NOTES[g]) hits.set(g, c)
  }
  if (hits.size === 0) return <EmptyRow copy="No training-relevant variants in your report yet." />
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[...hits.entries()].map(([gene, card]) => (
        <ProtocolCard
          key={gene}
          gene={gene}
          title={`${gene} — ${card.name || card.genotype || 'training relevance'}`}
          reasoning={TRAINING_NOTES[gene]}
        />
      ))}
      <Link
        href="/tools/training"
        className="col-span-full inline-flex min-h-11 items-center gap-1 self-start rounded-full border border-ss-teal px-3 py-2 text-sm font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
      >
        Open the full training protocol tool <ArrowRight size={12} />
      </Link>
    </div>
  )
}

// --- 4. Medications & Drug Interactions -----------------------------------
function MedicationsSection({ pgx }) {
  const rows = Object.values(pgx || {}).filter((p) => p?.phenotype && p.phenotype !== 'unknown')
  if (rows.length === 0) return <EmptyRow copy="No pharmacogenomic phenotypes derived from your report." />
  return (
    <div className="space-y-3">
      {rows.map((p, i) => (
        <div key={p.gene || `pgx-${i}`} className="rounded-xl border border-ss-border-warm/60 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-sm font-bold text-ss-text">{p.gene} — {p.phenotype}</span>
            <span className="text-[10px] font-bold uppercase text-purple-700">PGx</span>
          </div>
          {p.note && <p className="mt-1 text-xs text-ss-muted">{p.note}</p>}
          <p className="mt-2 text-[11px] italic text-ss-muted">
            Not medical advice. Always discuss medication choices with your prescribing clinician.
          </p>
        </div>
      ))}
      <Link
        href="/drug-check"
        className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ss-teal px-3 py-2 text-sm font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
      >
        Open Drug Check <ArrowRight size={12} />
      </Link>
    </div>
  )
}

// --- 5. Biomarkers to Watch -----------------------------------------------
function BiomarkersSection({ biomarkers }) {
  if (biomarkers.length === 0) return <EmptyRow copy="No biomarker correlations for your current variants." />
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {biomarkers.slice(0, 12).map((b, i) => (
        <div key={`${b.gene}-${b.marker}-${i}`} className="rounded-xl border border-ss-border-warm/60 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-sm font-bold text-ss-text">{b.marker}</span>
            <span className="font-mono text-[10px] font-bold text-ss-orange">{b.gene}</span>
          </div>
          {b.reasoning && <p className="mt-1 text-xs text-ss-muted">{b.reasoning}</p>}
          <div className="mt-2 flex justify-end">
            <Link
              href={`/biomarkers?marker=${encodeURIComponent(b.marker)}`}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-ss-teal px-3 py-1 text-[11px] font-semibold text-white hover:bg-ss-teal/90"
            >
              Log this marker
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- 6. Environmental & Lifestyle -----------------------------------------
function EnvironmentalSection({ cards }) {
  const ENV_NOTES = {
    AHR: 'Aryl-hydrocarbon receptor. Involved in metabolising airborne + food-borne toxicants — cruciferous vegetables support this pathway.',
    CYP1A2: 'Caffeine metabolism. Slow-metabolisers often feel caffeine effects for longer and may sleep better cutting it before mid-afternoon.',
    CYP1A1: 'Xenobiotic metabolism. Influences how your body handles combustion by-products (grilling, smoke, some pollutants).',
    NQO1: 'Detoxification of quinones + oxidative stress buffering. Vitamin K + green leafy vegetable intake support the pathway.',
    GSTM1: 'Glutathione conjugation. Null carriers may benefit from higher cruciferous-vegetable intake for detox support.',
    GSTP1: 'Environmental toxin conjugation — relevant to air-quality-sensitive individuals.',
    NAT2: 'Slow acetylators may respond differently to grilled/well-done meats and certain drugs.',
    SOD2: 'Mitochondrial oxidative stress buffering. Manganese + antioxidant-rich foods support the pathway.',
  }
  const hits = []
  const seen = new Set()
  for (const c of cards) {
    const g = String(c?.gene || '').toUpperCase()
    if (ENV_NOTES[g] && !seen.has(g)) {
      seen.add(g)
      hits.push({ gene: g, note: ENV_NOTES[g], name: c.name || c.genotype })
    }
  }
  if (hits.length === 0) return <EmptyRow copy="No environmental-sensitivity variants surfaced yet." />
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {hits.map((h) => (
        <ProtocolCard
          key={h.gene}
          gene={h.gene}
          title={h.name || `${h.gene} — things worth knowing`}
          reasoning={h.note}
        />
      ))}
    </div>
  )
}

// --- 7. Questions to Ask Your Doctor --------------------------------------
function QuestionsSection({ questions }) {
  const [added, setAdded] = useState({})
  if (questions.length === 0) return <EmptyRow copy="Not enough findings to auto-generate specific questions yet." />
  return (
    <ul className="space-y-2">
      {questions.map((q, i) => (
        <li key={i} className="flex flex-wrap items-start gap-2 rounded-xl bg-ss-bg p-3">
          <MessageSquare size={14} className="mt-1 shrink-0 text-ss-teal" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] font-bold text-ss-orange">{q.gene}</div>
            <p className="text-sm text-ss-text">{q.text}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                addToPractitionerReport({
                  id: `question:${q.gene}:${q.text.slice(0, 24)}`,
                  title: `Question: ${q.text}`,
                  gene: q.gene,
                  rsid: '',
                  pillar: 'Questions',
                  note: '',
                  source: 'Full protocol',
                })
                setAdded((prev) => ({ ...prev, [i]: true }))
              } catch { /* ignore */ }
            }}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-ss-orange px-2.5 py-1 text-[11px] font-bold text-ss-orange hover:bg-ss-orange hover:text-white"
          >
            <ClipboardList size={10} /> {added[i] ? 'Added' : 'Add to report'}
          </button>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------
function ProtocolCard({ gene, title, reasoning, bullets = [] }) {
  return (
    <div className="rounded-xl border border-ss-border-warm/60 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-ss-orange/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ss-orange">
          {gene}
        </span>
        <span className="text-sm font-bold text-ss-text">{title}</span>
      </div>
      {reasoning && <p className="mt-1 text-xs text-ss-muted">{reasoning}</p>}
      {bullets.length > 0 && (
        <div className="mt-2 space-y-1">
          {bullets.map((b, i) => (
            <div key={i} className="text-xs">
              <span className="font-bold text-ss-teal">{b.label}: </span>
              <span className="text-ss-muted">{(b.items || []).join(', ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyRow({ copy }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-ss-bg p-4 text-sm text-ss-muted">
      <Info size={14} />
      {copy}
    </div>
  )
}
