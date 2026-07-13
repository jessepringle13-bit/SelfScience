// /app/lib/supplements/brandCoA.js
// Per-brand Certificate-of-Analysis / test-report reference URLs.
// Each entry links to the brand's OWN public transparency page - never a PDF
// we host ourselves. Brand pages update over time; we do not want to be in
// the business of vouching for specific batches.
//
// Keys are the lowercase brand names used in brandProfiles.js.

export const BRAND_COA = {
  // ============ Practitioner / clinical ============
  'thorne': [
    { label: 'Quality & CoA program', url: 'https://www.thorne.com/quality' },
    { label: 'NSF Certified for Sport catalog', url: 'https://www.nsfsport.com/certified-products/search-tools/nsf-search.php?brand=Thorne' },
  ],
  'pure encapsulations': [
    { label: 'Quality standards & testing', url: 'https://www.pureencapsulations.com/quality' },
  ],
  'designs for health': [
    { label: 'Third-party testing & quality', url: 'https://www.designsforhealth.com/quality' },
  ],
  'metagenics': [
    { label: 'Quality & sourcing', url: 'https://www.metagenics.com/quality' },
  ],
  'seeking health': [
    { label: 'Quality & testing FAQ', url: 'https://www.seekinghealth.com/pages/quality' },
  ],
  'klaire labs': [
    { label: 'Manufacturing & testing', url: 'https://klaire.com/quality' },
  ],
  'metabolic maintenance': [
    { label: 'Quality standards', url: 'https://www.metabolicmaintenance.com/pages/quality' },
  ],
  'methylpro': [
    { label: 'MethylPro quality standards', url: 'https://methylpro.com/pages/quality' },
  ],
  'kirkman': [
    { label: 'Ultra-Tested Quality Program', url: 'https://www.kirkmangroup.com/pages/quality' },
  ],
  'quicksilver scientific': [
    { label: 'Nanoemulsion QC & CoAs', url: 'https://www.quicksilverscientific.com/quality' },
  ],

  // ============ Broad-market DTC ============
  'life extension': [
    { label: 'Certificate of Analysis lookup', url: 'https://www.lifeextension.com/certifications-of-analysis' },
  ],
  'now foods': [
    { label: 'Quality & ConsumerLab results', url: 'https://www.nowfoods.com/quality-safety' },
  ],
  'jarrow formulas': [
    { label: 'Quality standards', url: 'https://www.jarrow.com/quality' },
  ],
  'nordic naturals': [
    { label: 'IFOS certificates by SKU', url: 'https://certifications.nutrasource.ca/consumer-services/ifos' },
    { label: 'Freshness & purity reports', url: 'https://www.nordicnaturals.com/quality/' },
  ],
  'solgar': [
    { label: 'Solgar quality standards', url: 'https://www.solgar.com/quality' },
  ],
  "doctor's best": [
    { label: 'Quality & GMP standards', url: 'https://drbvitamins.com/pages/quality-standards' },
  ],
  'sports research': [
    { label: 'Third-party quality testing', url: 'https://sportsresearch.com/pages/quality' },
  ],
  'bulk supplements': [
    { label: 'Third-party testing', url: 'https://www.bulksupplements.com/pages/quality' },
  ],
  'carlson': [
    { label: 'IFOS 5-star certificates (Carlson)', url: 'https://certifications.nutrasource.ca/consumer-services/ifos' },
    { label: 'Carlson quality standards', url: 'https://carlsonlabs.com/quality' },
  ],

  // ============ Sport / performance ============
  'momentous': [
    { label: 'NSF for Sport verified products', url: 'https://www.nsfsport.com/certified-products/search-tools/nsf-search.php?brand=Momentous' },
    { label: 'Third-party testing FAQ', url: 'https://www.livemomentous.com/pages/faq' },
  ],
  'legion athletics': [
    { label: 'Third-party test results (Labdoor)', url: 'https://labdoor.com/rankings' },
    { label: 'Ingredient certificates', url: 'https://legionathletics.com/pages/lab-tests' },
  ],
  'onnit': [
    { label: 'Quality & sourcing', url: 'https://www.onnit.com/quality' },
  ],
  'ag1': [
    { label: 'NSF for Sport certification (AG1)', url: 'https://www.nsfsport.com/certified-products/search-tools/nsf-search.php?brand=AG1' },
    { label: 'AG1 testing FAQ', url: 'https://drinkag1.com/pages/testing' },
  ],
  'transparent labs': [
    { label: 'Third-party test results per SKU', url: 'https://www.transparentlabs.com/pages/lab-tests' },
  ],
  'optimum nutrition': [
    { label: 'Informed Choice batch tests', url: 'https://choice.wetestyoutrust.com/supplier/optimum-nutrition' },
  ],

  // ============ DTC / modern ============
  'ritual': [
    { label: 'Made Traceable ingredient origins', url: 'https://ritual.com/traceable' },
  ],
  'bulletproof': [
    { label: 'Third-party testing standards', url: 'https://www.bulletproof.com/quality' },
  ],
  'cymbiotika': [
    { label: 'Third-party testing & CoAs', url: 'https://cymbiotika.com/pages/quality' },
  ],
  'paleovalley': [
    { label: 'Testing & sourcing', url: 'https://paleovalley.com/quality' },
  ],
  'ancestral supplements': [
    { label: 'Sourcing & testing', url: 'https://ancestralsupplements.com/pages/quality' },
  ],
  'just ingredients': [
    { label: 'Heavy-metal testing results', url: 'https://justingredients.us/pages/testing' },
  ],
  'armra': [
    { label: 'ARMRA quality & testing', url: 'https://www.tryarmra.com/pages/quality' },
  ],
  'beam minerals': [
    { label: 'Sourcing & test reports', url: 'https://beamminerals.com/pages/testing' },
  ],
  'lmnt': [
    { label: 'Sourcing & testing FAQ', url: 'https://drinklmnt.com/pages/faq' },
  ],
  'redmond': [
    { label: 'Redmond quality standards', url: 'https://redmond.life/pages/quality' },
  ],

  // ============ Whole-food / organic ============
  'garden of life': [
    { label: 'Traceability & certifications', url: 'https://www.gardenoflife.com/our-standards' },
  ],
  'megafood': [
    { label: 'Glyphosate-residue & quality tests', url: 'https://megafood.com/pages/tested-and-transparent' },
  ],
  'new chapter': [
    { label: 'Quality standards', url: 'https://www.newchapter.com/quality' },
  ],
  'nature made': [
    { label: 'USP Verified products by SKU', url: 'https://www.quality-supplements.org/verified-products' },
  ],
  'ancient nutrition': [
    { label: 'Testing & sourcing', url: 'https://ancientnutrition.com/pages/quality' },
  ],
  'orgain': [
    { label: 'Organic sourcing & testing', url: 'https://orgain.com/pages/quality-standards' },
  ],
  'vega': [
    { label: 'Vega quality & sourcing', url: 'https://myvega.com/pages/quality' },
  ],
  'huel': [
    { label: 'Huel quality & manufacturing', url: 'https://huel.com/pages/quality' },
  ],
  'vital proteins': [
    { label: 'Vital Proteins quality', url: 'https://www.vitalproteins.com/pages/quality' },
  ],
  'gaia herbs': [
    { label: 'Meet Your Herbs (lot-level traceability)', url: 'https://www.gaiaherbs.com/pages/meet-your-herbs' },
  ],
  'herb pharm': [
    { label: 'Herb Pharm quality & sourcing', url: 'https://www.herb-pharm.com/pages/quality' },
  ],

  // ============ Mushrooms ============
  'host defense': [
    { label: 'Host Defense quality standards', url: 'https://hostdefense.com/pages/quality' },
    { label: 'Published research programme', url: 'https://hostdefense.com/pages/research' },
  ],
  'om mushroom': [
    { label: 'Om Mushroom quality standards', url: 'https://ommushrooms.com/pages/quality' },
  ],
  'four sigmatic': [
    { label: 'Four Sigmatic testing & sourcing', url: 'https://foursigmatic.com/pages/quality' },
  ],

  // ============ Probiotics ============
  'renew life': [
    { label: 'Strain designations & CFU guarantee', url: 'https://renewlife.com/pages/quality' },
  ],
  'culturelle': [
    { label: 'LGG strain data & CFU guarantee', url: 'https://www.culturelle.com/probiotic-quality' },
  ],
  'seed': [
    { label: 'Strain designations & synbiotic data', url: 'https://seed.com/daily-synbiotic/faq' },
  ],

  // ============ Subscription / personalised ============
  'bioptimizers': [
    { label: 'BiOptimizers quality standards', url: 'https://bioptimizers.com/pages/quality' },
  ],
  'thrive market': [
    { label: 'Thrive Market Brand quality', url: 'https://thrivemarket.com/quality' },
  ],
  'hum nutrition': [
    { label: 'HUM Nutrition ingredient sourcing', url: 'https://www.humnutrition.com/quality' },
  ],
  'care of': [
    { label: 'Ingredient sourcing per SKU', url: 'https://takecareof.com/quality' },
  ],
  'persona nutrition': [
    { label: 'Persona quality standards', url: 'https://www.personanutrition.com/quality' },
  ],
  'needed': [
    { label: 'Testing & sourcing transparency', url: 'https://thisisneeded.com/pages/testing-transparency' },
  ],
  'perelel': [
    { label: 'Perelel testing & sourcing', url: 'https://perelelhealth.com/pages/quality' },
  ],
}

export function getBrandCoA(brandName) {
  const key = String(brandName || '').toLowerCase().trim()
  return BRAND_COA[key] || null
}
