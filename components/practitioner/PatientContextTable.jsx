// /app/components/practitioner/PatientContextTable.jsx
// Print page 3 — the patient's self-reported context (from the intake form)
// laid out as a two-column clinical table.

import { ageFromDob, bmiFrom } from '@/lib/practitionerIntake'

export default function PatientContextTable({ intake }) {
  const age = ageFromDob(intake?.dob)
  const bmi = bmiFrom(intake?.heightCm, intake?.weightKg)

  const rows = [
    { label: 'Chief concern / reason for visit', value: intake?.reasonForVisit },
    { label: 'Goals for this consultation', value: intake?.goals },
    { label: 'Current symptoms & timeline', value: intake?.symptomsTimeline },
    { label: 'Current medications (name, dose, frequency)', value: intake?.currentMedications },
    { label: 'Current supplements', value: intake?.currentSupplements },
    { label: 'Known allergies / adverse drug reactions', value: intake?.allergies },
    { label: 'Relevant family medical history', value: intake?.familyHistory },
    { label: 'Lifestyle (exercise, sleep, alcohol, nicotine)', value: intake?.lifestyle },
    { label: 'Recent labs / imaging', value: intake?.priorLabs },
  ]

  const demo = [
    { label: 'Age', value: age != null ? `${age} yrs` : '—' },
    { label: 'Sex assigned at birth', value: intake?.sex || '—' },
    { label: 'Height', value: intake?.heightCm ? `${intake.heightCm} cm` : '—' },
    { label: 'Weight', value: intake?.weightKg ? `${intake.weightKg} kg` : '—' },
    { label: 'BMI', value: bmi ? `${bmi.bmi} (${bmi.category})` : '—' },
  ]

  return (
    <section className="page-break-before avoid-break mt-8 print:mt-0 print:pt-8">
      <div className="border-b border-ss-teal/40 pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-orange">
          Section 1
        </div>
        <h2 className="mt-1 text-lg font-extrabold text-ss-teal">Patient-reported context</h2>
        <p className="mt-1 text-[11px] italic text-ss-muted">
          All information below is self-reported by the patient at the time of report generation. Unverified.
        </p>
      </div>

      {/* Demographic strip */}
      <div className="mt-3 grid grid-cols-5 gap-3">
        {demo.map((d) => (
          <div key={d.label} className="rounded border border-ss-border-warm/60 p-2 text-center">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-ss-muted">{d.label}</div>
            <div className="mt-0.5 text-[12px] font-semibold text-ss-text">{d.value}</div>
          </div>
        ))}
      </div>

      {/* Long-form rows */}
      <table className="mt-4 w-full border-collapse text-left text-[11.5px]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label} className={i % 2 === 0 ? 'bg-ss-bg/40' : ''}>
              <th scope="row" className="w-[38%] border-b border-ss-border-warm/50 px-2 py-1.5 align-top text-[11px] font-semibold text-ss-teal">
                {r.label}
              </th>
              <td className="border-b border-ss-border-warm/50 px-2 py-1.5 align-top leading-relaxed text-ss-text">
                {r.value ? <span className="whitespace-pre-line">{r.value}</span> : <span className="italic text-ss-muted">Not provided</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
