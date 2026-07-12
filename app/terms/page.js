import ContentPage, { Section, LegalSection, TableOfContents } from '@/components/content-page'
import DisclaimerBanner from '@/components/disclaimer-banner'

export const metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for SelfScience — an educational research discovery platform.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Terms of Use | SelfScience',
    description: 'Terms of Use for SelfScience — an educational research discovery platform.',
    url: '/terms',
    type: 'website',
  },
}

const SECTIONS = [
  { number: 1,  id: 's-purpose',     label: 'Educational Purpose Only' },
  { number: 2,  id: 's-not-medical', label: 'Not a Medical Device or Clinical Tool' },
  { number: 3,  id: 's-genome',      label: 'Genome Data — Privacy and Processing' },
  { number: 4,  id: 's-accuracy',    label: 'Research Content Accuracy' },
  { number: 5,  id: 's-user',        label: 'User Responsibilities' },
  { number: 6,  id: 's-ip',          label: 'Intellectual Property' },
  { number: 7,  id: 's-liability',   label: 'Limitation of Liability' },
  { number: 8,  id: 's-third-party', label: 'Third-Party Services' },
  { number: 9,  id: 's-changes',     label: 'Changes to These Terms' },
  { number: 10, id: 's-law',         label: 'Governing Law' },
  { number: 11, id: 's-contact',     label: 'Contact' },
]

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Terms of Use"
      lede="Please read these terms carefully before using SelfScience. By accessing or using this platform you agree to be bound by them."
      disclaimerBanner={<DisclaimerBanner />}
    >
      <Section>
        <p><strong>Effective Date:</strong> July 2026</p>
        <p><strong>Platform:</strong> SelfScience (selfscience.io)</p>
        <p>
          Please read these terms carefully before using SelfScience. By accessing or using this platform you agree to be bound by these terms.
        </p>
      </Section>

      <Section>
        <TableOfContents items={SECTIONS} />
      </Section>

      <LegalSection number={1} id="s-purpose" heading="Educational Purpose Only">
        <p>
          SelfScience is an educational research discovery platform. All content on this platform &mdash; including search results, reliability scores, plain language translations, genome interpretations, reading list annotations, and editorial articles &mdash; is provided for educational and informational purposes only.
        </p>
        <p>
          Nothing on SelfScience constitutes medical advice, clinical diagnosis, medical treatment, or a substitute for consultation with a qualified healthcare provider. SelfScience does not practice medicine. SelfScience does not provide clinical genetic counseling.
        </p>
        <p>
          If you have questions about your health, a medical condition, or your genetic data, consult a licensed healthcare provider or certified genetic counselor.
        </p>
      </LegalSection>

      <LegalSection number={2} id="s-not-medical" heading="Not a Medical Device or Clinical Tool" alt>
        <p>
          SelfScience is not a medical device. The reliability scoring system, genome interpretation tool, and plain language translations are AI-generated educational outputs &mdash; not clinical assessments. They reflect what population research has found and should not be used to make individual health decisions.
        </p>
        <p>
          Genetic variants interpreted by SelfScience represent research associations found in population studies. They do not predict individual health outcomes. Many factors &mdash; including environment, lifestyle, epigenetics, and the interaction of hundreds of genes &mdash; shape how genetic variants express in any individual.
        </p>
      </LegalSection>

      <LegalSection number={3} id="s-genome" heading="Genome Data — Privacy and Processing">
        <p>When you upload a genome file to SelfScience:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Your file is processed entirely within your browser session.</li>
          <li>No raw genome data is transmitted to SelfScience servers.</li>
          <li>No genome data is stored, retained, or logged.</li>
          <li>Only extracted variant calls (rsID and genotype pairs) are temporarily used to generate your research roadmap.</li>
          <li>All data is cleared when your session ends or you close the page.</li>
          <li>SelfScience does not sell, share, or disclose any genetic information.</li>
          <li>Anonymous variant calls extracted from your file are processed by a third-party AI service to generate interpretation text. No raw file, no name, and no personal identifier is transmitted. See our Privacy Policy for full details.</li>
        </ul>
        <p>
          SelfScience complies with the Genetic Information Nondiscrimination Act (GINA). We do not use genetic information for employment, insurance, or any discriminatory purpose. We collect no genetic information &mdash; your data never reaches our servers.
        </p>
      </LegalSection>

      <LegalSection number={4} id="s-accuracy" heading="Research Content Accuracy" alt>
        <p>
          SelfScience surfaces research from external databases including PubMed and Semantic Scholar. We do not author, endorse, or guarantee the accuracy of third-party research. Reliability scores reflect automated assessment based on publicly available information &mdash; they are educational tools, not peer review.
        </p>
        <p>
          The scientific literature evolves. Studies are sometimes retracted, updated, or superseded by better evidence. SelfScience makes reasonable efforts to flag retracted studies but cannot guarantee real-time accuracy across millions of indexed papers.
        </p>
      </LegalSection>

      <LegalSection number={5} id="s-user" heading="User Responsibilities">
        <p>By using SelfScience you agree to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Use the platform for personal educational purposes only.</li>
          <li>Not rely on SelfScience content as a substitute for professional medical advice.</li>
          <li>Not share your login credentials or access with others.</li>
          <li>Not attempt to reverse-engineer, scrape, or systematically download platform content.</li>
          <li>Not upload genome files belonging to another person without their explicit consent.</li>
          <li>Not use the platform for any commercial purpose without written permission.</li>
        </ul>
      </LegalSection>

      <LegalSection number={6} id="s-ip" heading="Intellectual Property" alt>
        <p>
          All original content on SelfScience &mdash; including editorial articles, platform design, reliability scoring methodology, genome interpretation frameworks, reading list annotations, and the SelfScience name and visual identity &mdash; is the intellectual property of SelfScience and its creator. All rights reserved.
        </p>
        <p>
          Third-party research content is the intellectual property of its respective authors and publishers. SelfScience accesses and displays this content through public APIs in accordance with applicable terms of service.
        </p>
      </LegalSection>

      <LegalSection number={7} id="s-liability" heading="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, SelfScience and its creator shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this platform &mdash; including but not limited to health decisions made in reliance on platform content, inaccuracies in reliability scores or genome interpretations, or unavailability of the platform or its features.
        </p>
        <p>Your use of SelfScience is at your own risk.</p>
      </LegalSection>

      <LegalSection number={8} id="s-third-party" heading="Third-Party Services" alt>
        <p>
          SelfScience uses third-party services including Google Analytics, Microsoft Clarity, PubMed, Semantic Scholar, and AI processing providers. These services have their own privacy policies and terms of use. SelfScience is not responsible for the practices of third-party services.
        </p>
      </LegalSection>

      <LegalSection number={9} id="s-changes" heading="Changes to These Terms">
        <p>
          SelfScience may update these terms at any time. Continued use of the platform after changes are posted constitutes acceptance of the updated terms. Significant changes will be noted on the platform with a revised effective date.
        </p>
      </LegalSection>

      <LegalSection number={10} id="s-law" heading="Governing Law" alt>
        <p>
          These terms are governed by the laws of the State of Wisconsin, United States, without regard to conflict of law principles.
        </p>
        <p>
          SelfScience is an independent educational platform operated by an individual creator based in Sun Prairie, Wisconsin, United States. For legal notices and formal correspondence:{' '}
          <a href="mailto:contact@selfscience.io" className="text-[#C45820] underline hover:text-[#A5471A]">
            contact@selfscience.io
          </a>
        </p>
      </LegalSection>

      <LegalSection number={11} id="s-contact" heading="Contact">
        <p>
          Questions about these terms:{' '}
          <a href="mailto:contact@selfscience.io" className="text-[#C45820] underline hover:text-[#A5471A]">
            contact@selfscience.io
          </a>
        </p>
      </LegalSection>
    </ContentPage>
  )
}
