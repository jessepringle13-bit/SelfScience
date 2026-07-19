// /app/utils/brandScore.js
// SelfScience — BrandScore™ v1
// Pure utility that computes a 0–10 quality score for any curated brand
// across 6 weighted categories. The score is derived directly from the
// fields already present in BRAND_PROFILES + BRAND_EXTRAS — no new
// per-brand data required.
//
// Category weights (total = 90 without genomics, 100 with):
//   1. Manufacturing Standards   (20 pts)
//   2. Product Certifications    (20 pts)
//   3. Testing Benchmarks        (20 pts)
//   4. Product Quality           (15 pts)
//   5. Scientific Innovation     (15 pts)
//   6. Genomics Relevance        (10 pts) — user-specific, injected
//
// Colour tiers on the resulting 0–10:
//   ≥ 8.0 → 'high'   (emerald)
//   5.0-7.9 → 'moderate' (amber)
//   < 5.0  → 'low'   (red)

const CAT_MAX = {
  manufacturing: 20,
  certifications: 20,
  testing: 20,
  quality: 15,
  science: 15,
  genomics: 10,
}

// ─── Category scorers ─────────────────────────────────────────────────

function scoreManufacturing(b) {
  let s = 0
  const mfg = String(b.manufacturing || '').toLowerCase()
  const progs = b.programmes || []
  if (progs.includes('cgmp')) s += 6                 // 3rd-party cGMP audit signal
  else if (/cgmp/i.test(mfg)) s += 3                 // Self-reported cGMP
  if (/us[a]?[),.\s]/i.test(b.hq || '')) s += 3      // US manufacturing signal
  if (/nsf-?registered/.test(mfg) || progs.includes('nsf-sport') || progs.includes('nsf-supplement')) s += 4
  if (!b.fdaWarningLetterActive)  s += 4              // Absence signal — assume clear
  if (!b.fdaRecallActive)         s += 3
  return Math.min(s, CAT_MAX.manufacturing)
}

function scoreCertifications(b) {
  let s = 0
  const p = new Set(b.programmes || [])
  if (p.has('usp'))            s += 5
  if (p.has('nsf-sport'))      s += 5
  if (p.has('informed-sport') || p.has('informed-choice')) s += 4
  if (p.has('clean-label'))    s += 3
  if (p.has('usda-organic'))   s += 2
  if (p.has('non-gmo'))        s += 1
  if (p.has('gfco'))           s += 1
  if (p.has('vegan'))          s += 1
  if (p.has('suppco'))         s += 3
  return Math.min(s, CAT_MAX.certifications)
}

function scoreTesting(b) {
  let s = 0
  const coa = String(b.coaPolicy || '').toLowerCase()
  if (/iso\s*17025|3rd-?party|third-?party/.test(coa)) s += 6
  if (/batch|lot/.test(coa)) s += 5
  if (/heavy metals|contamin/.test(coa)) s += 3
  if (/potency|label accuracy/.test(coa)) s += 3
  if (/purity|pestic/.test(coa)) s += 2
  if (/identity/.test(coa)) s += 1
  // Baseline for brands who publish any CoA policy at all
  if (s === 0 && coa) s += 3
  return Math.min(s, CAT_MAX.testing)
}

function scoreQuality(b) {
  let s = 0
  const focus = String(b.focus || '').toLowerCase()
  if (/patent|clinical/i.test(focus)) s += 4
  if (/no.*artificial|clean|hypoallergenic|no unnecessary|no fillers/i.test(focus)) s += 3
  if (String(b.proprietaryBlends || '').toLowerCase().includes('no')) s += 3
  s += 2                                        // Baseline: no labelling discrepancies flagged
  if ((b.programmes || []).includes('usda-organic')) s += 2
  if ((b.programmes || []).includes('vegan')) s += 1
  return Math.min(s, CAT_MAX.quality)
}

function scoreScience(b) {
  let s = 0
  const partners = (b.partners || []).join(' ').toLowerCase()
  const studies = (b.notableStudies || []).join(' ').toLowerCase()
  const focus = String(b.focus || '').toLowerCase()
  if (/phd|md|pharmd|nd|founded by/.test(focus + ' ' + partners)) s += 4
  if (studies || /rct|clinical trial|peer-reviewed/.test(partners + ' ' + focus)) s += 5
  if (/practitioner|clinical|clinician/.test(focus)) s += 3
  if (/whitepaper|research|publication/.test(partners + ' ' + focus)) s += 2
  if (/mayo|harvard|stanford|university|institute/.test(partners)) s += 1
  return Math.min(s, CAT_MAX.science)
}

// Genomics sub-score — computed at render time from user variants.
// activeForms is the array from activeGenomeFormsFromContext.
function scoreGenomics(brandExtras, activeForms) {
  if (!activeForms?.length) return null // signal "no genome uploaded"
  const set = new Set(brandExtras?.genomeForms || [])
  const matched = activeForms.filter((f) => set.has(f)).length
  if (matched === 0) return 2 // brand doesn't clash, but no active match either
  if (matched === 1) return 6
  if (matched === 2) return 8
  return CAT_MAX.genomics
}

// ─── Public API ───────────────────────────────────────────────────────

// Compute the full BrandScore breakdown for a brand.
// Returns:
//   {
//     overall: number (0-10),
//     tier: 'high'|'moderate'|'low',
//     subScores: { manufacturing, certifications, testing, quality, science, genomics? },
//     rawTotal: number (0-90 or 0-100),
//     maxTotal: 90 | 100,
//   }
export function computeBrandScore(brand, brandExtras = {}, activeForms = null) {
  const sub = {
    manufacturing:  scoreManufacturing(brand),
    certifications: scoreCertifications(brand),
    testing:        scoreTesting(brand),
    quality:        scoreQuality(brand),
    science:        scoreScience(brand),
  }
  const gen = scoreGenomics(brandExtras, activeForms)
  const includeGen = gen != null

  const rawTotal = Object.values(sub).reduce((a, b) => a + b, 0) + (includeGen ? gen : 0)
  const maxTotal = 90 + (includeGen ? 10 : 0)
  const overall = Math.round((rawTotal / maxTotal) * 100) / 10 // 0.0 – 10.0

  return {
    overall,
    tier: overall >= 8 ? 'high' : overall >= 5 ? 'moderate' : 'low',
    subScores: includeGen ? { ...sub, genomics: gen } : sub,
    rawTotal,
    maxTotal,
  }
}

// Tailwind chip styles keyed by tier.
export const BRAND_SCORE_STYLE = {
  high:     { chip: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', label: 'High quality' },
  moderate: { chip: 'bg-amber-100 text-amber-800 border-amber-300',       dot: 'bg-amber-500',   label: 'Moderate' },
  low:      { chip: 'bg-red-100 text-red-800 border-red-300',             dot: 'bg-red-500',     label: 'Use caution' },
}

// Category display metadata for sub-score bars / radar labels.
export const CATEGORY_META = {
  manufacturing:  { label: 'Mfg',    max: 20, color: '#0891B2' },
  certifications: { label: 'Certs',  max: 20, color: '#0F766E' },
  testing:        { label: 'Testing',max: 20, color: '#B45309' },
  quality:        { label: 'Quality',max: 15, color: '#7C3AED' },
  science:        { label: 'Science',max: 15, color: '#C45820' },
  genomics:       { label: 'Genome', max: 10, color: '#059669' },
}
