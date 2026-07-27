'use client'

// /app/app/export/page.js
// PDF Export center. Available to every tier. Users pick which
// sections to include; anything gated by an entitlement they don't
// have shows as disabled with a "PRO" chip. Export uses the browser's
// print dialog against a dedicated print stylesheet declared inline
// so no extra deps are required.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Printer, Lock, ArrowLeft, CheckSquare, Square, Sparkles } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { useTierState, useEntitlements } from '@/lib/tierState'
import { hasGenomeResults, getGenomeResults } from '@/lib/genomeSession'

// Section catalogue. `entitlement` maps to /lib/tierState entitlements
// map; if the user doesn't have it, the checkbox is disabled and gets
// a "Pro" chip.
const SECTIONS = [
  { id: 'summary',       label: 'Overview & summary',     desc: 'Your name-free summary of key findings.',                 entitlement: 'readFindings',    always: true },
  { id: 'findings',      label: 'All findings',           desc: 'Every variant, classification, and plain-English note.', entitlement: 'readFindings' },
  { id: 'insights',      label: 'My Insights ladder',     desc: 'Know now → connected concepts → unknowns → next steps.', entitlement: 'readFindings' },
  { id: 'protocol',      label: 'Protocol recommendations', desc: 'Supplement + lifestyle picks tied to your variants.',   entitlement: 'protocol' },
  { id: 'deep-research', label: 'Deep Research Reports',  desc: 'Pillar-level dossiers with methodology & citations.',    entitlement: 'deepResearch' },
  { id: 'family',        label: 'Family Comparison map',  desc: 'Side-by-side variant map for uploaded relatives.',       entitlement: 'familyComparison' },
  { id: 'ai-coach',      label: 'AI Coach chat history',  desc: 'Your recent AI Coach questions & cited sources.',        entitlement: 'aiCoach' },
]

export default function ExportPage() {
  const state = useTierState()
  const ent = useEntitlements()
  const [selected, setSelected] = useState(() => new Set(['summary', 'findings', 'insights']))
  const [genomeLoaded, setGenomeLoaded] = useState(false)
  const [genome, setGenome] = useState(null)

  useEffect(() => {
    const load = () => {
      const ok = hasGenomeResults()
      setGenomeLoaded(ok)
      setGenome(ok ? getGenomeResults() : null)
    }
    load()
    window.addEventListener('selfscience:genome-changed', load)
    return () => window.removeEventListener('selfscience:genome-changed', load)
  }, [])

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const availableSections = useMemo(
    () => SECTIONS.filter((s) => ent[s.entitlement]),
    [ent]
  )

  const handlePrint = () => {
    // Give React a moment to update state, then invoke the browser's
    // print dialog. Print styles below hide everything except
    // `.ss-print-area`.
    setTimeout(() => { try { window.print() } catch {} }, 50)
  }

  const findings = genome?.variants_recognized || []
  const strengths = findings.filter((v) => v?.classification === 'strength')
  const aware     = findings.filter((v) => v?.classification === 'aware')

  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container max-w-3xl pt-24 pb-16">
        <Link href="/" className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ss-muted hover:text-ss-text ss-hide-in-print">
          <ArrowLeft size={11} /> Back to Dashboard
        </Link>

        <div className="mt-4 flex items-start gap-3 ss-hide-in-print">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
            <Printer size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-ss-text md:text-3xl">Export as PDF</h1>
            <p className="text-[13.5px] text-ss-muted">
              Pick the sections you want in your PDF. Anything not unlocked on your account stays out of the export.
            </p>
          </div>
        </div>

        {/* SECTION PICKER */}
        <section className="mt-8 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-5 ss-hide-in-print">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">Choose sections</div>
          <ul className="mt-3 space-y-2">
            {SECTIONS.map((s) => {
              const unlocked = !!ent[s.entitlement]
              const isChecked = selected.has(s.id) && unlocked
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && toggle(s.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      unlocked
                        ? isChecked
                          ? 'border-ss-orange/60 bg-ss-orange/[0.06] hover:border-ss-orange'
                          : 'border-ss-border-warm/60 bg-ss-canvas/30 hover:border-ss-orange/50'
                        : 'cursor-not-allowed border-ss-border-warm/40 bg-ss-canvas/20 opacity-70'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                      unlocked && isChecked ? 'text-ss-orange' : 'text-ss-muted'
                    }`}>
                      {unlocked
                        ? (isChecked ? <CheckSquare size={17} /> : <Square size={17} />)
                        : <Lock size={13} />
                      }
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-bold text-ss-text">{s.label}</span>
                        {!unlocked && (
                          <span className="inline-flex items-center rounded-full bg-ss-orange px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-widest text-white">
                            Pro
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-ss-muted">{s.desc}</span>
                      {!unlocked && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-ss-orange">
                          Unlock with SelfScience Pro <Sparkles size={10} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[12.5px] text-ss-muted">
              <span className="font-mono font-bold text-ss-text">{selected.size}</span> of <span className="font-mono">{availableSections.length}</span> available sections selected
            </div>
            <button
              type="button"
              onClick={handlePrint}
              disabled={selected.size === 0}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition ${
                selected.size === 0
                  ? 'cursor-not-allowed bg-ss-muted/30 text-ss-muted'
                  : 'ss-glow-orange-btn bg-ss-orange text-white hover:bg-ss-orange-dark'
              }`}
            >
              <Printer size={14} /> Export {selected.size} section{selected.size === 1 ? '' : 's'}
            </button>
          </div>
          <p className="mt-3 text-[11.5px] text-ss-muted">
            Tip — in the print dialog, choose &ldquo;Save as PDF&rdquo; as the destination.
          </p>
        </section>

        {/* Non-Pro users: gentle upsell */}
        {state.tier < 3 && (
          <section className="mt-6 rounded-2xl border border-ss-orange/30 bg-ss-orange/[0.05] p-5 ss-hide-in-print">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="mt-1 shrink-0 text-ss-orange" />
              <div>
                <div className="text-[13.5px] font-bold text-ss-text">Want to include the Pro sections?</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ss-muted">
                  Deep Research Reports, Family Comparison maps, and AI Coach transcripts unlock with SelfScience Pro.
                </p>
                <Link href="/pro" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-ss-orange hover:text-ss-orange-dark">
                  Explore Pro &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
             PRINTABLE AREA. Everything inside .ss-print-area is what
             the browser will render into the PDF. The .ss-hide-in-print
             utility handles hiding the chrome/UI.
             ============================================================ */}
        <div className="ss-print-area mt-8">
          {/* Print header */}
          <header className="mb-6 border-b border-ss-border-warm/50 pb-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">SelfScience Export</div>
            <h1 className="mt-1 text-2xl font-extrabold text-ss-text">Your Genome Report</h1>
            <div className="mt-1 font-mono text-[11px] text-ss-muted">
              Generated {new Date().toLocaleString()} · Tier {state.tier}
            </div>
          </header>

          {selected.has('summary') && ent.readFindings && (
            <section className="mb-6">
              <h2 className="text-lg font-extrabold text-ss-text">Overview</h2>
              {genomeLoaded ? (
                <ul className="mt-2 space-y-1 text-[13.5px] text-ss-text">
                  <li>Total variants recognised: <span className="font-mono font-bold">{findings.length}</span></li>
                  <li>Strengths: <span className="font-mono font-bold">{strengths.length}</span></li>
                  <li>Areas to be aware of: <span className="font-mono font-bold">{aware.length}</span></li>
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-ss-muted">No genome uploaded yet. Upload a file to include personal findings in the export.</p>
              )}
            </section>
          )}

          {selected.has('findings') && ent.readFindings && (
            <section className="mb-6">
              <h2 className="text-lg font-extrabold text-ss-text">All findings</h2>
              {findings.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {findings.slice(0, 200).map((v, i) => (
                    <li key={i} className="border-l-2 border-ss-orange/40 pl-3">
                      <div className="text-[13.5px] font-bold text-ss-text">
                        {v?.gene || v?.geneSymbol || 'Gene'}
                        {v?.rsid ? <span className="ml-2 font-mono text-[11px] text-ss-muted">· {v.rsid}</span> : null}
                      </div>
                      {v?.plainSummary || v?.description ? (
                        <div className="text-[12.5px] text-ss-muted">{v.plainSummary || v.description}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-ss-muted">No findings available.</p>
              )}
            </section>
          )}

          {selected.has('insights') && ent.readFindings && (
            <section className="mb-6">
              <h2 className="text-lg font-extrabold text-ss-text">My Insights ladder</h2>
              <p className="mt-2 text-[13px] text-ss-muted">
                Know now → Connected concepts → Unknowns → Next best step → Explore deeper. Visit My Insights in-app for the live view.
              </p>
            </section>
          )}

          {selected.has('protocol') && ent.protocol && (
            <section className="mb-6">
              <h2 className="text-lg font-extrabold text-ss-text">Protocol recommendations</h2>
              <p className="mt-2 text-[13px] text-ss-muted">
                Your active supplement + lifestyle picks tied to your variants. Full list available in the Genome tab.
              </p>
            </section>
          )}

          {/* Pro-only sections are intentionally omitted for non-entitled
              users \u2014 they can't be selected in the picker either. */}
          {selected.has('deep-research') && ent.deepResearch && (
            <section className="mb-6">
              <h2 className="text-lg font-extrabold text-ss-text">Deep Research Reports</h2>
              <p className="mt-2 text-[13px] text-ss-muted">
                Long-form dossiers per pillar. See /pro/deep-research for the full library once shipped.
              </p>
            </section>
          )}
          {selected.has('family') && ent.familyComparison && (
            <section className="mb-6">
              <h2 className="text-lg font-extrabold text-ss-text">Family Comparison map</h2>
              <p className="mt-2 text-[13px] text-ss-muted">
                Side-by-side variant map for genomes uploaded via Family Comparison.
              </p>
            </section>
          )}
          {selected.has('ai-coach') && ent.aiCoach && (
            <section className="mb-6">
              <h2 className="text-lg font-extrabold text-ss-text">AI Coach transcript</h2>
              <p className="mt-2 text-[13px] text-ss-muted">
                Your recent AI Coach questions and the cited studies behind each answer.
              </p>
            </section>
          )}

          <footer className="mt-8 border-t border-ss-border-warm/50 pt-3 font-mono text-[10px] text-ss-muted">
            Generated by SelfScience · Data stays on your device · Not medical advice.
          </footer>
        </div>
      </main>

      {/* Print-only stylesheet. Injected via a plain <style> tag so we
          don't have to touch globals.css and can keep the print rules
          scoped to this route. */}
      <style jsx global>{`
        @media screen {
          .ss-print-area { display: none; }
        }
        @media print {
          body { background: #ffffff !important; color: #111 !important; }
          .ss-hide-in-print, header[class*="fixed"], nav, .ss-mobile-nav { display: none !important; }
          main.container { max-width: 100% !important; padding: 0 !important; }
          .ss-print-area { display: block !important; color: #111 !important; }
          .ss-print-area * { color: #111 !important; }
          .ss-print-area .text-ss-muted { color: #444 !important; }
          .ss-print-area .text-ss-orange { color: #C45820 !important; }
        }
      `}</style>
    </div>
  )
}
