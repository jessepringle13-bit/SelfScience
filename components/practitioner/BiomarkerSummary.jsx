// /app/components/practitioner/BiomarkerSummary.jsx
// Print biomarker summary — pulls the LATEST snapshot from history.js if
// available; otherwise falls back to the single-panel getBiomarkerValues().
// Renders as a clinical table with reference range + status.

import { STATUS, evaluateBiomarker, getBiomarkersForSex } from '@/lib/biomarkers/status'

export default function BiomarkerSummary({ values, history, sex = 'male', sectionNum = 2 }) {
  // Prefer the most-recent history snapshot if the user has been tracking;
  // fallback to the single-panel values map.
  const source = pickLatest(values, history)
  const list = getBiomarkersForSex(source?.sex || sex)

  const filled = []
  for (const b of list) {
    const raw = source?.values?.[b.id]
    if (raw === undefined || raw === '' || raw === null) continue
    const num = Number(raw)
    if (!Number.isFinite(num)) continue
    const result = evaluateBiomarker(b, num)
    filled.push({ b, num, result })
  }

  if (filled.length === 0) {
    return (
      <section className="page-break-before avoid-break mt-8 print:mt-0 print:pt-8">
        <SectionHeader n={sectionNum} title="Biomarker summary" />
        <div className="mt-3 rounded border border-dashed border-ss-border-warm/70 p-4 text-center text-[11px] italic text-ss-muted">
          No biomarker values have been recorded. Visit <span className="font-mono">/biomarkers</span> to enter recent lab values.
        </div>
      </section>
    )
  }

  return (
    <section className="page-break-before avoid-break mt-8 print:mt-0 print:pt-8">
      <SectionHeader n={sectionNum} title="Biomarker summary (self-reported)" subtitle={source?.dateISO ? `Snapshot date: ${source.dateISO}` : 'Single-panel entry'} />

      <table className="mt-3 w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b-2 border-ss-teal/30 text-[9px] uppercase tracking-wider text-ss-muted">
            <th className="py-1 pr-2 font-semibold">Marker</th>
            <th className="py-1 pr-2 font-semibold">Value</th>
            <th className="py-1 pr-2 font-semibold">Standard clinical range</th>
            <th className="py-1 pr-2 font-semibold">Optimization target</th>
            <th className="py-1 pr-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {filled.map(({ b, num, result }) => {
            const meta = STATUS[result.status] || STATUS.insufficient
            const [oMin, oMax] = b.optimization?.optimal || []
            const optimalStr = (Number.isFinite(oMin) && Number.isFinite(oMax))
              ? `${oMin}–${oMax} ${b.unit || ''}`.trim()
              : '—'
            return (
              <tr key={b.id} className="border-b border-ss-border-warm/30 align-top">
                <td className="py-1.5 pr-2">
                  <div className="font-semibold text-ss-text">{b.label}</div>
                  {b.category && <div className="text-[9px] text-ss-muted">{b.category}</div>}
                </td>
                <td className="py-1.5 pr-2 font-semibold">{num} {b.unit || ''}</td>
                <td className="py-1.5 pr-2 text-ss-muted">{b.standard?.label || '—'}</td>
                <td className="py-1.5 pr-2 text-ss-muted">{optimalStr}</td>
                <td className="py-1.5 pr-2 font-semibold" style={{
                  color: result.status === 'in_target' ? '#059669'
                    : result.status === 'borderline' ? '#B45309'
                    : result.status === 'outside' ? '#B91C1C'
                    : '#6B7280'
                }}>
                  {meta.label}
                  {result.isClinicallyAbnormal && result.status === 'outside' && ' *'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-ss-muted">
        <span><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> In target — within SelfScience optimization range</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Borderline — within clinical normal but outside optimization</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> Outside — outside clinical reference range (* = clinically abnormal)</span>
      </div>

      <p className="mt-3 text-[10px] italic text-ss-muted">
        Values entered by the patient. Reference ranges cited per marker. Confirm against the source lab report before any clinical decision.
      </p>
    </section>
  )
}

function pickLatest(values, history) {
  const historyEntries = history?.entries || []
  if (historyEntries.length > 0) {
    const latest = historyEntries[0]
    return { values: latest.values || {}, dateISO: latest.dateISO, sex: latest.sex }
  }
  return { values: values || {}, dateISO: null, sex: null }
}

function SectionHeader({ n, title, subtitle }) {
  return (
    <div className="border-b border-ss-teal/40 pb-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-orange">
        Section {n}
      </div>
      <h2 className="mt-1 text-lg font-extrabold text-ss-teal">{title}</h2>
      {subtitle && <div className="mt-0.5 text-[10px] italic text-ss-muted">{subtitle}</div>}
    </div>
  )
}
