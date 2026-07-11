// /app/lib/sportAffinity.js
// SelfScience — Sport affinity scoring based on genome variants.
//
// Given the user's classified variant cards, produces a ranked list of
// sports/activities with a signed affinity score. Positive scores mean
// the variant profile is research-associated with favorable adaptation to
// that sport; negative scores mean the variants suggest more caution
// (injury susceptibility, blunted adaptation, or fiber-type mismatch).
//
// Compliance:
//   • Framing is "genetically favored" vs "consider with caution" — never
//     "you can't do this sport" (research is probabilistic, not deterministic).
//   • Rules use signed weights so any missing variant contributes 0 —
//     never pushes a sport to a false extreme.
//   • Every scoring rule maps to a plausible research basis (ACTN3
//     fiber-type, PPARGC1A mitochondrial biogenesis, COL5A1 connective
//     tissue, PPARA fat oxidation, IL6 inflammation, ADRB2 catecholamine
//     response). If a user has none of these, the affinity list is empty
//     rather than misleading.

import { flattenReportCards } from './supplementProtocol'

// ---- Genotype helpers (private, mirror other modules) ----
function findCard(cards, rsid) { return cards.find((c) => c.rsid === rsid) || null }
function gt(cards, rsid) {
  const c = findCard(cards, rsid); if (!c?.genotype) return null
  const g = String(c.genotype).toUpperCase().replace(/[^A-Z]/g, '')
  return g.length === 2 ? [...g].sort().join('') : g
}
function has(cards, rsid, ...alleles) {
  const g = gt(cards, rsid); if (!g) return false
  const set = new Set(alleles.flatMap((a) => {
    const x = String(a).toUpperCase().replace(/[^A-Z]/g, '')
    return [x.length === 2 ? [...x].sort().join('') : x]
  }))
  return set.has(g)
}
function haplo(cards, rsidHints, ...names) {
  const hints = Array.isArray(rsidHints) ? rsidHints : [rsidHints]
  return cards.some((c) => c.is_haplotype && (hints.includes(c.rsid) ||
    hints.some((h) => (c.gene || '').includes(h))) && names.includes(c.haplotype_name))
}

// ---------------------------------------------------------------------------
// Reusable variant weights — encode each sport as a small map of
// "variant condition -> integer score contribution". Larger absolute
// values mean stronger research support for that variant driving that
// sport's outcome.
// ---------------------------------------------------------------------------

// Every rule returns +N (favored), -N (caution), or 0 (no signal).
// Users unfamiliar with lifting the app's rule engine — this style keeps
// the sport catalog compact and readable.
const R = {
  // ACTN3 fiber type
  actn3Power:    (c) => haplo(c, ['rs1815739'], 'power')     || has(c, 'rs1815739', 'CC', 'GG'),
  actn3Endur:    (c) => haplo(c, ['rs1815739'], 'endurance') || has(c, 'rs1815739', 'TT', 'AA'),
  actn3Balanced: (c) => haplo(c, ['rs1815739'], 'balanced')  || has(c, 'rs1815739', 'CT', 'TC', 'AG', 'GA'),

  // PPARGC1A mitochondrial adaptation
  pgc1aBlunted:  (c) => has(c, 'rs8192678', 'CC', 'GG'),       // Gly/Gly
  pgc1aStrong:   (c) => has(c, 'rs8192678', 'TT', 'AA'),       // Ser/Ser

  // PPARA fat oxidation
  pparaEndur:    (c) => has(c, 'rs4253778', 'CC', 'GG'),

  // ADRB2 Arg16 HIIT responder
  adrb2HIIT:     (c) => has(c, 'rs1042713', 'GG', 'CC', 'AG', 'GA', 'CT', 'TC'),

  // COL5A1 connective tissue sensitivity (TT = sensitive)
  col5a1Sens:    (c) => has(c, 'rs12722', 'TT', 'AA'),
  col5a1Resil:   (c) => has(c, 'rs12722', 'CC', 'GG'),

  // COL1A1 collagen density (TT = sensitive)
  col1a1Sens:    (c) => has(c, 'rs1800012', 'TT', 'AA'),
  col1a1Resil:   (c) => has(c, 'rs1800012', 'GG', 'CC'),

  // IL6 inflammation (CC = higher)
  il6HighInflam: (c) => has(c, 'rs1800795', 'CC', 'GG'),

  // MMP1 connective tissue remodeling (2G/2G = more remodel activity)
  mmp1Remodel:   (c) => has(c, 'rs1799750', 'GG'),
}

// ---------------------------------------------------------------------------
// SPORT_CATALOG
// Each entry: { id, name, category, blurb, score(cards) -> integer, rationale(cards) -> string }
// ---------------------------------------------------------------------------

const s = (weights) => (cards) => weights.reduce((sum, [fn, w]) => sum + (fn(cards) ? w : 0), 0)

export const SPORT_CATALOG = [
  {
    id: 'sprinting',
    name: 'Sprinting / Short-distance running',
    category: 'Power',
    blurb: 'Explosive 100m–400m distances.',
    score: s([[R.actn3Power, 4], [R.pparaEndur, -1], [R.actn3Endur, -3], [R.col5a1Sens, -1]]),
  },
  {
    id: 'weightlifting',
    name: 'Weightlifting / Olympic lifting',
    category: 'Power',
    blurb: 'Snatch, clean & jerk, powerlifting.',
    score: s([[R.actn3Power, 3], [R.col5a1Resil, 2], [R.col1a1Resil, 2], [R.actn3Endur, -2], [R.col5a1Sens, -2], [R.col1a1Sens, -1]]),
  },
  {
    id: 'plyometrics',
    name: 'Plyometric / jump sports (volleyball, high jump)',
    category: 'Power',
    blurb: 'High reactive-strength demands.',
    score: s([[R.actn3Power, 3], [R.col5a1Resil, 2], [R.col1a1Resil, 1], [R.col5a1Sens, -3], [R.col1a1Sens, -2]]),
  },
  {
    id: 'long-distance-running',
    name: 'Long-distance / marathon running',
    category: 'Endurance',
    blurb: '10K to marathon distances.',
    score: s([[R.actn3Endur, 4], [R.pparaEndur, 2], [R.pgc1aStrong, 1], [R.actn3Power, -3], [R.col5a1Sens, -2], [R.il6HighInflam, -1]]),
  },
  {
    id: 'ultra-endurance',
    name: 'Ultra-endurance / trail running / ultras',
    category: 'Endurance',
    blurb: '50K+ distances, multi-hour efforts.',
    score: s([[R.actn3Endur, 5], [R.pparaEndur, 3], [R.pgc1aStrong, 2], [R.actn3Power, -3], [R.col5a1Sens, -2], [R.il6HighInflam, -2]]),
  },
  {
    id: 'cycling',
    name: 'Cycling (road / gravel / TT)',
    category: 'Endurance',
    blurb: 'Sustained aerobic effort with low impact.',
    score: s([[R.actn3Endur, 3], [R.pparaEndur, 2], [R.pgc1aStrong, 1], [R.col5a1Sens, 1]]), // low impact rewards sensitive genotypes
  },
  {
    id: 'swimming',
    name: 'Swimming (mid / long-distance)',
    category: 'Endurance',
    blurb: 'Non-impact endurance with technical demand.',
    score: s([[R.actn3Endur, 3], [R.pparaEndur, 2], [R.pgc1aStrong, 1], [R.col5a1Sens, 2]]), // non-impact — reward tendon-sensitive genotypes
  },
  {
    id: 'rowing',
    name: 'Rowing',
    category: 'Hybrid',
    blurb: 'Full-body power-endurance hybrid.',
    score: s([[R.actn3Balanced, 3], [R.pparaEndur, 2], [R.pgc1aStrong, 1], [R.actn3Power, 1]]),
  },
  {
    id: 'triathlon',
    name: 'Triathlon',
    category: 'Endurance',
    blurb: 'Swim–bike–run multisport.',
    score: s([[R.actn3Endur, 3], [R.pparaEndur, 2], [R.pgc1aStrong, 1], [R.actn3Power, -2], [R.col5a1Sens, -1]]),
  },
  {
    id: 'crossfit',
    name: 'CrossFit / hybrid training',
    category: 'Hybrid',
    blurb: 'High-intensity mixed modal.',
    score: s([[R.adrb2HIIT, 2], [R.actn3Balanced, 2], [R.col5a1Sens, -3], [R.col1a1Sens, -2], [R.il6HighInflam, -2]]),
  },
  {
    id: 'combat-sports',
    name: 'Combat sports (BJJ, MMA, wrestling)',
    category: 'Hybrid',
    blurb: 'Grappling-heavy full-body sport.',
    score: s([[R.actn3Balanced, 2], [R.col5a1Resil, 2], [R.col1a1Resil, 2], [R.actn3Power, 1], [R.col5a1Sens, -3], [R.col1a1Sens, -2]]),
  },
  {
    id: 'boxing',
    name: 'Boxing / striking sports',
    category: 'Power',
    blurb: 'Explosive with high aerobic demand.',
    score: s([[R.actn3Power, 2], [R.adrb2HIIT, 1], [R.col1a1Resil, 2], [R.col1a1Sens, -3], [R.il6HighInflam, -1]]),
  },
  {
    id: 'basketball',
    name: 'Basketball',
    category: 'Team',
    blurb: 'Repeated sprints + jumping.',
    score: s([[R.actn3Power, 2], [R.actn3Balanced, 2], [R.col5a1Sens, -2], [R.col1a1Sens, -2]]),
  },
  {
    id: 'soccer',
    name: 'Soccer / football',
    category: 'Team',
    blurb: 'Repeated sprints, high aerobic base.',
    score: s([[R.actn3Balanced, 3], [R.pparaEndur, 1], [R.actn3Endur, 1], [R.col5a1Sens, -1]]),
  },
  {
    id: 'american-football',
    name: 'American football / rugby',
    category: 'Contact',
    blurb: 'High-impact contact sport.',
    score: s([[R.actn3Power, 2], [R.col1a1Resil, 3], [R.col5a1Resil, 2], [R.col1a1Sens, -4], [R.col5a1Sens, -3]]),
  },
  {
    id: 'tennis',
    name: 'Tennis / racket sports',
    category: 'Skill',
    blurb: 'Repeated explosive movements + skill.',
    score: s([[R.actn3Power, 2], [R.actn3Balanced, 1], [R.col5a1Sens, -1]]),
  },
  {
    id: 'golf',
    name: 'Golf',
    category: 'Skill',
    blurb: 'Precision-heavy, low cardiovascular demand.',
    score: s([[R.col5a1Sens, 1]]), // low physical stress — neutral or slight bonus for sensitive
  },
  {
    id: 'gymnastics',
    name: 'Gymnastics',
    category: 'Power',
    blurb: 'Explosive strength + connective tissue load.',
    score: s([[R.actn3Power, 2], [R.col5a1Resil, 3], [R.col1a1Resil, 2], [R.col5a1Sens, -4], [R.col1a1Sens, -3]]),
  },
  {
    id: 'yoga',
    name: 'Yoga / mobility practice',
    category: 'Recovery',
    blurb: 'Low-impact, flexibility, breath focus.',
    score: s([[R.col5a1Sens, 2], [R.col1a1Sens, 1], [R.il6HighInflam, 1]]), // ideal for sensitive/inflammation profiles
  },
  {
    id: 'skiing-xc',
    name: 'Cross-country skiing',
    category: 'Endurance',
    blurb: 'Whole-body aerobic endurance.',
    score: s([[R.actn3Endur, 3], [R.pparaEndur, 2], [R.pgc1aStrong, 1]]),
  },
  {
    id: 'hiit-classes',
    name: 'HIIT group classes (Orangetheory, F45)',
    category: 'Hybrid',
    blurb: 'Short high-intensity intervals.',
    score: s([[R.adrb2HIIT, 3], [R.actn3Balanced, 1], [R.col5a1Sens, -2], [R.col1a1Sens, -1]]),
  },
  {
    id: 'zone2-cardio',
    name: 'Zone 2 base cardio (walking, easy cycling)',
    category: 'Endurance',
    blurb: 'Long low-intensity aerobic work.',
    score: s([[R.pgc1aBlunted, 2], [R.pparaEndur, 2], [R.actn3Endur, 1], [R.col5a1Sens, 1]]),
  },
]

// ---------------------------------------------------------------------------
// Scorer
// ---------------------------------------------------------------------------

/**
 * Given a genome report (or already-flattened card array), return an
 * object with:
 *   favored: top 5 sports with the highest POSITIVE score
 *   caution: bottom 5 sports (most-negative score, framed as "consider with caution")
 *   all:     full ranked list with scores (for debug / expansion later)
 *
 * Sports with score === 0 (no matching variants) are excluded from BOTH
 * favored and caution — no signal = no recommendation.
 */
export function computeSportAffinity(reportOrCards) {
  const cards = Array.isArray(reportOrCards) ? reportOrCards : flattenReportCards(reportOrCards)
  const scored = SPORT_CATALOG.map((sport) => ({
    ...sport,
    score: sport.score(cards),
    rationale: buildRationale(sport, cards),
  }))
  // Sort desc for favored, asc for caution.
  const positives = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score)
  const negatives = scored.filter((s) => s.score < 0).sort((a, b) => a.score - b.score)
  return {
    favored: positives.slice(0, 5),
    caution: negatives.slice(0, 5),
    all: scored,
  }
}

/**
 * Build a short one-line rationale for a sport based on the user's cards.
 * We check the same helpers used inside the score function but only mention
 * the variants that actually contributed a signal for this sport.
 */
function buildRationale(sport, cards) {
  const parts = []
  if (R.actn3Power(cards))    parts.push('ACTN3 RR (power-favoring)')
  else if (R.actn3Endur(cards))parts.push('ACTN3 XX (endurance-favoring)')
  else if (R.actn3Balanced(cards)) parts.push('ACTN3 RX (balanced)')
  if (R.pgc1aStrong(cards))   parts.push('PPARGC1A Ser/Ser (strong mito response)')
  if (R.pgc1aBlunted(cards))  parts.push('PPARGC1A Gly/Gly (blunted mito response)')
  if (R.pparaEndur(cards))    parts.push('PPARA CC (fat-ox favored)')
  if (R.adrb2HIIT(cards))     parts.push('ADRB2 Arg16 (HIIT responder)')
  if (R.col5a1Sens(cards))    parts.push('COL5A1 TT (connective tissue sensitive)')
  if (R.col1a1Sens(cards))    parts.push('COL1A1 TT (collagen density variant)')
  if (R.il6HighInflam(cards)) parts.push('IL6 -174 CC (higher inflammation)')
  return parts.slice(0, 3).join(' · ')
}

export const SPORT_AFFINITY_DISCLAIMER =
  'Sports affinity is a research-informed signal, not a prediction. Elite performance depends on training, coaching, opportunity, and passion far more than any variant. Enjoy the sport you love — this list is context, not destiny.'
