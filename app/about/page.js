import StaticPageShell from '@/components/static-page-shell'

export const metadata = {
  title: 'About',
  description:
    'SelfScience helps you search the science and understand your biology. Learn about our mission, editorial standards, and what makes us different.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About SelfScience',
    description:
      'A health research search engine with AI reliability scoring and personal genome analysis. Built for people who want the evidence, not the hype.',
    url: '/about',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow={<span>About</span>}
      title="Search the science. Understand your biology."
      lede="SelfScience is a health-research search engine built for people who want to read the evidence for themselves — not just the headlines."
    >
      <section>
        <h2 className="text-xl font-bold text-ss-teal">Why we built it</h2>
        <p>
          Health information online is a mess. Marketing copy is dressed up as science, single studies are
          reported as breakthroughs, and reliable information is buried behind paywalls or academic jargon.
          SelfScience is our attempt to fix that for the questions that matter most about your own biology.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">What we do</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Aggregate real research.</strong> Every query hits PubMed, Semantic Scholar, OpenAlex, and
            Crossref in parallel and merges results by DOI.
          </li>
          <li>
            <strong>Score reliability.</strong> AI models flag preprints, small-n studies, industry funding,
            and methodological concerns — with a plain-English note explaining why.
          </li>
          <li>
            <strong>Translate the jargon.</strong> A one-tap plain-language summary breaks down each study
            into what was tested, who was studied, what was found, and what it does and doesn’t mean for you.
          </li>
          <li>
            <strong>Personalise the roadmap.</strong> Upload a raw DNA file (23andMe, AncestryDNA, VCF) and
            SelfScience parses it locally in your browser to build a research roadmap tuned to your variants.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">Our principles</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Peer-reviewed evidence first. Preprints are labelled.</li>
          <li>No affiliate links, no supplement upsells, no sponsored studies.</li>
          <li>Uncertainty is a feature. If the science is contested, we say so.</li>
          <li>Your genome never leaves your device.</li>
          <li>We are not doctors. We help you find better questions to ask them.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">Who it&apos;s for</h2>
        <p>
          Curious people, motivated patients, coaches, biohackers, students, and anyone who wants to skip the
          influencer summary and read the source. If you can read a nutrition label, you can read a study
          with a little help — and we&apos;re that help.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">Get in touch</h2>
        <p>
          We&apos;re a small team and we read everything. Feedback, corrections, and study suggestions are all
          welcome. Reach out through the contact form (coming soon) or open an issue in our upcoming public
          feedback repo.
        </p>
      </section>

      <p className="rounded-lg bg-ss-privacy-tint p-4 text-sm italic text-ss-teal">
        SelfScience is for education, not medical advice. Always talk to a qualified clinician before making
        decisions about your health, medications, or treatments.
      </p>
    </StaticPageShell>
  )
}
