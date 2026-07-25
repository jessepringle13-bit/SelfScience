'use client'

// /app/components/genome/PopulationIntelligencePanel.jsx
// The 6-section 'Population Intelligence' block that gets appended to
// the existing /population-compare page. Adds:
//   1. Rarity Profile (dot plot)
//   2. Variant by Variant table
//   3. Combination uniqueness
//   4. Ancestry Frequency Explorer (dropdown + chart)
//   5. What Makes You Distinctive (rarest 3 cards)
//   6. FAQ accordion
//
// Also renders the top disclaimer banner + Print button. All existing
// Highlights / Bar Chart / Heatmap views on the page remain untouched.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Printer, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import { flattenReportCards } from '@/lib/supplementProtocol'
import {
  ANCESTRY_LABELS, getAncestryData, globalFrequencyPercent, rarityTier,
  rarityStatement, shortRarityWord, combinationProbability, formatOneIn, RARITY_META,
} from '@/lib/ancestryFrequencies'
import ShareToCommunityButton from '@/components/community/ShareToCommunityButton'

const RARITY_COLORS = { rare: '#964219', moderate: '#1B474D', common: '#2E7D32' }

export default function PopulationIntelligencePanel({ report }) {
  const cards = useMemo(() => (report ? flattenReportCards(report) : []), [report])
  const enriched = useMemo(() => {
    return cards.map((c) => {
      const pct = globalFrequencyPercent(c)
      return { card: c, pct, tier: pct == null ? null : rarityTier(pct) }
    }).filter((x) => x.pct != null)
  }, [cards])

  const summary = useMemo(() => {
    const s = { rare: 0, moderate: 0, common: 0 }
    for (const e of enriched) s[e.tier] = (s[e.tier] || 0) + 1
    return s
  }, [enriched])

  const top15 = useMemo(() => enriched.slice().sort((a, b) => a.pct - b.pct).slice(0, 15), [enriched])

  const rarest3 = useMemo(() => enriched.slice().sort((a, b) => a.pct - b.pct).slice(0, 3), [enriched])

  const [sortMode, setSortMode] = useState('rarity')

  const sortedTable = useMemo(() => {
    const arr = top15.slice()
    if (sortMode === 'pillar') arr.sort((a, b) => String(a.card.pillar || '').localeCompare(String(b.card.pillar || '')))
    else if (sortMode === 'name') arr.sort((a, b) => String(a.card.name || '').localeCompare(String(b.card.name || '')))
    // 'rarity' is default
    return arr
  }, [top15, sortMode])

  const explorerOptions = useMemo(() => enriched.filter((e) => getAncestryData(e.card.rsid)), [enriched])
  const [explorerId, setExplorerId] = useState(explorerOptions[0]?.card?.rsid || '')
  const explorerRow = explorerOptions.find((e) => e.card.rsid === explorerId) || explorerOptions[0]
  const explorerData = explorerRow ? getAncestryData(explorerRow.card.rsid) : null

  const combo = useMemo(() => combinationProbability(enriched.map((e) => e.card)), [enriched])

  const summaryLine = (() => {
    const n = summary.rare
    if (n === 0) return 'Your profile is largely typical for the global population.'
    if (n <= 2) return `${n} of your variants are less common, giving your profile some distinctive characteristics.`
    if (n <= 5) return `${n} of your variants are uncommon, meaning your genetic profile has meaningful differences from the average.`
    return `You carry a notably distinctive set of variants — your genome profile differs from the global average in several ways.`
  })()

  if (!report) return null

  return (
    <div className="popint-container">
      {/* Scoped print CSS — hides interactive scaffolding on print. */}
      <style jsx global>{`
        @media print {
          @page { margin: 15mm; }
          header, nav, footer, .no-print { display: none !important; }
          [aria-label="Add journal entry"], [aria-labelledby="journey-guide-heading"] { display: none !important; }
          .popint-dot-plot { display: none !important; }
          .popint-print-only { display: block !important; }
          .popint-section { break-inside: avoid; }
          .popint-faq details { display: block !important; }
          .popint-faq summary { pointer-events: none; }
          .popint-faq [data-faq-body] { display: block !important; }
        }
        .popint-print-only { display: none; }
      `}</style>

      {/* Top disclaimer + Print button */}
      <div className="flex flex-wrap items-start justify-between gap-3 pt-8">
        <div
          className="flex-1 rounded-xl border-l-[3px] p-3"
          style={{ backgroundColor: 'rgba(207,144,24,0.07)', borderLeftColor: '#CF9018' }}
        >
          <p className="text-[0.85rem] text-ss-muted">
            Population frequency data is from gnomAD v3.1.2 and is for educational context only. These statistics reflect research population groups and should not be used for individual ancestry determination or clinical decisions.
          </p>
        </div>
        <button type="button" onClick={() => window.print()} className="no-print inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ss-teal-dark">
          <Printer size={13} /> Print population report
        </button>
      </div>

      <div className="mt-6 space-y-14">
        {/* ============= SECTION 1 — RARITY PROFILE ============= */}
        <Section eyebrow="Section 1" title="Your Rarity Profile" subtitle="How common or rare are your variants compared to the global population?">
          <DotPlot data={enriched} />
          <div className="popint-print-only mt-2 space-y-1 text-sm text-ss-text">
            <div>Rare (under 15%): <b>{summary.rare}</b></div>
            <div>Moderate (15–50%): <b>{summary.moderate}</b></div>
            <div>Common (over 50%): <b>{summary.common}</b></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <SummaryStat n={summary.rare}     label="rare"     colorHex="#964219" />
            <SummaryStat n={summary.moderate} label="moderate" colorHex="#1B474D" />
            <SummaryStat n={summary.common}   label="common"   colorHex="#2E7D32" />
          </div>
          <p className="mt-4 text-sm text-ss-text">
            Your genome includes <span className="font-semibold text-ss-amber">{summary.rare}</span> rare variants — {summaryLine}
          </p>
        </Section>

        {/* ============= SECTION 2 — VARIANT BY VARIANT ============= */}
        <Section eyebrow="Section 2" title="Variant by Variant" subtitle="Your top findings compared to global and ancestry-grouped frequencies.">
          <div className="no-print mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.14em' }}>Sort:</span>
            <SortChip active={sortMode === 'rarity'} onClick={() => setSortMode('rarity')} label="Rarest first" />
            <SortChip active={sortMode === 'pillar'} onClick={() => setSortMode('pillar')} label="By pillar" />
            <SortChip active={sortMode === 'name'}   onClick={() => setSortMode('name')}   label="A–Z" />
          </div>
          <ul className="space-y-2">
            {sortedTable.map(({ card, pct, tier }) => <VariantRow key={card.rsid || card.gene} card={card} pct={pct} tier={tier} />)}
          </ul>
        </Section>

        {/* ============= SECTION 3 — UNIQUE COMBINATION ============= */}
        <Section eyebrow="Section 3" title="Your Unique Combination" subtitle="The combination of variants you carry is statistically very rare — even if each individual variant is common.">
          <div className="rounded-2xl p-5 md:p-6" style={{ backgroundColor: 'rgba(14,122,110,0.04)' }}>
            <p className="text-[0.93rem] leading-[1.7] text-ss-text">
              If you carry 10 variants each present in 30% of people, the probability of carrying all 10 together is 0.30¹⁰ — less than 0.000006%. Your exact genetic combination is effectively unique to you.
            </p>
            <p className="mt-3 text-[0.93rem] leading-[1.7] text-ss-text">
              This is why population averages can only tell you so much. The research shows what each variant does in isolation. What SelfScience does is show you what your specific combination means for your individual biology.
            </p>
          </div>
          {combo ? (
            <div className="mt-6 text-center">
              <div className="font-mono text-[12px] text-ss-muted">1 in</div>
              <div className="mt-1 text-[2rem] font-extrabold text-ss-teal">{formatOneIn(combo.oneIn)}</div>
              <div className="mt-1 font-mono text-[10px] text-ss-muted">people share your exact variant combination</div>
              <p className="mx-auto mt-3 max-w-lg text-[0.8rem] italic text-ss-muted">
                This is an educational estimate based on independent variant frequencies. Actual probability differs due to linkage disequilibrium and population structure.
              </p>
            </div>
          ) : null}
        </Section>

        {/* ============= SECTION 4 — ANCESTRY EXPLORER ============= */}
        <Section eyebrow="Section 4" title="Frequency Across Populations" subtitle="Select any of your findings to see how its frequency varies across global populations.">
          {explorerOptions.length ? (
            <>
              <div className="no-print">
                <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>Choose a finding to explore</label>
                <select value={explorerId} onChange={(e) => setExplorerId(e.target.value)}
                  className="w-full max-w-md rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20">
                  {explorerOptions.map(({ card }) => (
                    <option key={card.rsid} value={card.rsid}>{card.name || card.gene} — {card.gene}</option>
                  ))}
                </select>
              </div>
              {explorerRow && explorerData && (
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60 md:p-5">
                  <h3 className="text-base font-extrabold text-ss-text">{explorerRow.card.name || explorerRow.card.gene}</h3>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ss-border-warm/40">
                    <div className="h-full rounded-full bg-ss-teal" style={{ width: `${Math.min(100, explorerData.global)}%` }} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-ss-muted">{explorerData.global}% globally</div>
                  <p className="mt-2 text-[13px] text-ss-text">{rarityStatement(explorerData.global)}</p>
                  <ul className="mt-4 space-y-1.5">
                    {ANCESTRY_LABELS.map(({ key, label }) => (
                      <li key={key} className="flex items-center gap-2">
                        <span className="w-[160px] flex-shrink-0 font-mono text-[10px] text-ss-text md:w-[180px]">{label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ss-border-warm/40">
                          <div className="h-full rounded-full bg-ss-teal" style={{ width: `${Math.min(100, explorerData[key] ?? 0)}%` }} />
                        </div>
                        <span className="w-10 text-right font-mono text-[10px] text-ss-muted">{explorerData[key] ?? 0}%</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[0.85rem] italic text-ss-muted">
                    Frequency differences across populations reflect evolutionary history, migration patterns, and genetic drift — not differences in health outcomes or capability. A variant common in one population is not inherently better or worse than one that is rare.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-ss-border-warm bg-white/60 p-4 text-sm text-ss-muted">
              Detailed ancestry breakdown available for our priority variants once you upload a matching genome.
            </p>
          )}
        </Section>

        {/* ============= SECTION 5 — WHAT MAKES YOU DISTINCTIVE ============= */}
        <Section eyebrow="Section 5" title="What Makes You Distinctive" subtitle="Your most unusual genetic characteristics based on global frequency data.">
          {enriched.length && rarest3.every(({ pct }) => pct > 50) ? (
            <div className="rounded-2xl border border-ss-teal/40 p-5 md:p-6" style={{ backgroundColor: 'rgba(46,158,107,0.04)' }}>
              <p className="text-[0.93rem] text-ss-text">
                Your variants are all relatively common in the global population. This means your genetic profile is broadly typical — which is itself a meaningful finding.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {rarest3.map(({ card, pct }) => <DistinctiveCard key={card.rsid || card.gene} card={card} pct={pct} />)}
            </div>
          )}

          {/* Share to community (opted-in only) */}
          <div className="no-print mt-4">
            <ShareToCommunityButton
              initialText={rarest3[0]
                ? `I just explored my population genetics profile on SelfScience. My rarest variant appears in only ${rarest3[0].pct}% of people globally. Fascinating to see where your genome sits in the bigger picture.`
                : `I just explored my population genetics profile on SelfScience. Fascinating to see where your genome sits in the bigger picture.`}
              pillar={'Genomics'}
              label="Share your rarity profile with the community"
            />
          </div>
        </Section>

        {/* ============= SECTION 6 — FAQ ============= */}
        <Section eyebrow="Learn" title="Understanding Population Genetics">
          <ul className="popint-faq space-y-2">
            {FAQ.map((qa, i) => <FAQItem key={i} q={qa.q} a={qa.a} />)}
          </ul>
        </Section>
      </div>
    </div>
  )
}

/* ============================ Sub-components ============================ */

function Section({ eyebrow, title, subtitle, children }) {
  return (
    <section className="popint-section">
      <div className="mb-4">
        <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>{eyebrow}</div>
        <h2 className="mt-1 text-[1.4rem] font-extrabold text-ss-text">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ss-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function SummaryStat({ n, label, colorHex }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60 text-center">
      <div className="text-[1.8rem] font-extrabold leading-none" style={{ color: colorHex }}>{n}</div>
      <div className="mt-1 font-mono text-[10px] uppercase text-ss-muted" style={{ letterSpacing: '0.14em' }}>{label} variants</div>
    </div>
  )
}

function SortChip({ active, onClick, label }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${active ? 'border-ss-teal bg-ss-teal text-white' : 'border-ss-border-warm text-ss-muted hover:border-ss-teal/40'}`}
    >
      {label}
    </button>
  )
}

/* Simple SVG dot plot: X-axis = global frequency percentage. */
function DotPlot({ data }) {
  const w = 100, h = 22, padX = 3, padY = 2
  const drawableW = w - padX * 2
  const xFor = (p) => padX + (p / 100) * drawableW
  // jitter deterministically by rsid hash
  const hash = (s) => { let x = 0; for (let i = 0; i < (s || '').length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return Math.abs(x) }
  return (
    <div className="popint-dot-plot rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-32 w-full">
        {/* axis line */}
        <line x1={padX} x2={w - padX} y1={h - 3} y2={h - 3} stroke="#D4D1CA" strokeWidth={0.15} />
        {[0, 25, 50, 75, 100].map((p) => (
          <g key={p}>
            <line x1={xFor(p)} x2={xFor(p)} y1={h - 3} y2={h - 4} stroke="#D4D1CA" strokeWidth={0.15} />
            <text x={xFor(p)} y={h - 0.4} textAnchor="middle" fontSize="1.5" fill="#7A7974" fontFamily="Inter">{p}%</text>
          </g>
        ))}
        {data.map(({ card, pct, tier }) => {
          const y = padY + (hash(card.rsid || card.gene || '') % (h - padY * 2 - 4))
          return (
            <circle key={card.rsid || card.gene}
              cx={xFor(pct)} cy={y} r={0.9}
              fill={RARITY_COLORS[tier] || '#7A7974'}
            >
              <title>{card.name || card.gene} — {pct}% ({tier})</title>
            </circle>
          )
        })}
      </svg>
    </div>
  )
}

function VariantRow({ card, pct, tier }) {
  const meta = RARITY_META[tier] || RARITY_META.unknown
  return (
    <li className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-ss-border-warm/60 md:flex md:items-center md:gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[0.9rem] font-semibold text-ss-text">{card.name || card.gene}</div>
        {card.pillar && <span className="mt-1 inline-block rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">{card.pillar}</span>}
      </div>
      <div className="mt-2 md:mt-0 md:w-24">
        <span className="font-mono text-[11px] text-ss-teal">{card.genotype || ''}</span>
      </div>
      <div className="mt-2 md:mt-0 md:w-40">
        <div className="h-2 w-full overflow-hidden rounded-full bg-ss-border-warm/40">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: '#1B474D' }} />
        </div>
        <div className="mt-0.5 font-mono text-[9px] text-ss-muted">{pct}%</div>
      </div>
      <div className="mt-2 flex items-center justify-between md:mt-0 md:w-40 md:justify-end md:gap-3">
        <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white" style={{ backgroundColor: meta.colorHex, letterSpacing: '0.14em' }}>{meta.label}</span>
        <span className="font-mono text-[10px] text-ss-muted">{shortRarityWord(pct)}</span>
      </div>
    </li>
  )
}

function DistinctiveCard({ card, pct }) {
  const query = encodeURIComponent(card.name || card.gene || '')
  return (
    <div className="rounded-2xl border border-ss-teal/40 bg-white p-5 shadow-sm">
      <span className="inline-flex rounded-full bg-ss-amber px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white" style={{ letterSpacing: '0.14em' }}>Rarer than most</span>
      <h3 className="mt-2 text-[1.1rem] font-extrabold text-ss-teal">{card.name || card.gene}</h3>
      {card.pillar && <span className="mt-1 inline-block rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">{card.pillar}</span>}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[2rem] font-extrabold leading-none text-ss-teal">{pct}%</span>
        <span className="font-mono text-[10px] text-ss-muted">of people</span>
      </div>
      <p className="mt-2 text-sm text-ss-text">Fewer than {pct} in 100 people carry this — it is one of the most distinctive aspects of your genetic profile.</p>
      <Link href={`/search?q=${query}`} className="no-print mt-3 inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
        Learn more →
      </Link>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl border border-ss-border-warm/60 bg-white">
      <details open={open} onToggle={(e) => setOpen(e.target.open)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-semibold text-ss-text">{q}</span>
          {open ? <ChevronUp size={13} className="text-ss-muted" /> : <ChevronDown size={13} className="text-ss-muted" />}
        </summary>
        <div data-faq-body className="border-t border-ss-border-warm/60 px-4 py-3 text-[13.5px] leading-relaxed text-ss-text">{a}</div>
      </details>
    </li>
  )
}

const FAQ = [
  { q: 'What does variant frequency actually mean?',
    a: 'Frequency tells you how often a particular version of a gene appears in a studied population. A frequency of 30% means roughly 3 in 10 people in that population carry that version. It says nothing about whether the variant is good or bad — only how common it is.' },
  { q: 'Why do frequencies differ between populations?',
    a: 'Genetic variants spread through populations over thousands of years via migration, reproduction, and random genetic drift. Some variants became more common in specific geographic regions due to evolutionary advantage in those environments, founder effects when small groups established new populations, or simply chance. These differences reflect human history — not differences in health, intelligence, or capability between groups.' },
  { q: 'Can frequency data tell me about my ancestry?',
    a: 'Not reliably at the individual level. While some variants are more common in certain populations, carrying a variant that is frequent in one group does not mean you have ancestry from that group. Ancestry determination requires whole-genome analysis across thousands of markers with specialized pipelines — not single-variant frequency comparisons. The data here is for educational context only.' },
  { q: 'Why does my combination matter more than individual frequencies?',
    a: 'Each variant frequency describes a single position in isolation. But your health is shaped by how thousands of variants interact with each other and with your environment. A variant that is harmless in one genetic context may be more significant alongside other specific variants. This is why personalized genomics — looking at your specific combination — is more meaningful than population averages alone.' },
]
