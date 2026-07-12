'use client'

// /app/app/drug-check/drug-check-client.jsx
// SelfScience — Drug Checker page (v2, June 2026).
//
// Type a medication → see estimated pharmacogenomic guidance based on the
// user's genome findings (loaded from sessionStorage).
//
// New in v2:
//   • Recreational / harm-reduction drug entries live behind an OPT-IN toggle
//     ("Show harm-reduction content"). Off by default so prescription users
//     never accidentally see recreational cards. Flipping it on immediately
//     surfaces the SAMHSA helpline card.
//   • Every drug card now renders THREE structured sections:
//       1. Your metabolism profile   — pk_genes table
//       2. Your receptor profile     — pd_genes table
//       3. Key interactions for you  — critical_interactions filtered by
//                                       the user's actual variants
//   • Recreational cards additionally carry a harm-reduction disclaimer
//     block at the top and the SAMHSA helpline block at the bottom.
//
// This tool is educational only — never a substitute for clinical PGx testing.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Pill, ShieldAlert, Info, ArrowRight, X, HeartHandshake, Phone, Beaker, Activity, AlertTriangle } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import RegenTools from '@/components/RegenTools'
import { getGenomeResults } from '@/lib/genomeSession'
import {
  DRUG_CATALOG,
  SEVERITY_META,
  findDrug,
  suggestDrugs,
  personaliseInteractions,
  DRUG_CHECKER_DISCLAIMER,
  HARM_REDUCTION_DISCLAIMER,
  SAMHSA_HELPLINE,
} from '@/lib/drugCatalog'
import { inferAllPGxPhenotypes } from '@/lib/pgxClassifier'

const POPULAR_QUERIES = ['clopidogrel', 'warfarin', 'codeine', 'omeprazole', 'simvastatin', 'escitalopram']
const HR_STORAGE_KEY  = 'selfscience_drug_harm_reduction_opt_in'

export default function DrugCheckClient() {
  const [report, setReport] = useState(null)
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [showHR, setShowHR] = useState(false)

  useEffect(() => {
    setReport(getGenomeResults()); setReady(true)
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(HR_STORAGE_KEY) : null
      if (stored === '1') setShowHR(true)
    } catch { /* noop */ }
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const toggleHR = () => {
    setShowHR((prev) => {
      const next = !prev
      try { localStorage.setItem(HR_STORAGE_KEY, next ? '1' : '0') } catch { /* noop */ }
      // If flipping off, clear a selected harm-reduction drug so it doesn't
      // stay visible against the user's new preference.
      if (!next && selected?.isHarmReduction) {
        setSelected(null); setQuery('')
      }
      return next
    })
  }

  const phenotypes = useMemo(() => (report ? inferAllPGxPhenotypes(report) : null), [report])
  const rawVariants = useMemo(() => report?._variants || {}, [report])
  const ctx = useMemo(() => ({ ...(phenotypes || {}), rawVariants }), [phenotypes, rawVariants])
  const suggestions = useMemo(() => suggestDrugs(query, 10, { showHarmReduction: showHR }), [query, showHR])
  const guidance = useMemo(
    () => (selected?.guidance && phenotypes) ? selected.guidance(phenotypes) : null,
    [selected, phenotypes],
  )
  const interactionSets = useMemo(
    () => (selected ? personaliseInteractions(selected, ctx) : { personalised: [], general: [] }),
    [selected, ctx],
  )

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
              Search a drug to see CPIC-style pharmacogenomic guidance based on your genome findings —
              for conversations with your prescriber, not a replacement for clinical testing.
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
                          <div className="font-semibold text-ss-text capitalize">{d.name || d.generic}</div>
                          <div className="text-xs text-ss-muted">
                            {d.class}{d.brand?.length > 0 && ` · ${d.brand.join(', ')}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {d.isHarmReduction && (
                            <span className="rounded-full bg-ss-amber/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ss-amber">
                              Harm reduction
                            </span>
                          )}
                          {d.primaryGene && (
                            <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ss-teal">
                              {d.primaryGene}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query && !selected && suggestions.length === 0 && (
                <div className="mt-2 rounded-lg bg-ss-bg/60 p-3 text-xs text-ss-muted">
                  No PGx-linked drug matches &ldquo;{query}&rdquo; in the catalog. This tool covers major CPIC-listed medications only — many common drugs (like acetaminophen or metformin) don&apos;t have actionable pharmacogenomic guidance.
                  {!showHR && (
                    <>
                      {' '}
                      <button
                        onClick={toggleHR}
                        className="underline decoration-dotted underline-offset-2 hover:text-ss-teal"
                      >
                        Enable harm-reduction content
                      </button>{' '}
                      to also search recreational substances.
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Harm-reduction opt-in toggle */}
            <HarmReductionToggle enabled={showHR} onToggle={toggleHR} />

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
            {selected && (
              <DrugCard
                drug={selected}
                guidance={guidance}
                phenotypes={phenotypes}
                interactionSets={interactionSets}
                rawVariants={rawVariants}
              />
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
// Harm-reduction opt-in
// ---------------------------------------------------------------------------

function HarmReductionToggle({ enabled, onToggle }) {
  return (
    <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-ss-border-warm/60 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ss-amber/10 text-ss-amber">
          <HeartHandshake size={16} />
        </span>
        <div>
          <div className="text-sm font-semibold text-ss-text">Show harm-reduction content</div>
          <p className="mt-0.5 text-xs text-ss-muted">
            Off by default. When on, the catalog includes recreational substances
            (alcohol, cannabis, MDMA, LSD, cocaine, meth, opioids, benzos, nicotine).
            Framing is educational, non-endorsing; SAMHSA helpline surfaces on every entry.
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
          enabled ? 'bg-ss-teal' : 'bg-ss-border-warm'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drug result card — three-section layout
// ---------------------------------------------------------------------------

function DrugCard({ drug, guidance, phenotypes, interactionSets, rawVariants }) {
  const sev = guidance ? (SEVERITY_META[guidance.severity] || SEVERITY_META.clear) : null

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ss-border-warm/60">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ss-border-warm/60 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold text-ss-teal">{drug.name || drug.generic}</span>
            {drug.brand?.length > 0 && (
              <span className="text-sm text-ss-muted">({drug.brand.join(', ')})</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ss-muted">
            <span>{drug.class}</span>
            {drug.primaryGene && (
              <>
                <span>·</span>
                <span>Primary gene: <code className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{drug.primaryGene}</code></span>
              </>
            )}
            {drug.isHarmReduction && (
              <>
                <span>·</span>
                <span className="rounded-full bg-ss-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-amber">
                  Harm-reduction content
                </span>
              </>
            )}
          </div>
        </div>
        {sev && (
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${sev.chip}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${sev.dot}`} aria-hidden="true" />
            {sev.label}
          </span>
        )}
      </div>

      <div className="space-y-6 p-5">
        {/* Harm-reduction disclaimer — only for recreational entries */}
        {drug.isHarmReduction && (
          <div className="rounded-lg border-l-4 border-ss-orange bg-ss-orange/10 p-4">
            <div className="flex items-start gap-2">
              <HeartHandshake size={16} className="mt-0.5 flex-shrink-0 text-ss-orange" />
              <p className="text-xs leading-relaxed text-ss-text">
                <span className="font-semibold">Harm reduction, not endorsement.</span>{' '}
                {HARM_REDUCTION_DISCLAIMER}
              </p>
            </div>
          </div>
        )}

        {/* Legacy CPIC guidance headline block (prescription drugs only) */}
        {guidance && (
          <div className="space-y-3">
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
          </div>
        )}

        {/* Section 1 — Your Metabolism Profile (PK genes) */}
        <Section
          Icon={Beaker}
          title="Your metabolism profile"
          subtitle="How your body processes this substance (pharmacokinetic genes)"
        >
          <GeneRoleTable rows={drug.pk_genes} phenotypes={phenotypes} rawVariants={rawVariants} />
        </Section>

        {/* Section 2 — Your Receptor Profile (PD genes) */}
        {drug.pd_genes?.length > 0 && (
          <Section
            Icon={Activity}
            title="Your receptor profile"
            subtitle="How your receptors respond to it (pharmacodynamic genes)"
          >
            <GeneRoleTable rows={drug.pd_genes} phenotypes={phenotypes} rawVariants={rawVariants} />
          </Section>
        )}

        {/* Section 3 — Key interactions for you (personalised) */}
        {(interactionSets.personalised.length > 0 || interactionSets.general.length > 0) && (
          <Section
            Icon={AlertTriangle}
            title="Key interactions for you"
            subtitle="Filtered to variants you actually carry — plus universal clinical cautions"
          >
            {interactionSets.personalised.length > 0 && (
              <div className="space-y-2">
                {interactionSets.personalised.map((it, i) => (
                  <InteractionRow key={i} item={it} />
                ))}
              </div>
            )}
            {interactionSets.general.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ss-muted">
                  Universal cautions (apply to everyone)
                </div>
                <div className="mt-2 space-y-2">
                  {interactionSets.general.map((it, i) => (
                    <InteractionRow key={i} item={it} />
                  ))}
                </div>
              </div>
            )}
            {interactionSets.personalised.length === 0 && interactionSets.general.length === 0 && (
              <p className="text-sm text-ss-muted">
                No genotype-specific interactions surfaced for your current variants — general drug-class cautions still apply.
              </p>
            )}
          </Section>
        )}

        {/* Confidence footer */}
        <div className="flex items-start gap-2 rounded-lg bg-ss-bg/60 p-3 text-xs text-ss-muted">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>Estimated from single-SNP consumer genome data. Clinical PGx testing can resolve full star-allele status.</span>
        </div>

        {/* SAMHSA helpline block for recreational entries */}
        {drug.isHarmReduction && <SamhsaCard />}
      </div>
    </div>
  )
}

function Section({ Icon, title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-start gap-2 border-b border-ss-border-warm/40 pb-2">
        <Icon size={14} className="mt-0.5 flex-shrink-0 text-ss-teal" />
        <div>
          <div className="text-sm font-bold text-ss-text">{title}</div>
          <div className="text-[11px] text-ss-muted">{subtitle}</div>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function GeneRoleTable({ rows, phenotypes, rawVariants }) {
  if (!rows?.length) {
    return <p className="text-xs text-ss-muted">No linked genes recorded for this substance.</p>
  }
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => {
        const ph = phenotypes?.[r.gene]
        const gt = r.rsid ? rawVariants?.[r.rsid] : null
        return (
          <li key={i} className="rounded-lg bg-ss-bg/40 p-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded bg-ss-teal/10 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ss-teal">
                {r.gene}
              </span>
              {r.rsid && (
                <code className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-ss-muted">{r.rsid}</code>
              )}
              {gt && (
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ss-text">
                  Your call: {gt}
                </span>
              )}
              {ph?.label && !gt && (
                <span className="text-[11px] font-semibold text-ss-teal">Your phenotype: {ph.label}</span>
              )}
              {ph?.label && gt && (
                <span className="text-[11px] font-semibold text-ss-teal">→ {ph.label}</span>
              )}
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ss-text">{r.role}</p>
          </li>
        )
      })}
    </ul>
  )
}

function InteractionRow({ item }) {
  const sev = SEVERITY_META[item.severity] || SEVERITY_META.informational
  return (
    <div className={`flex items-start gap-2 rounded-lg p-3 ${sev.chip}`}>
      <span className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${sev.dot}`} aria-hidden="true" />
      <div className="flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider">{sev.label}</div>
        <p className="mt-0.5 text-[12px] leading-relaxed">{item.text}</p>
      </div>
    </div>
  )
}

function SamhsaCard() {
  return (
    <div className="rounded-lg bg-ss-teal/5 p-4 ring-1 ring-ss-teal/20">
      <div className="flex items-start gap-2">
        <Phone size={16} className="mt-0.5 flex-shrink-0 text-ss-teal" />
        <div>
          <div className="text-sm font-bold text-ss-teal">SAMHSA National Helpline</div>
          <p className="mt-1 text-xs leading-relaxed text-ss-text">
            {SAMHSA_HELPLINE.text}
          </p>
          <a
            href={SAMHSA_HELPLINE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal underline decoration-dotted underline-offset-2 hover:text-ss-teal/80"
          >
            samhsa.gov/find-help/national-helpline <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PGx phenotype snapshot (bottom of page)
// ---------------------------------------------------------------------------

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
      <p className="mt-1 text-xs text-ss-muted">Estimated from your genome file. Click any gene to see prescription drugs affected by it.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ gene, ph }) => {
          const drugsAffected = DRUG_CATALOG.filter((d) =>
            !d.isHarmReduction && (d.primaryGene === gene || d.extraGenes?.includes(gene))
          )
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
