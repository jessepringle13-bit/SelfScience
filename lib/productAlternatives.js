// /app/lib/productAlternatives.js
// Curated cleaner-alternative catalog. When a scanned/searched product
// grades C or D on either the genomic or universal quality score, we
// surface a "Better options" panel using this table. The `search_term`
// field is what we pass back to /api/nutrition/product?query= so users
// can pull the actual product in-app with one click.

export const CLEAN_ALTERNATIVES = {
  'protein-bars': [
    { name: 'RXBAR',                              why: 'Minimal ingredients — egg whites, dates, nuts. No artificial sweeteners, no seed oils.', search_term: 'RXBAR' },
    { name: 'Paleovalley Beef Sticks',            why: 'Grass-fed protein, no seed oils, no nitrates.',                                            search_term: 'Paleovalley beef sticks' },
    { name: 'Epic Provisions Bar',                why: 'Animal-based, short ingredient list.',                                                     search_term: 'Epic bar' },
    { name: 'Perfect Bar',                         why: 'Whole-food ingredients, no artificial sweeteners.',                                        search_term: 'Perfect Bar' },
    { name: 'Larabar',                             why: 'Dates and nuts only for most flavors — minimal processing.',                              search_term: 'Larabar' },
    { name: 'David Protein Bar',                   why: 'High protein with no seed oils and clean sweeteners.',                                     search_term: 'David protein bar' },
  ],
  'protein-powder': [
    { name: 'Thorne Whey Protein Isolate',        why: 'Grass-fed, no artificial sweeteners, low lactose (LCT-friendly).',                        search_term: 'Thorne whey' },
    { name: 'Naked Whey',                          why: 'Single-ingredient grass-fed whey. Nothing added.',                                         search_term: 'Naked Whey' },
    { name: 'Vital Proteins Collagen Peptides',   why: 'Clean collagen from grass-fed sources — great for connective tissue variants.',           search_term: 'Vital Proteins collagen' },
    { name: 'Garden of Life Sport Organic',       why: 'Organic plant protein, third-party tested for glyphosate.',                                search_term: 'Garden of Life sport' },
  ],
  chips: [
    { name: "Jackson's Sweet Potato Chips",        why: 'Cooked in coconut oil, not seed oils.',                                                    search_term: 'Jacksons sweet potato' },
    { name: 'Siete Grain-Free Chips',              why: 'Avocado oil, grain-free, clean ingredients.',                                              search_term: 'Siete chips' },
    { name: 'Kettle Brand (olive oil variety)',   why: 'Some varieties cooked in olive oil instead of seed oils.',                                search_term: 'Kettle chips olive oil' },
    { name: 'Boulder Canyon Avocado Oil Chips',   why: 'Avocado oil base — clean fat profile.',                                                    search_term: 'Boulder Canyon avocado' },
  ],
  'salad-dressing': [
    { name: 'Primal Kitchen Dressings',            why: 'Avocado oil base, zero seed oils, zero added sugar.',                                     search_term: 'Primal Kitchen dressing' },
    { name: 'Tessemae\'s Organic Dressings',       why: 'Olive oil-based, organic, no seed oils.',                                                  search_term: 'Tessemae dressing' },
    { name: 'Bragg Organic Vinaigrette',           why: 'Olive oil + apple cider vinegar — simple and clean.',                                     search_term: 'Bragg vinaigrette' },
  ],
  'cooking-oil': [
    { name: 'California Olive Ranch EVOO',        why: 'Third-party tested single-origin extra virgin olive oil.',                                 search_term: 'California Olive Ranch' },
    { name: 'Chosen Foods Avocado Oil',           why: 'Verified pure avocado oil (many brands are adulterated with seed oils).',                   search_term: 'Chosen Foods avocado oil' },
    { name: 'Nutiva Organic Coconut Oil',         why: 'Certified organic, cold-pressed, MCTs.',                                                    search_term: 'Nutiva coconut oil' },
    { name: 'Kerrygold Grass-Fed Butter',         why: 'Grass-fed dairy fat with K2 and CLA.',                                                       search_term: 'Kerrygold butter' },
    { name: 'Fatworks Beef Tallow',               why: 'Traditional stable animal fat for high-heat cooking.',                                     search_term: 'Fatworks tallow' },
  ],
  bread: [
    { name: 'Ezekiel 4:9 Sprouted Grain Bread',   why: 'Sprouted whole grains, no preservatives, no enriched flour.',                              search_term: 'Ezekiel bread' },
    { name: 'Alvarado Street Bakery',              why: 'Organic sprouted grains, no synthetic folic acid.',                                        search_term: 'Alvarado sprouted' },
    { name: 'Simple Kneads Sourdough',             why: 'Long-fermented sourdough, better mineral absorption.',                                     search_term: 'Simple Kneads sourdough' },
  ],
  cereal: [
    { name: 'One Degree Organics Sprouted Oat O\'s', why: 'Organic sprouted oats — dramatically lower glyphosate residue.',                       search_term: 'One Degree Organics sprouted' },
    { name: "Bob's Red Mill Organic Oats",         why: 'Certified organic — lower glyphosate residue than conventional oats.',                    search_term: "Bob's Red Mill organic oats" },
    { name: 'Purely Elizabeth Ancient Grain Granola', why: 'Clean granola with quality oils, no seed oils.',                                     search_term: 'Purely Elizabeth granola' },
  ],
  crackers: [
    { name: 'Simple Mills Almond Flour Crackers', why: 'No enriched flour, no seed oils, almond flour base.',                                     search_term: 'Simple Mills crackers' },
    { name: "Mary's Gone Crackers Organic",        why: 'Organic seeds and whole grains, no seed oils.',                                            search_term: "Mary's Gone Crackers" },
  ],
  yogurt: [
    { name: 'Maple Hill Grass-Fed Yogurt',        why: 'Grass-fed, no gums or emulsifiers, plain whole milk.',                                     search_term: 'Maple Hill yogurt' },
    { name: 'Straus Family Creamery',             why: 'Organic grass-fed, minimal ingredients.',                                                   search_term: 'Straus yogurt' },
    { name: 'Wallaby Organic Aussie Greek',       why: 'Organic Greek yogurt without additives.',                                                   search_term: 'Wallaby organic yogurt' },
  ],
  'ice-cream': [
    { name: 'Alden\'s Organic Ice Cream',          why: 'Organic dairy, no artificial anything, no emulsifiers.',                                   search_term: 'Aldens organic ice cream' },
    { name: 'Straus Family Creamery Ice Cream',   why: 'Organic grass-fed cream, simple ingredients.',                                              search_term: 'Straus ice cream' },
  ],
  soda: [
    { name: 'Olipop',                              why: 'Prebiotic soda alternative, low sugar, real ingredients.',                                 search_term: 'Olipop' },
    { name: 'Poppi',                               why: 'Apple cider vinegar base, low sugar.',                                                     search_term: 'Poppi' },
    { name: 'Spindrift Sparkling Water',           why: 'Real fruit juice sparkling water, no sweeteners.',                                         search_term: 'Spindrift' },
  ],
}

// Loosely map an Open Food Facts product to one of our alternative buckets
// via categories_tags + product name keywords.
export function detectCategory(product) {
  const cats = (product?.categories || []).join(' ').toLowerCase()
  const name = (product?.name || '').toLowerCase()
  const hay = `${cats} ${name}`
  if (/protein[\s-]?bar|energy[\s-]?bar|snack[\s-]?bar/.test(hay)) return 'protein-bars'
  if (/protein[\s-]?powder|whey|casein/.test(hay)) return 'protein-powder'
  if (/chip|crisp|puff/.test(hay)) return 'chips'
  if (/dressing|vinaigrette/.test(hay)) return 'salad-dressing'
  if (/\boil\b/.test(hay) && !/fish oil/.test(hay)) return 'cooking-oil'
  if (/bread|loaf|bun|roll|bagel/.test(hay)) return 'bread'
  if (/cereal|granola|oatmeal|breakfast/.test(hay)) return 'cereal'
  if (/cracker/.test(hay)) return 'crackers'
  if (/yogurt|yoghurt/.test(hay)) return 'yogurt'
  if (/ice[\s-]?cream|gelato|sorbet/.test(hay)) return 'ice-cream'
  if (/soda|cola|pop\b/.test(hay)) return 'soda'
  return null
}

export function getAlternatives(product) {
  const key = detectCategory(product)
  if (!key) return { key: null, items: [] }
  return { key, items: CLEAN_ALTERNATIVES[key] || [] }
}
