// =============================================================================
// SelfScience — Variant Classification Table
// /lib/variantClassifications.ts
//
// GROUND TRUTH lookup table for all single-SNP variant classifications.
// The AI plain language prompt reads from this table — it does NOT determine
// the classification itself. This separation ensures badges are always accurate.
//
// Classification meanings (user-facing):
//   positive  = this finding is a benefit or advantage for this user
//   awareness = this is something to understand and potentially act on
//   neutral   = no meaningful directional signal at this position
//   pending   = not yet classified — shows neutral card with research link only
//
// HAPLOTYPE VARIANTS: rsIDs that require multi-SNP analysis are marked
// haplotype: true and handled by /lib/haplotypeClassifiers.ts instead.
// Their entries here are for reference only — the classifier overrides them.
//
// Sources: ClinVar, PharmGKB, SNPedia, peer-reviewed GWAS literature
// Last updated: July 2026
// =============================================================================
export const VARIANT_CLASSIFICATIONS = {
    // ===========================================================================
    // METHYLATION & GENE EXPRESSION
    // ===========================================================================
    "rs1801133": {
        gene: "MTHFR", trait: "Folate processing (C677T)", pillar: "Genomics",
        haplotype: true, // See classifyMTHFR()
        genotypes: { CC: "positive", CT: "awareness", TT: "awareness" },
        positive_text: "Standard MTHFR enzyme activity — efficient folate to methylfolate conversion",
        awareness_text: "Reduced MTHFR enzyme activity — active methylfolate (5-MTHF) is the research-supported form",
        neutral_text: "Intermediate MTHFR activity",
        notes: "Always evaluate with rs1801131 for compound het status"
    },
    "rs1801131": {
        gene: "MTHFR", trait: "Folate processing (A1298C)", pillar: "Genomics",
        haplotype: true, // See classifyMTHFR()
        genotypes: { AA: "positive", AC: "awareness", CC: "awareness" },
        positive_text: "Standard MTHFR A1298C position",
        awareness_text: "A1298C variant — affects BH4 pathway and neurotransmitter synthesis support",
        neutral_text: "One A1298C variant — mild impact"
    },
    "rs2274976": {
        gene: "MTHFR", trait: "Methylation pathway support", pillar: "Genomics",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard MTHFR R594Q function",
        awareness_text: "Additional MTHFR variant — compound impact on methylation pathway",
        neutral_text: "One MTHFR R594Q variant"
    },
    "rs1805087": {
        gene: "MTR", trait: "B12-dependent methylation", pillar: "Genomics",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard MTR function — B12-dependent methylation proceeds normally",
        awareness_text: "MTR A2756G variant — B12 requirements may be higher in research populations",
        neutral_text: "One MTR variant — mild influence on B12 methylation"
    },
    "rs1801394": {
        gene: "MTRR", trait: "B12 recycling efficiency", pillar: "Genomics",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard MTRR function — efficient B12 recycling for methylation",
        awareness_text: "MTRR A66G variant — B12 recycling efficiency may be reduced",
        neutral_text: "One MTRR variant — moderate B12 recycling"
    },
    "rs1532268": {
        gene: "SHMT1", trait: "Serine-to-glycine folate conversion", pillar: "Genomics",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard SHMT1 function — efficient one-carbon unit transfer",
        awareness_text: "SHMT1 variant — may influence folate partitioning between DNA synthesis and methylation",
        neutral_text: "One SHMT1 variant"
    },
    "rs1979277": {
        gene: "SHMT1", trait: "Folate pathway support", pillar: "Genomics",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard SHMT1 function at this position",
        awareness_text: "SHMT1 variant — additional folate pathway consideration",
        neutral_text: "One SHMT1 variant"
    },
    "rs2236225": {
        gene: "MTHFD1", trait: "Mitochondrial folate metabolism", pillar: "Genomics",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard MTHFD1 function — efficient mitochondrial folate processing",
        awareness_text: "MTHFD1 variant — may influence folate availability for mitochondrial function",
        neutral_text: "One MTHFD1 variant"
    },
    "rs3776455": {
        gene: "BHMT", trait: "Betaine methylation pathway", pillar: "Genomics",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard BHMT function — efficient betaine-dependent methylation",
        awareness_text: "BHMT variant — choline and betaine intake more relevant for methylation support",
        neutral_text: "One BHMT variant"
    },
    "rs492842": {
        gene: "BHMT2", trait: "Betaine pathway support", pillar: "Genomics",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard BHMT2 function at this position",
        awareness_text: "BHMT2 variant — additional betaine pathway consideration",
        neutral_text: "One BHMT2 variant"
    },
    "rs1059369": {
        gene: "AHCY", trait: "Homocysteine recycling", pillar: "Genomics",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard SAH hydrolase function — efficient homocysteine clearance",
        awareness_text: "AHCY variant — may influence homocysteine accumulation and methylation cycle flow",
        neutral_text: "One AHCY variant"
    },
    // ===========================================================================
    // NUTRITION & METABOLISM
    // ===========================================================================
    "rs9939609": {
        gene: "FTO", trait: "Appetite and energy regulation", pillar: "Nutrition",
        genotypes: { TT: "positive", AT: "neutral", AA: "awareness" },
        positive_text: "FTO TT — standard appetite signaling and energy balance in research populations",
        awareness_text: "FTO AA — associated with higher BMI and appetite drive in population studies. Satiety-focused dietary patterns are the research focus",
        neutral_text: "FTO heterozygous — moderate appetite signaling"
    },
    "rs1421085": {
        gene: "FTO", trait: "Fat mass regulation", pillar: "Nutrition",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard FTO function at this position",
        awareness_text: "FTO variant — additional energy balance consideration",
        neutral_text: "One FTO variant"
    },
    "rs17782313": {
        gene: "MC4R", trait: "Appetite regulation", pillar: "Nutrition",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard MC4R appetite signaling",
        awareness_text: "MC4R variant — associated with increased appetite and food intake in population research",
        neutral_text: "One MC4R variant — moderate appetite influence"
    },
    "rs1801282": {
        gene: "PPARG", trait: "Fat cell development and insulin sensitivity", pillar: "Nutrition",
        genotypes: { CC: "positive", CG: "positive", GG: "awareness" },
        positive_text: "PPARG Pro12Ala — Ala allele associated with improved insulin sensitivity in research",
        awareness_text: "PPARG Pro/Pro — standard fat cell differentiation; dietary fat quality more impactful",
        neutral_text: "One PPARG variant"
    },
    "rs174547": {
        gene: "FADS1", trait: "Omega-3 conversion efficiency", pillar: "Nutrition",
        haplotype: true, // See classifyFADS()
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "FADS1 variant associated with efficient omega-3 fatty acid conversion",
        awareness_text: "FADS1 TT — reduced ALA to EPA/DHA conversion. Marine omega-3 sources are more relevant",
        neutral_text: "One FADS1 variant — moderate conversion"
    },
    "rs1535": {
        gene: "FADS1", trait: "Fatty acid desaturation", pillar: "Nutrition",
        haplotype: true,
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard FADS1 desaturation at this position",
        awareness_text: "FADS1 reduced-function variant — direct omega-3 sources more impactful",
        neutral_text: "One FADS1 variant"
    },
    "rs174537": {
        gene: "FADS1", trait: "Omega-3 pathway efficiency", pillar: "Nutrition",
        haplotype: true,
        genotypes: { TT: "positive", GT: "neutral", GG: "awareness" },
        positive_text: "FADS1 efficient conversion allele",
        awareness_text: "FADS1 GG — reduced desaturation efficiency",
        neutral_text: "One FADS1 variant"
    },
    "rs3834458": {
        gene: "FADS2", trait: "Omega-6 to omega-3 conversion", pillar: "Nutrition",
        haplotype: true,
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard FADS2 desaturation function",
        awareness_text: "FADS2 variant — additional consideration for fatty acid conversion efficiency",
        neutral_text: "One FADS2 variant"
    },
    "rs12934922": {
        gene: "BCMO1", trait: "Beta-carotene to Vitamin A conversion", pillar: "Nutrition",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "BCMO1 GG — efficient beta-carotene to retinol conversion. Plant vitamin A sources well utilized",
        awareness_text: "BCMO1 AA — research associates this genotype with approximately 70% reduced beta-carotene conversion. Preformed vitamin A from animal sources is more relevant",
        neutral_text: "One BCMO1 variant — moderate conversion efficiency"
    },
    "rs7501331": {
        gene: "BCMO1", trait: "Vitamin A status", pillar: "Nutrition",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard BCMO1 function at this position",
        awareness_text: "Additional BCMO1 variant — preformed vitamin A more relevant",
        neutral_text: "One BCMO1 variant"
    },
    "rs4988235": {
        gene: "LCT", trait: "Lactase persistence", pillar: "Nutrition",
        genotypes: { TT: "positive", CT: "positive", CC: "awareness" },
        positive_text: "LCT persistence allele — lactase enzyme maintained into adulthood. Dairy digestion is typical",
        awareness_text: "LCT non-persistence — lactase enzyme declines after childhood. Lactose-containing dairy may cause digestive symptoms",
        neutral_text: "One LCT variant"
    },
    "rs182549": {
        gene: "LCT", trait: "Dairy tolerance", pillar: "Nutrition",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Lactase persistence allele at this position",
        awareness_text: "Lactose intolerance variant — additional confirmation of reduced lactase",
        neutral_text: "One LCT variant"
    },
    "rs762551": {
        gene: "CYP1A2", trait: "Caffeine metabolism speed", pillar: "Nutrition",
        genotypes: { AA: "positive", AC: "awareness", CC: "awareness" },
        positive_text: "CYP1A2 fast metabolizer — caffeine cleared quickly. Standard timing and dose apply",
        awareness_text: "CYP1A2 slow metabolizer — caffeine half-life extended. Higher cardiovascular sensitivity to caffeine in research; earlier cutoff times recommended",
        neutral_text: "Moderate caffeine metabolism"
    },
    "rs1229984": {
        gene: "ADH1B", trait: "Alcohol dehydrogenase activity", pillar: "Nutrition",
        genotypes: { GG: "positive", AG: "positive", AA: "awareness" },
        positive_text: "ADH1B — standard alcohol processing speed",
        awareness_text: "ADH1B fast variant — acetaldehyde accumulates more rapidly. Flushing and sensitivity reactions more likely",
        neutral_text: "Moderate alcohol processing"
    },
    "rs671": {
        gene: "ALDH2", trait: "Acetaldehyde clearance", pillar: "Nutrition",
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "ALDH2 full function — acetaldehyde from alcohol cleared efficiently",
        awareness_text: "ALDH2 variant — impaired acetaldehyde clearance. Alcohol sensitivity and flushing are common research-documented effects",
        neutral_text: "Moderate ALDH2 function"
    },
    "rs7903146": {
        gene: "TCF7L2", trait: "Blood sugar regulation", pillar: "Nutrition",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "TCF7L2 low-risk allele — standard glucose regulation and insulin secretion",
        awareness_text: "TCF7L2 TT — strongest known T2D genetic risk signal. Meal timing, carbohydrate quality, and post-meal activity are the primary research interventions",
        neutral_text: "One TCF7L2 variant — moderate glucose regulation consideration"
    },
    "rs5219": {
        gene: "KCNJ11", trait: "Insulin secretion channel", pillar: "Nutrition",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard KCNJ11 potassium channel function — normal insulin secretion",
        awareness_text: "KCNJ11 variant — associated with altered insulin secretion timing in research",
        neutral_text: "One KCNJ11 variant"
    },
    "rs11591147": {
        gene: "PCSK9", trait: "LDL cholesterol clearance", pillar: "Nutrition",
        genotypes: { GG: "positive", GT: "positive", TT: "awareness" },
        positive_text: "PCSK9 loss-of-function — enhanced LDL receptor recycling, lower LDL in research populations",
        awareness_text: "Standard PCSK9 function — LDL clearance at population average rates",
        neutral_text: "One PCSK9 variant"
    },
    "rs693": {
        gene: "APOB", trait: "LDL particle size and density", pillar: "Nutrition",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard APOB function — typical LDL particle characteristics",
        awareness_text: "APOB variant — associated with differences in LDL particle size in research",
        neutral_text: "One APOB variant"
    },
    "rs708272": {
        gene: "CETP", trait: "HDL cholesterol levels", pillar: "Nutrition",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "CETP variant associated with higher HDL cholesterol in research populations",
        awareness_text: "Standard CETP function — HDL at population average levels",
        neutral_text: "One CETP variant"
    },
    "rs328": {
        gene: "LPL", trait: "Triglyceride clearance", pillar: "Nutrition",
        genotypes: { CC: "positive", CG: "positive", GG: "awareness" },
        positive_text: "LPL gain-of-function — enhanced triglyceride clearance after meals",
        awareness_text: "Standard LPL function — post-meal triglyceride clearance at average rates",
        neutral_text: "One LPL variant"
    },
    "rs662799": {
        gene: "APOA5", trait: "Triglyceride response to dietary fat", pillar: "Nutrition",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "APOA5 low-risk allele — typical post-meal triglyceride response to fat intake",
        awareness_text: "APOA5 variant — higher post-meal triglycerides in response to dietary fat in research",
        neutral_text: "One APOA5 variant"
    },
    "rs1800562": {
        gene: "HFE", trait: "Iron absorption regulation", pillar: "Nutrition",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard HFE function — iron absorption appropriately regulated",
        awareness_text: "HFE C282Y variant — iron absorption may be elevated. Iron overload risk relevant in research",
        neutral_text: "One HFE variant — mild iron regulation consideration"
    },
    "rs2228570": {
        gene: "VDR", trait: "Vitamin D receptor function", pillar: "Nutrition",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "VDR FokI — ff genotype associated with higher vitamin D receptor responsiveness in research",
        awareness_text: "VDR FF — reduced receptor responsiveness; higher vitamin D levels may be needed",
        neutral_text: "One VDR FokI variant"
    },
    "rs1544410": {
        gene: "VDR", trait: "Vitamin D receptor binding", pillar: "Nutrition",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "VDR BsmI variant associated with favorable receptor binding in research",
        awareness_text: "VDR BsmI variant — may influence vitamin D-dependent gene expression",
        neutral_text: "One VDR BsmI variant"
    },
    // ===========================================================================
    // SPORTS PERFORMANCE
    // ===========================================================================
    "rs1815739": {
        gene: "ACTN3", trait: "Muscle fiber type tendency", pillar: "Sports Performance",
        haplotype: true, // See classifyACTN3()
        genotypes: { CC: "positive", CT: "neutral", TT: "positive" },
        positive_text: "Clear athletic type advantage — either power (CC/RR) or endurance (TT/XX)",
        awareness_text: "No alpha-actinin-3 expression — pure endurance profile, reduced power fiber capacity",
        neutral_text: "Mixed RX — balanced athletic profile"
    },
    "rs4253778": {
        gene: "PPARA", trait: "Fat burning during exercise", pillar: "Sports Performance",
        genotypes: { GG: "positive", CG: "neutral", CC: "awareness" },
        positive_text: "PPARA GG — enhanced fat oxidation signaling. Keto and fasted training align well with this profile",
        awareness_text: "PPARA CC — reduced fat oxidation signaling. Carbohydrate availability more important for performance",
        neutral_text: "One PPARA variant — moderate fat oxidation"
    },
    "rs8192678": {
        gene: "PPARGC1A", trait: "Mitochondrial biogenesis response", pillar: "Sports Performance",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "PPARGC1A Ser/Ser — strong mitochondrial biogenesis response to aerobic training",
        awareness_text: "PPARGC1A Gly/Gly — blunted mitochondrial biogenesis response. Higher training frequency (4-5x/week Zone 2) needed to achieve the same adaptation",
        neutral_text: "One PPARGC1A variant — moderate mitochondrial response"
    },
    "rs12722": {
        gene: "COL5A1", trait: "Connective tissue injury risk", pillar: "Sports Performance",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "COL5A1 CC — standard connective tissue tensile strength in research populations",
        awareness_text: "COL5A1 TT — associated with elevated connective tissue injury risk. Collagen loading protocol and progressive volume increases are the research-supported approach",
        neutral_text: "One COL5A1 variant — moderate connective tissue consideration"
    },
    "rs1107946": {
        gene: "COL1A1", trait: "Tendon and ligament strength", pillar: "Sports Performance",
        genotypes: { GG: "positive", GT: "neutral", TT: "awareness" },
        positive_text: "Standard COL1A1 collagen structure — typical tendon and bone strength",
        awareness_text: "COL1A1 TT — associated with altered collagen structure and connective tissue injury risk in athletes",
        neutral_text: "One COL1A1 variant"
    },
    "rs1799750": {
        gene: "MMP1", trait: "Collagen degradation rate", pillar: "Sports Performance",
        genotypes: { II: "positive", ID: "neutral", DD: "awareness" },
        positive_text: "MMP1 low-activity allele — lower collagen degradation rate, better connective tissue maintenance",
        awareness_text: "MMP1 DD — higher MMP1 expression, faster collagen breakdown. Collagen synthesis support is the research priority",
        neutral_text: "Intermediate MMP1 activity"
    },
    "rs679620": {
        gene: "MMP3", trait: "Connective tissue remodeling", pillar: "Sports Performance",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard MMP3 activity — balanced connective tissue remodeling",
        awareness_text: "MMP3 variant — higher matrix metalloproteinase activity; connective tissue recovery more relevant",
        neutral_text: "One MMP3 variant"
    },
    "rs2010963": {
        gene: "VEGF", trait: "Exercise-induced blood vessel growth", pillar: "Sports Performance",
        genotypes: { CC: "positive", CG: "neutral", GG: "awareness" },
        positive_text: "VEGF high-expression allele — enhanced capillarization response to endurance training",
        awareness_text: "VEGF low-expression variant — reduced angiogenesis response; higher training volume may be needed for equivalent capillarization",
        neutral_text: "One VEGF variant"
    },
    "rs1799752": {
        gene: "ACE", trait: "Aerobic capacity and endurance", pillar: "Sports Performance",
        genotypes: { II: "positive", ID: "neutral", DD: "awareness" },
        positive_text: "ACE insertion allele — associated with endurance performance advantage and lower ACE activity in research",
        awareness_text: "ACE DD — higher ACE activity; associated with power performance in some research populations",
        neutral_text: "ACE ID — mixed profile; research shows versatility across athletic domains"
    },
    "rs1799983": {
        gene: "NOS3", trait: "Nitric oxide production", pillar: "Sports Performance",
        genotypes: { GG: "positive", GT: "neutral", TT: "awareness" },
        positive_text: "NOS3 G894 — standard endothelial nitric oxide production and vascular response to exercise",
        awareness_text: "NOS3 T allele — lower nitric oxide synthase activity; beet-based nitrate supplementation more relevant",
        neutral_text: "One NOS3 variant"
    },
    "rs4880": {
        gene: "SOD2", trait: "Mitochondrial antioxidant defense", pillar: "Sports Performance",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "SOD2 Val/Val — efficient mitochondrial superoxide scavenging",
        awareness_text: "SOD2 Ala/Ala — reduced mitochondrial antioxidant import; oxidative stress management more relevant during high training loads",
        neutral_text: "One SOD2 variant"
    },
    "rs143383": {
        gene: "GDF5", trait: "Joint and tendon development", pillar: "Sports Performance",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "GDF5 TT — standard joint and tendon development profile",
        awareness_text: "GDF5 CC — associated with altered joint morphology and elevated injury risk in some research populations",
        neutral_text: "One GDF5 variant"
    },
    "rs11091153": {
        gene: "AMPD1", trait: "Muscle energy efficiency", pillar: "Sports Performance",
        genotypes: { CC: "positive", CA: "neutral", AA: "awareness" },
        positive_text: "Standard AMPD1 function — efficient AMP deaminase activity during high-intensity exercise",
        awareness_text: "AMPD1 variant — reduced muscle AMP deaminase; may affect fatigue onset during repeated high-intensity efforts",
        neutral_text: "One AMPD1 variant"
    },
    // ===========================================================================
    // LONGEVITY & CELLULAR HEALTH
    // ===========================================================================
    "rs2802292": {
        gene: "FOXO3", trait: "Cellular stress resistance", pillar: "Longevity",
        genotypes: { GG: "positive", GT: "positive", TT: "neutral" },
        positive_text: "FOXO3 G allele — associated with longevity and better cellular stress resistance in centenarian population studies across multiple ethnicities",
        awareness_text: "Standard FOXO3 function — no longevity G allele",
        neutral_text: "Standard FOXO3 cellular stress response — no longevity-associated G allele. Lifestyle factors (Zone 2 training, caloric moderation) activate related pathways regardless of genotype"
    },
    "rs13217795": {
        gene: "FOXO3", trait: "Longevity pathway", pillar: "Longevity",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "FOXO3 additional longevity-associated variant",
        awareness_text: "Standard FOXO3 at this position",
        neutral_text: "One FOXO3 variant"
    },
    "rs12778366": {
        gene: "SIRT1", trait: "Cellular NAD+ and aging pathway", pillar: "Longevity",
        genotypes: { TT: "awareness", CT: "neutral", CC: "positive" },
        positive_text: "SIRT1 higher-expression variant — associated with greater sirtuin activity in research",
        awareness_text: "SIRT1 TT — baseline sirtuin expression. NAD+ precursor support (NMN/NR) is the research-supported approach",
        neutral_text: "One SIRT1 variant"
    },
    "rs11246020": {
        gene: "SIRT3", trait: "Mitochondrial sirtuin activity", pillar: "Longevity",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "SIRT3 higher-activity variant — enhanced mitochondrial protein deacetylation",
        awareness_text: "SIRT3 standard activity — mitochondrial health more dependent on lifestyle inputs",
        neutral_text: "One SIRT3 variant"
    },
    "rs9420907": {
        gene: "OBFC1", trait: "Telomere length tendency", pillar: "Longevity",
        genotypes: { CC: "positive", AC: "neutral", AA: "awareness" },
        positive_text: "Standard OBFC1 — typical telomere maintenance",
        awareness_text: "OBFC1 AA — associated with shorter telomere tendency in research. Lifestyle factors (Zone 2 training, stress management) are primary telomere preservation strategies",
        neutral_text: "One OBFC1 variant"
    },
    "rs2736100": {
        gene: "TERT", trait: "Telomerase activity", pillar: "Longevity",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "TERT variant associated with favorable telomere maintenance in research",
        awareness_text: "TERT variant — associated with reduced telomerase activity in some populations",
        neutral_text: "One TERT variant"
    },
    "rs429358": {
        gene: "APOE", trait: "APOE cardiovascular variant", pillar: "Longevity",
        haplotype: true, // See classifyAPOE()
        genotypes: { TT: "neutral", CT: "awareness", CC: "awareness" },
        positive_text: "No APOE4 allele",
        awareness_text: "APOE4 allele detected — evaluate with rs7412 for full isoform classification",
        neutral_text: "APOE standard — evaluate with rs7412"
    },
    "rs7412": {
        gene: "APOE", trait: "APOE cardiovascular variant", pillar: "Longevity",
        haplotype: true,
        genotypes: { CC: "neutral", CT: "positive", TT: "positive" },
        positive_text: "APOE2 allele detected — evaluate with rs429358",
        awareness_text: "Standard APOE — evaluate with rs429358",
        neutral_text: "Standard APOE — evaluate with rs429358"
    },
    "rs1042522": {
        gene: "TP53", trait: "DNA damage response and tumor suppression", pillar: "Longevity",
        genotypes: { GG: "positive", CG: "neutral", CC: "awareness" },
        positive_text: "TP53 Pro/Pro — standard p53 tumor suppression function",
        awareness_text: "TP53 Arg/Arg — higher transcriptional activity but associated with elevated apoptosis sensitivity in some research",
        neutral_text: "TP53 Pro/Arg — intermediate p53 function"
    },
    "rs9536314": {
        gene: "KLOTHO", trait: "Aging hormone signaling", pillar: "Longevity",
        genotypes: { TT: "positive", GT: "positive", GG: "awareness" },
        positive_text: "KLOTHO KL-VS allele — associated with favorable aging markers and cognitive function in research populations",
        awareness_text: "Standard KLOTHO function — no KL-VS variant",
        neutral_text: "One KLOTHO variant"
    },
    "rs1800795": {
        gene: "IL6", trait: "Inflammatory signaling baseline", pillar: "Longevity",
        genotypes: { GG: "awareness", CG: "neutral", CC: "positive" },
        positive_text: "IL-6 low-expression allele — lower baseline inflammatory signaling",
        awareness_text: "IL-6 high-expression variant — higher baseline inflammatory tone. Anti-inflammatory lifestyle factors are more relevant",
        neutral_text: "One IL-6 variant"
    },
    "rs1800629": {
        gene: "TNF", trait: "Inflammatory response regulation", pillar: "Longevity",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard TNF-alpha expression — balanced inflammatory response",
        awareness_text: "TNF-alpha high-expression variant — elevated inflammatory signaling. Recovery and anti-inflammatory protocols more important",
        neutral_text: "One TNF-alpha variant"
    },
    "rs25487": {
        gene: "XRCC1", trait: "DNA base excision repair", pillar: "Longevity",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard XRCC1 DNA repair function — efficient base excision repair",
        awareness_text: "XRCC1 variant — may reduce DNA repair efficiency; antioxidant support and UV exposure management more relevant",
        neutral_text: "One XRCC1 variant"
    },
    "rs1052133": {
        gene: "OGG1", trait: "Oxidative DNA damage repair", pillar: "Longevity",
        genotypes: { CC: "positive", CG: "neutral", GG: "awareness" },
        positive_text: "Standard OGG1 function — efficient repair of oxidative DNA damage (8-oxoguanine)",
        awareness_text: "OGG1 variant — reduced oxidative DNA damage repair. Antioxidant intake and oxidative stress reduction are the research priorities",
        neutral_text: "One OGG1 variant"
    },
    // ===========================================================================
    // BRAIN, MOOD & NEUROCHEMISTRY
    // ===========================================================================
    "rs4680": {
        gene: "COMT", trait: "Dopamine processing speed", pillar: "Brain & Neurochemistry",
        haplotype: true, // See classifyCOMT()
        genotypes: { AA: "positive", AG: "neutral", GG: "positive" },
        positive_text: "Well-defined COMT neurochemical profile — either Met/Met (cognitive advantage in low-stress) or Val/Val Warrior (stress-performance advantage)",
        awareness_text: "COMT heterozygous — intermediate dopamine processing",
        neutral_text: "COMT Val/Met — balanced dopamine clearance across contexts"
    },
    "rs6265": {
        gene: "BDNF", trait: "Brain plasticity and stress resilience", pillar: "Brain & Neurochemistry",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "BDNF Val/Val — optimal activity-dependent BDNF secretion. Strong neuroplasticity response to exercise and learning",
        awareness_text: "BDNF Met/Met — reduced activity-dependent BDNF secretion. Aerobic exercise is the strongest research-supported BDNF amplifier",
        neutral_text: "BDNF Val/Met — moderate neuroplasticity response"
    },
    "rs1360780": {
        gene: "FKBP5", trait: "Stress hormone regulation", pillar: "Brain & Neurochemistry",
        genotypes: { CC: "positive", CT: "awareness", TT: "awareness" },
        positive_text: "Standard FKBP5 function — cortisol clearance proceeds normally after stress",
        awareness_text: "FKBP5 T allele — cortisol clearance may be delayed. Stress recovery and cortisol management protocols are the research focus",
        neutral_text: "One FKBP5 variant"
    },
    "rs1800497": {
        gene: "DRD2", trait: "Dopamine receptor density", pillar: "Brain & Neurochemistry",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "DRD2 Taq1A A2 — higher dopamine receptor density in research populations",
        awareness_text: "DRD2 Taq1A A1 — lower striatal dopamine receptor density. Reward motivation and habit formation may require more deliberate structure",
        neutral_text: "One DRD2 Taq1A variant"
    },
    "rs6311": {
        gene: "HTR2A", trait: "Serotonin receptor sensitivity", pillar: "Brain & Neurochemistry",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard HTR2A serotonin receptor expression",
        awareness_text: "HTR2A variant — altered serotonin receptor expression; may influence mood regulation and SSRI response",
        neutral_text: "One HTR2A variant"
    },
    "rs130058": {
        gene: "HTR1A", trait: "Serotonin autoreceptor sensitivity", pillar: "Brain & Neurochemistry",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard HTR1A autoreceptor sensitivity",
        awareness_text: "HTR1A variant — altered serotonin autoreceptor sensitivity; may influence anxiety and antidepressant response",
        neutral_text: "One HTR1A variant"
    },
    "rs10830963": {
        gene: "MTNR1B", trait: "Melatonin receptor and glucose timing", pillar: "Brain & Neurochemistry",
        genotypes: { CC: "positive", CG: "awareness", GG: "awareness" },
        positive_text: "MTNR1B low-risk allele — standard melatonin-insulin interaction, flexible meal timing",
        awareness_text: "MTNR1B G allele — eating late activates melatonin receptor signaling that impairs insulin secretion. Early eating cutoff (by 6:30 PM) is the primary research intervention for this genotype",
        neutral_text: "One MTNR1B variant"
    },
    "rs1800955": {
        gene: "DRD4", trait: "Dopamine receptor novelty response", pillar: "Brain & Neurochemistry",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard DRD4 dopamine receptor function",
        awareness_text: "DRD4 variant — associated with novelty-seeking behavior and attention in research",
        neutral_text: "One DRD4 variant"
    },
    "rs4570625": {
        gene: "TPH2", trait: "Serotonin synthesis rate", pillar: "Brain & Neurochemistry",
        genotypes: { GG: "positive", GT: "neutral", TT: "awareness" },
        positive_text: "Standard TPH2 serotonin synthesis — typical serotonin production rate",
        awareness_text: "TPH2 variant — associated with lower serotonin synthesis in research. Exercise and tryptophan availability are key modifiers",
        neutral_text: "One TPH2 variant"
    },
    "rs10994359": {
        gene: "ANK3", trait: "Neuronal stability and mood regulation", pillar: "Brain & Neurochemistry",
        genotypes: { TT: "positive", AT: "neutral", AA: "awareness" },
        positive_text: "Standard ANK3 neuronal membrane stability",
        awareness_text: "ANK3 variant — associated with mood stability differences in research. Consistent sleep and circadian rhythm support are most relevant",
        neutral_text: "One ANK3 variant"
    },
    "rs1938526": {
        gene: "CACNA1C", trait: "Calcium channel and mood stability", pillar: "Brain & Neurochemistry",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard CACNA1C calcium channel function in neurons",
        awareness_text: "CACNA1C variant — associated with mood regulation differences in research. Magnesium intake and circadian consistency are relevant lifestyle factors",
        neutral_text: "One CACNA1C variant"
    },
    // ===========================================================================
    // SLEEP & CIRCADIAN
    // ===========================================================================
    "rs1801260": {
        gene: "CLOCK", trait: "Circadian rhythm timing", pillar: "Sleep & Circadian",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard CLOCK gene function — typical circadian period and sleep timing",
        awareness_text: "CLOCK variant — associated with delayed sleep phase and evening chronotype in research. Consistent light exposure timing is the primary intervention",
        neutral_text: "One CLOCK variant"
    },
    "rs228697": {
        gene: "PER3", trait: "Sleep duration and architecture", pillar: "Sleep & Circadian",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard PER3 circadian function",
        awareness_text: "PER3 variant — associated with altered sleep architecture and greater sleep deprivation sensitivity in research",
        neutral_text: "One PER3 variant"
    },
    "rs2292912": {
        gene: "CRY1", trait: "Circadian clock precision", pillar: "Sleep & Circadian",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard CRY1 function — precise 24-hour circadian timing",
        awareness_text: "CRY1 variant — associated with delayed sleep phase disorder in research. Light-dark cycle discipline is most impactful",
        neutral_text: "One CRY1 variant"
    },
    "rs1554338": {
        gene: "CRY2", trait: "Circadian light response", pillar: "Sleep & Circadian",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard CRY2 circadian repressor function",
        awareness_text: "CRY2 variant — associated with morning chronotype and circadian sensitivity in research",
        neutral_text: "One CRY2 variant"
    },
    "rs7602358": {
        gene: "ARNTL", trait: "Master circadian clock gene", pillar: "Sleep & Circadian",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard BMAL1 circadian transcription function",
        awareness_text: "BMAL1 variant — associated with metabolic syndrome risk and circadian disruption sensitivity in research",
        neutral_text: "One BMAL1 variant"
    },
    "rs1144566": {
        gene: "TIMELESS", trait: "Circadian period regulation", pillar: "Sleep & Circadian",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard TIMELESS function — typical circadian period maintenance",
        awareness_text: "TIMELESS variant — circadian period may be altered; consistent sleep scheduling is most relevant",
        neutral_text: "One TIMELESS variant"
    },
    "rs1387153": {
        gene: "MTNR1B", trait: "Melatonin receptor expression", pillar: "Sleep & Circadian",
        genotypes: { TT: "positive", CT: "awareness", CC: "awareness" },
        positive_text: "Standard MTNR1B expression at this position",
        awareness_text: "MTNR1B variant — additional melatonin receptor consideration; evening eating impact compounded",
        neutral_text: "One MTNR1B variant"
    },
    // ===========================================================================
    // PHARMACOGENOMICS
    // ===========================================================================
    "rs1065852": {
        gene: "CYP2D6", trait: "Antidepressant and opioid metabolism", pillar: "Pharmacogenomics",
        haplotype: true, // See classifyCYP2D6()
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "Standard CYP2D6 function at this position",
        awareness_text: "CYP2D6 *4 variant — reduced function allele; evaluate with full CYP2D6 haplotype",
        neutral_text: "One CYP2D6 variant"
    },
    "rs4244285": {
        gene: "CYP2C19", trait: "SSRI and PPI metabolism", pillar: "Pharmacogenomics",
        haplotype: true, // See classifyCYP2C19()
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "Standard CYP2C19 function at this position",
        awareness_text: "CYP2C19 *2 loss-of-function variant — evaluate with full haplotype",
        neutral_text: "One CYP2C19 variant"
    },
    "rs12248560": {
        gene: "CYP2C19", trait: "SSRI ultra-rapid metabolism", pillar: "Pharmacogenomics",
        haplotype: true,
        genotypes: { CC: "positive", CT: "awareness", TT: "awareness" },
        positive_text: "Standard CYP2C19 metabolism rate",
        awareness_text: "CYP2C19 *17 gain-of-function — ultra-rapid metabolism; some SSRIs may clear too quickly",
        neutral_text: "One CYP2C19 *17 variant"
    },
    "rs1799853": {
        gene: "CYP2C9", trait: "Anti-inflammatory and anticoagulant metabolism", pillar: "Pharmacogenomics",
        genotypes: { CC: "positive", CT: "awareness", TT: "awareness" },
        positive_text: "Standard CYP2C9 function — NSAIDs and warfarin metabolized at expected rates",
        awareness_text: "CYP2C9 *2 variant — reduced metabolism; NSAIDs and warfarin may require dose consideration",
        neutral_text: "One CYP2C9 variant"
    },
    "rs1057910": {
        gene: "CYP2C9", trait: "Drug metabolism (CYP2C9 *3)", pillar: "Pharmacogenomics",
        genotypes: { AA: "positive", AC: "awareness", CC: "awareness" },
        positive_text: "Standard CYP2C9 *3 position",
        awareness_text: "CYP2C9 *3 — strongest loss-of-function allele; warfarin and NSAID dosing most affected",
        neutral_text: "One CYP2C9 *3 variant"
    },
    "rs776746": {
        gene: "CYP3A5", trait: "Tacrolimus and statin metabolism", pillar: "Pharmacogenomics",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "CYP3A5 expresser — standard tacrolimus and many drug clearance rates",
        awareness_text: "CYP3A5 non-expresser — CYP3A4 becomes primary; some drugs may require dose adjustment",
        neutral_text: "One CYP3A5 variant"
    },
    "rs9923231": {
        gene: "VKORC1", trait: "Warfarin sensitivity", pillar: "Pharmacogenomics",
        haplotype: true, // See classifyWarfarin()
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard VKORC1 — typical warfarin dose requirements",
        awareness_text: "VKORC1 sensitive allele — lower warfarin doses typically needed; discuss with prescribing physician",
        neutral_text: "One VKORC1 variant"
    },
    "rs4149056": {
        gene: "SLCO1B1", trait: "Statin muscle safety", pillar: "Pharmacogenomics",
        genotypes: { TT: "positive", CT: "awareness", CC: "awareness" },
        positive_text: "Standard SLCO1B1 statin transport — typical muscle risk profile with statins",
        awareness_text: "SLCO1B1 variant — associated with elevated statin-induced myopathy risk in research. Discuss with prescribing physician before statin use",
        neutral_text: "One SLCO1B1 variant"
    },
    "rs1799930": {
        gene: "NAT2", trait: "Acetylator status", pillar: "Pharmacogenomics",
        haplotype: true, // See classifyNAT2()
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "Standard NAT2 at this position — evaluate full acetylator haplotype",
        awareness_text: "NAT2 slow allele at *6 position — contributes to slow acetylator classification",
        neutral_text: "One NAT2 variant"
    },
    "rs1695": {
        gene: "GSTP1", trait: "Glutathione detoxification", pillar: "Pharmacogenomics",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "GSTP1 Ile/Ile — full glutathione S-transferase activity for phase II detoxification",
        awareness_text: "GSTP1 Val/Val — reduced glutathione conjugation activity; antioxidant support more relevant",
        neutral_text: "GSTP1 Ile/Val — moderate glutathione function"
    },
    "rs1801265": {
        gene: "DPYD", trait: "Fluorouracil chemotherapy safety", pillar: "Pharmacogenomics",
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "Standard DPYD function — 5-FU and capecitabine processed at expected rates",
        awareness_text: "DPYD variant — reduced dihydropyrimidine dehydrogenase; 5-FU toxicity risk elevated. Critical to discuss with oncologist before treatment",
        neutral_text: "One DPYD variant"
    },
    "rs1128503": {
        gene: "ABCB1", trait: "Drug transport and absorption", pillar: "Pharmacogenomics",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard ABCB1 P-glycoprotein function — typical drug absorption and brain penetration",
        awareness_text: "ABCB1 variant — altered drug efflux; may affect bioavailability of many medications",
        neutral_text: "One ABCB1 variant"
    },
    "rs1042714": {
        gene: "ADRB2", trait: "Beta-2 adrenergic receptor response", pillar: "Pharmacogenomics",
        genotypes: { CC: "positive", CG: "neutral", GG: "awareness" },
        positive_text: "Standard ADRB2 function — typical bronchodilator response to albuterol",
        awareness_text: "ADRB2 Gln27Glu variant — altered receptor downregulation; long-acting beta-agonist response may differ",
        neutral_text: "One ADRB2 variant"
    },
    // ===========================================================================
    // IMMUNE SYSTEM & GUT HEALTH
    // ===========================================================================
    "rs601338": {
        gene: "FUT2", trait: "Gut microbiome secretor status", pillar: "Immune & Gut Health",
        genotypes: { AA: "positive", AG: "positive", GG: "awareness" },
        positive_text: "FUT2 secretor — ABO blood group antigens expressed in gut mucosa. Associated with favorable Bifidobacterium colonization and B12 absorption in research",
        awareness_text: "FUT2 non-secretor — reduced gut mucus antigen expression. B12 absorption may be lower; probiotic Bifidobacterium strains more relevant",
        neutral_text: "One FUT2 variant"
    },
    "rs2066842": {
        gene: "NOD2", trait: "Bacterial recognition in gut", pillar: "Immune & Gut Health",
        genotypes: { CC: "positive", CT: "awareness", TT: "awareness" },
        positive_text: "Standard NOD2 bacterial recognition — normal innate immune sensing of gut bacteria",
        awareness_text: "NOD2 variant — associated with altered gut bacterial recognition and IBD risk in research. Gut inflammation management more relevant",
        neutral_text: "One NOD2 variant"
    },
    "rs2476601": {
        gene: "PTPN22", trait: "Immune self-regulation", pillar: "Immune & Gut Health",
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "Standard PTPN22 immune regulation — typical autoimmune risk baseline",
        awareness_text: "PTPN22 variant — associated with elevated autoimmune risk across multiple conditions in research",
        neutral_text: "One PTPN22 variant"
    },
    "rs4986790": {
        gene: "TLR4", trait: "Bacterial endotoxin response", pillar: "Immune & Gut Health",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard TLR4 LPS recognition — typical inflammatory response to bacterial endotoxin",
        awareness_text: "TLR4 variant — altered lipopolysaccharide recognition; infection response and gut inflammation may differ",
        neutral_text: "One TLR4 variant"
    },
    "rs11209026": {
        gene: "IL23R", trait: "Gut inflammatory response", pillar: "Immune & Gut Health",
        genotypes: { GG: "awareness", AG: "positive", AA: "positive" },
        positive_text: "IL23R protective variant — associated with lower IBD and Crohn's risk in research",
        awareness_text: "Standard IL23R — average gut inflammatory signaling",
        neutral_text: "One IL23R variant"
    },
    "rs10754558": {
        gene: "NLRP3", trait: "Inflammasome activation", pillar: "Immune & Gut Health",
        genotypes: { GG: "positive", CG: "neutral", CC: "awareness" },
        positive_text: "Standard NLRP3 inflammasome activity — balanced IL-1β and IL-18 production",
        awareness_text: "NLRP3 variant — associated with heightened inflammasome activation and elevated inflammatory response in research",
        neutral_text: "One NLRP3 variant"
    },
    "rs1143634": {
        gene: "IL1B", trait: "Inflammatory cytokine response", pillar: "Immune & Gut Health",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard IL-1B expression — balanced pro-inflammatory signaling",
        awareness_text: "IL-1B high-expression variant — elevated baseline inflammatory signaling in research populations",
        neutral_text: "One IL-1B variant"
    },
    "rs1800896": {
        gene: "IL10", trait: "Anti-inflammatory regulation", pillar: "Immune & Gut Health",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "IL-10 high-expression allele — stronger anti-inflammatory counter-regulation",
        awareness_text: "IL-10 low-expression variant — reduced anti-inflammatory signaling; recovery and stress management more impactful",
        neutral_text: "One IL-10 variant"
    },
    "rs3087243": {
        gene: "CTLA4", trait: "T cell immune checkpoint", pillar: "Immune & Gut Health",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard CTLA4 T cell regulation — balanced immune checkpoint function",
        awareness_text: "CTLA4 variant — associated with altered T cell activation and autoimmune risk in research",
        neutral_text: "One CTLA4 variant"
    },
    "rs352140": {
        gene: "TLR9", trait: "Viral and bacterial DNA recognition", pillar: "Immune & Gut Health",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard TLR9 innate immune recognition",
        awareness_text: "TLR9 variant — altered pathogen DNA recognition; immune response differences in research",
        neutral_text: "One TLR9 variant"
    },
    // ===========================================================================
    // HORMONES & ENDOCRINE
    // ===========================================================================
    "rs1799941": {
        gene: "AR", trait: "Androgen receptor sensitivity", pillar: "Hormones & Endocrine",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard androgen receptor sensitivity — testosterone signaling at typical efficiency",
        awareness_text: "AR variant — mildly altered androgen receptor sensitivity; SHBG levels more relevant for free testosterone",
        neutral_text: "One AR variant"
    },
    "rs225014": {
        gene: "DIO2", trait: "Thyroid hormone conversion", pillar: "Hormones & Endocrine",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard DIO2 T4 to T3 conversion — efficient thyroid hormone activation",
        awareness_text: "DIO2 T92A variant — reduced peripheral T4 to T3 conversion in research. T3-containing thyroid therapies and selenium intake are the research focus",
        neutral_text: "One DIO2 variant"
    },
    "rs6259": {
        gene: "SHBG", trait: "Sex hormone binding globulin level", pillar: "Hormones & Endocrine",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard SHBG levels — typical free testosterone fraction",
        awareness_text: "SHBG high-expression variant — elevated SHBG tends to reduce free testosterone. Total vs. free testosterone distinction is important",
        neutral_text: "One SHBG variant"
    },
    "rs2234693": {
        gene: "ESR1", trait: "Estrogen receptor alpha sensitivity", pillar: "Hormones & Endocrine",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard estrogen receptor alpha function",
        awareness_text: "ESR1 variant — altered estrogen receptor expression; bone density and cardiovascular estrogen response may differ",
        neutral_text: "One ESR1 variant"
    },
    "rs743572": {
        gene: "CYP17A1", trait: "Androgen and estrogen synthesis", pillar: "Hormones & Endocrine",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard CYP17A1 steroid synthesis — balanced androgen/estrogen production pathway",
        awareness_text: "CYP17A1 variant — associated with altered androgen production in research populations",
        neutral_text: "One CYP17A1 variant"
    },
    "rs10046": {
        gene: "CYP19A1", trait: "Aromatase (testosterone to estrogen conversion)", pillar: "Hormones & Endocrine",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "Standard aromatase activity — typical testosterone to estrogen conversion rate",
        awareness_text: "CYP19A1 variant — altered aromatase expression; testosterone-estrogen balance may differ",
        neutral_text: "One CYP19A1 variant"
    },
    "rs1137101": {
        gene: "LEPR", trait: "Leptin signaling efficiency", pillar: "Hormones & Endocrine",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard leptin receptor signaling — efficient satiety communication",
        awareness_text: "LEPR variant — reduced leptin receptor sensitivity in research. Satiety cues may be blunted; protein-forward dietary patterns are most relevant",
        neutral_text: "One LEPR variant"
    },
    "rs1800471": {
        gene: "TGFB1", trait: "Growth factor and repair signaling", pillar: "Hormones & Endocrine",
        genotypes: { GG: "positive", CG: "neutral", CC: "awareness" },
        positive_text: "Standard TGF-β1 growth factor signaling",
        awareness_text: "TGFB1 variant — altered fibrosis and tissue repair signaling; recovery quality more relevant",
        neutral_text: "One TGFB1 variant"
    },
    "rs1042138": {
        gene: "GLP1R", trait: "Incretin hormone response", pillar: "Hormones & Endocrine",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard GLP-1 receptor response — typical incretin effect on insulin secretion",
        awareness_text: "GLP1R variant — altered incretin response; meal composition and timing are more impactful for glucose control",
        neutral_text: "One GLP1R variant"
    },
    "rs1799963": {
        gene: "F2", trait: "Coagulation factor II (prothrombin)", pillar: "Hormones & Endocrine",
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "Standard prothrombin — typical blood clotting regulation",
        awareness_text: "F2 prothrombin variant — associated with elevated thrombosis risk in research. Discuss with physician if relevant to medications or procedures",
        neutral_text: "One F2 variant"
    },
    "rs6025": {
        gene: "F5", trait: "Factor V Leiden — clotting regulation", pillar: "Hormones & Endocrine",
        genotypes: { GG: "positive", AG: "awareness", AA: "awareness" },
        positive_text: "No Factor V Leiden — standard clotting factor V regulation",
        awareness_text: "Factor V Leiden variant — associated with elevated venous thromboembolism risk in research. Discuss with physician particularly regarding immobility, surgery, or oral contraceptives",
        neutral_text: "One F5 variant"
    },
    // ===========================================================================
    // ENVIRONMENTAL SENSITIVITY
    // ===========================================================================
    "rs10432782": {
        gene: "NFE2L2", trait: "Master antioxidant response (NRF2)", pillar: "Environmental Sensitivity",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "NRF2 high-activity variant — strong antioxidant gene expression response to environmental stressors",
        awareness_text: "NRF2 standard activity — antioxidant gene induction is more dependent on lifestyle inputs (sulforaphane, exercise, heat)",
        neutral_text: "One NRF2 variant"
    },
    "rs6721961": {
        gene: "NFE2L2", trait: "NRF2 pathway strength", pillar: "Environmental Sensitivity",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Strong NRF2 promoter activity at this position",
        awareness_text: "Reduced NRF2 promoter activity — sulforaphane and heat exposure are key NRF2 activators",
        neutral_text: "One NRF2 variant"
    },
    "rs1051740": {
        gene: "EPHX1", trait: "Environmental toxin processing", pillar: "Environmental Sensitivity",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard EPHX1 Y113 — efficient epoxide hydrolase function for environmental compound processing",
        awareness_text: "EPHX1 H113 variant — reduced epoxide hydrolase activity; air quality and chemical exposure management more relevant",
        neutral_text: "One EPHX1 variant"
    },
    "rs2234922": {
        gene: "EPHX1", trait: "Environmental compound detoxification", pillar: "Environmental Sensitivity",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard EPHX1 H139 function",
        awareness_text: "EPHX1 R139 variant — compound effect on epoxide hydrolase when paired with Y113H",
        neutral_text: "One EPHX1 variant"
    },
    "rs2071746": {
        gene: "HMOX1", trait: "Oxidative stress defense", pillar: "Environmental Sensitivity",
        genotypes: { TT: "positive", CT: "neutral", CC: "awareness" },
        positive_text: "HMOX1 short (GT)n repeat — higher heme oxygenase induction; stronger oxidative stress protection",
        awareness_text: "HMOX1 long (GT)n repeat — lower inducibility; antioxidant lifestyle factors more important",
        neutral_text: "One HMOX1 variant"
    },
    "rs1050450": {
        gene: "GPX1", trait: "Glutathione peroxidase activity", pillar: "Environmental Sensitivity",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard GPX1 Pro198 — efficient glutathione peroxidase activity",
        awareness_text: "GPX1 Leu198 variant — reduced glutathione peroxidase activity; selenium intake more important",
        neutral_text: "One GPX1 variant"
    },
    "rs713041": {
        gene: "GPX4", trait: "Lipid peroxidation defense", pillar: "Environmental Sensitivity",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard GPX4 function — efficient protection against lipid peroxidation",
        awareness_text: "GPX4 variant — reduced lipid peroxidation defense; omega-3 quality and antioxidant intake more relevant",
        neutral_text: "One GPX4 variant"
    },
    "rs2606345": {
        gene: "AHR", trait: "Environmental toxin sensor (AHR)", pillar: "Environmental Sensitivity",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard AHR pathway response to environmental compounds",
        awareness_text: "AHR variant — altered aryl hydrocarbon receptor sensitivity to dioxins, PCBs, and combustion byproducts",
        neutral_text: "One AHR variant"
    },
    "rs1056836": {
        gene: "CYP1B1", trait: "Carcinogen activation pathway", pillar: "Environmental Sensitivity",
        genotypes: { GG: "positive", CG: "neutral", CC: "awareness" },
        positive_text: "Standard CYP1B1 activity — typical procarcinogen activation rate",
        awareness_text: "CYP1B1 high-activity variant — elevated conversion of certain environmental compounds to reactive metabolites. Antioxidant support and chemical exposure reduction are most relevant",
        neutral_text: "One CYP1B1 variant"
    },
    // ===========================================================================
    // PHYSICAL TRAITS & SENSORY
    // ===========================================================================
    "rs12913832": {
        gene: "HERC2", trait: "Eye color determination", pillar: "Physical Traits",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "HERC2 AA — strongly associated with blue eyes in European-ancestry populations",
        awareness_text: "HERC2 GG — strongly associated with brown eyes",
        neutral_text: "HERC2 AG — intermediate eye color; green and hazel most common"
    },
    "rs1426654": {
        gene: "SLC24A5", trait: "Skin pigmentation", pillar: "Physical Traits",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "SLC24A5 AA — strongest known European skin lightening variant",
        awareness_text: "SLC24A5 GG — ancestral allele associated with darker skin pigmentation; sun protection may be more relevant for vitamin D synthesis",
        neutral_text: "SLC24A5 AG — intermediate pigmentation"
    },
    "rs17822931": {
        gene: "ABCC11", trait: "Earwax type and body odor", pillar: "Physical Traits",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "ABCC11 dry earwax type — also associated with reduced apocrine body odor in research",
        awareness_text: "ABCC11 wet earwax type — standard earwax and typical apocrine sweat gland activity",
        neutral_text: "One ABCC11 variant"
    },
    "rs713598": {
        gene: "TAS2R38", trait: "Bitter taste sensitivity", pillar: "Physical Traits",
        genotypes: { CC: "positive", CG: "neutral", GG: "awareness" },
        positive_text: "TAS2R38 taster — bitter compounds including glucosinolates (broccoli, Brussels sprouts) are strongly perceived",
        awareness_text: "TAS2R38 non-taster — bitter taste sensitivity reduced; cruciferous vegetables perceived as milder",
        neutral_text: "One TAS2R38 variant"
    },
    "rs1799971": {
        gene: "OPRM1", trait: "Pain sensitivity and opioid response", pillar: "Physical Traits",
        genotypes: { AA: "positive", AG: "neutral", GG: "awareness" },
        positive_text: "Standard OPRM1 mu-opioid receptor — typical pain threshold and opioid sensitivity",
        awareness_text: "OPRM1 G allele — altered opioid receptor function; pain management and opioid response may differ from population averages",
        neutral_text: "One OPRM1 variant"
    },
    "rs4654748": {
        gene: "SCN9A", trait: "Pain signal transmission", pillar: "Physical Traits",
        genotypes: { CC: "positive", CT: "neutral", TT: "awareness" },
        positive_text: "Standard SCN9A sodium channel — typical pain signal transmission",
        awareness_text: "SCN9A variant — associated with altered pain sensitivity in research; pain perception may be heightened or reduced",
        neutral_text: "One SCN9A variant"
    },
    "rs3827760": {
        gene: "EDAR", trait: "Hair follicle density and thickness", pillar: "Physical Traits",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard EDAR hair follicle development",
        awareness_text: "EDAR variant — associated with increased hair follicle density and thicker hair shafts in East Asian ancestry research",
        neutral_text: "One EDAR variant"
    },
    "rs2303081": {
        gene: "TAS1R1", trait: "Umami taste sensitivity", pillar: "Physical Traits",
        genotypes: { GG: "positive", AG: "neutral", AA: "awareness" },
        positive_text: "Standard umami taste receptor sensitivity — glutamate-rich foods perceived normally",
        awareness_text: "TAS1R1 variant — altered umami sensitivity; protein-rich food palatability may differ",
        neutral_text: "One TAS1R1 variant"
    }
};
// =============================================================================
// LOOKUP FUNCTION — Used by the genome interpreter
// =============================================================================
/** Get the classification for a single rsID + genotype pair.
 *  Returns null if the variant is not in the table (show neutral pending card). */
export function getVariantClassification(rsid, genotype) {
    const entry = VARIANT_CLASSIFICATIONS[rsid];
    if (!entry)
        return null;
    // Normalize and try both orderings
    const gt = genotype.toUpperCase().replace(/[\s\-_]/g, "");
    const gtSorted = [gt[0], gt[1]].sort().join("");
    const classification = entry.genotypes[gt] ??
        entry.genotypes[gtSorted] ??
        "neutral";
    return { classification, entry };
}
/** Get the descriptive text for a classification result */
export function getClassificationText(entry, classification) {
    switch (classification) {
        case "positive": return entry.positive_text;
        case "awareness": return entry.awareness_text;
        case "neutral": return entry.neutral_text;
        default: return "Research context for this variant is being reviewed.";
    }
}
