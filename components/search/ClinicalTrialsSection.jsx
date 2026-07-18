'use client'

// /app/components/search/ClinicalTrialsSection.jsx
// Collapsible ClinicalTrials.gov strip that sits above the main literature
// results on /search. Design goals (2026-07):
//
//   * ALWAYS renders when trials exist (parent already checks length > 0)
//   * Collapsed by default with a count badge so trials never overwhelm
//     the literature below — but the user always knows they're there
//   * Recruiting trials get a green left-border + a "potentially enrolling"
//     note so users see them first when they expand
//   * Status pills: Recruiting = green, Active not recruiting = amber,
//     Completed = muted teal, Unknown = grey
//   * Add-to-practitioner-report on every card (writes plain summary +
//     NCT id + status to sessionStorage via practitionerReport.js)
//   * Genome relevance tag if any of the user's activeGenes appears in the
//     trial's conditions or interventions text

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, FileText, Check, TestTube2 } from 'lucide-react'
import { addToPractitionerReport, isInPractitionerReport, PRACTITIONER_CHANGE_EVENT } from '@/lib/practitionerReport'

const STATUS_STYLES = {
  RECRUITING: {
    pill: 'bg-ss-green/15 text-ss-green ring-1 ring-ss-green/30',
    label: 'Recruiting',
    border: 'border-l-ss-green',
    isRecruiting: true,
  },
  NOT_YET_RECRUITING: {
    pill: 'bg-ss-green/10 text-ss-green ring-1 ring-ss-green/25',
    label: 'Not yet recruiting',
    border: 'border-l-ss-green/50',
    isRecruiting: true,
  },
  ACTIVE_NOT_RECRUITING: {
    pill: 'bg-ss-amber/15 text-ss-amber ring-1 ring-ss-amber/30',
    label: 'Active — not recruiting',
    border: 'border-l-ss-amber',
    isRecruiting: false,
  },
  ENROLLING_BY_INVITATION: {
    pill: 'bg-ss-amber/15 text-ss-amber ring-1 ring-ss-amber/30',
    label: 'Enrolling by invitation',
    border: 'border-l-ss-amber',
    isRecruiting: false,
  },
  COMPLETED: {
    pill: 'bg-ss-teal/10 text-ss-teal ring-1 ring-ss-teal/25',
    label: 'Completed',
    border: 'border-l-ss-muted/40',
    isRecruiting: false,
  },
  TERMINATED: {
    pill: 'bg-ss-muted/15 text-ss-muted ring-1 ring-ss-muted/30',
    label: 'Terminated',
    border: 'border-l-ss-muted/40',
    isRecruiting: false,
  },
  WITHDRAWN: {
    pill: 'bg-ss-muted/15 text-ss-muted ring-1 ring-ss-muted/30',
    label: 'Withdrawn',
    border: 'border-l-ss-muted/40',
    isRecruiting: false,
  },
  SUSPENDED: {
    pill: 'bg-ss-muted/15 text-ss-muted ring-1 ring-ss-muted/30',
    label: 'Suspended',
    border: 'border-l-ss-muted/40',
    isRecruiting: false,
  },
}

function statusStyle(status) {
  return STATUS_STYLES[String(status || '').toUpperCase()] || {
    pill: 'bg-ss-muted/15 text-ss-muted ring-1 ring-ss-muted/30',
    label: String(status || 'Unknown').replace(/_/g, ' ').toLowerCase(),
    border: 'border-l-ss-muted/40',
    isRecruiting: false,
  }
}

function TrialCard({ trial, matchedGenes = [] }) {
  const [inReport, setInReport] = useState(false)
  const cardId = trial.nctId || trial.id
  useEffect(() => {
    setInReport(isInPractitionerReport(cardId))
    const onChange = () => setInReport(isInPractitionerReport(cardId))
    window.addEventListener(PRACTITIONER_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(PRACTITIONER_CHANGE_EVENT, onChange)
  }, [cardId])

  const s = statusStyle(trial.status)
  const conditions = Array.isArray(trial.conditions) ? trial.conditions.slice(0, 2) : []

  const doAdd = () => {
    const added = addToPractitionerReport({
      id: cardId,
      gene: matchedGenes[0] || '',
      pillar: 'Clinical Trials',
      classification: `Trial — ${s.label}`,
      classification_text: trial.abstract || trial.title,
      rsid: null,
      genotype: null,
    })
    if (added) setInReport(true)
  }

  return (
    <div className={`flex flex-col rounded-2xl border border-ss-border-warm border-l-4 ${s.border} bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:shadow-md`}>
      {/* Status pills + year */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${s.pill}`}>
          {s.label}
        </span>
        {trial.phase && (
          <span className="rounded-full bg-ss-orange/15 px-2 py-0.5 text-ss-orange ring-1 ring-ss-orange/30">
            {trial.phase}
          </span>
        )}
        {trial.year && <span className="text-ss-muted">{trial.year}</span>}
      </div>

      {/* "Potentially enrolling" note for recruiting trials */}
      {s.isRecruiting && (
        <div className="mt-1.5 text-[11px] font-semibold text-ss-green">
          ● Potentially enrolling — check the study page for eligibility
        </div>
      )}

      {/* Title */}
      <a
        href={trial.url}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-1.5 block text-sm font-bold leading-snug text-ss-teal hover:underline line-clamp-2"
      >
        {trial.title}
      </a>

      {/* Sponsor / conditions one-liner */}
      {(trial.journal || conditions.length > 0) && (
        <div className="mt-0.5 line-clamp-1 text-[11px] text-ss-muted">
          {trial.journal}
          {conditions.length > 0 && trial.journal && ' · '}
          {conditions.join(', ')}
        </div>
      )}

      {/* Genome relevance tag */}
      {matchedGenes.length > 0 && (
        <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
          <span aria-hidden>●</span>
          Matches your {matchedGenes[0]}{matchedGenes.length > 1 ? ` +${matchedGenes.length - 1}` : ''}
        </div>
      )}

      {/* Actions */}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-ss-border-warm pt-2">
        <a
          href={trial.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-8 items-center gap-1 text-[11px] font-semibold text-ss-teal hover:underline"
        >
          <ExternalLink size={11} /> View on ClinicalTrials.gov
        </a>
        <button
          type="button"
          onClick={doAdd}
          className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${inReport ? 'border border-ss-green bg-ss-green/10 text-ss-green' : 'border border-ss-border-warm bg-white text-ss-muted hover:border-ss-teal hover:text-ss-teal'}`}
        >
          {inReport ? <><Check size={11} /> In report</> : <><FileText size={11} /> Add to report</>}
        </button>
      </div>
    </div>
  )
}

export default function ClinicalTrialsSection({ trials, query, userGenes = [] }) {
  const [open, setOpen] = useState(false)

  // For each trial, compute which of the user's active genes actually
  // appear in the trial title/conditions/interventions. This is what
  // powers the "Matches your GENE" tag on each card. When no genome is
  // loaded, matchedGenes stays empty and the tag is hidden.
  const enrichedTrials = useMemo(() => {
    const upperGenes = (userGenes || []).map((g) => String(g).toUpperCase())
    return trials.map((t) => {
      const text = `${t.title || ''} ${(t.conditions || []).join(' ')} ${(t.interventions || []).join(' ')}`.toUpperCase()
      const matched = upperGenes.filter((g) => text.includes(g) && g.length >= 2)
      return { ...t, _matched: matched }
    })
  }, [trials, userGenes])

  // Split + sort: recruiting first so users see enrollable studies at top.
  const sorted = useMemo(() => {
    const priority = { RECRUITING: 0, NOT_YET_RECRUITING: 1, ACTIVE_NOT_RECRUITING: 2, ENROLLING_BY_INVITATION: 3, COMPLETED: 4 }
    return [...enrichedTrials].sort((a, b) => {
      const pa = priority[String(a.status || '').toUpperCase()] ?? 9
      const pb = priority[String(b.status || '').toUpperCase()] ?? 9
      if (pa !== pb) return pa - pb
      return (b.year || 0) - (a.year || 0)
    })
  }, [enrichedTrials])

  const recruitingCount = enrichedTrials.filter((t) => statusStyle(t.status).isRecruiting).length

  return (
    <div className="mb-6 rounded-2xl border border-ss-teal/30 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TestTube2 size={16} className="shrink-0 text-ss-teal" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ss-teal">
              Clinical Trials
            </div>
            <div className="mt-0.5 line-clamp-1 text-sm font-bold text-ss-text">
              For &ldquo;{query}&rdquo;
            </div>
          </div>
          <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-ss-teal px-2 py-0.5 text-[11px] font-bold text-white">
            {trials.length}
          </span>
          {recruitingCount > 0 && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ss-green/15 px-2 py-0.5 text-[11px] font-bold text-ss-green"
              title={`${recruitingCount} currently recruiting participants`}
            >
              {recruitingCount} recruiting
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`shrink-0 text-ss-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-ss-border-warm p-3">
          <div className="grid gap-2 md:grid-cols-2">
            {sorted.map((t) => (
              <TrialCard key={t.id} trial={t} matchedGenes={t._matched || []} />
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <a
              href={`https://clinicaltrials.gov/search?term=${encodeURIComponent(query || '')}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ss-teal hover:underline"
            >
              See all on ClinicalTrials.gov <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
