// /app/lib/trainingProtocol.js
// SelfScience — Variant-driven Training Protocol Generator.
//
// Mirrors the shape of lib/supplementProtocol.js so the UI can reuse the
// same card conventions. Rules classify into three categories:
//   • style     — which training style your variants favor (power vs endurance)
//   • recovery  — injury/connective-tissue and recovery cadence guidance
//   • cardio    — cardio adaptation, fuel utilization, HIIT response
//
// All copy uses research-language framing ("associated with", "research
// suggests", "studied in relation to"). Nothing here is a training
// prescription or a medical claim.

import { flattenReportCards } from './supplementProtocol'

// ---- Genotype helpers (kept private; mirror supplementProtocol.js) ----
function findCard(cards, rsid) { return cards.find((c) => c.rsid === rsid) || null }
function hasGenotype(cards, rsid, ...gts) {
  const c = findCard(cards, rsid); if (!c?.genotype) return false
  const gt = String(c.genotype).toUpperCase().replace(/[^A-Z]/g, '')
  const s = gt.length === 2 ? [...gt].sort().join('') : gt
  return gts.some((g) => {
    const x = String(g).toUpperCase().replace(/[^A-Z]/g, '')
    return s === (x.length === 2 ? [...x].sort().join('') : x)
  })
}
function hasHaplotype(cards, rsidHints, ...statusNames) {
  const hints = Array.isArray(rsidHints) ? rsidHints : [rsidHints]
  return cards.some((c) => c.is_haplotype && (hints.includes(c.rsid) ||
    hints.some((h) => (c.gene || '').includes(h))) && statusNames.includes(c.haplotype_name))
}

// ---------------------------------------------------------------------------
// TRAINING_PROTOCOL_MAP
// ---------------------------------------------------------------------------

export const TRAINING_PROTOCOL_MAP = [
  // ============================================================
  // TRAINING STYLE
  // ============================================================
  {
    id: 'actn3-rr',
    gene: 'ACTN3',
    genotypePattern: 'RR (power-favoring)',
    rsids: ['rs1815739'],
    category: 'style',
    matches: (cards) => hasHaplotype(cards, ['rs1815739'], 'power') || hasGenotype(cards, 'rs1815739', 'CC', 'GG'),
    recommendations: [
      {
        name: 'Power / strength emphasis',
        dose: '3–4 sessions/week compound lifts + explosive work',
        mechanism: 'Full alpha-actinin-3 expression in fast-twitch fibers is associated in research with a power-favored phenotype and elite sprinting profiles.',
        researchBasis: 'ACTN3 R577X studies (Yang et al., MacArthur et al.) show RR carriers overrepresented in elite power/sprint cohorts.',
        note: 'Endurance work still improves cardiovascular health — keep 2–3 sessions of Zone 2 per week alongside the power emphasis.',
      },
      {
        name: 'Plyometric progression',
        dose: 'Introduce jump / throw work 2×/week, low volume progressive',
        mechanism: 'Fast-twitch dominance responds well to reactive strength work.',
        researchBasis: 'Plyometric training studies show larger neuromuscular gains in power-genotype cohorts.',
      },
    ],
  },
  {
    id: 'actn3-xx',
    gene: 'ACTN3',
    genotypePattern: 'XX (endurance-favoring)',
    rsids: ['rs1815739'],
    category: 'style',
    matches: (cards) => hasHaplotype(cards, ['rs1815739'], 'endurance') || hasGenotype(cards, 'rs1815739', 'TT', 'AA'),
    recommendations: [
      {
        name: 'Endurance / aerobic emphasis',
        dose: '4–5 Zone 2 sessions/week, one long ride/run',
        mechanism: 'No alpha-actinin-3 in fast-twitch fibers is associated in research with an endurance-favored metabolic profile and higher fat oxidation at submaximal intensities.',
        researchBasis: 'ACTN3 R577X endurance-athlete studies show XX overrepresentation in elite endurance cohorts.',
      },
      {
        name: 'Strength maintenance (not neglect)',
        dose: '2 short strength sessions/week (compound lifts, 4–6 reps)',
        mechanism: 'Even endurance-favored genotypes benefit from strength maintenance for injury resilience and metabolic health.',
        researchBasis: 'Concurrent training research supports this hybrid model regardless of genotype.',
      },
    ],
  },
  {
    id: 'actn3-rx',
    gene: 'ACTN3',
    genotypePattern: 'RX (balanced)',
    rsids: ['rs1815739'],
    category: 'style',
    matches: (cards) => hasHaplotype(cards, ['rs1815739'], 'balanced') || hasGenotype(cards, 'rs1815739', 'CT', 'TC', 'AG', 'GA'),
    recommendations: [
      {
        name: 'Hybrid programming',
        dose: '2–3 strength + 2–3 aerobic sessions/week',
        mechanism: 'One functional ACTN3 copy is associated with mixed-fiber performance — the profile responds to both power and endurance stimuli.',
        researchBasis: 'Heterozygous ACTN3 cohorts are the largest group and appear across athletic phenotypes.',
        note: 'You have the most training flexibility of the three ACTN3 genotypes — pick the goal that matches your life, not the gene.',
      },
    ],
  },

  // ============================================================
  // CARDIO & METABOLIC ADAPTATION
  // ============================================================
  {
    id: 'ppargc1a-glygly',
    gene: 'PPARGC1A',
    genotypePattern: 'Gly/Gly (blunted aerobic response)',
    rsids: ['rs8192678'],
    category: 'cardio',
    matches: (cards) => hasGenotype(cards, 'rs8192678', 'CC', 'GG'),
    recommendations: [
      {
        name: 'Higher Zone 2 frequency',
        dose: '4–5×/week Zone 2, 45–60 min per session',
        mechanism: 'PPARGC1A (PGC-1α) is a master regulator of mitochondrial biogenesis. Gly/Gly variant is studied in relation to blunted training-induced mitochondrial adaptation — more frequent low-intensity work is needed to reach equivalent adaptation.',
        researchBasis: 'PPARGC1A Gly482Ser training-response studies show reduced mitochondrial density gain per session in Gly carriers, offset by higher training frequency.',
      },
      {
        name: 'Add a weekly VO2max session',
        dose: '1×/week, 4×4 min at ~85–95% HRmax, 3 min rest',
        mechanism: 'High-intensity intervals recruit additional mitochondrial and cardiac adaptation pathways beyond Zone 2 alone.',
        researchBasis: 'HIIT research consistently shows added VO2max gain over base training regardless of genotype.',
      },
    ],
  },
  {
    id: 'ppara-cc',
    gene: 'PPARA',
    genotypePattern: 'CC (favored fat-oxidation profile)',
    rsids: ['rs4253778'],
    category: 'cardio',
    matches: (cards) => hasGenotype(cards, 'rs4253778', 'CC', 'GG'),
    recommendations: [
      {
        name: 'Fasted aerobic work is well-tolerated',
        dose: '1–2×/week, morning Zone 2 sessions before breakfast',
        mechanism: 'PPARA CC is associated in research with a fat-oxidation favored metabolic profile at submaximal intensities.',
        researchBasis: 'PPARA variant studies in endurance athletes link the CC genotype to higher fat-oxidation rates and endurance performance.',
        note: 'This does NOT mean you should avoid carbs — high-intensity performance still requires glycogen. Fasted work is a Zone 2 tool, not a race-day tactic.',
      },
    ],
  },
  {
    id: 'adrb2-hiit-responder',
    gene: 'ADRB2',
    genotypePattern: 'Arg16 carrier (rs1042713 GG or AG)',
    rsids: ['rs1042713'],
    category: 'cardio',
    matches: (cards) => hasGenotype(cards, 'rs1042713', 'GG', 'AG', 'GA', 'CC', 'CT', 'TC'),
    recommendations: [
      {
        name: 'HIIT is well-tolerated',
        dose: '2–3 HIIT sessions/week (30–60 s efforts, 1:2 work:rest)',
        mechanism: 'ADRB2 Arg16 is studied in relation to catecholamine sensitivity and short-interval training response.',
        researchBasis: 'ADRB2 pharmacogenomic and training-response research links the Arg16 genotype to greater short-effort adaptation.',
      },
    ],
  },

  // ============================================================
  // RECOVERY & INJURY / CONNECTIVE TISSUE
  // ============================================================
  {
    id: 'col5a1-sensitive',
    gene: 'COL5A1',
    genotypePattern: 'TT (connective tissue sensitivity)',
    rsids: ['rs12722'],
    category: 'recovery',
    matches: (cards) => hasGenotype(cards, 'rs12722', 'TT', 'AA'),
    recommendations: [
      {
        name: 'Progress load gradually — no more than +10%/week',
        dose: 'Behavioral',
        mechanism: 'COL5A1 TT is associated with altered type-V collagen structure and higher research-observed rates of tendon/ligament stress injuries under rapid load progression.',
        researchBasis: 'Multiple sports-medicine cohorts link COL5A1 TT to soft-tissue injury susceptibility.',
      },
      {
        name: 'Collagen + vitamin C 30–60 min pre-loading',
        dose: '15–20 g hydrolyzed collagen + 50 mg vitamin C',
        mechanism: 'Pre-loading collagen with vitamin C is studied for stimulating collagen synthesis around mechanical loading windows.',
        researchBasis: 'Shaw et al. 2017 and follow-up work show measurable collagen-synthesis markers with this timing protocol.',
      },
      {
        name: 'Add tendon-specific work weekly',
        dose: 'Isometrics (30–45 s holds × 5) or heavy slow resistance 1×/week per prone tendon',
        mechanism: 'Isometric and heavy-slow resistance protocols are studied specifically for tendon adaptation and pain reduction.',
        researchBasis: 'Heavy Slow Resistance protocols (Kongsgaard, Beyer) show consistent tendon response in clinical trials.',
      },
    ],
    disclaimerNote: 'If you have a history of tendon or ligament injury, discuss load progression with a qualified sports-medicine practitioner.',
  },
  {
    id: 'col1a1-sensitive',
    gene: 'COL1A1',
    genotypePattern: 'ss (rs1800012 TT) — collagen fiber density variant',
    rsids: ['rs1800012'],
    category: 'recovery',
    matches: (cards) => hasGenotype(cards, 'rs1800012', 'TT', 'AA'),
    recommendations: [
      {
        name: 'Longer warm-up before max efforts',
        dose: '15–20 min general + specific warm-up before heavy lifts or sprints',
        mechanism: 'COL1A1 rs1800012 is studied in relation to collagen fiber density and tendon rupture risk under acute high-load stress.',
        researchBasis: 'Cross-sectional and injury-cohort studies associate the variant with cruciate ligament and Achilles injury risk.',
      },
    ],
  },
  {
    id: 'il6-inflammation',
    gene: 'IL6',
    genotypePattern: '-174 CC (higher inflammatory response)',
    rsids: ['rs1800795'],
    category: 'recovery',
    matches: (cards) => hasGenotype(cards, 'rs1800795', 'CC', 'GG'),
    recommendations: [
      {
        name: 'More conservative deload cadence',
        dose: 'Deload every 3–4 weeks (versus 5–6 for GG carriers)',
        mechanism: 'IL6 -174 CC is associated in research with a larger post-exercise inflammatory response and slower systemic recovery.',
        researchBasis: 'IL6 promoter polymorphism research links the CC genotype to higher exercise-induced cytokine release.',
      },
      {
        name: 'Prioritize sleep before training volume',
        dose: '7–9 h target; reduce volume before adding intensity when sleep drops',
        mechanism: 'Sleep is the primary modifiable input for inflammation-recovery balance.',
        researchBasis: 'Sleep-and-recovery research is one of the most consistent findings in sports science.',
      },
    ],
  },
  {
    id: 'mmp1-remodel',
    gene: 'MMP1',
    genotypePattern: '2G/2G (rs1799750)',
    rsids: ['rs1799750'],
    category: 'recovery',
    matches: (cards) => hasGenotype(cards, 'rs1799750', 'GG'),
    recommendations: [
      {
        name: 'Cycle mobility work weekly',
        dose: '2–3 short mobility sessions/week (10–15 min each)',
        mechanism: 'MMP1 2G/2G is studied in relation to connective tissue remodeling rate and injury risk under repetitive loading.',
        researchBasis: 'MMP1 promoter variant research links the 2G/2G genotype to tendinopathy susceptibility.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Matcher (mirrors supplementProtocol)
// ---------------------------------------------------------------------------

export function matchTrainingToUserVariants(reportOrCards) {
  const cards = Array.isArray(reportOrCards) ? reportOrCards : flattenReportCards(reportOrCards)
  const groups = { style: [], cardio: [], recovery: [] }
  for (const entry of TRAINING_PROTOCOL_MAP) {
    try {
      if (entry.matches(cards)) groups[entry.category].push(entry)
    } catch (err) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.warn(`[trainingProtocol] matcher threw for ${entry.id}:`, err)
      }
    }
  }
  return groups
}

export const TRAINING_DISCLAIMER =
  'These suggestions are educational and based on published research associations. They are not a personal training prescription. Discuss any material change in training with a qualified coach or sports-medicine clinician.'

export const TRAINING_CATEGORY_META = {
  style:    { label: 'Training Style',       subtitle: 'What your variants suggest as your primary training emphasis.' },
  cardio:   { label: 'Cardio & Metabolic',   subtitle: 'How your variants influence aerobic and metabolic adaptation.' },
  recovery: { label: 'Recovery & Connective Tissue', subtitle: 'Injury-prevention and recovery-cadence considerations.' },
}
