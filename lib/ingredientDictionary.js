// /app/lib/ingredientDictionary.js
// Universal food-ingredient encyclopedia + universal red-flag scanner.
//
// Everything here is genome-INDEPENDENT — these are the ingredients the
// SelfScience nutrition hub should teach every user about, whether or not
// they have uploaded a genome. Genomic rules (methylation, PGx caffeine,
// etc.) live in nutritionGenomics.js and layer ON TOP of these findings.
//
// Categories:
//   seed_oil, emulsifier, preservative, artificial_color, sweetener,
//   sugar, dye, gum, flour, additive, packaging, contamination, beneficial
//
// Severity levels:
//   universal_avoid  — research strongly supports minimizing (BHA, HFCS, ...)
//   universal_limit  — research suggests moderation (seed oils, palm oil, ...)
//   caution          — case-by-case relevance (soy lecithin, some emulsifiers)
//   beneficial       — actively good for most people
//   neutral          — informational only, no strong flag either way

export const INGREDIENT_DICTIONARY = {
  // ============================================================
  // INDUSTRIAL SEED OILS
  // ============================================================
  'soybean oil': {
    category: 'seed_oil',
    severity: 'universal_limit',
    what_it_is: 'Refined oil pressed and hexane-extracted from soybeans, the most heavily consumed vegetable oil in the US food supply.',
    purpose: 'Cheap frying / baking fat. Long shelf life and neutral flavor make it the default oil in processed food.',
    concern: 'Very high in omega-6 linoleic acid (~55%). The US-average omega-6:omega-3 ratio has shifted from ~1:1 to ~20:1 largely because of soybean oil, associated in research with chronic low-grade inflammation. Almost always from genetically modified soy; refining uses hexane solvent + high heat.',
    better_options: ['Extra virgin olive oil', 'Avocado oil', 'Grass-fed butter', 'Ghee', 'Coconut oil'],
  },
  'canola oil': {
    category: 'seed_oil',
    severity: 'universal_limit',
    what_it_is: 'Refined oil extracted from rapeseed (Canadian-bred low-erucic variety). Hexane-extracted and deodorized at high heat.',
    purpose: 'Neutral flavor, cheap, high smoke point — used in salad dressings, mayo, and frying oils.',
    concern: 'Roughly 20% omega-6 linoleic acid. Industrial refining generates oxidation byproducts and trans-fat traces. Studies on omega-6 excess link it to inflammation. Nearly always GMO in North America.',
    better_options: ['Extra virgin olive oil', 'Avocado oil'],
  },
  'corn oil': {
    category: 'seed_oil',
    severity: 'universal_limit',
    what_it_is: 'Oil pressed from the germ of corn kernels, refined and deodorized.',
    purpose: 'Frying oil, salad dressings, and margarine base.',
    concern: '~55% omega-6 linoleic acid. Contributes to the omega-6:omega-3 imbalance associated with inflammation. Often derived from GMO corn.',
    better_options: ['Extra virgin olive oil', 'Coconut oil', 'Grass-fed butter'],
  },
  'cottonseed oil': {
    category: 'seed_oil',
    severity: 'universal_avoid',
    what_it_is: 'Oil extracted from cotton seeds — cotton is grown as a fiber crop, not a food crop.',
    purpose: 'Cheap frying oil in snack foods, dressings, and shortening.',
    concern: 'Cotton is not classified as a food crop and is not subject to food-grade pesticide limits — potential residues include glyphosate and other pesticides. ~55% omega-6 linoleic acid. Contains natural gossypol (partially removed in refining).',
    better_options: ['Extra virgin olive oil', 'Avocado oil', 'Coconut oil'],
  },
  'sunflower oil': {
    category: 'seed_oil',
    severity: 'universal_limit',
    what_it_is: 'Oil pressed from sunflower seeds. High-oleic varieties (labeled as such) are OK; standard "sunflower oil" is high-linoleic.',
    purpose: 'Neutral flavor cooking oil, chips, and baked goods.',
    concern: 'Standard sunflower oil is ~65% omega-6 linoleic acid. High-oleic sunflower oil is much better (mostly monounsaturated). Read the label carefully.',
    better_options: ['High-oleic sunflower oil', 'Extra virgin olive oil', 'Avocado oil'],
  },
  'safflower oil': {
    category: 'seed_oil',
    severity: 'universal_limit',
    what_it_is: 'Oil from safflower seeds. Like sunflower, comes in high-linoleic (concerning) and high-oleic (better) varieties.',
    purpose: 'Neutral cooking oil, salad dressings.',
    concern: 'Standard high-linoleic safflower oil is ~75% omega-6 — one of the highest of any oil. High-oleic version is fine.',
    better_options: ['High-oleic safflower oil', 'Extra virgin olive oil'],
  },
  'rice bran oil': {
    category: 'seed_oil',
    severity: 'universal_limit',
    what_it_is: 'Oil extracted from the outer bran layer of rice grains.',
    purpose: 'High smoke point cooking oil.',
    concern: 'Refined seed oil, ~35% omega-6. Often marketed as "healthy" but contributes to the same omega-6 imbalance as other seed oils.',
    better_options: ['Extra virgin olive oil', 'Avocado oil'],
  },
  'grapeseed oil': {
    category: 'seed_oil',
    severity: 'universal_avoid',
    what_it_is: 'Oil extracted from grape seeds using solvent extraction — a byproduct of wine making.',
    purpose: 'High smoke point cooking oil marketed as healthy.',
    concern: 'One of the highest omega-6 oils (~70% linoleic acid). Often solvent-extracted. Not a traditional food — grape seeds were never eaten in quantity historically.',
    better_options: ['Extra virgin olive oil', 'Avocado oil'],
  },
  'vegetable oil': {
    category: 'seed_oil',
    severity: 'universal_limit',
    what_it_is: 'Generic label — usually a blend of soybean, canola, corn, cottonseed, and/or sunflower oil.',
    purpose: 'Cheap, versatile, long shelf life.',
    concern: 'Non-transparent labeling. The blend is almost always high in refined seed oils, so the concerns apply.',
    better_options: ['Extra virgin olive oil', 'Avocado oil', 'Coconut oil'],
  },
  'palm oil': {
    category: 'seed_oil',
    severity: 'caution',
    what_it_is: 'Oil from the fruit of the oil palm tree.',
    purpose: 'Cheap solid-at-room-temperature fat used in baked goods, spreads, and snack foods.',
    concern: 'Not itself a seed oil (fruit-derived) and much lower in omega-6 than seed oils, but conventional palm oil is a major driver of tropical deforestation. Refined palm oil produces glycidyl esters (GE) during processing — the EFSA has raised concerns about GE exposure in children.',
    better_options: ['Grass-fed butter', 'Coconut oil (for solid-fat baking)', 'RSPO-certified sustainable palm oil'],
  },

  // ============================================================
  // EMULSIFIERS
  // ============================================================
  carrageenan: {
    category: 'emulsifier',
    severity: 'universal_avoid',
    what_it_is: 'Extract from red seaweed used to thicken and stabilize dairy alternatives, deli meats, and ice cream.',
    purpose: 'Keeps liquids from separating and gives a smooth mouthfeel.',
    concern: 'Multiple animal studies link food-grade carrageenan to intestinal inflammation and altered gut microbiome. The Joint FAO/WHO expert committee has ongoing safety questions. Many "clean label" brands have removed it.',
    better_options: ['Products with guar gum, agar, or no thickener'],
  },
  'polysorbate 80': {
    category: 'emulsifier',
    severity: 'universal_avoid',
    what_it_is: 'Synthetic emulsifier derived from sorbitol + oleic acid.',
    purpose: 'Keeps oil and water blended in ice cream, dressings, and vitamins.',
    concern: '2015 Nature paper (Chassaing et al.) associated polysorbate 80 with gut microbiome disruption, low-grade intestinal inflammation, and metabolic syndrome in mice at doses relevant to human exposure. Follow-up human research is ongoing.',
    better_options: ['Products with lecithin (non-emulsifier) or none'],
  },
  'polysorbate 60': {
    category: 'emulsifier',
    severity: 'universal_avoid',
    what_it_is: 'Sister compound to polysorbate 80. Sorbitol + stearic acid.',
    purpose: 'Emulsifier in baked goods, non-dairy toppings, imitation cream.',
    concern: 'Same class of concerns as polysorbate 80 — animal research on gut barrier and microbiome disruption.',
    better_options: ['Whole-food alternatives'],
  },
  'mono- and diglycerides': {
    category: 'emulsifier',
    severity: 'universal_limit',
    what_it_is: 'Modified fats derived from vegetable oils, used as emulsifiers.',
    purpose: 'Extend shelf life, keep breads soft, prevent oil separation.',
    concern: 'Legal loophole — mono- and diglycerides are not required to be counted as trans fats on the label even if they contain them. Nearly always derived from refined seed oils.',
    better_options: ['Products without added emulsifiers'],
  },
  'soy lecithin': {
    category: 'emulsifier',
    severity: 'caution',
    what_it_is: 'Emulsifier extracted from soybean oil processing waste.',
    purpose: 'Blends oil and water in chocolate, salad dressings, margarine.',
    concern: 'Usually derived from GMO soy and hexane-extracted. Generally considered safe, but people avoiding soy or GMO should note it. Sunflower lecithin is a cleaner alternative when available.',
    better_options: ['Sunflower lecithin'],
  },
  'sodium stearoyl lactylate': {
    category: 'emulsifier',
    severity: 'caution',
    what_it_is: 'Synthetic emulsifier / dough conditioner.',
    purpose: 'Extends bread shelf life and improves texture.',
    concern: 'Considered safe by FDA but is a marker of ultra-processed bread. Fresh whole-grain bread does not need it.',
    better_options: ['Sourdough or short-ingredient bread'],
  },
  'cellulose gum': {
    category: 'emulsifier',
    severity: 'caution',
    what_it_is: 'Carboxymethylcellulose (CMC) — chemically modified plant cellulose.',
    purpose: 'Thickener and stabilizer in ice cream, baked goods, gluten-free products.',
    concern: '2015+ animal research (Chassaing et al.) associated CMC with gut microbiome changes and low-grade inflammation. 2022 human RCT showed mild but measurable microbiome shifts.',
    better_options: ['Products with less processing overall'],
  },
  'xanthan gum': {
    category: 'emulsifier',
    severity: 'neutral',
    what_it_is: 'Polysaccharide made by fermenting sugar with the bacterium Xanthomonas campestris.',
    purpose: 'Thickener and stabilizer, common in gluten-free products.',
    concern: 'Generally regarded as safe. Can cause bloating at large doses (>15g/day). Small amounts are fine for most people.',
  },
  'guar gum': {
    category: 'emulsifier',
    severity: 'neutral',
    what_it_is: 'Fiber extract from guar beans.',
    purpose: 'Thickener in ice cream, sauces, and gluten-free baking.',
    concern: 'Generally safe. Can cause GI upset in very large amounts. Considered one of the cleaner emulsifier options.',
  },

  // ============================================================
  // PRESERVATIVES
  // ============================================================
  bha: {
    category: 'preservative',
    severity: 'universal_avoid',
    what_it_is: 'Butylated hydroxyanisole — synthetic antioxidant preservative.',
    purpose: 'Prevents fats from going rancid in cereals, chips, chewing gum.',
    concern: 'International Agency for Research on Cancer (IARC) classifies BHA as Group 2B — "possibly carcinogenic to humans." California requires a Prop 65 warning. Banned in some EU applications.',
    better_options: ['Products preserved with vitamin E (mixed tocopherols) or rosemary extract'],
  },
  bht: {
    category: 'preservative',
    severity: 'universal_avoid',
    what_it_is: 'Butylated hydroxytoluene — synthetic antioxidant preservative.',
    purpose: 'Same as BHA — prevents fat oxidation.',
    concern: 'Some studies show tumor promotion in animals at high doses. Restricted in several countries. Not banned in the US but on many watchdog lists.',
    better_options: ['Vitamin E (mixed tocopherols), rosemary extract'],
  },
  tbhq: {
    category: 'preservative',
    severity: 'universal_avoid',
    what_it_is: 'Tert-butylhydroquinone — petroleum-derived synthetic antioxidant.',
    purpose: 'Preserves oils and fried foods (found in many fast-food fry oils, frozen foods).',
    concern: 'Research at Michigan State University linked TBHQ to immune dysfunction in animal studies. Multiple food advocacy groups list it as one of the ingredients to avoid.',
    better_options: ['Products preserved with tocopherols'],
  },
  'sodium benzoate': {
    category: 'preservative',
    severity: 'universal_limit',
    what_it_is: 'Salt of benzoic acid used to inhibit mold and bacteria.',
    purpose: 'Common in sodas, salad dressings, and acidic products.',
    concern: 'When combined with ascorbic acid (vitamin C) in the same product, can form small amounts of benzene, a Group 1 carcinogen. Also implicated in some hyperactivity studies in children.',
    better_options: ['Products without added preservatives'],
  },
  'potassium benzoate': {
    category: 'preservative',
    severity: 'universal_limit',
    what_it_is: 'Potassium salt of benzoic acid.',
    purpose: 'Alternative to sodium benzoate in low-sodium products.',
    concern: 'Same benzene-formation concern with ascorbic acid.',
    better_options: ['Products without added preservatives'],
  },
  'sodium nitrite': {
    category: 'preservative',
    severity: 'universal_avoid',
    what_it_is: 'Curing salt used in processed meats — creates the pink color and preserves against botulism.',
    purpose: 'Preserves bacon, hot dogs, deli meats, cured sausages.',
    concern: 'IARC classifies processed meat (which almost always contains nitrite) as Group 1 — carcinogenic to humans. Nitrite can form nitrosamines when heated with protein.',
    better_options: ['Uncured / no-nitrite-added meats', 'Fresh unprocessed cuts'],
  },
  'sodium nitrate': {
    category: 'preservative',
    severity: 'universal_avoid',
    what_it_is: 'Precursor form of sodium nitrite — converts to nitrite during curing.',
    purpose: 'Same as nitrite.',
    concern: 'Same processed-meat carcinogenicity concern.',
    better_options: ['Uncured meats'],
  },
  'propyl gallate': {
    category: 'preservative',
    severity: 'universal_limit',
    what_it_is: 'Synthetic antioxidant preservative.',
    purpose: 'Preserves fats and oils in gum, chicken soup base, meat products.',
    concern: 'Some research suggests endocrine-disruption potential. On several advocacy watchlists.',
    better_options: ['Mixed tocopherols'],
  },

  // ============================================================
  // ARTIFICIAL COLORS
  // ============================================================
  'red 40': {
    category: 'artificial_color',
    severity: 'universal_avoid',
    what_it_is: 'Synthetic petroleum-derived red dye (also Allura Red AC, E129).',
    purpose: 'Bright red color in candies, cereals, drinks, gelatin.',
    concern: 'Multiple studies — including a 2021 California Office of Environmental Health Hazard Assessment (OEHHA) review — link Red 40 to hyperactivity and attention problems in children. Requires a warning label in the EU. California requires disclosure in school foods.',
    better_options: ['Products colored with beet, paprika, or annatto extract'],
  },
  'yellow 5': {
    category: 'artificial_color',
    severity: 'universal_avoid',
    what_it_is: 'Tartrazine — synthetic petroleum-derived yellow dye (E102).',
    purpose: 'Bright yellow color in candy, mac and cheese, drinks, snack foods.',
    concern: 'OEHHA 2021 review linked to hyperactivity in children. Some individuals experience allergic reactions. EU requires warning label.',
    better_options: ['Turmeric, saffron, or annatto for color'],
  },
  'yellow 6': {
    category: 'artificial_color',
    severity: 'universal_avoid',
    what_it_is: 'Sunset Yellow — synthetic orange-yellow dye (E110).',
    purpose: 'Orange/yellow color in orange sodas, cheese products, candy.',
    concern: 'OEHHA 2021 review — behavioral effects in children. EU warning label required.',
    better_options: ['Beta-carotene, annatto'],
  },
  'blue 1': {
    category: 'artificial_color',
    severity: 'universal_limit',
    what_it_is: 'Brilliant Blue FCF — synthetic dye.',
    purpose: 'Blue color in candies, drinks, popsicles.',
    concern: 'Some research on CNS crossing in animal studies. Restricted in a few EU countries in past.',
    better_options: ['Spirulina extract'],
  },
  'blue 2': {
    category: 'artificial_color',
    severity: 'universal_limit',
    what_it_is: 'Indigotine — synthetic dye.',
    purpose: 'Blue color in pet food, candies.',
    concern: 'FDA-approved but on some advocacy watchlists.',
  },
  'red 3': {
    category: 'artificial_color',
    severity: 'universal_avoid',
    what_it_is: 'Erythrosine — synthetic red dye.',
    purpose: 'Maraschino cherry red, some candies.',
    concern: 'FDA banned Red 3 in cosmetics in 1990 due to thyroid tumor findings but still allowed in food. In January 2025, FDA moved to revoke its use in food as well.',
    better_options: ['Beet juice, cochineal'],
  },
  'caramel color': {
    category: 'artificial_color',
    severity: 'caution',
    what_it_is: 'Made by heating carbohydrates — Class III and IV (made with ammonium compounds) contain 4-MEI as a byproduct.',
    purpose: 'Brown color in colas, sauces, gravies.',
    concern: 'Class III/IV caramel color contains 4-methylimidazole (4-MEI), listed on California Prop 65 as a possible carcinogen. Simple Class I ("plain caramel") is fine.',
    better_options: ['Products with plain caramel or no color'],
  },
  'titanium dioxide': {
    category: 'artificial_color',
    severity: 'universal_avoid',
    what_it_is: 'White mineral pigment (E171).',
    purpose: 'Whitening in candies, coffee creamer, gum, some pharmaceuticals.',
    concern: 'Banned as a food additive in the EU in 2022 (EFSA no longer considers it safe due to potential genotoxicity). Still allowed in the US.',
    better_options: ['Products without added whiteners'],
  },

  // ============================================================
  // SWEETENERS
  // ============================================================
  'high fructose corn syrup': {
    category: 'sweetener',
    severity: 'universal_avoid',
    what_it_is: 'Corn-derived syrup enzymatically converted to a fructose-glucose mix (usually HFCS-55 = 55% fructose).',
    purpose: 'Cheap sweetener replacing sugar in sodas, baked goods, condiments, breads.',
    concern: 'Extensive research links HFCS consumption to fatty liver disease (NAFLD), insulin resistance, and cardiovascular risk. Fructose is metabolized differently than glucose — primarily in the liver. HFCS also drove US per-capita sugar consumption up sharply.',
    better_options: ['Cane sugar (still limit)', 'Fruit-sweetened products', 'Unsweetened versions'],
  },
  'corn syrup': {
    category: 'sweetener',
    severity: 'universal_limit',
    what_it_is: 'Glucose-heavy syrup from cornstarch (less fructose than HFCS).',
    purpose: 'Sweetener and texture agent in candy, jams, baked goods.',
    concern: 'Rapid glucose delivery, no fiber. Not as metabolically problematic as HFCS but still a refined sugar.',
    better_options: ['Products with less added sugar overall'],
  },
  aspartame: {
    category: 'sweetener',
    severity: 'universal_avoid',
    what_it_is: 'Synthetic non-nutritive sweetener (phenylalanine + aspartic acid + methanol).',
    purpose: 'Zero-calorie sweetener in diet sodas, sugar-free gum, low-calorie desserts.',
    concern: 'IARC classified aspartame as Group 2B ("possibly carcinogenic to humans") in July 2023. WHO recommends limiting non-sugar sweeteners for weight management. Contraindicated in phenylketonuria (PKU).',
    better_options: ['Water with fruit', 'Unsweetened tea', 'Stevia (whole-leaf) in moderation'],
  },
  sucralose: {
    category: 'sweetener',
    severity: 'universal_limit',
    what_it_is: 'Chlorinated modification of sucrose. Sold as Splenda.',
    purpose: 'Heat-stable zero-calorie sweetener in baking mixes, diet drinks.',
    concern: 'Research (particularly from Suez et al. 2014, 2022) associates sucralose with gut microbiome disruption. 2023 Journal of Toxicology research showed sucralose-6-acetate (a byproduct) may be genotoxic.',
    better_options: ['Small amounts of natural sweeteners'],
  },
  'acesulfame potassium': {
    category: 'sweetener',
    severity: 'universal_limit',
    what_it_is: 'Synthetic zero-calorie sweetener, often blended with aspartame or sucralose.',
    purpose: 'Common in diet sodas and sugar-free products.',
    concern: 'Some animal research on metabolic and gut effects. Less studied than the others.',
    better_options: ['Whole foods'],
  },
  saccharin: {
    category: 'sweetener',
    severity: 'universal_limit',
    what_it_is: 'Oldest synthetic sweetener (Sweet\'N Low pink packet).',
    purpose: 'Zero-calorie sweetener.',
    concern: 'Historical bladder tumor concerns in rats (removed from warning list in 2000). Recent research on gut microbiome effects.',
  },
  erythritol: {
    category: 'sweetener',
    severity: 'caution',
    what_it_is: 'Sugar alcohol produced by fermenting corn.',
    purpose: 'Zero-calorie bulk sweetener in keto and low-carb products.',
    concern: '2023 Nature Medicine study associated high blood erythritol levels with cardiovascular events (heart attack, stroke). Whether this is causal or correlational is still debated.',
    better_options: ['Small amounts of natural sweeteners'],
  },
  'sugar alcohols': {
    category: 'sweetener',
    severity: 'caution',
    what_it_is: 'Family including sorbitol, xylitol, maltitol, mannitol.',
    purpose: 'Sugar-free candy, gum, dietetic foods.',
    concern: 'Common cause of GI distress (bloating, diarrhea) in sensitive individuals. Xylitol is toxic to dogs.',
  },

  // ============================================================
  // OTHER CONCERNING
  // ============================================================
  'monosodium glutamate': {
    category: 'additive',
    severity: 'caution',
    what_it_is: 'Sodium salt of glutamic acid (free glutamate).',
    purpose: 'Umami / savory flavor enhancer.',
    concern: 'Extensive review has debunked the "MSG allergy" myth for most people. However, roughly 1-2% of the population reports genuine sensitivity (MSG symptom complex). Not a red flag for most, but worth knowing.',
  },
  'natural flavors': {
    category: 'additive',
    severity: 'caution',
    what_it_is: 'FDA-defined catch-all for flavor compounds derived from natural sources — but the actual formulations are proprietary.',
    purpose: 'Adds specific flavor profile without listing individual chemicals.',
    concern: 'Not inherently harmful, but non-transparent. A single "natural flavors" line can contain 50+ chemicals plus solvents and preservatives that are not disclosed. Preference is toward products where flavor comes from actual ingredients you recognize.',
  },
  'artificial flavors': {
    category: 'additive',
    severity: 'universal_limit',
    what_it_is: 'Synthetic flavor compounds — same FDA umbrella but explicitly non-natural.',
    purpose: 'Cheap, consistent flavor.',
    concern: 'Non-transparent labeling. Individual components may include ester compounds and solvents not disclosed on the label.',
  },
  'enriched flour': {
    category: 'flour',
    severity: 'universal_limit',
    what_it_is: 'Refined white flour with synthetic vitamins added back (thiamine, riboflavin, niacin, folic acid, iron) after milling stripped them out.',
    purpose: 'Bread, pasta, crackers, cereal — the base flour for most US baked goods.',
    concern: 'Contains synthetic folic acid required by US fortification law. Also usually from conventional (non-organic) wheat with glyphosate residues from pre-harvest desiccation. Missing the fiber, oil, and micronutrients of the whole grain.',
    better_options: ['Sourdough with organic wheat', 'Sprouted whole grain flours', 'Non-fortified imported wheat'],
  },
  'enriched wheat flour': {
    category: 'flour',
    severity: 'universal_limit',
    what_it_is: 'Same as enriched flour — refined wheat with synthetic B vitamins and folic acid added back.',
    purpose: 'Foundation of most US breads, pastas, and baked goods.',
    concern: 'Synthetic folic acid + likely glyphosate residues + no fiber. Search for "unenriched" or "sprouted" as better options.',
    better_options: ['Sprouted whole wheat', 'Organic non-fortified flour', 'Sourdough'],
  },
  'enriched bleached flour': {
    category: 'flour',
    severity: 'universal_avoid',
    what_it_is: 'Enriched flour additionally bleached with chlorine dioxide or benzoyl peroxide.',
    purpose: 'Bright white color in commercial baked goods.',
    concern: 'Chlorine dioxide bleaching creates alloxan as a byproduct — implicated in animal studies of pancreatic damage.',
    better_options: ['Unbleached flour, ideally organic and whole grain'],
  },

  // ============================================================
  // BENEFICIAL / NEUTRAL — call these out positively
  // ============================================================
  'extra virgin olive oil': {
    category: 'beneficial',
    severity: 'beneficial',
    what_it_is: 'First cold-pressed juice of olives, unrefined.',
    purpose: 'Cooking oil, salad dressing, drizzling.',
    concern: 'None. High in monounsaturated oleic acid, polyphenols (oleocanthal is a natural COX inhibitor with anti-inflammatory effects), and antioxidants. Best fat for most cooking.',
  },
  'avocado oil': {
    category: 'beneficial',
    severity: 'beneficial',
    what_it_is: 'Oil pressed from avocado flesh.',
    purpose: 'High smoke point cooking oil, salad dressings.',
    concern: 'None when authentic. Note: consumer reports have found many "avocado oils" are adulterated with cheap seed oils. Buy from a reputable brand.',
  },
  'coconut oil': {
    category: 'beneficial',
    severity: 'beneficial',
    what_it_is: 'Oil from coconut meat, mostly medium-chain saturated fats (MCTs).',
    purpose: 'High-heat cooking, baking, curries.',
    concern: 'Debated — sat-fat concerns are outdated for whole-food sources; MCTs are metabolized differently than long-chain fats. Fine as part of a varied diet.',
  },
  ghee: {
    category: 'beneficial',
    severity: 'beneficial',
    what_it_is: 'Clarified butter with milk solids removed.',
    purpose: 'High-heat cooking, sautéing.',
    concern: 'None. Lactose-free (safe for LCT variants), high in butyrate and fat-soluble vitamins A, D, E, K2.',
  },
  butter: {
    category: 'beneficial',
    severity: 'neutral',
    what_it_is: 'Traditional churned dairy fat.',
    purpose: 'Cooking, baking, spreading.',
    concern: 'Fine in moderation. Grass-fed has meaningfully higher K2, CLA, and omega-3.',
  },
  'olive oil': {
    category: 'beneficial',
    severity: 'neutral',
    what_it_is: 'Refined olive oil (not virgin) — still mostly monounsaturated oleic acid.',
    purpose: 'Higher smoke point than EVOO.',
    concern: 'Not as antioxidant-rich as EVOO but still a good oil.',
  },
  turmeric: {
    category: 'beneficial',
    severity: 'beneficial',
    what_it_is: 'Yellow-orange spice from Curcuma longa root.',
    purpose: 'Coloring and flavor in curries, some cheeses, natural food dye.',
    concern: 'None — curcumin is well-researched for anti-inflammatory activity.',
  },
  'sea salt': {
    category: 'beneficial',
    severity: 'neutral',
    what_it_is: 'Unrefined salt with trace minerals.',
    purpose: 'Flavor and mineral source.',
    concern: 'Sodium moderation still applies for cardiovascular health, but sea salt provides trace elements missing from refined table salt.',
  },
  'himalayan pink salt': {
    category: 'beneficial',
    severity: 'neutral',
    what_it_is: 'Rock salt from Pakistan\'s Khewra mine.',
    purpose: 'Mineralized salt.',
    concern: 'Contains trace amounts of iron and other minerals. Trendy but functionally similar to sea salt.',
  },
}

// Simple accessor for the UI — looks up an ingredient by name (case-insensitive,
// tolerates plural/adjective variants like "canola oils" or "polysorbate 80.").
export function lookupIngredient(name) {
  if (!name) return null
  const norm = String(name).toLowerCase().trim()
    .replace(/[,.;()[\]]/g, '')
    .replace(/\s+/g, ' ')
  if (INGREDIENT_DICTIONARY[norm]) return { key: norm, ...INGREDIENT_DICTIONARY[norm] }
  // Try substring matches on the whole dictionary keys.
  for (const [key, entry] of Object.entries(INGREDIENT_DICTIONARY)) {
    if (norm.includes(key) || key.includes(norm)) return { key, ...entry }
  }
  return null
}

// Full universal-flag scan on any ingredient list — returns flags for
// everything in the dictionary with severity of universal_* or caution.
export function scanUniversalFlags(ingredientText) {
  const flags = []
  if (!ingredientText) return flags
  const text = String(ingredientText).toLowerCase()
  const seen = new Set()
  for (const [key, entry] of Object.entries(INGREDIENT_DICTIONARY)) {
    if (entry.severity === 'beneficial' || entry.severity === 'neutral') continue
    if (!text.includes(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    flags.push({
      ingredient: key,
      category: entry.category,
      severity: entry.severity,
      what_it_is: entry.what_it_is,
      purpose: entry.purpose,
      concern: entry.concern,
      better_options: entry.better_options || [],
    })
  }
  return flags
}

// Scan for the beneficial entries so we can positively call them out.
export function scanBeneficial(ingredientText) {
  const found = []
  if (!ingredientText) return found
  const text = String(ingredientText).toLowerCase()
  const seen = new Set()
  for (const [key, entry] of Object.entries(INGREDIENT_DICTIONARY)) {
    if (entry.severity !== 'beneficial') continue
    if (!text.includes(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    found.push({ ingredient: key, ...entry })
  }
  return found
}

// Category groupings for the "Ingredients to Know" educational panel.
export const CATEGORY_META = {
  seed_oil:          { title: 'Industrial Seed Oils',   why: 'High in omega-6 linoleic acid (~20:1 vs. the ancestral ~1:1 with omega-3). Extracted with hexane and high heat. Associated in research with chronic low-grade inflammation.' },
  emulsifier:        { title: 'Emulsifiers',            why: 'Chemical additives that keep oil and water blended. Some (polysorbate 80, carrageenan, CMC) have research linking them to gut microbiome disruption and intestinal inflammation.' },
  preservative:      { title: 'Synthetic Preservatives', why: 'BHA, BHT, TBHQ, and sodium nitrite/nitrate have varying levels of research concerns — from IARC classifications to processed-meat carcinogenicity.' },
  artificial_color:  { title: 'Artificial Colors',      why: 'Petroleum-derived synthetic dyes. Multiple studies link them to hyperactivity in children. EU requires warning labels; California requires disclosure in school foods.' },
  sweetener:         { title: 'Non-Sugar Sweeteners',   why: 'HFCS is linked to fatty liver and metabolic disease. Aspartame is IARC 2B (possibly carcinogenic). Sucralose has emerging gut microbiome research. WHO now recommends limiting non-sugar sweeteners in general.' },
  flour:             { title: 'Refined & Enriched Grains', why: 'Enriched flour contains synthetic folic acid (an issue for MTHFR carriers), lacks the fiber and micronutrients of whole grains, and often carries glyphosate residues from pre-harvest desiccation.' },
  additive:          { title: 'Other Additives',        why: 'Vague labels like "natural flavors" and "artificial flavors" hide dozens of undisclosed compounds behind a single line.' },
  beneficial:        { title: 'Beneficial Ingredients', why: 'Ingredients worth actively seeking out.' },
}

// Universal disclaimer for the education screen.
export const INGREDIENT_EDUCATION_DISCLAIMER =
  'These ingredient notes summarize research associations. Regulatory status and consumer product formulations change frequently — always check current sources for specific health decisions. Presence of any single ingredient rarely tells the whole story of a food.'
