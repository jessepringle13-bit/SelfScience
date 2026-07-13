// /app/lib/supplements/certifications.js
// Phase 2 — third-party certification detector.
//
// Two layers:
//   1) LABEL SCANNER — regex over DSLD text fields (statements, claims, notes,
//      productName, brandName) to auto-extract product-level certifications.
//   2) BRAND MAP     — curated per-brand certification programmes (e.g. all
//      Nordic Naturals fish oils are IFOS-tested).
//
// We only recognise certifications that have a formal external verifier
// (NSF, USP, IFOS, Informed Sport, Non-GMO Project, USDA Organic, GFCO,
// EWG Verified, Clean Label Project, Labdoor). We NEVER surface a brand's
// self-claimed "lab-tested" without an external verifier.

export const CERT_REGISTRY = {
  'nsf-sport': {
    id: 'nsf-sport',
    name: 'NSF Certified for Sport',
    body: 'NSF International',
    verifierUrl: 'https://www.nsfsport.com/certified-products/',
    what: 'Verifies label accuracy + tests each production lot for 280+ banned substances.',
    tier: 'gold',
  },
  'nsf-supplement': {
    id: 'nsf-supplement',
    name: 'NSF Contents Certified',
    body: 'NSF International',
    verifierUrl: 'https://www.nsf.org/consumer/dietary-supplements',
    what: 'Verifies the label matches what’s inside the bottle; audits cGMP compliance.',
    tier: 'gold',
  },
  'usp': {
    id: 'usp',
    name: 'USP Verified',
    body: 'U.S. Pharmacopeia',
    verifierUrl: 'https://quality-supplements.org/verified-products/',
    what: 'Pharmacopeial-grade verification of identity, potency, purity, and manufacturing.',
    tier: 'gold',
  },
  'informed-sport': {
    id: 'informed-sport',
    name: 'Informed Sport',
    body: 'LGC / Informed Sport',
    verifierUrl: 'https://sport.wetestyoutrust.com/certified-products',
    what: 'Every batch tested for WADA-prohibited substances.',
    tier: 'gold',
  },
  'informed-choice': {
    id: 'informed-choice',
    name: 'Informed Choice',
    body: 'LGC / Informed Choice',
    verifierUrl: 'https://choice.wetestyoutrust.com/',
    what: 'Monthly batch testing for banned substances; less stringent than Informed Sport.',
    tier: 'silver',
  },
  'ifos-5': {
    id: 'ifos-5',
    name: 'IFOS 5-Star',
    body: 'International Fish Oil Standards',
    verifierUrl: 'https://certifications.nutrasource.ca/consumer-services/ifos',
    what: 'Independent purity + potency verification for fish-oil products. Full CoAs are public.',
    tier: 'gold',
  },
  'ifos': {
    id: 'ifos',
    name: 'IFOS Tested',
    body: 'International Fish Oil Standards',
    verifierUrl: 'https://certifications.nutrasource.ca/consumer-services/ifos',
    what: 'Independent fish-oil purity testing (rating may vary lot to lot).',
    tier: 'silver',
  },
  'non-gmo': {
    id: 'non-gmo',
    name: 'Non-GMO Project Verified',
    body: 'Non-GMO Project',
    verifierUrl: 'https://www.nongmoproject.org/find-non-gmo/',
    what: 'Third-party verification of non-GMO status through supply-chain segregation.',
    tier: 'silver',
  },
  'usda-organic': {
    id: 'usda-organic',
    name: 'USDA Organic',
    body: 'USDA National Organic Program',
    verifierUrl: 'https://www.ams.usda.gov/rules-regulations/organic',
    what: 'At least 95% certified-organic ingredients; annual on-site inspection.',
    tier: 'silver',
  },
  'gfco': {
    id: 'gfco',
    name: 'GFCO Gluten-Free Certified',
    body: 'Gluten Intolerance Group',
    verifierUrl: 'https://gfco.org/find-a-certified-product/',
    what: 'Verified to <10 ppm gluten (stricter than the FDA <20 ppm threshold).',
    tier: 'silver',
  },
  'ewg': {
    id: 'ewg',
    name: 'EWG Verified',
    body: 'Environmental Working Group',
    verifierUrl: 'https://www.ewg.org/ewgverified/',
    what: 'Screens for ingredients EWG considers harmful; discloses full ingredient list.',
    tier: 'silver',
  },
  'clp': {
    id: 'clp',
    name: 'Clean Label Project',
    body: 'Clean Label Project',
    verifierUrl: 'https://cleanlabelproject.org/',
    what: 'Tests finished products for 400+ environmental contaminants and heavy metals.',
    tier: 'silver',
  },
  'labdoor': {
    id: 'labdoor',
    name: 'Labdoor Tested',
    body: 'Labdoor',
    verifierUrl: 'https://labdoor.com/',
    what: 'Independent lab testing with public grade cards for each product.',
    tier: 'bronze',
  },
  'cgmp': {
    id: 'cgmp',
    name: 'cGMP Manufactured',
    body: 'FDA / NSF / UL (varies)',
    verifierUrl: 'https://www.fda.gov/food/current-good-manufacturing-practices-cgmps-food-and-dietary-supplements',
    what: 'Current Good Manufacturing Practice compliance. Baseline expectation, not a purity verifier.',
    tier: 'baseline',
  },
}

// -------- LABEL SCANNER --------
// Given a DSLD label (or a synthetic haystack), return an array of certification
// entries detected in the free-text fields.
const CERT_PATTERNS = [
  { id: 'nsf-sport',       re: /nsf\s*(certified\s*)?for\s*sport/i },
  { id: 'nsf-supplement',  re: /(nsf\s*(contents\s*)?certified|nsf\s*\.?\s*org)/i },
  { id: 'usp',             re: /usp\s*verified/i },
  { id: 'informed-sport',  re: /informed[\-\s]sport/i },
  { id: 'informed-choice', re: /informed[\-\s]choice/i },
  { id: 'ifos-5',          re: /ifos\s*5[\-\s]?star/i },
  { id: 'ifos',            re: /(ifos|international fish oil standards)/i },
  { id: 'non-gmo',         re: /non[\-\s]?gmo\s*project(\s*verified)?/i },
  { id: 'usda-organic',    re: /usda\s*(certified\s*)?organic/i },
  { id: 'gfco',            re: /(gfco|gluten[\-\s]?free certified|certified gluten[\-\s]?free)/i },
  { id: 'ewg',             re: /ewg\s*verified/i },
  { id: 'clp',             re: /clean\s*label\s*project/i },
  { id: 'labdoor',         re: /labdoor/i },
  { id: 'cgmp',            re: /(cgmp|current good manufacturing practice|gmp[- ]compliant|gmp[- ]certified|good manufacturing practices?)/i },
]

export function detectCertificationsFromText(text) {
  if (!text) return []
  const hay = String(text)
  const found = new Map()
  for (const p of CERT_PATTERNS) {
    if (p.re.test(hay)) {
      const reg = CERT_REGISTRY[p.id]
      if (reg) found.set(reg.id, { ...reg, source: 'label' })
    }
  }
  return Array.from(found.values())
}

export function detectCertificationsFromLabelDetail(label) {
  if (!label) return []
  const parts = []
  parts.push(label.fullName || '')
  parts.push(label.brandName || '')
  if (label.claims)   parts.push(JSON.stringify(label.claims))
  if (label.statements) parts.push(JSON.stringify(label.statements))
  if (label.targetGroups) parts.push(JSON.stringify(label.targetGroups))
  return detectCertificationsFromText(parts.join(' \n '))
}

export function detectCertificationsFromSearchHit(source) {
  if (!source) return []
  const parts = [
    source.fullName, source.brandName,
    (source.claims || []).map((c) => c?.langualCodeDescription || c?.value || '').join(' '),
    (source.targetGroups || []).map((t) => t?.langualCodeDescription || t?.value || t).join(' '),
  ].filter(Boolean).join(' \n ')
  return detectCertificationsFromText(parts)
}

// Merge certifications from multiple sources, deduplicated by id.
export function mergeCertifications(...lists) {
  const out = new Map()
  for (const list of lists) {
    for (const c of list || []) {
      if (!c) continue
      const key = c.id
      if (!out.has(key)) out.set(key, c)
    }
  }
  return Array.from(out.values())
}

// Tier ranking helper for sorting.
export const CERT_TIER_ORDER = { gold: 3, silver: 2, bronze: 1, baseline: 0 }
export function sortCertifications(list) {
  return [...list].sort((a, b) => (CERT_TIER_ORDER[b.tier] ?? 0) - (CERT_TIER_ORDER[a.tier] ?? 0))
}
