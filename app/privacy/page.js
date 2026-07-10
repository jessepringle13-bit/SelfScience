import ContentPage, { Section, LegalSection, TableOfContents } from '@/components/content-page'
import DisclaimerBanner from '@/components/disclaimer-banner'

export const metadata = {
  title: 'Privacy Policy',
  description:
    'SelfScience Privacy Policy — how we handle your data, why we collect almost none of it, and exactly what happens to your genome file when you upload it.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Privacy Policy | SelfScience',
    description:
      'SelfScience Privacy Policy — how we handle your data, why we collect almost none of it, and exactly what happens to your genome file when you upload it.',
    url: '/privacy',
    type: 'website',
  },
}

const SECTIONS = [
  { number: 1, id: 's-collect',       label: 'What We Collect' },
  { number: 2, id: 's-not-collect',   label: 'What We Do Not Collect' },
  { number: 3, id: 's-use',           label: 'How We Use What We Collect' },
  { number: 4, id: 's-third-party',   label: 'Third-Party Services' },
  { number: 5, id: 's-genome',        label: 'Genome Data — Detailed Statement' },
  { number: 6, id: 's-security',      label: 'Data Security' },
  { number: 7, id: 's-rights',        label: 'Your Rights' },
  { number: 8, id: 's-children',      label: 'Children' },
  { number: 9, id: 's-changes',       label: 'Changes to This Policy' },
  { number: 10, id: 's-contact',      label: 'Contact' },
]

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      lede="How we handle your data — including the strict rule that your genome file is parsed only in your browser and never uploaded to our servers."
      disclaimerBanner={<DisclaimerBanner storageKey="ss:privacy-disclaimer" />}
    >
      <Section>
        <p><strong>Effective Date:</strong> July 2026</p>
        <p><strong>Platform:</strong> SelfScience (selfscience.io)</p>
      </Section>

      <Section>
        <TableOfContents items={SECTIONS} />
      </Section>

      <LegalSection number={1} id="s-collect" heading="What We Collect">
        <p>
          <strong>Search queries:</strong> When you search on SelfScience, your search terms are logged anonymously &mdash; without any identifier that connects the query to you personally. We use this data to understand which topics our users find most useful and to improve search quality.
        </p>
        <p>
          <strong>Page views and navigation:</strong> We collect standard analytics data including which pages are visited, how long users spend on the platform, and general geographic region (country and state level only). This data is anonymous and aggregated.
        </p>
        <p>
          <strong>Genome data:</strong> We do not collect genome data. When you upload a genome file, it is processed entirely within your browser. No raw file data, no variant calls, and no genome information of any kind is transmitted to or stored on SelfScience servers. Your genetic information never touches our infrastructure.
        </p>
        <p>
          <strong>Account data:</strong> SelfScience does not currently require account creation. If you create an account in the future, we will update this policy to describe what account data is collected and how it is used.
        </p>
        <p>
          <strong>Cookies:</strong> SelfScience uses cookies for analytics purposes only (Google Analytics and Microsoft Clarity). These cookies do not contain personal health information or genetic data. You may disable cookies in your browser settings &mdash; this will not affect your ability to use the platform.
        </p>
      </LegalSection>

      <LegalSection number={2} id="s-not-collect" heading="What We Do Not Collect" alt>
        <ul className="list-disc space-y-2 pl-6">
          <li>Genetic information of any kind</li>
          <li>Personal health information</li>
          <li>Medical history</li>
          <li>Name, email address, or contact information (unless you voluntarily contact us)</li>
          <li>Payment information (SelfScience is currently free)</li>
          <li>Precise location data</li>
        </ul>
      </LegalSection>

      <LegalSection number={3} id="s-use" heading="How We Use What We Collect">
        <p>Anonymous search query data is used to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Improve search result quality and relevance</li>
          <li>Identify which research topics are most valuable to our users</li>
          <li>Guide editorial content decisions</li>
        </ul>
        <p>Analytics data is used to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Understand how the platform is being used</li>
          <li>Identify technical issues</li>
          <li>Improve platform design and navigation</li>
        </ul>
        <p>
          We do not sell any data. We do not share data with advertisers. We do not use data for any purpose other than improving SelfScience.
        </p>
      </LegalSection>

      <LegalSection number={4} id="s-third-party" heading="Third-Party Services" alt>
        <p>
          <strong>Google Analytics 4:</strong> Collects anonymous page view and interaction data. Google&rsquo;s privacy policy applies to data collected through this service. You may opt out using Google&rsquo;s opt-out browser add-on.
        </p>
        <p>
          <strong>Microsoft Clarity:</strong> Collects anonymous session recordings and heatmap data to help us understand how users interact with the platform. No personal or health information is captured. Microsoft&rsquo;s privacy policy applies.
        </p>
        <p>
          <strong>PubMed and Semantic Scholar:</strong> Search queries are sent to these external APIs to retrieve research results. Your search terms may be logged by these services under their own privacy policies.
        </p>
        <p>
          <strong>AI Processing (OpenRouter and Groq):</strong> When you use the reliability scoring, plain language translation, or genome interpretation features, study metadata or anonymous variant calls are sent to AI processing services. No personal information or identifying data is included in these transmissions. Genome data sent to AI processing contains only rsID and genotype pairs &mdash; no name, date of birth, or any identifying information.
        </p>
      </LegalSection>

      <LegalSection number={5} id="s-genome" heading="Genome Data — Detailed Statement">
        <p>
          SelfScience takes the privacy of genetic information seriously. Here is exactly what happens when you upload a genome file:
        </p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Your file is read by JavaScript running in your own browser.</li>
          <li>The parser extracts only the specific variant calls (rsID and genotype) for approximately 200 pre-specified genetic locations.</li>
          <li>The original file is immediately cleared from browser memory.</li>
          <li>The extracted variant calls are used temporarily to generate your research roadmap.</li>
          <li>A subset of anonymous variant calls may be sent to an AI processing service to generate interpretations &mdash; this transmission contains no name, no date of birth, no email, and no identifying information of any kind.</li>
          <li>When you close your browser tab or session, all data is cleared.</li>
          <li>Nothing is stored on SelfScience servers at any point in this process.</li>
        </ol>
        <p>
          SelfScience complies with the Genetic Information Nondiscrimination Act (GINA). We do not collect, store, sell, or disclose genetic information. We do not use genetic information for insurance, employment, or any discriminatory purpose.
        </p>
      </LegalSection>

      <LegalSection number={6} id="s-security" heading="Data Security" alt>
        <p>
          SelfScience implements standard security practices for the data it does collect (anonymous analytics). Since no genetic or personal health data reaches our servers, the primary security benefit for genome users is the client-side processing architecture itself &mdash; your most sensitive data never travels across the internet.
        </p>
      </LegalSection>

      <LegalSection number={7} id="s-rights" heading="Your Rights">
        <p>You may:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Request information about what data SelfScience holds about you (in practice, for most users this is anonymous aggregate analytics with no way to identify your specific data).</li>
          <li>Request deletion of any data connected to you.</li>
          <li>Opt out of analytics cookies through your browser settings.</li>
        </ul>
        <p>
          <strong>For California residents:</strong> SelfScience does not sell personal data. For CCPA inquiries contact us at the address below.
        </p>
        <p>
          <strong>For EU/EEA residents:</strong> SelfScience&rsquo;s analytics practices are designed to minimize personal data collection. For GDPR inquiries contact us at the address below.
        </p>
      </LegalSection>

      <LegalSection number={8} id="s-children" heading="Children" alt>
        <p>
          SelfScience is intended for users 18 years of age and older. We do not knowingly collect information from children under 18. If you believe a child has used this platform and provided information, contact us and we will address it promptly.
        </p>
      </LegalSection>

      <LegalSection number={9} id="s-changes" heading="Changes to This Policy">
        <p>
          We may update this privacy policy as the platform evolves. Significant changes will be communicated on the platform with a revised effective date. Continued use after changes are posted constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection number={10} id="s-contact" heading="Contact" alt>
        <p>
          Privacy questions:{' '}
          <a href="mailto:privacy@selfscience.io" className="text-[#C45820] underline hover:text-[#A5471A]">privacy@selfscience.io</a>
        </p>
        <p>
          General contact:{' '}
          <a href="mailto:contact@selfscience.io" className="text-[#C45820] underline hover:text-[#A5471A]">contact@selfscience.io</a>
        </p>
      </LegalSection>
    </ContentPage>
  )
}
