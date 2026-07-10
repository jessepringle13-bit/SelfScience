import StaticPageShell from '@/components/static-page-shell'

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How SelfScience handles your data — including the strict rule that raw genome files are parsed only in your browser and never uploaded to our servers.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'SelfScience Privacy Policy',
    description:
      'Genome files stay on your device. Analytics is aggregate. We do not sell personal data.',
    url: '/privacy',
    type: 'website',
  },
}

export default function PrivacyPage() {
  const updated = 'June 2025'
  return (
    <StaticPageShell
      eyebrow={<span>Privacy</span>}
      title="Privacy Policy"
      lede="Short version: your genome file never leaves your browser, we don't sell your data, and analytics are aggregate."
    >
      <p className="text-xs text-ss-muted">Last updated: {updated}</p>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">1. What we collect</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Search queries.</strong> The text you type in the search box is sent to research APIs
            (PubMed, Semantic Scholar, OpenAlex, Crossref) and to our AI providers to generate reliability
            scores and summaries.
          </li>
          <li>
            <strong>Aggregate usage analytics.</strong> If enabled, Google Analytics 4 and Microsoft Clarity
            help us understand which pages are useful. Both are configured to anonymize IPs.
          </li>
          <li>
            <strong>Nothing about your genome file.</strong> The uploaded DNA file is parsed in your browser
            using JavaScript. Only the anonymous list of matched rsIDs is sent to our AI provider for
            interpretation — not your name, not your file, not the unmatched variants.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">2. Third-party services</h2>
        <p>SelfScience relies on the following third parties. Each has its own privacy policy:</p>
        <ul className="mt-3 list-disc space-y-1 pl-6">
          <li>NCBI / PubMed (public research index)</li>
          <li>Semantic Scholar (Allen Institute for AI)</li>
          <li>OpenAlex and Crossref (open scholarly metadata)</li>
          <li>OpenRouter and Groq (AI inference for scoring and translations)</li>
          <li>Google Books (book cover thumbnails)</li>
          <li>Google Analytics 4 &amp; Microsoft Clarity (aggregate usage analytics, optional)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">3. What we do not do</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>We do not sell personal data.</li>
          <li>We do not store raw genome files on our servers.</li>
          <li>We do not run affiliate links, sponsored studies, or supplement upsells.</li>
          <li>We do not create advertising profiles.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">4. Cookies &amp; local storage</h2>
        <p>
          We use local storage on your device to remember UI preferences (like which filter pill you selected)
          and, if analytics is enabled, standard analytics cookies. You can clear these at any time in your
          browser settings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">5. Your rights</h2>
        <p>
          Because we do not maintain user accounts or store personal data at rest, most “delete my data”
          requests are already the default. If you have specific concerns, email us and we&apos;ll respond.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">6. Children</h2>
        <p>
          SelfScience is not intended for children under 13. Genome interpretation, in particular, is
          designed for adult use and adult clinical decision-making.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">7. Changes</h2>
        <p>
          We may update this policy as the product evolves. Material changes will be dated at the top of
          this page.
        </p>
      </section>
    </StaticPageShell>
  )
}
