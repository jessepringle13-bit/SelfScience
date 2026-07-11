'use client'

// /app/app/drug-check/drug-check-client.jsx
// SelfScience — Drug Checker page.
// Type a medication → see estimated pharmacogenomic guidance based on the
// user's genome findings (loaded from sessionStorage).
//
// This is educational only — never a substitute for clinical PGx testing.
// The disclaimer callout is persistent at both top AND bottom of the page.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Pill, ShieldAlert, Info, ArrowRight, Loader2, X } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import RegenTools from '@/components/RegenTools'
import { getGenomeResults } from '@/lib/genomeSession'
import {
  DRUG_CATALOG,
  SEVERITY_META,
  findDrug,
  suggestDrugs,
  DRUG_CHECKER_DISCLAIMER,
} from '@/lib/drugCatalog'
import { inferAllPGxPhenotypes } from '@/lib/pgxClassifier'

const POPULAR_QUERIES = ['clopidogrel', 'warfarin', 'codeine', 'omeprazole', 'simvastatin', 'escitalopram']

export default function DrugCheckClient() {
  const [report, setReport] = useState(null)
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setReport(getGenomeResults()); setReady(true)
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const phenotypes = useMemo(() => (report ? inferAllPGxPhenotypes(report) : null), [report])
  const suggestions = useMemo(() => suggestDrugs(query), [query])
  const guidance = useMemo(() => (selected && phenotypes) ? selected.guidance(phenotypes) : null, [selected, phenotypes])

  const pickDrug = (d) => {
    setSelected(d)
    setQuery(d.generic)
  }

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />

      <div className="container pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <Pill size={14} /> Drug Check
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              How a medication interacts with your genome.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              Search a drug to see CPIC-style pharmacogenomic guidance based on your genome findings
              — for conversations with your prescriber, not a replacement for clinical testing.
            </p>
          </div>
          {report && <RegenTools />}
        </div>

        {/* Top disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
          <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-amber" />
          <p className="text-sm leading-relaxed text-ss-text">
            <span className="font-semibold">Educational only.</span> {DRUG_CHECKER_DISCLAIMER}
          </p>
        </div>

        {/* No-genome empty state */}
        {ready && !report && (
          <div className="mt-8 rounded-2xl border border-dashed border-ss-border-warm bg-white/40 p-8 text-center">
            <p className="text-sm text-ss-muted">Upload your genome to unlock personalized drug guidance.</p>
            <Link href="/genome" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
              Upload genome <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {ready && report && (
          <>
            {/* Search input */}
            <div className="relative mt-8">
              <div className="flex items-center gap-2 rounded-2xl border border-ss-border-warm bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-ss-teal/40">
                <Search size={18} className="ml-2 text-ss-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
                  placeholder="Search for a medication (e.g. clopidogrel, warfarin, codeine)"
                  className="flex-1 border-0 bg-transparent px-2 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:outline-none"
                  aria-label="Drug name search"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setSelected(null) }} aria-label="Clear" className="rounded-full p-1 text-ss-muted hover:bg-ss-bg">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown suggestions */}
              {query && !selected && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 z-10 mt-1 max-h-72 overflow-auto rounded-2xl border border-ss-border-warm bg-white shadow-lg">
                  {suggestions.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => pickDrug(d)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-ss-bg"
                      >
                        <div>
                          <div className="font-semibold text-ss-text capitalize">{d.generic}</div>
                          <div className="text-xs text-ss-muted">
                            {d.class} · {d.brand?.join(', ')}
                          </div>
                        </div>
                        <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ss-teal">
                          {d.primaryGene}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query && !selected && suggestions.length === 0 && (
                <div className="mt-2 rounded-lg bg-ss-bg/60 p-3 text-xs text-ss-muted">
                  No PGx-linked drug matches “{query}” in the catalog. This tool covers major CPIC-listed medications only — many common drugs (like acetaminophen or metformin) don&apos;t have actionable pharmacogenomic guidance.
                </div>
              )}
            </div>

            {/* Popular queries */}
            {!selected && !query && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-ss-muted">Popular checks:</span>
                {POPULAR_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { const d = findDrug(q); if (d) pickDrug(d) }}
                    className="rounded-full border border-ss-border-warm bg-white px-3 py-1 text-xs font-medium capitalize text-ss-teal transition hover:bg-ss-teal/5"
                  >{q}</button>
                ))}
              </div>
            )}

            {/* Result card */}
            {selected && guidance && (
              <GuidanceCard drug={selected} guidance={guidance} phenotypes={phenotypes} />
            )}

            {/* Phenotype snapshot */}
            {phenotypes && (
              <PhenotypeSnapshot phenotypes={phenotypes} onPickDrug={pickDrug} selectedId={selected?.id} />
            )}

            {/* Bottom disclaimer */}
            <div className="mt-10 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
              <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-amber" />
              <p className="text-sm leading-relaxed text-ss-text">
                <span className="font-semibold">Bring this to your prescriber.</span>{' '}
                {DRUG_CHECKER_DISCLAIMER}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function GuidanceCard({ drug, guidance, phenotypes }) {
  const sev = SEVERITY_META[guidance.severity] || SEVERITY_META.clear
  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ss-border-warm/60 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold capitalize text-ss-teal">{drug.generic}</span>
            {drug.brand?.length > 0 && (
              <span className="text-sm text-ss-muted">({drug.brand.join(', ')})</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ss-muted">
            <span>{drug.class}</span>
            <span>·</span>
            <span>Primary gene: <code className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{drug.primaryGene}</code></span>
            {drug.extraGenes?.length > 0 && (
              <>
                <span>+</span>
                {drug.extraGenes.map((g) => (
                  <code key={g} className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{g}</code>
                ))}
              </>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${sev.chip}`}>
          <span className={`inline-block h-2 w-2 rounded-full ${sev.dot}`} aria-hidden="true" />
          {sev.label}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ss-muted">Your phenotype</div>
          <div className="mt-1 text-sm font-bold text-ss-text">{guidance.headline}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ss-muted">What the research shows</div>
          <p className="mt-1 text-sm leading-relaxed text-ss-text">{guidance.body}</p>
        </div>
        <div className="rounded-lg bg-ss-teal/5 p-4 ring-1 ring-ss-teal/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ss-teal">Discussion point with your prescriber</div>
          <p className="mt-1 text-sm leading-relaxed text-ss-text">{guidance.action}</p>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-ss-bg/60 p-3 text-xs text-ss-muted">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>Estimated from single-SNP consumer genome data. Clinical PGx testing can resolve full star-allele status.</span>
        </div>
      </div>
    </div>
  )
}

function PhenotypeSnapshot({ phenotypes, onPickDrug, selectedId }) {
  const rows = [
    { gene: 'CYP2C19', ph: phenotypes.CYP2C19 },
    { gene: 'CYP2D6',  ph: phenotypes.CYP2D6 },
    { gene: 'CYP2C9',  ph: phenotypes.CYP2C9 },
    { gene: 'VKORC1',  ph: phenotypes.VKORC1 },
    { gene: 'SLCO1B1', ph: phenotypes.SLCO1B1 },
    { gene: 'DPYD',    ph: phenotypes.DPYD },
    { gene: 'TPMT',    ph: phenotypes.TPMT },
  ]
  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-ss-text">Your PGx phenotype snapshot</h2>
      <p className="mt-1 text-xs text-ss-muted">Estimated from your genome file. Click any gene to see drugs affected by it.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ gene, ph }) => {
          const drugsAffected = DRUG_CATALOG.filter((d) => d.primaryGene === gene || d.extraGenes?.includes(gene))
          return (
            <div key={gene} className="rounded-xl bg-white p-4 ring-1 ring-ss-border-warm/60">
              <div className="flex items-center justify-between">
                <div className="font-bold text-ss-teal">{gene}</div>
                <span className="text-[10px] uppercase tracking-wider text-ss-muted">{drugsAffected.length} drugs</span>
              </div>
              <div className="mt-1 text-sm text-ss-text">{ph.label}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                {drugsAffected.slice(0, 6).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onPickDrug(d)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize transition ${
                      selectedId === d.id
                        ? 'bg-ss-teal text-white'
                        : 'bg-ss-bg text-ss-muted hover:bg-ss-teal/10 hover:text-ss-teal'
                    }`}
                  >
                    {d.generic}
                  </button>
                ))}
                {drugsAffected.length > 6 && (
                  <span className="text-[10px] text-ss-muted">+{drugsAffected.length - 6} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
