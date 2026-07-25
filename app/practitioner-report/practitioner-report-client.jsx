'use client'

// /app/app/practitioner-report/practitioner-report-client.jsx
// SelfScience — Practitioner Report (Full Enhancement).
//
// Two distinct views composed on one page:
//   • ON-SCREEN (hidden on print): Intake form, section toggles,
//     "What to tell your doctor" tips, and Print / Save-as-PDF button.
//   • PRINT LAYOUT (visible during print + as an on-screen preview):
//       Page 1 — Cover + HIPAA acknowledgment + dual signature lines
//       Page 2 — Clinician context note                       [toggle]
//       Page 3 — Patient self-reported context table          [toggle]
//       Page 4 — Biomarker summary                            [toggle, auto-hidden if empty]
//       Page 5 — Genetic variant summary + optional raw appx  [toggle]
//       Final  — Legal disclaimer                              [LOCKED ON]
//
// STRICT PRIVACY: All intake, biomarker, and genome data is read from
// localStorage / sessionStorage. No backend calls. Print uses window.print().

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Printer, ArrowRight, FileText, Eye, EyeOff } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { getGenomeResults } from '@/lib/genomeSession'
import { collectRawGenotypeRows } from '@/lib/genomeCards'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { inferAllPGxPhenotypes } from '@/lib/pgxClassifier'
import { getBiomarkerValues } from '@/lib/biomarkersSession'
import { loadHistory } from '@/lib/biomarkers/history'
import {
  loadIntake,
  loadPrintSections,
  savePrintSections,
  PRINT_SECTION_DEFAULTS,
} from '@/lib/practitionerIntake'

import IntakeForm from '@/components/practitioner/IntakeForm'
import SectionToggles from '@/components/practitioner/SectionToggles'
import TellYourDoctorTips from '@/components/practitioner/TellYourDoctorTips'
import PrintCoverPage from '@/components/practitioner/PrintCoverPage'
import ClinicianNote from '@/components/practitioner/ClinicianNote'
import PatientContextTable from '@/components/practitioner/PatientContextTable'
import BiomarkerSummary from '@/components/practitioner/BiomarkerSummary'
import PractitionerSupplementBlock from '@/components/practitioner/PractitionerSupplementBlock'
import GeneticVariantSummary from '@/components/practitioner/GeneticVariantSummary'
import DisclaimerPage from '@/components/practitioner/DisclaimerPage'
import DashboardBackLink from '@/components/DashboardBackLink'
import PrintGateModal, { shouldPromptGate } from '@/components/practitioner/PrintGateModal'
import ExecutiveSummary from '@/components/practitioner/ExecutiveSummary'
import { reportFooterLine } from '@/lib/reportVersion'
import { fireGuideAction, GUIDE_ACTIONS } from '@/lib/guideActions'

export default function PractitionerReportClient() {
  const [report, setReport] = useState(null)
  const [labs, setLabs] = useState({})
  const [history, setHistory] = useState({ entries: [] })
  const [intake, setIntake] = useState(null)
  const [sections, setSections] = useState(PRINT_SECTION_DEFAULTS)
  const [ready, setReady] = useState(false)
  const [reportDate, setReportDate] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  // Section 6 spec: gate the print action behind an optional prompt for
  // medications / allergies / chief-concern. `pendingPrint` is true when
  // the user tapped Print and we're either showing the gate modal or
  // about to fire window.print().
  const [gateOpen, setGateOpen] = useState(false)

  useEffect(() => {
    setReport(getGenomeResults())
    setLabs(getBiomarkerValues() || {})
    setHistory(loadHistory())
    setIntake(loadIntake())
    setSections(loadPrintSections())
    setReady(true)

    if (typeof window !== 'undefined') {
      const today = new Date()
      const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
      setReportDate(iso)
    }

    const onChange = () => {
      setReport(getGenomeResults())
      setLabs(getBiomarkerValues() || {})
      setHistory(loadHistory())
    }
    window.addEventListener('selfscience:genome-changed', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('selfscience:genome-changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const cards       = useMemo(() => (report ? flattenReportCards(report) : []), [report])
  const areas       = useMemo(() => report?.overview?.areasToExplore || [], [report])
  const strengths   = useMemo(() => report?.overview?.strengths || [], [report])
  const neutrals    = useMemo(() => cards.filter((c) => c.classification === 'neutral'), [cards])
  const phenotypes  = useMemo(() => (report ? inferAllPGxPhenotypes(report) : null), [report])
  const rawRows     = useMemo(() => (report ? collectRawGenotypeRows(report) : []), [report])
  const reportId    = useMemo(() => (
    report?._reportId || (typeof window !== 'undefined' ? `SS-${Date.now().toString(36).toUpperCase()}` : 'SS-—')
  ), [report])

  // Detect whether the user has any biomarker data at all.
  const hasBiomarkers = useMemo(() => {
    if (history?.entries?.length > 0) {
      const latest = history.entries[0]
      return latest?.values && Object.keys(latest.values).length > 0
    }
    if (labs && Object.keys(labs).length > 0) {
      return Object.values(labs).some((v) => v !== '' && v != null && Number.isFinite(Number(v)))
    }
    return false
  }, [labs, history])

  const handleToggleSection = (key, value) => {
    const next = { ...sections, [key]: value }
    setSections(next)
    savePrintSections(next)
  }

  const handlePrint = () => {
    if (typeof window === 'undefined') return
    // Section 6 spec: if any of the three "most useful" fields
    // (medications / allergies / chief concern) is empty, prompt the
    // user to fill them in first. The prompt is non-blocking — either
    // button ("Complete now" or "Generate anyway") proceeds to print.
    if (shouldPromptGate(intake)) {
      setGateOpen(true)
      return
    }
    firePrint()
  }
  const firePrint = () => {
    // Journey Guide Tier 2 — the report is being generated / printed.
    try { fireGuideAction(GUIDE_ACTIONS.REPORT) } catch {}
    // Small delay so React finishes any pending state flushes before print.
    setTimeout(() => window.print(), 60)
  }
  const handleGateProceed = () => {
    setGateOpen(false)
    // Re-read intake in case the user filled fields via "Complete now",
    // then fire the print.
    setIntake(loadIntake())
    firePrint()
  }

  // Section 6 spec: dynamic section numbering. Currently Section 1 goes
  // to PatientContext, Section 2 to Biomarkers, Section 3 to Genetic
  // variants. If a user toggles PatientContext off, Biomarkers should
  // renumber to Section 1 and Genetic variants to Section 2 — no gap.
  // BiomarkerSummary is now rendered whenever `sections.biomarkers` is
  // on (even if `hasBiomarkers` is false) so the numbering stays stable
  // and the clinician sees an explicit "No biomarker values recorded"
  // note instead of a silently missing section.
  const sectionNums = useMemo(() => {
    const visible = []
    if (sections.patientContext) visible.push('patientContext')
    if (sections.biomarkers)     visible.push('biomarkers')
    if (sections.variants)       visible.push('variants')
    return Object.fromEntries(visible.map((k, i) => [k, i + 1]))
  }, [sections.patientContext, sections.biomarkers, sections.variants])

  return (
    <div className="min-h-screen bg-ss-bg">
      {/* SiteNav — screen only. */}
      <div className="ss-screen-only no-print">
        <SiteNav />
        <DashboardBackLink className="container pt-20 md:pt-24 -mb-4" />
      </div>

      <div className="container pt-8 pb-24">
        {/* ────────────── ON-SCREEN CONTROLS ────────────── */}
        <div className="ss-screen-only no-print">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
                <FileText size={14} /> Practitioner Report
              </div>
              <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
                A clinician-facing summary of your genome & biomarkers.
              </h1>
              <p className="mt-2 max-w-2xl text-ss-muted">
                Fill in the intake form, choose which sections to include, then print (or save as PDF) to hand to your primary-care physician, functional-medicine practitioner, or pharmacist. Every value stays on your device.
              </p>
              <Link
                href="/blueprint"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ss-teal hover:underline"
              >
                View your Blueprint before generating report <ArrowRight size={13} />
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPreviewMode((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal/10"
              >
                {previewMode ? <><EyeOff size={14} /> Hide preview</> : <><Eye size={14} /> Preview print layout</>}
              </button>
              <button
                onClick={handlePrint}
                disabled={!report}
                className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
            </div>
          </div>

          {/* Empty state */}
          {ready && !report && (
            <div className="mt-6 rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-8 text-center">
              <p className="text-sm text-ss-muted">
                Upload your genome first — the practitioner report is populated from your recognised variants.
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
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <IntakeForm onChange={setIntake} />
              </div>
              <div className="flex flex-col gap-5">
                <SectionToggles
                  sections={sections}
                  onToggle={handleToggleSection}
                  hasBiomarkers={hasBiomarkers}
                />
                <TellYourDoctorTips />
              </div>
            </div>
          )}
        </div>

        {/* ────────────── PRINT LAYOUT ────────────── */}
        {ready && report && (
          <div
            className={`ss-print-sheet mx-auto mt-8 max-w-[8.5in] rounded-2xl bg-white p-10 shadow-sm ring-1 ring-ss-border-warm/60 print:m-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0 ${
              previewMode ? '' : 'ss-screen-only-preview-hidden'
            }`}
          >
            {/* On-screen banner explaining preview */}
            <div className="ss-screen-only no-print mb-6 rounded border-l-4 border-ss-teal bg-ss-teal/5 p-3 text-[12px] text-ss-text">
              <span className="font-semibold text-ss-teal">Print preview.</span> This is exactly what will appear when you click "Print / Save as PDF." Screen-only controls above will be hidden.
            </div>

            {/* Page 1 — Cover + HIPAA + signatures (LOCKED ON) */}
            <PrintCoverPage intake={intake} reportDate={reportDate} reportId={reportId} />

            {/* Page 1a — Executive Summary (LOCKED ON). Slice 3C. */}
            <ExecutiveSummary intake={intake} areas={areas} phenotypes={phenotypes} />

            {/* Page 2 — Clinician context (toggleable) */}
            {sections.clinicianNote && <ClinicianNote />}

            {/* Page 3 — Patient context (toggleable) */}
            {sections.patientContext && (
              <PatientContextTable intake={intake} sectionNum={sectionNums.patientContext} />
            )}

            {/* Page 4 — Biomarkers (toggleable). Section 6 spec: always
                render when toggled on (even if empty) so the section
                numbering stays contiguous. Empty state is handled
                inside the component. */}
            {sections.biomarkers && (
              <BiomarkerSummary
                values={labs}
                history={history}
                sex={intake?.sex || 'male'}
                sectionNum={sectionNums.biomarkers}
              />
            )}

            {/* Supplement considerations (auto-hidden if no signals) */}
            <PractitionerSupplementBlock />

            {/* Page 5 — Genetic variant summary (toggleable) */}
            {sections.variants && (
              <GeneticVariantSummary
                areas={areas}
                strengths={strengths}
                neutrals={neutrals}
                phenotypes={phenotypes}
                rawVariants={report._variants}
                rawRows={rawRows}
                includeRawAppendix={!!sections.rawAppendix}
                sectionNum={sectionNums.variants}
              />
            )}

            {/* Final — Legal disclaimer (LOCKED ON) */}
            <DisclaimerPage reportId={reportId} reportDate={reportDate} />
          </div>
        )}
      </div>

      {/* Section 6 spec: gate modal for medications / allergies / chief
          concern. Non-blocking \u2014 both buttons proceed to print. */}
      <PrintGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onProceed={handleGateProceed}
      />

      {/* Print-only running footer: rules + variant DB version on every
          printed page. Chrome + Firefox both honour position:fixed in
          print media for a repeating page footer. Hidden entirely on
          screen so the preview stays clean. */}
      <div className="ss-print-running-footer" aria-hidden="true" style={{ display: 'none' }}>
        {reportFooterLine()}
      </div>

      {/* Toggle: hide the print sheet on-screen unless preview mode is on. */}
      <style jsx global>{`
        .ss-screen-only-preview-hidden {
          display: none;
        }
        @media print {
          .ss-screen-only-preview-hidden {
            display: block !important;
          }
          .ss-print-running-footer {
            position: fixed;
            bottom: 0.25in;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            font-style: italic;
            color: #7A7974;
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
