// /app/components/practitioner/PrintCoverPage.jsx
// Print-only cover page — LOCKED ON, never toggled off.
// Includes SelfScience branding, patient/practitioner/date fields,
// the HIPAA Confidentiality & Acknowledgment block, and dual signature lines.

import { ageFromDob, bmiFrom } from '@/lib/practitionerIntake'

export default function PrintCoverPage({ intake, reportDate, reportId }) {
  const age = ageFromDob(intake?.dob)
  const bmi = bmiFrom(intake?.heightCm, intake?.weightKg)

  return (
    <section className="page-break-after avoid-break">
      <div className="flex min-h-[9.5in] flex-col justify-between">
        {/* Top — brand block */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-ss-teal pb-4">
            <div className="flex items-center gap-3">
              {/* Logo: orange dot on teal square */}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-ss-teal">
                <span className="h-3.5 w-3.5 rounded-full bg-ss-orange" />
              </div>
              <div>
                <div className="text-2xl font-extrabold leading-none text-ss-teal">SelfScience</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ss-orange">
                  Deterministic Genome Analysis
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">Report ID</div>
              <div className="font-mono text-[11px] text-ss-text">{reportId || '—'}</div>
              <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">Generated</div>
              <div className="text-[11px] text-ss-text">{reportDate || '—'}</div>
            </div>
          </div>

          {/* Report title */}
          <div className="mt-10 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ss-orange">
              Practitioner Report
            </div>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ss-teal">
              Personal Genome & Biomarker Summary
            </h1>
            <p className="mx-auto mt-4 max-w-[5in] text-[12px] italic text-ss-muted">
              Prepared by the patient for clinical discussion. Educational only —
              not a substitute for validated clinical diagnostic testing.
            </p>
          </div>

          {/* Prepared-for block */}
          <div className="mt-10 grid grid-cols-2 gap-6">
            <CoverField label="Prepared for (patient)" value={intake?.patientName || '—'} />
            <CoverField label="For the attention of"
              value={
                intake?.practitionerName
                  ? intake.practitionerName + (intake.practitionerRole ? ` — ${intake.practitionerRole}` : '')
                  : '—'
              }
            />
            <CoverField label="Date of birth" value={intake?.dob || '—'} />
            <CoverField label="Age / Sex" value={[age != null ? `${age} yrs` : null, intake?.sex || null].filter(Boolean).join(' · ') || '—'} />
            <CoverField label="Height / Weight"
              value={[intake?.heightCm ? `${intake.heightCm} cm` : null, intake?.weightKg ? `${intake.weightKg} kg` : null].filter(Boolean).join(' · ') || '—'}
            />
            <CoverField label="BMI" value={bmi ? `${bmi.bmi} · ${bmi.category}` : '—'} />
          </div>

          {/* HIPAA Confidentiality & Acknowledgment */}
          <div className="mt-10 rounded border-2 border-ss-teal bg-ss-teal/5 p-5">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-teal">
              Confidentiality & HIPAA Acknowledgment
            </div>
            <div className="mt-2 space-y-2 text-[10px] leading-relaxed text-ss-text">
              <p>
                This document contains individually identifiable health information ("Protected Health Information") as defined under the U.S. Health Insurance Portability and Accountability Act of 1996 (HIPAA), 45 C.F.R. Parts 160 and 164, and may also be subject to state medical-privacy laws. It is transmitted directly from the patient to the practitioner named above solely for the purpose of clinical discussion.
              </p>
              <p>
                <span className="font-semibold">The information contained herein is confidential.</span> Unauthorized review, dissemination, distribution, copying, or use of this report by anyone other than the intended patient–practitioner recipients is strictly prohibited. If you are not the intended recipient, please destroy this document immediately and notify the patient.
              </p>
              <p>
                <span className="font-semibold">SelfScience is not a covered entity or business associate under HIPAA.</span> Data used to generate this report was processed entirely on the patient's own device; SelfScience never received, stored, or transmitted the underlying genetic or biomarker data. The patient alone is responsible for how this document is subsequently stored, shared, or transmitted.
              </p>
              <p>
                <span className="font-semibold">Educational, not diagnostic.</span> Findings are derived from consumer-grade single-SNP data (e.g., 23andMe, AncestryDNA) and self-reported biomarker entries. Nothing in this report constitutes a medical diagnosis, prescription, or clinical recommendation. Any decision informed by this report must be independently confirmed by the receiving clinician using validated clinical testing.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom — signature lines */}
        <div className="mt-10 grid grid-cols-2 gap-8">
          <SignatureBlock label="Patient signature" name={intake?.patientName} />
          <SignatureBlock label="Practitioner signature"
            name={intake?.practitionerName ? intake.practitionerName + (intake.practitionerRole ? ` (${intake.practitionerRole})` : '') : ''}
          />
        </div>

        <div className="mt-6 text-center text-[9px] uppercase tracking-[0.2em] text-ss-muted">
          selfscience · deterministic 2-step genome analysis · page 1
        </div>
      </div>
    </section>
  )
}

function CoverField({ label, value }) {
  return (
    <div className="border-b border-ss-border-warm/70 pb-1">
      <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ss-muted">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-ss-text">{value}</div>
    </div>
  )
}

function SignatureBlock({ label, name }) {
  return (
    <div>
      <div className="h-12 border-b-2 border-ss-text" />
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ss-muted">{label}</div>
        <div className="text-[10px] text-ss-muted">Date: ______________</div>
      </div>
      {name && <div className="mt-0.5 text-[11px] italic text-ss-muted">Printed name: {name}</div>}
    </div>
  )
}
