// /app/lib/nutritionGenomics.js
// Genomic nutrition intelligence engine.
// Maps variant calls (single-SNP + haplotype) to food recommendations,
// ingredient flags, and timing rules. Consumed by /app/nutrition
// (Your Foods / Food Journal / Scanner) and by /api/nutrition/product
// for barcode scan ingredient analysis.
//
// Structure: NUTRITION_RULES is a keyed object. Each rule has a `trigger`
// (single condition) or `trigger_any` (any of several). Triggers are
// evaluated against a flat { rsid: genotype } map plus an optional
// haplotype-results object of the shape { mthfr: { haplotype: '...' } }.

export const NUTRITION_RULES = {
  // ============================================================
  // METHYLATION — MTHFR / MTR / MTRR / BHMT
  // ============================================================
  mthfr_compound_het: {
    trigger: { haplotype: 'mthfr', statuses: ['compound_heterozygous', '677_heterozygous', '677_homozygous', '1298_homozygous'] },
    title: 'Methylation Support',
    pillar: 'Genomics',
    priority: 'high',
    prioritize_foods: [
      { food: 'Chicken liver', reason: 'Richest food source of active folate (5-MTHF). One serving provides more bioavailable folate than most supplements.', nutrients: ['folate', 'B12', 'choline'], weekly_target: '2–3 servings' },
      { food: 'Beef liver', reason: 'Complete B-vitamin profile including pre-formed folate your MTHFR variant can use directly.', nutrients: ['folate', 'B12', 'B6', 'riboflavin'], weekly_target: '1–2 servings' },
      { food: 'Spinach (raw)', reason: 'High in natural folate — not synthetic folic acid. Raw preserves more folate than cooked.', nutrients: ['folate'], daily_target: '2+ cups' },
      { food: 'Arugula', reason: 'Natural folate source that bypasses the MTHFR conversion step.', nutrients: ['folate'], daily_target: 'Include in meals' },
      { food: 'Asparagus', reason: 'One of the highest natural folate foods per serving.', nutrients: ['folate'], weekly_target: '3–4 servings' },
      { food: 'Romaine lettuce', reason: 'Natural folate source, easy daily inclusion.', nutrients: ['folate'], daily_target: 'Large portion daily' },
      { food: 'Avocado', reason: 'Natural folate plus healthy fats that support nutrient absorption.', nutrients: ['folate', 'B5'], daily_target: 'Half to one daily' },
      { food: 'Lentils', reason: 'High natural folate — cook from dry (canned may have additives).', nutrients: ['folate', 'iron'], weekly_target: '2–3 servings' },
      { food: 'Black beans', reason: 'Natural folate and fiber for gut health.', nutrients: ['folate'], weekly_target: '2–3 servings' },
      { food: 'Sunflower seeds', reason: 'Good natural folate source plus vitamin E.', nutrients: ['folate', 'B6'], daily_target: 'Small handful' },
      { food: 'Eggs (pasture-raised)', reason: 'Choline — essential for the betaine pathway that can compensate for reduced MTHFR activity.', nutrients: ['choline', 'B12'], daily_target: '2–4 eggs' },
      { food: 'Beets', reason: 'Betaine — directly feeds the BHMT methylation pathway that compensates when MTHFR is impaired.', nutrients: ['betaine'], weekly_target: '2–3 servings' },
      { food: 'Quinoa', reason: 'Contains betaine and natural folate — better grain choice than fortified wheat.', nutrients: ['betaine', 'folate'], weekly_target: 'Replace fortified grains' },
    ],
    avoid_foods: [
      { food: 'US fortified wheat products', reason: 'US law requires synthetic folic acid fortification of wheat flour. Your MTHFR variant cannot efficiently convert synthetic folic acid to the active methylfolate form. This can actually block active folate by competing for the same receptors.', severity: 'high', examples: ['White bread', 'Most breakfast cereals', 'Standard pasta', 'Crackers', 'Most baked goods'] },
      { food: 'Synthetic folic acid supplements', reason: 'Same as fortified wheat — unmetabolized folic acid competes with active methylfolate.', severity: 'high', notes: 'Look for 5-MTHF or methylfolate on supplement labels instead' },
      { food: 'Standard multivitamins with folic acid', reason: 'Most mass-market multivitamins use synthetic folic acid. Check for methylfolate instead.', severity: 'moderate' },
    ],
    ingredient_flags: [
      { ingredient: 'folic acid', flag: 'MTHFR — synthetic folic acid. Your variant prefers methylfolate from food or 5-MTHF supplements.', severity: 'high' },
      { ingredient: 'folate', flag: 'Check source — natural folate from food is fine. Synthetic folic acid is not ideal for your MTHFR variant.', severity: 'low' },
      { ingredient: 'enriched flour', flag: 'Contains synthetic folic acid via US fortification law. MTHFR variant cannot efficiently convert this.', severity: 'high' },
      { ingredient: 'enriched wheat flour', flag: 'Contains synthetic folic acid. MTHFR variant — prefer non-enriched or European wheat.', severity: 'high' },
      { ingredient: 'wheat flour enriched', flag: 'US fortified wheat — synthetic folic acid. Suboptimal for MTHFR variants.', severity: 'high' },
    ],
    educational_note: 'US wheat is legally required to be fortified with synthetic folic acid since 1998. European wheat is not fortified the same way — this is why some people with MTHFR variants feel better eating European breads. The issue is not gluten — it is the synthetic folic acid that your enzyme cannot efficiently convert to the active form your body needs.',
  },

  // ============================================================
  // VITAMIN A — BCMO1
  // ============================================================
  bcmo1_reduced: {
    trigger: { rsid: 'rs12934922', genotype: 'AA' },
    title: 'Vitamin A — Preformed Sources',
    pillar: 'Nutrition',
    priority: 'high',
    prioritize_foods: [
      { food: 'Beef liver', reason: 'Highest preformed vitamin A (retinol) of any food. Your BCMO1 variant means you convert plant beta-carotene at approximately 70% lower efficiency than average — preformed retinol bypasses the conversion entirely.', nutrients: ['retinol'], weekly_target: '1–2 servings (3oz)' },
      { food: 'Chicken liver', reason: 'High preformed retinol — directly usable by your body without conversion.', nutrients: ['retinol'], weekly_target: '2–3 servings' },
      { food: 'Cod liver oil', reason: 'Preformed vitamin A plus D3 and omega-3. One of the most complete single-food supplements for your profile.', nutrients: ['retinol', 'D3', 'EPA', 'DHA'], daily_target: '1 tsp or 2 capsules' },
      { food: 'Egg yolks (pasture-raised)', reason: 'Preformed retinol in yolk — pasture-raised have significantly more than conventional.', nutrients: ['retinol'], daily_target: '3–4 yolks' },
      { food: 'Whole milk (grass-fed)', reason: 'Retinol plus K2 — fat-soluble vitamins are higher in grass-fed.', nutrients: ['retinol', 'K2'], notes: 'Avoid low-fat — vitamin A is removed with the fat' },
      { food: 'Butter (grass-fed)', reason: 'Retinol and K2 — good daily source in cooking.', nutrients: ['retinol', 'K2'], daily_target: '1–2 tbsp' },
      { food: 'Salmon (wild)', reason: 'Retinol plus astaxanthin — a carotenoid that is absorbed independently of BCMO1.', nutrients: ['retinol', 'astaxanthin', 'EPA', 'DHA'], weekly_target: '3–4 servings' },
    ],
    limit_foods: [
      { food: 'Carrots as primary vitamin A source', reason: 'Beta-carotene only — requires BCMO1 conversion you do at 70% lower efficiency. Fine as a vegetable but do not rely on them for vitamin A.', severity: 'low' },
      { food: 'Sweet potato as vitamin A source', reason: 'Same BCMO1 issue. Nutritious food but not an efficient vitamin A source for your variant.', severity: 'low' },
      { food: 'Plant-based vitamin A supplements (beta-carotene)', reason: 'Any supplement listing beta-carotene as the vitamin A source is ineffective for your variant. Look for retinyl palmitate or retinyl acetate.', severity: 'high' },
    ],
    ingredient_flags: [
      { ingredient: 'beta-carotene', flag: 'BCMO1 AA — beta-carotene is a poor vitamin A source for your variant. 70% reduced conversion efficiency. Preformed retinol sources are more effective.', severity: 'moderate' },
      { ingredient: 'vitamin a (beta-carotene)', flag: 'BCMO1 variant — this form of vitamin A requires conversion you do less efficiently. Prefer retinol.', severity: 'high' },
    ],
    educational_note: 'Most plant-based vitamin A is beta-carotene, which the body must convert to retinol using the BCMO1 enzyme. Your AA genotype at rs12934922 is associated with approximately 70% lower conversion efficiency in research studies.',
  },

  // ============================================================
  // OMEGA-3 — FADS1/2
  // ============================================================
  fads_reduced: {
    trigger: { haplotype: 'fads', statuses: ['reduced', 'reduced_conversion', 'homozygous_minor', 'heterozygous'] },
    title: 'Omega-3 — Direct Marine Sources',
    pillar: 'Nutrition',
    priority: 'high',
    prioritize_foods: [
      { food: 'Sardines (canned in water or olive oil)', reason: 'Highest EPA/DHA per calorie of any food. Pre-formed omega-3 — no FADS1 conversion required.', nutrients: ['EPA', 'DHA'], weekly_target: '4–5 servings' },
      { food: 'Wild salmon (sockeye)', reason: 'High EPA/DHA. Sockeye has more than Atlantic farmed.', nutrients: ['EPA', 'DHA'], weekly_target: '3–4 servings' },
      { food: 'Mackerel', reason: 'One of the richest EPA/DHA sources. Often overlooked.', nutrients: ['EPA', 'DHA'], weekly_target: '2–3 servings' },
      { food: 'Herring', reason: 'Very high EPA/DHA per serving, also high in B12.', nutrients: ['EPA', 'DHA', 'B12'], weekly_target: '2–3 servings' },
      { food: 'Oysters', reason: 'EPA/DHA plus zinc and copper — comprehensive micronutrient profile.', nutrients: ['EPA', 'DHA', 'zinc', 'copper'], weekly_target: '1–2 servings' },
      { food: 'Algae oil', reason: 'Plant-based direct DHA/EPA (not ALA) — derived from the algae that fish eat. Bypasses FADS conversion entirely.', nutrients: ['DHA', 'EPA'], notes: 'Best plant-based option for FADS variants' },
      { food: 'Anchovies', reason: 'Pre-formed EPA/DHA. Versatile cooking ingredient.', nutrients: ['EPA', 'DHA'], weekly_target: 'Several times per week' },
    ],
    limit_foods: [
      { food: 'Flaxseed as omega-3 source', reason: 'ALA only — requires FADS1 conversion to EPA/DHA that you do less efficiently. Still a good food, but do not rely on it for omega-3.', severity: 'low' },
      { food: 'Chia seeds as omega-3 source', reason: 'Same ALA issue. Great food overall but not an efficient omega-3 source for your variant.', severity: 'low' },
      { food: 'Walnuts as omega-3 source', reason: 'ALA — FADS1 conversion required. Healthy food but not a substitute for marine omega-3.', severity: 'low' },
    ],
    ingredient_flags: [
      { ingredient: 'flaxseed oil', flag: 'FADS1/2 reduced conversion — ALA in flax requires conversion to EPA/DHA you do less efficiently. Algae or fish oil is more effective for your variant.', severity: 'low' },
      { ingredient: 'flax oil', flag: 'Same as above — ALA source, suboptimal for FADS1/2 reduced variant.', severity: 'low' },
    ],
    educational_note: 'FADS1 and FADS2 enzymes convert plant-based ALA omega-3 (from flax, chia, walnuts) into the EPA and DHA your brain and cells actually use. Your variant cluster is associated with reduced conversion efficiency.',
  },

  // ============================================================
  // LACTOSE — LCT
  // ============================================================
  lct_intolerant: {
    trigger: { rsid: 'rs4988235', genotype: 'GG' },
    title: 'Lactose Tolerance',
    pillar: 'Nutrition',
    priority: 'moderate',
    avoid_foods: [
      { food: 'Regular milk', reason: 'High lactose — your LCT GG genotype means lactase enzyme declines after childhood.', severity: 'high' },
      { food: 'Soft fresh cheeses (ricotta, cottage cheese, cream cheese)', reason: 'Higher lactose content than aged cheeses.', severity: 'moderate' },
      { food: 'Ice cream and milk-based desserts', reason: 'High lactose.', severity: 'moderate' },
      { food: 'Whey protein concentrates', reason: 'Contains lactose — whey isolate has less. Check labels.', severity: 'moderate' },
    ],
    tolerated_foods: [
      { food: 'Hard aged cheeses (parmesan, cheddar, gruyere)', reason: 'Lactose is consumed by bacteria during aging — very low lactose remaining.', notes: 'Generally well-tolerated' },
      { food: 'Butter and ghee', reason: 'Fat only — almost zero lactose.', notes: 'Well-tolerated' },
      { food: 'Fermented dairy (kefir, full-fat yogurt)', reason: 'Live cultures pre-digest most lactose.', notes: 'Usually well-tolerated' },
      { food: 'Lactase-treated dairy', reason: 'Lactose pre-broken down. Good option when dairy is desired.', notes: 'Well-tolerated' },
    ],
    ingredient_flags: [
      { ingredient: 'milk', flag: 'LCT non-persistence — may cause digestive symptoms. Hard aged cheeses, fermented dairy, or lactose-free versions are better tolerated.', severity: 'moderate' },
      { ingredient: 'lactose', flag: 'LCT variant — direct lactose. May cause digestive symptoms.', severity: 'high' },
      { ingredient: 'whey', flag: 'Check if concentrate or isolate — concentrate contains lactose, isolate has minimal.', severity: 'low' },
      { ingredient: 'milk powder', flag: 'Concentrated lactose source — likely to cause symptoms.', severity: 'high' },
      { ingredient: 'milk solids', flag: 'Concentrated lactose. LCT variant — likely to cause symptoms.', severity: 'high' },
    ],
  },

  // ============================================================
  // CAFFEINE — CYP1A2
  // ============================================================
  cyp1a2_slow: {
    trigger: { rsid: 'rs762551', genotypes: ['AC', 'CA', 'CC'] },
    title: 'Caffeine Metabolism',
    pillar: 'Nutrition',
    priority: 'moderate',
    timing_rules: [
      { rule: 'caffeine_cutoff', description: 'Caffeine cutoff: no caffeine after 12:00 PM noon for CYP1A2 slow metabolizers. Half-life of 6–10 hours means afternoon coffee is still active at midnight.', trigger_after: '12:00', severity: 'high' },
      { rule: 'daily_limit', description: 'Daily caffeine ceiling: 200mg maximum. Slow metabolizers have 2–3x higher cardiovascular sensitivity to caffeine than fast metabolizers at equivalent doses.', limit_mg: 200 },
    ],
    prioritize_foods: [
      { food: 'Green tea (matcha)', reason: 'Lower caffeine than coffee plus L-theanine which moderates caffeine’s effects. Better suited to slow metabolizers.', nutrients: ['L-theanine'], notes: 'Caffeine ~30–70mg per cup' },
      { food: 'White tea', reason: 'Lowest caffeine of tea varieties — easy to stay within slow metabolizer ceiling.', notes: 'Caffeine ~15–30mg per cup' },
    ],
    limit_foods: [
      { food: 'Espresso (after noon)', reason: 'CYP1A2 slow — caffeine half-life 6–10 hours. Afternoon espresso is still circulating at midnight.', severity: 'high', timing: 'after_noon' },
      { food: 'Energy drinks', reason: 'Often exceed 200mg caffeine in a single serving — over the slow metabolizer daily ceiling.', severity: 'high' },
      { food: 'Pre-workout supplements', reason: 'High caffeine — check total against 200mg daily limit for slow metabolizers.', severity: 'moderate' },
    ],
    ingredient_flags: [
      { ingredient: 'caffeine', flag: 'CYP1A2 slow metabolizer — check total daily caffeine. Research suggests ceiling of ~200mg/day and no consumption after noon for slow metabolizers.', severity: 'high' },
      { ingredient: 'coffee', flag: 'CYP1A2 slow — track timing and total daily amount.', severity: 'moderate' },
      { ingredient: 'guarana', flag: 'Caffeine source — counts toward daily limit.', severity: 'moderate' },
      { ingredient: 'green tea extract', flag: 'Caffeine source — counts toward daily limit.', severity: 'low' },
      { ingredient: 'kola nut', flag: 'Natural caffeine source.', severity: 'low' },
    ],
    educational_note: 'CYP1A2 AC/CC (slow metabolizer) means caffeine is cleared more slowly from your bloodstream. Research specifically in slow metabolizers shows elevated hypertension and cardiac event risk with high caffeine intake — an association NOT seen in fast metabolizers.',
  },

  // ============================================================
  // FAT METABOLISM — PPARA
  // ============================================================
  ppara_enhanced: {
    trigger: { rsid: 'rs4253778', genotype: 'GG' },
    title: 'Fat Oxidation — PPARA Enhanced',
    pillar: 'Nutrition',
    priority: 'moderate',
    prioritize_foods: [
      { food: 'Grass-fed beef', reason: 'Your PPARA GG genotype enhances fat oxidation signaling — quality dietary fat is well-utilized.', nutrients: ['saturated fat', 'CLA', 'zinc'] },
      { food: 'Avocado', reason: 'Monounsaturated fat — highly compatible with enhanced PPARA fat oxidation.', nutrients: ['oleic acid', 'folate'] },
      { food: 'Olive oil (extra virgin)', reason: 'Oleic acid activates PPARA directly. One of the best dietary fat sources for this genotype.', nutrients: ['oleic acid', 'polyphenols'] },
      { food: 'Macadamia nuts', reason: 'Very high monounsaturated fat — excellent PPARA fuel.', nutrients: ['oleic acid'] },
      { food: 'Coconut oil (MCT)', reason: 'MCTs are rapidly oxidized via PPARA pathway — particularly well-suited to this genotype.', nutrients: ['MCT', 'lauric acid'] },
      { food: 'Fatty fish', reason: 'EPA/DHA activate PPARA directly in research. Dual benefit for this genotype.', nutrients: ['EPA', 'DHA'] },
      { food: 'Pasture-raised eggs', reason: 'Cholesterol and saturated fat — PPARA GG handles dietary fat well.', nutrients: ['choline', 'retinol'] },
    ],
    limit_foods: [
      { food: 'High-carb processed foods', reason: 'Your PPARA genotype is optimized for fat fuel.', severity: 'low' },
      { food: 'Industrial seed oils (soybean, canola, corn)', reason: 'High omega-6 linoleic acid — can blunt PPARA signaling despite the genotype advantage.', severity: 'moderate' },
    ],
    ingredient_flags: [
      { ingredient: 'soybean oil', flag: 'High omega-6 — may blunt PPARA fat oxidation signaling.', severity: 'low' },
      { ingredient: 'canola oil', flag: 'High omega-6 linoleic acid — suboptimal for PPARA-enhanced fat metabolism.', severity: 'low' },
      { ingredient: 'corn oil', flag: 'High omega-6 — suboptimal for PPARA fat oxidation.', severity: 'low' },
      { ingredient: 'cottonseed oil', flag: 'Very high omega-6 — suboptimal for PPARA.', severity: 'moderate' },
    ],
  },

  // ============================================================
  // MEAL TIMING — MTNR1B
  // ============================================================
  mtnr1b_risk: {
    trigger: { rsid: 'rs10830963', genotype: 'GG' },
    title: 'Meal Timing — Critical',
    pillar: 'Nutrition',
    priority: 'critical',
    timing_rules: [
      { rule: 'eating_cutoff', description: 'Last meal by 6:30 PM absolute. MTNR1B GG means melatonin receptor activation impairs insulin secretion — eating after 6:30 PM compounds this directly.', cutoff_time: '18:30', severity: 'critical' },
      { rule: 'breakfast_timing', description: 'Eat within 1–2 hours of waking. Delaying breakfast extends the overnight fasting window when insulin sensitivity is already modified by melatonin receptor activity.', severity: 'moderate' },
    ],
    prioritize_foods: [
      { food: 'Low-glycemic foods at dinner', reason: 'Whatever is eaten before the 6:30 PM cutoff should be lower glycemic to minimize post-meal glucose load.' },
      { food: 'Protein and fat dominant dinner', reason: 'Slower glucose response — appropriate before the melatonin onset window.' },
    ],
    educational_note: 'MTNR1B GG is the strongest known nutrigenomics timing finding. Melatonin activates receptors on pancreatic beta cells and suppresses insulin secretion — eating carbohydrates after 6:30 PM directly compounds this suppression.',
  },

  // ============================================================
  // CONNECTIVE TISSUE — COL5A1 + MMP1
  // ============================================================
  connective_tissue_support: {
    trigger_any: [
      { rsid: 'rs12722', genotype: 'TT' },
      { rsid: 'rs1799750', genotype: 'DD' },
    ],
    title: 'Collagen Synthesis Support',
    pillar: 'Sports Performance',
    priority: 'high',
    prioritize_foods: [
      { food: 'Bone broth (homemade or quality packaged)', reason: 'Collagen peptides plus glycine and proline — the amino acids used for connective tissue synthesis.', nutrients: ['glycine', 'proline', 'hydroxyproline'], timing: '30–45 min before training', weekly_target: 'Daily if training' },
      { food: 'Chicken feet / skin-on chicken', reason: 'High collagen content — particularly skin and cartilage.', nutrients: ['collagen', 'glycine'] },
      { food: 'Bell peppers (red)', reason: 'Highest vitamin C of common vegetables — vitamin C is required for collagen cross-linking.', nutrients: ['vitamin C'], timing: 'Pair with collagen foods' },
      { food: 'Citrus (kiwi, oranges, lemon)', reason: 'Vitamin C for collagen synthesis — the enzyme that cross-links collagen requires vitamin C as a cofactor.', nutrients: ['vitamin C'] },
      { food: 'Berries (strawberry, blueberry)', reason: 'Vitamin C plus anthocyanins that protect existing collagen from degradation.', nutrients: ['vitamin C', 'anthocyanins'] },
      { food: 'Sulfur-rich vegetables (garlic, onion, leek)', reason: 'Sulfur is required for collagen cross-linking — often overlooked.', nutrients: ['sulfur compounds'] },
      { food: 'Shellfish (shrimp, crab)', reason: 'Glycine and zinc — both required for collagen synthesis.', nutrients: ['glycine', 'zinc'] },
    ],
    educational_note: 'COL5A1 TT and MMP1 DD together mean your connective tissue both has lower tensile strength than average (COL5A1) and degrades faster (MMP1). Dietary collagen provides the specific amino acids used for repair.',
  },

  // ============================================================
  // GUT HEALTH — NOD2 / FUT2
  // ============================================================
  gut_support: {
    trigger_any: [
      { rsid: 'rs2066842', genotype: 'CT' },
      { rsid: 'rs601338', genotype: 'GG' },
      { rsid: 'rs601338', genotype: 'AA' },
    ],
    title: 'Gut Microbiome Support',
    pillar: 'General Wellness',
    priority: 'moderate',
    prioritize_foods: [
      { food: 'Jerusalem artichoke (sunchoke)', reason: 'Highest inulin content of any food — inulin is the prebiotic fiber that specifically feeds Bifidobacterium.', nutrients: ['inulin'], notes: 'Start with small amounts — can cause gas initially' },
      { food: 'Chicory root', reason: 'Primary source of commercial inulin — raw chicory has very high prebiotic content.', nutrients: ['inulin'] },
      { food: 'Garlic (raw)', reason: 'FOS (fructooligosaccharides) — prebiotic that specifically feeds Bifidobacterium and Lactobacillus.', nutrients: ['FOS', 'allicin'] },
      { food: 'Leek', reason: 'Good inulin source — milder than garlic, easy daily inclusion.', nutrients: ['inulin'] },
      { food: 'Asparagus', reason: 'Prebiotic fiber plus natural folate.', nutrients: ['inulin', 'folate'] },
      { food: 'Kefir (if tolerated)', reason: 'Live Lactobacillus and Bifidobacterium cultures — directly relevant to FUT2 non-secretor gut microbiome.', nutrients: ['Lactobacillus', 'Bifidobacterium'] },
      { food: 'Fermented vegetables (kimchi, sauerkraut)', reason: 'Live cultures plus prebiotic fiber.', nutrients: ['Lactobacillus'] },
    ],
    avoid_foods: [
      { food: 'Foods with carrageenan', reason: 'Emulsifier associated with gut barrier disruption in research — particularly relevant for NOD2 variant gut inflammation profile.', severity: 'moderate' },
      { food: 'Foods with polysorbate 80', reason: 'Emulsifier — research links to gut microbiome disruption and increased gut permeability.', severity: 'moderate' },
      { food: 'Artificial sweeteners (sucralose, saccharin, aspartame)', reason: 'Research associates some artificial sweeteners with gut microbiome disruption — relevant for NOD2 variant.', severity: 'low' },
    ],
    ingredient_flags: [
      { ingredient: 'carrageenan', flag: 'NOD2 variant — carrageenan is associated with gut inflammation and microbiome disruption in research. Consider avoiding.', severity: 'moderate' },
      { ingredient: 'polysorbate 80', flag: 'NOD2 variant — emulsifier linked to gut barrier disruption in research.', severity: 'moderate' },
      { ingredient: 'polysorbate 60', flag: 'Emulsifier — same concern as polysorbate 80 for NOD2 variant.', severity: 'moderate' },
      { ingredient: 'sucralose', flag: 'Some research links sucralose to gut microbiome disruption — relevant for gut-sensitive genotypes.', severity: 'low' },
      { ingredient: 'saccharin', flag: 'Artificial sweetener with gut microbiome concerns in research.', severity: 'low' },
    ],
  },

  // ============================================================
  // BLOOD SUGAR — TCF7L2
  // ============================================================
  tcf7l2_risk: {
    trigger: { rsid: 'rs7903146', genotypes: ['TT', 'CT'] },
    title: 'Blood Sugar Regulation',
    pillar: 'Nutrition',
    priority: 'high',
    prioritize_foods: [
      { food: 'Vinegar (apple cider, red wine)', reason: 'Acetic acid blunts post-meal glucose spikes — research shows 20–30% reduction in glycemic response when taken before starchy meals.', nutrients: ['acetic acid'], timing: '1–2 tbsp before meals' },
      { food: 'Berries', reason: 'Low glycemic, high fiber, anthocyanins improve insulin sensitivity.', nutrients: ['anthocyanins', 'fiber'] },
      { food: 'Legumes (lentils, chickpeas, black beans)', reason: 'Very low glycemic index — slow glucose release well-suited to TCF7L2 risk genotype.', nutrients: ['fiber', 'protein', 'folate'] },
      { food: 'Leafy greens', reason: 'Magnesium content — magnesium deficiency is associated with impaired insulin signaling.', nutrients: ['magnesium', 'folate'] },
      { food: 'Cinnamon', reason: 'Research on cinnamon extract shows improved insulin sensitivity — modest effect but relevant for this genotype.', nutrients: ['cinnamaldehyde'] },
    ],
    avoid_foods: [
      { food: 'Refined carbohydrates on their own', reason: 'TCF7L2 TT is associated with impaired incretin effect — beta cell response to glucose is blunted.', severity: 'moderate' },
      { food: 'Sugary drinks', reason: 'Liquid glucose with no fiber buffer — worst delivery for TCF7L2 risk genotype.', severity: 'high' },
      { food: 'White bread, white rice alone', reason: 'High glycemic, no fiber buffer — avoid eating alone without protein or fat.', severity: 'moderate' },
    ],
    ingredient_flags: [
      { ingredient: 'high fructose corn syrup', flag: 'TCF7L2 risk — rapid glucose/fructose load. Strongly associated with worsened insulin response.', severity: 'high' },
      { ingredient: 'sugar', flag: 'TCF7L2 risk — track total added sugars against daily target.', severity: 'moderate' },
      { ingredient: 'glucose syrup', flag: 'Fast glucose — relevant for TCF7L2 blood sugar regulation.', severity: 'moderate' },
      { ingredient: 'corn syrup', flag: 'Rapid glucose delivery — suboptimal for TCF7L2 risk genotype.', severity: 'moderate' },
      { ingredient: 'dextrose', flag: 'Pure glucose — fast glycemic load. TCF7L2 risk.', severity: 'moderate' },
    ],
    educational_note: 'TCF7L2 is the strongest common genetic signal for type 2 diabetes risk in population research. The mechanism involves the incretin effect — your genotype is associated with a blunted response, meaning post-meal insulin secretion is less vigorous than average.',
  },
}

// Priority ordering for display + sort.
const PRIORITY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 }

function normalizeGT(gt) {
  if (!gt) return ''
  return String(gt).toUpperCase().replace(/[\s\-_/|]/g, '')
}

function genotypeMatches(observed, expected) {
  if (!observed || !expected) return false
  const o = normalizeGT(observed)
  // Match either the exact expected or its reverse (AG === GA) so we don't
  // miss variants that upstream returned in an unusual allele order.
  const e = normalizeGT(expected)
  const eRev = e.length === 2 ? e[1] + e[0] : e
  return o === e || o === eRev
}

/**
 * Given a { rsid: genotype } map and optional { haplotype: { haplotype:
 * 'compound_heterozygous' } } object, return the active rules sorted by
 * priority. Rules with `trigger.rsid` + `genotype` or `genotypes[]` match
 * against the map; rules with `trigger.haplotype` + `statuses[]` match
 * against the haplotype map; `trigger_any` matches on any listed rsid+gt.
 */
export function getActiveNutritionRules(rsidGenotypes = {}, haplotypeResults = {}) {
  const active = []
  for (const [key, rule] of Object.entries(NUTRITION_RULES)) {
    let triggered = false

    if (rule.trigger) {
      const t = rule.trigger
      if (t.haplotype) {
        const r = haplotypeResults[t.haplotype]
        const hap = r?.haplotype || r?.name || r
        if (t.statuses && t.statuses.includes(hap)) triggered = true
        if (t.status && hap === t.status) triggered = true
        // FADS classifier emits many labels for the same phenotype — treat
        // any "reduced conversion" state as a match on the fads rule.
        if (!triggered && t.haplotype === 'fads' && FADS_REDUCED_LABELS.has(hap)) triggered = true
      } else if (t.rsid) {
        const observed = rsidGenotypes[t.rsid]
        if (observed) {
          if (t.genotype && genotypeMatches(observed, t.genotype)) triggered = true
          if (t.genotypes && t.genotypes.some((g) => genotypeMatches(observed, g))) triggered = true
        }
      }
    }

    if (!triggered && Array.isArray(rule.trigger_any)) {
      for (const t of rule.trigger_any) {
        const observed = rsidGenotypes[t.rsid]
        if (observed && genotypeMatches(observed, t.genotype)) {
          triggered = true
          break
        }
      }
    }

    if (triggered) active.push({ key, ...rule })
  }

  active.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3))
  return active
}

/**
 * Scan a raw ingredient-list string against every ingredient_flag defined
 * on the active rules. Returns { flags: [], severityCounts: { high, moderate, low } }
 * for downstream compatibility grading.
 */
export function scanIngredients(ingredientText, activeRules) {
  const flags = []
  const severityCounts = { high: 0, moderate: 0, low: 0 }
  if (!ingredientText || !activeRules?.length) return { flags, severityCounts }

  const text = String(ingredientText).toLowerCase()

  for (const rule of activeRules) {
    const ruleFlags = rule.ingredient_flags || []
    for (const f of ruleFlags) {
      if (!f.ingredient) continue
      if (text.includes(f.ingredient.toLowerCase())) {
        // Dedupe by ingredient + rule so we don't double-flag when the same
        // ingredient appears twice in the label.
        const dupe = flags.some((x) => x.ingredient === f.ingredient && x.rule_key === rule.key)
        if (dupe) continue
        flags.push({
          ingredient: f.ingredient,
          flag: f.flag,
          severity: f.severity || 'low',
          rule_key: rule.key,
          rule_title: rule.title,
          gene_context: rule.trigger?.rsid || rule.trigger?.haplotype || 'multiple',
        })
        severityCounts[f.severity || 'low'] = (severityCounts[f.severity || 'low'] || 0) + 1
      }
    }
  }
  return { flags, severityCounts }
}

/**
 * Convert flag severity mix into a letter compatibility grade:
 *   A = 0 flags
 *   B = only low-severity flags
 *   C = at least one moderate flag but no high
 *   D = any high-severity flag
 */
export function gradeCompatibility(severityCounts) {
  if (!severityCounts || (!severityCounts.high && !severityCounts.moderate && !severityCounts.low)) return 'A'
  if (severityCounts.high) return 'D'
  if (severityCounts.moderate) return 'C'
  return 'B'
}

export function gradeToLabel(grade) {
  switch (grade) {
    case 'A': return 'Good choice for your profile'
    case 'B': return 'Generally OK — minor considerations'
    case 'C': return 'Use occasionally — review flagged ingredients'
    case 'D': return 'Consider alternatives for your genomic profile'
    default:  return ''
  }
}

/**
 * Return a `{ rsid: genotype }` map and a `{ haplotype: {haplotype} }`
 * object built from a SelfScience genome report. The report may store
 * haplotype interpretations directly in the `genotype_called` field
 * (e.g. `compound_heterozygous`, `677_homozygous`, `e3/e3`, `val_met`)
 * for known multi-SNP calls — we route these to haplotypeResults so
 * rules like `mthfr_compound_het` and `fads_reduced` match.
 */
const HAPLOTYPE_ANCHOR_RSID = {
  rs1801133: 'mthfr',
  rs1801131: 'mthfr',
  rs174537:  'fads',
  rs174547:  'fads',
  rs1535:    'fads',
  rs3834458: 'fads',
  rs429358:  'apoe',
  rs7412:    'apoe',
  rs4680:    'comt',
  rs1815739: 'actn3',
}

// Two-letter [ACGT] pair is a raw genotype. Anything else — underscores,
// slashes, words like `mixed`, `unknown`, `compound_heterozygous` — is
// treated as a haplotype label.
function looksLikeRawGenotype(gt) {
  if (!gt) return false
  const s = String(gt).trim()
  if (s.length !== 2) return false
  return /^[ACGT]{2}$/i.test(s) || /^[ACGT][ACGT-]$/i.test(s)
}

// FADS classifier emits a variety of labels; anything indicating a slow /
// reduced / heterozygous minor allele state should trigger the FADS rule.
const FADS_REDUCED_LABELS = new Set([
  'reduced', 'reduced_conversion', 'homozygous_minor', 'heterozygous',
  'slow', 'compound_heterozygous', 'minor_homozygous',
])

export function extractGenotypesFromReport(report) {
  const rsidGenotypes = {}
  const haplotypeResults = {}
  if (!report) return { rsidGenotypes, haplotypeResults }

  const routeVariant = (rsid, gt, gene) => {
    if (!rsid || !gt) return
    const hapKey = HAPLOTYPE_ANCHOR_RSID[rsid]
    if (hapKey && !looksLikeRawGenotype(gt)) {
      if (!haplotypeResults[hapKey]) haplotypeResults[hapKey] = { haplotype: gt }
      return
    }
    if (!rsidGenotypes[rsid]) rsidGenotypes[rsid] = gt
    if (gene && !rsidGenotypes[gene.toUpperCase()]) {
      rsidGenotypes[gene.toUpperCase()] = gt
    }
  }

  for (const v of report.variants_recognized || []) {
    routeVariant(v?.rsid, v?.genotype_called, v?.gene)
  }
  for (const group of report.fullReport || []) {
    for (const v of group.variants || []) {
      routeVariant(v?.rsid, v?.genotype, v?.gene)
      if (v?.is_haplotype && v?.gene) {
        const key = v.gene.toLowerCase()
        if (!haplotypeResults[key]) haplotypeResults[key] = { haplotype: v.haplotype_name || v.genotype }
      }
    }
  }
  const overviewLists = [
    ...(report.overview?.strengths || []),
    ...(report.overview?.areasToExplore || []),
  ]
  for (const c of overviewLists) {
    routeVariant(c?.rsid, c?.genotype, c?.gene)
    if (c?.is_haplotype && c?.gene) {
      const key = c.gene.toLowerCase()
      if (!haplotypeResults[key]) haplotypeResults[key] = { haplotype: c.haplotype_name || c.genotype }
    }
  }

  return { rsidGenotypes, haplotypeResults }
}

export const NUTRITION_DISCLAIMER =
  'Food recommendations are based on research associations between genetic variants and nutrient metabolism. They are educational suggestions, not a prescribed diet or medical nutrition therapy. Individual responses vary significantly. Consult a registered dietitian for personalized medical nutrition therapy.'

export const SCANNER_DISCLAIMER =
  'Product analysis is based on ingredient genomic associations from published research. It is for educational awareness — not a medical dietary prescription. Ingredients may affect individuals differently regardless of genotype.'

export const ALLERGEN_DISCLAIMER =
  'This is a research association based on your genetic variant — not a confirmed allergy or intolerance. Genetic variants create tendencies, not certainties. If you suspect a food sensitivity, discuss with your healthcare provider.'
