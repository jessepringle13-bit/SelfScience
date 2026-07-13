// /app/lib/training/metrics.js
// Section 3I — Metrics to Track.

export function buildMetricsPlan(intake, profile, biomarkers = {}) {
  const goals = new Set(intake.goals || [])
  const tags  = new Set(profile?.tags || [])
  const sex   = intake.sex
  const activity = String(intake.primaryActivity || '')

  const performance = [
    (goals.has('strength') || goals.has('muscle') || goals.has('power')) && {
      name: '1 rep max estimate (main lift)', frequency: 'Every 6\u20138 weeks', target: 'Upward trend across quarters. Testing is discretionary — always warm up thoroughly first.',
    },
    (goals.has('endurance') || goals.has('longevity')) && {
      name: 'VO\u2082max estimate', frequency: 'Every 8\u201312 weeks', target: 'Improve over training cycles. Estimate via a 12-min Cooper test, or a submaximal bike / rower test.',
    },
    {
      name: 'Resting heart rate', frequency: 'Weekly (morning, same wake time)', target: 'Downward trend over months indicates improving fitness. Individual baselines vary widely.',
    },
    tags.has('recovery_priority') && {
      name: 'HRV daily', frequency: 'Nightly / morning average', target: '10\u201315 % drop below your 7-day rolling baseline → active-recovery day.',
    },
  ].filter(Boolean)

  const bodyComp = [
    {
      name: 'Body weight', frequency: 'Weekly, same time (morning, post-void, pre-food)',
      target: 'Depends on goal — weight is not the only signal. Trend matters, not any single reading.',
    },
    {
      name: 'Waist circumference', frequency: 'Monthly',
      target: 'Usually more meaningful than scale weight for metabolic health. Aim for stability or modest reduction if fat-loss is a goal.',
    },
    {
      name: 'Progress photos', frequency: 'Monthly',
      target: 'Same lighting, same position, same time of day. Body-composition change is easier to see than to measure.',
    },
  ]

  const recovery = [
    { name: 'Sleep duration + quality', frequency: 'Nightly', target: '7\u20139 hours; consistent bedtime; sleep-tracker score if available.' },
    { name: 'Subjective readiness (1\u201310)', frequency: 'Every morning before training', target: 'Any consistent scale. Below 6 for 2+ days in a row → deload signal.' },
    { name: 'Muscle soreness (DOMS) 1\u201310', frequency: 'Track new-session peak', target: 'Peaks 24\u201348 h after novel training. > 7 that lingers 72 + h → you\u2019re under-recovered.' },
  ]

  const biomarkerTargets = [
    { name: 'hs-CRP', frequency: 'Every 6 months', target: 'Should trend downward with consistent training. Chronic > 3.0 mg/L is a flag — not necessarily an emergency, but worth a conversation with your clinician.', current: biomarkers?.hs_crp },
    (tags.has('no_fasted_hard')) && {
      name: 'Fasting glucose', frequency: 'Every 3\u20136 months', target: '< 100 mg/dL. Especially relevant for your MTNR1B GG genotype.', current: biomarkers?.fasting_glucose,
    },
    { name: 'HbA1c', frequency: 'Every 6 months', target: '< 5.4 % is the optimisation target; standard clinical range is < 5.7 %.', current: biomarkers?.hba1c },
    (/run|marathon|jog|triathlon/i.test(activity)) && {
      name: 'Ferritin', frequency: 'Every 6 months (annually minimum for runners)', target: 'Foot-strike hemolysis can deplete iron in runners. Ferritin < 30 ng/mL in symptomatic athletes deserves investigation.', current: biomarkers?.ferritin,
    },
    (sex === 'male') && {
      name: 'Total + free testosterone', frequency: 'Annually', target: 'Overtraining suppresses testosterone — a sudden drop is a data point worth acting on.', current: biomarkers?.total_testosterone,
    },
    { name: 'Vitamin D 25(OH)', frequency: 'Every 6 months if supplementing', target: '40\u201360 ng/mL is the optimisation range.', current: biomarkers?.vitamin_d },
  ].filter(Boolean)

  return { performance, bodyComp, recovery, biomarkerTargets }
}
