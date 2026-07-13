// /app/components/practitioner/ClinicianNote.jsx
// Print page 2 (optional) — a professional "note to the clinician" that
// explains what SelfScience is, its methodology, and its limitations, so
// a doctor who has never heard of the platform can quickly triage the
// report's credibility.

export default function ClinicianNote() {
  return (
    <section className="page-break-before avoid-break mt-8 print:mt-0 print:pt-8">
      <div className="border-b border-ss-teal/40 pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-orange">
          A note to the receiving clinician
        </div>
        <h2 className="mt-1 text-lg font-extrabold text-ss-teal">About this report</h2>
      </div>

      <div className="mt-4 space-y-3 text-[11.5px] leading-relaxed text-ss-text">
        <p>
          <span className="font-semibold">What SelfScience is.</span> SelfScience is an
          educational research tool that helps individuals interpret their own
          consumer-grade genotype (e.g., 23andMe, AncestryDNA, MyHeritage raw data)
          and self-reported biomarkers against published peer-reviewed literature.
          The tool runs a deterministic two-step analysis pipeline entirely on the
          patient's device — genetic data is never uploaded to, transmitted to, or
          stored by SelfScience servers.
        </p>

        <p>
          <span className="font-semibold">Methodology summary.</span> Variants are
          matched against curated rsID → phenotype tables sourced from PubMed,
          ClinVar, PharmGKB / CPIC, and gnomAD. Pharmacogenomic phenotype calls
          are derived from single-SNP inference (not full star-allele haplotyping)
          and are labeled as such. Biomarker classifications use published reference
          ranges with the source cited per marker in the biomarker table.
        </p>

        <p>
          <span className="font-semibold">Key limitations you should assume.</span>
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            The underlying data is a consumer SNP array — not clinical sequencing.
            Call rates, imputation accuracy, and coverage vary across chip versions.
            Any actionable finding <em>must</em> be confirmed with a CLIA-certified
            clinical test before informing management decisions.
          </li>
          <li>
            PGx phenotypes shown are single-SNP approximations. Star-allele
            haplotypes (e.g., CYP2D6 *2, *4, *5 duplications/deletions) require
            phased sequencing that consumer arrays do not provide.
          </li>
          <li>
            Population-frequency data cites gnomAD v3.1.2 / 1000 Genomes averages
            and should not be used for ancestry inference at the individual level.
          </li>
          <li>
            Biomarker entries are self-reported by the patient. Verify against the
            source lab report if a value drives a clinical decision.
          </li>
          <li>
            Family history, medications, and lifestyle context on the next page
            are self-reported and unverified.
          </li>
        </ul>

        <p>
          <span className="font-semibold">How to use this report.</span> Treat every
          finding as a discussion point, not a diagnosis. The report is structured so
          that each row exposes the rsID, raw two-base call, and the reference source,
          making independent verification straightforward. If you disagree with any
          interpretation, the raw genotype appendix at the end lets you cross-check
          each call against your preferred clinical panel.
        </p>
      </div>
    </section>
  )
}
