'use client'

// /app/app/onboarding/quiz/page.js
// 7-question intent-driven onboarding quiz. Progress dots, one
// dominant action per screen, no back-jumping into completed answers.
// Writes to ss_user_path and routes to /my-path on completion.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { GOALS, LITERACY, MOTIVATIONS, STYLES, CADENCE, savePath, setMode } from '@/lib/userPath'

const STEPS = [
  { key: 'primary',    q: 'What do you most want to understand about your body right now?',       help: 'Pick the one that feels closest — you can add others in a second.', type: 'single-goal' },
  { key: 'secondary',  q: 'And after that?',                                                       help: 'Pick up to three. These become future modules.',                        type: 'multi-goal', max: 3 },
  { key: 'literacy',   q: 'How much do you already know about this?',                              help: 'Honest answers get you better content.',                                type: 'single', options: LITERACY },
  { key: 'data',       q: 'What data do you have right now?',                                      help: 'Anything you can already bring in.',                                    type: 'multi-data' },
  { key: 'motivation', q: 'What’s your motivation?',                                          help: 'This changes how we frame what we teach.',                              type: 'single', options: MOTIVATIONS },
  { key: 'style',      q: 'How do you prefer to learn?',                                           help: 'We’ll match the module format to how you actually read.',           type: 'single', options: STYLES },
  { key: 'cadence',    q: 'How much time can you give this per week?',                             help: 'Sets your rhythm. You can always change it.',                            type: 'single', options: CADENCE },
]

export default function QuizPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState({ secondary: [], data: [] })

  const current = STEPS[step]
  const canNext = (() => {
    if (current.type === 'single' || current.type === 'single-goal') return !!ans[current.key]
    if (current.type === 'multi-goal') return (ans.secondary || []).length >= 1
    if (current.type === 'multi-data') return true // "neither yet" is a valid pass
    return false
  })()

  const finish = () => {
    const path = {
      primary: ans.primary,
      secondary: ans.secondary || [],
      literacy: ans.literacy,
      data: {
        hasGenome:    (ans.data || []).includes('genome'),
        hasBloodwork: (ans.data || []).includes('bloodwork'),
        unsure:       (ans.data || []).includes('unsure'),
      },
      motivation: ans.motivation,
      style: ans.style,
      cadence: ans.cadence,
      completedAt: new Date().toISOString(),
    }
    savePath(path)
    setMode('guided')
    router.push('/my-path')
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish()
  }

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />
      <div className="container flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center pt-24 pb-16">
        {/* Progress dots */}
        <div className="mb-8 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-ss-teal' : 'bg-ss-border-warm'}`} />
          ))}
        </div>

        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Step {step + 1} of {STEPS.length}</div>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ss-text md:text-4xl">{current.q}</h1>
        <p className="mt-2 text-[14px] text-ss-muted">{current.help}</p>

        <div className="mt-8">
          {(current.type === 'single-goal' || current.type === 'multi-goal') && (
            <div className="grid gap-2 md:grid-cols-2">
              {GOALS.map((g) => {
                const key = current.type === 'single-goal' ? 'primary' : 'secondary'
                const selected = current.type === 'single-goal' ? ans.primary === g.id : (ans.secondary || []).includes(g.id)
                const disable = current.type === 'multi-goal' && !selected && (ans.secondary || []).length >= (current.max || 3)
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={disable}
                    onClick={() => {
                      if (current.type === 'single-goal') {
                        setAns({ ...ans, primary: g.id })
                        setTimeout(() => setStep(step + 1), 250)
                      } else {
                        const cur = ans.secondary || []
                        const nxt = selected ? cur.filter((x) => x !== g.id) : [...cur, g.id]
                        setAns({ ...ans, secondary: nxt })
                      }
                    }}
                    className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${
                      selected ? 'border-ss-teal bg-ss-teal/[0.06] ring-1 ring-ss-teal' : 'border-ss-border-warm bg-white hover:border-ss-teal/60'
                    } ${disable ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    <span className="text-[14.5px] font-bold text-ss-text">{g.label}</span>
                    <span className="text-[11.5px] text-ss-muted">{g.hint}</span>
                  </button>
                )
              })}
            </div>
          )}

          {current.type === 'single' && (
            <div className="space-y-2">
              {current.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setAns({ ...ans, [current.key]: o.id })
                    setTimeout(() => (step < STEPS.length - 1 ? setStep(step + 1) : finish()), 200)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                    ans[current.key] === o.id ? 'border-ss-teal bg-ss-teal/[0.06]' : 'border-ss-border-warm bg-white hover:border-ss-teal/60'
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    ans[current.key] === o.id ? 'border-ss-teal bg-ss-teal' : 'border-ss-border-warm'
                  }`}>
                    {ans[current.key] === o.id && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <span className="text-[14px] font-semibold text-ss-text">{o.label}</span>
                </button>
              ))}
            </div>
          )}

          {current.type === 'multi-data' && (
            <div className="space-y-2">
              {[
                { id: 'genome',    label: 'Genome file (23andMe, AncestryDNA, etc.)' },
                { id: 'bloodwork', label: 'Recent bloodwork (CBC, CMP, lipid panel...)' },
                { id: 'neither',   label: 'Neither yet' },
                { id: 'unsure',    label: 'Not sure' },
              ].map((o) => {
                const sel = (ans.data || []).includes(o.id)
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      const cur = ans.data || []
                      const nxt = sel ? cur.filter((x) => x !== o.id) : [...cur, o.id]
                      setAns({ ...ans, data: nxt })
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                      sel ? 'border-ss-teal bg-ss-teal/[0.06]' : 'border-ss-border-warm bg-white hover:border-ss-teal/60'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                      sel ? 'border-ss-teal bg-ss-teal text-white' : 'border-ss-border-warm'
                    }`}>
                      {sel && '✓'}
                    </span>
                    <span className="text-[14px] font-semibold text-ss-text">{o.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-ss-muted hover:text-ss-text">
              <ArrowLeft size={13} /> Back
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-ss-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === STEPS.length - 1 ? 'Build my path' : 'Continue'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
