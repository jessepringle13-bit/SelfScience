'use client'

// /app/app/my-path/page.js
// The personalized starting curriculum. This is the home screen for a
// Guided user. One dominant action per screen, no dashboard clutter.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Lock, Sparkles, Upload } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import WhyYoureSeeingThis from '@/components/WhyYoureSeeingThis'
import UnknownsPanel from '@/components/UnknownsPanel'
import { usePath, GOALS, modulePathFor, useMode, setMode, useGraduation } from '@/lib/userPath'
import { MODULES, useModuleProgress } from '@/lib/learningModules'

function goalLabel(id) { return (GOALS.find((g) => g.id === id) || {}).label || 'your goal' }

export default function MyPathPage() {
  const router = useRouter()
  const path = usePath()
  const mode = useMode()
  const progress = useModuleProgress()
  const grad = useGraduation()

  if (!path) {
    return (
      <div className="min-h-screen bg-ss-bg">
        <SiteNav />
        <div className="container flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-start justify-center pt-24">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Get Started</div>
          <h1 className="mt-3 text-3xl font-extrabold text-ss-text md:text-4xl">Let’s build your path.</h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ss-muted">A 3-minute quiz lets us teach you what matters to you first — instead of dropping you into a wall of unfamiliar data.</p>
          <Link href="/onboarding/quiz" className="mt-6 inline-flex items-center gap-2 rounded-full bg-ss-teal px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ss-teal-dark">
            Take the quiz <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const chain = modulePathFor(path.primary)
  const nextUnread = chain.find((id) => !progress[id]?.completedAt)
  const doneCount = chain.filter((id) => progress[id]?.completedAt).length
  const pct = Math.round((doneCount / chain.length) * 100)

  return (
    <div className="min-h-screen bg-ss-bg pb-24">
      <SiteNav />
      <div className="container max-w-3xl pt-24 md:pt-28">
        {/* Header */}
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Your Path</div>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-ss-text md:text-4xl">Your path to understanding <span className="text-ss-teal">{goalLabel(path.primary).toLowerCase()}</span>.</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ss-muted">A 3-module foundation, then goal-specific depth. About 2 hours across 3 weeks — taken at your pace.</p>

        {/* Why this matters to you */}
        <section className="mt-8 rounded-2xl border-l-4 border-ss-teal bg-ss-teal/[0.04] p-5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">Why this matters to you</div>
          <p className="mt-2 text-[15px] leading-relaxed text-ss-text">{whyLine(path)}</p>
        </section>

        {/* Progress + Module list */}
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-extrabold text-ss-text">What we’ll teach you first</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-ss-muted">{doneCount} of {chain.length} complete • {pct}%</div>
            </div>
            {nextUnread && (
              <Link href={`/learn/${nextUnread}`} className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-ss-teal-dark">
                {doneCount === 0 ? 'Start module 1' : 'Continue'} <ArrowRight size={13} />
              </Link>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ss-border-warm">
            <div className="h-full bg-ss-green transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <ol className="mt-5 space-y-2">
            {chain.map((id, i) => {
              const m = MODULES.find((x) => x.id === id)
              if (!m) return null
              const done = !!progress[id]?.completedAt
              const isNext = id === nextUnread
              const prevDone = i === 0 || progress[chain[i - 1]]?.completedAt
              const locked = !done && !prevDone
              return (
                <li key={id}>
                  <Link
                    href={locked ? '#' : `/learn/${id}`}
                    onClick={(e) => locked && e.preventDefault()}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                      done ? 'border-ss-green/40 bg-ss-green/[0.04]' :
                      isNext ? 'border-ss-teal bg-white ring-1 ring-ss-teal shadow-sm' :
                      locked ? 'cursor-not-allowed border-ss-border-warm bg-ss-surface opacity-50' :
                              'border-ss-border-warm bg-white hover:border-ss-teal/60'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-bold ${
                      done ? 'bg-ss-green text-white' : locked ? 'bg-ss-border-warm text-ss-muted' : 'bg-ss-teal text-white'
                    }`}>
                      {done ? <Check size={16} /> : locked ? <Lock size={13} /> : (i + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-ss-text">{m.title}</div>
                      <div className="mt-0.5 text-[12.5px] text-ss-muted">{m.subtitle} · <span className="font-mono">{m.readMinutes} min</span></div>
                    </div>
                    {!locked && !done && <ArrowRight size={14} className="text-ss-teal" />}
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>

        {/* What you'll unlock next */}
        {(path.secondary || []).length > 0 && (
          <section className="mt-10 opacity-70">
            <div className="text-lg font-extrabold text-ss-text">What you’ll unlock next</div>
            <div className="mt-2 font-mono text-[10.5px] text-ss-muted">Available after you complete the foundation.</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {path.secondary.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ss-muted">
                  <Lock size={10} /> {goalLabel(s)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Data status */}
        <section className="mt-10">
          <div className="text-lg font-extrabold text-ss-text">Your data situation</div>
          <div className="mt-3 rounded-2xl border border-ss-border-warm bg-white p-5">
            <p className="text-[14px] leading-relaxed text-ss-text">{dataStatusLine(path)}</p>
            {!path.data?.hasGenome && !path.data?.hasBloodwork && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/genome" className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-ss-teal-dark">
                  <Upload size={12} /> Upload your genome
                </Link>
                <Link href="/biomarkers" className="inline-flex items-center gap-1.5 rounded-full border border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white">
                  Enter bloodwork
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Unknowns \u2192 next-best-data. Reads path + progress and surfaces
            the single highest-value data step. */}
        <section className="mt-8">
          <UnknownsPanel />
        </section>

        {/* Explainer */}
        <WhyYoureSeeingThis
          items={[
            `Your primary goal: ${goalLabel(path.primary)}.`,
            `Learning style: ${path.style || 'mixed'} · Literacy: ${path.literacy || 'beginner'}.`,
            'The 3-module foundation is universal — every user starts here regardless of goal, because the mental models apply everywhere.',
          ]}
          improveWith={!path.data?.hasGenome ? 'Uploading your genome unlocks personalized findings after module 2.' : null}
        />

        {/* Graduation nudge */}
        {mode === 'guided' && grad.ready && (
          <section className="mt-12 rounded-2xl border-2 border-ss-green bg-ss-green/[0.05] p-6">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-green"><Sparkles size={11} className="inline" /> Ready when you are</div>
            <h2 className="mt-2 text-xl font-extrabold text-ss-text">You’ve built a real foundation.</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ss-muted">There’s a full research environment waiting — Search, Reading List, Focus Mode, Population Compare, and more. Take a look when you’re ready.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setMode('explorer'); router.push('/') }} className="inline-flex items-center gap-1.5 rounded-full bg-ss-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95">
                Take me to Explorer <ArrowRight size={13} />
              </button>
              <button type="button" onClick={() => setMode('guided')} className="inline-flex items-center rounded-full border border-ss-border-warm bg-white px-4 py-2 text-sm font-semibold text-ss-muted hover:text-ss-text">
                Stay in guided mode
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function whyLine(path) {
  const goal = goalLabel(path.primary).toLowerCase()
  const mot = path.motivation
  if (mot === 'symptom')    return `You said ${goal} matters to you because a symptom brought you here. That framing changes what we teach first: how to interpret data honestly, so you can separate signal from noise before you act.`
  if (mot === 'prevention') return `You’re here to prevent something — which means the game is understanding early signals and building the mental models to spot them. That’s exactly what these first modules do.`
  if (mot === 'family')     return `Family history changes the priors, not the outcome. These modules teach you to read your own biology in that context — without overweighting inherited fear or underweighting real signal.`
  if (mot === 'optimizing') return `Optimizing what already works is a different game than fixing what’s broken. You need sharper interpretation, better data, and less noise. That’s what we’re building.`
  return `Curiosity is the best reason to be here. These first three modules give you the mental models to read your own biology honestly — so every insight later feels earned instead of arbitrary.`
}

function dataStatusLine(path) {
  const g = path.data?.hasGenome, b = path.data?.hasBloodwork
  if (g && b)   return 'You’ve got both a genome file and recent bloodwork. That’s the ideal starting position. Module 3 will show you how these two data types combine.'
  if (g && !b)  return 'You have a genome file. That’s a great start. Module 3 explains why present-state biomarkers usually add more signal than the genome alone for most goals — and which markers matter most for you.'
  if (!g && b)  return 'You have bloodwork. Excellent. Module 2 explains what genes could add — and honestly, where they add less than people expect.'
  return 'You don’t have your data uploaded yet. That’s completely fine — the first three modules teach you what to look for, so when you do bring data in, you’ll actually know what you’re reading.'
}
