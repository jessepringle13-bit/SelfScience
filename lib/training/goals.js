// /app/lib/training/goals.js
// Section 3J — Goals, Milestones & Progression Framework.

function goalLabel(goals) {
  const g = new Set(goals || [])
  if (g.has('strength'))   return 'Strength'
  if (g.has('muscle'))     return 'Muscle'
  if (g.has('power'))      return 'Speed / Power'
  if (g.has('endurance'))  return 'Endurance'
  if (g.has('fat_loss'))   return 'Body composition'
  if (g.has('injury_prev')) return 'Injury prevention'
  if (g.has('longevity'))  return 'Longevity'
  if (g.has('mobility'))   return 'Mobility'
  return 'General health'
}

export function buildGoalsFramework(intake, profile) {
  const level = intake.experienceLevel
  const beginner = ['beginner', 'youth'].includes(level)
  const primaryGoal = goalLabel(intake.goals)
  const tags = new Set(profile?.tags || [])

  const foundation = {
    focus: beginner
      ? 'Habit formation. Movement quality. Zero missed sessions matters more than any single workout.'
      : 'Recalibrate volume to the new programme. Nail form on the compound lifts. Build the aerobic base.',
    doNot: [
      'No 1RM testing. No PR attempts.',
      'Do not add more than 5\u201310 % load week-to-week on any lift.',
      tags.has('injury_risk_high')
        ? 'Do not exceed 10 % weekly volume increase — hard cap.'
        : 'Do not exceed 15 % weekly volume increase.',
    ],
    success: [
      'You have completed at least 90 % of scheduled sessions.',
      'You know what “RPE 7” feels like for your main compound lifts.',
      beginner
        ? 'You can walk into any session without opening the app for reference on the warm-up.'
        : 'Warm-ups feel automatic; heavy sets feel controlled, not reactive.',
      primaryGoal === 'Endurance'
        ? 'Your Zone 2 pace has become slightly faster at the same heart rate.'
        : 'You can perform your working sets with tempo control and matched left/right output.',
    ],
    milestone: beginner
      ? 'By the end of week 4 you should be able to demonstrate every foundational movement pattern (squat, hinge, push, pull, carry) with tight form at working weight.'
      : 'By the end of week 4 you should be hitting all sets across at planned load, with RPE below 8 on the last set.',
  }

  const development = {
    focus: `Introduce periodisation. Start progressing load, volume, or intensity — not all three at once. Trust the aerobic base to keep expanding.`,
    when: [
      'Start adding load to your main lift only when you can complete all working sets at your prescribed rep range with RPE 7 or below.',
      'Deload every 4th week ' + (tags.has('recovery_priority') ? '(every 3rd for your FKBP5 T-carrier profile).' : '— reduce volume 40\u201350 %, keep intensity.'),
    ],
    markers: [
      primaryGoal === 'Strength' && '5\u201315 % increase in your main lift 1RM estimate.',
      primaryGoal === 'Endurance' && 'Zone 2 pace has moved 3\u20136 % faster at same HR, or FTP has climbed by a comparable margin.',
      primaryGoal === 'Muscle' && 'Visible circumference change at the trained sites, plus performance improvement (not just size).',
      primaryGoal === 'Body composition' && 'Waist circumference reduction with performance maintained.',
      'Sleep quality subjectively improved. Resting HR down 2\u20135 bpm.',
    ].filter(Boolean),
    milestone: beginner
      ? 'By week 12 you should have real numbers for every main lift, an established Zone 2 pace or HR at your target intensity, and a clear sense of what an \u201cRPE 8\u201d feels like across all your compound movements.'
      : 'By week 12 you should be able to run a full mesocycle without an injury interruption, hit at least one measurable performance target from your goal list, and know your own recovery signals well enough to modulate mid-week.',
  }

  const transformation = {
    outcome: [
      'Composition change is objective and visible.',
      'Performance metrics have moved meaningfully in your primary goal direction.',
      'You have identified the 3\u20134 habits that produce most of the return for your body — the ones your genotype specifically rewards.',
      'Your training feels less like “the programme” and more like part of your life.',
    ],
    lifestyleAnchors: [
      tags.has('recovery_priority') ? 'Non-negotiable 7\u20139 hr sleep window.' : 'Consistent sleep timing.',
      tags.has('injury_risk_high')  ? 'Collagen protocol pre-session, every session.' : 'Structured warm-up, no “skip today” exceptions.',
      tags.has('endurance_volume_high') ? 'Weekly Zone 2 volume defended against the temptation to substitute intensity.' : 'Weekly aerobic dose regardless of primary goal.',
      'Regular deload weeks — the discipline of taking them is the discipline of long-term progress.',
    ],
    reassess: 'Regenerate this protocol at the 6-month mark — update your intake with your current numbers and any changes in goal, injury status, or biomarker signal. The engine will adapt.',
  }

  return { foundation, development, transformation, primaryGoal }
}
