// /app/lib/training/summary.js
// Deterministic "3A — Your Genetic Training Summary" builder.
// Reads the resolved profile and produces a 3–5 sentence paragraph
// written directly to the user ("you", "your") — no LLM, always identical
// for the same inputs.

export function buildTrainingSummary(profile) {
  if (!profile || !profile.cards) return null
  const covered = profile.cards.filter((c) => c.covered)
  if (covered.length === 0) {
    return "Your genome file did not contain the ten variants we use to shape training — that\u2019s okay. This protocol is built from your intake answers using published evidence for your experience level and goals. If you switch to a chip or WGS test that covers these rsIDs, come back here to regenerate a genome-personalised plan."
  }

  const byRs = Object.fromEntries(covered.map((c) => [c.rsid, c]))

  const sentences = []

  // Fiber-type / power vs endurance framing — ACTN3 leads.
  const actn3 = byRs['rs1815739']
  if (actn3) {
    if (actn3.genotype === 'CC') {
      sentences.push('Your genome tells a clear story: you are built for power. Your ACTN3 RR genotype means your muscle fibres are fast-twitch dominant — you respond exceptionally well to explosive, heavy, and short-burst work.')
    } else if (actn3.genotype === 'TT') {
      sentences.push('Your genome tells a clear story: you are built for endurance. Your ACTN3 XX genotype means your muscle fibres are slow-twitch dominant — you respond better to sustained aerobic work than to maximal power efforts. This does not mean you cannot or should not lift heavy — it means your strength gains will come more from volume and time under tension than from maximal load.')
    } else {
      sentences.push('Your genome shows a balanced fibre-type profile — you have real optionality. Your ACTN3 RX genotype puts you in the flexible middle ground where both strength and endurance training produce strong adaptations.')
    }
  }

  // ACE reinforces or nuances the above.
  const ace = byRs['rs4646994']
  if (ace) {
    if (ace.genotype === 'II') sentences.push('Your ACE II genotype reinforces this by giving you a higher-than-average aerobic ceiling and a strong VO\u2082max response to endurance training.')
    else if (ace.genotype === 'DD') sentences.push('Your ACE DD genotype adds a power bias to your cardiovascular profile — you produce force efficiently but fatigue faster in sustained aerobic work.')
  }

  // Connective tissue — this drives the most protocol-level change.
  const col5a1 = byRs['rs12722']
  const mmp3   = byRs['rs679620']
  if (col5a1?.genotype === 'TT' || mmp3?.genotype === 'GG') {
    sentences.push('Your most important finding for training is connective-tissue: your genotype indicates elevated tendon and ligament vulnerability. This does not restrict what you can do — it prescribes how you prepare for it. Collagen support before every session is mandatory, volume increases are capped, and warm-up is not optional.')
  } else if (col5a1?.genotype === 'CT') {
    sentences.push('Your COL5A1 CT genotype puts your connective tissue at moderate injury risk — a manageable factor with a smart warm-up and a collagen protocol on heavier days.')
  }

  // Mitochondrial responsiveness.
  const pgc = byRs['rs8192678']
  if (pgc?.genotype === 'GG') {
    sentences.push('Your PPARGC1A Gly/Gly genotype tells us your mitochondrial adaptation to endurance training is blunted — you need more Zone 2 volume than average to achieve the same cardiovascular gains. Do not cut aerobic time in favour of intensity; the volume is the point.')
  }

  // Cortisol / recovery.
  const fkbp = byRs['rs1360780']
  if (fkbp?.genotype === 'TT') {
    sentences.push('Your FKBP5 TT genotype means your cortisol response to hard sessions runs longer and higher — back-to-back intense days will accumulate stress load quickly. Sleep and active-recovery days are training variables, not lifestyle preferences, for your physiology.')
  }

  // Metabolic timing (only if relevant).
  const mtnr = byRs['rs10830963']
  if (mtnr?.genotype === 'GG') {
    sentences.push('Your MTNR1B GG genotype makes fasted training metabolically risky for you — morning sessions should be preceded by a small (20\u201340 g) carbohydrate intake, and late-night eating undermines next-morning readiness.')
  }

  // Cap at 5 sentences — keep it dense.
  return sentences.slice(0, 5).join(' ')
}
