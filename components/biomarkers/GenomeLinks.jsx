// /app/components/biomarkers/GenomeLinks.jsx
//
// Per-biomarker "Genome links" section. Renders inside a BiomarkerCard
// once the user has uploaded a genome AND the curated SNP library has
// at least one variant covered by the user's kit that maps to this
// biomarker.
//
// Silently renders nothing when no matches exist — never shows an empty
// section.

'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, Dna } from 'lucide-react'
import { matchesForBiomarker } from '@/lib/biomarkers/genomeMatch'
import { EVIDENCE_STRENGTH_META } from '@/lib/biomarkers/snps'

const DIRECTION_LABEL = {
  increases: 'may raise',
  decreases: 'may lower',
  modulates: 'may modulate',
}

export function GenomeLinks({ biomarkerId, report }) {
  const matches = useMemo(
    () => matchesForBiomarker(biomarkerId, report),
    [biomarkerId, report]
  )
  if (matches.length === 0) return null
  const risky = matches.filter((m) => m.riskCount > 0).length

  return (
    <section className="mt-5 rounded-2xl bg-gradient-to-br from-ss-teal/[0.06] to-transparent p-4 ring-1 ring-ss-teal/20 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">
          <Dna size={12} /> Genome links
        </div>
        <span className="text-[10px] italic text-ss-muted">
          {risky > 0
            ? `${risky} risk-allele carrying · ${matches.length} total covered`
            : `${matches.length} covered by your kit`}
        </span>
      </div>

      <ul className="space-y-3">
        {matches.map((m) => <MatchRow key={m.assoc.id} match={m} />)}
      </ul>
    </section>
  )
}

function MatchRow({ match }) {
  const [open, setOpen] = useState(match.riskCount > 0)
  const { assoc, genotype, riskCount, zygosity, effectText } = match
  const strength = EVIDENCE_STRENGTH_META[assoc.evidenceStrength] || EVIDENCE_STRENGTH_META.Moderate

  const zygDot =
    zygosity === 'homozygous'   ? 'bg-rose-500'
    : zygosity === 'heterozygous' ? 'bg-amber-500'
    : 'bg-emerald-500'

  const zygLabel =
    zygosity === 'homozygous'   ? 'Homozygous'
    : zygosity === 'heterozygous' ? 'Heterozygous'
    : 'No risk allele'

  return (
    <li className="rounded-xl bg-white p-3 ring-1 ring-ss-border-warm/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${zygDot}`} />
              {zygLabel}
            </span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ring-1 ${strength.tone}`}>
              {strength.label} evidence
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ss-muted">
              {DIRECTION_LABEL[assoc.direction] || 'may affect'}
            </span>
          </div>
          <div className="mt-1 text-sm font-bold text-ss-teal">
            {assoc.gene} · {assoc.variantLabel}
            <span className="ml-1.5 font-mono text-[11px] font-normal text-ss-muted">{assoc.rsid}</span>
          </div>
          <div className="mt-0.5 text-[11px] font-mono text-ss-muted">Your genotype: {genotype}</div>
        </div>
        <ChevronDown size={14} className={`shrink-0 text-ss-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-ss-border-warm/60 pt-3">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">What this variant is</div>
            <p className="text-xs leading-relaxed text-ss-text/85">{assoc.whatItIs}</p>
          </div>

          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">
              Effect at your genotype
            </div>
            <p className="text-xs leading-relaxed text-ss-text">{effectText}</p>
          </div>

          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">Interpretation</div>
            <p className="text-xs leading-relaxed text-ss-text">{assoc.interpretation}</p>
          </div>

          {assoc.actionable && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-orange">Possible next step</div>
              <p className="text-xs leading-relaxed text-ss-text/85">{assoc.actionable}</p>
            </div>
          )}

          {assoc.citations?.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">Sources</div>
              <ul className="space-y-1">
                {assoc.citations.map((c, i) => (
                  <li key={i} className="text-[11px]">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ss-teal hover:underline">
                        {c.label} <ExternalLink size={9} className="inline" />
                      </a>
                    ) : (
                      <span className="font-semibold">{c.label}</span>
                    )}
                    {c.year && <span className="ml-1 text-ss-muted">({c.year})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[10px] italic text-ss-muted">
            Genotype is one input among many. Interpret alongside the biomarker value, your history, and a clinician’s judgment.
          </div>
        </div>
      )}
    </li>
  )
}

export default GenomeLinks
