'use client'

// /app/app/onboarding/quiz/page.js
// 7-question intent-driven onboarding quiz. Progress dots, one
// dominant action per screen, no back-jumping into completed answers.
// Writes to ss_user_path and routes to /my-path on completion.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, Clock } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { GOALS, LITERACY, MOTIVATIONS, STYLES, CADENCE, savePath, setMode, modulePathFor } from '@/lib/userPath'
import { moduleById } from '@/lib/learningModules'

const STEPS = [
  { key: 'primary',    q: 'What do you most want to understand about your body right now?',       help: 'Pick the one that feels closest — you can add others in a second.', type: 'single-goal' },
  { key: 'secondary',  q: 'And after that?',                                                       help: 'Pick up to three. These become future modules.',                        type: 'multi-goal', max: 3 },
  { key: 'literacy',   q: 'How much do you already know about this?',                              help: 'Honest answers get you better content.',                                type: 'single', options: LITERACY },
  { key: 'data',       q: 'What data do you have right now?',                                      help: 'Anything you can already bring in.',                                    type: 'multi-data' },
  { key: 'motivation', q: 'What’s your motivation?',                                          help: 'This changes how we frame what we teach.',                              type: 'single', options: MOTIVATIONS },
  { key: 'style',      q: 'How do you prefer to learn?',                                           help: 'We’ll match the module format to how you actually read.',           type: 'single', options: STYLES },
  { key: 'cadence',    q: 'How much time can you give this per week?',                             help: 'Sets your rhythm. You can always change it.',                            type: 'single', options: CADENCE },
  // GAP 1: summary preview step — renders the generated path before
  // committing anything to localStorage. savePath() is only called
  // when the user clicks "Start my path" here.
  { key: '_summary',   q: 'Here’s what we built for you.',                                    help: 'Based on your answers, this is the order we’ll take you through SelfScience. You can always change direction later.', type: 'summary' },
]

export default function QuizPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState({ secondary: [], data: [] })

  const current = STEPS[step]
  const isSummary = current.type === 'summary'
  const canNext = (() => {
    if (isSummary) return true
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

        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Step {step + 1} of {STEPS.length}{isSummary ? ' — Review your path' : ''}</div>
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
                    setTimeout(() => setStep(step + 1), 200)
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

          {/* GAP 1: Step 8 summary preview. Shows the generated
              modulePathFor() chain + a data-availability line before
              we commit anything to localStorage. */}
          {isSummary && (
            <SummaryPreview ans={ans} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-ss-muted hover:text-ss-text">
              <ArrowLeft size={13} /> {isSummary ? 'Change my answers' : 'Back'}
            </button>
          ) : <div />}
          {isSummary ? (
            <button
              type="button"
              onClick={finish}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ss-green px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
            >
              Start my path <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-ss-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step === STEPS.length - 2 ? 'Preview my path' : 'Continue'} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// SummaryPreview — Step 8. View-only. Shows the ordered module
// preview chain plus the data situation line. No localStorage writes.
// ----------------------------------------------------------------------
function SummaryPreview({ ans }) {
  const chainIds = modulePathFor(ans.primary || 'genome')
  const chain = chainIds.map((id) => moduleById(id)).filter(Boolean)
  const shown = chain.slice(0, 4)
  const extra = Math.max(0, chain.length - shown.length)

  const dataList = ans.data || []
  const hasGenome = dataList.includes('genome')
  const hasBlood  = dataList.includes('bloodwork')
  const noData    = !hasGenome && !hasBlood

  let dataLine = ''
  let dataTone = 'text-ss-teal'
  if (hasGenome) {
    dataLine = 'Genome file ready — your path includes genomic insights.'
  } else if (noData) {
    dataLine = 'No genetic data yet — your path starts with research. You can add data later.'
    dataTone = 'text-ss-amber'
  }
  if (hasBlood) {
    dataLine = (dataLine ? dataLine + ' + ' : '') + 'Blood data connected.'
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {shown.map((m, i) => (
          <li key={m.id} className="flex items-start gap-3 rounded-xl border border-ss-border-warm bg-white p-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ss-teal font-mono text-[12px] font-bold text-white">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold text-ss-text">{m.title}</span>
              <span className="mt-0.5 block truncate text-[13px] text-ss-muted">{(m.hook || '').split('.')[0]}.</span>
            </span>
          </li>
        ))}
        {extra > 0 && (
          <li className="pl-11 text-[13px] text-ss-muted">+ {extra} more module{extra === 1 ? '' : 's'}</li>
        )}
      </ol>

      {dataLine && (
        <div className={`flex items-center gap-2 rounded-xl border border-ss-border-warm bg-white px-4 py-3 text-[14px] ${dataTone}`}>
          {hasGenome ? <Check size={14} /> : <Clock size={14} />}
          <span className="text-ss-text">{dataLine}</span>
        </div>
      )}
    </div>
  )
}
