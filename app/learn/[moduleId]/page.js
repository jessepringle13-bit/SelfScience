'use client'

// /app/app/learn/[moduleId]/page.js
// Learning module template. Renders any module by id from
// /app/lib/learningModules.js. One dominant action per screen: read,
// then \"Mark as read\" → next module. Preserves scientific character.

import { useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Clock, BookOpen } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import WhyYoureSeeingThis from '@/components/WhyYoureSeeingThis'
import { moduleById, useModuleProgress, markModuleComplete } from '@/lib/learningModules'
import { usePath, GOALS } from '@/lib/userPath'

function goalLabel(id) { return (GOALS.find((g) => g.id === id) || {}).label?.toLowerCase() || 'your goal' }

export default function ModulePage() {
  const { moduleId } = useParams()
  const router = useRouter()
  const m = useMemo(() => moduleById(moduleId), [moduleId])
  const path = usePath()
  const progress = useModuleProgress()
  const done = !!progress[moduleId]?.completedAt

  useEffect(() => { if (typeof window !== 'undefined') window.scrollTo(0, 0) }, [moduleId])

  if (!m) {
    return (
      <div className="min-h-screen bg-ss-bg">
        <SiteNav />
        <div className="container flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
          <h1 className="text-2xl font-bold text-ss-text">Module not found.</h1>
          <Link href="/my-path" className="mt-4 inline-flex items-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white">Back to your path</Link>
        </div>
      </div>
    )
  }

  const nextM = m.nextModuleId ? moduleById(m.nextModuleId) : null
  const gl = goalLabel(path?.primary)

  const complete = () => {
    markModuleComplete(m.id)
    if (nextM) router.push(`/learn/${nextM.id}`)
    else router.push('/my-path')
  }

  return (
    <div className="min-h-screen bg-ss-bg pb-24">
      <SiteNav />
      <div className="container max-w-2xl pt-24 md:pt-28">
        {/* Breadcrumb */}
        <Link href="/my-path" className="inline-flex items-center gap-1 font-mono text-[11px] text-ss-muted hover:text-ss-teal">
          <ArrowLeft size={11} /> Your path
        </Link>

        {/* Header */}
        <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-ss-muted">
          <BookOpen size={11} className="text-ss-teal" />
          <span className="font-bold uppercase tracking-[0.14em] text-ss-teal">Module {m.order} of 3</span>
          <span className="text-ss-border-warm">·</span>
          <Clock size={10} /><span>{m.readMinutes} min read</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ss-text md:text-[2.5rem]">{m.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ss-muted">{m.subtitle}</p>

        {/* HOOK */}
        <section className="mt-8 border-l-4 border-ss-teal pl-4">
          <p className="text-[17px] font-medium leading-[1.65] text-ss-text">{m.hook}</p>
        </section>

        {/* WHY */}
        <section className="mt-8">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">Why this matters to you</div>
          <p className="mt-2 text-[15.5px] leading-[1.75] text-ss-text">{m.why(gl)}</p>
        </section>

        {/* MENTAL MODEL */}
        <section className="mt-10 rounded-2xl bg-ss-teal/[0.04] p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">The mental model</div>
          <h2 className="mt-2 text-xl font-extrabold text-ss-text">{m.mentalModel.heading}</h2>
          <p className="mt-3 text-[15px] leading-[1.75] text-ss-text">{m.mentalModel.body}</p>
        </section>

        {/* DATA SHOWS */}
        <section className="mt-10">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">What your data could show</div>
          <ul className="mt-3 space-y-2.5">
            {m.dataShows.map((d, i) => (
              <li key={i} className="flex flex-col gap-1 rounded-xl border border-ss-border-warm bg-white p-4 md:flex-row md:items-baseline md:gap-4">
                <div className="shrink-0 md:w-52 text-[13.5px] font-bold text-ss-teal">{d.label}</div>
                <div className="text-[13.5px] leading-relaxed text-ss-text">{d.role}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* MISCONCEPTIONS */}
        <section className="mt-10">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">Common misconceptions</div>
          <ul className="mt-3 space-y-3">
            {m.misconceptions.map((mm, i) => (
              <li key={i} className="rounded-xl border border-ss-border-warm bg-white p-4">
                <div className="text-[13px] font-semibold text-ss-muted line-through">Myth: {mm.myth}</div>
                <div className="mt-1 text-[14px] font-bold text-ss-text">Truth: {mm.truth}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* NEXT STEP + COMPLETE */}
        <section className="mt-12 rounded-2xl border-2 border-ss-teal bg-white p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">What to do with this</div>
          <p className="mt-2 text-[15px] leading-relaxed text-ss-text">{m.nextStep}</p>
          <button
            type="button"
            onClick={complete}
            className={`mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-sm transition ${
              done ? 'bg-ss-green text-white' : 'bg-ss-teal text-white hover:bg-ss-teal-dark'
            }`}
          >
            {done ? <><Check size={14} /> Marked as read</> : (
              nextM ? <>Mark as read → module {nextM.order} <ArrowRight size={14} /></> : <><Check size={14} /> Mark as read • finish path</>
            )}
          </button>
        </section>

        {/* Sources */}
        {m.sources?.length > 0 && (
          <section className="mt-8">
            <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-ss-muted">Sources</div>
            <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-ss-muted">
              {m.sources.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </section>
        )}

        <WhyYoureSeeingThis
          items={[
            `Module ${m.order} of your foundation path.`,
            `Universal to every user — the mental model applies before goal-specific content.`,
            path?.literacy ? `Copy tone calibrated for: ${path.literacy}.` : null,
          ].filter(Boolean)}
        />
      </div>
    </div>
  )
}
