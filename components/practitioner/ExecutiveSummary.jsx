// /app/components/practitioner/ExecutiveSummary.jsx
// Section 6 spec item 1 — new "Clinical Summary — For Immediate Review"
// page inserted between the cover page and Section 1. Designed to be a
// clinician's first-30-seconds view of the report.
//
// Content (top → bottom):
//   1. Urgent PGx findings (red header) — every phenotype resolved as
//      Poor / Reduced / Deficient by getPGxPhenotypePriority.
//   2. Top 3 awareness findings (by clinical significance).
//   3. Active medication flags — PGx conflicts if intake medications
//      are present, otherwise a "No medications reported" note.
//   4. Patient's chief concern from intake, or a "not reported" note.
//
// The section fits on a single printed page — content is intentionally
// dense and truncation-safe.

import {
  sortAwarenessByPriority,
  getPGxPhenotypePriority,
} from '@/lib/clinicalPriority'

const PGX_GENES = ['CYP2C19', 'CYP2D6', 'CYP2C9', 'VKORC1', 'SLCO1B1', 'DPYD', 'TPMT']

// Drug class mapping used in the "Confirm with clinical PGx panel
// before prescribing X" line for each urgent PGx finding.
const DRUG_CLASSES_BY_GENE = {
  CYP2C19: 'clopidogrel, PPIs, or SSRIs',
  CYP2D6:  'codeine, tramadol, or SSRIs',
  CYP2C9:  'warfarin, NSAIDs, or phenytoin',
  VKORC1:  'warfarin',
  SLCO1B1: 'simvastatin or other statins',
  DPYD:    '5-fluorouracil or capecitabine',
  TPMT:    'azathioprine or 6-mercaptopurine',
}

// One-sentence clinical implication for the common metabolizer classes.
function impliedAction(gene, label) {
  const lc = (label || '').toLowerCase()
  if (/(poor|deficient)/.test(lc)) {
    return `Predicted poor metabolism — standard doses of ${DRUG_CLASSES_BY_GENE[gene] || 'affected drugs'} may accumulate to toxic levels.`
  }
  if (/reduced/.test(lc)) {
    return `Predicted reduced clearance — consider dose adjustment for ${DRUG_CLASSES_BY_GENE[gene] || 'affected drugs'}.`
  }
  return `Non-normal metabolizer status — evaluate ${DRUG_CLASSES_BY_GENE[gene] || 'affected drugs'} dosing.`
}

export default function ExecutiveSummary({ intake, areas = [], phenotypes }) {
  // 1. Urgent PGx: any PGx gene whose phenotype resolves to 'urgent'.
  const urgentPGx = PGX_GENES.filter(
    (g) => getPGxPhenotypePriority(g, phenotypes) === 'urgent',
  )

  // 2. Top 3 awareness — sort by priority, take first 3.
  const sortedAwareness = sortAwarenessByPriority(areas, phenotypes).slice(0, 3)

  // 3. Active medications from intake — surface PGx conflicts if any.
  const medsRaw = (intake?.currentMedications || '').trim()
  const hasMeds = medsRaw.length > 0
  const medConflicts = hasMeds ? detectMedConflicts(medsRaw, phenotypes) : []

  const chiefConcern = (intake?.reasonForVisit || '').trim()

  return (
    <section className="page-break-after avoid-break">
      <div className="min-h-[9.5in]">
        {/* Header — red-bordered so the clinician immediately sees this
            is a summary/triage page, not the full report. */}
        <div className="border-b-2 border-ss-red pb-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-red">
            Clinical summary
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-ss-teal">
            Clinical Summary — For Immediate Review
          </h2>
          <p className="mt-1 text-[11px] italic text-ss-muted">
            30-second triage of the highest-priority findings in this report. Full detail follows on subsequent pages.
          </p>
        </div>

        {/* 1. URGENT PGx */}
        <div className="mt-4 avoid-break">
          <div className="rounded border-l-4 border-l-ss-red bg-ss-red/5 px-3 py-2">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-red">
              Urgent PGx findings
            </div>
          </div>
          {urgentPGx.length === 0 ? (
            <p className="mt-2 rounded border border-dashed border-ss-border-warm/60 p-2 text-[11px] italic text-ss-muted">
              No urgent pharmacogenomic phenotypes detected on this consumer-grade panel.
            </p>
          ) : (
            <table className="mt-2 w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-ss-teal/30 text-[9px] uppercase tracking-wider text-ss-muted">
                  <th className="py-1 pr-2 font-semibold">Gene</th>
                  <th className="py-1 pr-2 font-semibold">Phenotype</th>
                  <th className="py-1 pr-2 font-semibold">Clinical implication</th>
                </tr>
              </thead>
              <tbody>
                {urgentPGx.map((gene) => {
                  const label = phenotypes?.[gene]?.label || ''
                  return (
                    <tr key={gene} className="border-b border-ss-border-warm/30 border-l-4 border-l-ss-red bg-ss-red/[0.04] align-top last:border-b-0">
                      <td className="py-1 pl-2 pr-2 font-mono font-bold text-ss-teal">{gene}</td>
                      <td className="py-1 pr-2 font-semibold">{label || '—'}</td>
                      <td className="py-1 pr-2 leading-relaxed">
                        {impliedAction(gene, label)}
                        <div className="mt-0.5 text-[10px] italic text-ss-muted">
                          Confirm with clinical PGx panel before prescribing {DRUG_CLASSES_BY_GENE[gene] || 'affected drug class'}.
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 2. TOP AWARENESS */}
        <div className="mt-5 avoid-break">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
            Top awareness findings
          </div>
          {sortedAwareness.length === 0 ? (
            <p className="mt-1 rounded border border-dashed border-ss-border-warm/60 p-2 text-[11px] italic text-ss-muted">
              No awareness findings surfaced.
            </p>
          ) : (
            <ol className="mt-1 space-y-1 text-[11px]">
              {sortedAwareness.map((c, i) => (
                <li key={(c.rsid || '') + i} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold text-ss-orange">{i + 1}.</span>
                  <span>
                    <span className="font-semibold text-ss-text">{c.name || c.gene || c.rsid}</span>
                    {c.rsid && <span className="ml-1 font-mono text-[10px] text-ss-muted">({c.rsid})</span>}
                    <span className="ml-1">{truncate(c.plain || c.classification_text || '', 180)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* 3. ACTIVE MEDICATION FLAGS */}
        <div className="mt-5 avoid-break">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
            Active medication flags
          </div>
          {!hasMeds ? (
            <p className="mt-1 rounded border border-dashed border-ss-border-warm/60 p-2 text-[11px] italic text-ss-muted">
              No medications reported — ask patient to complete Section 1.
            </p>
          ) : medConflicts.length === 0 ? (
            <p className="mt-1 rounded border border-ss-border-warm/60 bg-ss-bg/40 p-2 text-[11px] text-ss-text">
              <span className="font-semibold text-ss-text">Reported medications:</span>{' '}
              <span className="italic">{truncate(medsRaw, 220)}</span>
              <br />
              <span className="text-ss-muted">No obvious PGx conflicts detected against this consumer-grade panel — clinical confirmation is still recommended.</span>
            </p>
          ) : (
            <ul className="mt-1 space-y-1 text-[11px]">
              {medConflicts.map((mc, i) => (
                <li key={i} className="rounded border-l-4 border-l-ss-amber bg-ss-amber/[0.06] px-2 py-1">
                  <span className="font-semibold text-ss-text">{mc.drug}</span>
                  <span className="mx-1 text-ss-muted">·</span>
                  <span className="font-mono text-[10px] text-ss-teal">{mc.gene}</span>
                  <span className="mx-1 text-ss-muted">·</span>
                  <span>{mc.note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 4. CHIEF CONCERN */}
        <div className="mt-5 avoid-break">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
            Patient's chief concern
          </div>
          {chiefConcern ? (
            <p className="mt-1 rounded border border-ss-border-warm/60 bg-ss-bg/40 p-2 text-[11px] text-ss-text">
              {truncate(chiefConcern, 320)}
            </p>
          ) : (
            <p className="mt-1 rounded border border-dashed border-ss-border-warm/60 p-2 text-[11px] italic text-ss-muted">
              Chief concern not reported.
            </p>
          )}
        </div>

        <p className="mt-6 text-[9.5px] italic text-ss-muted">
          Full detail on all findings follows on subsequent pages. This summary is for triage only — do not omit reading the full report.
        </p>
      </div>
    </section>
  )
}

function truncate(s, max) {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

// Very lightweight keyword-based conflict detector. We look for the
// drug names in the medication text and cross-reference them with any
// PGx phenotype that is non-normal. Not exhaustive — this is a
// clinician-visible ALERT, not a substitute for a real PGx panel.
const DRUG_KEYWORDS = [
  { drug: 'Clopidogrel', match: /clopidogrel|plavix/i,        gene: 'CYP2C19', note: 'Metabolizer status may affect antiplatelet efficacy.' },
  { drug: 'Codeine',     match: /codeine|tramadol/i,          gene: 'CYP2D6',  note: 'Metabolizer status may affect analgesic efficacy or toxicity.' },
  { drug: 'SSRIs',       match: /sertraline|fluoxetine|paroxetine|citalopram|escitalopram|ssri/i, gene: 'CYP2D6', note: 'CYP2D6/CYP2C19 status may alter serum levels and side-effect risk.' },
  { drug: 'Warfarin',    match: /warfarin|coumadin/i,         gene: 'CYP2C9',  note: 'CYP2C9 + VKORC1 dictate initial dose sensitivity.' },
  { drug: 'Simvastatin', match: /simvastatin|statin/i,        gene: 'SLCO1B1', note: 'SLCO1B1 status affects muscle-related side-effect risk.' },
  { drug: '5-FU',        match: /5-?fluorouracil|5-?fu|capecitabine|xeloda/i, gene: 'DPYD', note: 'DPYD deficiency contraindicates standard dosing.' },
  { drug: 'Azathioprine',match: /azathioprine|imuran|6-?mercaptopurine/i, gene: 'TPMT', note: 'TPMT deficiency requires major dose reduction.' },
  { drug: 'PPIs',        match: /omeprazole|esomeprazole|pantoprazole|ppi/i, gene: 'CYP2C19', note: 'CYP2C19 metabolizer status affects acid-suppression response.' },
  { drug: 'NSAIDs',      match: /ibuprofen|naproxen|celecoxib|nsaid/i, gene: 'CYP2C9', note: 'CYP2C9 status may affect NSAID clearance.' },
]

function detectMedConflicts(medsText, phenotypes) {
  if (!medsText || !phenotypes) return []
  const out = []
  for (const dk of DRUG_KEYWORDS) {
    if (!dk.match.test(medsText)) continue
    const priority = getPGxPhenotypePriority(dk.gene, phenotypes)
    // Only surface if the phenotype is important or urgent — normal
    // metabolizer status shouldn't create false alarms.
    if (priority === 'important' || priority === 'urgent') {
      out.push({ drug: dk.drug, gene: dk.gene, note: dk.note })
    }
  }
  return out
}
