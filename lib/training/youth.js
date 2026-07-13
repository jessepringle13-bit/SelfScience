// /app/lib/training/youth.js
// Section 3L — Youth Athlete Version (conditional).

export const YOUTH_CONTENT = {
  header: 'Youth athlete considerations — read this and share with your coach',
  keyRules: [
    'No maximal 1RM testing until you are at least 16. Estimates are fine — tests are not needed for progression at this age.',
    'Movement quality is worth more than load. Adding 5 kg to a sloppy squat is worse than adding a pause to a technically clean one.',
    'Under age 14: avoid heavy axial-loading exercises (barbell back squat, deadlift under load, overhead press with heavy weight). Growth plates are still open — loading them repeatedly is a real, documented injury risk.',
    'The collagen protocol is even more important if you carry the COL5A1 TT or MMP3 GG variant — connective tissue is under higher strain during growth spurts.',
    'Sleep is more important than any specific supplement. Prioritise 9 hours nightly — that is when growth happens.',
  ],
  substitutions: [
    { instead: 'Back squat at load',        use: 'Goblet squat, safety-bar squat, or box squat at bodyweight to moderate load with slow tempo' },
    { instead: 'Barbell deadlift heavy',    use: 'Trap-bar deadlift, kettlebell deadlift, or dumbbell RDL with tempo' },
    { instead: 'Overhead press heavy',      use: 'Landmine press, half-kneeling press, or push-ups (weighted if needed)' },
    { instead: 'Max-effort HIIT',            use: 'Repeat sprints (6\u201310\u00d715 s) with generous recovery (60\u201390 s)' },
  ],
  mentalFrame: 'Your job right now is to build movement patterns that will serve you for decades — not to peak at 15. Peaking at 15 is how you burn out at 22.',
  coachSummary: {
    title: 'One-page summary for coach or PE teacher',
    body: [
      'This athlete has completed a genetic training analysis via SelfScience — an educational research tool. The full report is available for the athlete\u2019s family to share.',
      'Key genetic considerations for training modifications are listed in the Genetic Profile section. Findings are educational, not clinical.',
      'The most important modifications are: (a) capped volume increases (max 10 %/week if COL5A1 TT is flagged), (b) collagen + vitamin C peri-training on high-load days if flagged, (c) no maximal load axial testing before physical maturity.',
      'Sport-specific work is fully compatible with this framework — SelfScience recommends training around the athlete\u2019s sport, not replacing it.',
    ],
  },
}

export function buildYouthContent(intake) {
  if (intake.experienceLevel !== 'youth') return null
  return YOUTH_CONTENT
}
