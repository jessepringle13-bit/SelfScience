// /app/lib/supplements/brandDirectory.js
// Curated map of well-known dietary-supplement brands to their canonical
// official-store domains. Enforces our "brand-direct, no marketplace" rule.
//
// The DSLD label detail endpoint also returns a `webAddress` field under
// contacts[] — we PREFER the curated entry when available (correct casing,
// verified canonical), but always fall back to the manufacturer-supplied
// address, and finally to a scoped Google search for the brand name.

export const CURATED_BRANDS = {
  // Practitioner / clinician-grade
  'thorne': { domain: 'thorne.com', trust: ['NSF Certified for Sport (select products)', 'cGMP', '4 independent quality tests'] },
  'thorne research': { domain: 'thorne.com', trust: ['NSF Certified for Sport (select products)', 'cGMP'] },
  'pure encapsulations': { domain: 'pureencapsulations.com', trust: ['NSF Registered GMP', 'Hypoallergenic'] },
  'designs for health': { domain: 'designsforhealth.com', trust: ['cGMP', 'Third-party tested'] },
  'metagenics': { domain: 'metagenics.com', trust: ['cGMP', 'Practitioner brand'] },
  'seeking health': { domain: 'seekinghealth.com', trust: ['cGMP', 'Third-party tested'] },
  'klaire labs': { domain: 'klaire.com', trust: ['cGMP', 'Hypoallergenic'] },
  'klaire': { domain: 'klaire.com', trust: ['cGMP'] },
  'standard process': { domain: 'standardprocess.com', trust: ['cGMP', 'Whole food based'] },
  'kirkman': { domain: 'kirkmangroup.com', trust: ['cGMP', 'Ultra-tested'] },
  'kirkman group': { domain: 'kirkmangroup.com', trust: ['cGMP'] },
  'metabolic maintenance': { domain: 'metabolicmaintenance.com', trust: ['cGMP', 'Made in USA'] },
  'methylpro': { domain: 'methylpro.com', trust: ['Manufactured by Metabolic Maintenance', 'cGMP'] },

  // Broad-market / DTC
  'life extension': { domain: 'lifeextension.com', trust: ['cGMP', 'Third-party tested'] },
  'now foods': { domain: 'nowfoods.com', trust: ['UL cGMP', 'A-rated by ConsumerLab'] },
  'now': { domain: 'nowfoods.com', trust: ['UL cGMP'] },
  'jarrow formulas': { domain: 'jarrow.com', trust: ['cGMP'] },
  'jarrow': { domain: 'jarrow.com', trust: ['cGMP'] },
  'nordic naturals': { domain: 'nordicnaturals.com', trust: ['IFOS 5-star', 'Third-party tested purity'] },
  'solgar': { domain: 'solgar.com', trust: ['cGMP'] },
  "doctor's best": { domain: 'drbvitamins.com', trust: ['cGMP'] },
  'doctors best': { domain: 'drbvitamins.com', trust: ['cGMP'] },
  'sports research': { domain: 'sportsresearch.com', trust: ['IGEN Non-GMO', 'Third-party tested'] },
  'bulk supplements': { domain: 'bulksupplements.com', trust: ['cGMP', 'Third-party tested'] },
  'bulksupplements': { domain: 'bulksupplements.com', trust: ['cGMP'] },

  // Athlete / performance
  'momentous': { domain: 'livemomentous.com', trust: ['NSF Certified for Sport', 'Informed Sport'] },
  'legion athletics': { domain: 'legionathletics.com', trust: ['Labdoor tested', 'Made in USA'] },
  'legion': { domain: 'legionathletics.com', trust: ['Third-party tested'] },
  'onnit': { domain: 'onnit.com', trust: ['cGMP'] },
  'ag1': { domain: 'drinkag1.com', trust: ['NSF Certified for Sport'] },
  'athletic greens': { domain: 'drinkag1.com', trust: ['NSF Certified for Sport'] },

  // DTC / modern brands
  'ritual': { domain: 'ritual.com', trust: ['Made Traceable', 'USP verified (select)'] },
  'bulletproof': { domain: 'bulletproof.com', trust: ['Third-party tested'] },
  'quicksilver scientific': { domain: 'quicksilverscientific.com', trust: ['Liposomal delivery', 'cGMP'] },
  'cymbiotika': { domain: 'cymbiotika.com', trust: ['Third-party tested'] },
  'paleovalley': { domain: 'paleovalley.com', trust: ['Third-party tested', 'Made in USA'] },
  'ancestral supplements': { domain: 'ancestralsupplements.com', trust: ['Grass-fed', 'Made in USA'] },
  'just ingredients': { domain: 'justingredients.us', trust: ['Third-party tested'] },
  'armra': { domain: 'tryarmra.com', trust: ['cGMP'] },
  'beam minerals': { domain: 'beamminerals.com', trust: ['Third-party tested'] },

  // Electrolyte / hydration
  'lmnt': { domain: 'drinklmnt.com', trust: ['No sugar', 'Third-party tested'] },
  'redmond': { domain: 'redmond.life', trust: ['Independently tested'] },

  // Fish / EFA specialists
  'carlson': { domain: 'carlsonlabs.com', trust: ['IFOS 5-star (select)', 'cGMP'] },
  'carlson labs': { domain: 'carlsonlabs.com', trust: ['IFOS 5-star (select)', 'cGMP'] },
  'wiley\'s finest': { domain: 'wileysfinest.com', trust: ['IFOS 5-star', 'Family-owned'] },

  // Vitamin D specialists
  'thorne d/k2': { domain: 'thorne.com', trust: ['NSF cGMP'] },
}

// Brand-store URL builder.
// Priority:
//   1. Curated canonical domain (verified official).
//   2. Manufacturer-supplied webAddress from DSLD label contact record
//      (only if it looks like a plausible brand domain, NOT a marketplace).
//   3. Scoped Google search: google.com/search?q=BrandName+site:BrandName.com
//      — never a direct Amazon/marketplace deep link.
const MARKETPLACE_BLOCKLIST = [
  'amazon.', 'amzn.', 'walmart.', 'ebay.', 'target.', 'costco.', 'iherb.',
  'vitacost.', 'gnc.', 'vitaminshoppe.', 'thrivemarket.', 'kroger.', 'cvs.',
  'walgreens.', 'riteaid.', 'safeway.', 'wholefoodsmarket.',
]

function slug(str) {
  return String(str || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s\-']/g, '').trim()
}

export function resolveBrandUrl(brandName, dsldWebAddress) {
  const brand = slug(brandName)
  const curated = CURATED_BRANDS[brand]
  if (curated?.domain) {
    return {
      url: `https://${curated.domain}`,
      source: 'curated',
      trust: curated.trust || [],
      canonical: true,
    }
  }

  // Try DSLD-provided web address — but reject marketplaces
  if (dsldWebAddress && typeof dsldWebAddress === 'string') {
    const w = dsldWebAddress.trim().toLowerCase()
    const isMarketplace = MARKETPLACE_BLOCKLIST.some((m) => w.includes(m))
    if (!isMarketplace && (w.includes('.') || w.startsWith('http'))) {
      // Normalize to https://
      let cleaned = w
      if (!cleaned.startsWith('http')) cleaned = 'https://' + cleaned
      try {
        const u = new URL(cleaned)
        return {
          url: `https://${u.hostname.replace(/^www\./, '')}`,
          source: 'dsld_manufacturer',
          trust: [],
          canonical: false,
        }
      } catch { /* fall through */ }
    }
  }

  // Fallback: search-scoped link (never marketplace)
  const q = encodeURIComponent(`${brandName} official site`)
  return {
    url: `https://www.google.com/search?q=${q}`,
    source: 'search_fallback',
    trust: [],
    canonical: false,
  }
}

export function getCuratedTrustBadges(brandName) {
  const brand = slug(brandName)
  return CURATED_BRANDS[brand]?.trust || []
}

export function isBrandCurated(brandName) {
  return !!CURATED_BRANDS[slug(brandName)]
}
