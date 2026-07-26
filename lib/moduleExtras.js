// /app/lib/moduleExtras.js
// Phase U-3 add-ons for the learning module system:
//   * DEEPER_CUT      — per-module technical addendum shown only to
//                       users whose literacy = 'basics' or 'advanced'.
//                       Beginners never see this block; keeps the
//                       main flow readable.
//   * COMPLETION_ACTIONS — the recommended next real-world step
//                       shown when a user marks a module complete.
//                       This is the module→reality bridge — the
//                       point of learning was always to act.

'use client'

export const DEEPER_CUT = {
  foundations: {
    heading: 'The three-layer model — formal version',
    body: 'Formally, SelfScience treats each finding as a Bayesian update over three priors: (1) the population-level base rate from GWAS/meta-analysis, (2) your specific genotype/biomarker likelihood ratio, (3) the confidence tier of the interpreting evidence. When any of the three has a wide interval, we widen the recommendation. This is why the same variant may read “actionable” for one person and “watchful waiting” for another — the priors differ, not the science.',
    citations: ['Ioannidis JPA 2005', 'Manolio TA 2009 (heritability gap)', 'CPIC evidence-grading levels'],
  },
  genes: {
    heading: 'Effect sizes in numbers',
    body: 'The vast majority of GWAS-catalogued common variants have odds ratios in the 1.05–1.30 range for common complex traits (Manolio 2009). Meaningfully actionable variants — pharmacogenetic (CPIC Level A), APOE-e4 for lipid-driven risk, HFE-C282Y for hemochromatosis — tend to have relative risks ≥2 or well-characterised dose–response. Everything else is context. Polygenic scores add signal at the population level but usually don’t out-perform basic biomarkers at the individual level for near-term decisions.',
    citations: ['Manolio 2009', 'Torkamani 2018 (PRS review)', 'CPIC guidelines A–D tier framework'],
  },
  biomarkers: {
    heading: 'Reference ranges vs optimal ranges',
    body: 'Standard “normal” reference ranges are population 2–σ bands — they capture 95% of the tested population, healthy or not. Outcomes-based optimal ranges (e.g. hs-CRP <1.0 vs the lab range “<3.0”, HbA1c <5.5 vs the lab range “<5.7”) come from prospective cohort data linking marker levels to hard endpoints. This is why a report that reads “all normal” can still describe someone drifting toward disease. Always ask for the numeric value — not just the flag.',
    citations: ['Ridker 2003 (hs-CRP)', 'Selvin 2010 (HbA1c continuum)', 'Institute of Medicine, ULs and RDAs'],
  },
  energy: {
    heading: 'Iron, thyroid, and mitochondrial gating in one paragraph',
    body: 'ATP demand outstrips supply through three predictable choke points: iron availability (heme + non-heme, gated by ferritin, transferrin saturation, hepcidin), thyroid pacing (free T3 acting on mitochondrial UCP-family thermogenics), and B-vitamin–dependent methylation cycles that recycle SAM-e, folate, and B12 into monoamine synthesis. MTHFR C677T slows folate→methylfolate flux only when B2 status is low; effect largely disappears with sufficient riboflavin. This is why the same variant produces very different phenotypes.',
    citations: ['Killip 2007', 'Biondi 2019', 'CPIC MTHFR review 2013', 'McNulty 2017 (riboflavin×MTHFR)'],
  },
  longevity: {
    heading: 'Why VO₂max out-performs almost everything',
    body: 'Across Cooper Institute and HUNT-3 cohorts, each 1-MET (~3.5 mL/kg/min) increase in cardiorespiratory fitness maps to ~13% reduction in all-cause mortality. The magnitude compares to — and often exceeds — the effect sizes of statin therapy for primary prevention, and dwarfs every supplement studied to date. ApoB adds an additional independent axis: lifetime cumulative ApoB exposure is the more mechanistically direct predictor of ASCVD than LDL-C alone, especially in TG-rich phenotypes.',
    citations: ['Kodama 2009', 'Marklund 2019', 'Lavie 2019 (fitness gradient)'],
  },
  performance: {
    heading: 'Trainability > starting fitness',
    body: 'HERITAGE Family Study data on 500+ families found VO₂max trainability heritability ~47%. Response variance was so wide that “non-responders” and “high-responders” overlapped less than 10% on the same 20-week programme. This is why elite selection filters on response, not baseline. ACTN3 and ACE explain small fractions of that variance; larger fractions belong to mitochondrial biogenesis (PPARGC1A), oxygen-carrying capacity (EPAS1), and — crucially — recovery genes (BDNF, COMT, CLOCK).',
    citations: ['Bouchard 2011 (HERITAGE)', 'Yang 2003 (ACTN3)', 'Ehlert 2013 (PPARGC1A + training)'],
  },
  sleep: {
    heading: 'The two-process model of sleep',
    body: 'Sleep pressure (Process S) rises linearly with hours awake and dissipates during sleep. Circadian drive (Process C) oscillates independently on a ~24.2h period, phased by light. Chronic misalignment — shifted schedule vs endogenous phase — produces the sleep quality debt that no single interventional night reverses. Zeitgeber prioritisation: morning light > meal timing > exercise timing > screen light at night. Melatonin as a phase-shifting signal (0.3–0.5 mg 4–5h before target sleep) beats melatonin as a sedative (large pre-bed doses).',
    citations: ['Borbély 1982 (two-process)', 'Roenneberg 2007', 'Zeitzer 2000 (light phase-shifting)'],
  },
  metabolism: {
    heading: 'HOMA-IR and the compensation window',
    body: 'HOMA-IR = (fasting insulin × fasting glucose) / 405. Values <1.5 imply strong insulin sensitivity; 1.5–2.5 fine; >2.9 suggests meaningful insulin resistance well before glucose criteria. The compensation window — elevated insulin, normal glucose — typically runs 10–15 years, during which lifestyle and pharmacology have their largest yield. Once beta-cell reserve fails, returning HbA1c to normal is dramatically harder. Waist-to-height ratio (>0.5) is a free proxy that tracks HOMA-IR remarkably well at the population level.',
    citations: ['Matthews 1985 (HOMA-IR)', 'DeFronzo 2009', 'Ashwell 2012 (waist-to-height)'],
  },
  cognition: {
    heading: 'The COMT warrior/worrier trade-off',
    body: 'COMT Val158Met changes prefrontal dopamine clearance ~4-fold. Met/Met slow-clearers show better working memory and executive function at baseline (“worrier” cognitive style) but degrade under acute stress, when prefrontal dopamine already spikes. Val/Val fast-clearers show the inverse: less baseline cognitive advantage, higher stress-resilience (“warrior”). Neither is better — they demand different environments. Similarly, BDNF Val66Met carriers show mildly reduced activity-dependent BDNF secretion; exercise normalises the difference, which is a large clinical hint about the intervention hierarchy.',
    citations: ['Diamond 2007 (COMT)', 'Egan 2003 (BDNF)', 'Ratey 2008 (exercise + BDNF)'],
  },
}

export const COMPLETION_ACTIONS = {
  foundations: {
    title: 'Read module 2 next',
    body: 'What your genes can and cannot tell you — the honest limits + real value.',
    href: '/learn/genes',
    ctaLabel: 'Open module 2',
    tone: 'teal',
  },
  genes: {
    title: 'Read module 3 next',
    body: 'Biomarkers are where present-state biology lives. This one completes the foundation.',
    href: '/learn/biomarkers',
    ctaLabel: 'Open module 3',
    tone: 'teal',
  },
  biomarkers: {
    title: 'Log any recent bloodwork you have',
    body: 'You now have the framing to read a lab panel. Log even one from the last year — the Insights ladder gets sharper immediately.',
    href: '/biomarkers',
    ctaLabel: 'Open the biomarker log',
    tone: 'orange',
  },
  energy: {
    title: 'Book or upload a basic panel',
    body: 'Ferritin + hs-CRP + TSH + free T3 + B12 is the single highest-yield next step for energy. Most doctors will run it on request.',
    href: '/biomarkers',
    ctaLabel: 'Log a panel',
    tone: 'orange',
  },
  longevity: {
    title: 'Add ApoB + estimate VO₂max',
    body: 'The two variables that move the mortality curve most. ApoB is a cheap add-on at your next draw; VO₂max estimates from a 12-minute run.',
    href: '/biomarkers',
    ctaLabel: 'Log biomarkers',
    tone: 'orange',
  },
  performance: {
    title: 'Set a 6-week training log',
    body: 'Pick one training block (aerobic base or strength) and log HR + performance across 6 weeks. Your body tells you where it adapts fastest.',
    href: '/goals',
    ctaLabel: 'Set a training goal',
    tone: 'teal',
  },
  sleep: {
    title: 'Track a free-day wake time',
    body: 'Kill your alarm for a weekend after 2 recovery nights, note wake time on day 2 and 3. That’s your real chronotype baseline.',
    href: '/tracker',
    ctaLabel: 'Open habit tracker',
    tone: 'teal',
  },
  metabolism: {
    title: 'Add fasting insulin at your next draw',
    body: 'Combined with fasting glucose you can calculate HOMA-IR at home — the earliest metabolic drift signal.',
    href: '/biomarkers',
    ctaLabel: 'Log a panel',
    tone: 'orange',
  },
  cognition: {
    title: 'Check ferritin, B12, free T3, homocysteine',
    body: 'Before you assume the cognitive question is psychiatric, rule out the four common nutritional causes. Cheap and often definitive.',
    href: '/biomarkers',
    ctaLabel: 'Log a panel',
    tone: 'orange',
  },
}
