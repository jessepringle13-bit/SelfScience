/**
 * Canonical catalog of SelfScience quality flags.
 *
 * The AI reliability step returns flag labels; this catalog is the source of
 * truth for:
 *   - what tone (good / amber / critical) the pill should render in
 *   - the plain-English explainer that shows on click
 *   - short synonym matching so slight AI label variations still map correctly
 *
 * Tone semantics:
 *   good     -> green pill — a quality indicator, this study is more trustworthy
 *   amber    -> amber pill — a caution, read the finding with skepticism
 *   critical -> red pill   — a serious warning, treat this study as unreliable
 */

export const TONE_STYLES = {
  good: {
    bg: 'bg-[#2E7D32]',
    ring: 'ring-[#2E7D32]/20',
    dot: 'bg-[#2E7D32]',
    accent: 'text-[#2E7D32]',
    verdict: 'Quality signal',
    verdictLabel: 'Good',
  },
  amber: {
    bg: 'bg-[#B45309]',
    ring: 'ring-[#B45309]/20',
    dot: 'bg-[#B45309]',
    accent: 'text-[#B45309]',
    verdict: 'Read with caution',
    verdictLabel: 'Caution',
  },
  critical: {
    bg: 'bg-[#B91C1C]',
    ring: 'ring-[#B91C1C]/20',
    dot: 'bg-[#B91C1C]',
    accent: 'text-[#B91C1C]',
    verdict: 'Do not trust findings',
    verdictLabel: 'Watch out',
  },
}

// keys are lowercased canonical labels; each entry defines tone + explanation
// + a list of matcher regexes so we can normalise AI variations to one entry.
export const FLAGS = [
  // ------------------------- GOOD (green) quality signals ------------------------
  {
    canonical: 'Randomized Controlled Trial',
    tone: 'good',
    match: [/randomized.*controlled/i, /\brct\b/i],
    explain:
      'The gold standard for testing cause and effect. Participants are randomly assigned to a treatment or control group, which prevents most sources of bias from tilting the results.',
  },
  {
    canonical: 'Double-Blind Placebo Controlled',
    tone: 'good',
    match: [/double.blind/i, /placebo.controlled/i],
    explain:
      'Neither the participants nor the researchers know who is getting the real intervention. This is the strongest defence against expectation effects and unconscious bias.',
  },
  {
    canonical: 'Meta-Analysis',
    tone: 'good',
    match: [/meta.analysis/i],
    explain:
      'A statistical combination of many studies on the same question. Meta-analyses generally carry more weight than any single study because they smooth out one-off flukes.',
  },
  {
    canonical: 'Systematic Review',
    tone: 'good',
    match: [/systematic.review/i],
    explain:
      'A comprehensive, pre-specified survey of all studies meeting quality criteria for a question. Less noisy than reading any single paper in isolation.',
  },
  {
    canonical: 'Pre-Registered',
    tone: 'good',
    match: [/pre.?register/i],
    explain:
      'The researchers publicly locked in their hypotheses and analysis plan before collecting data. This is a strong defence against p-hacking and cherry-picking.',
  },
  {
    canonical: 'Large Sample',
    tone: 'good',
    match: [/large sample/i, /large cohort/i, /well.powered/i],
    explain:
      'A large number of participants makes it easier to detect real effects and reduces the chance that findings are a statistical fluke.',
  },
  {
    canonical: 'Long Follow-up',
    tone: 'good',
    match: [/long follow.?up/i, /long.term follow/i],
    explain:
      'The researchers tracked participants long enough for meaningful outcomes to emerge. Short-term studies can miss both benefits and harms that show up later.',
  },
  {
    canonical: 'Human Study',
    tone: 'good',
    match: [/^human study$/i, /in humans$/i],
    explain:
      'Findings come from people, not from petri dishes or mice. Human results are directly relevant to human health.',
  },
  {
    canonical: 'Peer Reviewed',
    tone: 'good',
    match: [/^peer.reviewed$/i, /peer.reviewed journal/i],
    explain:
      'Independent scientists in the same field vetted the methodology and findings before publication. Not proof of truth — but a real quality filter.',
  },
  {
    canonical: 'Conflicts Fully Disclosed',
    tone: 'good',
    match: [/conflicts?.fully.disclosed/i, /full disclosure/i],
    explain:
      'The authors publicly listed every funding source and financial relationship. Transparency does not eliminate bias, but it lets you weigh it honestly.',
  },
  {
    canonical: 'Publicly Funded',
    tone: 'good',
    match: [/publicly funded/i, /public grant/i, /nih.funded/i, /government funded/i],
    explain:
      'Funded by public agencies (NIH, NSF, government grants) or independent foundations, so there is no direct commercial interest in the outcome.',
  },

  // ------------------------- AMBER (yellow) cautions -----------------------------
  {
    canonical: 'Not Yet Peer Reviewed',
    tone: 'amber',
    match: [/not yet peer.?reviewed/i, /preprint/i, /pre.print/i],
    explain:
      'This is a preprint — it has not yet been vetted by other scientists. Findings may still change or be retracted before formal publication. Treat as preliminary.',
  },
  {
    canonical: 'Small Study',
    tone: 'amber',
    match: [/small study/i, /small sample/i, /underpowered/i, /small.?n\b/i],
    explain:
      'Small samples produce noisy results. Effects that look impressive in a small study often shrink or vanish when the study is repeated at scale.',
  },
  {
    canonical: 'Observational Only',
    tone: 'amber',
    match: [/observational only/i, /observational study/i, /cohort study/i, /case.control/i],
    explain:
      'The researchers watched what happened but did not randomly assign participants to a treatment. This design can show correlation but cannot prove cause and effect.',
  },
  {
    canonical: 'Cross-Sectional',
    tone: 'amber',
    match: [/cross.?sectional/i],
    explain:
      'A snapshot at a single point in time. Useful for describing patterns, but limited for showing whether one thing actually causes another.',
  },
  {
    canonical: 'Animal Study Only',
    tone: 'amber',
    match: [/animal study only/i, /animal.only/i, /^animal$/i, /rodent study/i, /mouse study/i, /rat study/i, /in vivo animal/i],
    explain:
      'Findings come from mice, rats, or other animals — not humans. Most animal findings do not translate cleanly to people. Useful as a lead, not as evidence for human action.',
  },
  {
    canonical: 'Cell / In-Vitro Only',
    tone: 'amber',
    match: [/in.vitro/i, /^cell study$/i, /cell culture/i, /petri/i],
    explain:
      'Done in cells or tissue in a lab dish, not in a living organism. These studies suggest mechanisms; they do not show that anything happens the same way inside a person.',
  },
  {
    canonical: 'Short Follow-up',
    tone: 'amber',
    match: [/short follow.?up/i, /short.term (only|study)/i],
    explain:
      'The study is too short to catch delayed benefits, side effects, or whether early results hold up over time.',
  },
  {
    canonical: 'Industry Funded',
    tone: 'amber',
    match: [/industry funded/i, /industry.sponsored/i, /pharma funded/i, /supplement.industry funded/i],
    explain:
      'A company with a financial stake in the outcome paid for the research. This does not automatically mean the findings are wrong, but industry-funded studies show a documented tendency to favour the sponsor. Weigh the evidence more carefully.',
  },
  {
    canonical: 'No Control Group',
    tone: 'amber',
    match: [/no control group/i, /no comparator/i, /single.arm/i, /uncontrolled/i],
    explain:
      'Without a comparison group, we cannot tell whether the effect came from the intervention or from the placebo effect, natural recovery, or random variation.',
  },
  {
    canonical: 'Self-Reported Outcomes',
    tone: 'amber',
    match: [/self.report/i, /self.assessed/i, /survey.based/i],
    explain:
      'Outcomes are what participants reported about themselves rather than objective measurements. Prone to memory error and social-desirability bias.',
  },

  // ------------------------- CRITICAL (red) — do not trust ------------------------
  {
    canonical: 'RETRACTED',
    tone: 'critical',
    match: [/retracted/i, /retraction/i],
    explain:
      'The publishing journal has formally retracted this paper — usually because of serious errors, fraud, or methodological failure. Do not cite. Do not build on the findings.',
  },
  {
    canonical: 'Conflict Not Disclosed',
    tone: 'critical',
    match: [/conflict.*not.*disclosed/i, /undisclosed conflict/i, /hidden.*conflict/i],
    explain:
      'Investigators had a financial or personal stake in the outcome that they did not declare. Without disclosure, you cannot judge how much that stake shaped the design or interpretation.',
  },
  {
    canonical: 'Predatory Journal',
    tone: 'critical',
    match: [/predatory journal/i, /pay.to.publish/i, /questionable journal/i],
    explain:
      'Published in a pay-to-publish journal with minimal or no peer review. The scientific community treats findings in these venues as unverified.',
  },
  {
    canonical: 'Ghost Authorship',
    tone: 'critical',
    match: [/ghost author/i, /ghost.written/i],
    explain:
      'The listed authors did not actually write the paper — usually an industry writer did, and academic names were added for credibility. A major red flag for hidden influence.',
  },
]

/** Look up a raw flag label -> canonical entry. Falls back to a best-effort neutral entry. */
export function getFlagMeta(rawLabel = '', fallbackTone = 'amber') {
  if (!rawLabel || typeof rawLabel !== 'string') return null
  const label = rawLabel.trim()
  if (!label) return null

  // exact canonical match first
  const exact = FLAGS.find((f) => f.canonical.toLowerCase() === label.toLowerCase())
  if (exact) return exact

  // then any regex matcher
  const via = FLAGS.find((f) => f.match.some((re) => re.test(label)))
  if (via) return { ...via, canonical: via.canonical }

  // unknown flag — pass through with the AI-provided tone (defaults to amber)
  return {
    canonical: label,
    tone: fallbackTone === 'good' || fallbackTone === 'critical' ? fallbackTone : 'amber',
    explain:
      'Additional quality signal detected by the AI reliability step. Hover / tap to see how confident to be in this study.',
    unknown: true,
  }
}

/** Sorted list of all canonical flags, used by the on-site glossary. */
export function allFlags() {
  return FLAGS.slice().sort((a, b) => {
    const order = { good: 0, amber: 1, critical: 2 }
    if (order[a.tone] !== order[b.tone]) return order[a.tone] - order[b.tone]
    return a.canonical.localeCompare(b.canonical)
  })
}
