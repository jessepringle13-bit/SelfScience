'use client'

// /app/components/HomeStepsExplainer.jsx
// Phase A · Part 1 — three-step visual explainer strip shown directly under
// the homepage hero. Horizontal on desktop (grid), vertical on mobile with
// a subtle connecting line between the steps.

import { Dna, Search, Lightbulb } from 'lucide-react'

const STEPS = [
  {
    n: 1,
    Icon: Dna,
    // Reworded per GitHub issue #1 — DNA upload is the fastest path
    // to personalised answers, but not the only way to start. Mirrors
    // the "You don’t need your genome to use SelfScience" tone
    // already used on /start and now surfaced from the hero via the
    // "Take the 2-minute quiz" secondary CTA.
    title: 'Start your way',
    body:  'Upload a 23andMe or AncestryDNA file for the deepest personalisation — or take the 2-minute quiz if you don’t have one yet.',
  },
  {
    n: 2,
    Icon: Search,
    title: 'We read your variants',
    body:  'We check 300+ genetic markers across 9 health areas (or curate research to your quiz answers).',
  },
  {
    n: 3,
    Icon: Lightbulb,
    title: 'You get plain answers',
    body:  'No jargon. No scare tactics. Just what matters for you.',
  },
]

export default function HomeStepsExplainer() {
  return (
    <section aria-label="How SelfScience works" className="bg-ss-bg py-14 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
            How it works
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-ss-teal md:text-3xl">
            Three steps. About one minute.
          </h2>
        </div>

        {/* Mobile: stacked with connecting line. Desktop: 3-col grid. */}
        <div className="mx-auto mt-10 max-w-5xl">
          <ol className="relative grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {/* Vertical connecting line (mobile only) */}
            <span
              aria-hidden="true"
              className="absolute left-8 top-8 bottom-8 w-px bg-ss-teal/20 md:hidden"
            />
            {STEPS.map(({ n, Icon, title, body }) => (
              <li
                key={n}
                className="relative flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60 md:flex-col md:items-center md:gap-3 md:text-center"
              >
                <div className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ss-green/10 text-ss-green ring-4 ring-ss-bg">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1 md:flex-none">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ss-orange">
                    Step {n}
                  </div>
                  <h3 className="mt-1 text-base font-extrabold text-ss-teal">{title}</h3>
                  <p className="mt-1 text-sm leading-snug text-ss-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
