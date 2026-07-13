// /app/lib/supplements/brandCoA.js
// Per-brand Certificate-of-Analysis / test-report reference URLs.
// Each entry MUST link to the brand's own public transparency page - never a
// PDF we host ourselves (we do not want to be in the business of vouching for
// specific batches, and brand pages update over time). If a brand publishes
// per-SKU CoAs, we link to the SKU listing page; otherwise the transparency
// landing page.
//
// Keys are the same slugs used in brandProfiles.js.

export const BRAND_COA = {
  'thorne': [
    { label: 'Quality & CoA program', url: 'https://www.thorne.com/quality' },
    { label: 'NSF Certified for Sport catalog', url: 'https://www.nsfsport.com/certified-products/search-tools/nsf-search.php?msclkid=&brand=Thorne' },
  ],
  'momentous': [
    { label: 'NSF for Sport verified products', url: 'https://www.nsfsport.com/certified-products/search-tools/nsf-search.php?brand=Momentous' },
    { label: 'Third-party testing FAQ', url: 'https://www.livemomentous.com/pages/faq' },
  ],
  'nordic naturals': [
    { label: 'IFOS certificates by SKU', url: 'https://certifications.nutrasource.ca/consumer-services/ifos' },
    { label: 'Freshness & purity reports', url: 'https://www.nordicnaturals.com/quality/' },
  ],
  'life extension': [
    { label: 'Certificate of Analysis lookup', url: 'https://www.lifeextension.com/certifications-of-analysis' },
  ],
  'ritual': [
    { label: 'Made Traceable ingredient origins', url: 'https://ritual.com/traceable' },
  ],
  'legion athletics': [
    { label: 'Third-party test results (Labdoor)', url: 'https://labdoor.com/rankings' },
    { label: 'Ingredient certificates', url: 'https://legionathletics.com/pages/lab-tests' },
  ],
  'transparent labs': [
    { label: 'Third-party test results per SKU', url: 'https://www.transparentlabs.com/pages/lab-tests' },
  ],
  'seed': [
    { label: 'Strain designations & synbiotic data', url: 'https://seed.com/daily-synbiotic/faq' },
  ],
  'ag1': [
    { label: 'NSF for Sport certification (AG1)', url: 'https://www.nsfsport.com/certified-products/search-tools/nsf-search.php?brand=AG1' },
  ],
  'nature made': [
    { label: 'USP Verified products by SKU', url: 'https://www.quality-supplements.org/verified-products' },
  ],
  'garden of life': [
    { label: 'Traceability & certifications', url: 'https://www.gardenoflife.com/our-standards' },
  ],
  'megafood': [
    { label: 'Glyphosate-residue & quality tests', url: 'https://megafood.com/pages/tested-and-transparent' },
  ],
  'gaia herbs': [
    { label: 'Meet Your Herbs (lot-level traceability)', url: 'https://www.gaiaherbs.com/pages/meet-your-herbs' },
  ],
  'needed': [
    { label: 'Testing & sourcing transparency', url: 'https://thisisneeded.com/pages/testing-transparency' },
  ],
  'lmnt': [
    { label: 'Sourcing & testing FAQ', url: 'https://drinklmnt.com/pages/faq' },
  ],
  'carlson': [
    { label: 'IFOS 5-star certificates (Carlson)', url: 'https://certifications.nutrasource.ca/consumer-services/ifos' },
  ],
  'nordic naturals ': undefined, // placeholder deliberately absent
}

export function getBrandCoA(brandName) {
  const key = String(brandName || '').toLowerCase().trim()
  return BRAND_COA[key] || null
}
