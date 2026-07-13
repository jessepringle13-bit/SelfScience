// /app/components/biomarkers/GenomeSidebar.jsx
//
// Replaces the ad-hoc "Genetic Context" sidebar block with a
// cross-biomarker summary powered by /lib/biomarkers/genomeMatch.js.
// Shows: coverage counts, a compact list of risk-carrying variants,
// and a clickable "Jump to biomarker" affordance per finding.
//
// The old sidebar (legacy correlations) is still rendered by biomarkers-
// client.jsx below this component so nothing pre-existing disappears.

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Dna, ArrowRight } from 'lucide-react'
import { summarizeMatches } from '@/lib/biomarkers/genomeMatch'
import { EVIDENCE_STRENGTH_META } from '@/lib/biomarkers/snps'

const BM_LABEL = {
  hba1c: 'HbA1c', fasting_glucose: 'Fasting Glucose',
  testosterone_total: 'Total T', testosterone_free: 'Free T', shbg: 'SHBG',
  tsh: 'TSH', free_t3: 'Free T3', free_t4: 'Free T4',
  ferritin: 'Ferritin', hemoglobin: 'Hemoglobin', hs_crp: 'hs-CRP',
  apob: 'ApoB', ldl: 'LDL-C', hdl: 'HDL-C',
  vitamin_d: 'Vitamin D', igf1: 'IGF-1', homocysteine: 'Homocysteine',
}

export function GenomeSidebar({ report, onScrollToMarker }) {
  const summary = useMemo(() => summarizeMatches(report), [report])

  if (!report) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ss-teal">
          <Dna size={14} /> Genetic Context
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ss-muted">
          Upload a genome to cross-reference your biomarkers against ~18 well-established variants
          (MTHFR→homocysteine, HFE→ferritin, APOE→lipids, TCF7L2→HbA1c, GC/CYP2R1→vitamin D,
          DIO2→thyroid, and more) with evidence-strength labels.
        </p>
        <Link href="/genome" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
          Upload genome <ArrowRight size={11} />
        </Link>
      </div>
    )
  }

  if (summary.total === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ss-teal">
            <Dna size={14} /> Genetic Context
          </div>
          <span className="inline-flex items-center rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
            Linked to genome
          </span>
        </div>
        <p className="mt-3 text-xs text-ss-muted">
          None of the variants in our biomarker library are covered by your uploaded kit. This can
          happen with older or narrower genotyping chips. WGS files cover them all.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ss-teal">
          <Dna size={14} /> Genetic Context
        </div>
        <span className="inline-flex items-center rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">
          Linked to genome
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-ss-bg p-2">
          <div className="text-[10px] uppercase tracking-widest text-ss-muted">Covered variants</div>
          <div className="mt-0.5 font-mono text-lg font-bold text-ss-teal">{summary.total}</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-2 ring-1 ring-amber-100">
          <div className="text-[10px] uppercase tracking-widest text-amber-800">Risk-carrying</div>
          <div className="mt-0.5 font-mono text-lg font-bold text-amber-900">{summary.riskCarrying.length}</div>
        </div>
      </div>

      {summary.riskCarrying.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
            Your risk-carrying variants
          </div>
          <ul className="space-y-2">
            {summary.riskCarrying.slice(0, 8).map((m) => (
              <RiskRow key={m.assoc.id} match={m} onScrollToMarker={onScrollToMarker} />
            ))}
          </ul>
          {summary.riskCarrying.length > 8 && (
            <div className="mt-2 text-[10px] italic text-ss-muted">
              + {summary.riskCarrying.length - 8} more — see individual biomarker cards for details.
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-[10px] italic text-ss-muted">
        Every association here is labeled with an evidence-strength tier. Genotype is one input
        among many — always interpret alongside the biomarker value and a clinician’s judgment.
      </div>
    </div>
  )
}

function RiskRow({ match, onScrollToMarker }) {
  const { assoc, genotype, zygosity } = match
  const strength = EVIDENCE_STRENGTH_META[assoc.evidenceStrength] || EVIDENCE_STRENGTH_META.Moderate
  const zygDot =
    zygosity === 'homozygous'   ? 'bg-rose-500'
    : zygosity === 'heterozygous' ? 'bg-amber-500'
    : 'bg-emerald-500'
  return (
    <li className="rounded-lg bg-white p-2 ring-1 ring-ss-border-warm/60">
      <div className="flex items-baseline justify-between gap-1">
        <div className="min-w-0 text-xs font-bold text-ss-teal">{assoc.gene} · {assoc.variantLabel}</div>
        <span className="font-mono text-[10px] text-ss-muted">{genotype}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 ring-1 ring-slate-200">
          <span className={`inline-block h-1 w-1 rounded-full ${zygDot}`} />
          {zygosity === 'homozygous' ? 'Homozygous' : 'Heterozygous'}
        </span>
        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ring-1 ${strength.tone}`}>
          {strength.label}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {assoc.biomarkerIds.map((bid) => (
          <button
            key={bid}
            type="button"
            onClick={() => onScrollToMarker?.(bid)}
            className="inline-flex items-center gap-0.5 rounded-full bg-ss-teal/10 px-1.5 py-0.5 text-[10px] font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
          >
            {BM_LABEL[bid] || bid} <ArrowRight size={9} />
          </button>
        ))}
      </div>
    </li>
  )
}

export default GenomeSidebar
