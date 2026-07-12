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
 * @property {string}   synopsis   - What the book contains (2–4 sentences).
 * @property {string}   knownFor   - Its cultural / scientific impact (1–2 sentences).
 * @property {string}   plainReason - Why it's on our reading list.
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
  youth: 'Youth Wellness',
}

/** All 10 filter pillars in display order (matches homepage). */
export const PILLARS_ORDERED = [
  'genomics', 'nutrition', 'performance', 'longevity', 'wellness',
  'pharmacogenomics', 'mental-health', 'environment', 'hormones', 'youth',
]

/** @type {Book[]} */
export const BOOKS = [
  // PILLAR 1 — GENOMICS
  { slug: 'the-language-of-life', title: 'The Language of Life', author: 'Francis S. Collins', year: 2010,
    pillar: ['genomics'], variantTriggers: ['universal'],
    synopsis: 'Francis Collins walks the reader through the basics of human genetics — genes, variants, inheritance — using real patient stories to illustrate how genomic information influences health, from cancer risk to pharmacogenomics to rare disease diagnosis. Along the way he explains what direct-to-consumer testing can and cannot tell you, and how to interpret probability rather than certainty.',
    knownFor: 'Written by the director of the Human Genome Project (and later of the NIH), this remains the definitive plain-English primer on personal genomics — trusted by clinicians, teachers, and journalists alike as the entry point to the field.',
    plainReason: 'The former director of the Human Genome Project explains what your DNA actually tells you and what it does not. The most credible plain-language introduction to personal genomics available — written for a general audience without overselling what genetics can predict.',
    honestyNote: null,
    searchQueries: ['personal genomics consumer DNA research', 'DNA health prediction accuracy studies', 'genome sequencing clinical applications research'],
    universalRecommendation: true },
  { slug: 'the-genome-factor', title: 'The Genome Factor', author: 'Dalton Conley and Jason Fletcher', year: 2017,
    pillar: ['genomics'], variantTriggers: ['universal'],
    // Open Library cover_i search doesn't always resolve this Princeton
    // University Press title reliably — supply an explicit ISBN cover URL
    // as a hard override so the reading-list card always renders art.
    isbn: '9780691168753',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780691168753-L.jpg',
    synopsis: 'Conley (a sociologist) and Fletcher (a health economist) explain how modern genome-wide association studies (GWAS) and polygenic scores actually work, and what they mean for individuals vs. populations. The book covers heritability, gene-environment interaction, and the ethical implications of using genetic information for education, insurance, and policy.',
    knownFor: 'One of the first rigorous popular accounts of the polygenic-score era — widely cited in social-science genomics debates and used in graduate courses on the sociology of genetics.',
    plainReason: 'Two social scientists with genomics expertise give an honest, rigorous account of what polygenic scores and genetic associations actually mean for individuals versus populations. Essential reading for anyone who wants to understand the real limits of genetic prediction.',
    honestyNote: null,
    searchQueries: ['polygenic risk score accuracy research', 'gene environment interaction studies', 'genetic determinism limitations research'],
    universalRecommendation: true },
  { slug: 'a-crack-in-creation', title: 'A Crack in Creation', author: 'Jennifer Doudna', year: 2017,
    pillar: ['genomics'], variantTriggers: ['universal'],
    synopsis: 'Doudna tells the inside story of the discovery of CRISPR-Cas9 — the bacterial immune system that became a precise gene-editing tool — and its rapid transition from lab curiosity to a technology being tested in human clinical trials. She frames the science alongside the ethical questions raised by heritable germline edits.',
    knownFor: "Written by the 2020 Nobel Prize laureate for the co-discovery of CRISPR — the defining insider account of a technology that reshaped modern biology and biomedicine.",
    plainReason: 'The co-inventor of CRISPR explains how gene editing works and what it means for medicine and humanity. Provides essential context for where genomics is heading and why understanding your current genome matters now.',
    honestyNote: null,
    searchQueries: ['CRISPR gene editing applications research', 'genomic medicine future research', 'genetic variation disease research'],
    universalRecommendation: false },
  { slug: 'dirty-genes', title: 'Dirty Genes', author: 'Ben Lynch', year: 2018,
    pillar: ['genomics', 'nutrition', 'youth'], variantTriggers: ['MTHFR_compound_het'],
    synopsis: 'Lynch, a naturopathic doctor, focuses on seven "dirty" genes — MTHFR, COMT, MAOA, GST/GPX, DAO, PEMT, and NOS3 — and how nutrient status, sleep, and stress load can influence how well they function. The book gives specific dietary and supplement strategies (folate forms, B-vitamin cofactors, methylation donors) aimed at people whose enzymes run at reduced efficiency.',
    knownFor: "One of the most popular consumer books on methylation and 'nutrigenomic' variant support — often the first exposure many readers have to MTHFR outside a clinical setting.",
    plainReason: 'The most accessible book specifically on MTHFR and the methylation cycle. Covers folate forms, homocysteine, and the B vitamin cofactors your body needs when the MTHFR enzyme runs at reduced efficiency.',
    honestyNote: 'Some claims in this book are ahead of the peer-reviewed evidence. The SelfScience reliability scoring system reflects where the research is strong and where it is still preliminary.',
    searchQueries: ['MTHFR methylation support research', 'methylfolate vs folic acid studies', 'homocysteine B vitamin intervention research'],
    universalRecommendation: false },

  // PILLAR 2 — NUTRITION
  { slug: 'the-circadian-code', title: 'The Circadian Code', author: 'Satchin Panda', year: 2019,
    pillar: ['nutrition', 'wellness'], variantTriggers: ['MTNR1B_GG'],
    synopsis: "Panda summarizes two decades of research from his Salk Institute lab on how nearly every organ has a circadian clock — and how eating in an 8–12 hour daily window (time-restricted eating) aligns metabolism with those clocks. The book covers meal timing, light exposure, exercise timing, and how shift work and late-night eating drive metabolic dysfunction.",
    knownFor: "The book that popularized 'time-restricted eating' as a distinct concept from intermittent fasting, and Panda's lab remains one of the most-cited sources on circadian metabolism worldwide.",
    plainReason: "Dr. Panda leads one of the world's top labs on time-restricted eating and circadian biology. His research on meal timing and metabolic health maps directly to what peer-reviewed studies have found for MTNR1B GG carriers — making when you eat as important as what you eat.",
    honestyNote: null,
    searchQueries: ['MTNR1B meal timing glucose research', 'time restricted eating circadian biology', 'melatonin insulin secretion studies'],
    universalRecommendation: false },
  { slug: 'genius-foods', title: 'Genius Foods', author: 'Max Lugavere', year: 2018,
    pillar: ['nutrition', 'mental-health'], variantTriggers: ['FADS1_TT', 'MTHFR_compound_het'],
    synopsis: "Lugavere reviews the evidence linking specific nutrients — long-chain omega-3s (EPA/DHA), B-vitamins, fat-soluble vitamins, polyphenols — to cognitive performance and neurodegenerative risk. Personal story woven throughout: his mother's early-onset dementia drove the research. Practical food lists translate the studies into daily choices.",
    knownFor: "A New York Times bestseller that helped mainstream the 'food-as-brain-health' conversation and made Lugavere one of the most-followed lay voices in nutritional neuroscience.",
    plainReason: 'Covers the research on how specific nutrients — omega-3s, B vitamins, fat-soluble vitamins — affect brain and metabolic function. Directly relevant to FADS1 and BCMO1 variant research on nutrient conversion efficiency.',
    honestyNote: null,
    searchQueries: ['FADS1 omega-3 brain health research', 'dietary fat cognitive function studies', 'nutrient brain function genomics research'],
    universalRecommendation: false },
  { slug: 'low-carb-performance', title: 'The Art and Science of Low Carbohydrate Performance', author: 'Jeff Volek and Stephen Phinney', year: 2012,
    pillar: ['nutrition', 'performance'], variantTriggers: ['PPARA_GG'],
    synopsis: 'Volek and Phinney lay out the physiology of fat adaptation — how a well-formulated ketogenic diet shifts substrate use during aerobic effort — and translate their lab data into training protocols for endurance athletes. Covers electrolytes, protein targets, and how to individualize the transition period.',
    knownFor: 'The book (together with its companion "Living") that turned "nutritional ketosis" from a niche clinical tool into a serious topic in sports-nutrition research.',
    plainReason: 'Volek and Phinney are the leading researchers on fat adaptation in athletes. Essential reading for PPARA GG individuals — this genotype is associated with stronger fat-burning efficiency during aerobic effort, making the research in this book directly applicable.',
    honestyNote: null,
    searchQueries: ['PPARA fat oxidation ketogenic diet research', 'fat adapted athlete performance studies', 'low carbohydrate endurance research'],
    universalRecommendation: false },
  { slug: 'the-better-brain', title: 'The Better Brain', author: 'Bonnie Kaplan and Julia Rucklidge', year: 2021,
    pillar: ['nutrition', 'mental-health', 'youth'], variantTriggers: ['MTHFR_compound_het'],
    synopsis: 'Two research psychologists summarize decades of randomized trials on broad-spectrum micronutrient formulas for mood disorders, ADHD, and post-disaster psychological resilience. The book also covers the mechanistic link between folate/B12 status, methylation, and neurotransmitter synthesis.',
    knownFor: 'Draws on some of the largest randomized micronutrient trials in psychiatry (from Rucklidge\'s New Zealand group) — the most rigorous popular treatment of nutrition-based mental-health interventions.',
    plainReason: 'Two researchers present the evidence for micronutrient support — including methylated B vitamins — in mental health. Directly relevant to MTHFR compound het and the connection between folate processing and neurotransmitter synthesis.',
    honestyNote: null,
    searchQueries: ['micronutrient mental health research', 'B vitamin mood regulation studies', 'methylation neurotransmitter research'],
    universalRecommendation: false },

  // PILLAR 3 — SPORTS PERFORMANCE
  { slug: 'endure', title: 'Endure', author: 'Alex Hutchinson', year: 2018,
    pillar: ['performance'], variantTriggers: ['ACTN3_XX'],
    synopsis: 'Hutchinson (a physicist and elite runner turned science journalist) surveys the modern research on the true limits of human endurance — VO₂max, lactate threshold, running economy, heat, hydration, oxygen, and the central-governor "mind" model of fatigue. Each chapter pairs a landmark study with an elite athlete\'s story.',
    knownFor: 'Endorsed by Malcolm Gladwell as a "brilliant" tour of exercise science — widely used as an entry point to the physiology of endurance sport.',
    plainReason: 'The science of human endurance — what actually limits performance and how athletes push those limits. Covers VO2max, lactate threshold, heat adaptation, and psychological factors. Directly relevant to the ACTN3 XX endurance genotype and aerobic performance research.',
    honestyNote: null,
    searchQueries: ['ACTN3 XX endurance performance research', 'VO2max genetic variation studies', 'aerobic capacity training adaptation research'],
    universalRecommendation: false },
  { slug: 'the-brave-athlete', title: 'The Brave Athlete', author: 'Simon Marshall and Lesley Paterson', year: 2017,
    pillar: ['performance', 'mental-health'], variantTriggers: ['COMT_ValVal'],
    synopsis: 'Marshall (a sport psychologist) and Paterson (a world-champion triathlete) walk through 13 psychological problems endurance athletes actually face — self-doubt, pre-race anxiety, motivation crashes, mid-race negative self-talk — and give evidence-based cognitive-behavioural tools for each one.',
    knownFor: 'Considered one of the most practical sport-psychology books of the last decade — used by coaches at every level from age-group to Ironman champions.',
    plainReason: 'Sports psychology meets physiology. Covers the mental architecture of athletic performance — how to train the brain alongside the body. Particularly relevant for COMT ValVal athletes who perform differently under competition pressure versus low-stakes training.',
    honestyNote: null,
    searchQueries: ['COMT Val158Met athletic performance research', 'sports psychology performance pressure studies', 'dopamine competition stress research'],
    universalRecommendation: false },
  { slug: 'the-sports-gene', title: 'The Sports Gene', author: 'David Epstein', year: 2013,
    pillar: ['performance', 'genomics'], variantTriggers: ['ACTN3_XX', 'PPARA_GG'],
    synopsis: 'Epstein investigates what genetics really contributes to elite athletic performance — from ACTN3 and ACE variants to the anatomical peculiarities of Kenyan distance runners and the outlier trainability of certain individuals. He argues for a "hardware + software" model rather than the popular 10,000-hour narrative.',
    knownFor: 'A ProPublica journalist\'s National Magazine Award-winning investigation — the most balanced popular book on the sport-genetics debate and a common reading assignment in exercise-science programs.',
    plainReason: 'A thorough, honest exploration of how genetics shapes athletic potential. Covers ACTN3, ACE, and the broader science of nature versus nurture in sport. More balanced and rigorous than most popular genetics books — acknowledges both real genetic influences and their limits.',
    honestyNote: null,
    searchQueries: ['ACTN3 elite athlete genetic research', 'sports genetics performance studies', 'athletic potential gene environment interaction'],
    universalRecommendation: false },
  { slug: 'the-comfort-crisis', title: 'The Comfort Crisis', author: 'Michael Easter', year: 2021,
    pillar: ['performance', 'wellness'], variantTriggers: ['ACTN3_XX'],
    synopsis: 'Easter combines a 33-day backcountry Alaska hunt with a survey of the research on physical hardship — rucking, cold exposure, sustained caloric deficit, boredom, silence — and the neurological and metabolic adaptations that follow. Each chapter pairs an experience with the physiology behind it.',
    knownFor: 'Credited with popularizing "rucking" (weighted walking) as a mainstream training modality and cited widely by military special-operations coaches.',
    plainReason: 'Explores rucking, sustained physical effort, and the physiological and psychological benefits of endurance challenges. Directly aligned with the ACTN3 XX athletic profile. Covers the research on why sustained effort produces adaptation both physically and psychologically.',
    honestyNote: null,
    searchQueries: ['rucking cardiovascular research', 'sustained aerobic effort health outcomes', 'endurance exercise adaptation studies'],
    universalRecommendation: false },

  // PILLAR 4 — LONGEVITY
  { slug: 'outlive', title: 'Outlive', author: 'Peter Attia', year: 2023,
    pillar: ['longevity'], variantTriggers: ['FOXO3_TT', 'universal'],
    synopsis: 'Attia frames longevity around the "Four Horsemen" — atherosclerotic cardiovascular disease, cancer, neurodegenerative disease, and type-2 diabetes / metabolic disease — and lays out an exercise, nutrition, sleep, and emotional-health protocol aimed at delaying each. Includes deep dives on ApoB, Zone 2 training, VO₂max targets, and the "Centenarian Decathlon" framework.',
    knownFor: '#1 New York Times bestseller and the most-referenced modern longevity book — Attia\'s podcast (The Drive) is the highest-listened health-science podcast in its category.',
    plainReason: 'The most comprehensive evidence-grounded longevity framework currently in print. Covers the primary causes of early death, and how exercise, nutrition, sleep, and emotional health address each one. Relevant to FOXO3, SIRT1, OBFC1, and cardiovascular genetics research.',
    honestyNote: null,
    searchQueries: ['FOXO3 longevity lifestyle intervention research', 'Zone 2 exercise longevity studies', 'healthspan lifespan cardiovascular research'],
    universalRecommendation: true },
  { slug: 'lifespan', title: 'Lifespan', author: 'David Sinclair', year: 2019,
    pillar: ['longevity'], variantTriggers: ['SIRT1_TT', 'FOXO3_TT'],
    synopsis: 'Sinclair (a Harvard geneticist) presents the "Information Theory of Aging" — that aging is driven by loss of epigenetic information — and reviews the interventions his lab has studied: sirtuin activators (resveratrol, NMN), rapamycin, senolytics, caloric restriction, and cold/heat exposure. Ends with a forecast of where the field is heading.',
    knownFor: 'The book that made "NAD+" and "sirtuins" household words in the biohacking community and drew both major popular attention and academic pushback to the geroscience field.',
    plainReason: "Sinclair's information theory of aging covers sirtuins, NAD+, mTOR, and the epigenetic clock. Directly relevant to SIRT1 TT and FOXO3 TT pathway research — explaining the biological mechanisms these variants affect and the interventions being studied.",
    honestyNote: "Some of Sinclair's forward-looking claims are ahead of current human evidence. The SelfScience reliability scoring reflects where the research is strong and where it is still preliminary.",
    searchQueries: ['SIRT1 resveratrol human trial research', 'NMN NAD+ longevity studies', 'sirtuin pathway aging research'],
    universalRecommendation: false },
  { slug: 'the-telomere-effect', title: 'The Telomere Effect', author: 'Elizabeth Blackburn and Elissa Epel', year: 2017,
    pillar: ['longevity'], variantTriggers: ['OBFC1_AA', 'TERT_CT'],
    synopsis: 'Blackburn (a Nobel laureate) and Epel (a health psychologist) explain what telomeres are, how they shorten with cellular division and stress, and which lifestyle factors — meditation, exercise, sleep, diet, social connection — have measurable effects on telomerase activity and telomere length in randomized trials.',
    knownFor: 'Blackburn shared the 2009 Nobel Prize in Physiology or Medicine for the discovery of telomerase — this book is the authoritative popular treatment of the topic by the person who put it on the biomedical map.',
    plainReason: 'Written by the Nobel Prize winner who discovered telomerase. Covers how telomere length connects to biological aging and what lifestyle factors the research shows protect telomere integrity. Essential reading for OBFC1 AA and TERT variant carriers.',
    honestyNote: null,
    searchQueries: ['telomere length lifestyle research', 'OBFC1 telomere maintenance studies', 'telomerase activation exercise research'],
    universalRecommendation: false },
  { slug: 'the-longevity-paradox', title: 'The Longevity Paradox', author: 'Steven Gundry', year: 2019,
    pillar: ['longevity', 'wellness'], variantTriggers: ['NOD2_compound'],
    synopsis: 'Gundry (a cardiothoracic surgeon turned nutrition author) argues that gut microbiome composition is the primary lever for healthspan and lifespan, and prescribes a lectin-restricted diet plus prebiotic and polyphenol strategies aimed at supporting gut immune function and reducing systemic inflammation.',
    knownFor: 'A bestseller that popularized the "lectin-free" concept and remains one of the most-searched books at the intersection of gut health and aging.',
    plainReason: 'Covers the gut-longevity connection with a focus on microbiome diversity and dietary fiber. The gut-longevity axis discussion is relevant to NOD2 and FUT2 research on how gut immune function affects systemic health over time.',
    honestyNote: "Some of Gundry's specific claims about lectins are not well-supported in peer-reviewed literature. The SelfScience reliability layer applies — use the search tool to verify specific claims from this book.",
    searchQueries: ['gut microbiome longevity research', 'microbiome diversity aging studies', 'intestinal health systemic inflammation research'],
    universalRecommendation: false },

  // PILLAR 5 — GENERAL WELLNESS
  { slug: 'why-we-sleep', title: 'Why We Sleep', author: 'Matthew Walker', year: 2017,
    pillar: ['wellness'], variantTriggers: ['MTNR1B_GG', 'CLOCK_AG'],
    synopsis: 'Walker (a Berkeley neuroscientist) reviews the evidence connecting sleep to memory consolidation, immune function, metabolic health, mood regulation, and cardiovascular risk. Covers sleep stages (REM/NREM), circadian rhythms, caffeine and alcohol effects on sleep architecture, and practical hygiene recommendations.',
    knownFor: 'One of the most influential health-science bestsellers of the past decade — cited by policymakers, corporate wellness programs, and elite sports teams as the reference on sleep\'s importance.',
    plainReason: 'The most comprehensive book on sleep science for a general audience. Covers circadian biology, sleep stages, and how sleep affects metabolic health, immune function, and cognition. Relevant to MTNR1B GG, CLOCK, and PER3 variant research.',
    honestyNote: 'Several specific claims in this book have been contested in peer-reviewed literature. The SelfScience reliability scoring tool will flag which findings are well-supported and which are disputed when you search the underlying research.',
    searchQueries: ['sleep quality metabolic health research', 'MTNR1B circadian rhythm studies', 'sleep deprivation glucose regulation research'],
    universalRecommendation: false },
  { slug: 'the-stress-code', title: 'The Stress Code', author: 'Richard Sutton', year: 2018,
    pillar: ['wellness', 'mental-health'], variantTriggers: ['FKBP5_CT'],
    synopsis: 'Sutton (a South African physiotherapist and stress-medicine physician) breaks the HPA axis and stress response into practical components — cortisol curves, sleep, breathing, exercise dose, cold exposure, adaptogenic support — and gives a graded protocol for restoring healthy stress recovery.',
    knownFor: 'A widely-adopted reference in the corporate-wellness and performance-coaching worlds, especially in Commonwealth countries where Sutton has advised professional sports organisations.',
    plainReason: 'Evidence-based guide to understanding and managing the HPA axis stress response. Directly relevant to FKBP5 CT cortisol dysregulation research — covering practical strategies that the research supports for people whose stress hormone system takes longer to recover.',
    honestyNote: null,
    searchQueries: ['FKBP5 cortisol recovery research', 'HPA axis regulation lifestyle studies', 'stress resilience adaptogen research'],
    universalRecommendation: false },
  { slug: 'gut', title: 'Gut', author: 'Giulia Enders', year: 2015,
    pillar: ['wellness'], variantTriggers: ['NOD2_compound'],
    synopsis: 'Enders (a young gastroenterologist) explains — with unusual warmth and humor — the anatomy and physiology of the digestive tract, the gut-brain axis, the microbiome, and common conditions like reflux, IBS, and food intolerance. Illustrated by her sister; approachable enough for teens, rigorous enough for clinicians.',
    knownFor: 'A global phenomenon translated into 40+ languages that sold over five million copies — the book most often credited with bringing gut biology into everyday conversation.',
    plainReason: 'The most accessible plain-language introduction to gut biology and the microbiome. Written by a gastroenterologist for a general audience. Essential foundation for understanding NOD2, FUT2, and gut barrier research.',
    honestyNote: null,
    searchQueries: ['NOD2 gut barrier research', 'intestinal microbiome immune function studies', 'gut permeability nutrition research'],
    universalRecommendation: false },
  { slug: 'the-good-gut', title: 'The Good Gut', author: 'Justin Sonnenburg and Erica Sonnenburg', year: 2015,
    pillar: ['wellness'], variantTriggers: ['NOD2_compound', 'FUT2_secretor'],
    synopsis: "The Sonnenburgs (both Stanford microbiologists) synthesize their lab's work on how dietary fiber diversity shapes the microbial ecosystem — including Bifidobacterium abundance — and how modern lifestyles have depleted microbiome richness across generations. Practical family-focused chapters translate the research into meals.",
    knownFor: 'Written by the co-directors of the Stanford Center for Human Microbiome Studies — one of the top microbiome research groups in the world.',
    plainReason: 'The Sonnenburgs run the leading microbiome lab at Stanford. Their work on fiber diversity and Bifidobacterium is directly relevant to FUT2 secretor status and NOD2 gut immune research — covering which dietary strategies the evidence supports for microbiome health.',
    honestyNote: null,
    searchQueries: ['microbiome diversity dietary fiber research', 'FUT2 secretor Bifidobacterium studies', 'gut microbiome NOD2 research'],
    universalRecommendation: false },
  { slug: 'brain-maker', title: 'Brain Maker', author: 'David Perlmutter', year: 2015,
    pillar: ['wellness', 'mental-health'], variantTriggers: ['NOD2_compound', 'FUT2_secretor'],
    synopsis: 'Perlmutter (a neurologist) surveys the emerging research on the gut-brain axis — vagal signaling, microbial metabolites, intestinal permeability, and inflammatory cytokines — and proposes dietary and probiotic strategies aimed at supporting cognitive and mood health.',
    knownFor: 'A #1 New York Times bestseller and one of the highest-profile popular books to bring the gut-brain axis to a mainstream audience.',
    plainReason: 'Covers the gut-brain axis and the research on microbiome composition and neurological health. Relevant to NOD2, FUT2, and the connection between gut inflammation and brain function.',
    honestyNote: 'Some claims in this book are ahead of peer-reviewed evidence. Use the SelfScience search tool to verify specific claims from this book against the research.',
    searchQueries: ['gut brain axis research', 'microbiome neurological health studies', 'intestinal inflammation cognition research'],
    universalRecommendation: false },

  // PILLAR 6 — PHARMACOGENOMICS
  { slug: 'the-right-medicine', title: 'The Right Medicine', author: 'Howard McLeod', year: 2021,
    pillar: ['pharmacogenomics'], variantTriggers: ['CYP2D6_normal', 'NAT2_slow'],
    synopsis: 'McLeod, one of the founding figures of clinical pharmacogenomics, explains — in plain language — how CYP2D6, CYP2C19, TPMT, DPYD, and other drug-metabolism genes shape response to common medications, from antidepressants to codeine to chemotherapy. Real patient cases illustrate every concept.',
    knownFor: 'McLeod chaired the Clinical Pharmacogenetics Implementation Consortium (CPIC) and helped write the guidelines that hospitals now use to interpret PGx tests — this is the field explained by one of its architects.',
    plainReason: "One of the world's leading pharmacogenomics researchers explains how your genes affect drug response in practical terms — covering CYP enzymes, why the same medication dose works differently in different people, and where personalized medicine is heading.",
    honestyNote: null,
    searchQueries: ['CYP2D6 medication response pharmacogenomics', 'drug metabolism genetic variation research', 'personalized medicine genomics studies'],
    universalRecommendation: false },
  { slug: 'medicating-normal', title: 'Medicating Normal', author: 'Various contributors', year: 2021,
    pillar: ['pharmacogenomics', 'mental-health'], variantTriggers: ['CYP2C19_normal'],
    synopsis: 'A companion volume to the documentary of the same name — clinicians, researchers, and patients discuss the pharmacology of psychiatric medications (SSRIs, benzodiazepines, stimulants), how variability in CYP metabolism explains uneven clinical response, and the discontinuation-syndrome literature.',
    knownFor: 'Released alongside a documentary screened at PBS-affiliated stations and university-of-medicine ethics courses — a key resource in patient-centered psychopharmacology conversations.',
    plainReason: 'Covers the broader context of psychiatric medication — how drugs are approved, why responses vary between individuals, and what the research actually shows about long-term use. Relevant for anyone researching CYP2D6, CYP2C19, and psychiatric medication response genetics.',
    honestyNote: null,
    searchQueries: ['CYP2C19 antidepressant metabolism research', 'psychiatric medication response genetic variation', 'pharmacogenomics mental health studies'],
    universalRecommendation: false },
  { slug: 'the-antidepressant-solution', title: 'The Antidepressant Solution', author: 'Joseph Glenmullen', year: 2006,
    pillar: ['pharmacogenomics', 'mental-health'], variantTriggers: ['SLC6A4_variant', 'CYP2D6_normal'],
    synopsis: 'Glenmullen (a Harvard clinical psychiatrist) provides a practical, step-by-step protocol for tapering SSRIs and SNRIs — differentiating true relapse from discontinuation syndrome, matching taper speed to half-life, and managing withdrawal side effects. Backed by case series and the FDA adverse-event database.',
    knownFor: "One of the earliest mainstream books to catalogue SSRI discontinuation syndrome and to give patients a concrete tapering framework — still widely referenced by prescribers.",
    plainReason: "A Harvard psychiatrist's practical guide to tapering and discontinuing antidepressants. Written before pharmacogenomics was widely accessible but remains the most practical clinical reference for medication discontinuation — relevant alongside CYP2D6 and SLC6A4 research.",
    honestyNote: 'Published in 2006 — some specific recommendations predate current pharmacogenomics research. Read alongside more recent literature using the SelfScience search tool.',
    searchQueries: ['SSRI discontinuation research', 'antidepressant tapering clinical studies', 'SLC6A4 serotonin transporter medication response'],
    universalRecommendation: false },

  // PILLAR 7 — MENTAL HEALTH AND NEUROCHEMISTRY
  { slug: 'behave', title: 'Behave', author: 'Robert Sapolsky', year: 2017,
    pillar: ['mental-health'], variantTriggers: ['COMT_ValVal', 'FKBP5_CT', 'MAOA_variant'],
    synopsis: "Sapolsky (a Stanford neurobiologist) walks backwards from a single human behavior — one second before, one minute, one hour, days, months, years, generations, evolution — showing how hormones, neurotransmitters, brain structure, genes (COMT, MAOA, DRD2, 5-HTT), childhood environment, culture, and evolutionary pressures all contribute to what we do.",
    knownFor: 'Winner of numerous "best science book of the year" awards and considered the modern reference on the biology of human behavior — Sapolsky\'s Stanford lecture series based on this material has millions of views.',
    plainReason: 'The most comprehensive plain-language breakdown of how biology — including genetics, hormones, and neurotransmitters — shapes human behavior. Covers dopamine, serotonin, stress systems, and decision-making with full scientific rigor. Essential reading for COMT, MAOA, FKBP5, and DRD2 research.',
    honestyNote: null,
    searchQueries: ['COMT dopamine behavior neuroscience research', 'stress hormones behavior studies', 'neurotransmitter genetic variation research'],
    universalRecommendation: false },
  { slug: 'the-molecule-of-more', title: 'The Molecule of More', author: 'Daniel Z. Lieberman and Michael E. Long', year: 2018,
    pillar: ['mental-health'], variantTriggers: ['COMT_ValVal'],
    synopsis: 'Lieberman (a psychiatrist) and Long (a screenwriter) argue that dopamine — historically framed simply as "the pleasure molecule" — is really the neurotransmitter of anticipation, desire, and future-orientation. They separate the "future" dopamine circuit from "present" neurochemistry and show how the balance shapes love, addiction, creativity, ambition, and politics.',
    knownFor: 'One of the most-cited popular neuroscience books of the past decade — reshaped how the general reader understands dopamine beyond the "reward chemical" cliché.',
    plainReason: 'Explores how dopamine drives motivation, ambition, creativity, and reward-seeking. Directly relevant to COMT ValVal neurobiology — explains why the Warrior genotype seeks challenge and novelty and how to design your life and training around that rather than against it.',
    honestyNote: null,
    searchQueries: ['COMT Val158Met dopamine motivation research', 'dopamine reward seeking neuroscience studies', 'prefrontal cortex dopamine performance research'],
    universalRecommendation: false },
  { slug: 'lost-connections', title: 'Lost Connections', author: 'Johann Hari', year: 2018,
    pillar: ['mental-health'], variantTriggers: ['SLC6A4_variant', 'BDNF_ValVal'],
    synopsis: 'Hari (a journalist) travels to interview researchers around the world about what causes depression and anxiety beyond brain chemistry — social disconnection, meaningful work, values, childhood trauma, financial insecurity, contact with nature — and reviews the interventions the evidence supports for each cause.',
    knownFor: 'A New York Times and Sunday Times bestseller endorsed by Hillary Clinton, Elton John, and Naomi Klein — one of the most-discussed popular books on depression of the past decade.',
    plainReason: 'Examines the research on what actually causes depression and anxiety beyond brain chemistry — covering social, environmental, and psychological factors alongside neurobiological ones. Relevant for anyone exploring SLC6A4, BDNF, and FKBP5 research in the context of mental health.',
    honestyNote: null,
    searchQueries: ['SLC6A4 stress sensitivity research', 'BDNF depression lifestyle intervention studies', 'social environment mental health genomics'],
    universalRecommendation: false },
  { slug: 'the-inflamed-mind', title: 'The Inflamed Mind', author: 'Edward Bullmore', year: 2018,
    pillar: ['mental-health', 'wellness'], variantTriggers: ['IL6_CG', 'NOD2_compound'],
    synopsis: 'Bullmore, a Cambridge psychiatrist, makes the case that a subset of depression is driven by chronic low-grade inflammation — reviewing the IL-6, TNF-α, and CRP evidence, the response to anti-inflammatory drugs, and the gut/dental/rheumatologic conditions that connect immune activation to mood.',
    knownFor: "A finalist for the Royal Society Science Book Prize — one of the most important popular treatments of the 'immuno-psychiatry' movement.",
    plainReason: 'A Cambridge psychiatrist makes the case that inflammation is a key driver of depression — a mechanism connecting IL-6, TNF-alpha, and gut barrier research to mental health. Directly relevant to NOD2, IL-6 CG, and the gut-brain inflammation axis.',
    honestyNote: null,
    searchQueries: ['IL-6 depression inflammation research', 'neuroinflammation mental health studies', 'gut brain inflammation axis research'],
    universalRecommendation: false },
  { slug: 'flow', title: 'Flow', author: 'Mihaly Csikszentmihalyi', year: 1990,
    pillar: ['mental-health', 'performance'], variantTriggers: ['COMT_ValVal'],
    synopsis: 'Csikszentmihalyi (a University of Chicago psychologist) describes the state of "flow" — full engagement in an activity where challenge and skill are perfectly matched — based on interviews with thousands of subjects from artists to surgeons to rock climbers. He lays out the eight conditions that reliably produce the state.',
    knownFor: 'The foundational text of positive psychology and the source of the word "flow" as we now use it in coaching, education, and performance science.',
    plainReason: 'The original research on optimal experience and peak performance states. Directly relevant to what COMT ValVal actually creates when conditions are right — the neurological state of full engagement under appropriate challenge. A framework for designing life and training around the Warrior genotype.',
    honestyNote: null,
    searchQueries: ['COMT optimal performance state research', 'flow state dopamine neuroscience', 'cognitive performance challenge arousal studies'],
    universalRecommendation: false },
  { slug: 'why-zebras-dont-get-ulcers', title: "Why Zebras Don't Get Ulcers", author: 'Robert Sapolsky', year: 2004,
    pillar: ['mental-health', 'wellness'], variantTriggers: ['FKBP5_CT'],
    synopsis: 'Sapolsky explains — with the same conversational rigor as Behave — how the HPA axis evolved for acute, short-lived threats (like being chased by a lion) and what happens when we run it chronically for social and psychological threats. Covers cortisol, cardiovascular, digestive, immune, reproductive, and mood consequences of chronic stress.',
    knownFor: 'The standard popular reference on stress physiology — used as a course text in dozens of undergraduate and medical school programs since first publication.',
    plainReason: 'The definitive plain-language book on stress physiology. Explains exactly how the HPA axis works, what happens when cortisol does not clear normally, and what the research shows about long-term stress effects. Essential reading for FKBP5 CT carriers whose cortisol recovery is slower than average.',
    honestyNote: null,
    searchQueries: ['FKBP5 HPA axis cortisol research', 'chronic stress cortisol health effects studies', 'stress hormone recovery research'],
    universalRecommendation: false },

  // PILLAR 8 — ENVIRONMENTAL SENSITIVITY
  { slug: 'slow-death-by-rubber-duck', title: 'Slow Death by Rubber Duck', author: 'Rick Smith and Bruce Lourie', year: 2009,
    pillar: ['environment'], variantTriggers: ['NAT2_slow', 'PON1_variant'],
    synopsis: 'Two Canadian environmental researchers use themselves as human test subjects — deliberately exposing themselves to everyday products containing BPA, phthalates, organophosphates, PFCs, mercury, and flame retardants — and measure the resulting blood and urine biomarker changes over days.',
    knownFor: "A #1 Canadian bestseller and one of the most-cited popular books in the 'body burden' environmental-health literature.",
    plainReason: 'Two researchers document exactly how environmental chemicals enter the body and accumulate — using themselves as test subjects. Covers BPA, phthalates, organophosphates, and other compounds relevant to NAT2 slow acetylator and PON1 genetic research on chemical sensitivity.',
    honestyNote: null,
    searchQueries: ['NAT2 slow acetylator environmental chemical research', 'PON1 organophosphate sensitivity studies', 'environmental toxin accumulation genomics research'],
    universalRecommendation: false },
  { slug: 'the-dose-makes-the-poison', title: 'The Dose Makes the Poison', author: 'Patricia Frank and M. Alice Ottoboni', year: 2011,
    pillar: ['environment'], variantTriggers: ['NAT2_slow', 'GSTP1_AG'],
    synopsis: 'Frank and Ottoboni (both toxicologists) explain the core concepts of dose-response, threshold effects, endocrine disruptors, cumulative exposure, and how regulatory agencies actually derive safety limits (LOAEL, NOAEL, reference dose). Designed for the non-scientist who wants to reason clearly about chemical risk.',
    knownFor: 'A standard reference in undergraduate environmental-health curricula and one of the most-used lay introductions to toxicology.',
    plainReason: 'A toxicologist explains how to accurately interpret environmental risk — cutting through both industry denial and environmental overclaiming. Relevant for anyone researching NAT2, GSTM1, and chemical sensitivity variants.',
    honestyNote: null,
    searchQueries: ['GSTP1 detoxification genetic variation research', 'NAT2 acetylation toxin processing studies', 'environmental chemical risk assessment research'],
    universalRecommendation: false },
  { slug: 'toxin-toxout', title: 'Toxin Toxout', author: 'Rick Smith and Bruce Lourie', year: 2013,
    pillar: ['environment'], variantTriggers: ['GSTP1_AG', 'NAT2_slow'],
    synopsis: "The follow-up to Slow Death by Rubber Duck — Smith and Lourie test the popular 'detox' industry (juice cleanses, saunas, chelation, organic-only diets, hair analysis) against biomarker data, showing which strategies actually reduce measured chemical body burden and which don't.",
    knownFor: 'A follow-up bestseller that sharpened the popular conversation about which detoxification interventions are supported by measurement and which are marketing.',
    plainReason: 'Covers evidence-based detoxification strategies, what actually works versus what is marketing, and how different people process environmental exposures differently. Directly relevant to GSTP1, NAT2, and NQO1 research on individual detoxification capacity.',
    honestyNote: null,
    searchQueries: ['GSTM1 detoxification capacity research', 'NQO1 oxidative stress genetic studies', 'glutathione pathway environmental health research'],
    universalRecommendation: false },

  // PILLAR 9 — HORMONES AND ENDOCRINE HEALTH
  { slug: 'testosterone-a-mans-guide', title: "Testosterone: A Man's Guide", author: 'Nelson Vergel', year: 2011,
    pillar: ['hormones'], variantTriggers: ['AR_AG', 'LEPR_AG'],
    synopsis: 'Vergel synthesizes the endocrinology of the male HPG axis — free vs. total testosterone, SHBG, estradiol, DHT, aromatase — with practical clinical strategies: lifestyle levers (sleep, resistance training, body composition), testing schedules, TRT protocols, and side-effect management.',
    knownFor: "One of the most-referenced patient-facing books on testosterone optimization — Vergel is a long-time patient advocate whose material has been vetted by leading urologists in the field.",
    plainReason: 'Practical, research-based guide to testosterone optimization — covering the HPA axis, SHBG, free testosterone, and the lifestyle and clinical factors that influence the androgen system. Relevant to AR, LEPR, and testosterone pathway research.',
    honestyNote: null,
    searchQueries: ['androgen receptor testosterone research', 'SHBG testosterone optimization studies', 'testosterone HPA axis research'],
    universalRecommendation: false },
  { slug: 'the-hormone-cure', title: 'The Hormone Cure', author: 'Sara Gottfried', year: 2013,
    pillar: ['hormones'], variantTriggers: ['ESR1_variant', 'TSHR_variant', 'LEPR_AG'],
    synopsis: 'Gottfried (a Harvard-trained OB/GYN) walks through the full endocrine system — cortisol, estrogen, progesterone, testosterone, thyroid, insulin, leptin — pairing each with symptom checklists, lifestyle protocols, targeted micronutrient and botanical support, and a decision tree for when to escalate to prescription treatment.',
    knownFor: 'A New York Times bestseller and one of the most-recommended patient-facing books on women\'s hormonal health from an integrative-medicine perspective.',
    plainReason: 'Covers the full endocrine system with a focus on evidence-based lifestyle approaches to hormonal balance — testosterone, estrogen, cortisol, thyroid, and insulin. Relevant to ESR1, TSHR, LEPR, and CYP17A1 research.',
    honestyNote: null,
    searchQueries: ['ESR1 estrogen receptor research', 'TSHR thyroid hormone research', 'hormonal balance lifestyle intervention studies'],
    universalRecommendation: false },
  { slug: 'why-still-thyroid-symptoms', title: 'Why Do I Still Have Thyroid Symptoms?', author: 'Datis Kharrazian', year: 2010,
    pillar: ['hormones'], variantTriggers: ['TSHR_variant'],
    synopsis: 'Kharrazian argues that most persistent hypothyroid symptoms in patients "on therapy" reflect non-thyroid pathology — Hashimoto\'s autoimmunity, poor T4→T3 conversion, reverse-T3 dominance, adrenal cortisol imbalance, or gut inflammation — and walks through the labs and interventions for each pattern.',
    knownFor: 'A cult reference among functional-medicine clinicians and patients — considered the standard "second-opinion" text on thyroid symptoms unresolved by standard TSH-based care.',
    plainReason: 'The most practical guide to thyroid function beyond TSH — covering the genetics of thyroid hormone conversion, autoimmune thyroid conditions, and why standard thyroid tests often miss the full picture. Relevant to TSHR and THRA research.',
    honestyNote: null,
    searchQueries: ['TSHR thyroid function genetic research', 'thyroid hormone conversion studies', 'autoimmune thyroid genetic risk research'],
    universalRecommendation: false },
  { slug: 'the-cortisol-connection', title: 'The Cortisol Connection', author: 'Shawn Talbott', year: 2007,
    pillar: ['hormones', 'wellness'], variantTriggers: ['FKBP5_CT'],
    synopsis: 'Talbott (a sports-nutrition researcher) reviews the human-trial evidence on adaptogenic herbs and stress-support ingredients — ashwagandha, rhodiola, magnolia bark, theanine, phosphatidylserine — with recommended doses and stacking strategies for chronic HPA dysregulation.',
    knownFor: 'One of the earliest popular consumer books focused on cortisol as a target for supplement-based intervention, still cited in stress-management protocols.',
    plainReason: 'Covers adaptogen research including ashwagandha, rhodiola, and phosphatidylserine in the context of HPA axis support. More practical and supplement-focused than the physiology books — relevant to cortisol management strategies for FKBP5 CT carriers.',
    honestyNote: null,
    searchQueries: ['FKBP5 adaptogen cortisol research', 'ashwagandha HPA axis studies', 'phosphatidylserine cortisol research'],
    universalRecommendation: false },

  // PILLAR 10 — YOUTH WELLNESS
  { slug: 'brain-rules-for-baby', title: 'Brain Rules for Baby', author: 'John Medina', year: 2014,
    pillar: ['youth', 'mental-health'], variantTriggers: ['universal'],
    synopsis: 'Molecular biologist John Medina distills the developmental neuroscience of the first five years into twelve concrete "brain rules" for pregnancy, infancy, and early childhood — covering attachment, praise, television, empathy, and moral development. Every rule is tied back to peer-reviewed research on how the developing brain actually wires itself.',
    knownFor: 'The bestseller that turned the "first five years" developmental research into a practical playbook for expecting and new parents.',
    plainReason: 'Neuroscience of the developing brain, translated for parents. The perfect companion to the Youth pillar\u2019s brain-development domain \u2014 covers how gene expression interacts with parenting environment during the plastic years.',
    honestyNote: null,
    searchQueries: ['infant brain development research', 'early childhood neuroscience parenting', 'BDNF learning children research'],
    universalRecommendation: false },
  { slug: 'orchid-and-the-dandelion', title: 'The Orchid and the Dandelion', author: 'W. Thomas Boyce', year: 2019,
    pillar: ['youth', 'mental-health'], variantTriggers: ['SLC6A4_variant'],
    synopsis: 'Pediatrician and researcher Tom Boyce presents four decades of research on differential susceptibility \u2014 the finding that some children ("orchids") are dramatically more sensitive to environment than others ("dandelions"), doing worse in adversity but significantly better in nurturing settings. Covers the biology of stress reactivity, the FKBP5 and 5-HTTLPR variants, and what changes for orchid children in the classroom, at home, and in the pediatrician\'s office.',
    knownFor: 'The definitive popular treatment of the "differential susceptibility" research \u2014 the framework that reshaped how developmental researchers think about gene\u2013environment interaction.',
    plainReason: 'Essential reading for parents of high-sensitivity children. The research at the heart of this book directly parallels the SelfScience finding that the same variant can create risk in a bad environment and exceptional outcomes in a good one.',
    honestyNote: null,
    searchQueries: ['differential susceptibility children Belsky Boyce', 'serotonin transporter children environment research', 'SLC6A4 gene environment interaction research'],
    universalRecommendation: false },
  { slug: 'epigenetics-revolution', title: 'The Epigenetics Revolution', author: 'Nessa Carey', year: 2011,
    pillar: ['youth', 'genomics'], variantTriggers: ['universal'],
    synopsis: 'Biologist Nessa Carey explains how the same DNA sequence can produce dramatically different outcomes depending on which genes are turned on or off \u2014 and how environment, nutrition, stress, and the intrauterine environment write those epigenetic marks. Covers the Dutch Hunger Winter cohort, imprinting, and how experiences in early life leave molecular signatures that persist into adulthood.',
    knownFor: 'One of the first accessible popular books to explain the epigenetics revolution to a general audience \u2014 still one of the clearest treatments of the topic.',
    plainReason: 'Why the early years matter for lifelong gene expression. Explains the biology behind why interventions in childhood have larger downstream effects than the same interventions in adulthood.',
    honestyNote: null,
    searchQueries: ['epigenetics early life exposures research', 'developmental origins health disease children', 'intrauterine environment gene expression'],
    universalRecommendation: false },
  { slug: 'good-inside', title: 'Good Inside', author: 'Dr. Becky Kennedy', year: 2022,
    pillar: ['youth', 'mental-health'], variantTriggers: ['universal'],
    synopsis: 'Clinical psychologist Becky Kennedy translates attachment theory and behavioural neuroscience into a modern parenting framework \u2014 the "most generous interpretation" model, sturdy leadership, and rupture-and-repair. While not explicitly genomic, the science she teaches maps directly onto the stress-hormone and dopamine-processing genes that shape a child\'s response to parental limits and praise.',
    knownFor: 'A New York Times bestseller and one of the most-followed voices in evidence-based parenting today.',
    plainReason: 'The behavioural science aligns with what COMT and FKBP5 research predicts \u2014 sturdy, predictable responses from parents are exactly what the biology of stress-sensitive children needs.',
    honestyNote: 'Not a genomics book. Included because the parenting science it teaches is what the Youth pillar research says these variants actually respond to.',
    searchQueries: ['attachment parenting research children', 'child emotion regulation research', 'stress response parenting children'],
    universalRecommendation: false },
  { slug: 'the-developing-mind', title: 'The Developing Mind', author: 'Daniel J. Siegel', year: 2020,
    pillar: ['youth', 'mental-health'], variantTriggers: ['universal'],
    synopsis: 'Psychiatrist Dan Siegel presents interpersonal neurobiology \u2014 the framework that integrates neuroscience, attachment research, and developmental psychology into a single account of how the mind emerges. Third edition (2020) incorporates the last decade of research on brain networks, memory consolidation, and social cognition in childhood.',
    knownFor: 'A foundational text in developmental neurobiology, cited across pediatrics, psychology, and education. Siegel\'s work informs much of the modern "trauma-informed" and attachment-based parenting research.',
    plainReason: 'The definitive developmental neurobiology text for parents and clinicians. Explains why the environment a child\'s brain grows in shapes what that brain becomes \u2014 the biological argument behind the Youth pillar\'s "early advantage" mission.',
    honestyNote: null,
    searchQueries: ['developmental neurobiology children research', 'attachment brain development research', 'interpersonal neurobiology Siegel'],
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
