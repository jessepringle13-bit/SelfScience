import ContentPage, { Section } from '@/components/content-page'
import PageCTA from '@/components/page-cta'

export const metadata = {
  title: 'Our Mission',
  description:
    'Why SelfScience exists, what it is built on, and the standard it holds itself to.',
  alternates: { canonical: '/mission' },
  openGraph: {
    title: 'Our Mission | SelfScience',
    description:
      'Why SelfScience exists, what it is built on, and the standard it holds itself to.',
    url: '/mission',
    type: 'website',
  },
}

export default function MissionPage() {
  return (
    <ContentPage title="Our Mission">
      <Section heading="The Problem">
        <p>
          Fourteen million people have downloaded their raw genetic data from consumer testing services. Most of it is sitting unused &mdash; not because people do not care, but because the gap between raw data and meaningful understanding is enormous.
        </p>
        <p>
          The research exists. Thousands of peer-reviewed studies examine the variants in your genome and what they mean for your health, your athletic performance, your nutrition, your mental health, and your longevity. But that research is written in language most people cannot parse, scattered across databases most people have never heard of, and filtered through platforms that reduce complex science to oversimplified headlines or sell you supplements based on your results.
        </p>
        <p>
          Meanwhile the health information landscape is flooded with content that sounds scientific but is not &mdash; industry-funded research designed to reach predetermined conclusions, studies on mice presented as human evidence, single findings reported as settled science.
        </p>
        <p>People deserve better than this.</p>
      </Section>

      <Section heading="The Belief">
        <p>
          Your biology is individual. The same diet does not work for everyone because everyone&rsquo;s genome is not the same. The same training program does not produce the same results because the genes controlling mitochondrial adaptation, connective tissue structure, and fat oxidation vary from person to person. The same medication does not work the same way in everyone because the enzymes that metabolize it are genetically variable.
        </p>
        <p>
          Population averages are useful for designing public health policy. They are not useful for understanding one specific person.
        </p>
        <p>
          SelfScience is built on the belief that every person deserves access to the science of their own individual biology &mdash; not a population average, not a marketing message, not an oversimplified report. The actual research. Honestly scored. Clearly explained. Connected to their specific genetic profile.
        </p>
      </Section>

      <Section heading="The Approach">
        <p>
          <strong>Honest reliability scoring.</strong> Every piece of research on SelfScience carries a score that reflects what kind of evidence it actually is &mdash; not how confidently it is written or how many times it has been shared. A blog post and a meta-analysis of randomized controlled trials are not the same thing. SelfScience makes that difference visible.
        </p>
        <p>
          <strong>Funding transparency.</strong> Who paid for a study and what financial interest they had in the outcome is information the public deserves to have. SelfScience surfaces this automatically &mdash; not to tell you what to believe, but to give you the full picture.
        </p>
        <p>
          <strong>Plain language without oversimplification.</strong> Making research accessible does not mean making it inaccurate. SelfScience translates dense academic language into clear prose while preserving the nuance, the limitations, and the uncertainty that honest science communication requires.
        </p>
        <p>
          <strong>Personal relevance.</strong> A genome upload gives you a research roadmap built around your specific variants &mdash; the areas of the literature most worth exploring for your individual biology. Not a diagnosis. A starting point.
        </p>
        <p>
          <strong>Intellectual honesty about what genetics can and cannot tell you.</strong> Variants are tendencies found in population studies. They interact with hundreds of other genes, your environment, your lifestyle, and choices you make every day. SelfScience presents genetic findings as the beginning of a conversation with the research &mdash; not the end of one.
        </p>
      </Section>

      <Section heading="The Standard">
        <p>
          Every feature on SelfScience is held to one standard: does this help a person understand themselves and the science behind their health more accurately than they did before?
        </p>
        <p>Not more confidently. More accurately.</p>
        <p>
          Confidence without accuracy is the foundation of health misinformation. SelfScience is built to be the alternative.
        </p>
      </Section>

      <Section heading="A Note From the Founder">
        <p>I built this because I needed it and it did not exist.</p>
        <p>
          I spent years on medication that partially addressed symptoms without anyone connecting those symptoms to my genetic architecture. I trained without understanding why certain approaches worked for my body and others did not. I read health content that sounded authoritative and turned out to be funded by the industry it was reporting on.
        </p>
        <p>
          When I finally got access to my own genomic data and learned how to find and read the research behind it, everything changed. Not because genetics determined my fate &mdash; it does not &mdash; but because understanding the tendencies in my biology gave me a real starting point for making informed decisions.
        </p>
        <p>
          That process should not require months of learning how to read academic papers, how to search PubMed, how to identify industry-funded research, or how to interpret a genetic report. It should be accessible to anyone who is curious about their own health.
        </p>
        <p>That is what SelfScience is built to provide.</p>
        <p>The research exists. You deserve to understand it.</p>
      </Section>

      <PageCTA />
    </ContentPage>
  )
}
