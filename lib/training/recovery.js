// /app/lib/training/recovery.js
// Section 3F — Recovery Protocol.

export function buildRecoveryProtocol(intake, profile) {
  const tags = new Set(profile?.tags || [])
  const isFkbpT = tags.has('recovery_priority') && (tags.has('sleep_critical') || tags.has('no_backtoback_hard'))

  const activeRecovery = {
    modalities: [
      { name: 'Easy walk',      dose: '30\u201360 min at conversational pace',          note: 'Anyone. Zero neurological load. Improves next-day readiness.' },
      { name: 'Zone 1 cycling', dose: '30\u201345 min, HR < 55 % max',                   note: 'Gentle blood flow. Especially useful the day after leg day.' },
      { name: 'Easy swim',      dose: '20\u201330 min at conversational pace',           note: 'Zero-impact aerobic hit. Best for high-load lifters and runners.' },
      { name: 'Yin / restorative yoga', dose: '20\u201340 min',                            note: 'Nervous-system down-regulation. Long holds only.' },
      { name: 'Sauna (if available)', dose: '15\u201325 min at 80\u201390 °C, 2\u20134\u00d7/week', note: 'Passive heat acclimation. Consistent evidence for cardiovascular and recovery markers.' },
    ],
    principle: 'Active recovery is a training component — not “rest”. Keep intensity capped so the day contributes to adaptation, not to accumulated fatigue.',
  }

  const sleep = {
    duration: '7\u20139 hours nightly',
    timing: 'Consistent bedtime ± 30 min. Wake within 30 min of the same time daily.',
    protocol: [
      'Fixed lights-out and wake time — the schedule matters as much as the duration.',
      'Cool bedroom (16\u201319 °C / 60\u201367 °F). Sleep quality follows core temperature.',
      'Dim lights + no phone screens 30\u201360 min before bed. Blue light suppresses melatonin.',
      'No caffeine after ~12:00 (see supplement note if you are a CYP1A2 slow metaboliser).',
      'Last meal 2\u20133 h before bed — especially relevant for MTNR1B GG carriers.',
    ],
    genotypeNotes: [
      isFkbpT
        ? 'Your FKBP5 T-carrier genotype makes sleep a primary training variable, not a lifestyle preference. One poor night meaningfully impairs the next day\u2019s adaptation for you.'
        : null,
      tags.has('no_fasted_hard')
        ? 'Your MTNR1B GG genotype means late-night eating impairs your insulin response overnight — last meal timing directly affects morning training readiness.'
        : null,
    ].filter(Boolean),
  }

  const hrv = {
    summary: 'HRV — heart rate variability — tracks the beat-to-beat variation in your heart rate, and is a reliable global proxy for autonomic-nervous-system readiness.',
    baseline: 'Track for 2\u20133 weeks to establish your personal baseline. Values are individual — do not compare to friends.',
    rule: 'If your morning HRV drops more than 10\u201315 % below your rolling 7-day baseline, treat that day as active recovery, regardless of what\u2019s scheduled. Your autonomic system is telling you something.',
    tools: 'Reliable options: Whoop, Garmin (LWM chest strap ideal), Oura, Polar H10 + free apps like HRV4Training or Elite HRV.',
  }

  const deload = {
    cadence: isFkbpT ? 'Every 3rd week' : 'Every 4th week',
    protocol: 'Reduce total volume by 40\u201350 % that week. Keep intensity (load / pace) approximately the same. This is not a rest week — it is a lower-volume week.',
    reason: isFkbpT
      ? 'Your slower cortisol clearance accumulates stress across a 4-week block — pulling volume every third week produces better adaptation than pushing through.'
      : 'Structured deloads have consistently better outcomes than programmes without them — across strength, endurance, and mixed disciplines.',
  }

  return { activeRecovery, sleep, hrv, deload }
}
