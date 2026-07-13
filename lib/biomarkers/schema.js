// /app/lib/biomarkers/schema.js
// SelfScience — schema-driven biomarker library.
//
// Every biomarker is a plain object with a consistent shape (see the
// Biomarker typedef below) so the UI can render it uniformly and new
// biomarkers can be added without touching the page code.
//
// Copy style is scientific-humility throughout:
//   • "associated with" not "causes"
//   • "may reflect" not "proves"
//   • "worth exploring" not "do this"
//
// Citations are real, top-of-mind consensus refs. They are intentionally
// small in number (1–3 per biomarker) so users can actually read them
// rather than skim a wall of links. Editorial article slugs can later
// be added to `evidence.editorialSlugs` to link back to Supabase content.

/**
 * @typedef {Object} Range
 * @property {[number, number]} interval
 * @property {string}           label
 * @property {string=}          note
 * @property {string=}          source  Short attribution string.
 *
 * @typedef {Object} Citation
 * @property {string} label
 * @property {number=} year
 * @property {string=} url
 * @property {'consensus-guideline'|'meta-analysis'|'rct'|'cohort'|'review'|'mechanistic'} type
 *
 * @typedef {Object} SexOverride
 * @property {Range=}   standard
 * @property {Object=}  optimization  { optimal, borderline, outside }
 *
 * @typedef {Object} Biomarker
 * @property {string}   id
 * @property {string}   label
 * @property {string[]} aliases
 * @property {string}   unit
 * @property {string}   category
 * @property {number=}  step
 * @property {number=}  min
 * @property {number=}  max
 * @property {Range}    standard         Typical clinical reference range.
 * @property {{ optimal:[number,number], borderline:[number,number], outside:[number,number], label:string, rationale:string }} optimization
 * @property {{ male?:SexOverride, female?:SexOverride }=} sexOverrides
 * @property {string}   whyItMatters
 * @property {string[]} relatedTo         Related biomarker ids.
 * @property {{ confidence:'High'|'Moderate'|'Emerging'|'Contested', citations:Citation[], editorialSlugs:string[] }} evidence
 * @property {{ lifestyle:string[], retest:string, clinician:string[], relatedLabs:string[] }} nextSteps
 * @property {string[]} genome           Placeholder for Phase 2 SNP mapping.
 */

export const CATEGORIES = {
  metabolic:     { label: 'Metabolic',                accent: 'text-amber-700' },
  lipids:        { label: 'Lipids & Cardiovascular',   accent: 'text-rose-700' },
  inflammation:  { label: 'Inflammation',              accent: 'text-orange-700' },
  hormones:      { label: 'Hormones',                  accent: 'text-purple-700' },
  thyroid:       { label: 'Thyroid',                   accent: 'text-blue-700' },
  iron:          { label: 'Iron & CBC',                accent: 'text-red-700' },
  micronutrient: { label: 'Micronutrients',            accent: 'text-emerald-700' },
  longevity:     { label: 'Growth & Longevity',        accent: 'text-teal-700' },
  methylation:   { label: 'Methylation',               accent: 'text-indigo-700' },
}

export const CONFIDENCE_META = {
  High:       { label: 'High',       tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200',      note: 'Multiple large studies + guideline consensus.' },
  Moderate:   { label: 'Moderate',   tone: 'text-teal-700 bg-teal-50 ring-teal-200',                note: 'Consistent evidence but scope or population limits apply.' },
  Emerging:   { label: 'Emerging',   tone: 'text-amber-800 bg-amber-50 ring-amber-200',             note: 'Promising signal, still being characterized.' },
  Contested:  { label: 'Contested',  tone: 'text-rose-800 bg-rose-50 ring-rose-200',                note: 'Meaningful expert disagreement on optimal targets.' },
}

export const BIOMARKERS = [
  /* ------------------------------ Metabolic ---------------------------- */
  {
    id: 'hba1c',
    label: 'HbA1c',
    aliases: ['glycated hemoglobin', 'A1C'],
    unit: '%',
    category: 'metabolic',
    step: 0.1, min: 3, max: 15,
    standard: {
      interval: [4.0, 5.6],
      label: 'Non-diabetic (US clinical)',
      source: 'ADA Standards of Care 2024',
    },
    optimization: {
      optimal: [4.0, 5.3],
      borderline: [5.4, 5.7],
      outside: [5.8, 15],
      label: 'SelfScience longevity target',
      rationale: 'Cohort data associates lower-normal HbA1c with reduced cardiometabolic risk, though the marginal benefit below ~5.3% is small and not established.',
    },
    whyItMatters:
      'HbA1c reflects average blood glucose exposure over roughly the past 3 months. It is one of the most stable markers of long-run glycemic load, and elevated HbA1c is associated with cardiovascular and microvascular risk in observational studies.',
    relatedTo: ['fasting_glucose', 'hs_crp'],
    evidence: {
      confidence: 'High',
      citations: [
        { label: 'ADA Standards of Care in Diabetes 2024', year: 2024, url: 'https://diabetesjournals.org/care/issue/47/Supplement_1', type: 'consensus-guideline' },
        { label: 'Selvin et al., HbA1c and CVD risk in nondiabetics, NEJM', year: 2010, url: 'https://pubmed.ncbi.nlm.nih.gov/20200384/', type: 'cohort' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Reduce refined-carb and sugar-sweetened beverage intake.', 'Post-meal walking or light activity to blunt glucose excursions.', 'Prioritize sleep — short sleep is associated with worse glycemic control.'],
      retest: 'Consider repeat in ~3 months if outside target; annually if in target.',
      clinician: ['Ask about a full metabolic panel and lipids if HbA1c is borderline.', 'Discuss family history of diabetes and cardiometabolic disease.'],
      relatedLabs: ['Fasting glucose', 'Fasting insulin', 'Triglyceride:HDL ratio'],
    },
    genome: [],
  },

  {
    id: 'fasting_glucose',
    label: 'Fasting Glucose',
    aliases: ['fasting blood sugar', 'FBS'],
    unit: 'mg/dL',
    category: 'metabolic',
    step: 1, min: 40, max: 400,
    standard: {
      interval: [70, 99],
      label: 'Non-diabetic (US clinical)',
      source: 'ADA Standards of Care 2024',
    },
    optimization: {
      optimal: [72, 89],
      borderline: [90, 99],
      outside: [100, 400],
      label: 'SelfScience longevity target',
      rationale: 'Values in the low-normal range are associated with reduced progression to prediabetes in cohort data. Single readings are noisy — interpret alongside HbA1c and repeat measurements.',
    },
    whyItMatters:
      'Fasting glucose captures a single-point snapshot of glucose regulation. Because it varies with sleep, stress, and time of last meal, it is best read together with HbA1c (which averages ~3 months of exposure).',
    relatedTo: ['hba1c', 'triglycerides'],
    evidence: {
      confidence: 'High',
      citations: [
        { label: 'ADA diagnostic criteria', year: 2024, url: 'https://diabetesjournals.org/care/article/47/Supplement_1/S20/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Ensure 8–12 hours fasted before the draw for a clean reading.', 'Repeat once before assuming a single elevated value is meaningful.'],
      retest: '3–6 months if elevated; alongside HbA1c.',
      clinician: ['Discuss oral glucose tolerance test if borderline.', 'Review medications that affect glucose (steroids, thiazides, statins).'],
      relatedLabs: ['HbA1c', 'Fasting insulin', 'HOMA-IR'],
    },
    genome: [],
  },

  /* ------------------------------ Hormones ----------------------------- */
  {
    id: 'testosterone_total',
    label: 'Total Testosterone',
    aliases: ['total T'],
    unit: 'ng/dL',
    category: 'hormones',
    step: 1, min: 0, max: 2500,
    standard: {
      interval: [264, 916],
      label: 'Adult male reference (LC-MS/MS)',
      source: 'Travison et al. harmonized reference, JCEM 2017',
    },
    optimization: {
      optimal: [600, 900],
      borderline: [450, 599],
      outside: [0, 449],
      label: 'SelfScience mid-life target range (male)',
      rationale: 'A mid-to-upper-normal range is often preferred by performance and longevity users; supporting evidence is largely observational and does not establish a causal optimal target.',
    },
    sexOverrides: {
      female: {
        standard: { interval: [8, 60], label: 'Adult female reference', source: 'Endocrine Society' },
        optimization: {
          optimal: [20, 50],
          borderline: [10, 19],
          outside: [0, 9],
          label: 'SelfScience target range (female)',
          rationale: 'Female testosterone assay reliability is limited at low concentrations; interpret cautiously.',
        },
      },
    },
    whyItMatters:
      'Total testosterone measures both bound and free hormone. Because most testosterone is bound to SHBG, total T alone can be misleading — interpret alongside free testosterone and SHBG.',
    relatedTo: ['testosterone_free', 'shbg'],
    evidence: {
      confidence: 'Moderate',
      citations: [
        { label: 'Endocrine Society Clinical Practice Guideline: Testosterone Therapy', year: 2018, url: 'https://pubmed.ncbi.nlm.nih.gov/29562364/', type: 'consensus-guideline' },
        { label: 'Travison et al., Harmonized reference ranges, JCEM', year: 2017, url: 'https://pubmed.ncbi.nlm.nih.gov/28324103/', type: 'cohort' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Sleep quantity + quality strongly influence T — aim 7–9h.', 'Resistance training, adequate protein, and body composition matter more than most supplements.'],
      retest: 'Repeat morning draw (before 10am) before drawing conclusions.',
      clinician: ['Rule out sleep apnea if T is low.', 'Discuss context: age, symptoms, LH/FSH, prolactin before considering TRT.'],
      relatedLabs: ['Free testosterone', 'SHBG', 'LH', 'FSH', 'Estradiol'],
    },
    genome: [],
  },

  {
    id: 'testosterone_free',
    label: 'Free Testosterone',
    aliases: ['free T'],
    unit: 'pg/mL',
    category: 'hormones',
    step: 0.1, min: 0, max: 60,
    standard: {
      interval: [9, 30],
      label: 'Adult male reference',
      source: 'LabCorp / Quest typical adult range',
    },
    optimization: {
      optimal: [15, 25],
      borderline: [10, 14.9],
      outside: [0, 9.9],
      label: 'SelfScience target range (male)',
      rationale: 'Free T assays (calculated vs equilibrium dialysis vs direct RIA) vary substantially. Prefer calculated free T from total T + SHBG when available.',
    },
    sexOverrides: {
      female: {
        standard: { interval: [0.3, 6.4], label: 'Adult female reference', source: 'LabCorp typical' },
        optimization: {
          optimal: [2, 6],
          borderline: [1, 1.9],
          outside: [0, 0.9],
          label: 'SelfScience target range (female)',
          rationale: 'Direct free T assays are notoriously imprecise at female concentrations — interpret cautiously.',
        },
      },
    },
    whyItMatters:
      'Free testosterone represents the bioactive fraction not bound to SHBG or albumin. Total T can look normal while free T is low if SHBG is high.',
    relatedTo: ['testosterone_total', 'shbg'],
    evidence: {
      confidence: 'Emerging',
      citations: [
        { label: 'Endocrine Society Clinical Practice Guideline: Testosterone Therapy', year: 2018, url: 'https://pubmed.ncbi.nlm.nih.gov/29562364/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['If SHBG is high, consider whether low body fat or high thyroid hormone is driving it.'],
      retest: 'Confirm with calculated free T (total T ÷ SHBG) if direct assay was used.',
      clinician: ['Ask which free-T assay method was used.'],
      relatedLabs: ['Total testosterone', 'SHBG', 'Albumin'],
    },
    genome: [],
  },

  {
    id: 'shbg',
    label: 'SHBG',
    aliases: ['sex hormone binding globulin'],
    unit: 'nmol/L',
    category: 'hormones',
    step: 1, min: 0, max: 300,
    standard: {
      interval: [10, 57],
      label: 'Adult male reference',
      source: 'LabCorp typical adult range',
    },
    optimization: {
      optimal: [20, 45],
      borderline: [15, 19],
      outside: [0, 14],
      label: 'SelfScience target range (male)',
      rationale: 'Mid-normal SHBG allows a meaningful free/bound testosterone fraction; very low SHBG is associated with metabolic syndrome, very high SHBG lowers bioavailable T.',
    },
    sexOverrides: {
      female: {
        standard: { interval: [20, 130], label: 'Adult female reference', source: 'LabCorp typical' },
        optimization: {
          optimal: [40, 90],
          borderline: [25, 39],
          outside: [0, 24],
          label: 'SelfScience target range (female)',
          rationale: 'Very low SHBG in females is associated with PCOS phenotypes; oral contraceptives markedly raise SHBG.',
        },
      },
    },
    whyItMatters:
      'SHBG binds sex hormones and modulates their bioavailability. It also acts as a metabolic barometer — low SHBG tracks with insulin resistance and hepatic steatosis in cohort data.',
    relatedTo: ['testosterone_total', 'testosterone_free', 'hba1c'],
    evidence: {
      confidence: 'Moderate',
      citations: [
        { label: 'Ding et al., SHBG and type 2 diabetes risk, NEJM', year: 2009, url: 'https://pubmed.ncbi.nlm.nih.gov/19710482/', type: 'cohort' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Improve insulin sensitivity (weight, exercise, diet quality) if SHBG is low.'],
      retest: '3–6 months alongside a full lipid + glucose panel.',
      clinician: ['Discuss oral contraceptives, thyroid status, and hepatic health.'],
      relatedLabs: ['Total & free testosterone', 'HbA1c', 'Fasting insulin', 'LFTs'],
    },
    genome: [],
  },

  /* ----------------------------- Thyroid ------------------------------- */
  {
    id: 'tsh',
    label: 'TSH',
    aliases: ['thyroid stimulating hormone', 'thyrotropin'],
    unit: 'mIU/L',
    category: 'thyroid',
    step: 0.01, min: 0, max: 100,
    standard: {
      interval: [0.4, 4.5],
      label: 'Adult reference (US clinical)',
      source: 'ATA / AACE consensus',
    },
    optimization: {
      optimal: [0.8, 2.5],
      borderline: [2.6, 4.0],
      outside: [4.1, 100],
      label: 'SelfScience narrower functional target',
      rationale: 'A narrower target is common in optimization circles; large studies do not consistently show benefit of pharmacologic suppression within the upper-normal range.',
    },
    whyItMatters:
      'TSH is a pituitary signal, not a thyroid hormone itself. It rises when the body senses insufficient thyroid hormone. Interpret alongside Free T3 and Free T4 — TSH alone can miss subclinical patterns.',
    relatedTo: ['free_t3', 'free_t4'],
    evidence: {
      confidence: 'High',
      citations: [
        { label: 'ATA Guidelines for Hypothyroidism Diagnosis and Treatment', year: 2014, url: 'https://pubmed.ncbi.nlm.nih.gov/25266247/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Adequate iodine and selenium from diet.', 'Consistent draw time — TSH has meaningful diurnal variation.'],
      retest: 'Repeat in 6–8 weeks if abnormal before acting.',
      clinician: ['Ask about thyroid antibodies (TPO, TG) if elevated.', 'Review medications: biotin, metformin, and lithium affect TSH interpretation.'],
      relatedLabs: ['Free T3', 'Free T4', 'TPO antibodies', 'Reverse T3'],
    },
    genome: [],
  },

  {
    id: 'free_t3',
    label: 'Free T3',
    aliases: ['free triiodothyronine', 'fT3'],
    unit: 'pg/mL',
    category: 'thyroid',
    step: 0.01, min: 0, max: 12,
    standard: {
      interval: [2.3, 4.2],
      label: 'Adult reference (US clinical)',
      source: 'LabCorp / Quest typical adult range',
    },
    optimization: {
      optimal: [3.0, 3.8],
      borderline: [2.5, 2.9],
      outside: [0, 2.4],
      label: 'SelfScience mid-upper functional target',
      rationale: 'Free T3 is the active thyroid hormone at the cellular level. Optimization circles favor mid-upper reference; direct outcome data supporting this narrower target is limited.',
    },
    whyItMatters:
      'Free T3 is the metabolically active thyroid hormone. Free T3 can look normal while symptoms persist — reverse T3 and cellular receptor sensitivity also matter but are rarely captured in routine panels.',
    relatedTo: ['tsh', 'free_t4'],
    evidence: {
      confidence: 'Moderate',
      citations: [
        { label: 'ATA Guidelines for Hypothyroidism', year: 2014, url: 'https://pubmed.ncbi.nlm.nih.gov/25266247/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Very low-calorie dieting and overtraining can lower T3.'],
      retest: '6–8 weeks alongside TSH and Free T4.',
      clinician: ['Discuss whether reverse T3 or antibody testing is appropriate.'],
      relatedLabs: ['TSH', 'Free T4', 'Reverse T3', 'TPO/Tg antibodies'],
    },
    genome: [],
  },

  {
    id: 'free_t4',
    label: 'Free T4',
    aliases: ['free thyroxine', 'fT4'],
    unit: 'ng/dL',
    category: 'thyroid',
    step: 0.01, min: 0, max: 5,
    standard: {
      interval: [0.8, 1.8],
      label: 'Adult reference (US clinical)',
      source: 'LabCorp / Quest typical adult range',
    },
    optimization: {
      optimal: [1.1, 1.6],
      borderline: [0.9, 1.0],
      outside: [0, 0.8],
      label: 'SelfScience mid-upper functional target',
      rationale: 'Mid-upper Free T4 provides adequate substrate for peripheral T3 conversion; narrower targets are supported more by clinical practice than by outcome trials.',
    },
    whyItMatters:
      'Free T4 is the storage form of thyroid hormone; peripheral tissues convert it to active T3. Free T4 changes more slowly than Free T3, making it useful for trend tracking.',
    relatedTo: ['tsh', 'free_t3'],
    evidence: {
      confidence: 'High',
      citations: [
        { label: 'ATA Guidelines for Hypothyroidism', year: 2014, url: 'https://pubmed.ncbi.nlm.nih.gov/25266247/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Consistency of draw timing and any thyroid replacement dose timing matters.'],
      retest: '6–8 weeks after any dose change.',
      clinician: ['Discuss appropriateness of T4 vs T4+T3 replacement if hypothyroid.'],
      relatedLabs: ['TSH', 'Free T3', 'Reverse T3'],
    },
    genome: [],
  },

  /* ------------------------------ Lipids ------------------------------- */
  {
    id: 'apob',
    label: 'ApoB',
    aliases: ['apolipoprotein B'],
    unit: 'mg/dL',
    category: 'lipids',
    step: 1, min: 20, max: 300,
    standard: {
      interval: [40, 125],
      label: 'US clinical adult range',
      source: 'LabCorp typical',
    },
    optimization: {
      optimal: [40, 80],
      borderline: [81, 100],
      outside: [101, 300],
      label: 'SelfScience CV-risk target',
      rationale: 'ApoB measures the count of atherogenic particles. Lower ApoB is causally associated with lower ASCVD risk in Mendelian randomization studies; guideline groups vary on how low is optimal.',
    },
    whyItMatters:
      'ApoB counts every atherogenic lipoprotein particle (LDL, IDL, VLDL remnants, Lp(a)). It is generally considered a more precise cardiovascular risk marker than LDL-C alone — particularly when LDL-C and ApoB disagree.',
    relatedTo: ['ldl', 'hdl', 'hs_crp'],
    evidence: {
      confidence: 'High',
      citations: [
        { label: 'Ference et al., ApoB and ASCVD causation, JAMA', year: 2019, url: 'https://pubmed.ncbi.nlm.nih.gov/31063586/', type: 'meta-analysis' },
        { label: 'ESC/EAS Guidelines on Dyslipidaemia', year: 2019, url: 'https://pubmed.ncbi.nlm.nih.gov/31504418/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Saturated fat and refined carb intake are the two biggest dietary levers on ApoB.', 'Body composition changes influence ApoB independent of LDL-C.'],
      retest: '3–6 months after diet/med changes.',
      clinician: ['Discuss Lp(a) once in a lifetime.', 'Discuss ApoB target given personal & family CV risk.'],
      relatedLabs: ['LDL-C', 'Lp(a)', 'HDL', 'Triglycerides'],
    },
    genome: [],
  },

  {
    id: 'ldl',
    label: 'LDL-C',
    aliases: ['LDL cholesterol', 'low density lipoprotein'],
    unit: 'mg/dL',
    category: 'lipids',
    step: 1, min: 20, max: 400,
    standard: {
      interval: [0, 100],
      label: 'US clinical target (no risk factors)',
      source: 'AHA/ACC 2018',
    },
    optimization: {
      optimal: [40, 80],
      borderline: [81, 130],
      outside: [131, 400],
      label: 'SelfScience CV-risk target',
      rationale: 'Guideline groups increasingly favor lower LDL-C for elevated CV risk. For low-risk individuals a broader target is reasonable; interpret with ApoB when available.',
    },
    whyItMatters:
      'LDL-C estimates cholesterol carried by LDL particles. It is a simple, widely-available marker of atherogenic lipid burden but does not distinguish particle count from cholesterol content — ApoB does that better.',
    relatedTo: ['apob', 'hdl'],
    evidence: {
      confidence: 'High',
      citations: [
        { label: 'ACC/AHA Cholesterol Guideline', year: 2018, url: 'https://pubmed.ncbi.nlm.nih.gov/30423391/', type: 'consensus-guideline' },
        { label: 'CTT Collaboration, statin trial meta-analysis, Lancet', year: 2010, url: 'https://pubmed.ncbi.nlm.nih.gov/21067804/', type: 'meta-analysis' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Saturated fat, dietary fiber (soluble), and plant sterols are the biggest food-based levers.'],
      retest: '3 months after diet change.',
      clinician: ['Discuss ApoB and Lp(a) if considering treatment.'],
      relatedLabs: ['ApoB', 'HDL', 'Triglycerides', 'Lp(a)'],
    },
    genome: [],
  },

  {
    id: 'hdl',
    label: 'HDL-C',
    aliases: ['HDL cholesterol'],
    unit: 'mg/dL',
    category: 'lipids',
    step: 1, min: 10, max: 150,
    standard: {
      interval: [40, 60],
      label: 'Adult reference',
      source: 'AHA/ACC 2018',
    },
    optimization: {
      optimal: [55, 80],
      borderline: [40, 54],
      outside: [10, 39],
      label: 'SelfScience target range',
      rationale: 'Low HDL-C is associated with elevated CV risk, but raising HDL-C pharmacologically has not improved outcomes in trials. Treat HDL-C as a marker, not a target.',
    },
    whyItMatters:
      'HDL-C reflects reverse cholesterol transport capacity, roughly. Low HDL-C is associated with CV risk in cohort studies, though trials that raised HDL-C pharmacologically did not reduce events — so it may be a risk marker, not a modifiable target.',
    relatedTo: ['ldl', 'apob'],
    evidence: {
      confidence: 'Contested',
      citations: [
        { label: 'HPS2-THRIVE, niacin + statin, NEJM', year: 2014, url: 'https://pubmed.ncbi.nlm.nih.gov/25014686/', type: 'rct' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Aerobic exercise and smoking cessation reliably raise HDL-C.'],
      retest: '3–6 months if targeting improvement.',
      clinician: ['Interpret alongside ApoB and triglycerides rather than as a stand-alone.'],
      relatedLabs: ['Triglycerides', 'ApoB', 'LDL-C'],
    },
    genome: [],
  },

  /* --------------------------- Inflammation ---------------------------- */
  {
    id: 'hs_crp',
    label: 'hs-CRP',
    aliases: ['high sensitivity C-reactive protein'],
    unit: 'mg/L',
    category: 'inflammation',
    step: 0.01, min: 0, max: 50,
    standard: {
      interval: [0, 3.0],
      label: 'CV risk stratification (AHA/CDC)',
      source: 'AHA/CDC 2003',
    },
    optimization: {
      optimal: [0, 1.0],
      borderline: [1.01, 3.0],
      outside: [3.01, 50],
      label: 'SelfScience low-risk target',
      rationale: 'hs-CRP <1 mg/L is the AHA-defined low-risk category. Values are elevated by recent infection/injury — always retest before drawing conclusions.',
    },
    whyItMatters:
      'hs-CRP is a general marker of systemic inflammation and modestly predicts cardiovascular events. It rises with acute infection, injury, obesity, and chronic inflammatory conditions — always retest before drawing conclusions from a single elevated value.',
    relatedTo: ['apob', 'ferritin', 'hba1c'],
    evidence: {
      confidence: 'Moderate',
      citations: [
        { label: 'Ridker et al., JUPITER trial, NEJM', year: 2008, url: 'https://pubmed.ncbi.nlm.nih.gov/18997196/', type: 'rct' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Body composition, sleep, and cardiorespiratory fitness are the largest modifiable levers.'],
      retest: 'Repeat after 2–4 weeks if elevated (rule out acute cause).',
      clinician: ['If persistently elevated, discuss underlying inflammatory or metabolic drivers.'],
      relatedLabs: ['Ferritin', 'HbA1c', 'ApoB'],
    },
    genome: [],
  },

  /* ------------------------- Iron / CBC / Hgb -------------------------- */
  {
    id: 'hemoglobin',
    label: 'Hemoglobin',
    aliases: ['Hgb', 'Hb'],
    unit: 'g/dL',
    category: 'iron',
    step: 0.1, min: 5, max: 22,
    standard: {
      interval: [13.5, 17.5],
      label: 'Adult male reference',
      source: 'WHO',
    },
    optimization: {
      optimal: [14.0, 16.5],
      borderline: [13.0, 13.9],
      outside: [5, 12.9],
      label: 'SelfScience target range (male)',
      rationale: 'Values in the mid-normal range support O2 delivery for training-adapted adults without polycythemia risk.',
    },
    sexOverrides: {
      female: {
        standard: { interval: [12.0, 15.5], label: 'Adult female reference', source: 'WHO' },
        optimization: {
          optimal: [13.0, 15.0],
          borderline: [12.0, 12.9],
          outside: [5, 11.9],
          label: 'SelfScience target range (female)',
          rationale: 'Menstruation and iron intake meaningfully affect hemoglobin trajectory over months.',
        },
      },
    },
    whyItMatters:
      'Hemoglobin carries oxygen from lungs to tissues. Both low and unusually high hemoglobin have implications: low points toward anemia (many causes); high can reflect dehydration, hypoxia, smoking, or a hematologic disorder.',
    relatedTo: ['ferritin'],
    evidence: {
      confidence: 'High',
      citations: [
        { label: 'WHO Nutritional Anaemias', year: 2011, url: 'https://www.who.int/publications/i/item/9789241502023', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['If low, ensure adequate dietary iron; pair non-heme iron with vitamin C.', 'Hydration status affects the reading.'],
      retest: '3 months after iron intake changes.',
      clinician: ['Rule out GI blood loss if unexplained low Hgb.', 'Discuss ferritin, transferrin saturation, MCV, MCH before assuming iron deficiency.'],
      relatedLabs: ['Ferritin', 'MCV', 'Transferrin saturation', 'Reticulocytes'],
    },
    genome: [],
  },

  {
    id: 'ferritin',
    label: 'Ferritin',
    aliases: ['iron stores'],
    unit: 'ng/mL',
    category: 'iron',
    step: 1, min: 0, max: 3000,
    standard: {
      interval: [30, 400],
      label: 'Adult male reference',
      source: 'BSH / LabCorp typical',
    },
    optimization: {
      optimal: [50, 200],
      borderline: [30, 49],
      outside: [0, 29],
      label: 'SelfScience target range (male)',
      rationale: 'Very high ferritin can reflect inflammation or hereditary hemochromatosis rather than iron overload alone — interpret alongside transferrin saturation and hs-CRP.',
    },
    sexOverrides: {
      female: {
        standard: { interval: [15, 200], label: 'Adult female reference', source: 'BSH / LabCorp typical' },
        optimization: {
          optimal: [40, 150],
          borderline: [20, 39],
          outside: [0, 19],
          label: 'SelfScience target range (female)',
          rationale: 'Female ferritin can drop meaningfully with menstruation; symptoms often appear before Hgb drops.',
        },
      },
    },
    whyItMatters:
      'Ferritin reflects stored iron but is also an acute-phase reactant — it rises with inflammation, infection, obesity, and liver disease. Interpretation requires context: hs-CRP, transferrin saturation, and clinical picture.',
    relatedTo: ['hemoglobin', 'hs_crp'],
    evidence: {
      confidence: 'Moderate',
      citations: [
        { label: 'BSH Guidelines on iron deficiency', year: 2020, url: 'https://pubmed.ncbi.nlm.nih.gov/31578732/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['If low, dietary iron + vitamin C; if very high, consider blood donation and discuss hemochromatosis screening.'],
      retest: '3 months after any intervention.',
      clinician: ['If ferritin is high AND hs-CRP is high, treat inflammation before assuming iron overload.', 'HFE genotyping if strong family history.'],
      relatedLabs: ['Hemoglobin', 'Transferrin saturation', 'hs-CRP'],
    },
    genome: [],
  },

  /* --------------------------- Micronutrients -------------------------- */
  {
    id: 'vitamin_d',
    label: 'Vitamin D (25-OH)',
    aliases: ['25(OH)D', '25-hydroxyvitamin D'],
    unit: 'ng/mL',
    category: 'micronutrient',
    step: 1, min: 0, max: 200,
    standard: {
      interval: [30, 100],
      label: 'Adult sufficiency (Endocrine Society)',
      source: 'Endocrine Society 2011',
    },
    optimization: {
      optimal: [40, 60],
      borderline: [30, 39],
      outside: [0, 29],
      label: 'SelfScience mid-range target',
      rationale: 'Optimal 25-OH D remains debated. VITAL and D-Health trials showed no all-cause mortality benefit from supplementation above deficient levels; targeting a mid-range value is a reasonable middle position.',
    },
    whyItMatters:
      '25-hydroxyvitamin D is the storage form of vitamin D and the standard blood measure. Below 20 ng/mL is widely considered deficient; the upper end of "optimal" is contested — large trials have not demonstrated clear benefit from supplementation once levels are sufficient.',
    relatedTo: [],
    evidence: {
      confidence: 'Contested',
      citations: [
        { label: 'VITAL trial, vitamin D and events, NEJM', year: 2019, url: 'https://pubmed.ncbi.nlm.nih.gov/30415629/', type: 'rct' },
        { label: 'Endocrine Society: Vitamin D Guideline', year: 2011, url: 'https://pubmed.ncbi.nlm.nih.gov/21646368/', type: 'consensus-guideline' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Sun exposure (with sensible skin-cancer risk management) or moderate supplementation.', 'K2 and magnesium are cofactors worth ensuring adequacy.'],
      retest: '2–3 months after starting or changing supplementation.',
      clinician: ['Very high levels (>100 ng/mL) can be problematic — discuss dose review.'],
      relatedLabs: ['Calcium', 'PTH', 'Magnesium'],
    },
    genome: [],
  },

  /* ----------------------- Growth / Longevity -------------------------- */
  {
    id: 'igf1',
    label: 'IGF-1',
    aliases: ['insulin-like growth factor 1'],
    unit: 'ng/mL',
    category: 'longevity',
    step: 1, min: 20, max: 800,
    standard: {
      interval: [80, 280],
      label: 'Adult reference (age-dependent)',
      source: 'LabCorp / Quest age-adjusted',
    },
    optimization: {
      optimal: [120, 200],
      borderline: [100, 119],
      outside: [20, 99],
      label: 'SelfScience mid-range target',
      rationale: 'IGF-1 has a J-shaped mortality association in cohort studies: both very low and very high values are linked with worse outcomes. Mid-normal is the pragmatic target.',
    },
    whyItMatters:
      'IGF-1 mediates many of growth hormone’s effects and is linked to protein synthesis and cellular growth. Cohort data suggest a J-shaped mortality curve — both very low and very high IGF-1 are associated with worse outcomes, especially in older adults. Age-specific reference ranges matter.',
    relatedTo: [],
    evidence: {
      confidence: 'Contested',
      citations: [
        { label: 'Milman et al., IGF-1 and longevity, Aging Cell', year: 2014, url: 'https://pubmed.ncbi.nlm.nih.gov/24902935/', type: 'cohort' },
      ],
      editorialSlugs: [],
    },
    nextSteps: {
      lifestyle: ['Adequate protein and resistance training raise IGF-1; chronic caloric restriction lowers it.'],
      retest: 'Annually unless targeted intervention.',
      clinician: ['Discuss age-adjusted reference range and personal risk context.'],
      relatedLabs: ['Fasting insulin', 'HbA1c'],
    },
    genome: [],
  },

  /* ----------------------------- Methylation --------------------------- */
  {
    id: 'homocysteine',
    label: 'Homocysteine',
    aliases: ['Hcy'],
    unit: 'µmol/L',
    category: 'methylation',
    step: 0.1, min: 2, max: 60,
    standard: {
      interval: [4, 15],
      label: 'Adult reference',
      source: 'LabCorp typical',
    },
    optimization: {
      optimal: [5, 8],
      borderline: [8.1, 10],
      outside: [10.1, 60],
      label: 'SelfScience low-CV-risk target',
      rationale: 'Lower homocysteine is associated with lower CV risk in observational data. Trials of B-vitamin lowering have shown modest stroke benefit but no consistent overall CV benefit.',
    },
    whyItMatters:
      'Homocysteine is a methylation intermediate. Elevated levels are associated with cardiovascular and cognitive risk in cohort studies; trials lowering homocysteine with B-vitamins have shown modest stroke benefit but no consistent CV mortality benefit.',
    relatedTo: [],
    evidence: {
      confidence: 'Moderate',
      citations: [
        { label: 'HOPE-2 trial, homocysteine lowering, NEJM', year: 2006, url: 'https://pubmed.ncbi.nlm.nih.gov/16531614/', type: 'rct' },
        { label: 'Boushey et al., homocysteine meta-analysis, JAMA', year: 1995, url: 'https://pubmed.ncbi.nlm.nih.gov/7563515/', type: 'meta-analysis' },
      ],
      editorialSlugs: ['mthfr-c677t-folate-supplementation-test'], // will be replaced by real slug
    },
    nextSteps: {
      lifestyle: ['Ensure adequate folate, B12, B6, and choline intake.'],
      retest: '3 months after B-vitamin optimization.',
      clinician: ['Consider MTHFR C677T context, B12 (including active B12), and renal function.'],
      relatedLabs: ['Folate', 'B12 (active)', 'Creatinine'],
    },
    genome: ['MTHFR', 'MTR', 'MTRR', 'CBS'], // Phase 2 will render these
  },
]

/** Legacy disclaimer kept for backward-compat with existing imports. */
export const BIOMARKERS_DISCLAIMER =
  'Ranges are research-informed reference points, not personalized medical advice. Interpret any lab result alongside symptoms, context, and a qualified clinician.'
