// /app/lib/training/variants.js
// SelfScience Training Protocol — the deterministic knowledge base for
// how genetic variants translate to training implications.
//
// Every genotype has a pre-written, evidence-reviewed copy block. No LLM
// output ever — same genome always produces the same protocol.
//
// GENOTYPE FORMAT: two-base string, unordered (e.g. 'CT' == 'TC').
// We normalise to canonical order at read time.

function key(gt) {
  if (!gt || typeof gt !== 'string' || gt.length !== 2) return null
  const chars = gt.toUpperCase().split('').sort()
  return chars.join('')
}

/**
 * TRAINING_VARIANTS — the master list of variants used by the engine.
 *
 * category: 'strength' | 'endurance' | 'injury' | 'recovery' | 'metabolic' | 'neuro'
 * priority: 1 = highest (drives protocol structure). Lower priority variants
 *           are informational.
 */
export const TRAINING_VARIANTS = [
  {
    rsid: 'rs1815739',
    gene: 'ACTN3',
    title: 'Muscle Fiber Type',
    category: 'strength',
    oneLiner: 'ACTN3 codes for α-actinin-3, a structural protein specific to fast-twitch muscle fibers.',
    genotypes: {
      CC: {
        label: 'RR — fast-twitch dominant',
        implication: 'You express α-actinin-3 in your fast-twitch fibers, giving you a natural advantage in power, speed, and explosive sports.',
        training: 'Heavy resistance training and short rest intervals are well tolerated. Peak power ceiling is high. Your muscles respond strongly to sprint, jump, and lift work.',
        tags: ['power', 'strength_bias', 'recovers_fast'],
      },
      CT: {
        label: 'RX — balanced fiber type',
        implication: 'You have one copy of the functional gene, giving you a balanced fast/slow profile.',
        training: 'The most flexible genotype for mixed-sport athletes — responds well to both strength and endurance training.',
        tags: ['balanced'],
      },
      TT: {
        label: 'XX — slow-twitch dominant',
        implication: 'You do not produce functional α-actinin-3. Your fast-twitch fibers behave more like slow-twitch — lower peak power but superior fatigue resistance.',
        training: 'Endurance-biased protocols, Zone 2 cardio, higher rep ranges, and longer sustained efforts suit your physiology. Heavy lifting still works, but strength gains come more from volume and time under tension than from maximal load.',
        tags: ['endurance_bias', 'volume_over_intensity'],
      },
    },
  },

  {
    rsid: 'rs4646994',
    gene: 'ACE',
    title: 'Aerobic Capacity & Recovery',
    category: 'endurance',
    oneLiner: 'ACE regulates the renin–angiotensin system, influencing aerobic efficiency and cardiovascular training response.',
    // ACE I/D is technically an insertion/deletion. Consumer chips often
    // report the surrogate SNP rs4341 or rs4363. We handle both.
    surrogateRsids: ['rs4341', 'rs4363', 'rs4340'],
    genotypes: {
      II: {
        label: 'II — endurance-optimized',
        implication: 'Higher aerobic efficiency and stronger VO₂max response to endurance training.',
        training: 'Prioritise aerobic base building. You respond exceptionally well to Zone 2 volume.',
        tags: ['endurance_bias', 'vo2_responder'],
      },
      ID: {
        label: 'ID — balanced',
        implication: 'Balanced across strength and endurance training adaptations.',
        training: 'Mixed-modality training suits you well.',
        tags: ['balanced'],
      },
      DD: {
        label: 'DD — power-optimized',
        implication: 'Better strength and sprint response. May fatigue faster in prolonged endurance work.',
        training: 'Lean into resistance work and short/intense intervals. Endurance gains still occur — they just take more volume.',
        tags: ['power', 'strength_bias'],
      },
    },
  },

  {
    rsid: 'rs12722',
    gene: 'COL5A1',
    title: 'Connective Tissue Injury Risk',
    category: 'injury',
    oneLiner: 'COL5A1 codes for a component of type-V collagen, which regulates tendon and ligament fibril structure.',
    genotypes: {
      TT: {
        label: 'TT — elevated connective tissue risk',
        implication: 'The TT genotype is associated with ~58% higher tendon/ligament injury risk in athletes. This does NOT mean stop training — it means your training plan needs a mandatory connective-tissue support scaffold.',
        training: 'Non-negotiables: 15–20 g hydrolyzed collagen + 50 mg vitamin C, 30–60 min pre-training. Volume progression capped at ~10 %/week. Warm-up and cool-down are mandatory. Prefer softer surfaces and joint-friendly variants.',
        tags: ['injury_risk_high', 'collagen_protocol', 'volume_cap', 'warmup_mandatory'],
      },
      CT: {
        label: 'CT — moderate connective tissue risk',
        implication: 'Intermediate risk. Same collagen protocol is prudent, with slightly more flexibility on volume progression.',
        training: 'Collagen + vitamin C pre-training on high-load days is a smart default. Normal progression, with attention to warm-up quality.',
        tags: ['injury_risk_moderate', 'collagen_protocol'],
      },
      CC: {
        label: 'CC — standard connective tissue risk',
        implication: 'Standard tendon/ligament risk. No specific modification required.',
        training: 'Standard progression guidelines apply. Warm-up thoroughly — as always.',
        tags: ['balanced'],
      },
    },
  },

  {
    rsid: 'rs8192678',
    gene: 'PPARGC1A',
    title: 'Mitochondrial Biogenesis Response',
    category: 'endurance',
    oneLiner: 'PPARGC1A (PGC-1α) is the master regulator of mitochondrial biogenesis and endurance adaptation.',
    genotypes: {
      // rs8192678 alleles: G (Gly) is major, A (Ser) is minor.
      GG: {
        label: 'Gly/Gly — blunted mitochondrial response',
        implication: 'You require more aerobic training volume than average to achieve the same cardiovascular adaptations as Ser-carriers.',
        training: 'Zone 2 volume is your leverage: schedule more of it, not less. Do not shorten aerobic sessions in favour of intensity.',
        tags: ['endurance_volume_high', 'zone2_priority'],
      },
      AG: {
        label: 'Gly/Ser — moderate response',
        implication: 'Moderate mitochondrial response to endurance training.',
        training: 'Standard aerobic prescription is effective.',
        tags: ['balanced'],
      },
      AA: {
        label: 'Ser/Ser — strong response',
        implication: 'Strong mitochondrial response to endurance training.',
        training: 'Standard Zone 2 volumes are highly effective. You get an excellent return on aerobic work.',
        tags: ['endurance_responder'],
      },
    },
  },

  {
    rsid: 'rs4253778',
    gene: 'PPARA',
    title: 'Fat Oxidation',
    category: 'metabolic',
    oneLiner: 'PPARA regulates fat-oxidation gene expression, influencing how efficiently you burn fat as fuel.',
    genotypes: {
      GG: {
        label: 'GG — excellent fat oxidation',
        implication: 'Your genotype supports strong fat-oxidation capacity.',
        training: 'Fat-adapted training strategies (fasted Zone 2, low-carb / ketogenic fueling for endurance work) are well tolerated by this genotype.',
        tags: ['fat_oxidiser'],
      },
      CG: {
        label: 'GC — intermediate',
        implication: 'Intermediate fat-oxidation capacity.',
        training: 'Carbohydrate availability during longer sessions matters more than for GG carriers.',
        tags: ['balanced'],
      },
      CC: {
        label: 'CC — lower fat oxidation',
        implication: 'Lower fat-oxidation efficiency. Your body preferentially uses carbohydrate.',
        training: 'Fuel appropriately with carbs before and during longer sessions. Fasted training may impair performance for this genotype.',
        tags: ['carb_dependent'],
      },
    },
  },

  {
    rsid: 'rs679620',
    gene: 'MMP3',
    title: 'Collagen Turnover Rate',
    category: 'injury',
    oneLiner: 'MMP3 encodes stromelysin-1, an enzyme that degrades extracellular collagen — higher activity means faster tissue turnover.',
    genotypes: {
      // rs679620 alleles A (major) / G (minor). GG = high-activity variant.
      GG: {
        label: 'GG — high collagen turnover',
        implication: 'Your collagen breakdown rate outpaces synthesis under heavy load. Connective tissue repair struggles to keep up.',
        training: 'Collagen synthesis support (same protocol as COL5A1 TT) is beneficial. Recovery days are mandatory, not optional. Prioritise eccentric-loading protocols for tendon adaptation.',
        tags: ['collagen_protocol', 'recovery_priority'],
      },
      AG: {
        label: 'AG — intermediate turnover',
        implication: 'Intermediate collagen turnover.',
        training: 'Standard connective-tissue care is sufficient.',
        tags: ['balanced'],
      },
      AA: {
        label: 'AA — standard turnover',
        implication: 'Standard collagen synthesis/degradation balance.',
        training: 'No specific modification required.',
        tags: ['balanced'],
      },
    },
  },

  {
    rsid: 'rs10830963',
    gene: 'MTNR1B',
    title: 'Metabolic Timing (Fasting Insulin)',
    category: 'metabolic',
    oneLiner: 'MTNR1B encodes the melatonin-1B receptor, which modulates insulin secretion in response to circadian cues.',
    genotypes: {
      GG: {
        label: 'GG — impaired fasting insulin secretion',
        implication: 'Training fasted carries more metabolic risk for this genotype — elevated fasting glucose and blunted early-morning insulin response.',
        training: 'Take a small carbohydrate intake (20–40 g) before morning training. The post-workout nutrition window is especially important. Avoid late-night eating.',
        tags: ['fuel_before_training', 'no_fasted_hard'],
      },
      CG: {
        label: 'CG — intermediate',
        implication: 'Intermediate insulin secretion pattern.',
        training: 'Standard nutrition timing usually works; monitor how fasted training feels.',
        tags: ['balanced'],
      },
      CC: {
        label: 'CC — standard',
        implication: 'Standard fasting insulin secretion.',
        training: 'No specific modification required.',
        tags: ['balanced'],
      },
    },
  },

  {
    rsid: 'rs1360780',
    gene: 'FKBP5',
    title: 'Cortisol Stress Response',
    category: 'recovery',
    oneLiner: 'FKBP5 modulates glucocorticoid-receptor sensitivity — T-allele carriers clear cortisol more slowly after stress.',
    genotypes: {
      TT: {
        label: 'TT — slow cortisol clearance',
        implication: 'High-intensity training produces a larger and longer cortisol spike for you. Back-to-back hard sessions compound stress load rapidly.',
        training: 'Cap consecutive high-intensity days. Active-recovery days are non-negotiable. Sleep is a primary training variable, not a lifestyle preference — 7–9 h/night materially affects your next-day adaptation.',
        tags: ['recovery_priority', 'no_backtoback_hard', 'sleep_critical'],
      },
      CT: {
        label: 'CT — intermediate cortisol clearance',
        implication: 'Intermediate clearance. Still benefits from recovery-first structuring.',
        training: 'Space hard sessions with at least one easier day between. Sleep quality visibly affects performance.',
        tags: ['recovery_priority', 'sleep_critical'],
      },
      CC: {
        label: 'CC — standard cortisol clearance',
        implication: 'Standard cortisol clearance dynamics.',
        training: 'Standard recovery guidelines apply.',
        tags: ['balanced'],
      },
    },
  },

  {
    rsid: 'rs6265',
    gene: 'BDNF',
    title: 'Neuroplasticity (Val66Met)',
    category: 'neuro',
    oneLiner: 'BDNF (brain-derived neurotrophic factor) drives activity-dependent neuroplasticity. The Met allele reduces its activity-dependent secretion.',
    genotypes: {
      // G = Val, A = Met
      GG: {
        label: 'Val/Val — optimal neuroplasticity',
        implication: 'Exercise strongly upregulates BDNF for you. You respond exceptionally well to novel training stimuli, skill work, and coordination-heavy sports.',
        training: 'Vary your training. Skill-based sports (ball sports, climbing, martial arts) produce big cognitive returns.',
        tags: ['neuro_responder', 'skill_bias'],
      },
      AG: {
        label: 'Val/Met — intermediate',
        implication: 'Intermediate activity-dependent BDNF secretion.',
        training: 'Aerobic exercise before skill practice or technical work amplifies learning.',
        tags: ['aerobic_before_skill'],
      },
      AA: {
        label: 'Met/Met — lower activity-dependent BDNF',
        implication: 'Reduced activity-dependent BDNF secretion.',
        training: 'Aerobic exercise before skill or technical training is especially valuable — it primes the brain for new pattern acquisition.',
        tags: ['aerobic_before_skill'],
      },
    },
  },

  {
    rsid: 'rs762551',
    gene: 'CYP1A2',
    title: 'Caffeine Metabolism',
    category: 'metabolic',
    oneLiner: 'CYP1A2 metabolises caffeine. AA carriers clear caffeine quickly (fast metabolizers); CC carriers clear it slowly.',
    genotypes: {
      AA: {
        label: 'AA — fast metabolizer',
        implication: 'You clear caffeine quickly. Pre-training caffeine (3–6 mg/kg) is ergogenic and well tolerated.',
        training: 'Caffeine can meaningfully improve your training output. Timing 30–60 min pre-session works well.',
        tags: ['caffeine_ok'],
      },
      AC: {
        label: 'AC — intermediate metabolizer',
        implication: 'Intermediate caffeine clearance.',
        training: 'Moderate caffeine (2–4 mg/kg) is usually fine. Avoid late-day dosing.',
        tags: ['caffeine_moderate'],
      },
      CC: {
        label: 'CC — slow metabolizer',
        implication: 'Slow caffeine clearance. High-dose caffeine is associated with elevated cardiovascular risk for this genotype.',
        training: 'Cap intake at ~1–2 mg/kg, morning only. Do not use caffeine pre-evening training.',
        tags: ['caffeine_limit'],
      },
    },
  },
]

export const CATEGORY_META = {
  strength:  { label: 'Strength & Power',  color: '#059669' },
  endurance: { label: 'Endurance',          color: '#0891B2' },
  injury:    { label: 'Injury / Caution',   color: '#EA580C' },
  recovery:  { label: 'Recovery',           color: '#7C3AED' },
  metabolic: { label: 'Metabolic',          color: '#B45309' },
  neuro:     { label: 'Neurological',       color: '#7C3AED' },
}

export function normaliseGenotype(gt) {
  return key(gt)
}

/**
 * Resolve a variant against a raw variants map.
 * Returns { covered: boolean, rsid, gene, title, category, oneLiner, genotype?, interp? }.
 *
 * `interp` shape: { label, implication, training, tags[] }
 */
export function resolveVariant(v, rawVariants) {
  if (!rawVariants || typeof rawVariants !== 'object') {
    return { covered: false, rsid: v.rsid, gene: v.gene, title: v.title, category: v.category, oneLiner: v.oneLiner }
  }

  // Primary rsID.
  let raw = rawVariants[v.rsid]
  // If not covered, try surrogates (ACE I/D case).
  if (!raw && Array.isArray(v.surrogateRsids)) {
    for (const alt of v.surrogateRsids) {
      if (rawVariants[alt]) { raw = rawVariants[alt]; break }
    }
  }
  if (!raw) {
    return { covered: false, rsid: v.rsid, gene: v.gene, title: v.title, category: v.category, oneLiner: v.oneLiner }
  }
  const k = key(raw)
  const interp = v.genotypes[k] || v.genotypes[raw?.toUpperCase()]
  if (!interp) {
    return { covered: false, rsid: v.rsid, gene: v.gene, title: v.title, category: v.category, oneLiner: v.oneLiner, rawGenotype: raw }
  }
  return {
    covered: true,
    rsid: v.rsid,
    gene: v.gene,
    title: v.title,
    category: v.category,
    oneLiner: v.oneLiner,
    genotype: k,
    rawGenotype: raw,
    interp,
  }
}

/** Build the full Genetic Training Profile from a variant map. */
export function buildTrainingProfile(rawVariants) {
  const cards = TRAINING_VARIANTS.map((v) => resolveVariant(v, rawVariants))
  const tags = new Set()
  for (const c of cards) {
    if (c.covered && c.interp?.tags) c.interp.tags.forEach((t) => tags.add(t))
  }
  return { cards, tags: Array.from(tags), coverage: {
    covered: cards.filter((c) => c.covered).length,
    total: cards.length,
  } }
}
