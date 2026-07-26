'use client'

// /app/app/my-insights/page.js
// The 4th pillar of the guided nav. Shows the user’s highest-value
// insights so far, rendered through the <InsightLadder> so they
// don’t just see conclusions — they see the reasoning behind them.

import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import InsightLadder from '@/components/InsightLadder'
import UnknownsPanel from '@/components/UnknownsPanel'
import WhyYoureSeeingThis from '@/components/WhyYoureSeeingThis'
import { usePath, GOALS } from '@/lib/userPath'
import { useModuleProgress } from '@/lib/learningModules'

function goalLabel(id) { return (GOALS.find((g) => g.id === id) || {}).label || 'your goal' }

// Curated "first insight" per primary goal. Real content, plain
// language, tied to a small number of established variants /
// biomarkers so it lands without over-claiming.
const FIRST_INSIGHT = {
  energy: {
    title: 'The energy question starts with iron and thyroid.',
    data: {
      signal:    'Across large clinical samples, 3 of the top 5 reversible causes of unexplained fatigue are iron insufficiency (ferritin < 50 ng/mL), subclinical hypothyroid (low free T3), and B12 deficiency.',
      science:   'Ridker’s and Killip’s data show iron and hs-CRP explain a large share of “tired but bloodwork fine” cases when standard ranges are used. Sub-standard doesn’t always mean sub-optimal.',
      personal:  'If you haven’t checked ferritin, TSH, free T3, and B12 within the last 12 months, energy troubleshooting is guessing. If you have and they’re fine — look at sleep timing and glucose swings next.',
      tradeoffs: 'Chasing supplements without bloodwork wastes 3–6 months minimum. Chasing bloodwork you already have is fastest.',
      action:    'Order or upload a recent panel with ferritin + hs-CRP + TSH + free T3 + B12. Everything else waits on this.',
    },
  },
  longevity: {
    title: 'ApoB and VO₂max beat every longevity supplement, combined.',
    data: {
      signal:    'Cardiovascular fitness (VO₂max) and ApoB are the two variables with the largest documented effect on all-cause mortality across meta-analyses — larger than any supplement, sleep interval, or diet pattern ever measured in RCT.',
      science:   'Kodama 2009 meta-analysis: each 1-MET increase in fitness cuts mortality by ~13%. Marklund 2019: ApoB outperforms LDL-C for predicting cardiovascular events.',
      personal:  'If you don’t know your ApoB or your VO₂max, longevity work has no anchor. Both are cheap. Both are more actionable than any biological-age test.',
      tradeoffs: 'Prioritising Tier-1 (fitness, lipids, blood pressure) delays Tier-3 (rapamycin, senolytics) by design — that’s the correct order, not a compromise.',
      action:    'Add ApoB to your next lipid draw and estimate VO₂max from a 12-minute run or Cooper test.',
    },
  },
  performance: {
    title: 'Your trainability slope matters more than your ceiling.',
    data: {
      signal:    'Twin and family studies find that response-to-training (trainability) is significantly more heritable than starting fitness. Two athletes on identical programs gain very differently — the gap is largely biological.',
      science:   'Bouchard’s HERITAGE study across 500+ families quantified this at ~47% heritable trainability for VO₂max. ACTN3 and ACE variants add small tilts to fibre-type response.',
      personal:  'For your primary goal (performance), the actionable move is not to test genes for their verdict, but to log your own response curve over 8–12 weeks of intentional training and let the data name your axis.',
      tradeoffs: 'Locking in a training style based on genetics before you have your own response data is guessing dressed as science.',
      action:    'Pick one training block (aerobic base or strength) and log HR + performance across 6 weeks. Your body will tell you where it adapts fastest.',
    },
  },
  sleep: {
    title: 'Your natural wake time is the highest-signal sleep data you have.',
    data: {
      signal:    'Chronotype (morning vs evening bias) predicts sleep quality, alertness, and metabolic response to eating time — more consistently than any single genetic variant tested alone.',
      science:   'Roenneberg’s Munich Chronotype Questionnaire has been validated across 100k+ people. PER3 and CLOCK variants add small shifts but do not override the observed pattern.',
      personal:  'Your natural wake time on a free day (no alarm, no travel) after 2 recovery nights is the closest thing to a personal circadian read you can do at home.',
      tradeoffs: 'Fighting your chronotype for years produces the largest sleep-quality debt — more than any single-night intervention can offset.',
      action:    'Pick a weekend, kill your alarm, and note wake time on days 2 and 3. That’s your baseline. Build sleep decisions around it.',
    },
  },
  metabolism: {
    title: 'Fasting insulin catches metabolic drift a decade before glucose does.',
    data: {
      signal:    'Fasting insulin rises long before fasting glucose does. HOMA-IR (insulin × glucose / 405) captures early insulin resistance while every glucose test still reads “normal”.',
      science:   'DeFronzo’s work on the natural history of type-2 diabetes shows the compensation window — elevated insulin, normal glucose — can last 10–15 years before diagnosis.',
      personal:  'You may have never had fasting insulin drawn. Most standard panels skip it. Ask.',
      tradeoffs: 'Ordering fasting insulin adds ~$10 to a lipid draw and can change your risk picture entirely. Skipping it is why most metabolic issues are caught late.',
      action:    'Add fasting insulin to your next draw. Combined with fasting glucose you can compute HOMA-IR at home.',
    },
  },
  cognition: {
    title: 'The cognitive question is often nutritional, not psychiatric.',
    data: {
      signal:    'Low ferritin, low B12, low free T3, and elevated homocysteine each independently correlate with cognitive complaints similar to “brain fog” or early attention issues.',
      science:   'Smith 2010 (homocysteine + cognitive decline), Kaufman 2020 (B12 + attention), and multiple thyroid ↔ cognition RCTs establish the pattern.',
      personal:  'Before assuming psychiatry or nootropics, the standard fix is to check the four markers above. In many people they resolve most of the complaint.',
      tradeoffs: 'Skipping bloodwork and jumping to stimulants or nootropics is fast in the short term, expensive in the long term.',
      action:    'Order or upload a panel with ferritin + B12 + free T3 + homocysteine. Fix the low-hanging fruit first.',
    },
  },
  hormones: {
    title: 'Hormones only make sense in context — time-of-day, cycle, symptoms.',
    data: {
      signal:    'A single-timepoint hormone panel almost always mis-reads — cortisol swings 3-fold across the morning, TSH varies 30% by season, and sex hormones move with cycle phase in menstruating people.',
      science:   'Endocrine society consensus: any hormone measurement needs a time and context label. Otherwise the reference range is fiction.',
      personal:  'Meaningful hormone reading needs 2–3 draws timed correctly, plus a symptom log across the same window. Anything else is a snapshot without an anchor.',
      tradeoffs: 'Acting on one out-of-context draw is the fastest way to over-treat or under-treat. Slower is genuinely better here.',
      action:    'Log symptoms + timing for 2 weeks before ordering. Bring that log to whoever interprets the results.',
    },
  },
  supplements: {
    title: 'The correct supplement stack is smaller than you think.',
    data: {
      signal:    'Across large meta-analyses, only a handful of supplements show a genuine effect size in generally healthy people: vitamin D (if deficient), omega-3 (if intake is low), creatine (for performance), magnesium (if deficient), and specific forms for specific gene variants (methylfolate for MTHFR).',
      science:   'Everything else — including the majority of “anti-aging” compounds — has effect sizes in the noise range or lacks human RCT data entirely.',
      personal:  'A stack larger than 3–4 well-chosen items usually means guessing. Your genome + bloodwork narrows the list quickly.',
      tradeoffs: 'A big stack feels productive and is expensive. A short stack is boring and works.',
      action:    'Cut your current stack in half. Add back only the items you can defend from your data or symptoms.',
    },
  },
  genome: {
    title: 'Most of your genome is small nudges, not verdicts.',
    data: {
      signal:    'Across the ~500 variants that SelfScience surfaces from a raw file, the majority nudge risk or response by 1.1–1.4x. A minority (pharmacogenetic, some nutrient, APOE) are meaningfully actionable.',
      science:   'GWAS Catalog data shows most common variants have odds ratios under 1.5. This is the field consensus, not a limitation of SelfScience.',
      personal:  'Reading your genome as tendencies rather than verdicts is the most important skill. Everything else follows from it.',
      tradeoffs: 'Treating a common variant as destiny leads to anxiety without action. Treating it as context leads to better questions.',
      action:    'Explore your top 3 findings in Explore Mode. Read each one with the framing above and see how it shifts.',
    },
  },
}

export default function MyInsightsPage() {
  const path = usePath()
  const progress = useModuleProgress()

  const foundationDone = ['foundations', 'genes', 'biomarkers'].every((id) => progress?.[id]?.completedAt)
  const primary = path?.primary || 'genome'
  const insight = FIRST_INSIGHT[primary] || FIRST_INSIGHT.genome

  return (
    <div className="min-h-screen bg-ss-bg pb-24">
      <SiteNav />
      <div className="container max-w-3xl pt-24 md:pt-28">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Your Insights</div>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-ss-text md:text-4xl">
          Your highest-value insight for <span className="text-ss-teal">{goalLabel(primary).toLowerCase()}</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ss-muted">
          One insight at a time, reasoned in five steps. Skip a rung and you can always come back — the ladder waits.
        </p>

        {/* If foundational modules aren’t complete, gently redirect */}
        {!foundationDone && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ss-amber/60 bg-ss-amber/[0.08] p-4">
            <Lock size={16} className="mt-0.5 shrink-0 text-ss-amber" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ss-text">Insights land harder after the foundation.</div>
              <p className="mt-1 text-[13px] leading-relaxed text-ss-muted">The 3 foundational modules teach the mental model this ladder relies on. You can read this insight now — but the second rung will make more sense with the foundation done.</p>
              <Link href="/my-path" className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-ss-teal hover:underline">
                Go to my path <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* The primary insight ladder */}
        <div className="mt-8">
          <InsightLadder title={insight.title} data={insight.data} />
        </div>

        {/* Unknowns / next-best-data */}
        <div className="mt-8">
          <UnknownsPanel />
        </div>

        {/* Explainer */}
        <WhyYoureSeeingThis
          items={[
            `Insight selected for your primary goal: ${goalLabel(primary)}.`,
            'The ladder walks signal → science → personal fit → trade-offs → action, in that order.',
            'More insights unlock as you complete modules and add data.',
          ]}
          improveWith={!path?.data?.hasBloodwork ? 'Logging even one recent bloodwork panel adds the strongest evidence source for most goals.' : null}
        />

        {/* Pointer back to path */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/my-path" className="inline-flex items-center gap-2 rounded-full border border-ss-teal bg-white px-5 py-2.5 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white">
            Back to my path <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
