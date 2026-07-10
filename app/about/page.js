import ContentPage, { Section } from '@/components/content-page'
import PageCTA from '@/components/page-cta'

export const metadata = {
  title: 'About SelfScience',
  description:
    'SelfScience was built by someone who lived in the gap between genetic data and meaningful understanding. Here is the story and the mission.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About SelfScience',
    description:
      'SelfScience was built by someone who lived in the gap between genetic data and meaningful understanding. Here is the story and the mission.',
    url: '/about',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About"
      title="About SelfScience"
      lede="I built SelfScience because I lived in the gap between genetic data and meaningful understanding — and because crossing it changed everything about how I understand my own health."
    >
      <Section heading="Why This Exists">
        <p>
          Most people who buy a genetic testing kit from 23andMe or AncestryDNA download their results, feel overwhelmed, and do nothing with them. The reports are written for population averages. The research behind them is buried in academic journals most people cannot read. And the gap between &ldquo;here is your data&rdquo; and &ldquo;here is what to do with it&rdquo; is enormous.
        </p>
        <p>
          I built SelfScience because I lived in that gap &mdash; and because crossing it changed everything about how I understand my own health.
        </p>
      </Section>

      <Section heading="The Journey That Built This">
        <p>
          In 2024 I downloaded my raw genome data from 23andMe. What started as curiosity became something I did not expect &mdash; a complete reframe of how I understood my body, my training, my nutrition, my mental health, and my relationship with the medications I had been prescribed.
        </p>
        <p>
          I learned that I carry a compound heterozygous MTHFR variant &mdash; meaning my body converts folate to its active form at roughly half the efficiency of someone without it. This directly affects how I produce serotonin and dopamine. I had been on an antidepressant for years. Nobody had ever connected these two facts.
        </p>
        <p>
          I learned that my COMT Val158Met genotype &mdash; the so-called Warrior genotype &mdash; means my prefrontal cortex clears dopamine faster than average. I perform better under pressure and challenge than in routine. That explained more about how I function than any personality assessment I had ever taken.
        </p>
        <p>
          I learned that my ACTN3 XX genotype makes me a pure endurance athlete at the genetic level. My COL5A1 TT variant means my connective tissue is structurally more vulnerable than average and requires permanent management. My MTNR1B GG variant means that eating late at night is not just a bad habit &mdash; it is a direct driver of blood sugar dysregulation for my specific biology.
        </p>
        <p>
          Each discovery led to research. Each piece of research led to more questions. What I found was that the science existed &mdash; thousands of peer-reviewed studies on these exact variants &mdash; but it was inaccessible. Dense. Jargon-heavy. Buried behind paywalls or written for researchers, not people.
        </p>
        <p>
          I also went through something harder during this period. I navigated coming off an antidepressant &mdash; not impulsively, but deliberately, using my genomic data as a guide. Understanding that my MTHFR variant affects neurotransmitter synthesis, that my BDNF Val66Met variant means exercise is literal neurological medicine for me, that my FKBP5 CT variant means cortisol management is non-negotiable &mdash; all of this informed how I approached that transition. It gave me a framework when most people in that situation have none.
        </p>
        <p>
          I started training for Hyrox. I built a 12-month program around my specific genetic profile &mdash; Zone 2 heart rate calibrated to my Whoop data, connective tissue prehab built around my COL5A1 variant, nutrition timing built around my MTNR1B GG genotype. I got my bloodwork done and started tracking the markers most relevant to my specific variants.
        </p>
        <p>
          And throughout all of it, I kept thinking the same thing: other people deserve access to this. Not the version filtered through a 23andMe report. Not the version buried in a PubMed abstract. The real version &mdash; the research, explained honestly, connected to their specific biology, in language they can actually understand.
        </p>
        <p>That is SelfScience.</p>
      </Section>

      <Section heading="What SelfScience Is">
        <p>
          SelfScience is a research discovery platform for people who want to understand the science behind their health &mdash; starting with their own biology.
        </p>
        <p>
          It is a search engine for peer-reviewed health and genomics research, with AI-powered reliability scoring that tells you what kind of evidence you are looking at and who funded it. It translates dense academic language into plain English. It surfaces the funding trail behind studies so you can see who paid for the research and what interest they had in the outcome.
        </p>
        <p>
          And it gives you a way to upload your raw genome file &mdash; processed entirely in your browser, never stored &mdash; and receive a personalized research roadmap built around your specific genetic variants. Not a medical report. Not a diagnosis. A starting point for understanding yourself through the lens of what the science actually shows.
        </p>
      </Section>

      <Section heading="What SelfScience Is Not">
        <p>
          SelfScience is not a medical provider. It does not diagnose conditions. It does not recommend treatments or medications. It does not replace a qualified healthcare provider or genetic counselor.
        </p>
        <p>
          Every piece of content on this platform is for educational purposes only. The research we surface is real. The reliability scores are honest. The genome interpretations reflect what population studies have found &mdash; not what will happen to you personally. Genetics describes tendencies. Your life, your choices, and your environment shape the outcome.
        </p>
      </Section>

      <Section heading="The Mission">
        <p>
          To make the science of human biology accessible, honest, and personally relevant &mdash; for everyone who has ever looked at their genetic data and wondered what to do with it. For everyone who has ever read a health headline and wondered whether it was real. For everyone who deserves to understand themselves at a deeper level than a population average allows.
        </p>
        <p>
          The research exists. SelfScience helps you find it, understand it, and know what questions to ask next.
        </p>
      </Section>

      <PageCTA />
    </ContentPage>
  )
}
