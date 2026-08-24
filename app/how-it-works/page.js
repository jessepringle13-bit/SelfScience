// /app/app/how-it-works/page.js
// SelfScience — orientation / "How It Works" tour.
//
// This page is NOT the homepage. Its job is to help a curious, overwhelmed
// visitor (parents, 23andMe holders, generic-advice-fatigued adults)
// understand:
//   1. Why they are here and who SelfScience is for.
//   2. What they can actually do on this site — outcomes, not features.
//   3. For their specific goal, which tools to use and in what sequence.
//   4. How the whole thing fits together as a loop, not a maze.
//   5. What each tool actually needs from them and gives back.
//   6. Who this is for — and who it is NOT for (safety framing).
//
// Design constraints held throughout:
//   • Second-person, warm, plain English. No jargon.
//   • Dark cards, orange for CTAs, white headings, teal accents.
//   • Purely descriptive — no new features invented.
//   • Server component (no 'use client'). Static, fast, scannable.
//
// The prior /how-it-works content (product mechanics) is preserved at
// /how-it-works/mechanics — a link is offered at the bottom of this page
// for anyone who wants the technical depth after orientation.

import Link from 'next/link'
import {
  ArrowRight,
  Dna,
  TestTube2,
  Salad,
  Map as MapIcon,
  MessageCircleQuestion,
  Search as SearchIcon,
  Compass,
  Sparkles,
  ShieldAlert,
  BookOpen,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'

export const metadata = {
  title: 'How SelfScience works — a plain-English tour',
  description:
    'A visual tour of what SelfScience is for, who it helps, and how each tool fits into your health and wellness goals. No jargon, no diagnoses — just orientation.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    title: 'How SelfScience works — a plain-English tour',
    description:
      'A visual tour of what SelfScience is for, who it helps, and how each tool fits into your health and wellness goals.',
    url: '/how-it-works',
    type: 'website',
  },
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24 dark:from-ss-canvas dark:via-ss-bg dark:to-ss-canvas">
      <SiteNav />

      {/* ================================================================
          1. HERO — Why you're here / who this is for
          ================================================================ */}
      <section className="container pt-24 md:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ss-orange/40 bg-ss-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
            <Sparkles size={12} /> A tour of what SelfScience does
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ss-teal md:text-6xl dark:text-white">
            You&rsquo;re here because something about your body doesn&rsquo;t add up.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ss-text/90 md:text-xl">
            Maybe you downloaded your 23andMe results and had no idea what to do next.
            Maybe you&rsquo;ve tried every generic wellness tip and you&rsquo;re still guessing.
            Maybe you&rsquo;re a parent trying to understand your kid&rsquo;s focus, digestion, or sleep &mdash;
            and the internet just makes you more anxious.
          </p>
          <p className="mt-5 text-lg font-semibold text-ss-teal dark:text-white">
            SelfScience exists for people like you &mdash; curious, a little overwhelmed,
            wanting real understanding instead of more generic advice.
          </p>
          <p className="mt-5 text-base leading-relaxed text-ss-muted">
            SelfScience is a research platform that helps you understand the science behind your health &mdash;
            reliably sourced, clearly explained, and built around your individual biology.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ss-orange px-7 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-ss-orange-dark"
            >
              Start with the guided path <ArrowRight size={16} />
            </Link>
            <Link
              href="#tools"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ss-teal px-6 py-3 text-base font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
            >
              Skip ahead: see the tools
            </Link>
          </div>
          <p className="mt-4 text-xs text-ss-muted">
            Educational only. Not a diagnosis, not medical advice, not a replacement for your doctor.
          </p>
        </div>
      </section>

      {/* ================================================================
          2. WHAT YOU CAN DO HERE — outcome grid (not feature list)
          ================================================================ */}
      <section className="container mt-24">
        <SectionHeader
          eyebrow="What you can actually do here"
          title="Outcomes, not features."
          subtitle="Every tool on this site serves one of these six goals. Pick the one that sounds like your life right now."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <OutcomeCard
            href="/genome"
            Icon={Dna}
            title="Understand your DNA results."
            copy="Upload the file you already have from 23andMe or AncestryDNA and see, in plain English, what each variant actually means for you."
            cta="Upload your genome"
          />
          <OutcomeCard
            href="/biomarkers"
            Icon={TestTube2}
            title="Make sense of your bloodwork."
            copy="Log lab results and see how they line up with your genetics, so a number on a page turns into a story about your biology."
            cta="Log a lab result"
          />
          <OutcomeCard
            href="/search"
            Icon={SearchIcon}
            title="Explore the research behind a symptom."
            copy="Type any topic — sleep, ADHD, methylation, magnesium — and read real papers filtered by reliability, matched to your variants when relevant."
            cta="Search the research"
          />
          <OutcomeCard
            href="/nutrition"
            Icon={Salad}
            title="See how foods and products fit your biology."
            copy="Scan or search foods, supplements and ingredients and check them against what your genome and labs suggest for you."
            cta="Open Nutrition"
          />
          <OutcomeCard
            href="/onboarding/quiz"
            Icon={MapIcon}
            title="Build a personal learning path."
            copy="Answer a short quiz about what you want to work on. Get a 3-module, calm, guided reading path — no biohacker rabbit holes."
            cta="Take the quiz"
          />
          <OutcomeCard
            href="/coach"
            Icon={MessageCircleQuestion}
            title="Ask nuanced questions and get research-backed answers."
            copy="Talk to the AI Coach. Every claim links to the study behind it. It won&rsquo;t prescribe anything — it&rsquo;ll teach you enough to ask better questions."
            cta="Ask the Coach"
          />
        </div>
      </section>

      {/* ================================================================
          3. GOAL → TOOL FLOWS — three concrete journeys
          ================================================================ */}
      <section className="container mt-28">
        <SectionHeader
          eyebrow="No matter your goal"
          title="Here&rsquo;s how the site helps."
          subtitle="Three of the most common reasons people arrive here — and the exact tools, in order, we&rsquo;d point you at."
        />

        <div className="mt-12 space-y-8">
          <GoalFlow
            badge="Goal 1"
            title="I want to understand my 23andMe or AncestryDNA results."
            forYouIf="You already have a raw DNA file and no idea what any of it means."
            steps={[
              {
                Icon: Dna,
                tool: 'Genome',
                href: '/genome',
                heading: 'Upload your genome.',
                body: 'Drag in the .txt or .zip file from 23andMe or AncestryDNA. Nothing leaves your device without your say-so. In about a minute you&rsquo;ll see two lists: your Strengths and your Things To Be Aware Of, each in one plain sentence.',
                why: 'Because a wall of rs-numbers is useless. Two short lists you can actually read are not.',
              },
              {
                Icon: BookOpen,
                tool: 'Findings',
                href: '/genome/findings',
                heading: 'Read each finding for what it is.',
                body: 'Every finding is framed as a tendency, not a verdict. You&rsquo;ll see how common it is, an evidence tier for the science behind it, and the papers we&rsquo;re relying on. Nothing hidden.',
                why: 'So you leave with understanding &mdash; not fear and not false certainty.',
              },
              {
                Icon: Compass,
                tool: 'Blueprint / Protocol',
                href: '/blueprint',
                heading: 'Turn findings into questions worth asking.',
                body: 'Your Health Blueprint groups findings into pillars (energy, sleep, methylation, etc.) and suggests experiments and questions you can bring to a practitioner &mdash; not prescriptions.',
                why: 'Because the next honest step is a better conversation with a real clinician.',
              },
            ]}
            optional={{
              Icon: SearchIcon,
              tool: 'Search',
              href: '/search',
              body: 'Want to go deeper on any specific gene, variant, or topic? Search pulls papers from PubMed and other databases, matched to your variants.',
            }}
          />

          <GoalFlow
            badge="Goal 2"
            title="I want to improve my energy, sleep, weight or performance."
            forYouIf="You don&rsquo;t have a DNA file yet — or you have one but you want a calmer, more general starting point."
            steps={[
              {
                Icon: MapIcon,
                tool: 'Quiz',
                href: '/onboarding/quiz',
                heading: 'Take the 2-minute quiz.',
                body: 'Answer a handful of questions about the areas of your life you actually want to improve. No scary medical intake &mdash; think coffee habits, sleep, energy dips, movement, mood.',
                why: 'So the site can point you at content that&rsquo;s about your life, not everyone&rsquo;s life.',
              },
              {
                Icon: Layers,
                tool: 'My Path',
                href: '/my-path',
                heading: 'Follow your 3-module foundation.',
                body: 'A short, guided reading path built from your quiz answers. One idea at a time, one action per module. You never get more than you can absorb in a sitting.',
                why: 'Because scattered tips don&rsquo;t change anything. A tiny path you actually finish does.',
              },
              {
                Icon: Salad,
                tool: 'Nutrition &amp; Trackers',
                href: '/nutrition',
                heading: 'Align daily choices.',
                body: 'Use the Nutrition scanner and Habit Tracker to line up meals, supplements and routines with what you just learned. Small, boring, repeatable moves.',
                why: 'Behavior is the only lever most of us actually control. This is where change lives.',
              },
            ]}
            optional={{
              Icon: MessageCircleQuestion,
              tool: 'Search + Coach',
              href: '/coach',
              body: 'Once your foundation is in place, use Search and the Coach as your always-on second opinion &mdash; a way to sanity-check ideas from friends, family, or the internet.',
            }}
          />

          <GoalFlow
            badge="Goal 3"
            title="I&rsquo;m a parent trying to understand my child."
            forYouIf="You&rsquo;re noticing patterns — focus, digestion, sleep, mood, sensitivities — and you want a level-headed way to think about them."
            steps={[
              {
                Icon: SearchIcon,
                tool: 'Search + Quiz',
                href: '/search',
                heading: 'Start with the pattern, not the panic.',
                body: 'Search for the thing you&rsquo;re noticing &mdash; &ldquo;kids and iron absorption&rdquo;, &ldquo;melatonin timing&rdquo;, &ldquo;lactose sensitivity in children&rdquo;. Or take the quiz on their behalf so the site frames content around your worry.',
                why: 'Anchoring on the actual observation stops the panic-Google spiral before it starts.',
              },
              {
                Icon: Dna,
                tool: 'Genome or Biomarkers',
                href: '/genome',
                heading: 'Add data if you have it &mdash; but don&rsquo;t rush to get it.',
                body: 'If you already have a DNA file or lab results for them, load them. If you don&rsquo;t, the article you just read will tell you which specific tests are actually worth asking your pediatrician about.',
                why: 'More data isn&rsquo;t always better data. Targeted data is.',
              },
              {
                Icon: Layers,
                tool: 'My Path',
                href: '/my-path',
                heading: 'Read biology in context, not in crisis.',
                body: 'My Path modules explain what&rsquo;s typical, what&rsquo;s common, what&rsquo;s meaningful, and when to actually be concerned. Written for parents, not textbook readers.',
                why: 'You leave with a calmer, sharper mental model &mdash; and a better next appointment with your kid&rsquo;s doctor.',
              },
            ]}
            optional={{
              Icon: MessageCircleQuestion,
              tool: 'Coach',
              href: '/coach',
              body: 'Ask the AI Coach specific &ldquo;is this normal?&rdquo; questions. It won&rsquo;t diagnose your child &mdash; but it will help you turn worry into words a real clinician can act on.',
            }}
          />
        </div>
      </section>

      {/* ================================================================
          4. HOW IT FITS TOGETHER — 3 lanes converging
          ================================================================ */}
      <section className="container mt-28">
        <SectionHeader
          eyebrow="How it fits together"
          title="Three ways in. One loop."
          subtitle="Whether you arrive with a question, with data, or with no idea where to start — there&rsquo;s a way in, and there&rsquo;s a loop that keeps you learning."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <LaneCard
            letter="A"
            Icon={SearchIcon}
            title="You start with a question."
            entry="Search a topic, symptom, or paper."
            hop="Land on findings and pillars related to your search."
          />
          <LaneCard
            letter="B"
            Icon={MapIcon}
            title="You start with the guided path."
            entry="Take the quiz — 2 minutes, plain English."
            hop="My Path builds a 3-module reading foundation for you."
          />
          <LaneCard
            letter="C"
            Icon={Dna}
            title="You start with your data."
            entry="Upload your genome or log a lab result."
            hop="Your Dashboard shows your top findings in plain English."
          />
        </div>

        {/* Converging pipeline visual — CSS/typography only, no image */}
        <div className="mt-10 rounded-2xl border border-ss-border-warm/60 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-ss-muted">
            All three lanes converge here
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <LoopStep n={1} title="Findings" copy="What&rsquo;s notable, in plain English." tone="amber" />
            <LoopStep n={2} title="Research" copy="Actual studies, ranked by reliability." tone="teal" />
            <LoopStep n={3} title="Path" copy="A short reading route that fits your goal." tone="orange" />
            <LoopStep n={4} title="Tools" copy="Daily nutrition, habits, questions to ask." tone="green" />
          </div>
          <p className="mt-6 text-center text-sm text-ss-muted">
            Then it loops back. New finding &rarr; new question &rarr; new research &rarr; new adjustment. You&rsquo;re never stuck at a dead end.
          </p>
        </div>
      </section>

      {/* ================================================================
          5. TOOLS, EXPLAINED — consistent spec cards
          ================================================================ */}
      <section id="tools" className="container mt-28 scroll-mt-24">
        <SectionHeader
          eyebrow="Tools, explained"
          title="What each tool actually needs, and what you get back."
          subtitle="A consistent, honest spec for every major tool on the site. No mystery boxes."
        />

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <ToolSpec
            Icon={Dna}
            title="Genome interpreter"
            href="/genome"
            inputs="Your raw DNA file from 23andMe or AncestryDNA."
            outputs="Two plain-English lists — your Strengths and Things To Be Aware Of — plus a full pillar dashboard."
            bestFor="You have a DNA file collecting dust. You&rsquo;re ready to read it."
            time="About 3 minutes to upload and skim your top findings."
          />
          <ToolSpec
            Icon={TestTube2}
            title="Biomarkers tool"
            href="/biomarkers"
            inputs="A recent blood test — CBC, metabolic panel, vitamins, hormones."
            outputs="Each value plotted with reference ranges and any genome findings that touch that biomarker."
            bestFor="You have labs in an email attachment and no idea what &lsquo;low-normal&rsquo; even means."
            time="About 5 minutes to enter and read."
          />
          <ToolSpec
            Icon={SearchIcon}
            title="Search"
            href="/search"
            inputs="A topic, symptom, gene, or paper title."
            outputs="Real studies from PubMed and other databases, filtered by reliability tier and matched to your variants when relevant."
            bestFor="You want to actually read the research, not somebody&rsquo;s blog post about the research."
            time="However long a good rabbit hole takes."
          />
          <ToolSpec
            Icon={Salad}
            title="Nutrition scanner"
            href="/nutrition"
            inputs="A food, ingredient, or product name."
            outputs="What it does biologically, how it fits your genome and labs, and any gotchas."
            bestFor="Grocery aisle. Restaurant menu. That new supplement your neighbour keeps recommending."
            time="Under a minute per lookup."
          />
          <ToolSpec
            Icon={MapIcon}
            title="My Path"
            href="/onboarding/quiz"
            inputs="Your answers to a short quiz about what you want to work on."
            outputs="A 3-module reading path, one idea at a time, one action per module."
            bestFor="You want a calm starting point that doesn&rsquo;t assume you know biochemistry."
            time="2 minutes for the quiz. Modules are 5–10 minutes each."
          />
          <ToolSpec
            Icon={MessageCircleQuestion}
            title="AI Coach"
            href="/coach"
            inputs="Any question about your findings, a paper, or a topic."
            outputs="A plain-English answer with a citation on every claim. Politely declines to prescribe or diagnose."
            bestFor="Sanity-checking something a friend, family member, or influencer told you."
            time="Ask &amp; go. Answers stream in seconds."
          />
        </div>

        <p className="mt-8 rounded-2xl border-l-4 border-ss-teal/40 bg-ss-teal/5 px-5 py-4 text-sm text-ss-text">
          <strong className="font-semibold text-ss-teal dark:text-white">One rule across every tool: </strong>
          you always see the source. Every claim links to a study. Every finding tells you how confident the science is.
          Nothing on this site asks you to just trust it.
        </p>
      </section>

      {/* ================================================================
          6. WHO THIS IS FOR / NOT FOR
          ================================================================ */}
      <section className="container mt-28">
        <SectionHeader
          eyebrow="Honest scope"
          title="Who this is for. And who it isn&rsquo;t."
          subtitle="SelfScience is educational and guidance-focused. It is not a diagnosis tool, and it does not replace your doctor."
        />

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <FitCard
            variant="good"
            title="Great fits"
            items={[
              'Curious 23andMe / AncestryDNA holders who want their file to finally mean something.',
              'Parents trying to understand focus, digestion, sleep or sensitivities in their kids \u2014 without spiralling.',
              'People working on energy, sleep, weight or performance who are tired of generic wellness advice.',
              'Anyone who wants to read actual research \u2014 not a screenshot of a screenshot on social media.',
              'Second opinions before or after a doctor visit, so your questions get sharper.',
            ]}
          />
          <FitCard
            variant="bad"
            title="Not for"
            items={[
              'Emergencies. If something is acute, call your local emergency number \u2014 not this site.',
              'People looking for a definitive diagnosis or a prescription. That is a clinician\u2019s job, not ours.',
              'Anyone hoping the AI Coach will tell them exactly what dose to take. It won\u2019t. On purpose.',
              'Replacing your primary care doctor, therapist, dietitian or specialist. Bring what you learn here to them.',
              'Chasing perfect health. Perfection isn\u2019t a real health outcome; better questions are.',
            ]}
          />
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-5">
          <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-ss-amber" />
          <p className="text-sm text-ss-text">
            <span className="font-semibold">Educational only.</span> SelfScience summarizes research associations, not medical predictions.
            Talk to a qualified clinician before making health decisions from anything you read here.
          </p>
        </div>
      </section>

      {/* ================================================================
          7. FINAL CTA — three ways to start
          ================================================================ */}
      <section className="container mt-28">
        <div className="rounded-3xl border border-ss-border-warm/60 bg-white p-8 text-center shadow-sm md:p-12">
          <h2 className="text-3xl font-extrabold text-ss-teal md:text-4xl dark:text-white">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ss-text/90">
            Pick the door that matches your situation right now. You can always come back and start again from a different one.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StartDoor
              href="/onboarding/quiz"
              Icon={MapIcon}
              badge="Not sure where to start"
              title="Take the 2-minute quiz"
              copy="We&rsquo;ll build your calm reading path."
            />
            <StartDoor
              href="/genome"
              Icon={Dna}
              badge="You have a DNA file"
              title="Upload your genome"
              copy="See your findings in plain English."
              emphasize
            />
            <StartDoor
              href="/search"
              Icon={SearchIcon}
              badge="You have a specific question"
              title="Search the research"
              copy="Real papers, ranked by reliability."
            />
          </div>

          <p className="mt-8 text-xs text-ss-muted">
            Your data stays on your device unless you explicitly say otherwise. Privacy is not a feature, it&rsquo;s the default.
          </p>
        </div>

        {/* Footer link to the technical mechanics page */}
        <p className="mt-10 text-center text-sm text-ss-muted">
          Want the technical mechanics under the hood? Read{' '}
          <Link href="/how-it-works/mechanics" className="font-semibold text-ss-teal underline hover:no-underline dark:text-white">
            How SelfScience Works Under the Hood
          </Link>
          .
        </p>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small presentational helpers — kept local so the page reads top-to-bottom.
// ---------------------------------------------------------------------------

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-ss-orange">
          {eyebrow}
        </div>
      )}
      <h2
        className="mt-3 text-3xl font-extrabold tracking-tight text-ss-teal md:text-4xl dark:text-white"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {subtitle && (
        <p
          className="mx-auto mt-3 max-w-2xl text-base text-ss-muted"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
      )}
    </div>
  )
}

function OutcomeCard({ href, Icon, title, copy, cta }) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal transition group-hover:bg-ss-teal group-hover:text-white">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <div className="mt-4 text-lg font-extrabold text-ss-teal dark:text-white">{title}</div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ss-text/85" dangerouslySetInnerHTML={{ __html: copy }} />
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ss-orange">
        {cta} <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function GoalFlow({ badge, title, forYouIf, steps, optional }) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60 md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-ss-orange/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">
          {badge}
        </span>
      </div>
      <h3
        className="mt-3 text-2xl font-extrabold text-ss-teal md:text-3xl dark:text-white"
        dangerouslySetInnerHTML={{ __html: `&ldquo;${title}&rdquo;` }}
      />
      <p className="mt-2 text-sm italic text-ss-muted">
        <span className="font-semibold not-italic text-ss-text">This is for you if:</span>{' '}
        <span dangerouslySetInnerHTML={{ __html: forYouIf }} />
      </p>

      <ol className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-4">
            <div className="flex flex-shrink-0 flex-col items-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ss-teal text-sm font-extrabold text-white">
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <span className="mt-1 h-full w-px flex-1 bg-ss-border-warm" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <s.Icon size={16} className="text-ss-teal" />
                <Link
                  href={s.href}
                  className="text-sm font-extrabold uppercase tracking-wider text-ss-teal hover:underline dark:text-white"
                >
                  {s.tool}
                </Link>
              </div>
              <div
                className="mt-1 text-lg font-bold text-ss-text"
                dangerouslySetInnerHTML={{ __html: s.heading }}
              />
              <p
                className="mt-1 text-sm leading-relaxed text-ss-text/85"
                dangerouslySetInnerHTML={{ __html: s.body }}
              />
              <p
                className="mt-2 text-xs italic text-ss-muted"
                dangerouslySetInnerHTML={{ __html: `<span class="font-semibold not-italic text-ss-teal">Why this matters &mdash; </span>${s.why}` }}
              />
            </div>
          </li>
        ))}
      </ol>

      {optional && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-ss-border-warm bg-ss-bg/40 p-4">
          <optional.Icon size={16} className="mt-0.5 flex-shrink-0 text-ss-orange" />
          <div className="min-w-0 flex-1 text-sm text-ss-text/85">
            <Link
              href={optional.href}
              className="mr-1 font-extrabold uppercase tracking-wider text-ss-orange hover:underline"
            >
              Optional &middot; {optional.tool}
            </Link>
            <span dangerouslySetInnerHTML={{ __html: optional.body }} />
          </div>
        </div>
      )}
    </article>
  )
}

function LaneCard({ letter, Icon, title, entry, hop }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ss-orange/15 text-lg font-extrabold text-ss-orange">
          {letter}
        </span>
        <Icon size={22} className="text-ss-teal" />
      </div>
      <div className="mt-3 text-lg font-extrabold text-ss-teal dark:text-white">{title}</div>
      <div className="mt-3 text-xs font-extrabold uppercase tracking-wider text-ss-muted">Entry point</div>
      <p className="mt-1 text-sm text-ss-text/85">{entry}</p>
      <div className="mt-4 text-xs font-extrabold uppercase tracking-wider text-ss-muted">Where it takes you</div>
      <p className="mt-1 text-sm text-ss-text/85">{hop}</p>
    </div>
  )
}

function LoopStep({ n, title, copy, tone }) {
  const toneClass =
    tone === 'amber' ? 'bg-ss-amber/15 text-ss-amber' :
    tone === 'orange' ? 'bg-ss-orange/15 text-ss-orange' :
    tone === 'green' ? 'bg-ss-green/15 text-ss-green' :
    'bg-ss-teal/15 text-ss-teal'
  return (
    <div className="rounded-xl border border-ss-border-warm/60 bg-ss-bg/30 p-4 text-center">
      <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${toneClass}`}>
        {n}
      </div>
      <div className="mt-2 text-sm font-extrabold text-ss-teal dark:text-white">{title}</div>
      <p className="mt-1 text-xs text-ss-muted" dangerouslySetInnerHTML={{ __html: copy }} />
    </div>
  )
}

function ToolSpec({ Icon, title, href, inputs, outputs, bestFor, time }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <div className="text-lg font-extrabold text-ss-teal dark:text-white">{title}</div>
      </div>
      <dl className="mt-4 space-y-3 text-sm text-ss-text/90">
        <SpecRow label="Inputs" value={inputs} />
        <SpecRow label="Outputs" value={outputs} />
        <SpecRow label="Best for" value={bestFor} />
        <SpecRow label="Time" value={time} />
      </dl>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-1 self-start rounded-full border-2 border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
      >
        Try {title} <ArrowRight size={14} />
      </Link>
    </div>
  )
}

function SpecRow({ label, value }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3">
      <dt className="text-[10.5px] font-extrabold uppercase tracking-wider text-ss-muted">{label}</dt>
      <dd className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: value }} />
    </div>
  )
}

function FitCard({ variant, title, items }) {
  const isGood = variant === 'good'
  const Icon = isGood ? CheckCircle2 : XCircle
  const iconColor = isGood ? 'text-ss-green' : 'text-red-500'
  const borderColor = isGood ? 'border-ss-green/40' : 'border-red-500/40'
  return (
    <div className={`rounded-2xl border-l-4 bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60 ${borderColor}`}>
      <div className="flex items-center gap-2">
        <Icon size={20} className={iconColor} />
        <h3 className="text-lg font-extrabold text-ss-teal dark:text-white">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-ss-text/90">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isGood ? 'bg-ss-green' : 'bg-red-500'}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StartDoor({ href, Icon, badge, title, copy, emphasize }) {
  const base = 'group flex flex-col items-center rounded-2xl p-6 text-center transition hover:-translate-y-0.5'
  const scheme = emphasize
    ? 'bg-ss-orange text-white shadow-lg hover:bg-ss-orange-dark'
    : 'bg-white text-ss-text shadow-sm ring-1 ring-ss-border-warm/60 hover:shadow-md'
  return (
    <Link href={href} className={`${base} ${scheme}`}>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          emphasize ? 'bg-white/20 text-white' : 'bg-ss-teal/10 text-ss-teal'
        }`}
      >
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <div className={`mt-4 text-[10.5px] font-extrabold uppercase tracking-[0.18em] ${emphasize ? 'text-white/80' : 'text-ss-orange'}`}>
        {badge}
      </div>
      <div className={`mt-1 text-lg font-extrabold ${emphasize ? 'text-white' : 'text-ss-teal dark:text-white'}`}>
        {title}
      </div>
      <p className={`mt-2 text-sm ${emphasize ? 'text-white/90' : 'text-ss-text/85'}`} dangerouslySetInnerHTML={{ __html: copy }} />
      <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${emphasize ? 'text-white' : 'text-ss-orange'}`}>
        Start here <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

// Placeholder JSX that the old file structure needed — leftover section
// removed. The prior /how-it-works ContentPage content has moved to
// /how-it-works/mechanics — a footer link at the bottom of the new page
// points users to it if they want the technical mechanics.
