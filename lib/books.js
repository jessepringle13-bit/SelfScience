/**
 * SelfScience reading list — canonical book data + variant-trigger matcher.
 *
 * @typedef {Object} Book
 * @property {string}   slug
 * @property {string}   title
 * @property {string}   author
 * @property {number}   year
 * @property {string[]} pillar
 * @property {string[]} variantTriggers
 * @property {string}   plainReason
 * @property {string|null} honestyNote
 * @property {string[]} searchQueries
 * @property {boolean}  universalRecommendation
 */

export const PILLAR_LABELS = {
  genomics: 'Genomics',
  nutrition: 'Nutrition',
  performance: 'Performance',
  longevity: 'Longevity',
  wellness: 'Wellness',
  pharmacogenomics: 'Pharmacogenomics',
  'mental-health': 'Mental Health',
  environment: 'Environment',
  hormones: 'Hormones',
}

/** All 9 filter pillars in display order (matches homepage). */
export const PILLARS_ORDERED = [
  'genomics', 'nutrition', 'performance', 'longevity', 'wellness',
  'pharmacogenomics', 'mental-health', 'environment', 'hormones',
]

/** @type {Book[]} */
export const BOOKS = [
  // PILLAR 1 — GENOMICS
  { slug: 'the-language-of-life', title: 'The Language of Life', author: 'Francis S. Collins', year: 2010,
    pillar: ['genomics'], variantTriggers: ['universal'],
    plainReason: 'The former director of the Human Genome Project explains what your DNA actually tells you and what it does not. The most credible plain-language introduction to personal genomics available — written for a general audience without overselling what genetics can predict.',
    honestyNote: null,
    searchQueries: ['personal genomics consumer DNA research', 'DNA health prediction accuracy studies', 'genome sequencing clinical applications research'],
    universalRecommendation: true },
  { slug: 'the-genome-factor', title: 'The Genome Factor', author: 'Dalton Conley and Jason Fletcher', year: 2017,
    pillar: ['genomics'], variantTriggers: ['universal'],
    plainReason: 'Two social scientists with genomics expertise give an honest, rigorous account of what polygenic scores and genetic associations actually mean for individuals versus populations. Essential reading for anyone who wants to understand the real limits of genetic prediction.',
    honestyNote: null,
    searchQueries: ['polygenic risk score accuracy research', 'gene environment interaction studies', 'genetic determinism limitations research'],
    universalRecommendation: true },
  { slug: 'a-crack-in-creation', title: 'A Crack in Creation', author: 'Jennifer Doudna', year: 2017,
    pillar: ['genomics'], variantTriggers: ['universal'],
    plainReason: 'The co-inventor of CRISPR explains how gene editing works and what it means for medicine and humanity. Provides essential context for where genomics is heading and why understanding your current genome matters now.',
    honestyNote: null,
    searchQueries: ['CRISPR gene editing applications research', 'genomic medicine future research', 'genetic variation disease research'],
    universalRecommendation: false },
  { slug: 'dirty-genes', title: 'Dirty Genes', author: 'Ben Lynch', year: 2018,
    pillar: ['genomics', 'nutrition'], variantTriggers: ['MTHFR_compound_het'],
    plainReason: 'The most accessible book specifically on MTHFR and the methylation cycle. Covers folate forms, homocysteine, and the B vitamin cofactors your body needs when the MTHFR enzyme runs at reduced efficiency.',
    honestyNote: 'Some claims in this book are ahead of the peer-reviewed evidence. The SelfScience reliability scoring system reflects where the research is strong and where it is still preliminary.',
    searchQueries: ['MTHFR methylation support research', 'methylfolate vs folic acid studies', 'homocysteine B vitamin intervention research'],
    universalRecommendation: false },

  // PILLAR 2 — NUTRITION
  { slug: 'the-circadian-code', title: 'The Circadian Code', author: 'Satchin Panda', year: 2019,
    pillar: ['nutrition', 'wellness'], variantTriggers: ['MTNR1B_GG'],
    plainReason: "Dr. Panda leads one of the world's top labs on time-restricted eating and circadian biology. His research on meal timing and metabolic health maps directly to what peer-reviewed studies have found for MTNR1B GG carriers — making when you eat as important as what you eat.",
    honestyNote: null,
    searchQueries: ['MTNR1B meal timing glucose research', 'time restricted eating circadian biology', 'melatonin insulin secretion studies'],
    universalRecommendation: false },
  { slug: 'genius-foods', title: 'Genius Foods', author: 'Max Lugavere', year: 2018,
    pillar: ['nutrition', 'mental-health'], variantTriggers: ['FADS1_TT', 'MTHFR_compound_het'],
    plainReason: 'Covers the research on how specific nutrients — omega-3s, B vitamins, fat-soluble vitamins — affect brain and metabolic function. Directly relevant to FADS1 and BCMO1 variant research on nutrient conversion efficiency.',
    honestyNote: null,
    searchQueries: ['FADS1 omega-3 brain health research', 'dietary fat cognitive function studies', 'nutrient brain function genomics research'],
    universalRecommendation: false },
  { slug: 'low-carb-performance', title: 'The Art and Science of Low Carbohydrate Performance', author: 'Jeff Volek and Stephen Phinney', year: 2012,
    pillar: ['nutrition', 'performance'], variantTriggers: ['PPARA_GG'],
    plainReason: 'Volek and Phinney are the leading researchers on fat adaptation in athletes. Essential reading for PPARA GG individuals — this genotype is associated with stronger fat-burning efficiency during aerobic effort, making the research in this book directly applicable.',
    honestyNote: null,
    searchQueries: ['PPARA fat oxidation ketogenic diet research', 'fat adapted athlete performance studies', 'low carbohydrate endurance research'],
    universalRecommendation: false },
  { slug: 'the-better-brain', title: 'The Better Brain', author: 'Bonnie Kaplan and Julia Rucklidge', year: 2021,
    pillar: ['nutrition', 'mental-health'], variantTriggers: ['MTHFR_compound_het'],
    plainReason: 'Two researchers present the evidence for micronutrient support — including methylated B vitamins — in mental health. Directly relevant to MTHFR compound het and the connection between folate processing and neurotransmitter synthesis.',
    honestyNote: null,
    searchQueries: ['micronutrient mental health research', 'B vitamin mood regulation studies', 'methylation neurotransmitter research'],
    universalRecommendation: false },

  // PILLAR 3 — SPORTS PERFORMANCE
  { slug: 'endure', title: 'Endure', author: 'Alex Hutchinson', year: 2018,
    pillar: ['performance'], variantTriggers: ['ACTN3_XX'],
    plainReason: 'The science of human endurance — what actually limits performance and how athletes push those limits. Covers VO2max, lactate threshold, heat adaptation, and psychological factors. Directly relevant to the ACTN3 XX endurance genotype and aerobic performance research.',
    honestyNote: null,
    searchQueries: ['ACTN3 XX endurance performance research', 'VO2max genetic variation studies', 'aerobic capacity training adaptation research'],
    universalRecommendation: false },
  { slug: 'the-brave-athlete', title: 'The Brave Athlete', author: 'Simon Marshall and Lesley Paterson', year: 2017,
    pillar: ['performance', 'mental-health'], variantTriggers: ['COMT_ValVal'],
    plainReason: 'Sports psychology meets physiology. Covers the mental architecture of athletic performance — how to train the brain alongside the body. Particularly relevant for COMT ValVal athletes who perform differently under competition pressure versus low-stakes training.',
    honestyNote: null,
    searchQueries: ['COMT Val158Met athletic performance research', 'sports psychology performance pressure studies', 'dopamine competition stress research'],
    universalRecommendation: false },
  { slug: 'the-sports-gene', title: 'The Sports Gene', author: 'David Epstein', year: 2013,
    pillar: ['performance', 'genomics'], variantTriggers: ['ACTN3_XX', 'PPARA_GG'],
    plainReason: 'A thorough, honest exploration of how genetics shapes athletic potential. Covers ACTN3, ACE, and the broader science of nature versus nurture in sport. More balanced and rigorous than most popular genetics books — acknowledges both real genetic influences and their limits.',
    honestyNote: null,
    searchQueries: ['ACTN3 elite athlete genetic research', 'sports genetics performance studies', 'athletic potential gene environment interaction'],
    universalRecommendation: false },
  { slug: 'the-comfort-crisis', title: 'The Comfort Crisis', author: 'Michael Easter', year: 2021,
    pillar: ['performance', 'wellness'], variantTriggers: ['ACTN3_XX'],
    plainReason: 'Explores rucking, sustained physical effort, and the physiological and psychological benefits of endurance challenges. Directly aligned with the ACTN3 XX athletic profile. Covers the research on why sustained effort produces adaptation both physically and psychologically.',
    honestyNote: null,
    searchQueries: ['rucking cardiovascular research', 'sustained aerobic effort health outcomes', 'endurance exercise adaptation studies'],
    universalRecommendation: false },

  // PILLAR 4 — LONGEVITY
  { slug: 'outlive', title: 'Outlive', author: 'Peter Attia', year: 2023,
    pillar: ['longevity'], variantTriggers: ['FOXO3_TT', 'universal'],
    plainReason: 'The most comprehensive evidence-grounded longevity framework currently in print. Covers the primary causes of early death, and how exercise, nutrition, sleep, and emotional health address each one. Relevant to FOXO3, SIRT1, OBFC1, and cardiovascular genetics research.',
    honestyNote: null,
    searchQueries: ['FOXO3 longevity lifestyle intervention research', 'Zone 2 exercise longevity studies', 'healthspan lifespan cardiovascular research'],
    universalRecommendation: true },
  { slug: 'lifespan', title: 'Lifespan', author: 'David Sinclair', year: 2019,
    pillar: ['longevity'], variantTriggers: ['SIRT1_TT', 'FOXO3_TT'],
    plainReason: "Sinclair's information theory of aging covers sirtuins, NAD+, mTOR, and the epigenetic clock. Directly relevant to SIRT1 TT and FOXO3 TT pathway research — explaining the biological mechanisms these variants affect and the interventions being studied.",
    honestyNote: "Some of Sinclair's forward-looking claims are ahead of current human evidence. The SelfScience reliability scoring reflects where the research is strong and where it is still preliminary.",
    searchQueries: ['SIRT1 resveratrol human trial research', 'NMN NAD+ longevity studies', 'sirtuin pathway aging research'],
    universalRecommendation: false },
  { slug: 'the-telomere-effect', title: 'The Telomere Effect', author: 'Elizabeth Blackburn and Elissa Epel', year: 2017,
    pillar: ['longevity'], variantTriggers: ['OBFC1_AA', 'TERT_CT'],
    plainReason: 'Written by the Nobel Prize winner who discovered telomerase. Covers how telomere length connects to biological aging and what lifestyle factors the research shows protect telomere integrity. Essential reading for OBFC1 AA and TERT variant carriers.',
    honestyNote: null,
    searchQueries: ['telomere length lifestyle research', 'OBFC1 telomere maintenance studies', 'telomerase activation exercise research'],
    universalRecommendation: false },
  { slug: 'the-longevity-paradox', title: 'The Longevity Paradox', author: 'Steven Gundry', year: 2019,
    pillar: ['longevity', 'wellness'], variantTriggers: ['NOD2_compound'],
    plainReason: 'Covers the gut-longevity connection with a focus on microbiome diversity and dietary fiber. The gut-longevity axis discussion is relevant to NOD2 and FUT2 research on how gut immune function affects systemic health over time.',
    honestyNote: "Some of Gundry's specific claims about lectins are not well-supported in peer-reviewed literature. The SelfScience reliability layer applies — use the search tool to verify specific claims from this book.",
    searchQueries: ['gut microbiome longevity research', 'microbiome diversity aging studies', 'intestinal health systemic inflammation research'],
    universalRecommendation: false },

  // PILLAR 5 — GENERAL WELLNESS
  { slug: 'why-we-sleep', title: 'Why We Sleep', author: 'Matthew Walker', year: 2017,
    pillar: ['wellness'], variantTriggers: ['MTNR1B_GG', 'CLOCK_AG'],
    plainReason: 'The most comprehensive book on sleep science for a general audience. Covers circadian biology, sleep stages, and how sleep affects metabolic health, immune function, and cognition. Relevant to MTNR1B GG, CLOCK, and PER3 variant research.',
    honestyNote: 'Several specific claims in this book have been contested in peer-reviewed literature. The SelfScience reliability scoring tool will flag which findings are well-supported and which are disputed when you search the underlying research.',
    searchQueries: ['sleep quality metabolic health research', 'MTNR1B circadian rhythm studies', 'sleep deprivation glucose regulation research'],
    universalRecommendation: false },
  { slug: 'the-stress-code', title: 'The Stress Code', author: 'Richard Sutton', year: 2018,
    pillar: ['wellness', 'mental-health'], variantTriggers: ['FKBP5_CT'],
    plainReason: 'Evidence-based guide to understanding and managing the HPA axis stress response. Directly relevant to FKBP5 CT cortisol dysregulation research — covering practical strategies that the research supports for people whose stress hormone system takes longer to recover.',
    honestyNote: null,
    searchQueries: ['FKBP5 cortisol recovery research', 'HPA axis regulation lifestyle studies', 'stress resilience adaptogen research'],
    universalRecommendation: false },
  { slug: 'gut', title: 'Gut', author: 'Giulia Enders', year: 2015,
    pillar: ['wellness'], variantTriggers: ['NOD2_compound'],
    plainReason: 'The most accessible plain-language introduction to gut biology and the microbiome. Written by a gastroenterologist for a general audience. Essential foundation for understanding NOD2, FUT2, and gut barrier research.',
    honestyNote: null,
    searchQueries: ['NOD2 gut barrier research', 'intestinal microbiome immune function studies', 'gut permeability nutrition research'],
    universalRecommendation: false },
  { slug: 'the-good-gut', title: 'The Good Gut', author: 'Justin Sonnenburg and Erica Sonnenburg', year: 2015,
    pillar: ['wellness'], variantTriggers: ['NOD2_compound', 'FUT2_secretor'],
    plainReason: 'The Sonnenburgs run the leading microbiome lab at Stanford. Their work on fiber diversity and Bifidobacterium is directly relevant to FUT2 secretor status and NOD2 gut immune research — covering which dietary strategies the evidence supports for microbiome health.',
    honestyNote: null,
    searchQueries: ['microbiome diversity dietary fiber research', 'FUT2 secretor Bifidobacterium studies', 'gut microbiome NOD2 research'],
    universalRecommendation: false },
  { slug: 'brain-maker', title: 'Brain Maker', author: 'David Perlmutter', year: 2015,
    pillar: ['wellness', 'mental-health'], variantTriggers: ['NOD2_compound', 'FUT2_secretor'],
    plainReason: 'Covers the gut-brain axis and the research on microbiome composition and neurological health. Relevant to NOD2, FUT2, and the connection between gut inflammation and brain function.',
    honestyNote: 'Some claims in this book are ahead of peer-reviewed evidence. Use the SelfScience search tool to verify specific claims from this book against the research.',
    searchQueries: ['gut brain axis research', 'microbiome neurological health studies', 'intestinal inflammation cognition research'],
    universalRecommendation: false },

  // PILLAR 6 — PHARMACOGENOMICS
  { slug: 'the-right-medicine', title: 'The Right Medicine', author: 'Howard McLeod', year: 2021,
    pillar: ['pharmacogenomics'], variantTriggers: ['CYP2D6_normal', 'NAT2_slow'],
    plainReason: "One of the world's leading pharmacogenomics researchers explains how your genes affect drug response in practical terms — covering CYP enzymes, why the same medication dose works differently in different people, and where personalized medicine is heading.",
    honestyNote: null,
    searchQueries: ['CYP2D6 medication response pharmacogenomics', 'drug metabolism genetic variation research', 'personalized medicine genomics studies'],
    universalRecommendation: false },
  { slug: 'medicating-normal', title: 'Medicating Normal', author: 'Various contributors', year: 2021,
    pillar: ['pharmacogenomics', 'mental-health'], variantTriggers: ['CYP2C19_normal'],
    plainReason: 'Covers the broader context of psychiatric medication — how drugs are approved, why responses vary between individuals, and what the research actually shows about long-term use. Relevant for anyone researching CYP2D6, CYP2C19, and psychiatric medication response genetics.',
    honestyNote: null,
    searchQueries: ['CYP2C19 antidepressant metabolism research', 'psychiatric medication response genetic variation', 'pharmacogenomics mental health studies'],
    universalRecommendation: false },
  { slug: 'the-antidepressant-solution', title: 'The Antidepressant Solution', author: 'Joseph Glenmullen', year: 2006,
    pillar: ['pharmacogenomics', 'mental-health'], variantTriggers: ['SLC6A4_variant', 'CYP2D6_normal'],
    plainReason: "A Harvard psychiatrist's practical guide to tapering and discontinuing antidepressants. Written before pharmacogenomics was widely accessible but remains the most practical clinical reference for medication discontinuation — relevant alongside CYP2D6 and SLC6A4 research.",
    honestyNote: 'Published in 2006 — some specific recommendations predate current pharmacogenomics research. Read alongside more recent literature using the SelfScience search tool.',
    searchQueries: ['SSRI discontinuation research', 'antidepressant tapering clinical studies', 'SLC6A4 serotonin transporter medication response'],
    universalRecommendation: false },

  // PILLAR 7 — MENTAL HEALTH AND NEUROCHEMISTRY
  { slug: 'behave', title: 'Behave', author: 'Robert Sapolsky', year: 2017,
    pillar: ['mental-health'], variantTriggers: ['COMT_ValVal', 'FKBP5_CT', 'MAOA_variant'],
    plainReason: 'The most comprehensive plain-language breakdown of how biology — including genetics, hormones, and neurotransmitters — shapes human behavior. Covers dopamine, serotonin, stress systems, and decision-making with full scientific rigor. Essential reading for COMT, MAOA, FKBP5, and DRD2 research.',
    honestyNote: null,
    searchQueries: ['COMT dopamine behavior neuroscience research', 'stress hormones behavior studies', 'neurotransmitter genetic variation research'],
    universalRecommendation: false },
  { slug: 'the-molecule-of-more', title: 'The Molecule of More', author: 'Daniel Z. Lieberman and Michael E. Long', year: 2018,
    pillar: ['mental-health'], variantTriggers: ['COMT_ValVal'],
    plainReason: 'Explores how dopamine drives motivation, ambition, creativity, and reward-seeking. Directly relevant to COMT ValVal neurobiology — explains why the Warrior genotype seeks challenge and novelty and how to design your life and training around that rather than against it.',
    honestyNote: null,
    searchQueries: ['COMT Val158Met dopamine motivation research', 'dopamine reward seeking neuroscience studies', 'prefrontal cortex dopamine performance research'],
    universalRecommendation: false },
  { slug: 'lost-connections', title: 'Lost Connections', author: 'Johann Hari', year: 2018,
    pillar: ['mental-health'], variantTriggers: ['SLC6A4_variant', 'BDNF_ValVal'],
    plainReason: 'Examines the research on what actually causes depression and anxiety beyond brain chemistry — covering social, environmental, and psychological factors alongside neurobiological ones. Relevant for anyone exploring SLC6A4, BDNF, and FKBP5 research in the context of mental health.',
    honestyNote: null,
    searchQueries: ['SLC6A4 stress sensitivity research', 'BDNF depression lifestyle intervention studies', 'social environment mental health genomics'],
    universalRecommendation: false },
  { slug: 'the-inflamed-mind', title: 'The Inflamed Mind', author: 'Edward Bullmore', year: 2018,
    pillar: ['mental-health', 'wellness'], variantTriggers: ['IL6_CG', 'NOD2_compound'],
    plainReason: 'A Cambridge psychiatrist makes the case that inflammation is a key driver of depression — a mechanism connecting IL-6, TNF-alpha, and gut barrier research to mental health. Directly relevant to NOD2, IL-6 CG, and the gut-brain inflammation axis.',
    honestyNote: null,
    searchQueries: ['IL-6 depression inflammation research', 'neuroinflammation mental health studies', 'gut brain inflammation axis research'],
    universalRecommendation: false },
  { slug: 'flow', title: 'Flow', author: 'Mihaly Csikszentmihalyi', year: 1990,
    pillar: ['mental-health', 'performance'], variantTriggers: ['COMT_ValVal'],
    plainReason: 'The original research on optimal experience and peak performance states. Directly relevant to what COMT ValVal actually creates when conditions are right — the neurological state of full engagement under appropriate challenge. A framework for designing life and training around the Warrior genotype.',
    honestyNote: null,
    searchQueries: ['COMT optimal performance state research', 'flow state dopamine neuroscience', 'cognitive performance challenge arousal studies'],
    universalRecommendation: false },
  { slug: 'why-zebras-dont-get-ulcers', title: "Why Zebras Don't Get Ulcers", author: 'Robert Sapolsky', year: 2004,
    pillar: ['mental-health', 'wellness'], variantTriggers: ['FKBP5_CT'],
    plainReason: 'The definitive plain-language book on stress physiology. Explains exactly how the HPA axis works, what happens when cortisol does not clear normally, and what the research shows about long-term stress effects. Essential reading for FKBP5 CT carriers whose cortisol recovery is slower than average.',
    honestyNote: null,
    searchQueries: ['FKBP5 HPA axis cortisol research', 'chronic stress cortisol health effects studies', 'stress hormone recovery research'],
    universalRecommendation: false },

  // PILLAR 8 — ENVIRONMENTAL SENSITIVITY
  { slug: 'slow-death-by-rubber-duck', title: 'Slow Death by Rubber Duck', author: 'Rick Smith and Bruce Lourie', year: 2009,
    pillar: ['environment'], variantTriggers: ['NAT2_slow', 'PON1_variant'],
    plainReason: 'Two researchers document exactly how environmental chemicals enter the body and accumulate — using themselves as test subjects. Covers BPA, phthalates, organophosphates, and other compounds relevant to NAT2 slow acetylator and PON1 genetic research on chemical sensitivity.',
    honestyNote: null,
    searchQueries: ['NAT2 slow acetylator environmental chemical research', 'PON1 organophosphate sensitivity studies', 'environmental toxin accumulation genomics research'],
    universalRecommendation: false },
  { slug: 'the-dose-makes-the-poison', title: 'The Dose Makes the Poison', author: 'Patricia Frank and M. Alice Ottoboni', year: 2011,
    pillar: ['environment'], variantTriggers: ['NAT2_slow', 'GSTP1_AG'],
    plainReason: 'A toxicologist explains how to accurately interpret environmental risk — cutting through both industry denial and environmental overclaiming. Relevant for anyone researching NAT2, GSTM1, and chemical sensitivity variants.',
    honestyNote: null,
    searchQueries: ['GSTP1 detoxification genetic variation research', 'NAT2 acetylation toxin processing studies', 'environmental chemical risk assessment research'],
    universalRecommendation: false },
  { slug: 'toxin-toxout', title: 'Toxin Toxout', author: 'Rick Smith and Bruce Lourie', year: 2013,
    pillar: ['environment'], variantTriggers: ['GSTP1_AG', 'NAT2_slow'],
    plainReason: 'Covers evidence-based detoxification strategies, what actually works versus what is marketing, and how different people process environmental exposures differently. Directly relevant to GSTP1, NAT2, and NQO1 research on individual detoxification capacity.',
    honestyNote: null,
    searchQueries: ['GSTM1 detoxification capacity research', 'NQO1 oxidative stress genetic studies', 'glutathione pathway environmental health research'],
    universalRecommendation: false },

  // PILLAR 9 — HORMONES AND ENDOCRINE HEALTH
  { slug: 'testosterone-a-mans-guide', title: "Testosterone: A Man's Guide", author: 'Nelson Vergel', year: 2011,
    pillar: ['hormones'], variantTriggers: ['AR_AG', 'LEPR_AG'],
    plainReason: 'Practical, research-based guide to testosterone optimization — covering the HPA axis, SHBG, free testosterone, and the lifestyle and clinical factors that influence the androgen system. Relevant to AR, LEPR, and testosterone pathway research.',
    honestyNote: null,
    searchQueries: ['androgen receptor testosterone research', 'SHBG testosterone optimization studies', 'testosterone HPA axis research'],
    universalRecommendation: false },
  { slug: 'the-hormone-cure', title: 'The Hormone Cure', author: 'Sara Gottfried', year: 2013,
    pillar: ['hormones'], variantTriggers: ['ESR1_variant', 'TSHR_variant', 'LEPR_AG'],
    plainReason: 'Covers the full endocrine system with a focus on evidence-based lifestyle approaches to hormonal balance — testosterone, estrogen, cortisol, thyroid, and insulin. Relevant to ESR1, TSHR, LEPR, and CYP17A1 research.',
    honestyNote: null,
    searchQueries: ['ESR1 estrogen receptor research', 'TSHR thyroid hormone research', 'hormonal balance lifestyle intervention studies'],
    universalRecommendation: false },
  { slug: 'why-still-thyroid-symptoms', title: 'Why Do I Still Have Thyroid Symptoms?', author: 'Datis Kharrazian', year: 2010,
    pillar: ['hormones'], variantTriggers: ['TSHR_variant'],
    plainReason: 'The most practical guide to thyroid function beyond TSH — covering the genetics of thyroid hormone conversion, autoimmune thyroid conditions, and why standard thyroid tests often miss the full picture. Relevant to TSHR and THRA research.',
    honestyNote: null,
    searchQueries: ['TSHR thyroid function genetic research', 'thyroid hormone conversion studies', 'autoimmune thyroid genetic risk research'],
    universalRecommendation: false },
  { slug: 'the-cortisol-connection', title: 'The Cortisol Connection', author: 'Shawn Talbott', year: 2007,
    pillar: ['hormones', 'wellness'], variantTriggers: ['FKBP5_CT'],
    plainReason: 'Covers adaptogen research including ashwagandha, rhodiola, and phosphatidylserine in the context of HPA axis support. More practical and supplement-focused than the physiology books — relevant to cortisol management strategies for FKBP5 CT carriers.',
    honestyNote: null,
    searchQueries: ['FKBP5 adaptogen cortisol research', 'ashwagandha HPA axis studies', 'phosphatidylserine cortisol research'],
    universalRecommendation: false },
]

/**
 * Given a variant results object (rsID -> genotype), return the books whose
 * variantTriggers match. Universal recommendations are always considered.
 *
 * Sort order: variant-specific matches first (up to 5), then universals (up to 3).
 * Max total returned: 8.
 *
 * @param {Record<string,string>} variantResults
 * @returns {Book[]}
 */
export function getBooksForVariants(variantResults = {}) {
  const v = variantResults || {}
  const triggered = new Set()
  const matched = []

  BOOKS.forEach((book) => {
    if (book.universalRecommendation) {
      if (!triggered.has(book.slug)) { triggered.add(book.slug); matched.push(book) }
      return
    }
    const should = book.variantTriggers.some((trigger) => {
      switch (trigger) {
        case 'MTHFR_compound_het': return v.rs1801133 === 'AG' && v.rs1801131 === 'GT'
        case 'COMT_ValVal':        return v.rs4680 === 'GG'
        case 'FKBP5_CT':           return v.rs1360780 === 'CT'
        case 'ACTN3_XX':           return v.rs1815739 === 'TT'
        case 'PPARA_GG':           return v.rs4253778 === 'GG'
        case 'FOXO3_TT':           return v.rs2802292 === 'TT'
        case 'SIRT1_TT':           return v.rs12778366 === 'TT'
        case 'OBFC1_AA':           return v.rs9420907 === 'AA'
        case 'TERT_CT':            return v.rs10069690 === 'CT'
        case 'NOD2_compound':      return v.rs2066842 === 'CT' || v.rs2076756 === 'AG'
        case 'FUT2_secretor':      return v.rs601338 === 'AG' || v.rs601338 === 'GG'
        case 'MTNR1B_GG':          return v.rs10830963 === 'GG'
        case 'CLOCK_AG':           return v.rs1801260 === 'AG'
        case 'FADS1_TT':           return v.rs174547 === 'TT'
        case 'BDNF_ValVal':        return v.rs6265 === 'CC'
        case 'SLC6A4_variant':     return v.rs25531 !== undefined
        case 'IL6_CG':             return v.rs1800795 === 'CG'
        case 'GSTP1_AG':           return v.rs1695 === 'AG'
        case 'NAT2_slow':          return v.rs1799930 === 'AG' && v.rs1041983 === 'CT'
        case 'PON1_variant':       return v.rs662 === 'CT'
        case 'AR_AG':              return v.rs1799941 === 'AG'
        case 'LEPR_AG':            return v.rs1137101 === 'AG'
        case 'ESR1_variant':       return v.rs9340799 === 'AG'
        case 'TSHR_variant':       return v.rs2268458 !== undefined
        case 'MAOA_variant':       return v.rs6323 !== undefined
        case 'CYP2D6_normal':      return v.rs28371706 === 'GG'
        case 'CYP2C19_normal':     return v.rs4244285 === 'GG'
        default: return false
      }
    })
    if (should && !triggered.has(book.slug)) { triggered.add(book.slug); matched.push(book) }
  })

  const universal = matched.filter((b) => b.universalRecommendation)
  const specific = matched.filter((b) => !b.universalRecommendation)
  return [...specific.slice(0, 5), ...universal.slice(0, 3)]
}

/** Fetch an Open Library cover ID by title+author. Client-side, with sessionStorage cache. */
export async function fetchOpenLibraryCover(title, author) {
  if (typeof window === 'undefined') return null
  const key = `ss:olc:${title}|${author}`
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) return cached === 'null' ? null : cached
  } catch { /* storage disabled */ }
  try {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`
    const res = await fetch(url)
    if (!res.ok) throw new Error('ol')
    const data = await res.json()
    const coverId = data?.docs?.[0]?.cover_i
    const imgUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null
    try { sessionStorage.setItem(key, imgUrl || 'null') } catch { /* noop */ }
    return imgUrl
  } catch {
    try { sessionStorage.setItem(key, 'null') } catch { /* noop */ }
    return null
  }
}
