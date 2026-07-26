// /app/lib/learningModules.js
// Learning module registry + progress tracking. Content drafted from
// research consensus. Voice: teacher first, interpreter second.
// 9 modules total: 3 foundational + 6 goal-specific.

'use client'
import { useEffect, useState } from 'react'
import { LS_MODULE_PROGRESS, CHANGE_EVENT } from '@/lib/userPath'

export const MODULES = [
  // ---------------- FOUNDATIONAL 3 ----------------
  {
    id: 'foundations',
    order: 1,
    tier: 'foundation',
    title: 'How SelfScience Works',
    subtitle: 'The mental model behind everything you’ll see here.',
    readMinutes: 4,
    hook: 'SelfScience is not a health tracker. It’s a translator between three things: your biology, the research literature, and what to actually do about it.',
    why: (goal) => `Before we personalize anything to your ${goal || 'goal'}, it helps to know how the platform thinks. Once you understand the model, every insight you see later will feel earned instead of arbitrary.`,
    mentalModel: {
      heading: 'The three-layer model',
      body: 'SelfScience shows you findings on three layers, always in this order: (1) what your biology suggests (genome, biomarkers), (2) what the research consensus says about that biology, (3) what a reasonable person would do about it. When any of those three layers is thin — weak evidence, missing data, or unclear action — we tell you. That transparency is the point.',
    },
    dataShows: [
      { label: 'Your genome file', role: 'Tells us what your biology tends toward.' },
      { label: 'Your bloodwork',   role: 'Tells us what your biology is actually doing right now.' },
      { label: 'Neither yet',      role: 'That’s fine. We can still teach you what to look for.' },
    ],
    misconceptions: [
      { myth: 'A genetic finding means it will happen.',       truth: 'Almost all common variants nudge probability, not destiny.' },
      { myth: 'More data always equals better answers.',       truth: 'The right data for your question beats a firehose of unrelated data.' },
      { myth: 'One study proves it.',                          truth: 'Single studies are hypotheses. Consensus across independent studies is evidence.' },
    ],
    nextStep: 'Read module 2 — what your genes can and cannot tell you.',
    nextModuleId: 'genes',
    sources: ['Ioannidis 2005 (single-study limits)', 'GWAS Catalog (variant effect sizes)', 'NHGRI plain-language framing'],
  },
  {
    id: 'genes',
    order: 2,
    tier: 'foundation',
    title: 'What Your Genes Can and Cannot Tell You',
    subtitle: 'The honest limits and real value of your genome file.',
    readMinutes: 5,
    hook: 'Your genome is a probability document, not a prophecy. Learn where it’s powerful, where it’s weak, and why the second matters as much as the first.',
    why: (goal) => `If your primary interest is ${goal || 'your health'}, knowing which questions genetics can answer well — and which it can’t — saves you from chasing wrong signals later.`,
    mentalModel: {
      heading: 'Effect size is everything',
      body: 'The vast majority of common gene variants change your risk or response by a small amount — typically a factor of 1.1x to 1.4x. A handful of variants (like MTHFR, APOE, or pharmacogenetic markers) change outcomes meaningfully. The rest are context. When SelfScience shows you a variant, we tell you the effect size, the confidence tier, and whether it’s actionable.',
    },
    dataShows: [
      { label: 'Pharmacogenetics',       role: 'Strong. Drug metabolism variants (SLCO1B1, CYP2C19, TPMT) genuinely change medication decisions.' },
      { label: 'Nutrient handling',      role: 'Moderate. MTHFR, FADS1, BCMO1 change how you process folate, omega-3s, vitamin A.' },
      { label: 'Common complex traits',  role: 'Weak individually, meaningful in aggregate. Depression, heart disease, longevity — no single gene explains much.' },
      { label: 'Rare disease',           role: 'Not what SelfScience is for. See a medical genetics specialist.' },
    ],
    misconceptions: [
      { myth: '23andMe told me I have the “Alzheimer’s gene”.',     truth: 'APOE4 raises risk. Most APOE4 carriers do not develop Alzheimer’s. Lifestyle changes the trajectory more than the variant.' },
      { myth: 'Genetic tests give you a permanent answer.',              truth: 'Your genome doesn’t change, but the science interpreting it does. We update as consensus shifts.' },
      { myth: 'Ancestry data reveals health risk.',                       truth: 'Population frequency ≠ personal risk. It’s useful context, not a diagnosis.' },
    ],
    nextStep: 'Read module 3 — how biomarkers show what’s actually happening right now.',
    nextModuleId: 'biomarkers',
    sources: ['NHGRI GWAS Catalog', 'CPIC pharmacogenetic guidelines', 'Manolio 2009 (missing heritability)'],
  },
  {
    id: 'biomarkers',
    order: 3,
    tier: 'foundation',
    title: 'How Biomarkers Add Context Your Genes Can’t',
    subtitle: 'Present-state biology completes the picture your genome starts.',
    readMinutes: 5,
    hook: 'Your genome tells us what your biology tends toward. Your bloodwork tells us what your biology is actually doing today. Both matter. Neither is enough alone.',
    why: (goal) => `For ${goal || 'most goals'}, present-state biomarkers are usually the higher-signal data. A recent CBC, lipid panel, and a few targeted markers often tell us more than an entire genome.`,
    mentalModel: {
      heading: 'The genome-biomarker complementarity',
      body: 'Genes suggest tendencies over years. Biomarkers show reality this month. When they agree — the signal is strong. When they disagree — that’s the interesting question. Example: someone with an MTHFR variant that suggests slower folate processing whose homocysteine is nonetheless normal. The genome flagged a risk. The biomarker showed compensation is working. That gap is what SelfScience helps you notice.',
    },
    dataShows: [
      { label: 'Basic panel (CBC, CMP, lipid)',     role: 'Cheapest, highest-signal starting point for almost any goal.' },
      { label: 'Inflammation (hs-CRP, ferritin)',    role: 'Reveals low-grade inflammation invisible on standard panels.' },
      { label: 'Metabolic (HbA1c, fasting insulin)', role: 'Two-decade lead time on metabolic dysfunction. Better than fasting glucose alone.' },
      { label: 'Hormones (in context)',              role: 'Meaningful only interpreted against symptoms, age, and time-of-day.' },
      { label: 'Micronutrients (Vit D, B12, iron)',  role: 'Fill in what genes suggest and diet may not cover.' },
    ],
    misconceptions: [
      { myth: 'Normal range means healthy.',              truth: 'Normal ranges are population averages. Optimal ranges for your goals are often tighter and different.' },
      { myth: 'One test result is the answer.',           truth: 'Biomarkers move with sleep, stress, food, illness. Trends across 2–3 measurements beat single snapshots.' },
      { myth: 'You need every marker to learn anything.', truth: 'Five well-chosen markers tied to your goal beat a 100-marker panel with no framing.' },
    ],
    nextStep: 'You’ve got the foundation. Time for goal-specific depth.',
    // nextModuleId is dynamic — resolved from user’s primary goal at
    // click-time by /learn/[moduleId] via modulePathFor().
    nextModuleId: null,
    sources: ['Ridker 2003 (hs-CRP)', 'DeFronzo 2009 (fasting insulin)', 'Institute of Medicine reference ranges'],
  },

  // ---------------- GOAL-SPECIFIC 6 ----------------
  {
    id: 'energy',
    order: 4,
    tier: 'goal',
    goalKey: 'energy',
    title: 'Where Your Energy Actually Comes From',
    subtitle: 'Mitochondria, methylation, and the systems behind daily energy.',
    readMinutes: 6,
    hook: 'Everyone talks about energy like it’s a mood. It’s a metabolic output. Understanding where it actually comes from changes what you look at first.',
    why: (goal) => `You picked ${goal || 'energy'} as your primary goal. Most people chasing energy work on the wrong lever — caffeine and macros — while the real bottleneck is upstream. This module walks the actual causal chain.`,
    mentalModel: {
      heading: 'The four systems that gate energy',
      body: 'Daily energy depends on four systems working together: (1) mitochondrial ATP production, gated by iron, B-vitamins, and CoQ10; (2) methylation, which recycles neurotransmitters and DNA — MTHFR, MTR, BHMT variants show up here; (3) thyroid, the metabolic pace-setter; (4) sleep quality, which resets the whole system. Fixing one when the bottleneck is another is why so many “energy protocols” disappoint.',
    },
    dataShows: [
      { label: 'MTHFR C677T / A1298C',    role: 'Slower folate-→-methylfolate conversion — relevant to methylation-dependent energy.' },
      { label: 'Ferritin + iron saturation', role: 'Low iron is the single most common reversible cause of fatigue. Below 50 ng/mL matters even if hemoglobin is normal.' },
      { label: 'TSH + free T3',             role: 'Thyroid pacing. Subclinical low T3 explains a huge share of “no reason to be tired” cases.' },
      { label: 'Vitamin B12 + homocysteine', role: 'B12 deficiency mimics thyroid fatigue. Homocysteine flags methylation stress.' },
      { label: 'HbA1c + fasting insulin',   role: 'Glucose swings drive afternoon crashes. Insulin trends catch this years before HbA1c does.' },
    ],
    misconceptions: [
      { myth: 'Fatigue means you need more sleep.',           truth: 'It might. But if bloodwork points to iron or thyroid, more sleep won’t fix it.' },
      { myth: 'Caffeine restores energy.',                    truth: 'Caffeine blocks adenosine — it delays fatigue but doesn’t produce ATP. Chronic use masks the underlying signal.' },
      { myth: 'B-vitamin megadoses always help.',              truth: 'Only if you’re deficient. Otherwise they clear through urine. For MTHFR, the specific form matters more than the dose.' },
    ],
    nextStep: 'Log any recent bloodwork — or plan a basic panel. That’s where energy answers live.',
    nextModuleId: null,
    sources: ['Killip 2007 (iron + fatigue)', 'Biondi 2019 (subclinical thyroid)', 'CPIC MTHFR review 2013'],
  },
  {
    id: 'longevity',
    order: 4,
    tier: 'goal',
    goalKey: 'longevity',
    title: 'The Longevity Levers That Actually Move The Needle',
    subtitle: 'What we know, what we don’t, and what pays back most.',
    readMinutes: 7,
    hook: 'The longevity field is loud. The interventions with the strongest evidence are quiet: cardiovascular fitness, muscle mass, and the metabolic markers you probably already know how to move.',
    why: (goal) => `You chose ${goal || 'longevity'}. That means we owe you the ranked list — not the trendy list. The gap between “anti-aging supplement of the month” and “thing that actually shifts your all-cause mortality curve” is enormous.`,
    mentalModel: {
      heading: 'The tiered evidence pyramid',
      body: 'Tier 1 (large effects, decades of evidence): cardiovascular fitness (VO₂max), muscle mass, blood pressure, LDL/ApoB, HbA1c, sleep. Tier 2 (real but smaller effects): fiber intake, protein sufficiency, resistance training frequency, social connection. Tier 3 (promising but early): rapamycin, senolytics, NAD precursors, metformin off-label. If Tier 1 isn’t handled, working on Tier 3 is decorative.',
    },
    dataShows: [
      { label: 'APOE genotype',            role: 'e2/e3/e4 shapes cardiovascular and cognitive aging trajectories. E4 raises risk but lifestyle changes the slope more than the variant.' },
      { label: 'FOXO3 variants',            role: 'Modest longevity signal in humans; a marker to know, not a lever to pull.' },
      { label: 'ApoB (not just LDL)',        role: 'The best single lipid predictor of cardiovascular mortality. Ask for it.' },
      { label: 'VO₂max estimate',           role: 'Above-average cardio fitness cuts all-cause mortality more than any supplement ever tested.' },
      { label: 'Grip strength / DEXA muscle', role: 'Sarcopenia predicts mortality independent of everything else. Trackable at home with a grip dynamometer.' },
    ],
    misconceptions: [
      { myth: 'The right supplement stack is the game.',      truth: 'Zero supplements have shown mortality benefits in RCTs. Exercise and lipid management have.' },
      { myth: 'Genetic longevity is set at birth.',            truth: 'Twin studies suggest genetics explains ~25% of lifespan. Behavior explains most of the rest.' },
      { myth: 'Biological age tests are actionable.',           truth: 'They’re research tools with limited test-retest reliability. Use them as directional — not diagnostic.' },
    ],
    nextStep: 'Get a full lipid panel with ApoB and a resting heart rate baseline. Longevity answers start with cardiovascular data.',
    nextModuleId: null,
    sources: ['Kodama 2009 (VO₂max + mortality)', 'Marklund 2019 (ApoB > LDL)', 'Kujala 2017 (twin lifespan)'],
  },
  {
    id: 'performance',
    order: 4,
    tier: 'goal',
    goalKey: 'performance',
    title: 'How Your Genes Shape Athletic Response',
    subtitle: 'Power, endurance, recovery — and where training beats DNA.',
    readMinutes: 6,
    hook: 'Your genes don’t determine your ceiling. They shape the slope of your adaptation curve — how fast you get better at what, and how long you need to recover between hits.',
    why: (goal) => `You picked ${goal || 'performance'}. The gene reports you’ve probably seen (ACTN3, ACE, PPARGC1A) get over-hyped. This module gives you the real limits and the practical playbook.`,
    mentalModel: {
      heading: 'Adaptation, not capacity',
      body: 'Athletic genetics are mostly about training response — how much you improve per unit of training. Trainability is more heritable than starting fitness. Your job is to figure out which axis (aerobic, anaerobic, strength, recovery) your biology adapts fastest on, and load there first. The rest is discipline.',
    },
    dataShows: [
      { label: 'ACTN3 R/X genotype',       role: 'RR bias toward power/sprint fibers, XX bias toward endurance. Real, but effect size is small next to consistent training.' },
      { label: 'ACE I/D',                   role: 'DD associated with power; II with endurance and altitude tolerance. Population-level signal, not a decision tool.' },
      { label: 'PPARGC1A',                 role: 'Modulates mitochondrial biogenesis. Trainability marker rather than a ceiling.' },
      { label: 'COL5A1 / COL1A1',           role: 'Collagen structure variants — flag injury risk for tendon-heavy sports.' },
      { label: 'Iron + ferritin',           role: 'Endurance athletes drop these fast. Track quarterly if you train >6 h/week.' },
    ],
    misconceptions: [
      { myth: 'ACTN3 XX means you can’t sprint.',              truth: 'World-class sprinters exist with XX genotype. It shifts the odds; it doesn’t cap the ceiling.' },
      { myth: 'Genetic testing picks your sport.',              truth: 'Coaches, environment, and enjoyment predict elite outcome better than any DNA test.' },
      { myth: 'Recovery is the same for everyone.',              truth: 'CLOCK, BDNF, and COMT variants shift sleep-need and stress-response — the same training block hits two people differently.' },
    ],
    nextStep: 'Log two weeks of training + resting HR. Look for the axis your body adapts to fastest — that’s your primary lane.',
    nextModuleId: null,
    sources: ['Yang 2003 (ACTN3)', 'Bouchard 2011 (heritability of trainability)', 'Puthucheary 2011 (ACE + performance)'],
  },
  {
    id: 'sleep',
    order: 4,
    tier: 'goal',
    goalKey: 'sleep',
    title: 'Reading Your Sleep Biology',
    subtitle: 'Chronotype, melatonin timing, and what actually dysregulates real people.',
    readMinutes: 5,
    hook: 'Sleep advice is mostly wrong for you if it wasn’t built around your chronotype. Your biology decides when you sleep best; culture decides what you’re allowed to do about it.',
    why: (goal) => `You picked ${goal || 'sleep'}. Sleep is the highest-leverage single variable in almost every other health outcome. Fixing sleep pays back on energy, cognition, metabolism, mood, immunity — all of it.`,
    mentalModel: {
      heading: 'The three-timing problem',
      body: 'Good sleep needs three timings aligned: (1) circadian phase — when your internal night starts, (2) sleep pressure — how long you’ve been awake, (3) environmental cues — light, temperature, food timing. Fix the first two and the rest usually falls in line. Melatonin timing is the biggest under-used lever.',
    },
    dataShows: [
      { label: 'PER3 length variant',       role: 'Long allele biases toward morning-type; short toward evening. A rough compass, not a verdict.' },
      { label: 'CLOCK 3111T/C',              role: 'C carriers report later chronotype and more evening eating. Small effect but real.' },
      { label: 'MTNR1B',                     role: 'The melatonin receptor variant that impairs late-evening insulin — relevant if you eat late.' },
      { label: 'Cortisol AM (single point)', role: 'A morning rise that’s flat or reversed suggests circadian misalignment.' },
      { label: 'Sleep tracker HRV + wake time', role: 'Trends across weeks beat any single night. Look for regularity, not perfect nights.' },
    ],
    misconceptions: [
      { myth: '8 hours is the target.',                         truth: 'Between 7 and 9 hours works for most adults. Consistency of schedule matters more than the number.' },
      { myth: 'Melatonin is a sleep pill.',                     truth: 'It’s a timing signal. Small doses (0.3–0.5 mg) given 4–5 hours before your desired bedtime shift phase. Big pre-bed doses don’t.' },
      { myth: 'Naps are always bad.',                            truth: 'Short (10–20 min) mid-afternoon naps improve alertness for most chronotypes without hurting night sleep.' },
    ],
    nextStep: 'Track your natural wake time across a free weekend. That’s your real chronotype signal — build from there.',
    nextModuleId: null,
    sources: ['Roenneberg 2007 (chronotype)', 'Lyssenko 2009 (MTNR1B)', 'Van Dongen 2003 (sleep debt)'],
  },
  {
    id: 'metabolism',
    order: 4,
    tier: 'goal',
    goalKey: 'metabolism',
    title: 'Metabolic Health Beyond Blood Sugar',
    subtitle: 'Insulin sensitivity, thermogenesis, and the markers that matter.',
    readMinutes: 6,
    hook: 'Most “metabolic health” advice is glucose-obsessed. Fasting glucose is a late-stage signal. The real story shows up in insulin, ApoB, waist circumference, and how quickly you return to baseline after a meal.',
    why: (goal) => `You chose ${goal || 'metabolism'}. Metabolic dysfunction rarely announces itself — by the time HbA1c is elevated, you’ve typically been drifting for 10–15 years. Reading earlier markers changes the trajectory.`,
    mentalModel: {
      heading: 'Insulin resistance is the upstream signal',
      body: 'Fasting glucose stays normal for years while fasting insulin creeps up. That gap is compensation — your pancreas working harder to keep blood sugar in range. Watching insulin, triglyceride/HDL ratio, and waist circumference catches this decade earlier than a glucose test alone.',
    },
    dataShows: [
      { label: 'Fasting insulin',           role: 'The single most under-ordered high-value test. Under 5 mIU/L is excellent; 5–10 fine; >10 flags insulin resistance.' },
      { label: 'Triglyceride / HDL ratio',   role: 'Under 1.5 is metabolically healthy in most populations. Above 3 correlates with insulin resistance strongly.' },
      { label: 'HbA1c',                      role: 'Three-month glucose average. Track direction more than absolute number.' },
      { label: 'TCF7L2 variant',             role: 'The strongest common-variant type-2 diabetes signal. Nudges risk; doesn’t decide it.' },
      { label: 'MTNR1B',                     role: 'Late-night eating hits harder — melatonin blocks insulin. Time-restricted eating is more useful for carriers.' },
    ],
    misconceptions: [
      { myth: 'Normal fasting glucose = metabolic health.',    truth: 'You can compensate with high insulin for years while glucose stays normal. Insulin is the earlier signal.' },
      { myth: 'Carbs are the enemy.',                          truth: 'Carbohydrate quality and timing matter far more than total load for most people. Late-evening carbs hit differently than morning carbs.' },
      { myth: 'CGMs solve metabolic questions.',                truth: 'Useful for pattern-finding, not for grading meals. Glucose spikes vary hugely by sleep, stress, and prior meals.' },
    ],
    nextStep: 'Get a fasting insulin at your next draw. Combined with fasting glucose you can calculate HOMA-IR at home.',
    nextModuleId: null,
    sources: ['DeFronzo 2009 (insulin resistance)', 'Grant 2006 (TCF7L2)', 'Reaven 2011 (metabolic syndrome origins)'],
  },
  {
    id: 'cognition',
    order: 4,
    tier: 'goal',
    goalKey: 'cognition',
    title: 'The Neurochemistry Of Focus And Memory',
    subtitle: 'Dopamine, serotonin, and what your genes suggest about brain style.',
    readMinutes: 6,
    hook: 'How you focus, how you handle stress, and how you learn are shaped by a handful of neurotransmitter-related variants. Knowing which ones dominate your biology changes how you set up your day.',
    why: (goal) => `You picked ${goal || 'cognition'}. “Brain fog” is the least useful term in modern health. The real question is which neurochemical or metabolic system is bottlenecking — dopamine, methylation, sleep, or something else entirely.`,
    mentalModel: {
      heading: 'The dopamine–serotonin balance',
      body: 'Cognition is a balance between drive (dopamine — focus, motivation) and calm (serotonin — mood, patience). COMT variants shift how fast you clear dopamine from the prefrontal cortex — slow-clearing types think deeply but stress-easily; fast-clearing types stay cool but need stimulation. Both can be great; knowing which you are changes optimal workload.',
    },
    dataShows: [
      { label: 'COMT Val158Met',            role: 'Met/Met = slow clearance = “worrier”, deep focus, more stress reactivity. Val/Val = fast = “warrior”, cool under pressure, needs stimulation.' },
      { label: 'BDNF Val66Met',              role: 'Met carriers show slightly reduced BDNF secretion — relevant for learning and mood; exercise still overrides most of the effect.' },
      { label: 'MTHFR C677T',                role: 'Slower folate conversion affects neurotransmitter synthesis. Depression risk modest; nutrient form matters.' },
      { label: 'Homocysteine',               role: 'Elevated homocysteine correlates with cognitive decline. Cheap to check; usually fixable.' },
      { label: 'Ferritin + B12',              role: 'Both silent cognitive drainers when low. Restore before assuming psychiatry.' },
    ],
    misconceptions: [
      { myth: 'ADHD-style focus is a defect.',                 truth: 'It’s a different attention distribution — excellent for novelty, weaker for sustained low-stimulation work. Match environment, don’t just medicate.' },
      { myth: 'Nootropics rewire your brain.',                  truth: 'Sleep, exercise, and sunlight outperform every over-the-counter nootropic in RCT data. Boring, but true.' },
      { myth: 'Your genes decide your intelligence.',            truth: 'Common-variant genetics explain a small fraction of cognitive variance. Environment, education, and habit dominate.' },
    ],
    nextStep: 'Track two weeks of your best focus window. Anchor deep-work sessions there — the biggest gain comes from timing, not stimulants.',
    nextModuleId: null,
    sources: ['Diamond 2007 (COMT + prefrontal)', 'Egan 2003 (BDNF Val66Met)', 'Smith 2010 (homocysteine + cognition)'],
  },
]

export function moduleById(id) { return MODULES.find((m) => m.id === id) || null }

function fire() { try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {} }

export function readProgress() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(LS_MODULE_PROGRESS) || '{}') } catch { return {} }
}

export function markModuleComplete(id) {
  if (!id || typeof window === 'undefined') return
  const p = readProgress()
  p[id] = { completedAt: new Date().toISOString() }
  try { window.localStorage.setItem(LS_MODULE_PROGRESS, JSON.stringify(p)); fire() } catch {}
}

export function useModuleProgress() {
  const [p, setP] = useState({})
  useEffect(() => {
    const load = () => setP(readProgress())
    load()
    const onCh = () => load()
    window.addEventListener(CHANGE_EVENT, onCh)
    return () => window.removeEventListener(CHANGE_EVENT, onCh)
  }, [])
  return p
}
