import StaticPageShell from '@/components/static-page-shell'

export const metadata = {
  title: 'How It Works',
  description:
    'How SelfScience aggregates PubMed, Semantic Scholar, OpenAlex, and Crossref, scores study reliability with AI, and turns your raw DNA file into a personalised research roadmap.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    title: 'How SelfScience Works',
    description:
      'From your question to your genome — a look under the hood at how SelfScience finds, scores, and translates research.',
    url: '/how-it-works',
    type: 'website',
  },
}

export default function HowItWorksPage() {
  return (
    <StaticPageShell
      eyebrow={<span>How It Works</span>}
      title="From your question to your genome"
      lede="A quick tour of what happens under the hood when you search a topic, tap 'plain language,' or upload a raw DNA file."
    >
      <section>
        <h2 className="text-xl font-bold text-ss-teal">1. Search across the whole scientific literature</h2>
        <p>
          When you type a query, SelfScience calls <strong>four major research indexes in parallel</strong>:
          PubMed (NIH), Semantic Scholar (AI2), OpenAlex, and Crossref. We merge the results by DOI and
          normalized title so you don&apos;t see the same paper five times.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-6">
          <li>Peer-reviewed papers, preprints, and editorial explainers all in one feed.</li>
          <li>Filter by pillar (Genomics, Nutrition, Longevity…), by source, or by year.</li>
          <li>Every result links back to the original publisher — no paywalled second-hand summaries.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">2. Reliability scoring, in plain sight</h2>
        <p>
          Each study card carries a reliability label from <em>Limited</em> to <em>Very Strong</em>, plus
          honest flags for common issues:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-6">
          <li><strong>Not Yet Peer-Reviewed</strong> — for preprints from bioRxiv / medRxiv.</li>
          <li><strong>Small Study</strong> — flagged when the sample size is too small to generalise.</li>
          <li><strong>Industry Funded</strong> — when funding trails suggest a conflict of interest.</li>
          <li><strong>Retracted / Corrected</strong> — pulled from PubMed and Retraction Watch.</li>
        </ul>
        <p className="mt-3">
          Scoring is generated with a large language model constrained to a strict schema; the model never
          invents metadata that isn&apos;t in the original abstract or metadata payload.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">3. Plain-language translations</h2>
        <p>
          Every study can be expanded into an eight-section explainer covering:
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-6">
          <li>What they tested</li>
          <li>Who was studied</li>
          <li>What was measured</li>
          <li>What they found</li>
          <li>What it means — and what it doesn&apos;t</li>
          <li>Real-world takeaways</li>
          <li>Where the evidence is strong vs. weak</li>
          <li>Related questions worth asking</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">4. Your genome, on your device</h2>
        <p>
          Upload a raw DNA file from 23andMe, AncestryDNA, or a clinical VCF export. Parsing happens
          <strong> entirely in your browser</strong> — the raw file never touches our servers.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-6">
          <li>We match against ~185 well-studied variants across our nine pillars.</li>
          <li>Only the anonymous list of matched rsIDs (no personal data) is sent for AI interpretation.</li>
          <li>You get a three-tab roadmap: what to research first, personalised study queries, and lifestyle levers.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ss-teal">5. Reading list &amp; editorial</h2>
        <p>
          Books can be a shortcut into a field. Our reading list pairs each book with the underlying
          peer-reviewed studies, and every entry includes an honest note on where the author&apos;s claims are
          well-supported vs. speculative.
        </p>
      </section>

      <p className="rounded-lg bg-ss-privacy-tint p-4 text-sm italic text-ss-teal">
        SelfScience is a tool for research literacy — not a diagnosis, treatment, or medical device. Always
        discuss health decisions with a qualified clinician.
      </p>
    </StaticPageShell>
  )
}
