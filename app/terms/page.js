import StaticPageShell from '@/components/static-page-shell'

export const metadata = {
  title: 'Terms of Use',
  description:
    'The terms under which SelfScience is provided — educational use only, not medical advice, no warranties on third-party research data.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'SelfScience Terms of Use',
    description:
      'SelfScience is provided for educational purposes only and is not a substitute for professional medical advice.',
    url: '/terms',
    type: 'website',
  },
}

export default function TermsPage() {
  const updated = 'June 2025'
  return (
    <StaticPageShell
      eyebrow={<span>Terms</span>}
      title="Terms of Use"
      lede="The short version: SelfScience is educational, not medical. Read the studies, ask a clinician, and make your own decisions."
    >
      <p className="text-xs text-ss-muted">Last updated: {updated}</p>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">1. Educational only</h2>
        <p>
          SelfScience is a search and literacy tool. Nothing on this site — including AI-generated
          summaries, reliability scores, and personalised research roadmaps — constitutes medical advice,
          diagnosis, or treatment. Always consult a qualified healthcare professional before making decisions
          about your health, medications, supplements, or lifestyle interventions.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">2. Research data</h2>
        <p>
          Study metadata and abstracts come from third-party sources (PubMed, Semantic Scholar, OpenAlex,
          Crossref, Retraction Watch). We do not warrant their accuracy, completeness, or timeliness. Always
          verify claims against the original publication.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">3. AI-generated content</h2>
        <p>
          Reliability scores and plain-language translations are produced by large language models operating
          on published metadata. AI output can be wrong. Treat every summary as a starting point, not a
          conclusion.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">4. Genome interpretation</h2>
        <p>
          The genome upload feature is a research literacy aid. It is not a clinical genetic test, not
          FDA-cleared, and not a substitute for consultation with a licensed genetic counselor. Some variants
          have well-established effects; most do not. Do not act on the personalised roadmap without
          professional input.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">5. Acceptable use</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Don&apos;t scrape or hammer the service in ways that would violate upstream API terms.</li>
          <li>Don&apos;t upload genome files that don&apos;t belong to you without the person&apos;s consent.</li>
          <li>Don&apos;t use SelfScience to make clinical or diagnostic decisions on behalf of another person.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">6. No warranty; limitation of liability</h2>
        <p>
          SelfScience is provided “as is” without any warranty, express or implied. To the maximum extent
          permitted by law, we disclaim liability for any direct, indirect, incidental, or consequential
          damages arising from your use of the service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">7. Changes</h2>
        <p>
          We may update these terms as the product evolves. Continued use after changes means you accept the
          revised terms.
        </p>
      </section>
    </StaticPageShell>
  )
}
