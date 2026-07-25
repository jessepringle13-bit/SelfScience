'use client'

// /app/components/LearningPath.jsx
// Three-step guided learning path for a pillar.
// Sits at the top of the filtered pillar content on the Dashboard,
// ABOVE the PillarIntroCard (which shows on first activation).
//
// State machine:
//   - "not started"  → default styling, action button visible
//   - "in progress"  → the lowest-numbered incomplete step. Elevated
//                      styling + "START HERE" eyebrow + primary CTA.
//   - "completed"    → check icon + strikethrough + "✓ Done" text.
//
// Completion tracking (writes ss_learning_step[N]_<slug>):
//   Step 1 → click the "Read the overview" link (mark then navigate).
//   Step 2 → user opens ANY VariantInterpretation on this page. Wire is
//            a global CustomEvent so no prop-drilling. Also marks if the
//            user clicks the "See my findings" button.
//   Step 3 → click the pillar-specific apply CTA (mark then navigate).

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  Check,
  Star,
  Search,
} from 'lucide-react'
import {
  getPillarLearningSpec,
  isStepComplete,
  isPathComplete,
  markStepComplete,
  pillarFindingsCounts,
  LEARNING_STEP2_EVT,
  pillarSlug,
} from '@/lib/learningPath'

export default function LearningPath({ pillarName, genomeReport, findingsAnchorId }) {
  const spec = useMemo(() => getPillarLearningSpec(pillarName), [pillarName])
  const counts = useMemo(() => pillarFindingsCounts(genomeReport, pillarName), [genomeReport, pillarName])

  // Live completion flags — refreshed via the shared learning-changed
  // event so this component reflects other tabs / other components
  // marking a step complete.
  const [tick, setTick] = useState(0)
  const bump = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const onChange = (e) => {
      // Only react to changes for THIS pillar to avoid unnecessary
      // re-renders.
      if (!pillarName) return
      const p = e?.detail?.pillar
      if (!p || p === pillarName) bump()
    }
    window.addEventListener('selfscience:learning-changed', onChange)
    // Also cross-tab sync.
    const onStorage = (e) => {
      if (!e?.key) return
      if (e.key.startsWith(`ss_learning_step`) && e.key.endsWith(`_${pillarSlug(pillarName)}`)) bump()
      if (e.key === `ss_learning_complete_${pillarSlug(pillarName)}`) bump()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('selfscience:learning-changed', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [pillarName, bump])

  // Auto-mark Step 2 whenever a variant card in this pillar is expanded.
  useEffect(() => {
    if (!pillarName) return
    const onExpand = (e) => {
      const p = e?.detail?.pillar
      // Best-effort match: normalize both sides and compare — pillar tags
      // in the raw cards can vary from the canonical chip name. Falling
      // back to marking anyway when the pillar is unknown means the
      // Learning Path always reflects real user engagement.
      if (!p || p === pillarName || String(p).toLowerCase() === String(pillarName).toLowerCase()) {
        if (!isStepComplete(2, pillarName)) markStepComplete(2, pillarName)
      }
    }
    window.addEventListener(LEARNING_STEP2_EVT, onExpand)
    return () => window.removeEventListener(LEARNING_STEP2_EVT, onExpand)
  }, [pillarName])

  if (!pillarName) return null

  const done1 = isStepComplete(1, pillarName)
  const done2 = isStepComplete(2, pillarName)
  const done3 = isStepComplete(3, pillarName)
  const doneCount = [done1, done2, done3].filter(Boolean).length
  const allDone = isPathComplete(pillarName) || doneCount === 3

  // The "current" (in-progress) step is the lowest incomplete step.
  const current = !done1 ? 1 : !done2 ? 2 : !done3 ? 3 : null

  const handleStep1 = () => markStepComplete(1, pillarName)
  const handleStep2 = (e) => {
    e?.preventDefault?.()
    markStepComplete(2, pillarName)
    // Smooth-scroll to the finding cards below on the same page.
    const el = document.getElementById(findingsAnchorId || 'pillar-findings')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const handleStep3 = () => markStepComplete(3, pillarName)

  return (
    <section
      aria-labelledby="learning-path-heading"
      // Consume `tick` so React knows this render is scoped to the
      // latest step-completion state; hidden bookkeeping only.
      data-tick={tick}
      className="rounded-2xl border border-ss-border-warm/70 bg-white p-4 md:p-6"
    >
      {/* Eyebrow + heading + subheading */}
      <div
        className="font-mono text-[10px] font-bold uppercase text-ss-teal"
        style={{ letterSpacing: '0.14em' }}
      >
        Guided Learning
      </div>
      <h2 id="learning-path-heading" className="mt-1 text-[1.4rem] font-extrabold leading-tight text-ss-text">
        Your {pillarName} Learning Path
      </h2>
      <p className="mt-1 text-[0.91rem] text-ss-muted">
        Three steps from understanding to action — follow in order or jump to where you are.
      </p>

      {/* Progress line */}
      <div className="mt-4">
        <div className="font-mono text-[11px] text-ss-muted">
          {doneCount} of 3 steps complete
        </div>
        <div
          className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ss-border-warm/70"
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={3}
        >
          <div
            className="h-full rounded-full bg-ss-green transition-all duration-500 ease-out"
            style={{ width: `${(doneCount / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Three-step layout — column on mobile, row w/ chevron connectors
          on desktop. */}
      <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-stretch md:gap-2">
        <Step
          n={1}
          done={done1}
          current={current === 1}
          title="Understand the basics"
          description={`Get grounded in the science behind ${pillarName.toLowerCase()} genetics before diving into your data.`}
          time={spec.step1Time}
          cta="Read the overview"
          href={spec.step1Url}
          onClickCta={handleStep1}
        />

        <StepConnector />

        <Step
          n={2}
          done={done2}
          current={current === 2}
          title="Read your personal findings"
          description={
            genomeReport
              ? counts.total === 0
                ? `No significant findings in ${pillarName} for your variants.`
                : `You have ${counts.total} findings in ${pillarName} — ${counts.strengths} strength${counts.strengths === 1 ? '' : 's'} and ${counts.awareness} area${counts.awareness === 1 ? '' : 's'} to explore.`
              : 'Upload your genome to see your personal findings for this pillar.'
          }
          time="~5 min"
          cta="See my findings"
          href="#"
          onClickCta={handleStep2}
        />

        <StepConnector />

        <Step
          n={3}
          done={done3}
          current={current === 3}
          title="Apply it to your daily life"
          description={spec.step3Label}
          time={spec.step3Time}
          cta={spec.step3Cta}
          href={spec.step3Url}
          onClickCta={handleStep3}
        />
      </div>

      {/* Completion banner */}
      {allDone && (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-xl bg-ss-green px-5 py-4 text-white md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2">
            <Star size={18} className="mt-0.5 flex-none" aria-hidden="true" />
            <div>
              <div className="text-sm font-bold leading-snug">
                You&apos;ve completed the {pillarName} learning path.
              </div>
              <div className="text-[12.5px] text-white/85">
                Ready to go deeper? Explore the research yourself.
              </div>
            </div>
          </div>
          <Link
            href={`/search?pillar=${encodeURIComponent(pillarName)}`}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-[0.85rem] font-semibold text-ss-green transition hover:bg-white/95"
          >
            <Search size={13} aria-hidden="true" />
            Search {pillarName} research
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  )
}

/* ============================== Step ================================ */

function Step({ n, done, current, title, description, time, cta, href, onClickCta }) {
  // Not started (default), In progress (current), Completed — each has
  // its own visual state per spec.
  const base = 'flex flex-1 flex-col rounded-2xl border p-4 md:p-5 transition min-h-full'
  const notStarted = 'border-ss-border-warm bg-ss-surface'
  const inProgress = 'border-ss-teal bg-[rgba(14,122,110,0.04)] border-t-[3px]'
  const completed  = 'border-ss-green/30 bg-[rgba(46,158,107,0.06)]'

  const cardCls = done ? completed : current ? inProgress : notStarted
  const titleCls = done
    ? 'text-ss-muted line-through'
    : 'text-ss-text'

  return (
    <div className={`${base} ${cardCls}`}>
      {/* Step number OR completion check */}
      {done ? (
        <div className="flex items-center gap-2 text-ss-green">
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ss-green/15">
            <Check size={14} strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Step {n}
          </span>
        </div>
      ) : (
        <>
          {current && (
            <div
              className="mb-1 font-mono text-[9px] font-bold uppercase text-ss-green"
              style={{ letterSpacing: '0.14em' }}
            >
              Start here
            </div>
          )}
          <div
            className="text-[3rem] font-extrabold leading-none md:text-[3rem]"
            style={{
              color: '#1B474D',
              opacity: current ? 1 : 0.35,
              marginBottom: '8px',
              fontVariantNumeric: 'tabular-nums',
            }}
            aria-hidden="true"
          >
            {n}
          </div>
        </>
      )}

      <div className={`text-[1.1rem] font-semibold leading-snug ${titleCls}`}>
        {title}
      </div>

      <p className={`mt-1 text-[0.9rem] leading-relaxed ${done ? 'text-ss-muted' : 'text-ss-muted'}`}>
        {description}
      </p>

      <div className="mt-2 font-mono text-[10px] text-ss-muted">
        {time}
      </div>

      {/* Action row — pushed to the bottom of the card. */}
      <div className="mt-auto pt-3">
        {done ? (
          <div className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase text-ss-green">
            <Check size={13} strokeWidth={3} aria-hidden="true" />
            Done
          </div>
        ) : (
          <StepButton
            href={href}
            elevated={!!current}
            onClick={onClickCta}
          >
            {cta}
          </StepButton>
        )}
      </div>
    </div>
  )
}

function StepButton({ href, onClick, elevated, children }) {
  const cls = elevated
    ? 'inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-full bg-ss-green px-[18px] py-2 text-[0.85rem] font-semibold text-white transition hover:bg-ss-green/90'
    : 'inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-full border border-ss-teal bg-transparent px-[18px] py-2 text-[0.85rem] font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white'

  // Same-page anchor: intercept navigation so we scroll instead.
  if (href === '#' || !href) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children} <ArrowRight size={13} aria-hidden="true" />
      </button>
    )
  }
  return (
    <Link href={href} onClick={onClick} className={cls}>
      {children} <ArrowRight size={13} aria-hidden="true" />
    </Link>
  )
}

/* --------------------------- Connector -------------------------------- */

function StepConnector() {
  return (
    <>
      {/* Desktop: horizontal chevron between step cards */}
      <div className="hidden shrink-0 items-center justify-center px-1 md:flex" aria-hidden="true">
        <ChevronRight size={18} className="text-ss-muted" />
      </div>
      {/* Mobile: vertical dashed line */}
      <div
        className="mx-auto my-1 h-6 border-l-2 border-dashed border-ss-border-warm md:hidden"
        aria-hidden="true"
      />
    </>
  )
}
