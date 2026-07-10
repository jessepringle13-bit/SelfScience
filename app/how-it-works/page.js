import ContentPage, { Section } from '@/components/content-page'

export const metadata = {
  title: 'How SelfScience Works',
  description:
    'SelfScience combines a research search engine, AI reliability scoring, plain language translation, and a genome analysis tool. Here is exactly how each piece works.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    title: 'How SelfScience Works',
    description:
      'SelfScience combines a research search engine, AI reliability scoring, plain language translation, and a genome analysis tool. Here is exactly how each piece works.',
    url: '/how-it-works',
    type: 'website',
  },
}

export default function HowItWorksPage() {
  return (
    <ContentPage title="How SelfScience Works">
      <Section>
        <p>
          SelfScience combines a research search engine, an AI reliability scoring system, and a genome analysis tool into one platform. Here is exactly how each piece works.
        </p>
      </Section>

      <Section heading="The Search Engine">
        <p>
          Type any health or genomics topic into the search bar. SelfScience searches two major scientific databases simultaneously:
        </p>
        <p>
          <strong>PubMed</strong> &mdash; the National Library of Medicine&rsquo;s database of over 35 million peer-reviewed biomedical citations. The most comprehensive source of medical research in the world.
        </p>
        <p>
          <strong>Semantic Scholar</strong> &mdash; a free academic search engine covering health, genomics, nutrition, and sports science research across millions of papers.
        </p>
        <p>
          Results from both sources are combined, deduplicated, and displayed together. You see peer-reviewed studies, clinical trials, review articles, and editorial content from SelfScience &mdash; all in one place.
        </p>
      </Section>

      <Section heading="The Reliability Score">
        <p>
          Every result gets scored automatically across six dimensions before you click it. The score appears as a signal bar indicator &mdash; like phone signal bars &mdash; so you can assess the quality of evidence at a glance before reading anything.
        </p>
        <p>The six dimensions:</p>
        <p>
          <strong>Study Design</strong> &mdash; what type of research is this? A randomized controlled trial carries more weight than a single case report. A meta-analysis of many studies carries more weight than a single trial. This is the most important dimension.
        </p>
        <p>
          <strong>Methodology</strong> &mdash; how well was the study conducted? Sample size, whether there was a control group, whether the study was pre-registered before data was collected.
        </p>
        <p>
          <strong>Source Credibility</strong> &mdash; where was it published? A study in the New England Journal of Medicine is different from a study in a pay-to-publish journal.
        </p>
        <p>
          <strong>Bias Risk</strong> &mdash; does the study design have features that make it more or less likely to show a real effect?
        </p>
        <p>
          <strong>Recency</strong> &mdash; when was this published? Science moves fast in some areas. A 2005 study on gut microbiome research is a different kind of evidence than a 2024 study.
        </p>
        <p>
          <strong>Funding Transparency</strong> &mdash; who paid for this research and what financial relationship exists between the funders and the outcome? This is the dimension most health platforms ignore. SelfScience does not.
        </p>
      </Section>

      <Section heading="The Funding Trail">
        <p>
          When a study scores low on funding transparency &mdash; meaning the funder had a direct financial interest in the outcome, or conflicts of interest were not disclosed &mdash; SelfScience surfaces a Funding and Conflict of Interest Report alongside the result.
        </p>
        <p>
          This report shows you who funded the research, what financial relationships exist between the researchers and the funder, whether the study was pre-registered before data collection began, and links to public databases where you can verify this information yourself &mdash; including the Open Payments database, ProPublica Dollars for Docs, and the UCSF Industry Documents Library.
        </p>
        <p>This is not accusation. It is information. You decide what to do with it.</p>
      </Section>

      <Section heading="Plain Language Translation">
        <p>Every abstract on SelfScience has two reading modes.</p>
        <p>
          <strong>Plain Language</strong> &mdash; an AI-generated translation that explains what was studied, what was found, what the limitations are, and where this finding fits in the broader body of evidence. Written at an eighth grade reading level. No jargon left unexplained.
        </p>
        <p>
          <strong>Full Abstract</strong> &mdash; the original published text, available one click below the plain language version.
        </p>
        <p>
          Both are visible on every result. Plain language is the entry point. The full abstract is always one click away for those who want to go deeper.
        </p>
        <p>
          The translation follows strict rules. It never tells you what to do based on a single study. It never describes a correlation as proof of causation. It always states the limitations honestly. It always makes clear that one study &mdash; even an excellent one &mdash; does not establish truth.
        </p>
      </Section>

      <Section heading="The Genome Upload Tool">
        <p>
          Upload your raw genome file from 23andMe, AncestryDNA, MyHeritage, or a whole genome sequencing service. SelfScience reads the file, identifies your key genetic variants, and builds a personalized research roadmap showing which areas of the scientific literature are most relevant to your specific biology.
        </p>
        <p><strong>What happens when you upload:</strong></p>
        <p>
          Your file is read entirely in your browser. Nothing is transmitted to a server. Nothing is stored. The raw file data is cleared from memory immediately after your variant calls are extracted. Your session ends when you close the page.
        </p>
        <p>
          SelfScience checks for approximately 200 genetic variants across nine research pillars &mdash; Genomics, Nutrition, Sports Performance, Longevity, General Wellness, Pharmacogenomics, Mental Health and Neurochemistry, Environmental Sensitivity, and Hormones and Endocrine Health.
        </p>
        <p>
          Each recognized variant is classified as a Strength, an Area to Explore, or Neutral based on what population studies have found for that genotype.
        </p>
        <p><strong>What the results are:</strong></p>
        <p>A research starting point. Not a diagnosis. Not a prediction. Not medical advice.</p>
        <p>
          Genetics describes tendencies found in population studies. Many variants have modest effects. Most health outcomes are shaped by dozens or hundreds of genes interacting with your environment, your lifestyle, and your choices. Your genome is one input into a complex system &mdash; a genuinely useful input, but not the whole story.
        </p>
        <p>
          The genome tool gives you a map of where to start reading. SelfScience gives you the research to read.
        </p>
        <p>
          <strong>Accepted file formats:</strong> .txt&nbsp;&nbsp;.zip&nbsp;&nbsp;.vcf
          <br />
          <strong>Supported sources:</strong> 23andMe, AncestryDNA, MyHeritage, standard whole genome sequencing VCF files
        </p>
      </Section>

      <Section heading="The Reading List">
        <p>
          Every book on the SelfScience reading list is annotated with the peer-reviewed research behind its core ideas &mdash; and an honest note on where the evidence is strong and where it is still emerging. Some popular health books overstate the research. SelfScience tells you which claims are well-supported and which to read with appropriate skepticism.
        </p>
        <p>
          Book recommendations are also personalized. After uploading your genome file, SelfScience matches your variant profile to specific books most relevant to your findings &mdash; connecting your biology to the literature most worth reading.
        </p>
      </Section>
    </ContentPage>
  )
}
