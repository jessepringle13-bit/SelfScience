import Link from 'next/link'
import { ArrowRight, Info } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'

export const metadata = {
  title: "The Early Advantage: What Changes When You Know at 5 vs 45 | SelfScience",
  description: "The mission behind the Youth pillar — why the compounding benefits of acting on genomic health early make the biggest difference in a child’s life trajectory.",
}

const DISCOVERIES_TOO_LATE = [
  {
    heading: 'The adult who spent 20 years struggling with energy and mood',
    body: 'They discovered MTHFR compound heterozygous at 38 — after two decades of unexplained fatigue, low mood spells, and elevated homocysteine that no one had thought to investigate. Six months of methylfolate later, they said it felt like coming online for the first time in adulthood. Their kids share this variant.',
  },
  {
    heading: 'The athlete with three connective tissue surgeries by 31',
    body: 'Two ACL reconstructions and an Achilles rupture in an otherwise disciplined athlete. They discovered COL5A1 TT at 31, in the recovery from the third surgery. The collagen-loading protocol they now follow was researched and available for the entire decade of their competitive career — nobody had told them.',
  },
  {
    heading: 'The parent whose child struggled in school for years',
    body: 'Reading scores below grade level, teacher notes about “lack of focus,” suggestions to evaluate for ADHD. It turned out to be COMT Val/Val in a low-stimulation classroom — exactly the mismatch research predicts. A change in learning environment did more in six months than three years of interventions.',
  },
]

export default function EarlyAdvantagePage() {
  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      <section className="relative overflow-hidden bg-[#1B474D] pb-16 pt-24 text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#F5B840]/20 blur-3xl" />
        <SiteNav variant="dark" />
        <div className="container relative mx-auto max-w-3xl">
          <Link href="/pillars/youth" className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white">
            ← Back to Youth pillar
          </Link>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
            The Early Advantage: What Changes When You Know at 5 vs 45
          </h1>
          <p className="mt-4 max-w-2xl text-white/85 md:text-lg">
            The mission behind the Youth pillar. Not fear — compounding advantage.
          </p>
        </div>
      </section>

      <section className="border-b border-ss-border-warm bg-ss-teal/10">
        <div className="container flex gap-3 py-4 text-sm text-ss-teal">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            The stories on this page are hypothetical composites of the patterns that appear in the peer-reviewed literature. Nothing on this page is medical advice.
          </p>
        </div>
      </section>

      <section className="container py-12">
        <div className="mx-auto max-w-3xl space-y-14">

          {/* Section 1 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Section 1</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">What adults discover too late</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              These aren’t stories about anything gone wrong. They’re stories about a piece of information that was available in the research literature the whole time — but that arrived in the person’s life two or three decades after it would have made the biggest difference.
            </p>
            <div className="mt-6 space-y-6">
              {DISCOVERIES_TOO_LATE.map((story, i) => (
                <div key={i} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
                  <h3 className="text-lg font-bold text-ss-teal">{story.heading}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ss-text">{story.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Section 2</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">What changes when you know early</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              For every domain in the Youth pillar, the difference between discovering the information at 5 vs 35 looks like this:
            </p>
            <div className="mt-5 overflow-hidden rounded-xl border border-ss-border-warm bg-white">
              <div className="grid grid-cols-3 border-b border-ss-border-warm bg-ss-bg text-[11px] font-bold uppercase tracking-widest text-ss-muted">
                <div className="p-3">Domain</div>
                <div className="p-3">Without the information</div>
                <div className="p-3">With early awareness</div>
              </div>
              {[
                ['Nutrition', 'Years of unrecognized folate/DHA/B12 gaps compound into fatigue and cognitive haze.', 'Early methylfolate + DHA + whole-food folate build a strong methylation foundation.'],
                ['Brain & learning', 'Child is misread as “not trying” or “anxious”; interventions target the wrong problem.', 'Learning environment matches the child’s dopamine/plasticity profile from day one.'],
                ['Athletic path', 'A high-injury-risk profile enters a high-impact sport with no preventive protocol.', 'Collagen-loading + volume-progression rules protect the connective tissue during growth spurts.'],
                ['Sleep', 'A biologically evening-typed child is fought at bedtime for a decade.', 'Bedtime is anchored to biology; morning light and evening darkness do the work.'],
                ['Mental health', 'Adverse events compound in a stress-sensitive nervous system with no support.', 'Same variant + stable attachment shows the strongest positive outcomes in the research.'],
                ['Gut & immune', 'Antibiotic courses erode the microbiome without restoration.', 'Restoration is routine; probiotic strains match the child’s FUT2 status.'],
                ['Environment', 'Detox pathway operates at the edge of its capacity for years.', 'Low-toxin choices in home/food reduce the load before it accumulates.'],
                ['Growth', 'Suboptimal peak bone density is set forever by age 20.', 'Vitamin D and protein targeting during adolescence lock in a stronger baseline.'],
                ['Medications', 'A codeine or SSRI prescription arrives without genomic context.', 'Prescribing clinician has the CYP profile before writing the first script.'],
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 border-b border-ss-border-warm text-[13px] leading-relaxed last:border-b-0">
                  <div className="p-3 font-semibold text-ss-teal">{row[0]}</div>
                  <div className="p-3 text-ss-text">{row[1]}</div>
                  <div className="p-3 text-ss-text">{row[2]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Section 3</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">The compounding effect</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              Genomic advantages compound over time. A child who builds the right nutritional foundation at 5 is not just healthier at 5 — they have more robust brain development, better mitochondrial density, stronger connective tissue, and a more diverse gut microbiome that they carry into adolescence, adulthood, and eventually pass to their own children as epigenetic influence.
            </p>
            <p className="mt-3 leading-relaxed text-ss-text">
              This is why early matters more than optimal. A parent who does 60% of what the research supports for the first ten years of their child’s life outperforms an adult who does 100% of it starting at 40 — because they got to compound.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ss-muted">Section 4</div>
            <h2 className="text-2xl font-extrabold text-ss-teal">Starting today</h2>
            <p className="mt-3 leading-relaxed text-ss-text">
              You don’t need a plan. You need a first step.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/genome"
                className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-ss-orange-dark"
              >
                Upload a genome <ArrowRight size={14} />
              </Link>
              <Link
                href="/pillars/youth"
                className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-5 py-2.5 text-sm font-semibold text-ss-teal hover:bg-ss-teal/5"
              >
                Explore the nine domains
              </Link>
              <Link
                href="/reading-list?filter=youth"
                className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-5 py-2.5 text-sm font-semibold text-ss-teal hover:bg-ss-teal/5"
              >
                Read the books
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
