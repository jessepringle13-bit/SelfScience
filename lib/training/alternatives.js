// /app/lib/training/alternatives.js
// Smart Alternative Suggestions (Section 3B).
//
// Rule: NEVER tell the user to stop their activity. Frame every card as
// "here is how to do what you love more effectively and with less injury risk."
//
// Each rule fires when (a) the user's primary activity matches AND (b) the
// user's variant tags include a triggering tag.

const BASE_RULES = [
  // ------- COL5A1 TT / MMP3 GG (connective tissue) x popular activities -------
  {
    id: 'col5a1_powerlifting',
    activityMatch: /power/i,
    requiredTags: ['injury_risk_high'],
    doing: 'Powerlifting',
    consideration: 'Your COL5A1 TT genotype means your tendons and ligaments handle max-effort singles less well than average — not that you cannot lift heavy, but that repeated max attempts elevate injury risk over time.',
    smarter: 'Instead of raw max singles every session, use cluster sets (e.g. 3\u00d71 with 20\u201330 s intra-set rest at 85\u201392 % 1RM). You get the same neural drive at meaningfully lower peak tendon strain.',
    samePath: 'Pause squats, tempo work at 70\u201380 % 1RM, and heavy triples at 87\u201390 % 1RM produce comparable strength adaptations to raw singles — with less connective-tissue cost.',
  },
  {
    id: 'col5a1_running',
    activityMatch: /run|marathon|jog/i,
    requiredTags: ['injury_risk_high'],
    doing: 'Running',
    consideration: 'Repeated ground-contact loading is where the COL5A1 signal shows up — tendinopathies (Achilles, patellar, plantar) are the most common issues in TT-carrier runners.',
    smarter: 'You do not need to stop running. You need to run differently: prefer softer surfaces (trail, treadmill, track) over concrete; cap weekly mileage increases at ~10 %; keep a full rest or cross-training day every week; and use the collagen + vitamin C protocol before every run.',
    samePath: 'Substituting one run per week for pool running or cycling at equivalent heart rate delivers the same aerobic stimulus with near-zero tendon load. Add eccentric heel-drops and single-leg calf raises 2\u00d7/week as prehab.',
  },
  {
    id: 'col5a1_crossfit',
    activityMatch: /crossfit|hiit|functional/i,
    requiredTags: ['injury_risk_high'],
    doing: 'CrossFit / mixed-modality',
    consideration: 'The combination of heavy compound lifts + high-rep gymnastic work + short rest is the exact stress profile your COL5A1 TT genotype handles less well.',
    smarter: 'Scale weights before scaling reps. Keep quality of movement above conditioning intensity on high-volume days. Use the collagen protocol pre-session as a non-negotiable ritual.',
    samePath: 'Replace one high-volume gymnastic WOD per week with a strength-biased or aerobic-only session — same fitness stimulus, dramatically lower connective-tissue cost.',
  },

  // ------- ACTN3 XX (slow-twitch) x explosive sports -------
  {
    id: 'actn3_xx_explosive',
    activityMatch: /sprint|jump|volleyball|basketball|football|american|soccer|rugby|hockey/i,
    requiredTags: ['endurance_bias', 'volume_over_intensity'],
    doing: 'An explosive / sprint-heavy sport',
    consideration: 'Your ACTN3 XX genotype does not stop you from being explosive — it means your explosive efforts fatigue faster and your recovery between them is slower than a fast-twitch dominant athlete.',
    smarter: 'Build a bigger aerobic base than you think you need. Add two Zone 2 sessions per week (30\u201345 min each) alongside your explosive work. Your recovery between plays / sprints / lifts will visibly improve within 4\u20136 weeks.',
    samePath: 'Repeat-sprint training (e.g. 6\u201310\u00d715 s all-out efforts with 60\u201390 s recovery) develops sport-specific explosiveness while building the aerobic capacity your genotype needs.',
  },

  // ------- ACTN3 RR x pure endurance sports -------
  {
    id: 'actn3_rr_marathon',
    activityMatch: /marathon|triathlon|ultra|endurance|cycling/i,
    requiredTags: ['power', 'strength_bias'],
    doing: 'A long-format endurance sport',
    consideration: 'Your ACTN3 RR fast-twitch profile is not the ideal genotype for prolonged aerobic events — but you can absolutely train for them, and your power advantage becomes an asset on hills, finishes, and race-day surges.',
    smarter: 'Prioritise the aerobic base your genotype under-produces on its own — extra Zone 2 volume rather than more intervals. Two hard workouts per week is your ceiling; the rest should be easy.',
    samePath: 'Threshold work (e.g. 3\u00d78 min at lactate threshold, 3 min rest) exploits your fast-twitch advantage while raising your sustainable aerobic ceiling.',
  },

  // ------- FKBP5 T carrier x high-frequency training -------
  {
    id: 'fkbp5_high_freq',
    activityMatch: /crossfit|hiit|bootcamp|f45|orangetheory/i,
    requiredTags: ['no_backtoback_hard'],
    doing: 'A high-frequency, high-intensity programme',
    consideration: 'Your FKBP5 T-allele genotype means your cortisol response to hard sessions is elongated — back-to-back HIIT days accumulate stress load rather than adaptation.',
    smarter: 'Preserve the frequency you enjoy, but swap alternate days for a lower-intensity strength or aerobic session. Two hard days out of three is your body\u2019s ceiling.',
    samePath: 'A structured hard-easy-hard rotation actually improves aggregate training quality — the easy days let your next hard session hit harder.',
  },

  // ------- MTNR1B GG x fasted training -------
  {
    id: 'mtnr1b_fasted',
    activityMatch: /run|cycling|swimming|marathon|triathlon|endurance/i,
    requiredTags: ['no_fasted_hard'],
    doing: 'Morning endurance training fasted',
    consideration: 'Your MTNR1B GG genotype impairs early-morning insulin secretion — fasted training runs a real metabolic cost for you.',
    smarter: 'A small (20\u201340 g) carbohydrate feed 15\u201330 min before morning sessions supports blood glucose and improves session quality — without meaningfully affecting fat-adaptation on longer sessions.',
    samePath: 'If you enjoy the fasted feel, save it for easy Zone 1 walks. Keep any Zone 2 or harder work fed for this genotype.',
  },

  // ------- PPARGC1A GG x endurance ambition -------
  {
    id: 'pgc1a_gg_endurance',
    activityMatch: /run|cycling|swimming|marathon|triathlon|endurance/i,
    requiredTags: ['endurance_volume_high'],
    doing: 'Endurance training',
    consideration: 'Your PPARGC1A Gly/Gly genotype means your mitochondrial adaptation to endurance work is slower per unit of training — you need more volume than a Ser-carrier for the same VO\u2082max return.',
    smarter: 'Do not compensate with more intensity. Add aerobic time, not aerobic pain. One extra 30\u201345 min Zone 2 session per week beats two extra interval sessions for your physiology.',
    samePath: 'Cross-training modalities (indoor rowing, cycling, swimming) that hit the same aerobic system while sparing running mileage are especially valuable for your genotype.',
  },
]

/**
 * Return the alternatives that fire for a given intake + profile.
 * Each result: { id, doing, consideration, smarter, samePath }.
 * The user's protectedActivity is echoed back — the UI reminds users we
 * would never recommend stopping it.
 */
export function buildSmartAlternatives(intake, profile) {
  if (!intake || !profile) return { protected: '', items: [] }
  const activity = String(intake.primaryActivity || '').trim()
  const tags = new Set(profile.tags || [])
  const items = []
  for (const r of BASE_RULES) {
    if (!r.activityMatch.test(activity)) continue
    // Rule fires only if at least one of its required tags is present.
    const hit = r.requiredTags.some((t) => tags.has(t))
    if (!hit) continue
    items.push({
      id: r.id,
      doing: r.doing || activity,
      consideration: r.consideration,
      smarter: r.smarter,
      samePath: r.samePath,
    })
  }
  return { protected: intake.protectedActivity || '', items }
}
