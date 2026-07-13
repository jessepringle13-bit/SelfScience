// /app/lib/training/mobility.js
// Section 3E — Stretching & Mobility protocol.
// Deterministic: same inputs → same output.

function preWarmupForDay(dayType) {
  const upper = [
    { name: 'Arm circles', reps: '10 forward / 10 back' },
    { name: 'Band pull-aparts', reps: '2 × 15' },
    { name: 'Scapular push-ups', reps: '2 × 10' },
    { name: 'Thoracic rotations', reps: '2 × 8/side' },
    { name: 'Deep breathing + bracing drill', reps: '2 × 5 breaths' },
  ]
  const lower = [
    { name: 'Hip 90/90 rotations', reps: '2 × 8/side' },
    { name: 'World\u2019s greatest stretch', reps: '2 × 6/side' },
    { name: 'Bodyweight squat pulses', reps: '2 × 15' },
    { name: 'Glute bridges', reps: '2 × 12' },
    { name: 'Ankle wall dorsiflexion', reps: '2 × 10/side' },
  ]
  const full = [
    { name: 'Cat\u2013cow', reps: '2 × 8' },
    { name: 'World\u2019s greatest stretch', reps: '2 × 5/side' },
    { name: 'Bodyweight squats', reps: '2 × 12' },
    { name: 'Inchworm walk-outs', reps: '2 × 6' },
    { name: 'Jumping jacks', reps: '2 × 30 s' },
  ]
  const cardio = [
    { name: 'Easy walk / bike (Zone 1)', reps: '5 min ramp-up' },
    { name: 'Leg swings', reps: '2 × 10/side' },
    { name: 'Hip openers', reps: '2 × 6/side' },
    { name: 'Cadence drill (running only)', reps: '30 s at target cadence' },
  ]
  const intervals = [
    { name: 'Easy warm-up run/bike', reps: '10 min' },
    { name: 'A-skips / B-skips', reps: '2 × 20 m' },
    { name: 'Strides / build-ups', reps: '4 × 20\u201330 m at ~85 %' },
  ]

  if (dayType?.startsWith('strength_upper') || dayType === 'strength_push' || dayType === 'strength_pull') return upper
  if (dayType?.startsWith('strength_lower')) return lower
  if (dayType === 'strength_full' || dayType === 'skill_power') return full
  if (dayType === 'zone2_cardio') return cardio
  if (dayType === 'intervals') return intervals
  return full
}

function postCooldownForDay(dayType) {
  const upper = [
    { name: 'Doorway pec stretch', hold: '2 × 45 s/side', feel: 'Chest opens; shoulder blades relax' },
    { name: 'Cross-body shoulder stretch', hold: '2 × 30 s/side', feel: 'Rear delt lengthens' },
    { name: 'Overhead triceps stretch', hold: '2 × 30 s/side', feel: 'Triceps lengthens; not painful' },
    { name: 'Child\u2019s pose', hold: '2 × 45 s', feel: 'Lats and low back release' },
  ]
  const lower = [
    { name: 'Pigeon pose', hold: '2 × 60 s/side', feel: 'Glute + hip flexor length' },
    { name: 'Standing quad stretch', hold: '2 × 30 s/side', feel: 'Quad + hip flexor' },
    { name: 'Seated forward fold (loose knees)', hold: '2 × 45 s', feel: 'Posterior chain length — not lumbar strain' },
    { name: 'Couch stretch', hold: '2 × 60 s/side', feel: 'Hip flexor + rectus femoris' },
  ]
  const full = [
    { name: 'Downward dog', hold: '2 × 45 s', feel: 'Posterior chain + shoulder length' },
    { name: '90/90 hip stretch', hold: '2 × 30 s/side', feel: 'Deep hip rotators' },
    { name: 'Child\u2019s pose', hold: '2 × 45 s', feel: 'Lats + low back' },
    { name: 'Supine spinal twist', hold: '2 × 30 s/side', feel: 'Spinal rotation — no forcing' },
  ]
  const cardio = [
    { name: 'Calf stretch on wall', hold: '2 × 45 s/side', feel: 'Long axis calf length' },
    { name: 'Standing hamstring stretch', hold: '2 × 30 s/side', feel: 'Behind knee gently, not sharp' },
    { name: 'Piriformis (figure-four) stretch', hold: '2 × 45 s/side', feel: 'Deep glute release' },
    { name: 'Legs-up-the-wall', hold: '3\u20135 min', feel: 'Venous return; nervous-system reset' },
  ]
  if (dayType?.startsWith('strength_upper') || dayType === 'strength_push' || dayType === 'strength_pull') return upper
  if (dayType?.startsWith('strength_lower')) return lower
  if (dayType === 'strength_full' || dayType === 'skill_power') return full
  if (dayType === 'zone2_cardio' || dayType === 'intervals') return cardio
  return full
}

const WEEKLY_MOBILITY = [
  { name: 'Cat\u2013cow flow', reps: '10 slow reps' },
  { name: 'Thoracic openers on foam roller', reps: '2 × 8 reps' },
  { name: '90/90 hip switches', reps: '2 × 6/side' },
  { name: 'Deep squat hold', reps: '3 × 45 s' },
  { name: 'Half-kneeling hip flexor stretch', reps: '2 × 45 s/side' },
  { name: 'Standing figure-four glute stretch', reps: '2 × 30 s/side' },
  { name: 'Shoulder controlled articular rotations (CARs)', reps: '5 slow reps/direction' },
  { name: 'Neck controlled articular rotations', reps: '3 slow reps/direction' },
  { name: 'Legs-up-the-wall', reps: '5 min finisher' },
]

const CONNECTIVE_TISSUE_SPECIFIC = [
  {
    name: 'Eccentric Achilles heel drops',
    prescription: '3 × 15/leg on a step',
    tempo: '3 s down, 1 s bottom, no reset',
    frequency: '2\u20133\u00d7/week',
    note: 'Alfredson protocol — clinically validated for tendon remodelling. Load slowly — this is the point.',
  },
  {
    name: 'Eccentric wrist curls (for elbow tendons)',
    prescription: '3 × 12/side',
    tempo: '4 s eccentric, reset with the other hand',
    frequency: '2\u00d7/week',
    note: 'For lateral or medial elbow tendinopathy prevention if pushing/pulling heavy.',
  },
  {
    name: 'Slant-board tempo squats',
    prescription: '3 × 8 at bodyweight',
    tempo: '5 s down, 2 s bottom, 2 s up',
    frequency: '1\u00d7/week',
    note: 'Loads patellar tendon eccentrically — the mechanism actually associated with tendon adaptation.',
  },
  {
    name: 'Nordic hamstring curl (assisted)',
    prescription: '3 × 6\u20138',
    tempo: '4 s eccentric fall, hands catch, self-return',
    frequency: '1\u00d7/week',
    note: 'Highest-evidence intervention for hamstring injury prevention (Petersen 2011, RCT).',
  },
  {
    name: 'Foam-roll / massage-gun myofascial release',
    prescription: '60\u201390 s per muscle group after training',
    tempo: 'Slow — pause on tender points',
    frequency: 'daily',
    note: 'Not optional for high-turnover connective tissue. Post-training, not pre.',
  },
]

export function buildMobilityProtocol(intake, profile) {
  const tags = new Set(profile?.tags || [])
  const needsConnective = tags.has('injury_risk_high') || tags.has('collagen_protocol')

  // Build per-day sections for the days present in the user's blueprint.
  const perDay = {
    upper:  { warmup: preWarmupForDay('strength_upper'),  cooldown: postCooldownForDay('strength_upper') },
    lower:  { warmup: preWarmupForDay('strength_lower'),  cooldown: postCooldownForDay('strength_lower') },
    full:   { warmup: preWarmupForDay('strength_full'),   cooldown: postCooldownForDay('strength_full') },
    cardio: { warmup: preWarmupForDay('zone2_cardio'),    cooldown: postCooldownForDay('zone2_cardio') },
    intervals: { warmup: preWarmupForDay('intervals'),    cooldown: postCooldownForDay('intervals') },
  }

  return {
    perDay,
    weekly: WEEKLY_MOBILITY,
    connective: needsConnective ? CONNECTIVE_TISSUE_SPECIFIC : null,
    note: needsConnective
      ? 'Your COL5A1 / MMP3 profile makes the connective-tissue block below non-negotiable, not optional.'
      : null,
  }
}
