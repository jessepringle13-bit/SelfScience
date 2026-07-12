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
    pillar: ['nutrition', 'wellness', 'youth'], variantTriggers: ['MTNR1B_GG'],
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
    pillar: ['wellness', 'youth'], variantTriggers: ['NOD2_compound'],
    synopsis: 'Enders (a young gastroenterologist) explains — with unusual warmth and humor — the anatomy and physiology of the digestive tract, the gut-brain axis, the microbiome, and common conditions like reflux, IBS, and food intolerance. Illustrated by her sister; approachable enough for teens, rigorous enough for clinicians.',
    knownFor: 'A global phenomenon translated into 40+ languages that sold over five million copies — the book most often credited with bringing gut biology into everyday conversation.',
    plainReason: 'The most accessible plain-language introduction to gut biology and the microbiome. Written by a gastroenterologist for a general audience. Essential foundation for understanding NOD2, FUT2, and gut barrier research.',
    honestyNote: null,
    searchQueries: ['NOD2 gut barrier research', 'intestinal microbiome immune function studies', 'gut permeability nutrition research'],
    universalRecommendation: false },
  { slug: 'the-good-gut', title: 'The Good Gut', author: 'Justin Sonnenburg and Erica Sonnenburg', year: 2015,
    pillar: ['wellness', 'youth'], variantTriggers: ['NOD2_compound', 'FUT2_secretor'],
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

  // ============================================================
  // 2026 EXPANSION \u2014 ENVIRONMENT / METABOLIC / BRAIN / HORMONES / YOUTH
  // Every entry below carries an honest `evidenceQuality` tag and, where
  // appropriate, an `honestyNote` visible to users on the card. Two special
  // entries (`type: 'coming_soon'`, `type: 'featured_resource'`) are handled
  // by the reading-list-client with distinct card treatments.
  // ============================================================

  // ---------- ENVIRONMENT / MICROPLASTICS / ENDOCRINE DISRUPTORS ----------
  { slug: 'count-down', title: 'Count Down', subtitle: 'How Our Modern World Is Threatening Sperm Counts, Altering Male and Female Reproductive Development, and Imperiling the Future of the Human Race', author: 'Shanna H. Swan, PhD with Stacy Colino', year: 2021, isbn: '9781982113667',
    pillar: ['environment', 'hormones', 'youth'], variantTriggers: ['universal'], evidenceQuality: 'strong',
    synopsis: 'Swan, a reproductive epidemiologist at Mount Sinai, synthesizes decades of research showing endocrine-disrupting chemicals \u2014 phthalates, BPA, and related plasticizers \u2014 are driving measurable declines in sperm count, testosterone, and reproductive development worldwide. The most credentialed and evidence-grounded book on phthalates and microplastics in print.',
    knownFor: 'The book that brought reproductive endocrine disruption from the primary literature into mainstream awareness.',
    plainReason: 'Directly relevant to MTNR1B, AR, ESR1, and SHBG variants \u2014 endocrine disruptors operate through the same receptor pathways your genomic variants influence. Understanding the environmental load on your hormonal system is inseparable from understanding your genomic profile.',
    honestyNote: "Some projections about the timeline of reproductive decline are extrapolations beyond what the underlying data directly supports \u2014 the core endocrine-disruption research is solid; the 'count down to zero' framing is more speculative.",
    searchQueries: ['phthalates endocrine disruption reproductive health'],
    universalRecommendation: false },
  { slug: 'our-stolen-future', title: 'Our Stolen Future', subtitle: 'Are We Threatening Our Fertility, Intelligence, and Survival?', author: 'Theo Colborn, Dianne Dumanoski, and John Peterson Myers', year: 1996,
    pillar: ['environment', 'hormones', 'youth'], variantTriggers: ['universal'], evidenceQuality: 'strong',
    synopsis: "The book that introduced the concept of endocrine disruption to a general audience in 1996 \u2014 written by the researcher who coined the term. Colborn's synthesis of wildlife and human epidemiology established the field of endocrine-disruption science, which Shanna Swan's Count Down later built upon. A foundational text that is still more relevant than ever.",
    knownFor: 'The founding text of endocrine disruption as a scientific field.',
    plainReason: 'The environmental context for every hormonal and environmental sensitivity variant in your genomic profile. Understanding that your GSTP1, NRF2, and EPHX1 variants interact with a chemical environment your grandparents never faced.',
    honestyNote: 'Published in 1996 \u2014 some specific data is outdated. Read alongside Count Down for current numbers.',
    searchQueries: ['endocrine disruptors environmental chemicals reproductive health'],
    universalRecommendation: false },
  { slug: 'exposure-bilott', title: 'Exposure', subtitle: "Poisoned Water, Corporate Greed, and One Lawyer's Twenty-Year Battle Against DuPont", author: 'Robert Bilott', year: 2019, isbn: '9781501172823',
    pillar: ['environment'], variantTriggers: ['universal'], evidenceQuality: 'strong',
    synopsis: "The attorney who took on DuPont tells the story of how PFAS 'forever chemicals' contaminated the water supply of an entire community \u2014 and how the company knew and concealed it for decades. The legal case that ultimately revealed PFAS is now detectable in virtually every human on the planet. Basis for the film Dark Waters.",
    knownFor: 'The definitive account of the PFAS scandal and the litigation that put "forever chemicals" on the public radar.',
    plainReason: "PFAS are found in non-stick cookware, food packaging, water, and soil. They are endocrine disruptors that interact with the same receptor pathways affected by your hormonal variants. This book explains how they got into everyone's body and what the evidence shows about their effects.",
    honestyNote: 'Investigative legal nonfiction rather than a health-protocol book. The PFAS toxicity science it documents has since been extensively validated.',
    searchQueries: ['PFAS forever chemicals health effects endocrine disruption'],
    universalRecommendation: false },

  // ---------- SUGAR / METABOLIC / CHILDREN'S NUTRITION ----------
  { slug: 'fat-chance', title: 'Fat Chance', subtitle: 'Beating the Odds Against Sugar, Processed Food, Obesity, and Disease', author: 'Robert H. Lustig, MD', year: 2012, isbn: '9781594631009',
    pillar: ['nutrition', 'youth'], variantTriggers: ['TCF7L2_TT', 'MTNR1B_GG'], evidenceQuality: 'strong',
    synopsis: "Lustig, a pediatric endocrinologist at UCSF, argues that fructose drives insulin resistance and metabolic disease independent of calorie count \u2014 making sugar a metabolic toxin at population-level doses, particularly for children. Built on his viral 'Sugar: The Bitter Truth' lecture and years of clinical research in pediatric obesity.",
    knownFor: "The book that translated Lustig's viral 'Sugar: The Bitter Truth' lecture into a full clinical case against added fructose.",
    plainReason: 'Directly relevant to TCF7L2 TT, MTNR1B GG, KCNJ11, and LEPR variants \u2014 all of which affect glucose metabolism. Lustig explains the mechanisms behind why these variants create elevated metabolic risk in an environment saturated with added sugar.',
    honestyNote: "The 'fructose is uniquely toxic' thesis is well-supported but contested by some nutrition scientists who argue total caloric intake and food matrix matter as much as fructose per se.",
    searchQueries: ['fructose insulin resistance pediatric obesity Lustig'],
    universalRecommendation: false },
  { slug: 'metabolical', title: 'Metabolical', subtitle: 'The Lure and the Lies of Processed Food, Nutrition, and Modern Medicine', author: 'Robert H. Lustig, MD', year: 2021, isbn: '9780063027718',
    pillar: ['nutrition', 'longevity'], variantTriggers: ['TCF7L2_TT', 'MTNR1B_GG'], evidenceQuality: 'mixed',
    synopsis: 'Lustig identifies eight biochemical pathologies underlying most chronic disease and argues processed food \u2014 not genetics or willpower \u2014 is the primary driver. A broader, more systemic argument than Fat Chance \u2014 connecting food policy, corporate influence, and healthcare economics to the metabolic disease epidemic.',
    knownFor: "Lustig's systems-level follow-up to Fat Chance, expanding the argument from sugar to the entire ultra-processed food environment.",
    plainReason: 'The processed food environment is the primary modifier of your metabolic variants. Understanding how ultra-processed food creates the conditions in which your TCF7L2, MTNR1B, and PPARG variants express their highest-risk phenotype.',
    honestyNote: "The 'eight pathologies' framework is compelling but oversimplifies a more heterogeneous disease landscape. Core nutritional biochemistry is solid.",
    searchQueries: ['processed food metabolic disease chronic illness'],
    universalRecommendation: false },

  // ---------- BRAIN / MENTAL HEALTH ----------
  { slug: 'brain-energy', title: 'Brain Energy', subtitle: 'A Revolutionary Breakthrough in Understanding Mental Health', author: 'Christopher M. Palmer, MD', year: 2022, isbn: '9781637741580',
    pillar: ['mental-health', 'longevity', 'pharmacogenomics'], variantTriggers: ['MTHFR_compound_het', 'COMT_ValVal', 'BDNF_Met'], evidenceQuality: 'mixed',
    synopsis: 'A Harvard psychiatrist proposes that mental disorders are fundamentally metabolic disorders of the brain \u2014 driven by mitochondrial dysfunction \u2014 and argues metabolic interventions (diet, especially ketogenic approaches, exercise) should be part of psychiatric treatment. One of the most important paradigm-shifting books in mental health research of the last decade.',
    knownFor: 'One of the most talked-about paradigm shifts in psychiatry in the last decade: the mitochondrial hypothesis of mental illness.',
    plainReason: 'MTHFR, COMT, BDNF, FKBP5, and the serotonin transporter variants all affect neurotransmitter production \u2014 a process that is downstream of mitochondrial energy production. Palmer\'s framework connects your genomic neurochemistry variants to the energy systems that power them.',
    honestyNote: "The 'unified metabolic theory of mental illness' is a genuinely novel hypothesis not yet broadly validated. Palmer is credentialed and the mitochondrial research is real \u2014 but the scope of the claim (all mental illness = metabolic disorder) is ahead of the evidence.",
    searchQueries: ['mitochondria mental health ketogenic diet psychiatry'],
    universalRecommendation: false },
  { slug: 'unshrunk', title: 'Unshrunk', subtitle: 'A Story of Psychiatric Treatment Resistance', author: 'Laura Delano', year: 2025, isbn: '9781984880482',
    pillar: ['mental-health', 'pharmacogenomics'], variantTriggers: ['CYP2D6_slow', 'CYP2C19_variant'], evidenceQuality: 'mixed',
    synopsis: 'A memoir of 14 years inside the American psychiatric system \u2014 multiple diagnoses, cascading medications beginning in her teens, and an eventual decision to taper off all psychiatric drugs. Raises legitimate, evidence-supported concerns about diagnostic overreach and polypharmacy in psychiatry, while documenting what psychiatric drug withdrawal actually looks like.',
    knownFor: 'One of the most-discussed memoirs in the growing conversation about psychiatric overdiagnosis and polypharmacy.',
    plainReason: "CYP2D6 and CYP2C19 variants directly affect how psychiatric medications are metabolized. Delano's experience of adverse effects and difficult discontinuation is, for many patients, a pharmacogenomic story \u2014 the wrong drug, wrong dose, or difficult taper driven by metabolizer status never checked.",
    honestyNote: 'A memoir, not a clinical text. Raises real and important concerns about psychiatric overdiagnosis and polypharmacy \u2014 but it should not be read as advice to discontinue psychiatric medication. That decision requires physician supervision. Reviewers have noted the risk of generalizing one difficult personal experience into broad anti-psychiatry conclusions.',
    searchQueries: ['psychiatric medication withdrawal discontinuation pharmacogenomics'],
    universalRecommendation: false },
  { slug: 'genius-foods', title: 'Genius Foods', subtitle: 'Become Smarter, Happier, and More Productive While Protecting Your Brain for Life', author: 'Max Lugavere with Paul Grewal, MD', year: 2018,
    pillar: ['nutrition', 'mental-health', 'longevity'], variantTriggers: ['APOE_e4', 'BDNF_Met'], evidenceQuality: 'mixed',
    synopsis: "Prompted by his mother's early-onset dementia, Lugavere synthesizes neuroscience and nutrition research to argue that specific dietary choices protect long-term brain health and cognitive performance. One of the most accessible and thoroughly cited popular books on the diet-brain connection.",
    knownFor: 'One of the best-known popular books on the diet\u2013brain connection.',
    plainReason: 'APOE e3/e3 status, BDNF Val66Met, FOXO3, and SIRT1 variants all affect long-term brain health trajectories. Genius Foods provides the dietary context for optimizing these pathways through food.',
    honestyNote: 'Well-researched and heavily cited. Lugavere is a journalist, not a scientist \u2014 some recommendations extrapolate from observational or preliminary data.',
    searchQueries: ["nutrition brain health Alzheimer's prevention diet"],
    universalRecommendation: false },
  { slug: 'the-genius-life', title: 'The Genius Life', subtitle: 'Heal Your Mind, Strengthen Your Body, and Become Extraordinary', author: 'Max Lugavere', year: 2020,
    pillar: ['nutrition', 'mental-health', 'longevity', 'performance'], variantTriggers: ['BDNF_Met', 'PPARGC1A_GlyGly', 'FKBP5_CT'], evidenceQuality: 'mixed',
    synopsis: 'The follow-up to Genius Foods, expanding to sleep, movement, light exposure, and stress \u2014 arguing these lifestyle levers work synergistically with diet to support brain and metabolic health. The most complete single-volume lifestyle optimization guide in the Lugavere trilogy.',
    knownFor: "Lugavere's expansion of the diet\u2013brain framework into a full lifestyle protocol.",
    plainReason: 'Covers BDNF, PPARGC1A, FKBP5, and circadian variants in a practical lifestyle context.',
    honestyNote: 'Same profile as Genius Foods \u2014 well-sourced and accessible but popularizing rather than generating primary research.',
    searchQueries: ['lifestyle optimization brain health sleep light movement'],
    universalRecommendation: false },
  { slug: 'good-energy', title: 'Good Energy', subtitle: 'The Surprising Connection Between Metabolism and Limitless Health', author: 'Casey Means, MD with Calley Means', year: 2024, isbn: '9780593712641',
    pillar: ['nutrition', 'longevity', 'hormones'], variantTriggers: ['TCF7L2_TT', 'MTNR1B_GG'], evidenceQuality: 'mixed',
    synopsis: 'A Stanford-trained physician argues that metabolic dysfunction is the root cause of most modern chronic disease, and that continuous glucose monitoring plus dietary changes can reverse it before it becomes diagnosed disease. One of the most influential metabolic health books of the 2020s.',
    knownFor: 'One of the most-shared metabolic-health books of the 2020s and a driver of the CGM-for-non-diabetics movement.',
    plainReason: "TCF7L2 TT, MTNR1B GG, HbA1c trajectory, and insulin sensitivity variants are exactly the genetic context that makes Casey Means' metabolic framework personal rather than generic.",
    honestyNote: 'The unifying metabolic root-cause theory is a stronger claim than current evidence fully supports. Some specific assertions have been contested by clinicians in detailed critical reviews. The core metabolic health framework is sound and valuable.',
    searchQueries: ['metabolic health insulin resistance chronic disease prevention'],
    universalRecommendation: false },

  // ---------- LONGEVITY / HORMONES ----------
  { slug: 'protocols-huberman', title: 'Protocols', subtitle: 'An Operating Manual for the Human Body', author: 'Andrew D. Huberman, PhD', year: 2025, isbn: '9781668032145',
    pillar: ['longevity', 'performance', 'mental-health', 'wellness'], variantTriggers: ['MTNR1B_GG', 'BDNF_Met', 'FKBP5_CT'], evidenceQuality: 'mixed',
    synopsis: 'Stanford neuroscientist and Huberman Lab host distills years of podcast protocols into one reference book covering sleep, light exposure, exercise, stress, and focus \u2014 framed as an evidence-based operating manual for optimizing physiology through neuroscience-grounded daily practices.',
    knownFor: 'The book form of the most-listened-to health-science podcast in the world.',
    plainReason: 'CLOCK, MTNR1B, BDNF, FKBP5, and PPARGC1A variants all respond to the specific daily inputs Huberman covers \u2014 light timing, exercise, cold exposure, breathing. The protocols are particularly relevant when layered on genomic context.',
    honestyNote: 'Many core recommendations are well-supported (light exposure and circadian rhythm, sleep hygiene). Some specific protocols translate mechanistic lab findings into consumer recommendations that outpace direct clinical trial evidence. Huberman has faced scrutiny about overstating certainty of some podcast claims.',
    searchQueries: ['neuroscience protocols sleep light exercise performance'],
    universalRecommendation: false },
  { slug: 'young-forever', title: 'Young Forever', subtitle: 'The Secrets to Living Your Longest, Healthiest Life', author: 'Mark Hyman, MD', year: 2023,
    pillar: ['longevity', 'nutrition'], variantTriggers: ['FOXO3_variant', 'SIRT1_variant'], evidenceQuality: 'mixed',
    synopsis: 'Hyman applies longevity science \u2014 autophagy, senescent cells, epigenetic aging clocks \u2014 to a practical program of diet, fasting, exercise, and supplementation, framing aging itself as a treatable condition.',
    knownFor: "Hyman's most comprehensive longevity synthesis.",
    plainReason: 'FOXO3, SIRT1, KLOTHO, TERT, and OBFC1 variants are the genomic context for longevity science. Hyman translates the lab science into actionable lifestyle protocols.',
    honestyNote: 'Many recommended interventions (NAD+ precursors, specific supplement stacks) cite legitimate longevity biology but extrapolate to protocols ahead of large randomized human trials. The longevity science is real; the specific supplement prescriptions are ahead of the evidence.',
    searchQueries: ['longevity science autophagy epigenetic aging NAD'],
    universalRecommendation: false },
  { slug: 'roar-sims', title: 'ROAR', subtitle: 'How to Match Your Food and Fitness to Your Unique Female Physiology', author: 'Stacy T. Sims, PhD with Selene Yeager', year: 2016, isbn: '9780593581926',
    pillar: ['performance', 'hormones', 'nutrition'], variantTriggers: ['ESR1_variant', 'CYP19A1_variant'], evidenceQuality: 'strong',
    synopsis: 'Sims, an exercise physiologist with a career researching sex differences in sports science, argues that most sports and nutrition science is derived from male physiology and therefore fails active women. The book details how the menstrual cycle should reshape training periodization, fueling, and recovery strategies.',
    knownFor: 'The book that launched the modern conversation about training female athletes as women rather than "small men."',
    plainReason: 'ESR1, ESR2, CYP19A1, SHBG, and AR variants all affect how female hormones influence athletic performance and recovery. ROAR provides the practical training framework for the hormonal context your genome describes.',
    honestyNote: 'Strong research base \u2014 Sims holds a PhD in exercise physiology specifically focused on sex differences in sports science. Some cycle-based training recommendations are still evolving in the research literature.',
    searchQueries: ['female physiology training menstrual cycle sports performance'],
    universalRecommendation: false },
  { slug: 'next-level-sims', title: 'Next Level', subtitle: 'Your Guide to Kicking Ass, Feeling Great, and Crushing Goals Through Menopause and Beyond', author: 'Stacy T. Sims, PhD with Selene Yeager', year: 2022, isbn: '9780593233153',
    pillar: ['hormones', 'performance', 'longevity'], variantTriggers: ['ESR1_variant', 'CYP19A1_variant', 'DIO2_TT'], evidenceQuality: 'strong',
    synopsis: 'The companion to ROAR focused specifically on perimenopause and menopause \u2014 providing a physiology-based guide to training, nutrition, and hormone changes for active women navigating this life stage. One of the few books in this space grounded in actual exercise physiology research on menopausal athletes.',
    knownFor: 'One of the few evidence-grounded books on training and nutrition specifically for perimenopausal and menopausal athletes.',
    plainReason: 'CYP19A1, ESR1, SHBG, DIO2, and COMT variants all influence the perimenopausal and menopausal transition differently. Next Level provides the training and nutrition framework that responds to the hormonal shifts these variants shape.',
    honestyNote: 'Minimal controversy. Strong academic grounding addressing a historically under-researched population.',
    searchQueries: ['menopause exercise training hormones female physiology'],
    universalRecommendation: false },
  { slug: 'hormone-cure', title: 'The Hormone Cure', subtitle: 'Reclaim Balance, Sleep, Sex Drive, and Vitality Naturally', author: 'Sara Gottfried, MD', year: 2013, isbn: '9781451666946',
    pillar: ['hormones', 'wellness'], variantTriggers: ['ESR1_variant', 'DIO2_TT'], evidenceQuality: 'mixed',
    synopsis: 'A Harvard-trained MD presents a self-assessment and natural treatment framework for common hormone imbalances in women \u2014 covering estrogen, progesterone, thyroid, cortisol, and related symptoms \u2014 emphasizing lifestyle and nutraceutical approaches before pharmaceutical options.',
    knownFor: "Gottfried's introduction of functional-medicine hormone frameworks to a wide audience.",
    plainReason: 'ESR1, ESR2, CYP17A1, TSHR, DIO2, LEPR, and SHBG variants all affect the hormone balance Gottfried covers. Her framework provides a lifestyle and nutritional context for interpreting these findings.',
    honestyNote: 'Core endocrinology is accurate. Many specific herbal/supplement protocol recommendations extend beyond what is directly validated in clinical trials. Functional-medicine framing is not universally endorsed by mainstream endocrinology.',
    searchQueries: ['hormone balance women estrogen cortisol thyroid natural'],
    universalRecommendation: false },
  { slug: 'hashimotos-protocol', title: "Hashimoto's Protocol", subtitle: 'A 90-Day Plan for Reversing Thyroid Symptoms and Getting Your Life Back', author: 'Izabella Wentz, PharmD', year: 2017, isbn: '9780062571298',
    pillar: ['hormones'], variantTriggers: ['DIO2_TT'], evidenceQuality: 'mixed',
    synopsis: "A pharmacist who was herself diagnosed with Hashimoto's thyroiditis lays out a structured 90-day root-cause protocol covering diet, gut health, adrenal support, and toxin reduction \u2014 intended to reduce autoimmune thyroid symptoms beyond standard thyroid hormone replacement.",
    knownFor: "One of the most widely read Hashimoto's-specific patient books.",
    plainReason: "TSHR, DIO2, PTPN22, CTLA4, and IL23R variants all affect autoimmune thyroid function. Wentz's root-cause approach addresses the environmental and dietary triggers that interact with these variants.",
    honestyNote: 'Wentz is a pharmacist, not an endocrinologist. Gut\u2013thyroid and diet\u2013autoimmunity connections are active research areas but the specific 90-day protocol has not been validated in randomized controlled trials. Not universally endorsed by mainstream endocrinology.',
    searchQueries: ["Hashimoto's thyroiditis autoimmune diet gut health"],
    universalRecommendation: false },
  { slug: 'eat-to-beat-disease', title: 'Eat to Beat Disease', subtitle: 'The New Science of How Your Body Can Heal Itself', author: 'William W. Li, MD', year: 2019, isbn: '9781538714621',
    pillar: ['nutrition', 'longevity', 'wellness'], variantTriggers: ['universal'], evidenceQuality: 'strong',
    synopsis: 'Li, president of the Angiogenesis Foundation and a respected researcher in that field, argues the body has five defense systems that specific foods activate \u2014 reframing food as medicine around concrete physiological mechanisms rather than generic healthy-eating advice.',
    knownFor: "Li's mainstream translation of angiogenesis research into a food framework.",
    plainReason: 'VEGF variants (angiogenesis), IL-6, TNF-alpha, and immune signaling variants all interact with the food inputs Li covers. One of the most research-grounded food-as-medicine books available.',
    honestyNote: 'Li is an accomplished angiogenesis researcher. The leap from cellular/mechanistic evidence to human disease prevention recommendations is, as with most nutrition science, harder to prove definitively \u2014 but the research base is stronger than most nutrition books.',
    searchQueries: ['angiogenesis food cancer prevention immune system'],
    universalRecommendation: false },

  // ---------- PRENATAL / POSTNATAL / INFANT ----------
  { slug: 'better-baby-book', title: 'The Better Baby Book', subtitle: 'How to Have a Healthier, Smarter, Happier Baby', author: 'Lana Asprey, MD and Dave Asprey', year: 2013,
    pillar: ['youth', 'genomics', 'nutrition'], variantTriggers: ['MTHFR_compound_het'], evidenceQuality: 'mixed',
    synopsis: "Written after the Aspreys' personal experience with infertility, this book applies an epigenetics framework to preconception and prenatal health \u2014 arguing that parental diet, toxin exposure, and stress before and during pregnancy directly shape offspring gene expression and long-term health outcomes via nutritional epigenomics.",
    knownFor: 'One of the earliest popular books to bring nutritional epigenetics into preconception planning.',
    plainReason: 'MTHFR, BCMO1, FADS1/2, VDR, and choline-pathway variants all have specific preconception and prenatal implications. The nutritional epigenetics research behind this book is real \u2014 maternal folate status, DHA, and choline directly modify fetal gene expression.',
    honestyNote: 'The underlying epigenetics science is well-established. The specific prescriptive protocol extends beyond what is directly validated in human trials. Lana Asprey is an MD; Dave Asprey is not a physician.',
    searchQueries: ['prenatal nutrition epigenetics fetal development genomics'],
    universalRecommendation: false },
  { slug: 'baby-led-weaning', title: 'Baby-Led Weaning', subtitle: 'Helping Your Baby to Love Good Food', author: 'Gill Rapley, PhD and Tracey Murkett', year: 2008, isbn: '9781615195589',
    pillar: ['youth', 'nutrition'], variantTriggers: ['FUT2_secretor'], evidenceQuality: 'mixed',
    synopsis: 'The foundational text establishing the baby-led weaning approach to introducing solid foods \u2014 allowing infants to feed themselves whole foods from the start rather than pur\u00e9es. Has gained substantial mainstream pediatric acceptance since publication.',
    knownFor: 'The book that turned baby-led weaning from fringe practice into mainstream pediatric advice.',
    plainReason: 'Infant food introduction timing and texture exposure affects microbiome diversity development \u2014 particularly relevant for FUT2 non-secretor and NOD2 variant children who benefit most from early diverse food exposure.',
    honestyNote: 'Evidence for some specific nutritional-adequacy claims remains limited. Current pediatric guidance recommends a hybrid approach with iron-rich foods and choking precautions rather than the fully unstructured original version. Mainstream pediatric opinion has moved toward modified baby-led weaning.',
    searchQueries: ['baby-led weaning infant solid food introduction microbiome'],
    universalRecommendation: false },

  // ---------- ENVIRONMENTAL HEALTH / FOOD SYSTEM ----------
  { slug: 'dark-calories', title: 'Dark Calories', subtitle: 'How Vegetable Oils Destroy Our Health and How We Can Get It Back', author: 'Cate Shanahan, MD', year: 2024,
    pillar: ['nutrition', 'environment', 'longevity'], variantTriggers: ['FADS1_reduced'], evidenceQuality: 'mixed',
    synopsis: 'A family physician argues that industrial seed oils \u2014 not sugar or saturated fat \u2014 are the primary hidden driver of modern chronic disease, proposing that oxidative damage from unstable polyunsaturated fats causes cellular and metabolic harm at scale.',
    knownFor: 'One of the most prominent voices in the "seed oils are the problem" nutrition movement.',
    plainReason: "PPARA, PPARG, FADS1/2, and NRF2 variants all interact with dietary fat quality and oxidative stress management \u2014 the core of Shanahan's argument. Even if the strongest claims are contested, the practical recommendations (replacing seed oils with stable fats) align with several genomic variant recommendations.",
    honestyNote: "The 'seed oils as primary driver of all chronic disease' thesis is a minority position actively contested by mainstream lipid science and large randomized trials showing polyunsaturated fats generally improve cardiovascular outcomes vs. saturated fat. Shanahan's broader critique of ultra-processed food is less controversial than her specific seed-oil hypothesis. Read as a perspective, not settled science.",
    searchQueries: ['seed oils linoleic acid oxidative stress metabolic health'],
    universalRecommendation: false },
  { slug: 'food-fix', title: 'Food Fix', subtitle: 'How to Save Our Health, Our Economy, Our Communities, and Our Planet', author: 'Mark Hyman, MD', year: 2020,
    pillar: ['nutrition', 'environment', 'youth'], variantTriggers: ['universal'], evidenceQuality: 'mixed',
    synopsis: 'Hyman connects personal diet choices to systemic issues \u2014 agricultural policy, climate change, and food deserts \u2014 arguing that fixing the food system is simultaneously a health, environmental, and economic intervention. A food-policy manifesto more than a diet plan.',
    knownFor: "Hyman's most policy-oriented book \u2014 an argument for food-system reform, not just individual choice.",
    plainReason: 'The food environment in which your genomic variants express themselves is shaped by policy decisions this book covers. Understanding why the US food system produces the processed food landscape that your metabolic variants respond to.',
    honestyNote: 'Ambitious scope covers broad ground with less depth on individual claims than Hyman\u2019s more focused books. Policy arguments are directionally supported but the book promises more from a single lever than the evidence fully justifies.',
    searchQueries: ['food system policy nutrition public health agriculture'],
    universalRecommendation: false },
  { slug: 'food-wthsie', title: 'Food: What the Heck Should I Eat?', author: 'Mark Hyman, MD', year: 2018,
    pillar: ['nutrition', 'youth'], variantTriggers: ['universal'], evidenceQuality: 'mixed',
    synopsis: 'Hyman cuts through conflicting nutrition advice to argue that ultra-processed food \u2014 not any single macronutrient \u2014 is the primary driver of modern chronic disease, and that whole real food is the most powerful medicine. The most practical and readable of Hyman\u2019s books for someone new to food-as-medicine thinking.',
    knownFor: "Hyman's most accessible entry-point book for readers new to food-as-medicine.",
    plainReason: 'A practical food framework that aligns well with PPARA GG, MTNR1B GG, TCF7L2 TT, and FADS1/2 reduced conversion variants \u2014 all of which benefit from the whole-food, minimally-processed dietary pattern Hyman describes.',
    honestyNote: 'Synthesizes real nutrition science but some functional-medicine framing extends beyond consensus guidelines. Better as a practical starting point than a technical reference.',
    searchQueries: ['whole food diet ultra-processed food chronic disease prevention'],
    universalRecommendation: false },

  // ---------- MICROBIOME (Coming Soon) ----------
  { slug: 'human-zach-bush', title: 'Human', author: 'Zach Bush, MD', year: 2026,
    pillar: ['wellness', 'environment', 'longevity'], variantTriggers: ['FUT2_secretor', 'NOD2_compound'], evidenceQuality: 'mixed', type: 'coming_soon', status: 'Announced \u2014 expected August 2026',
    synopsis: "Bush argues there is fundamentally only 'one disease' \u2014 cellular stress arising from a broken relationship between the human microbiome and the broader ecosystem \u2014 and proposes that healing at the cellular/microbiome level is inseparable from ecological regeneration. Not yet published for independent review.",
    knownFor: "One of the loudest voices linking soil microbiome to human microbiome health \u2014 and one of the most critiqued.",
    plainReason: "NOD2, FUT2, IL23R, and NRF2 variants all sit at the intersection of gut microbiome health and environmental response \u2014 exactly the terrain Bush's framework covers.",
    honestyNote: "Bush is a physician whose claims about glyphosate toxicity go beyond current toxicological consensus. His 'one disease' framework is more speculative than the legitimate underlying microbiome research. Book not yet available for independent review \u2014 assess on publication.",
    searchQueries: ['gut microbiome environmental health glyphosate soil'],
    universalRecommendation: false },

  // ---------- ALZHEIMER'S / BRAIN LONGEVITY ----------
  { slug: 'end-of-alzheimers', title: "The End of Alzheimer's", subtitle: 'The First Program to Prevent and Reverse Cognitive Decline', author: 'Dale E. Bredesen, MD', year: 2017, isbn: '9780735216204',
    pillar: ['longevity', 'mental-health', 'genomics'], variantTriggers: ['APOE_e4'], evidenceQuality: 'mixed',
    synopsis: "A neurologist specializing in neurodegenerative disease proposes that Alzheimer's is not one disease but multiple subtypes driven by different combinations of inflammation, nutrient deficiency, and toxin exposure \u2014 and proposes a personalized multi-factor ReCODE protocol.",
    knownFor: 'The most-cited proponent of the personalized, multi-factor approach to preventing Alzheimer\u2019s.',
    plainReason: "APOE e3/e3 (or e3/e4), FOXO3, BDNF, SIRT1, and inflammatory variant carriers have specific Alzheimer's risk context that Bredesen's framework addresses. The personalized, root-cause approach aligns with genomic thinking even if the specific protocol is contested.",
    honestyNote: "A Lancet Neurology commentary explicitly states 'there is no published study that tests or proves the hypothesis that the Bredesen protocol can prevent and reverse cognitive decline.' The book's subtitle claims go beyond what the underlying case series evidence supports. Read as a framework for thinking about personalized dementia risk \u2014 not as a validated clinical protocol.",
    searchQueries: ["Alzheimer's prevention personalized medicine APOE cognitive decline"],
    universalRecommendation: false },

  // ---------- WOMEN'S MENTAL HEALTH ----------
  { slug: 'mind-of-your-own', title: 'A Mind of Your Own', subtitle: 'The Truth About Depression and How Women Can Heal Their Bodies to Reclaim Their Lives', author: 'Kelly Brogan, MD with Kristin Loberg', year: 2016, isbn: '9780062367301',
    pillar: ['mental-health', 'hormones'], variantTriggers: ['MTHFR_compound_het', 'SLC6A4_variant'], evidenceQuality: 'more_speculative',
    synopsis: 'A psychiatrist trained in psychosomatic medicine argues that depression in women is frequently a misdiagnosed symptom of underlying physiological imbalances \u2014 gut health, thyroid, inflammation, hormones \u2014 rather than a primary brain-chemistry disorder, and proposes a 30-day holistic protocol.',
    knownFor: 'Widely cited in the "root-cause" mental-health conversation \u2014 and widely critiqued.',
    plainReason: 'MTHFR, COMT, FKBP5, SLC6A4, and thyroid variants all affect the physiological roots of mood that Brogan covers. The underlying question \u2014 whether depression is sometimes a downstream symptom of nutritional/metabolic dysfunction \u2014 is legitimate.',
    honestyNote: "This book has the most significant caveats on the reading list. The core argument that physiological factors are underappreciated in depression treatment is supported by some research \u2014 but Brogan's broader stance, including her controversial public positions on vaccines and COVID-19, raises serious credibility concerns beyond the book's content. Do not read as advice to discontinue psychiatric medication \u2014 that carries real risk without medical supervision. Read critically.",
    searchQueries: ['depression inflammation thyroid gut health women'],
    universalRecommendation: false },

  // ---------- SPECIAL: COMING SOON / FEATURED RESOURCE ----------
  { slug: 'gary-brecka-ultimate-human', title: 'Becoming the Ultimate Human', author: 'Gary Brecka', year: null,
    pillar: ['genomics', 'longevity'], variantTriggers: ['MTHFR_compound_het'], evidenceQuality: 'mixed', type: 'coming_soon', status: 'Announced \u2014 publication date not confirmed',
    synopsis: "Brecka's forthcoming book on biohacking, MTHFR methylation, breathing, and lifestyle protocols. No confirmed publication date. We will add the full entry when the book is available and reviewable.",
    knownFor: "Brecka's public profile as a biohacking figure focused on MTHFR and methylation content.",
    plainReason: 'MTHFR-focused, so aligned with one of the most-studied Youth-relevant variants \u2014 assess on publication.',
    honestyNote: 'Brecka is not a physician \u2014 he describes himself as a human biologist with a background in mortality risk assessment. His MTHFR and methylation content aligns with real science but his specific clinical claims have been contested by physicians. Assess on publication.',
    searchQueries: ['MTHFR methylation biohacking'],
    universalRecommendation: false },
  { slug: 'foundmyfitness-rhonda-patrick', title: 'FoundMyFitness', author: 'Dr. Rhonda Patrick', year: null,
    pillar: ['genomics', 'nutrition', 'longevity', 'performance'], variantTriggers: ['NRF2_variant', 'VDR_variant', 'FADS1_reduced'], evidenceQuality: 'strong', type: 'featured_resource',
    externalUrl: 'https://www.foundmyfitness.com',
    synopsis: 'Dr. Rhonda Patrick (PhD biochemistry) has never authored a book \u2014 but her website, podcast, and YouTube channel are among the most research-dense health-science resources available. Several books attributed to her online are unauthorized AI-generated impersonations and are not her work. The real resource is FoundMyFitness.com.',
    knownFor: 'One of the most research-dense independent health-science voices online.',
    plainReason: "Patrick's work on sulforaphane, omega-3, sauna, vitamin D, and heat shock proteins directly intersects with NRF2, VDR, FADS1/2, and PPARGC1A variants \u2014 several of which show up in nearly every SelfScience genome report.",
    honestyNote: 'Displayed as a resource card rather than a book \u2014 several AI-generated books falsely attributed to her circulate online. Do not purchase any book listed under her name. The primary resource is foundmyfitness.com.',
    searchQueries: ['sulforaphane omega-3 sauna vitamin D research'],
    universalRecommendation: false },
]

// ---------------------------------------------------------------------------
// TOPIC COLLECTIONS \u2014 curated multi-pillar bundles surfaced above the pillar
// filter on /reading-list. Each collection uses book slugs so that if a book
// is retitled or repillared the collection follows automatically.
// ---------------------------------------------------------------------------
export const TOPIC_COLLECTIONS = [
  {
    slug: 'environmental-health',
    label: 'Environmental Health',
    blurb: 'Endocrine disruptors, seed oils, forever chemicals, and the food system.',
    slugs: ['count-down', 'our-stolen-future', 'exposure-bilott', 'dark-calories', 'food-fix'],
  },
  {
    slug: 'children-first',
    label: 'Children First',
    blurb: 'The Youth pillar reading list \u2014 for parents, teachers, and pediatric-curious clinicians.',
    slugs: ['dirty-genes', 'the-better-brain', 'brain-rules-for-baby', 'orchid-and-the-dandelion', 'epigenetics-revolution', 'good-inside', 'the-developing-mind', 'better-baby-book', 'baby-led-weaning', 'fat-chance', 'the-circadian-code'],
  },
  {
    slug: 'brain-and-mental-health',
    label: 'Brain & Mental Health',
    blurb: 'Neurochemistry, nutritional psychiatry, and the honest debates in psychiatric medicine.',
    slugs: ['brain-energy', 'unshrunk', 'genius-foods', 'the-genius-life', 'mind-of-your-own', 'behave', 'the-better-brain'],
  },
  {
    slug: 'metabolic-foundation',
    label: 'Metabolic Foundation',
    blurb: 'Insulin resistance, ultra-processed food, and the biochemistry of chronic disease.',
    slugs: ['fat-chance', 'metabolical', 'good-energy', 'food-wthsie'],
  },
  {
    slug: 'hormones-collection',
    label: 'Hormones',
    blurb: 'Estrogen, testosterone, thyroid, cortisol \u2014 across the lifespan and both sexes.',
    slugs: ['roar-sims', 'next-level-sims', 'hormone-cure', 'hashimotos-protocol', 'young-forever'],
  },
  {
    slug: 'longevity-science',
    label: 'Longevity Science',
    blurb: 'The frontier of aging research and its translation into daily practice.',
    slugs: ['outlive', 'lifespan', 'the-telomere-effect', 'end-of-alzheimers', 'eat-to-beat-disease', 'protocols-huberman'],
  },
  {
    slug: 'gut-and-microbiome',
    label: 'Gut & Microbiome',
    blurb: 'The gut ecosystem, the gut\u2013brain axis, and the microbiome of infancy.',
    slugs: ['the-good-gut', 'gut', 'brain-maker', 'human-zach-bush'],
  },
  {
    slug: 'womens-health',
    label: "Women's Health",
    blurb: 'Physiology and hormones specifically researched in female cohorts.',
    slugs: ['roar-sims', 'next-level-sims', 'hormone-cure', 'mind-of-your-own'],
  },
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
