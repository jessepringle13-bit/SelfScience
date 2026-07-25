'use client'

// /app/components/HealthStoryQuiz.jsx
// Three-question quiz + results-summary screen.
// Mounted globally (in layout.js). Opens either:
//   • Chained after FirstTimeWelcome's "Let's get started" click, via
//     the OPEN_QUIZ_EVENT.
//   • On demand from PrefsMenu's "Update my preferences" button.
//
// On completion: writes ss_user_profile, applies personalisation
// (literacy → showTechnicalTerms toggle), fires
// selfscience:profile-changed for any listeners.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, ArrowRight, Check,
  Zap, Heart, Microscope, Leaf, Stethoscope, Users,
  CheckCircle, BookOpen, Clipboard, Grid3x3,
  Sprout, Trees, GraduationCap, Eye, Sliders,
} from 'lucide-react'
import {
  saveQuizAnswer,
  saveUserProfile,
  markQuizSkipped,
  getQuizPartial,
  OPEN_QUIZ_EVENT,
  GOAL_LABEL,
  LITERACY_LABEL,
  PREFERENCE_LABEL,
} from '@/lib/userProfile'
import { setShowTechnicalTerms } from '@/lib/uiPrefs'

/* ----------------------- Question option data ------------------------ */

const Q1_OPTIONS = [
  { value: 'performance', label: 'I want more energy and better performance', Icon: Zap },
  { value: 'health',      label: "I'm trying to understand a health issue",    Icon: Heart },
  { value: 'curiosity',   label: "I'm curious about my genetics",              Icon: Microscope },
  { value: 'nutrition',   label: 'I want to optimize my diet and supplements', Icon: Leaf },
  { value: 'clinical',    label: 'My doctor or practitioner suggested it',     Icon: Stethoscope },
  { value: 'family',      label: "I want to understand my family's health",    Icon: Users },
]

const Q2_OPTIONS = [
  { value: 'actionable',    label: 'Simple answers I can act on today',         Icon: CheckCircle },
  { value: 'research',      label: 'Deep research I can read through',          Icon: BookOpen },
  { value: 'clinical',      label: 'Something to share with my doctor',         Icon: Clipboard },
  { value: 'comprehensive', label: 'All of the above — show me everything',    Icon: Grid3x3 },
]

const Q3_OPTIONS = [
  { value: 'beginner',     label: 'Total beginner — keep it very simple', Icon: Sprout },
  { value: 'intermediate', label: 'I know the basics',                     Icon: Sprout },
  { value: 'advanced',     label: 'I am pretty knowledgeable',             Icon: Trees },
  { value: 'professional', label: 'I am a health or science professional', Icon: GraduationCap },
]

/* ============================ Component ============================= */

export default function HealthStoryQuiz() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)              // 1 | 2 | 3 | 4 (results)
  const [dir, setDir]   = useState('forward')       // slide direction
  const [q1, setQ1]     = useState(null)
  const [q2, setQ2]     = useState(null)
  const [q3, setQ3]     = useState(null)

  // Listen for global open event (from FirstTimeWelcome + PrefsMenu).
  useEffect(() => {
    const onOpen = () => {
      // On re-open, hydrate any previously saved answers so users see
      // their prior selections.
      const partial = getQuizPartial()
      setQ1(partial.q1 || null)
      setQ2(partial.q2 || null)
      setQ3(partial.q3 || null)
      setStep(1)
      setDir('forward')
      setOpen(true)
    }
    window.addEventListener(OPEN_QUIZ_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_QUIZ_EVENT, onOpen)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  // Body-scroll lock while quiz is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const advance = useCallback((to) => {
    setDir(to > step ? 'forward' : 'back')
    setStep(to)
  }, [step])

  const handlePickQ1 = (v) => {
    setQ1(v); saveQuizAnswer('q1', v)
    setTimeout(() => advance(2), 300)
  }
  const handlePickQ2 = (v) => {
    setQ2(v); saveQuizAnswer('q2', v)
    setTimeout(() => advance(3), 300)
  }
  const handlePickQ3 = (v) => {
    setQ3(v); saveQuizAnswer('q3', v)
    // No auto-advance — Continue button required.
  }

  const commitAndShowResults = () => {
    // Apply literacy immediately + persist full profile.
    const profile = saveUserProfile({ goal: q1, preference: q2, literacy: q3 })
    // Literacy → Show technical terms toggle.
    const showTech = q3 === 'advanced' || q3 === 'professional'
    setShowTechnicalTerms(showTech)
    advance(4)
    return profile
  }

  const handleSkipAll = () => {
    // Anything they've selected stays — mark the rest skipped.
    if (!q1 || !q2 || !q3) markQuizSkipped(true)
    // If they've answered at least Q3, still commit + go to results.
    if (q1 && q2 && q3) commitAndShowResults()
    else close()
  }

  const goToUploadPage = () => { close(); router.push('/genome') }
  const goExploreWithoutFile = () => {
    // Send them to the genome page with a sample-autoload hint.
    // genome-client.jsx picks up autosample=1 (see change below).
    close()
    router.push('/genome?autosample=1')
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ss-quiz-heading"
      className="fixed inset-0 z-[80] flex items-stretch justify-center overflow-y-auto bg-ss-bg"
    >
      {/* Progress dots (only during the 3 questions) */}
      {step <= 3 && (
        <ProgressDots step={step} />
      )}

      {/* Skip top-right (steps 1–3 only) */}
      {step <= 3 && (
        <button
          type="button"
          onClick={handleSkipAll}
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ss-muted hover:text-ss-teal"
        >
          Skip <ArrowRight size={12} />
        </button>
      )}

      {/* Close X (results screen — mirror the other quiz screens) */}
      {step === 4 && (
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ss-bg text-ss-muted hover:text-ss-teal"
        >
          <X size={20} />
        </button>
      )}

      {/* Back link on Q2 / Q3 */}
      {step === 2 && (
        <button type="button" onClick={() => advance(1)} className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ss-muted hover:text-ss-teal">
          ← Back
        </button>
      )}
      {step === 3 && (
        <button type="button" onClick={() => advance(2)} className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ss-muted hover:text-ss-teal">
          ← Back
        </button>
      )}

      <div className="relative m-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-20">
        <div
          key={step + dir}
          className={`ss-quiz-slide ${dir === 'back' ? 'ss-quiz-slide-back' : ''}`}
        >
          {step === 1 && (
            <Question
              heading="What brought you here today?"
              sub="Choose the one that fits best."
              options={Q1_OPTIONS}
              selected={q1}
              onPick={handlePickQ1}
              gridCols={2}
            />
          )}
          {step === 2 && (
            <Question
              heading="What would be most useful to you?"
              sub="This helps us show you the right level of detail."
              options={Q2_OPTIONS}
              selected={q2}
              onPick={handlePickQ2}
              gridCols={1}
            />
          )}
          {step === 3 && (
            <>
              <Question
                heading="How familiar are you with health and science topics?"
                sub="We will adjust the language to match your comfort level."
                options={Q3_OPTIONS}
                selected={q3}
                onPick={handlePickQ3}
                gridCols={1}
                manualContinue
              />
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  disabled={!q3}
                  onClick={commitAndShowResults}
                  className={`inline-flex items-center gap-2 rounded-full px-8 py-3 text-[0.95rem] font-semibold transition ${
                    q3
                      ? 'bg-ss-green text-white hover:bg-ss-green/90'
                      : 'cursor-not-allowed bg-ss-border-warm/60 text-ss-muted'
                  }`}
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
          {step === 4 && (
            <ResultsSummary
              q1={q1} q2={q2} q3={q3}
              onContinueUpload={goToUploadPage}
              onExploreNoFile={goExploreWithoutFile}
            />
          )}
        </div>
      </div>

      {/* Slide animation styles (scoped inline so we don't touch globals) */}
      <style>{`
        @keyframes ss-slide-in-right { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ss-slide-in-left  { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        .ss-quiz-slide      { animation: ss-slide-in-right 220ms ease-out both; }
        .ss-quiz-slide-back { animation: ss-slide-in-left  220ms ease-out both; }
      `}</style>
    </div>
  )
}

/* --------------------------- Sub-components -------------------------- */

function ProgressDots({ step }) {
  return (
    <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 flex items-center gap-2" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-2.5 w-2.5 rounded-full ${
            n < step
              ? 'bg-ss-green'
              : n === step
                ? 'bg-ss-green'
                : 'border border-ss-border-warm bg-transparent'
          }`}
        />
      ))}
    </div>
  )
}

function Question({ heading, sub, options, selected, onPick, gridCols, manualContinue }) {
  return (
    <>
      <h2
        id="ss-quiz-heading"
        className="text-center font-extrabold leading-tight text-ss-text"
        style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}
      >
        {heading}
      </h2>
      <p className="mt-3 text-center text-[0.95rem] text-ss-muted">
        {sub}
      </p>
      <div className={`mt-8 grid gap-3 ${gridCols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {options.map((o) => (
          <OptionCard
            key={o.value}
            option={o}
            selected={selected === o.value}
            onPick={() => onPick(o.value)}
          />
        ))}
      </div>
    </>
  )
}

function OptionCard({ option, selected, onPick }) {
  const { Icon, label } = option
  return (
    <button
      type="button"
      onClick={onPick}
      className={`group relative flex items-center gap-3.5 rounded-2xl border px-4 py-4 text-left transition md:px-5 ${
        selected
          ? 'border-2 border-ss-teal bg-[rgba(14,122,110,0.06)]'
          : 'border border-ss-border-warm bg-white hover:border-ss-teal/50'
      }`}
    >
      <Icon size={22} className="shrink-0 text-ss-teal" aria-hidden="true" />
      <span className="flex-1 text-[0.95rem] font-medium leading-snug text-ss-text">
        {label}
      </span>
      {selected && (
        <span
          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-ss-green text-white"
          aria-hidden="true"
        >
          <Check size={11} strokeWidth={3.5} />
        </span>
      )}
    </button>
  )
}

function ResultsSummary({ q1, q2, q3, onContinueUpload, onExploreNoFile }) {
  const goalIcon = useMemo(() => (Q1_OPTIONS.find((o) => o.value === q1)?.Icon) || Zap, [q1])
  const literacyIcon = useMemo(() => (Q3_OPTIONS.find((o) => o.value === q3)?.Icon) || Sprout, [q3])
  const GoalIcon = goalIcon
  const LiteracyIcon = literacyIcon

  return (
    <div>
      <h2
        className="text-center font-extrabold leading-tight text-ss-text"
        style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}
      >
        Here is how we&apos;ll personalise your experience
      </h2>
      <div className="mx-auto mt-8 max-w-xl space-y-3">
        <SummaryRow Icon={GoalIcon} label="Your focus" value={GOAL_LABEL[q1] || 'exploring your genome'} />
        <SummaryRow Icon={LiteracyIcon} label="Your experience level" value={LITERACY_LABEL[q3] || '—'} />
        <SummaryRow Icon={Eye} label="We will show you" value={PREFERENCE_LABEL[q2] || '—'} />
      </div>
      <p className="mx-auto mt-5 max-w-lg text-center text-[0.85rem] italic text-ss-muted">
        You can change these preferences any time in your settings.
      </p>
      <div className="mt-7 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onContinueUpload}
          className="inline-flex items-center gap-2 rounded-full bg-ss-green px-8 py-3 text-[0.95rem] font-semibold text-white transition hover:bg-ss-green/90"
        >
          Continue to upload <ArrowRight size={14} />
        </button>
        <button
          type="button"
          onClick={onExploreNoFile}
          className="mt-1 text-[0.9rem] font-semibold text-ss-teal hover:underline"
        >
          Explore without a file →
        </button>
      </div>
    </div>
  )
}

function SummaryRow({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-ss-border-warm bg-white px-4 py-4">
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal"
        aria-hidden="true"
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="font-mono text-[10px] font-bold uppercase text-ss-muted"
          style={{ letterSpacing: '0.14em' }}
        >
          {label}
        </div>
        <div className="text-[0.95rem] font-semibold text-ss-text">
          {value}
        </div>
      </div>
    </div>
  )
}
