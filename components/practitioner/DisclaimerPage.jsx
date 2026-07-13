// /app/components/practitioner/DisclaimerPage.jsx
// Mandatory final printed page — full legal disclaimer.
// Cannot be toggled off (locked ON).

export default function DisclaimerPage({ reportId, reportDate }) {
  return (
    <section className="page-break-before avoid-break mt-8 print:mt-0 print:pt-8">
      <div className="border-b-2 border-ss-teal pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-orange">
          Required legal notice
        </div>
        <h2 className="mt-1 text-lg font-extrabold text-ss-teal">Full disclaimer & terms of use</h2>
      </div>

      <div className="mt-4 space-y-3 text-[10.5px] leading-relaxed text-ss-text">
        <p>
          <span className="font-semibold">1. No medical advice.</span> The information in this report is provided by SelfScience for general educational and informational purposes only. It is not intended as, and shall not be construed as, medical advice, diagnosis, prescription, treatment, or a substitute for the professional judgement of a qualified healthcare provider. No physician-patient, pharmacist-patient, or any other therapeutic relationship is created between SelfScience and the reader.
        </p>
        <p>
          <span className="font-semibold">2. Not a diagnostic tool.</span> SelfScience is not a Clinical Laboratory Improvement Amendments (CLIA)–certified laboratory, is not registered with the U.S. Food and Drug Administration (FDA) as a diagnostic device manufacturer, and holds no equivalent authorisation from any other national regulator (including but not limited to the MHRA, TGA, Health Canada, or the European CE-IVD framework). Findings shown are derived from consumer-grade single-nucleotide-polymorphism (SNP) genotyping arrays. Consumer SNP data has known limitations in call accuracy, coverage, imputation quality, and haplotype resolution, and must not be used to inform clinical management without independent confirmation using validated diagnostic testing.
        </p>
        <p>
          <span className="font-semibold">3. Single-SNP inference caveat.</span> Pharmacogenomic (PGx) phenotype labels shown in this report are derived from single-SNP surrogates. They are not equivalent to star-allele (*1/*2/*3 …) haplotype calls produced by clinical PGx panels. Copy-number variants, duplications, deletions, and rare or novel star alleles are not detectable from consumer SNP data. Any dosing, prescribing, or medication-selection decision must be based on a validated clinical PGx assay interpreted by a qualified clinician.
        </p>
        <p>
          <span className="font-semibold">4. Self-reported data.</span> Biomarker values, medications, allergies, symptoms, lifestyle information, and family history in this report are entered by the patient and have not been verified by SelfScience. Errors, omissions, unit conversions, or transcription mistakes are the responsibility of the patient. The receiving clinician should independently verify any value used to inform a clinical decision.
        </p>
        <p>
          <span className="font-semibold">5. Population-frequency data.</span> Any allele or genotype frequencies cited are averages from gnomAD v3.1.2, the 1000 Genomes Project, and equivalent public reference cohorts. These are population-level statistics and are not appropriate for individual-level ancestry inference, forensic identification, or medico-legal purposes.
        </p>
        <p>
          <span className="font-semibold">6. No warranty; limitation of liability.</span> This report is provided "as is" and "as available," without warranty of any kind, whether express, implied, statutory, or otherwise, including without limitation any warranty of accuracy, completeness, fitness for a particular purpose, merchantability, or non-infringement. To the maximum extent permitted by applicable law, SelfScience, its officers, contributors, and licensors disclaim all liability for any direct, indirect, incidental, special, consequential, exemplary, or punitive damages arising out of or relating to the use of, or reliance upon, this report or any information contained herein.
        </p>
        <p>
          <span className="font-semibold">7. Privacy & data handling.</span> The genetic, biomarker, and self-reported data used to produce this report was processed entirely on the patient's device. SelfScience did not receive, store, transmit, or process any of the underlying identifying data on its servers. The patient alone is responsible for the subsequent storage, transmission, and disclosure of this printed document.
        </p>
        <p>
          <span className="font-semibold">8. Emergency care.</span> Nothing in this report is intended to address a medical emergency. If you believe you or another person is experiencing a medical emergency, contact your local emergency services immediately (e.g., 911 in the U.S., 999 in the U.K., 112 in the E.U.).
        </p>
        <p>
          <span className="font-semibold">9. Governing terms.</span> Use of SelfScience and this report is subject to the Terms of Use and Privacy Policy published at selfscience.io. In the event of any conflict between this notice and the online Terms of Use, the online Terms of Use control.
        </p>
        <p className="mt-4 border-t border-ss-border-warm pt-3 text-[9px] italic text-ss-muted">
          Report ID: <span className="font-mono">{reportId || '—'}</span> · Generated: {reportDate || '—'} · Prepared with SelfScience — <span className="underline">selfscience.io</span>. By presenting or reviewing this document, the patient and the practitioner acknowledge they have read and understood the foregoing notice in its entirety.
        </p>
      </div>
    </section>
  )
}
