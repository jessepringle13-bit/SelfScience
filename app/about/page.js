import ContentPage, { Section } from '@/components/content-page'
import PageCTA from '@/components/page-cta'
import { RULES_VERSION, VARIANT_DB_UPDATED_ISO, formatDbDate } from '@/lib/reportVersion'

// Section 12 spec — reverse-chronological list of major platform updates.
// Kept as an in-code array so it never falls out of sync with the app's
// actual behavior. Add newer entries to the TOP of the list.
const CHANGELOG = [
  {
    date: 'Jul 2026',
    title: 'Practitioner Report v2 · Onboarding overhaul · Discover feed',
    items: [
      'New Clinical Summary page (Executive Summary) added to the Practitioner Report — urgent PGx findings, top 3 awareness findings, active medication flags, chief concern.',
      'Practitioner Report gains clinical-priority sorting + red/amber row borders in Section 3A, green/amber/red borders on PGx phenotype rows in Section 3C, and a database-version footer on every printed page.',
      'Onboarding: 3-step processing screen, "What we found" reveal screen, first-time 4-step tooltip tour, plain-English error recovery.',
      'Discover tab now surfaces curated feeds — trending papers, new-this-month research, gene-specific mini-feeds, and open clinical trials near you.',
      'Reading List: pillar filter chips, unread state, per-paper notes (500 chars), CSV export.',
      'Genome parse pipeline hardened: 30s per-provider timeout + Google Gemini 2.5 Flash tertiary fallback for reliability.',
    ],
  },
  {
    date: 'Jun 2026',
    title: 'Nutrition Hub · Drug Check · Supplement Discovery expansion',
    items: [
      '7-Day Meal Planner with genome-aware timing rules (MTNR1B, CLOCK).',
      'DSLD barcode scanner + BrandScore™ transparency ranking for supplements.',
      'Drug Check now surfaces PGx conflicts and My-Medications persistence.',
      'My Stack builder + Stack Quality widget on the Dashboard.',
    ],
  },
  {
    date: 'May 2026',
    title: 'Training Protocol · Pillar overhaul · Mobile',
    items: [
      'Genome-driven Training Protocol tool (Zone 2, sport affinity, tempo).',
      'Biomarker Panel logging + genome-marker correlations.',
      '10-pillar system: added Environmental Sensitivity, Hormones, and Developmental & Lifespan Wellness.',
      'Mobile "More" sheet + bottom tab bar polish.',
    ],
  },
  {
    date: 'Apr 2026',
    title: 'Public launch',
    items: [
      'Deterministic 2-step genome analysis (variant classifier + AI plain-language layer).',
      'AI-scored search across PubMed, EuropePMC, ClinicalTrials.gov, and OpenAlex.',
      'Population Compare tool and Ancestry Report.',
      'Practitioner Report v1 (Patient context + Biomarker + Genetic variant summary).',
    ],
  },
]


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
          I also went through something harder during this period. I navigated coming off an antidepressant &mdash; not impulsively, but deliberately, using my genomic data as a guide. Understanding that my MTHFR variant affects neurotransmitter synthesis, that my BDNF Val66Met variant means exercise is literal neurological medicine for me, that my FKBP5 CT variant means cortisol management is non-negotiable &mdash; all of this informed how I approached that transition. It gave me a framework when most people in that situation have none. That decision was made in conversation with my physician &mdash; not based on any platform alone, and not something anyone should navigate without qualified medical supervision.
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
          And it gives you a way to upload your raw genome file &mdash; read entirely in your browser, with only anonymous variant calls used to generate your results &mdash; and receive a personalized research roadmap built around your specific genetic variants. Not a medical report. Not a diagnosis. A starting point for understanding yourself through the lens of what the science actually shows.
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

      <Section heading="How SelfScience Works — Methodology">
        <p>
          SelfScience is built on a strict deterministic pipeline. When you upload your raw DNA file, we read it entirely in your browser — no upload of the raw file, no server-side processing of your genome. Only anonymous variant calls (rsID + two-base genotype) are used to generate your results, and even those are cleared when you close the tab.
        </p>
        <p>
          <strong>Data sources.</strong> Our variant-to-research mapping draws from{' '}
          <strong>PubMed</strong> and <strong>EuropePMC</strong> for peer-reviewed literature, <strong>ClinVar</strong> for clinical significance annotations, <strong>PharmGKB</strong> and{' '}
          <strong>CPIC</strong> for pharmacogenomic classifications, <strong>gnomAD</strong> for population allele frequencies, <strong>ClinicalTrials.gov v2</strong> for open recruiting studies, and{' '}
          <strong>DSLD</strong> for supplement label data.
        </p>
        <p>
          <strong>How variants are matched.</strong> We use deterministic rsID lookup against a curated variant library — not AI interpretation of your raw sequence. Each recognised rsID has a hand-audited genotype-to-classification rule (Benefit / Aware / Neutral) grounded in current research. The AI layer sits on top: it rewrites the underlying research into plain-English cards, but it never invents variants or clinical implications.
        </p>
        <p>
          <strong>Reliability scoring.</strong> Every search result is scored by a separate AI pass against a rubric that looks at study design (RCT vs. observational vs. mechanistic), sample size, funding source, and citation depth. The tier label (Strong / Moderate / Limited) is displayed alongside the paper — never a false claim of certainty.
        </p>
        <p>
          <strong>Limitations.</strong> SelfScience relies on single-SNP inference from consumer-grade genotyping arrays (23andMe / AncestryDNA / MyHeritage). It is <strong>not clinical-grade</strong>. It does not detect star-alleles, copy-number variants, or rare mutations. It cannot substitute for a clinical PGx panel, a genetic counselor, or a licensed physician. Every finding is a research association, not a diagnosis.
        </p>
        <p>
          <strong>Privacy.</strong> Genomic data never leaves your device. Raw files are parsed client-side, variant calls are sent to our AI providers only for text generation and reliability scoring, and no user-identifiable information (name, email, IP location) is ever tied to a variant. Your Reading List, notes, meal plans, supplement stack, and every persistent preference live in your browser's own storage — clear your browser and they are gone.
        </p>
      </Section>

      <Section heading="Team & Credentials">
        <p>
          SelfScience was founded and is built by an independent solo team. The founder is not a clinician or a bioinformatician by training — this platform exists because a lifelong self-experimenter went deep on their own genome and wanted to build the tool they wished had existed. The technical stack is engineered by experienced software developers; the scientific accuracy of the variant library and reliability scoring is grounded in <strong>publicly-audited sources</strong> (CPIC, ClinVar, PharmGKB) rather than proprietary interpretation.
        </p>
        <p>
          We deliberately do not present ourselves as a medical authority. When you use the practitioner report, you are handing a research summary to your clinician — <em>they</em> are the authority. That is the point.
        </p>
        <p className="text-xs italic text-ss-muted">
          If you are a clinician, geneticist, or biomedical researcher who would like to contribute to the variant library or review our methodology, please reach out via the support link in the top navigation.
        </p>
      </Section>

      <Section heading="What's New — Changelog">
        <ul className="mt-2 list-none space-y-3 pl-0">
          {CHANGELOG.map((entry) => (
            <li key={entry.date} className="border-l-2 border-ss-teal/60 pl-4">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-ss-orange">
                {entry.date}
              </div>
              <div className="mt-0.5 text-sm font-bold text-ss-teal">{entry.title}</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] text-ss-text">
                {entry.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="Variant Database Version">
        <p>
          <strong>Rules version:</strong>{' '}
          <span className="font-mono text-ss-teal">{RULES_VERSION}</span>
          <br />
          <strong>Variant database last updated:</strong>{' '}
          <span className="font-mono text-ss-teal">{formatDbDate()}</span> ({VARIANT_DB_UPDATED_ISO})
          <br />
          <strong>Update cadence:</strong> The variant library is refreshed against upstream sources approximately every 6–8 weeks. Rule-set changes (classification logic, priority thresholds) may ship independently between library refreshes.
        </p>
        <p className="text-[12px] italic text-ss-muted">
          These identifiers appear on every printed page of the Practitioner Report so a clinician can tell exactly which snapshot of our library any given report was generated against.
        </p>
      </Section>

      <PageCTA />
    </ContentPage>
  )
}
