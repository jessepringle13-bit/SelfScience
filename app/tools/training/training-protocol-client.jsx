'use client'

// /app/app/tools/training/training-protocol-client.jsx
// Training Protocol Engine — Phase 1 client.
//
// FLOW:
//   1. Load genome + biomarker availability from storage.
//   2. Show intake form.
//   3. On submit → build profile + summary + alternatives + blueprint + sessions.
//   4. Show tabbed protocol view: Overview / Blueprint / Workouts.
//
// All state lives on the device — no backend writes.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, RefreshCw, Save, Printer, Dna, ClipboardList,
  ArrowLeft, Activity, Info,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'

import { getGenomeResults } from '@/lib/genomeSession'
import { getBiomarkerValues } from '@/lib/biomarkersSession'
import { buildTrainingProfile, TRAINING_VARIANTS, CATEGORY_META } from '@/lib/training/variants'
import { buildTrainingSummary } from '@/lib/training/summary'
import { buildSmartAlternatives } from '@/lib/training/alternatives'
import { buildWeeklyBlueprint } from '@/lib/training/blueprint'
import { saveTrainingProtocol, loadTrainingProtocol } from '@/lib/training/intake'

import TrainingIntakeForm from '@/components/training/IntakeForm'
import VariantCard from '@/components/training/VariantCard'
import WeeklyBlueprint from '@/components/training/WeeklyBlueprint'
import SmartAlternatives from '@/components/training/SmartAlternatives'
import WorkoutSession from '@/components/training/WorkoutSession'
import TabNav from '@/components/training/TabNav'

export default function TrainingProtocolClient() {
  const [ready, setReady] = useState(false)
  const [genome, setGenome] = useState(null)
  const [labs, setLabs] = useState({})

  const [intake, setIntake] = useState(null)
  const [protocol, setProtocol] = useState(null)  // { summary, profile, alternatives, blueprint, sessions }
  const [buildingSessions, setBuildingSessions] = useState(false)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    setGenome(getGenomeResults())
    setLabs(getBiomarkerValues() || {})
    const saved = loadTrainingProtocol()
    if (saved) {
      setProtocol(saved)
      setTab('overview')
    }
    setReady(true)
  }, [])

  const hasGenome = !!(genome?._variants && Object.keys(genome._variants).length)
  const hasBiomarkers = !!(labs && Object.values(labs).some((v) => v !== '' && v != null && Number.isFinite(Number(v))))

  const profile = useMemo(() => (
    hasGenome ? buildTrainingProfile(genome._variants) : { cards: TRAINING_VARIANTS.map((v) => ({ covered: false, ...v })), tags: [], coverage: { covered: 0, total: TRAINING_VARIANTS.length } }
  ), [genome, hasGenome])

  const handleGenerate = async (submittedIntake) => {
    setIntake(submittedIntake)
    setBuildingSessions(true)

    const summary      = buildTrainingSummary(profile)
    const alternatives = buildSmartAlternatives(submittedIntake, profile)
    const blueprint    = buildWeeklyBlueprint(submittedIntake, profile)

    // Fetch exercises for each strength/skill session.
    const sessions = await fetchAllSessions(blueprint, submittedIntake, profile)

    const nextProto = {
      summary, profile, alternatives, blueprint, sessions,
      intake: submittedIntake,
      generatedAt: new Date().toISOString(),
    }
    setProtocol(nextProto)
    saveTrainingProtocol(nextProto)
    setBuildingSessions(false)
    setTab('overview')
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60)
  }

  const handleRegenerate = () => {
    setProtocol(null)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60)
  }

  const handleSave = () => {
    if (!protocol) return
    saveTrainingProtocol(protocol)
    alert('Protocol saved to this device.')
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') setTimeout(() => window.print(), 50)
  }

  // ------------ Render ------------

  return (
    <div className="min-h-screen bg-ss-bg">
      <div className="ss-screen-only no-print">
        <SiteNav />
      </div>

      <div className="container pt-8 pb-24">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
            <Activity size={14} /> Training Protocol Engine
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
            A training plan built from <span className="text-ss-orange">your genome</span> — not a template.
          </h1>
          <p className="mt-2 max-w-3xl text-ss-muted">
            SelfScience reads your genetic variants, respects the sport you already love, and generates a full weekly protocol — workouts, sets, reps, rest, and coaching cues, keyed to your body's actual biology. Everything stays on your device.
          </p>
        </div>

        {/* ---------- Empty state / Intake ---------- */}
        {ready && !protocol && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrainingIntakeForm
                hasGenome={hasGenome}
                hasBiomarkers={hasBiomarkers}
                onChange={setIntake}
                onSubmit={handleGenerate}
              />
            </div>
            <div className="flex flex-col gap-4">
              <PhilosophyCard />
              {!hasGenome && <NoGenomeHint />}
            </div>
          </div>
        )}

        {buildingSessions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
              <Sparkles size={22} className="mx-auto text-ss-orange animate-pulse" />
              <div className="mt-2 text-sm font-extrabold text-ss-teal">Building your protocol…</div>
              <div className="text-[11px] text-ss-muted">Reading variants · selecting exercises · personalising cues</div>
            </div>
          </div>
        )}

        {/* ---------- Protocol output ---------- */}
        {ready && protocol && (
          <div>
            {/* Action bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ss-border-warm bg-white p-3 shadow-sm ss-screen-only no-print">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-ss-muted">
                <ClipboardList size={12} className="text-ss-teal" />
                <span>
                  Generated {new Date(protocol.generatedAt).toLocaleDateString()} ·
                  {' '}<span className="font-semibold text-ss-teal">{protocol.profile?.coverage?.covered}/{protocol.profile?.coverage?.total}</span> variants covered · goal: <span className="font-semibold text-ss-teal">{(protocol.intake?.goals || []).join(', ') || '—'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSave} className="inline-flex items-center gap-1 rounded-full border border-ss-teal px-3 py-1.5 text-[11px] font-semibold text-ss-teal transition hover:bg-ss-teal/10">
                  <Save size={11} /> Save
                </button>
                <button onClick={handleRegenerate} className="inline-flex items-center gap-1 rounded-full border border-ss-orange px-3 py-1.5 text-[11px] font-semibold text-ss-orange transition hover:bg-ss-orange/10">
                  <RefreshCw size={11} /> Regenerate
                </button>
                <button onClick={handlePrint} className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110">
                  <Printer size={11} /> Print
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="ss-screen-only no-print">
              <TabNav
                tabs={[
                  { id: 'overview',  label: 'Overview' },
                  { id: 'profile',   label: 'Genetic Profile' },
                  { id: 'blueprint', label: 'Weekly Blueprint' },
                  { id: 'workouts',  label: 'Workouts' },
                ]}
                active={tab}
                onChange={setTab}
              />
            </div>

            {/* ------------ OVERVIEW ------------ */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* 3A summary */}
                {protocol.summary && (
                  <div className="rounded-2xl border-l-4 border-ss-teal bg-white p-5 shadow-sm">
                    <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">3A · Your Genetic Training Summary</div>
                    <p className="text-[13.5px] leading-relaxed text-ss-text">{protocol.summary}</p>
                  </div>
                )}

                {/* 3B smart alternatives */}
                <div>
                  <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">3B · Smart Alternative Suggestions</div>
                  <SmartAlternatives result={protocol.alternatives} />
                </div>

                {/* Snapshot of blueprint */}
                <div>
                  <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">3C · Weekly Blueprint (snapshot)</div>
                  <WeeklyBlueprint blueprint={protocol.blueprint} />
                </div>

                {/* Coming in Phase 2 */}
                <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white/50 p-4 text-[11px] italic text-ss-muted">
                  <Info size={12} className="mr-1 inline text-ss-teal" />
                  Coming in the next release: dedicated Stretching &amp; Mobility, Recovery, Supplements (tuned to your PGx), Equipment, Metrics-to-Track, and a shareable Coach summary tab.
                </div>
              </div>
            )}

            {/* ------------ GENETIC PROFILE ------------ */}
            {tab === 'profile' && (
              <div>
                <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">
                  Genetic Training Profile · {protocol.profile.coverage.covered}/{protocol.profile.coverage.total} variants covered
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {protocol.profile.cards.map((c) => <VariantCard key={c.rsid} card={c} />)}
                </div>
                {!hasGenome && (
                  <div className="mt-4 rounded-2xl border border-dashed border-ss-border-warm bg-white p-4 text-center">
                    <Dna size={20} className="mx-auto text-ss-teal" />
                    <div className="mt-2 text-sm font-semibold text-ss-teal">Upload your genome to unlock deeper personalisation</div>
                    <Link href="/genome" className="mt-2 inline-flex items-center gap-1 rounded-full bg-ss-teal px-3 py-1.5 text-[11px] font-semibold text-white">
                      Upload genome →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ------------ WEEKLY BLUEPRINT ------------ */}
            {tab === 'blueprint' && (
              <div className="space-y-4">
                <WeeklyBlueprint blueprint={protocol.blueprint} />
                <div className="rounded-xl border border-ss-border-warm bg-white p-4 text-[12px] leading-relaxed text-ss-text">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">How this was decided</div>
                  <div className="mt-1 text-ss-muted">
                    Days come from your intake ({protocol.intake?.daysPerWeek}×/week, ~{protocol.blueprint?.days?.[0]?.duration}). Types come from your goals ({(protocol.intake?.goals || []).join(', ') || '—'}). Your genome nudges the mix: {formatTags(protocol.profile.tags)}.
                  </div>
                </div>
              </div>
            )}

            {/* ------------ WORKOUTS ------------ */}
            {tab === 'workouts' && (
              <div className="space-y-4">
                {protocol.sessions?.map((s, i) => (
                  <WorkoutSession key={i} session={s} equipment={protocol.intake?.equipment} level={protocol.intake?.experienceLevel} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------- Helpers --------------------

async function fetchAllSessions(blueprint, intake, profile) {
  if (!blueprint?.days) return []
  const out = []
  for (const d of blueprint.days) {
    out.push(await fetchOneSession(d, intake, profile))
  }
  return out
}

async function fetchOneSession(day, intake, profile) {
  const dayMuscles = ({
    strength_upper: ['chest', 'back', 'shoulders', 'arms'],
    strength_lower: ['legs', 'glutes', 'quadriceps', 'hamstrings', 'calves'],
    strength_full:  ['legs', 'chest', 'back', 'core'],
    strength_push:  ['chest', 'shoulders', 'triceps'],
    strength_pull:  ['back', 'biceps'],
    intervals:      ['legs'],
    skill_power:    ['legs', 'core'],
    mobility:       ['back', 'legs', 'shoulders'],
  })[day.type] || []

  if (!dayMuscles.length) {
    // Non-exercise day: return a static prescription client-side.
    return staticSession(day)
  }

  const tags = new Set(profile?.tags || [])
  const heavyCap = tags.has('injury_risk_high') || tags.has('volume_over_intensity')
  const level = intake?.experienceLevel
  const beginnerish = ['beginner', 'youth', 'recreational'].includes(level)

  const equipment = (intake?.equipment || []).join(',')

  const exercises = []
  const usedIds = new Set()
  for (const m of dayMuscles) {
    const params = new URLSearchParams({ muscle: m, equipment, limit: '6', level })
    if (usedIds.size) params.append('exclude', Array.from(usedIds).join(','))
    let items = []
    try {
      const res = await fetch(`/api/training/exercises?${params.toString()}`)
      const data = await res.json()
      items = data?.items || []
    } catch { /* noop */ }
    if (!items.length) continue
    const compound  = items.find((i) => i.mechanic === 'compound')
    const isolation = items.find((i) => i.mechanic !== 'compound' && i.id !== compound?.id)
    for (const e of [compound, isolation]) {
      if (!e) continue
      usedIds.add(e.id)
      exercises.push({
        ...e,
        targetMuscle: m,
        sets: beginnerish ? 3 : 4,
        reps: heavyCap ? '6\u201310' : (beginnerish ? '8\u201312' : '5\u20138'),
        rest: heavyCap ? '90 s' : '2\u20133 min',
        tempo: '2-1-2-0',
        cues: geneticCues(day.type, tags),
      })
    }
    if (exercises.length >= 6) break
  }

  return {
    day: day.day, type: day.type, label: day.label,
    duration: day.duration,
    exercises: exercises.slice(0, 6),
  }
}

function staticSession(day) {
  if (day.type === 'zone2_cardio') {
    return {
      day: day.day, type: day.type, label: day.label, duration: day.duration,
      cardio: { targetHR: '60\u201370 % of max HR', talkTest: 'You can hold a conversation but not sing.' },
    }
  }
  if (day.type === 'intervals') {
    return {
      day: day.day, type: day.type, label: day.label, duration: day.duration,
      prescription: { sets: 6, reps: '30 s hard / 60 s easy' },
    }
  }
  if (day.type === 'active_recovery') {
    return {
      day: day.day, type: day.type, label: day.label, duration: day.duration,
      recovery: { modalities: ['Easy walk', 'Gentle swim', 'Yin yoga', 'Foam rolling + mobility'], duration: '20\u201330 min', intensity: 'HR stays below 60 % of max.' },
    }
  }
  return {
    day: day.day, type: day.type, label: day.label, duration: day.duration,
    rest: { notes: 'Sleep 7\u20139 h. Prioritise food quality + hydration. Walking counts as “rest” if you enjoy it.' },
  }
}

function geneticCues(dayType, tags) {
  const cues = []
  if (tags.has('injury_risk_high')) {
    if (['strength_lower', 'strength_full'].includes(dayType)) cues.push('COL5A1 TT: joint tracking matters more than load — depth and alignment first.')
    if (['strength_upper', 'strength_push', 'strength_pull'].includes(dayType)) cues.push('Warm up shoulders / elbows with bands — collagen protocol 30\u201360 min pre-session.')
  }
  if (tags.has('volume_over_intensity')) cues.push('Slow-twitch bias: aim for the top of the rep range with tight form rather than adding load.')
  if (tags.has('power') && dayType === 'skill_power') cues.push('ACTN3 RR: your fast-twitch profile responds to intent — move the load fast, not just heavy.')
  return cues
}

function formatTags(tags) {
  const LABELS = {
    injury_risk_high: 'connective-tissue caution',
    injury_risk_moderate: 'moderate connective-tissue caution',
    endurance_bias: 'endurance bias',
    endurance_volume_high: 'higher aerobic volume required',
    endurance_responder: 'strong aerobic responder',
    power: 'power bias',
    strength_bias: 'strength bias',
    volume_over_intensity: 'volume-first strength approach',
    no_backtoback_hard: 'no back-to-back hard days',
    sleep_critical: 'sleep is a training variable',
    recovery_priority: 'recovery-first structuring',
    collagen_protocol: 'collagen protocol pre-session',
    fuel_before_training: 'small carb feed before AM training',
    no_fasted_hard: 'no fasted hard training',
    aerobic_before_skill: 'aerobic warm-up before skill work',
    caffeine_ok: 'caffeine tolerated as ergogenic aid',
    caffeine_limit: 'caffeine capped',
  }
  const active = tags.map((t) => LABELS[t]).filter(Boolean)
  return active.length ? active.slice(0, 4).join(', ') : 'no specific nudges'
}

// ------ Sidebar cards ------

function PhilosophyCard() {
  return (
    <div className="rounded-2xl border-l-4 border-ss-orange bg-white p-4 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-orange">Our promise</div>
      <div className="mt-1 text-[12px] leading-relaxed text-ss-text">
        This tool <span className="font-semibold">never</span> tells you to stop doing what you love. If your genes create injury risk in your sport, we show you how to keep doing it — smarter, safer, longer.
      </div>
    </div>
  )
}

function NoGenomeHint() {
  return (
    <div className="rounded-2xl border border-ss-border-warm bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-teal">
        <Dna size={12} /> Deeper personalisation
      </div>
      <div className="mt-1 text-[12px] leading-relaxed text-ss-text">
        You can generate a full protocol from your intake alone. Upload your genome to unlock variant-specific fibre-type, injury-risk, and recovery adjustments.
      </div>
      <Link href="/genome" className="mt-3 inline-flex items-center gap-1 rounded-full bg-ss-teal px-3 py-1.5 text-[11px] font-semibold text-white">
        <ArrowLeft size={11} className="rotate-180" /> Upload genome
      </Link>
    </div>
  )
}
