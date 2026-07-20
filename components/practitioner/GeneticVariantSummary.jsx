// /app/components/practitioner/GeneticVariantSummary.jsx
// Print section — Genetic variant summary. Composes the awareness /
// strengths / neutral tables + PGx phenotype snapshot into a single
// printable section with page breaks.
//
// Slice 3A adds:
//   * Clinical-priority sort + red/amber left-border on Section 3A rows
//   * Green/Amber/Red left-border on Section 3C PGx phenotype rows
//   * One-line legends beneath each of those subheaders

import {
  sortAwarenessByPriority,
  getPGxPhenotypePriority,
  PRIORITY_BORDER_CLASS,
} from '@/lib/clinicalPriority'

export default function GeneticVariantSummary({
  areas = [],
  strengths = [],
  neutrals = [],
  phenotypes,
  rawVariants,
  rawRows,
  includeRawAppendix,
  sectionNum = 3,
}) {
  // Sort Section 3A by clinical priority: urgent → important → standard.
  // Each returned row carries a `_priority` field the FindingTable reads
  // to paint the left-border indicator.
  const sortedAreas = sortAwarenessByPriority(areas, phenotypes)

  return (
    <section className="page-break-before mt-8 print:mt-0 print:pt-8">
      <div className="border-b border-ss-teal/40 pb-2 avoid-break">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-orange">
          Section {sectionNum}
        </div>
        <h2 className="mt-1 text-lg font-extrabold text-ss-teal">Genetic variant summary</h2>
        <p className="mt-1 text-[11px] italic text-ss-muted">
          Derived from consumer-grade SNP data. Every row cites the rsID and the raw two-base call so a practitioner can independently verify against a clinical panel.
        </p>
      </div>

      {/* Awareness */}
      <div className="mt-4 avoid-break">
        <SubHeader>{sectionNum}a · Awareness findings</SubHeader>
        <p className="mt-0.5 text-[10.5px] italic text-ss-muted">
          Variants flagged for provider discussion — none are diagnoses.
        </p>
        {/* Slice 3A legend */}
        <PriorityLegend />
        {sortedAreas.length === 0
          ? <EmptyRow>No awareness findings.</EmptyRow>
          : <FindingTable items={sortedAreas} usePriority />}
      </div>

      {/* Strengths */}
      <div className="mt-6 avoid-break">
        <SubHeader>{sectionNum}b · Strengths</SubHeader>
        <p className="mt-0.5 text-[10.5px] italic text-ss-muted">
          Variants associated with favorable research signals.
        </p>
        {strengths.length === 0 ? <EmptyRow>No strength findings.</EmptyRow> : <FindingTable items={strengths} />}
      </div>

      {/* PGx phenotype snapshot */}
      <div className="mt-6 avoid-break">
        <SubHeader>{sectionNum}c · Estimated pharmacogenomic phenotypes</SubHeader>
        <p className="mt-0.5 text-[10.5px] italic text-ss-muted">
          Single-SNP inference — <span className="font-semibold">confirm star-allele status with a clinical PGx test</span> before any dosing decision.
        </p>
        {/* Slice 3A PGx legend */}
        <PGxPhenotypeLegend />
        {phenotypes ? <PGxTable phenotypes={phenotypes} rawVariants={rawVariants} /> : <EmptyRow>No PGx data.</EmptyRow>}
      </div>

      {/* Neutral additional findings */}
      {neutrals.length > 0 && (
        <div className="mt-6 avoid-break">
          <SubHeader>{sectionNum}d · Additional recognised variants (neutral)</SubHeader>
          <p className="mt-0.5 text-[10.5px] italic text-ss-muted">
            Included for completeness — no research-associated favorable or unfavorable interpretation applies to these genotypes.
          </p>
          <FindingTable items={neutrals} compact />
        </div>
      )}

      {/* Raw appendix — optional (long) */}
      {includeRawAppendix && rawRows?.length > 0 && (
        <div className="page-break-before mt-6 print:mt-0 print:pt-8">
          <SubHeader>{sectionNum}e · Raw genotype appendix</SubHeader>
          <p className="mt-0.5 text-[10.5px] italic text-ss-muted">
            Full list of rsIDs SelfScience recognised in the uploaded file and the raw two-base call at each.
          </p>
          <RawAppendix rows={rawRows} />
        </div>
      )}
    </section>
  )
}

function SubHeader({ children }) {
  return (
    <h3 className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">
      {children}
    </h3>
  )
}

function EmptyRow({ children }) {
  return (
    <div className="mt-2 rounded border border-dashed border-ss-border-warm/70 p-2 text-center text-[11px] italic text-ss-muted">
      {children}
    </div>
  )
}

// One-line legend printed under Section 3A. Print-safe (uses solid
// coloured squares that render on B&W printers as gradients rather than
// disappearing altogether).
function PriorityLegend() {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-ss-muted">
      <LegendDot color="bg-ss-red" label="Urgent — discuss before prescribing" />
      <span className="text-ss-border-warm">·</span>
      <LegendDot color="bg-ss-amber" label="Important — note for dosing" />
      <span className="text-ss-border-warm">·</span>
      <LegendDot color="bg-ss-border-warm" label="Standard — for awareness" />
    </div>
  )
}

// One-line legend printed under Section 3C.
function PGxPhenotypeLegend() {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-ss-muted">
      <LegendDot color="bg-ss-green" label="Normal / extensive / rapid metabolizer" />
      <span className="text-ss-border-warm">·</span>
      <LegendDot color="bg-ss-amber" label="Intermediate metabolizer" />
      <span className="text-ss-border-warm">·</span>
      <LegendDot color="bg-ss-red" label="Poor / reduced / deficient" />
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

function FindingTable({ items, compact = false, usePriority = false }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b-2 border-ss-teal/30 text-[9px] uppercase tracking-wider text-ss-muted">
            <th className="py-1 pr-2 font-semibold">Gene / trait</th>
            <th className="py-1 pr-2 font-semibold">rsID</th>
            <th className="py-1 pr-2 font-semibold">Genotype</th>
            {!compact && <th className="py-1 pr-2 font-semibold">Note</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((c, i) => {
            const border = usePriority ? PRIORITY_BORDER_CLASS[c._priority] || '' : ''
            return (
              <tr
                key={(c.rsid || '') + i}
                className={`border-b border-ss-border-warm/30 align-top last:border-0 ${border}`}
              >
                <td className="py-1 pl-2 pr-2">
                  <div className="font-semibold text-ss-text">{c.name || c.gene || c.rsid}</div>
                  {c.trait && !compact && <div className="text-[10px] text-ss-muted">{c.trait}</div>}
                </td>
                <td className="py-1 pr-2 font-mono text-[10.5px]">{c.rsid || '—'}</td>
                <td className="py-1 pr-2 font-semibold">{c.genotype || '—'}</td>
                {!compact && (
                  <td className="py-1 pr-2 leading-relaxed">
                    {truncate(c.plain || c.classification_text || '', 240)}
                  </td>
                )}
              </tr>
            )
          })}
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
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b-2 border-ss-teal/30 text-[9px] uppercase tracking-wider text-ss-muted">
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
            const priority = getPGxPhenotypePriority(code, phenotypes)
            const border = PRIORITY_BORDER_CLASS[priority] || ''
            return (
              <tr
                key={code}
                className={`border-b border-ss-border-warm/30 align-top last:border-0 ${border}`}
              >
                <td className="py-1 pl-2 pr-2 font-mono font-semibold text-ss-teal">{code}</td>
                <td className="py-1 pr-2 font-semibold">{ph?.label || '—'}</td>
                <td className="py-1 pr-2 font-mono text-[10.5px] text-ss-muted">
                  {supporting || '(no supporting SNPs found)'}
                </td>
                <td className="py-1 pr-2">{drugs}</td>
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
  const sorted = [...rows].sort((a, b) => a.rsid.localeCompare(b.rsid))
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[10.5px] sm:grid-cols-3 print:grid-cols-4">
      {sorted.map((r) => (
        <div key={r.rsid} className="flex items-baseline justify-between border-b border-ss-border-warm/20 py-0.5">
          <span className="font-mono text-ss-muted">{r.rsid}</span>
          <span className="ml-2 font-mono font-semibold text-ss-text">{r.rawGenotype}</span>
          {r.gene && <span className="ml-2 text-[9.5px] text-ss-muted">{r.gene}</span>}
        </div>
      ))}
    </div>
  )
}

function truncate(s, max) {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

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
