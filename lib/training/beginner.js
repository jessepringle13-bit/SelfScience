// /app/lib/training/beginner.js
// Section 3K — Beginner Orientation (conditional).

export const BEGINNER_CONTENT = {
  header: 'Beginner Orientation — read this first',
  expect: [
    { title: 'Weeks 1\u20132 will feel awkward.', body: 'Movements you have never done will feel clunky. Soreness in muscles you did not know existed is normal. Doubt is normal. Push through the awkwardness — pattern quality improves faster than you think.' },
    { title: 'Consistency > intensity.', body: 'Your first goal is not to get fit. Your first goal is to make this a habit. Three moderate sessions/week for six months beats one great session/week forever.' },
    { title: 'Miss a session? Skip it.', body: 'Do not double up the next day. Do not extend the weekend to “catch up.” Show up next scheduled day. Momentum beats compensation.' },
  ],
  readCard: {
    title: 'How to read a workout card',
    items: [
      { term: 'Sets', explain: 'How many rounds of that exercise you’ll do. “3×8” = 3 rounds of 8 reps.' },
      { term: 'Reps', explain: 'How many repetitions per set. “8–10” means aim for 8–10 clean reps.' },
      { term: 'Tempo', explain: 'Written as 4 numbers, e.g. “3-1-2-0” = 3 s lowering, 1 s pause at the bottom, 2 s lifting, 0 s pause at the top.' },
      { term: 'Rest', explain: 'How long to wait between sets. 90 s means look at a clock — not “when I feel ready.”' },
      { term: 'RPE', explain: 'Rating of Perceived Exertion, 1\u201310. “7/10” = you could have done 3 more reps but stopped. “10/10” = absolute failure. Most working sets should live at 6\u20138.' },
    ],
  },
  hardEnough: {
    title: 'How to know if you’re working hard enough',
    strength: 'A working set should feel like RPE 6\u20138 — focused breathing, controlled tempo, form still tight on the last rep. If it felt easy at rep 8, add weight next session.',
    cardio: 'For Zone 2, you can hold a conversation but not sing. If you’re gasping, slow down. If you can sing, speed up.',
  },
  tooHard: {
    title: 'How to know if you’re working too hard',
    signs: [
      'You cannot speak a full sentence during cardio — slow down.',
      'Form breaks down before rep count — reduce weight.',
      'Soreness > 72 h into next session — pull back next week.',
      'You dread the next session emotionally — that is a signal, not weakness.',
    ],
  },
  firstGoal: 'Your first goal is not to get fit. Your first goal is to make this a habit that you actually enjoy.',
  faq: [
    { q: 'Will I get bulky?', a: 'No. Building visible muscle takes years of intentional overload and eating in a caloric surplus. Recreational training does not accidentally produce a bodybuilder physique.' },
    { q: 'Do I need to diet too?', a: 'Not necessarily. Consistent training + a reasonable diet solves most people\u2019s goals. Aggressive dieting on top of a new training programme is a fast track to burnout.' },
    { q: 'How long until I see results?', a: 'Strength: measurable in 3\u20134 weeks. Composition: visible at 8\u201312 weeks. Endurance: measurable in 4\u20136 weeks, visible improvement in daily life at 8\u201310. “Results” in the way social media shows them: 6\u201312 months of consistency.' },
    { q: 'What if I can\u2019t do the exercise as prescribed?', a: 'Use the “Find alternative” button on every exercise card. Same muscle group, same equipment, different execution. Do not skip — substitute.' },
  ],
}

export function buildBeginnerContent(intake) {
  if (intake.experienceLevel !== 'beginner') return null
  return BEGINNER_CONTENT
}
