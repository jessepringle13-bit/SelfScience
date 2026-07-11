'use client'

// /app/app/practitioner-report/practitioner-report-client.jsx
// SelfScience — Practitioner Report.
//
// A clinician-facing, print-optimised single-page summary of the user's
// genome findings. Designed to be handed to a doctor / functional-med
// practitioner alongside a normal appointment — never a substitute for
// clinical genetic testing.
//
// Sections:
//   • Header block (letterhead, editable patient + practitioner + date fields)
//   • Overview counts (variants recognised, awareness, strengths, PGx genes,
//                      biomarker fields filled)
//   • Awareness findings table
//   • Strengths / neutral findings table
//   • PGx phenotype snapshot (7 CPIC-relevant genes)
//   • Biomarker panel (only fields the user has filled in)
//   • Educational disclaimer + provenance footer
//
// Every table row cites the rsID + call so a practitioner can independently
// verify against a clinical PGx test.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Printer, ArrowRight, ShieldAlert, FileText } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { getGenomeResults } from '@/lib/genomeSession'
import { collectRawGenotypeRows } from '@/lib/genomeCards'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { inferAllPGxPhenotypes } from '@/lib/pgxClassifier'
import {
  BIOMARKERS,
  STATUS_META,
  evaluateBiomarker,
  BIOMARKERS_DISCLAIMER,
} from '@/lib/biomarkers'
import { getBiomarkerValues } from '@/lib/biomarkersSession'

export default function PractitionerReportClient() {
  const [report, setReport] = useState(null)
  const [labs, setLabs] = useState({})
  const [ready, setReady] = useState(false)

  // Editable header fields — persisted in sessionStorage so a re-render
  // (or a "Refresh analysis" click) doesn't clobber a name the user typed.
  const [patientName, setPatientName] = useState('')
  const [practitionerName, setPractitionerName] = useState('')
  const [reportDate, setReportDate] = useState('')

  useEffect(() => {
    setReport(getGenomeResults())
    setLabs(getBiomarkerValues() || {})
    setReady(true)

    // Default date to today (local, YYYY-MM-DD).
    if (typeof window !== 'undefined') {
      const today = new Date()
      const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
      setReportDate(iso)

      // Restore previously-entered header fields.
      try {
        setPatientName(sessionStorage.getItem('ss_practitioner_patient') || '')
        setPractitionerName(sessionStorage.getItem('ss_practitioner_provider') || '')
      } catch { /* noop */ }
    }

    const onChange = () => {
      setReport(getGenomeResults())
      setLabs(getBiomarkerValues() || {})
    }
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  // Persist the practitioner header fields as the user types.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { sessionStorage.setItem('ss_practitioner_patient', patientName) } catch { /* noop */ }
  }, [patientName])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { sessionStorage.setItem('ss_practitioner_provider', practitionerName) } catch { /* noop */ }
  }, [practitionerName])

  const cards = useMemo(() => (report ? flattenReportCards(report) : []), [report])
  const areas     = useMemo(() => report?.overview?.areasToExplore || [], [report])
  const strengths = useMemo(() => report?.overview?.strengths || [], [report])
  const neutrals  = useMemo(() => cards.filter((c) => c.classification === 'neutral'), [cards])
  const phenotypes = useMemo(() => (report ? inferAllPGxPhenotypes(report) : null), [report])
  const rawCount = useMemo(() => Object.keys(report?._variants || {}).length, [report])
  const rawRows = useMemo(() => (report ? collectRawGenotypeRows(report) : []), [report])

  // Only surface biomarker fields the user has actually filled in — this
  // keeps the report short and honest.
  const filledLabs = useMemo(() => {
    if (!labs) return []
    const out = []
    for (const b of BIOMARKERS) {
      const raw = labs[b.id]
      if (raw === undefined || raw === '' || raw === null) continue
      const num = Number(raw)
      if (!Number.isFinite(num)) continue
      const status = evaluateBiomarker(b, num)
      out.push({ b, num, status })
    }
    return out
  }, [labs])

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="min-h-screen bg-ss-bg">
      {/* Hide the site chrome and any nav / mobile bar when printing. */}
      <div className="ss-screen-only">
        <SiteNav />
      </div>

      <div className="container pt-8 pb-24">
        {/* Screen-only controls / instructions */}
        <div className="ss-screen-only mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <FileText size={14} /> Practitioner Report
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              A clinician-facing summary of your genome.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              Print this page (or save as PDF) to hand to your primary-care
              physician, functional-medicine practitioner, or pharmacist. Every
              row includes the rsID and raw call so they can verify against a
              clinical test.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              <Printer size={14} /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Empty state */}
        {ready && !report && (
          <div className="mt-6 rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-8 text-center">
            <p className="text-sm text-ss-muted">
              Upload your genome first — the practitioner report is populated from
              your recognised variants.
            </p>
            <Link
              href="/genome"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Upload genome <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {ready && report && (
          <div className="ss-print-sheet mx-auto max-w-[8.5in] rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ss-border-warm/60 print:m-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0">
            {/* ────────────── Letterhead ────────────── */}
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ss-border-warm/70 pb-6">
              <div>
                <div className="flex items-center gap-2 text-ss-teal">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-ss-orange" />
                  <span className="text-lg font-extrabold tracking-tight">SelfScience</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ss-muted">
                  Consumer Genome Summary — Educational
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">
                  Report generated
                </div>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="mt-1 rounded border border-ss-border-warm bg-white px-2 py-1 text-right text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-teal/30 print:border-0 print:p-0"
                />
              </div>
            </header>

            {/* Patient + practitioner input row */}
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">
                  Patient (self-reported)
                </div>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name or initials"
                  className="mt-1 w-full rounded border border-ss-border-warm bg-white px-2 py-1 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-teal/30 print:border-0 print:border-b print:p-0 print:ring-0"
                />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">
                  For the attention of
                </div>
                <input
                  type="text"
                  value={practitionerName}
                  onChange={(e) => setPractitionerName(e.target.value)}
                  placeholder="Practitioner name / role"
                  className="mt-1 w-full rounded border border-ss-border-warm bg-white px-2 py-1 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-teal/30 print:border-0 print:border-b print:p-0 print:ring-0"
                />
              </div>
            </section>

            {/* ────────────── Persistent disclaimer ────────────── */}
            <div className="mt-6 rounded border-l-4 border-ss-amber bg-ss-amber/10 p-3 text-[12px] leading-relaxed text-ss-text">
              <span className="font-semibold">Educational only.</span> This summary is derived
              from consumer-grade single-SNP data (e.g. 23andMe, AncestryDNA). It is <em>not</em> a
              validated clinical diagnostic. Any dosing, prescribing, or treatment decision
              suggested by these findings must be confirmed with a validated clinical
              pharmacogenomics test and interpreted by a qualified clinician.
            </div>

            {/* ────────────── Overview counts ────────────── */}
            <section className="mt-6">
              <SectionTitle>1 · Overview</SectionTitle>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="SNPs recognised" value={rawCount} />
                <Stat label="Awareness" value={areas.length} tone="amber" />
                <Stat label="Strengths" value={strengths.length} tone="green" />
                <Stat label="PGx genes" value={phenotypes ? Object.keys(phenotypes).length : 0} />
                <Stat label="Labs filled" value={filledLabs.length} />
              </div>
            </section>

            {/* ────────────── Awareness findings ────────────── */}
            <section className="mt-8">
              <SectionTitle>2 · Awareness findings</SectionTitle>
              <p className="mt-1 text-[12px] text-ss-muted">
                Variants flagged for provider discussion — none are diagnoses.
              </p>
              {areas.length === 0 ? (
                <EmptyRow>No awareness findings.</EmptyRow>
              ) : (
                <FindingTable items={areas} />
              )}
            </section>

            {/* ────────────── Strengths findings ────────────── */}
            <section className="mt-8">
              <SectionTitle>3 · Strengths</SectionTitle>
              <p className="mt-1 text-[12px] text-ss-muted">
                Variants associated with favorable research signals.
              </p>
              {strengths.length === 0 ? (
                <EmptyRow>No strength findings.</EmptyRow>
              ) : (
                <FindingTable items={strengths} />
              )}
            </section>

            {/* ────────────── PGx phenotype snapshot ────────────── */}
            <section className="mt-8">
              <SectionTitle>4 · Estimated pharmacogenomic phenotypes</SectionTitle>
              <p className="mt-1 text-[12px] text-ss-muted">
                Single-SNP inference — <span className="font-semibold">confirm star-allele status
                with a clinical PGx test</span> before any dosing decision.
              </p>
              {phenotypes ? <PGxTable phenotypes={phenotypes} rawVariants={report._variants} /> : null}
            </section>

            {/* ────────────── Biomarkers ────────────── */}
            <section className="mt-8">
              <SectionTitle>5 · Biomarker panel (self-reported)</SectionTitle>
              {filledLabs.length === 0 ? (
                <EmptyRow>No biomarker values entered.</EmptyRow>
              ) : (
                <BiomarkerTable rows={filledLabs} />
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-ss-muted">
                {BIOMARKERS_DISCLAIMER}
              </p>
            </section>

            {/* ────────────── Neutral findings ────────────── */}
            {neutrals.length > 0 && (
              <section className="mt-8">
                <SectionTitle>6 · Additional recognised variants (neutral)</SectionTitle>
                <p className="mt-1 text-[12px] text-ss-muted">
                  Included for completeness — no research-associated favorable or unfavorable
                  interpretation applies to these genotypes.
                </p>
                <FindingTable items={neutrals} compact />
              </section>
            )}

            {/* ────────────── All raw calls appendix (for verification) ────────────── */}
            <section className="mt-8">
              <SectionTitle>7 · Raw genotype appendix</SectionTitle>
              <p className="mt-1 text-[12px] text-ss-muted">
                The full list of rsIDs SelfScience recognised in the uploaded file
                and the raw two-base call at each. Useful for cross-referencing
                a clinical panel.
              </p>
              <RawAppendix rows={rawRows} />
            </section>

            {/* ────────────── Footer disclaimer ────────────── */}
            <footer className="mt-10 border-t border-ss-border-warm/70 pt-4 text-[11px] leading-relaxed text-ss-muted">
              <p>
                <span className="font-semibold text-ss-text">About this report.</span>{' '}
                Findings are derived from consumer-grade single-SNP data and interpreted
                against public research (PubMed, gnomAD, CPIC, 1000 Genomes). Nothing here
                is a substitute for clinical genetic testing, diagnosis, or treatment.
                Population-frequency estimates use gnomAD v3 / 1000 Genomes averages and
                should not be used to make ancestry inferences at the individual level.
              </p>
              <p className="mt-2">
                Generated by <span className="font-semibold text-ss-teal">SelfScience</span>{' '}
                on {reportDate || '—'}. Report ID:{' '}
                <span className="font-mono">
                  {report?._reportId || `SS-${Date.now().toString(36).toUpperCase()}`}
                </span>.
              </p>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ children }) {
  return (
    <h2 className="border-b border-ss-teal/20 pb-1 text-[13px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">
      {children}
    </h2>
  )
}

function Stat({ label, value, tone }) {
  const valueClass =
    tone === 'green' ? 'text-ss-green'
      : tone === 'amber' ? 'text-ss-amber'
      : 'text-ss-teal'
  return (
    <div className="rounded border border-ss-border-warm/70 p-3 text-center">
      <div className={`text-2xl font-extrabold ${valueClass}`}>{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-ss-muted">
        {label}
      </div>
    </div>
  )
}

function EmptyRow({ children }) {
  return (
    <div className="mt-3 rounded border border-dashed border-ss-border-warm/70 p-3 text-center text-[12px] text-ss-muted">
      {children}
    </div>
  )
}

function FindingTable({ items, compact = false }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-ss-border-warm/70 text-[10px] uppercase tracking-wider text-ss-muted">
            <th className="py-1 pr-2 font-semibold">Gene / trait</th>
            <th className="py-1 pr-2 font-semibold">rsID</th>
            <th className="py-1 pr-2 font-semibold">Genotype</th>
            {!compact && <th className="py-1 pr-2 font-semibold">Note</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((c, i) => (
            <tr key={(c.rsid || '') + i} className="border-b border-ss-border-warm/30 align-top last:border-0">
              <td className="py-1.5 pr-2">
                <div className="font-bold text-ss-text">{c.name || c.gene || c.rsid}</div>
                {c.trait && !compact && <div className="text-[11px] text-ss-muted">{c.trait}</div>}
              </td>
              <td className="py-1.5 pr-2 font-mono text-[11px]">{c.rsid || '—'}</td>
              <td className="py-1.5 pr-2 font-semibold">{c.genotype || '—'}</td>
              {!compact && (
                <td className="py-1.5 pr-2 leading-relaxed">
                  {truncate(c.plain || c.classification_text || '', 260)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PGxTable({ phenotypes, rawVariants }) {
  const genes = [
    { code: 'CYP2C19', drugs: 'clopidogrel, PPIs, SSRIs' },
    { code: 'CYP2D6',  drugs: 'codeine, tramadol, SSRIs, tricyclics' },
    { code: 'CYP2C9',  drugs: 'warfarin, NSAIDs, phenytoin' },
    { code: 'VKORC1',  drugs: 'warfarin (sensitivity)' },
    { code: 'SLCO1B1', drugs: 'simvastatin, statins' },
    { code: 'DPYD',    drugs: '5-fluorouracil, capecitabine' },
    { code: 'TPMT',    drugs: 'azathioprine, 6-mercaptopurine' },
  ]
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-ss-border-warm/70 text-[10px] uppercase tracking-wider text-ss-muted">
            <th className="py-1 pr-2 font-semibold">Gene</th>
            <th className="py-1 pr-2 font-semibold">Estimated phenotype</th>
            <th className="py-1 pr-2 font-semibold">Supporting SNP calls</th>
            <th className="py-1 pr-2 font-semibold">Relevant drugs</th>
          </tr>
        </thead>
        <tbody>
          {genes.map(({ code, drugs }) => {
            const ph = phenotypes?.[code]
            const supporting = supportingCalls(code, rawVariants)
            return (
              <tr key={code} className="border-b border-ss-border-warm/30 align-top last:border-0">
                <td className="py-1.5 pr-2 font-mono font-semibold text-ss-teal">{code}</td>
                <td className="py-1.5 pr-2 font-semibold">{ph?.label || '—'}</td>
                <td className="py-1.5 pr-2 font-mono text-[11px] text-ss-muted">
                  {supporting || '(no supporting SNPs found)'}
                </td>
                <td className="py-1.5 pr-2">{drugs}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BiomarkerTable({ rows }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-ss-border-warm/70 text-[10px] uppercase tracking-wider text-ss-muted">
            <th className="py-1 pr-2 font-semibold">Marker</th>
            <th className="py-1 pr-2 font-semibold">Value</th>
            <th className="py-1 pr-2 font-semibold">Optimal range</th>
            <th className="py-1 pr-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ b, num, status }) => {
            const meta = STATUS_META[status] || {}
            return (
              <tr key={b.id} className="border-b border-ss-border-warm/30 align-top last:border-0">
                <td className="py-1.5 pr-2">
                  <div className="font-bold text-ss-text">{b.label}</div>
                  {b.secondaryLabel && <div className="text-[10px] text-ss-muted">{b.secondaryLabel}</div>}
                </td>
                <td className="py-1.5 pr-2 font-semibold">{num} {b.unit}</td>
                <td className="py-1.5 pr-2 text-ss-muted">{b.optimal}</td>
                <td className="py-1.5 pr-2 font-semibold" style={{ color: meta.color }}>
                  {meta.label || status}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RawAppendix({ rows }) {
  if (!rows?.length) return <EmptyRow>No raw variants stored.</EmptyRow>
  // Sort alphabetically by rsID for reproducibility.
  const sorted = [...rows].sort((a, b) => a.rsid.localeCompare(b.rsid))
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] sm:grid-cols-3 print:grid-cols-4">
      {sorted.map((r) => (
        <div key={r.rsid} className="flex items-baseline justify-between border-b border-ss-border-warm/20 py-0.5">
          <span className="font-mono text-ss-muted">{r.rsid}</span>
          <span className="ml-2 font-mono font-semibold text-ss-text">{r.rawGenotype}</span>
          {r.gene && <span className="ml-2 text-[10px] text-ss-muted">{r.gene}</span>}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function truncate(s, max) {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

// Return a compact `rsID:GT · rsID:GT` string of the SNPs supporting a given
// PGx gene's phenotype call, so a practitioner can independently verify.
function supportingCalls(gene, rawVariants) {
  const RSIDS_BY_GENE = {
    CYP2C19: ['rs4244285', 'rs4986893', 'rs12248560'],
    CYP2D6:  ['rs3892097', 'rs1065852', 'rs35742686', 'rs5030655'],
    CYP2C9:  ['rs1799853', 'rs1057910'],
    VKORC1:  ['rs9923231'],
    SLCO1B1: ['rs4149056'],
    DPYD:    ['rs3918290', 'rs67376798', 'rs55886062'],
    TPMT:    ['rs1800462', 'rs1800460', 'rs1142345'],
  }
  const list = RSIDS_BY_GENE[gene] || []
  const parts = []
  for (const rsid of list) {
    const gt = rawVariants?.[rsid]
    if (gt) parts.push(`${rsid}:${gt}`)
  }
  return parts.join(' · ')
}
