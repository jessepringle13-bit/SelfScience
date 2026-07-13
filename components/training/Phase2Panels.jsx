'use client'

// /app/components/training/Phase2Panels.jsx
// All Phase 2 UI panels — Mobility, Recovery, Supplements, Equipment,
// Metrics, Goals, Beginner, Youth, Coach Share.
// Kept in a single file to avoid file explosion; each panel exported.

import {
  Wind, Moon, Pill, Wrench, LineChart, Target, GraduationCap,
  Shield, Users, AlertCircle, CheckCircle2, Clock, Info, Sparkles,
} from 'lucide-react'
import { EVIDENCE_LEVELS } from '@/lib/training/supplements'
import { PRIORITY_META } from '@/lib/training/equipment'
import { OnlyFull, useViewMode } from '@/lib/training/viewMode'

// ─────────────────── Small primitives ───────────────────

function Panel({ icon: Icon, title, eyebrow, accent = '#0F766E', children }) {
  // Build a subtle diagonal gradient tinted with the section's accent so each
  // tab has its own clear visual identity. Border is a stronger accent tint
  // so the card lifts off the page.
  const bg = `linear-gradient(135deg, ${accent}0F 0%, #FFFFFF 55%, ${accent}08 100%)`
  return (
    <div
      className="rounded-2xl border-2 p-5 shadow-md avoid-break"
      style={{ background: bg, borderColor: `${accent}55` }}
    >
      <div
        className="mb-4 -mx-5 -mt-5 rounded-t-2xl px-5 py-3"
        style={{ background: `${accent}15`, borderBottom: `2px solid ${accent}30` }}
      >
        <div className="text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>{eyebrow}</div>
        <h2 className="mt-0.5 flex items-center gap-2 text-lg font-extrabold" style={{ color: accent }}>
          <Icon size={18} /> {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function Sub({ children }) {
  return <h3 className="mt-4 text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">{children}</h3>
}

function Callout({ tone = 'teal', icon: Icon, children }) {
  const bg = tone === 'orange' ? 'bg-orange-50 border-orange-300 text-ss-text' : tone === 'amber' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-ss-teal/5 border-ss-teal/40 text-ss-text'
  return (
    <div className={`mt-2 flex items-start gap-2 rounded border-l-4 p-3 text-[11.5px] leading-relaxed ${bg}`}>
      {Icon && <Icon size={13} className="mt-0.5 shrink-0" />}
      <div>{children}</div>
    </div>
  )
}

// ─────────────────── 3E · Mobility ───────────────────

export function MobilityPanel({ mobility }) {
  if (!mobility) return null
  const days = [
    { key: 'upper',     label: 'Upper-body strength days' },
    { key: 'lower',     label: 'Lower-body strength days' },
    { key: 'full',      label: 'Full-body / power days' },
    { key: 'cardio',    label: 'Zone 2 cardio days' },
    { key: 'intervals', label: 'Interval / threshold days' },
  ]
  return (
    <Panel icon={Wind} title="Stretching & Mobility Protocol" eyebrow="3E" accent="#0EA5A4">
      {mobility.note && <Callout tone="orange" icon={AlertCircle}><span className="font-semibold">{mobility.note}</span></Callout>}

      <OnlyFull>
      {days.map(({ key, label }) => (
        <div key={key} className="mt-4 avoid-break">
          <Sub>{label}</Sub>
          <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ss-orange">Pre-training warm-up (5–10 min)</div>
              <ul className="mt-1 space-y-0.5 text-[11.5px] text-ss-text">
                {mobility.perDay[key].warmup.map((m, i) => (
                  <li key={i} className="flex justify-between border-b border-ss-border-warm/40 py-0.5">
                    <span>{m.name}</span>
                    <span className="text-ss-muted">{m.reps}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ss-orange">Post-training cool-down (10–15 min)</div>
              <ul className="mt-1 space-y-0.5 text-[11.5px] text-ss-text">
                {mobility.perDay[key].cooldown.map((m, i) => (
                  <li key={i} className="border-b border-ss-border-warm/40 py-0.5">
                    <div className="flex justify-between">
                      <span>{m.name}</span>
                      <span className="text-ss-muted">{m.hold}</span>
                    </div>
                    <div className="text-[10px] italic text-ss-muted">Feel: {m.feel}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
      </OnlyFull>

      <Sub>Weekly full-body mobility session (20–30 min)</Sub>
      <p className="mt-1 text-[11px] italic text-ss-muted">Slot into one rest / active-recovery day per week. Do slowly. Breathe.</p>
      <ul className="mt-1 grid grid-cols-1 gap-x-6 text-[11.5px] text-ss-text md:grid-cols-2">
        {mobility.weekly.map((m, i) => (
          <li key={i} className="flex justify-between border-b border-ss-border-warm/40 py-0.5">
            <span>{m.name}</span>
            <span className="text-ss-muted">{m.reps}</span>
          </li>
        ))}
      </ul>

      {mobility.connective && (
        <div className="mt-6 rounded border-2 border-ss-orange bg-orange-50 p-3">
          <Sub>Connective-tissue specific block (COL5A1 TT / MMP3 high)</Sub>
          <p className="mt-1 text-[11px] italic text-ss-text">Eccentric loading is the primary evidence-based intervention for tendon adaptation. Do these — do not skip them.</p>
          <div className="mt-2 space-y-2">
            {mobility.connective.map((c, i) => (
              <div key={i} className="rounded border border-ss-border-warm bg-white p-2">
                <div className="text-[12px] font-semibold text-ss-teal">{c.name}</div>
                <div className="mt-0.5 grid grid-cols-1 gap-x-4 text-[11px] text-ss-text sm:grid-cols-4">
                  <span><span className="font-semibold">Prescription:</span> {c.prescription}</span>
                  <span><span className="font-semibold">Tempo:</span> {c.tempo}</span>
                  <span><span className="font-semibold">Frequency:</span> {c.frequency}</span>
                </div>
                <div className="mt-1 text-[11px] italic text-ss-muted">{c.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}

// ─────────────────── 3F · Recovery ───────────────────

export function RecoveryPanel({ recovery }) {
  if (!recovery) return null
  return (
    <Panel icon={Moon} title="Recovery Protocol" eyebrow="3F" accent="#7C3AED">
      <Sub>Active recovery — pick one on scheduled days</Sub>
      <p className="mt-1 text-[11px] italic text-ss-muted">{recovery.activeRecovery.principle}</p>
      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
        {recovery.activeRecovery.modalities.map((m, i) => (
          <div key={i} className="rounded border border-ss-border-warm bg-ss-bg/30 p-2">
            <div className="text-[12px] font-semibold text-ss-teal">{m.name}</div>
            <div className="text-[10.5px] text-ss-muted">{m.dose}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-ss-text">{m.note}</div>
          </div>
        ))}
      </div>

      <Sub>Sleep as a training variable</Sub>
      <div className="mt-1 grid grid-cols-2 gap-3 text-[11.5px] text-ss-text">
        <div><span className="font-semibold text-ss-teal">Duration:</span> {recovery.sleep.duration}</div>
        <div><span className="font-semibold text-ss-teal">Timing:</span> {recovery.sleep.timing}</div>
      </div>
      <OnlyFull>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[11.5px] text-ss-text">
          {recovery.sleep.protocol.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </OnlyFull>
      {recovery.sleep.genotypeNotes.map((n, i) => (
        <Callout key={i} tone="orange" icon={AlertCircle}><span className="font-semibold">Genotype note:</span> {n}</Callout>
      ))}

      <Sub>Heart-rate variability (HRV) and daily readiness</Sub>
      <OnlyFull>
        <p className="mt-1 text-[11.5px] text-ss-text">{recovery.hrv.summary}</p>
      </OnlyFull>
      <div className="mt-2 space-y-1 text-[11.5px]">
        <div><span className="font-semibold text-ss-teal">Rule:</span> {recovery.hrv.rule}</div>
        <OnlyFull>
          <div><span className="font-semibold text-ss-teal">Baseline:</span> {recovery.hrv.baseline}</div>
          <div><span className="font-semibold text-ss-teal">Tools:</span> {recovery.hrv.tools}</div>
        </OnlyFull>
      </div>

      <Sub>Deload cadence</Sub>
      <div className="mt-1 space-y-1 text-[11.5px]">
        <div><span className="font-semibold text-ss-teal">Cadence:</span> {recovery.deload.cadence}</div>
        <OnlyFull>
          <div><span className="font-semibold text-ss-teal">Protocol:</span> {recovery.deload.protocol}</div>
          <div className="italic text-ss-muted">{recovery.deload.reason}</div>
        </OnlyFull>
      </div>
    </Panel>
  )
}

// ─────────────────── 3G · Supplements ───────────────────

export function SupplementPanel({ supplements }) {
  if (!supplements?.length) {
    return (
      <Panel icon={Pill} title="Supplement Protocol" eyebrow="3G" accent="#059669">
        <div className="rounded border border-dashed border-ss-border-warm/70 p-3 text-center text-[11.5px] italic text-ss-muted">
          No supplements are flagged for your current profile. Your training goals and genome do not call for additions beyond standard nutrition.
        </div>
      </Panel>
    )
  }
  return (
    <Panel icon={Pill} title="Supplement Protocol" eyebrow="3G" accent="#059669">
      <p className="text-[11.5px] italic text-ss-muted">
        Each supplement below is included because a rule fired on your genotype, goals, or biomarker signal — not because it is on a general recommendation list.
      </p>
      <div className="mt-3 space-y-3">
        {supplements.map((s) => {
          const ev = EVIDENCE_LEVELS[s.evidence] || EVIDENCE_LEVELS.emerging
          return (
            <div key={s.id} className="rounded-xl border border-ss-border-warm bg-white p-4 avoid-break">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[13px] font-extrabold text-ss-teal">{s.name}</div>
                  <OnlyFull>
                    <div className="mt-0.5 text-[11px] italic text-ss-muted">{s.form}</div>
                  </OnlyFull>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: ev.color }}>
                  {ev.label} evidence
                </span>
              </div>
              <OnlyFull>
                <div className="mt-2 text-[11.5px] leading-relaxed text-ss-text">{s.reasoning}</div>
              </OnlyFull>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">
                <div><span className="font-semibold text-ss-teal">Dose:</span> {s.dose}</div>
                <div><span className="font-semibold text-ss-teal">Timing:</span> {s.timing}</div>
                <OnlyFull>
                  <div className="sm:col-span-2"><span className="font-semibold text-ss-teal">What to expect:</span> {s.expect}</div>
                </OnlyFull>
              </div>
              <OnlyFull>
                <div className="mt-1 text-[11px] text-ss-muted"><span className="font-semibold">Watch:</span> {s.watch}</div>
              </OnlyFull>
            </div>
          )
        })}
      </div>
      <Callout tone="amber" icon={AlertCircle}>
        These are educational recommendations, not medical prescriptions. Discuss any new supplement with your physician or pharmacist, particularly if you take medications — your pharmacogenomic variants are shown in your Practitioner Report.
      </Callout>
    </Panel>
  )
}

// ─────────────────── 3H · Equipment ───────────────────

export function EquipmentPanel({ items }) {
  if (!items?.length) return null
  return (
    <Panel icon={Wrench} title="Equipment Recommendations" eyebrow="3H" accent="#B45309">
      <p className="text-[11.5px] italic text-ss-muted">
        Suggestions are keyed to your genome and available kit. Priority reflects what would meaningfully change your protocol quality — not what looks nice.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((e) => {
          const p = PRIORITY_META[e.priority] || PRIORITY_META.helpful
          return (
            <div key={e.id} className="rounded-xl border border-ss-border-warm bg-white p-3 avoid-break">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[12.5px] font-extrabold text-ss-teal">{e.name}</div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: p.color }}>{p.label}</span>
              </div>
              <OnlyFull>
                <div className="mt-1 text-[11.5px] leading-relaxed text-ss-text">{e.why}</div>
              </OnlyFull>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ss-muted">
                <span><span className="font-semibold">Cost:</span> {e.cost}</span>
                <OnlyFull>
                  {e.replaces && <span><span className="font-semibold">Replaces / complements:</span> {e.replaces}</span>}
                </OnlyFull>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

// ─────────────────── 3I · Metrics ───────────────────

export function MetricsPanel({ metrics }) {
  if (!metrics) return null
  const section = (title, items) => (
    items?.length ? (
      <div className="mt-3 avoid-break">
        <Sub>{title}</Sub>
        <table className="mt-1 w-full border-collapse text-left text-[11.5px]">
          <thead>
            <tr className="border-b-2 border-ss-teal/30 text-[9.5px] uppercase tracking-wider text-ss-muted">
              <th className="py-1 pr-2 font-semibold">Metric</th>
              <th className="py-1 pr-2 font-semibold">Frequency</th>
              <th className="py-1 pr-2 font-semibold">Target / interpretation</th>
              {'current' in (items[0] || {}) && <th className="py-1 pr-2 font-semibold">Your latest</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((m, i) => (
              <tr key={i} className="border-b border-ss-border-warm/30 align-top">
                <td className="py-1.5 pr-2 font-semibold text-ss-text">{m.name}</td>
                <td className="py-1.5 pr-2 text-ss-muted">{m.frequency}</td>
                <td className="py-1.5 pr-2">{m.target}</td>
                {'current' in m && <td className="py-1.5 pr-2 font-semibold text-ss-teal">{m.current ?? '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )
  return (
    <Panel icon={LineChart} title="Metrics to Track" eyebrow="3I" accent="#0891B2">
      {section('Performance', metrics.performance)}
      {section('Body composition', metrics.bodyComp)}
      {section('Recovery', metrics.recovery)}
      {section('Biomarker targets', metrics.biomarkerTargets)}
    </Panel>
  )
}

// ─────────────────── 3J · Goals ───────────────────

export function GoalsPanel({ goals }) {
  if (!goals) return null
  const Card = ({ title, subtitle, children }) => (
    <div className="rounded-xl border border-ss-border-warm bg-white p-4 avoid-break">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-orange">{subtitle}</div>
      <div className="mt-0.5 text-[13px] font-extrabold text-ss-teal">{title}</div>
      <div className="mt-2 space-y-2 text-[11.5px] leading-relaxed text-ss-text">{children}</div>
    </div>
  )
  const List = ({ items, tone }) => (
    <ul className={`mt-1 list-disc space-y-0.5 pl-5 ${tone === 'red' ? 'text-red-800' : 'text-ss-text'}`}>
      {items.map((s, i) => <li key={i}>{s}</li>)}
    </ul>
  )
  return (
    <Panel icon={Target} title="Goals, Milestones & Progression" eyebrow="3J" accent="#B91C1C">
      <div className="text-[11px] italic text-ss-muted">Primary goal frame: <span className="font-semibold text-ss-teal">{goals.primaryGoal}</span></div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card subtitle="Weeks 1–4" title="Foundation">
          <OnlyFull>
            <div><span className="font-semibold text-ss-teal">Focus:</span> {goals.foundation.focus}</div>
            <div><span className="font-semibold text-red-700">Do not yet:</span><List items={goals.foundation.doNot} tone="red" /></div>
            <div><span className="font-semibold text-ss-teal">Success looks like:</span><List items={goals.foundation.success} /></div>
          </OnlyFull>
          <div className="rounded border-l-4 border-ss-teal bg-ss-teal/5 p-2 text-[11px]">
            <span className="font-semibold text-ss-teal">Week-4 milestone:</span> {goals.foundation.milestone}
          </div>
        </Card>
        <Card subtitle="Weeks 5–12" title="Development">
          <OnlyFull>
            <div><span className="font-semibold text-ss-teal">Focus:</span> {goals.development.focus}</div>
            <div><span className="font-semibold text-ss-teal">When to progress:</span><List items={goals.development.when} /></div>
            <div><span className="font-semibold text-ss-teal">Markers to look for:</span><List items={goals.development.markers} /></div>
          </OnlyFull>
          <div className="rounded border-l-4 border-ss-teal bg-ss-teal/5 p-2 text-[11px]">
            <span className="font-semibold text-ss-teal">Week-12 milestone:</span> {goals.development.milestone}
          </div>
        </Card>
        <Card subtitle="6 months" title="Transformation">
          <OnlyFull>
            <div><span className="font-semibold text-ss-teal">Outcome:</span><List items={goals.transformation.outcome} /></div>
            <div><span className="font-semibold text-ss-teal">Lifestyle anchors:</span><List items={goals.transformation.lifestyleAnchors} /></div>
          </OnlyFull>
          <div className="italic text-ss-muted">{goals.transformation.reassess}</div>
        </Card>
      </div>
    </Panel>
  )
}

// ─────────────────── 3K · Beginner ───────────────────

export function BeginnerPanel({ content }) {
  if (!content) return null
  return (
    <Panel icon={GraduationCap} title={content.header} eyebrow="3K" accent="#059669">
      <Sub>What to expect in your first 2 weeks</Sub>
      <div className="mt-1 space-y-2 text-[11.5px] text-ss-text">
        {content.expect.map((e, i) => (
          <div key={i}><span className="font-semibold text-ss-teal">{e.title}</span> {e.body}</div>
        ))}
      </div>

      <Sub>{content.readCard.title}</Sub>
      <div className="mt-1 grid grid-cols-1 gap-1 text-[11.5px] text-ss-text sm:grid-cols-2">
        {content.readCard.items.map((it, i) => (
          <div key={i} className="border-b border-ss-border-warm/40 py-1">
            <span className="font-semibold text-ss-teal">{it.term}:</span> {it.explain}
          </div>
        ))}
      </div>

      <Sub>{content.hardEnough.title}</Sub>
      <div className="mt-1 space-y-1 text-[11.5px] text-ss-text">
        <div><span className="font-semibold text-ss-teal">Strength:</span> {content.hardEnough.strength}</div>
        <div><span className="font-semibold text-ss-teal">Cardio:</span> {content.hardEnough.cardio}</div>
      </div>

      <Sub>{content.tooHard.title}</Sub>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11.5px] text-ss-text">
        {content.tooHard.signs.map((s, i) => <li key={i}>{s}</li>)}
      </ul>

      <Callout tone="orange" icon={Sparkles}><span className="font-semibold">{content.firstGoal}</span></Callout>

      <Sub>FAQ — honest answers</Sub>
      <div className="mt-1 space-y-2 text-[11.5px] text-ss-text">
        {content.faq.map((f, i) => (
          <div key={i}><div className="font-semibold text-ss-teal">{f.q}</div><div>{f.a}</div></div>
        ))}
      </div>
    </Panel>
  )
}

// ─────────────────── 3L · Youth ───────────────────

export function YouthPanel({ content }) {
  if (!content) return null
  return (
    <Panel icon={Users} title={content.header} eyebrow="3L" accent="#0EA5A4">
      <Sub>Key rules for youth training</Sub>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-[11.5px] text-ss-text">
        {content.keyRules.map((r, i) => <li key={i}>{r}</li>)}
      </ul>

      <Sub>Age-appropriate substitutions</Sub>
      <div className="mt-1 grid grid-cols-1 gap-1 text-[11.5px] text-ss-text sm:grid-cols-2">
        {content.substitutions.map((s, i) => (
          <div key={i} className="rounded border border-ss-border-warm bg-ss-bg/30 p-2">
            <div className="text-[10px] uppercase tracking-wider text-ss-muted">Instead of</div>
            <div className="font-semibold text-red-700">{s.instead}</div>
            <div className="text-[10px] uppercase tracking-wider text-ss-muted mt-1">Use</div>
            <div className="font-semibold text-ss-teal">{s.use}</div>
          </div>
        ))}
      </div>

      <Callout tone="orange" icon={Sparkles}><span className="font-semibold">Mental frame:</span> {content.mentalFrame}</Callout>

      <Sub>{content.coachSummary.title}</Sub>
      <div className="mt-1 space-y-1 rounded border border-ss-teal/40 bg-ss-teal/5 p-3 text-[11.5px] text-ss-text">
        {content.coachSummary.body.map((b, i) => <p key={i}>{b}</p>)}
      </div>
    </Panel>
  )
}

// ─────────────────── 3M · Coach Share ───────────────────

export function CoachSharePanel({ protocol, intake, profile }) {
  if (!protocol) return null
  const covered = protocol.profile.cards.filter((c) => c.covered)
  const nonNegotiables = []
  if (profile.tags?.includes('injury_risk_high')) {
    nonNegotiables.push('COL5A1 TT / MMP3 high genotype: collagen (15–20 g hydrolyzed) + vitamin C (50 mg) 30–60 min pre-session. Volume increases capped at 10 %/week.')
  }
  if (profile.tags?.includes('recovery_priority')) {
    nonNegotiables.push('FKBP5 T-carrier genotype: no back-to-back high-intensity days. HRV drop > 10–15 % from baseline = mandatory active-recovery day.')
  }
  if (profile.tags?.includes('endurance_volume_high')) {
    nonNegotiables.push('PPARGC1A Gly/Gly genotype: higher aerobic training volume required for equivalent VO₂max adaptation. Do not substitute intensity for volume.')
  }
  if (profile.tags?.includes('no_fasted_hard')) {
    nonNegotiables.push('MTNR1B GG genotype: 20–40 g carbohydrate 15–30 min before morning training. No fasted high-intensity work.')
  }
  if (profile.tags?.includes('caffeine_limit')) {
    nonNegotiables.push('CYP1A2 CC (slow metaboliser): caffeine cap at ~1–2 mg/kg body weight, morning only.')
  }
  if (!nonNegotiables.length) nonNegotiables.push('No genotype-driven non-negotiable modifications flagged.')

  return (
    <Panel icon={Shield} title="Coach / Trainer Share Version" eyebrow="3M" accent="#7C3AED">
      <p className="text-[11.5px] italic text-ss-muted">
        A one-page summary designed to be handed to your coach, personal trainer, or physical therapist. Print this tab for a self-contained brief.
      </p>

      <Sub>Athlete</Sub>
      <div className="mt-1 grid grid-cols-2 gap-2 text-[11.5px] text-ss-text">
        <div><span className="font-semibold text-ss-teal">Name:</span> {intake?.patientName || '__________________'}</div>
        <div><span className="font-semibold text-ss-teal">Age / Sex:</span> {intake?.age || '—'} / {intake?.sex || '—'}</div>
        <div><span className="font-semibold text-ss-teal">Experience:</span> {intake?.experienceLevel}</div>
        <div><span className="font-semibold text-ss-teal">Primary sport:</span> {intake?.primaryActivity}</div>
      </div>

      <Sub>Genetic training profile — key findings</Sub>
      <ul className="mt-1 space-y-0.5 text-[11.5px] text-ss-text">
        {covered.map((c) => (
          <li key={c.rsid}><span className="font-semibold text-ss-teal">{c.gene}</span> — {c.interp?.label || c.genotype} · {c.interp?.implication?.slice(0, 140)}…</li>
        ))}
      </ul>

      <Sub>Non-negotiable training modifications</Sub>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-[11.5px] text-red-800">
        {nonNegotiables.map((n, i) => <li key={i}>{n}</li>)}
      </ul>

      <Sub>Weekly blueprint at a glance</Sub>
      <div className="mt-1 grid grid-cols-7 gap-1 text-[10px]">
        {protocol.blueprint?.days?.map((d, i) => (
          <div key={i} className="rounded border border-ss-border-warm bg-ss-bg/30 p-1 text-center">
            <div className="font-semibold text-ss-teal">{d.day}</div>
            <div className="mt-0.5 text-[9.5px]">{d.label}</div>
            <div className="mt-0.5 text-[9px] italic text-ss-muted">{d.duration}</div>
          </div>
        ))}
      </div>

      {protocol.supplements?.length > 0 && (
        <>
          <Sub>Supplement protocol (summary)</Sub>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11.5px] text-ss-text">
            {protocol.supplements.map((s) => (
              <li key={s.id}><span className="font-semibold text-ss-teal">{s.name}</span> — {s.dose}, {s.timing}</li>
            ))}
          </ul>
        </>
      )}

      <Sub>For the coach</Sub>
      <div className="mt-1 rounded border border-ss-teal/40 bg-ss-teal/5 p-3 text-[11.5px] text-ss-text">
        Full protocol generated at <span className="underline">selfscience.io/tools/training</span>. For questions about the underlying genomic data, ask the athlete for their Practitioner Report — a separate print-ready document that summarises the genetic and biomarker findings in clinical format.
      </div>
    </Panel>
  )
}
