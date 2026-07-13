// /app/lib/training/equipment.js
// Section 3H — Equipment recommendations.

const RULES = [
  {
    id: 'lifting_straps',
    name: 'Lifting straps',
    when: (intake, tags) => tags.has('injury_risk_high') && (intake.equipment || []).some((e) => ['barbell', 'dumbbell', 'full_gym'].includes(e)),
    priority: 'essential',
    why: 'Removes grip as the weak link on heavier pulls and reduces wrist/forearm tendon strain — a real risk with your COL5A1 TT genotype.',
    cost: '$10\u201320',
    replaces: 'Grip failures on RDLs, heavy rows, and deadlifts.',
  },
  {
    id: 'knee_sleeves',
    name: 'Knee sleeves (7 mm neoprene)',
    when: (intake, tags) => tags.has('injury_risk_high') && (intake.equipment || []).some((e) => ['barbell', 'dumbbell', 'full_gym'].includes(e)),
    priority: 'essential',
    why: 'Compressive proprioceptive input around the patellar tendon during squats and lunges. Reduces perceived tendon strain and improves warm-up quality.',
    cost: '$30\u201360',
    replaces: null,
  },
  {
    id: 'foam_roller',
    name: 'Foam roller (or massage gun)',
    when: (intake, tags) => tags.has('injury_risk_high') || tags.has('recovery_priority') || tags.has('collagen_protocol'),
    priority: 'essential',
    why: 'Myofascial release is a recovery requirement for your genotype, not a nice-to-have. Foam roller is the cheapest option; massage guns work faster if budget allows.',
    cost: '$25\u2013300',
    replaces: null,
  },
  {
    id: 'bands',
    name: 'Resistance bands set',
    when: () => true,
    priority: 'helpful',
    why: 'Joint-friendly progressive loading before barbell work, plus travel option. Especially useful for shoulder / hip warm-ups.',
    cost: '$20\u201340',
    replaces: null,
  },
  {
    id: 'hr_monitor',
    name: 'Chest-strap heart-rate monitor',
    when: (intake, tags) => tags.has('endurance_bias') || tags.has('endurance_volume_high') || (intake.goals || []).includes('endurance'),
    priority: 'essential',
    why: 'Zone 2 training requires accurate HR tracking. Wrist optical sensors are not accurate enough at low intensity — they drift and lag.',
    cost: '$50\u201380',
    replaces: 'Wrist HR guessing on your smartwatch.',
  },
  {
    id: 'lactate_meter',
    name: 'Handheld lactate meter (e.g. Lactate Plus)',
    when: (intake, tags) => tags.has('endurance_volume_high'),
    priority: 'nice_to_have',
    why: 'Your PPARGC1A GG genotype needs disciplined Zone 2 volume — a lactate meter confirms threshold at 1.5\u20132.0 mmol/L. Removes guesswork.',
    cost: '$200\u2013350 + strips',
    replaces: null,
  },
  {
    id: 'weightlifting_shoes',
    name: 'Weightlifting shoes (heel elevation)',
    when: (intake, tags) => tags.has('injury_risk_high') && (intake.equipment || []).some((e) => ['barbell', 'full_gym'].includes(e)) && (intake.goals || []).some((g) => ['strength', 'muscle', 'power'].includes(g)),
    priority: 'helpful',
    why: 'Reduces ankle-mobility demand at the bottom of the squat — less Achilles / posterior-chain tension, better knee tracking.',
    cost: '$80\u2013150',
    replaces: null,
  },
  {
    id: 'metronome',
    name: 'Running metronome (free app)',
    when: (intake) => /run|marathon|jog/i.test(intake.primaryActivity || ''),
    priority: 'helpful',
    why: '170\u2013180 steps/min cadence reduces knee moment and injury risk regardless of pace. Free apps enforce it.',
    cost: 'Free',
    replaces: 'Ambient guesswork on cadence.',
  },
  {
    id: 'compression_socks',
    name: 'Compression socks',
    when: (intake) => /run|marathon|jog|cycl|triathlon/i.test(intake.primaryActivity || ''),
    priority: 'nice_to_have',
    why: 'Improved venous return during long aerobic efforts and post-session recovery. Modest but consistent benefit.',
    cost: '$25\u201380',
    replaces: null,
  },
  {
    id: 'hrv_monitor',
    name: 'HRV-capable wearable (Whoop / Garmin / Oura)',
    when: (intake, tags) => tags.has('recovery_priority') || tags.has('sleep_critical'),
    priority: 'essential',
    why: 'Your FKBP5 T-carrier genotype makes HRV the primary readiness signal — daily HRV governs whether to train hard or recover.',
    cost: '$180\u2013400',
    replaces: 'Guessing whether today is a hard day.',
  },
  {
    id: 'blue_light',
    name: 'Blue-light-blocking glasses',
    when: (intake, tags) => tags.has('sleep_critical'),
    priority: 'helpful',
    why: 'Evening cortisol management and sleep quality. Cheap intervention with a real signal for T-carriers.',
    cost: '$20\u201340',
    replaces: null,
  },
  {
    id: 'trainer',
    name: 'Indoor bike trainer or rower',
    when: (intake, tags) => tags.has('endurance_volume_high') && (intake.equipment || []).some((e) => ['cardio', 'full_gym', 'outdoor'].includes(e)),
    priority: 'helpful',
    why: 'Allows precise Zone 2 power output control — crucial for your PPARGC1A GG genotype where aerobic volume is the leverage.',
    cost: '$300\u20131,500',
    replaces: 'Weather-dependent outdoor Zone 2.',
  },
]

export const PRIORITY_META = {
  essential:    { label: 'Essential',    color: '#B91C1C' },
  helpful:      { label: 'Helpful',       color: '#B45309' },
  nice_to_have: { label: 'Nice to have',  color: '#0891B2' },
}

export function buildEquipmentRecommendations(intake, profile) {
  const tags = new Set(profile?.tags || [])
  const out = []
  for (const r of RULES) {
    let show = false
    try { show = !!r.when(intake, tags) } catch { show = false }
    if (show) out.push({
      id: r.id, name: r.name, priority: r.priority, why: r.why,
      cost: r.cost, replaces: r.replaces,
    })
  }
  // Sort by priority (essential > helpful > nice)
  const order = { essential: 0, helpful: 1, nice_to_have: 2 }
  out.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3))
  return out
}
