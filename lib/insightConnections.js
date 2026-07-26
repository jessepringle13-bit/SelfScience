// /app/lib/insightConnections.js
// Phase U-3 — cross-topic connectors between primary-goal insights.
// Each entry lists the 2 most useful “if you care about X, also read Y”
// links so users see how their goals interlock rather than living in
// siloed columns.

'use client'

export const CONNECTIONS = {
  energy: [
    { to: 'metabolism', reason: 'Afternoon energy crashes are usually a metabolism story before they’re an energy story — insulin swings hit first.' },
    { to: 'sleep',      reason: 'Sleep quality gates every energy lever. Fix chronotype alignment and iron/thyroid work stops being uphill.' },
  ],
  longevity: [
    { to: 'metabolism', reason: 'HbA1c and fasting insulin are two of the top three modifiable mortality inputs. Longevity work runs through metabolism first.' },
    { to: 'performance',reason: 'VO₂max is the single strongest longevity signal in the literature. Training builds it — that’s where performance and longevity merge.' },
  ],
  performance: [
    { to: 'sleep',      reason: 'Adaptation happens in sleep, not in the gym. Every performance ceiling has a sleep floor.' },
    { to: 'energy',     reason: 'Iron and thyroid dictate how much training your body can absorb before it stalls. Recovery starts with those numbers.' },
  ],
  sleep: [
    { to: 'cognition',  reason: 'The cognitive complaint you’re troubleshooting is often a sleep-quality complaint upstream. Fix sleep first.' },
    { to: 'metabolism', reason: 'One week of sleep restriction moves insulin resistance measurably. Metabolic and sleep insights share this axis.' },
  ],
  metabolism: [
    { to: 'longevity',  reason: 'Insulin resistance is the earliest reversible marker of the ageing curve. Longevity work usually starts here.' },
    { to: 'energy',     reason: 'Post-meal energy dips are almost always a metabolic story before they’re anything else.' },
  ],
  cognition: [
    { to: 'sleep',      reason: 'Slow-wave sleep and REM are when memory consolidation actually happens. Cognition insights ride on sleep insights.' },
    { to: 'energy',     reason: 'Ferritin, B12, and thyroid are silent drivers of “brain fog”. Fix the nutritional cognition before assuming psychiatry.' },
  ],
  hormones: [
    { to: 'metabolism', reason: 'Insulin is a hormone. So is cortisol. The metabolic panel and the hormone panel overlap more than most people realise.' },
    { to: 'sleep',      reason: 'Cortisol and melatonin rhythms are coupled to sleep phase. Hormone context requires sleep context.' },
  ],
  supplements: [
    { to: 'energy',     reason: 'Most useful supplement decisions ride on iron / B12 / thyroid data. Read the energy insight first, then decide.' },
    { to: 'metabolism', reason: 'Metabolic supplements (berberine, myo-inositol, magnesium) only make sense once your baseline metabolic markers are known.' },
  ],
  genome: [
    { to: 'energy',     reason: 'MTHFR, MTR, BHMT, HFE — the highest-leverage variants on a raw genome file are energy-relevant. Start there.' },
    { to: 'metabolism', reason: 'TCF7L2 and MTNR1B change the metabolic picture. Reading them via the metabolism insight lands harder.' },
  ],
}

export function connectionsFor(primary) {
  return CONNECTIONS[primary] || []
}
