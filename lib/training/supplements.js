// /app/lib/training/supplements.js
// Section 3G — Training supplement protocol.
// Deterministic — rules read intake goals + profile tags + biomarker signals
// and return only the supplements that apply.

export const EVIDENCE_LEVELS = {
  settled:     { label: 'Settled',     color: '#059669', note: 'Extensively researched. Effect and mechanism are robust.' },
  emerging:    { label: 'Emerging',    color: '#0891B2', note: 'Strong signal from multiple studies. Ongoing research.' },
  preliminary: { label: 'Preliminary', color: '#B45309', note: 'Interesting early evidence. Not settled.' },
}

const RULES = [
  {
    id: 'collagen_vitc',
    name: 'Hydrolyzed Collagen + Vitamin C',
    form: 'Hydrolyzed (not undenatured type II) — whey-clear pouch or gelatin powder',
    when: (intake, tags) => tags.has('collagen_protocol') || tags.has('injury_risk_high') || tags.has('injury_risk_moderate'),
    reasoning: (tags) => tags.has('injury_risk_high')
      ? 'Your COL5A1 TT / MMP3 high genotype elevates tendon and ligament injury risk. Peri-training collagen + vitamin C timing is the most evidence-supported intervention for stimulating tendon collagen synthesis.'
      : 'Your COL5A1 CT genotype suggests moderate connective-tissue vulnerability — collagen support on heavy days is prudent.',
    dose: '15\u201320 g collagen + 50 mg vitamin C',
    timing: '30\u201360 min pre-training',
    evidence: 'settled',
    expect: 'Not a rapid effect — tendon adaptation is measured over 3\u20136 months.',
    watch: 'No known clinically significant interactions. Diabetics: check total macros — collagen provides ~4 kcal/g protein.',
  },
  {
    id: 'creatine',
    name: 'Creatine Monohydrate',
    form: 'Micronised monohydrate — not ethyl ester, not HCL, not “buffered”',
    when: (intake, tags) => {
      const goals = new Set(intake.goals || [])
      return goals.has('strength') || goals.has('muscle') || goals.has('power')
    },
    reasoning: (tags) => tags.has('power') || tags.has('strength_bias')
      ? 'Your ACTN3 profile supports strength and power development. Creatine is the highest-evidence oral ergogenic aid for the ATP-PCr energy system.'
      : 'Creatine is one of the highest-evidence, safest, and cheapest oral ergogenic aids across the strength/muscle training literature.',
    dose: '3\u20135 g daily (no loading phase needed)',
    timing: 'Any consistent time daily. With food is fine.',
    evidence: 'settled',
    expect: '2\u20134 weeks of consistent daily use before strength benefits are measurable. Weight gain 0.5\u20131.5 kg from muscle water storage is normal and desirable.',
    watch: 'No clinically significant side-effects in healthy adults. Kidney disease → discuss with your doctor first.',
  },
  {
    id: 'beta_alanine',
    name: 'Beta-Alanine',
    form: 'Sustained-release preferred if available (reduces tingling)',
    when: (intake) => {
      const goals = new Set(intake.goals || [])
      return goals.has('endurance') || goals.has('power')
    },
    reasoning: () => 'Improves muscle-buffering capacity for efforts in the 30 s\u20134 min range — the fatigue zone for HIIT, threshold work, and repeat sprints.',
    dose: '3.2 g daily (split into 2\u00d71.6 g doses)',
    timing: 'Consistent daily dosing. Pre-training on hard days is fine.',
    evidence: 'settled',
    expect: '4\u20136 weeks of daily use before performance improvement is measurable. Tingling (paresthesia) is normal and harmless.',
    watch: 'Split doses to reduce tingling. Skin flushing = normal, not an allergic reaction.',
  },
  {
    id: 'magnesium',
    name: 'Magnesium Glycinate',
    form: 'Glycinate (bisglycinate). Avoid oxide — poorly absorbed.',
    when: (intake, tags) => tags.has('sleep_critical') || tags.has('recovery_priority'),
    reasoning: (tags) => tags.has('recovery_priority')
      ? 'Your FKBP5 T-carrier profile puts sleep quality at the centre of your recovery. Magnesium glycinate is one of the few consistently evidenced sleep-supportive minerals — hard training also depletes serum magnesium meaningfully.'
      : 'High training volumes deplete serum magnesium, and adequate magnesium supports sleep quality.',
    dose: '300\u2013400 mg elemental magnesium',
    timing: '~1 hour before sleep',
    evidence: 'emerging',
    expect: 'Sleep quality improvements typically within 1\u20132 weeks.',
    watch: 'Loose stools indicate too much — back off dose. Not the citrate form for sleep.',
  },
  {
    id: 'omega3',
    name: 'Omega-3 EPA / DHA',
    form: 'Fish oil — look for TG (triglyceride) form. Third-party tested for oxidation and heavy metals.',
    when: () => true, // universal recommendation
    reasoning: () => 'Baseline anti-inflammatory support and cardiovascular hygiene. Almost universally under-consumed at population level.',
    dose: '2\u20133 g combined EPA + DHA daily',
    timing: 'With a meal containing fat (improves absorption)',
    evidence: 'settled',
    expect: '4\u20138 weeks for meaningful erythrocyte-membrane EPA + DHA index shift.',
    watch: 'Some people notice reflux — take with the biggest meal of the day. Anticoagulants → discuss with your doctor.',
  },
  {
    id: 'vitd_k2',
    name: 'Vitamin D3 + K2 (MK-7)',
    form: 'D3 (cholecalciferol) + K2 as menaquinone-7',
    when: () => true,
    reasoning: () => 'Vitamin D deficiency remains widespread. K2 co-supplementation directs calcium to bone rather than soft tissue.',
    dose: '2,000\u20135,000 IU D3 + 100 mcg K2/day (dose to keep 25(OH)D between 40\u201360 ng/mL)',
    timing: 'With the largest meal of the day',
    evidence: 'settled',
    expect: 'Serum 25(OH)D shifts measurably in 6\u20138 weeks. Recheck every 6 months if supplementing.',
    watch: 'Do not mega-dose — more is not better. Warfarin or anticoagulants → discuss K2 timing with your doctor.',
  },
  {
    id: 'ashwagandha',
    name: 'Ashwagandha (KSM-66)',
    form: 'KSM-66 or Sensoril — standardised extracts with meaningful clinical evidence',
    when: (intake, tags) => tags.has('recovery_priority') || tags.has('sleep_critical'),
    reasoning: () => 'Adaptogenic effect on cortisol response is consistent across placebo-controlled RCTs — particularly relevant if you carry the FKBP5 T allele.',
    dose: '300\u2013600 mg standardised extract daily',
    timing: 'Evening or post-training',
    evidence: 'emerging',
    expect: '4\u20138 weeks for cortisol / stress-marker changes.',
    watch: 'Hyperthyroid → discuss with your doctor. Some report initial vivid dreaming in the first week.',
  },
  {
    id: 'tart_cherry',
    name: 'Tart Cherry Extract',
    form: 'Standardised tart cherry (Montmorency) extract or 8\u201312 oz juice',
    when: (intake, tags, biomarkers) => {
      const crp = Number(biomarkers?.hs_crp)
      if (Number.isFinite(crp) && crp > 1.0) return true
      return false
    },
    reasoning: () => 'Your recent hs-CRP suggests elevated systemic inflammation. Tart cherry has modest but consistent evidence for reducing exercise-induced inflammation and improving sleep.',
    dose: '480 mg extract, or 8\u201312 oz tart cherry juice',
    timing: 'Post-training or 30\u201360 min before bed',
    evidence: 'emerging',
    expect: 'Perceived-soreness benefit typically within 2\u20134 sessions of use.',
    watch: 'Juice is calorie-dense (~140 kcal/8 oz) — factor into total intake.',
  },
  {
    id: 'electrolytes',
    name: 'Electrolytes (Na, K, Mg)',
    form: 'Any product with meaningful sodium (~500\u20131,000 mg/serving). Avoid sugar-heavy sports drinks unless you actually need the carbs.',
    when: (intake) => {
      const s = intake.sessionLength
      return s === '60_90' || s === '90p'
    },
    reasoning: () => 'Sessions over ~60 min — especially in heat — lose sodium at rates that impair performance and cognition well before dehydration.',
    dose: 'Per product label. Aim for ~500\u2013700 mg sodium per hour of hard training in heat.',
    timing: 'During training',
    evidence: 'settled',
    expect: 'Cramping susceptibility drops noticeably within 2\u20133 sessions.',
    watch: 'Hypertension → discuss sodium load with your doctor. Kidney disease → potassium load is a real concern.',
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    form: 'Coffee, tea, or caffeine anhydrous — 200 mg tablet is easiest to titrate',
    when: (intake, tags) => tags.has('caffeine_ok') || tags.has('caffeine_moderate') || tags.has('caffeine_limit'),
    reasoning: (tags) => {
      if (tags.has('caffeine_ok'))     return 'Your CYP1A2 AA genotype makes you a fast metaboliser — pre-training caffeine at 3\u20136 mg/kg is ergogenic and well tolerated.'
      if (tags.has('caffeine_limit'))  return 'Your CYP1A2 CC genotype is a slow metaboliser — high-dose caffeine is associated with elevated cardiovascular risk for this genotype. Cap intake and use morning only.'
      return 'Your CYP1A2 intermediate genotype tolerates moderate caffeine (2\u20134 mg/kg). Avoid late-day dosing.'
    },
    dose: (tags) => tags.has('caffeine_ok')
      ? '3\u20136 mg/kg body weight (200\u2013400 mg for most adults)'
      : tags.has('caffeine_limit')
        ? 'Cap at 1\u20132 mg/kg body weight (~100\u2013150 mg max), morning only'
        : '2\u20134 mg/kg body weight',
    timing: (tags) => tags.has('caffeine_limit') ? 'Morning only — do not use pre-evening training' : '30\u201360 min pre-training',
    evidence: 'settled',
    expect: 'Ergogenic effect on the same session. Habituation over weeks reduces the effect — cycle it.',
    watch: 'CYP1A2 CC carriers: high doses increase MI risk in some studies — not a supplement to push. Avoid mixing with high-dose stimulant pre-workouts.',
  },
]

export function buildSupplementProtocol(intake, profile, biomarkers = {}) {
  const tags = new Set(profile?.tags || [])
  const out = []
  for (const r of RULES) {
    let show = false
    try { show = !!r.when(intake, tags, biomarkers) } catch { show = false }
    if (!show) continue
    out.push({
      id: r.id,
      name: r.name,
      form: r.form,
      reasoning: r.reasoning(tags, biomarkers),
      dose:   typeof r.dose   === 'function' ? r.dose(tags)   : r.dose,
      timing: typeof r.timing === 'function' ? r.timing(tags) : r.timing,
      evidence: r.evidence,
      expect: r.expect,
      watch:  r.watch,
    })
  }
  return out
}
