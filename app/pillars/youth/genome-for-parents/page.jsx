import Link from 'next/link'
import { ArrowRight, Info, ShieldCheck } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'

export const metadata = {
  title: "Your Child’s Genome — A Guide for Parents | SelfScience",
  description: "How to obtain, upload, and interpret your child’s genome data on SelfScience, plus the ethical considerations for genetic testing of minors.",
}

export default function GenomeForParentsPage() {
  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      <section className="relative overflow-hidden bg-[#1B474D] pb-16 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container relative mx-auto max-w-3xl">
          <Link href="/pillars/youth" className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white">
            ← Back to Youth pillar
          </Link>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
            How to Use Your Child’s Genome on SelfScience
          </h1>
          <p className="mt-4 max-w-2xl text-white/85 md:text-lg">
            A practical, step-by-step guide for parents — including the ethical considerations that come with genomic testing for minors.
          </p>
        </div>
      </section>

      {/* Youth-specific disclaimer banner */}
      <section className="border-b border-ss-border-warm bg-ss-teal/10">
        <div className="container flex gap-3 py-4 text-sm text-ss-teal">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong className="font-bold">Important:</strong> Genomic information for children should be discussed with your child’s pediatrician or a genetic counselor before making health decisions. Nothing on this page is medical advice.
          </p>
        </div>
      </section>

      <section className="container py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          {/* Step 1 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Step 1</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">Getting your child’s genome data</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              Three common paths for families:
            </p>
            <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ss-text">
              <li><strong>Consumer testing kits</strong> — 23andMe and AncestryDNA family plans support additional samples. Note that these companies’ terms of service typically require test-takers to be 18+ (parents test as guardians). Check each provider’s current age policy.</li>
              <li><strong>Clinical genetic testing</strong> — pediatric geneticists can order clinical-grade whole-exome or targeted panel testing when there is a medical indication. This is the appropriate path when a real clinical question exists.</li>
              <li><strong>Family inference</strong> — if both parents have uploaded genomes, roughly half of a child’s genotype can be inferred without directly testing the child. Some families choose this approach to sidestep the consent question until the child can decide for themselves.</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Step 2</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">Age considerations</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              Consumer genetic testing for minors raises important ethical considerations. Many experts recommend waiting until a child can participate in the decision about their own genetic information. Others argue parents can use genomic data to make better health decisions for their child. SelfScience presents this information for educational awareness — the decision about whether and how to use genomic information for a child belongs to the family and their healthcare providers.
            </p>
            <div className="mt-4 flex gap-3 rounded-lg border border-ss-teal/30 bg-ss-teal/5 p-4 text-[14px] text-ss-teal">
              <ShieldCheck size={18} className="mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                Whatever path you choose, we recommend explaining the results to your child in age-appropriate terms as they grow up, and making the raw data available to them when they can consent to their own health information.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Step 3</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">Uploading the file to SelfScience</h2>
            <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ss-text">
              <li>Go to <Link href="/genome" className="font-semibold text-ss-teal underline">the Genome page</Link>.</li>
              <li>Choose the raw data file from your provider (23andMe .txt, AncestryDNA .txt, or a VCF from a clinical test).</li>
              <li>Parsing happens entirely in your browser. No data leaves your device.</li>
              <li>Session data is stored locally — close the tab to clear it, or use the “clear session” button on the Genome page.</li>
            </ul>
          </div>

          {/* Step 4 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Step 4</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">Reading the results with a Youth lens</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              When you view your results, look for any “Youth & Family” panel that appears in the dashboard. This panel surfaces variants that the research literature identifies as particularly relevant for children — currently MTHFR, FKBP5, FUT2, COL5A1, and COMT.
            </p>
            <p className="mt-3 leading-relaxed text-ss-text">
              Each of those links jumps you to the specific domain section on the Youth pillar page with the relevant research and what-you-can-do guidance.
            </p>
          </div>

          {/* Step 5 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Step 5</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">Discussing findings with a pediatrician</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              We recommend printing the <Link href="/practitioner-report" className="font-semibold text-ss-teal underline">Practitioner Report</Link> and bringing it to your child’s next well-visit. It summarises the findings in a clinician-friendly format with the primary research citations attached. If a significant clinical finding appears (a documented actionable variant like an ultra-rapid CYP2D6 status), request a referral to a genetic counselor for context.
            </p>
          </div>

          <div className="pt-6">
            <Link
              href="/pillars/youth"
              className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-ss-orange-dark"
            >
              Back to the Youth pillar <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
