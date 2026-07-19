// /app/lib/pgxPlainEnglish.js
// Plain-English impact statements + clinical severity mapping for each PGx
// phenotype. Consumed by the Drug Check page (PhenotypeSnapshot cards) and
// the "gene status highlight" bar that surfaces when a user taps a Popular
// Check chip.
//
// Severity buckets (colour-coded left borders on PGx cards):
//   'normal'       → green   — standard dosing expected
//   'intermediate' → amber   — monitor, may need dose consideration
//   'critical'     → orange  — clinically significant, discuss with prescriber
//
// All statements are educational only — never a substitute for clinical PGx.

// (gene, phenotypeCode) → { impact, severity }
const MAP = {
  CYP2C19: {
    EM: { severity: 'normal',       impact: 'Standard doses of clopidogrel, omeprazole, escitalopram and other CYP2C19 drugs are likely to work as expected for you.' },
    RM: { severity: 'intermediate', impact: 'You clear CYP2C19 drugs (e.g. escitalopram, PPIs) faster than average — standard doses may under-treat. Ask your prescriber about dose adjustments.' },
    UM: { severity: 'intermediate', impact: 'You clear CYP2C19 drugs rapidly. Escitalopram, PPIs and voriconazole may be less effective at standard doses.' },
    IM: { severity: 'intermediate', impact: 'You process CYP2C19 drugs more slowly than average. Clopidogrel may be less effective; PPI and escitalopram doses may need adjustment.' },
    PM: { severity: 'critical',     impact: 'Clopidogrel may be significantly less effective for you — an alternative antiplatelet is usually recommended. Standard PPI and escitalopram doses may be too high.' },
  },
  CYP2D6: {
    EM: { severity: 'normal',       impact: 'Standard doses of codeine, tramadol, tamoxifen, and most SSRIs metabolised by CYP2D6 are likely to work as expected for you.' },
    RM: { severity: 'intermediate', impact: 'You convert codeine to morphine more quickly — even standard doses can produce stronger opioid effects. Discuss alternatives with your prescriber.' },
    UM: { severity: 'critical',     impact: 'Ultra-rapid CYP2D6 metabolism: codeine and tramadol can produce dangerously high morphine levels. Codeine is generally avoided for you.' },
    IM: { severity: 'intermediate', impact: 'You process CYP2D6 drugs more slowly. Codeine and tramadol may give little pain relief; some SSRIs and tamoxifen may accumulate.' },
    PM: { severity: 'critical',     impact: 'Codeine and tramadol are unlikely to give pain relief and other CYP2D6 drugs may accumulate. Discuss alternatives with your prescriber.' },
  },
  CYP2C9: {
    EM: { severity: 'normal',       impact: 'Standard doses of warfarin, NSAIDs, and phenytoin metabolised by CYP2C9 are likely to work as expected for you.' },
    IM: { severity: 'intermediate', impact: 'You process CYP2C9 drugs more slowly — warfarin, NSAIDs and phenytoin may accumulate. Your prescriber may start at a lower dose.' },
    PM: { severity: 'critical',     impact: 'Significantly reduced CYP2C9 activity — warfarin dosing especially needs careful titration. Discuss any CYP2C9-metabolised drug with your prescriber.' },
  },
  VKORC1: {
    lower_sensitivity:  { severity: 'normal',       impact: 'Standard warfarin doses are likely to be effective — you have typical sensitivity to warfarin.' },
    normal:             { severity: 'intermediate', impact: 'Intermediate warfarin sensitivity — expect closer INR monitoring in the first weeks of therapy.' },
    higher_sensitivity: { severity: 'critical',     impact: 'You are more sensitive to warfarin — lower starting doses are typically recommended to avoid bleeding.' },
  },
  SLCO1B1: {
    normal:              { severity: 'normal',       impact: 'Standard statin dosing (simvastatin, atorvastatin, rosuvastatin) is likely to be well-tolerated.' },
    decreased_transport: { severity: 'intermediate', impact: 'Statins may accumulate more in your system — your prescriber may consider a lower dose or an alternative statin, especially at higher doses.' },
    poor_transport:      { severity: 'critical',     impact: 'Higher risk of statin-induced muscle side-effects (myopathy). High-dose simvastatin is generally avoided; discuss dose or alternative with your prescriber.' },
  },
  DPYD: {
    normal:           { severity: 'normal',       impact: 'Standard doses of fluorouracil-based chemotherapy (5-FU, capecitabine) are typically well-tolerated for you.' },
    reduced_activity: { severity: 'critical',     impact: 'Reduced DPD activity means fluorouracil and capecitabine can cause severe, sometimes life-threatening toxicity. Any oncologist treating you must know this before chemotherapy.' },
    deficient:        { severity: 'critical',     impact: 'DPD deficiency: fluorouracil-based chemotherapy is contraindicated or requires major dose reduction. Bring this to any oncologist immediately.' },
  },
  TPMT: {
    normal:       { severity: 'normal',       impact: 'Standard doses of thiopurines (azathioprine, mercaptopurine) are typically well-tolerated for you.' },
    intermediate: { severity: 'intermediate', impact: 'Intermediate TPMT activity — thiopurine doses (azathioprine, mercaptopurine) usually need a 30–70 % reduction and closer blood-count monitoring.' },
    deficient:    { severity: 'critical',     impact: 'TPMT deficient: standard thiopurine doses can cause life-threatening bone-marrow suppression. Dosing must be dramatically reduced or an alternative used.' },
  },
}

const FALLBACK_BY_LABEL = [
  // Label-substring fallback for anything not in the phenotype-code map.
  { match: /poor|deficien|higher sensitivity/i,          severity: 'critical' },
  { match: /intermediate|reduced|decreased|ultra-rapid/i, severity: 'intermediate' },
  { match: /normal|extensive|standard|lower sensitivity/i, severity: 'normal' },
]

// Returns { severity, impact } for a given (gene, phenotypeObj) pair.
// Falls back gracefully if the phenotype isn't in the map.
export function getPgxPlainEnglish(gene, phenotypeObj) {
  if (!phenotypeObj) return { severity: 'normal', impact: null }
  const code = phenotypeObj.phenotype
  const g = MAP[gene]
  if (g && g[code]) return g[code]

  // Label-substring fallback for severity + a generic impact line.
  const label = String(phenotypeObj.label || '')
  const fallback = FALLBACK_BY_LABEL.find((r) => r.match.test(label))
  return {
    severity: fallback ? fallback.severity : 'normal',
    impact: null,
  }
}

// Convenience — severity → design-token colours.
export const SEVERITY_TOKENS = {
  normal: {
    ring: 'ring-ss-green/40',
    border: 'border-ss-green',
    chip: 'bg-ss-green/15 text-ss-green',
    dotHex: '#2E7D32',
    label: 'Standard dosing likely',
  },
  intermediate: {
    ring: 'ring-ss-amber/40',
    border: 'border-ss-amber',
    chip: 'bg-ss-amber/15 text-ss-amber',
    dotHex: '#B45309',
    label: 'May need monitoring',
  },
  critical: {
    ring: 'ring-ss-orange/50',
    border: 'border-ss-orange',
    chip: 'bg-ss-orange/15 text-ss-orange',
    dotHex: '#C45820',
    label: 'Discuss with prescriber',
  },
}

// Same helper but for a specific drug — combines the drug's primaryGene
// with the user's phenotype to produce a one-line implication.
export function getDrugGeneImplication(drug, phenotypes) {
  if (!drug?.primaryGene || !phenotypes) return null
  const gene = drug.primaryGene
  const ph = phenotypes[gene]
  if (!ph) return null
  const { severity, impact } = getPgxPlainEnglish(gene, ph)
  return { gene, phenotype: ph, severity, impact }
}
