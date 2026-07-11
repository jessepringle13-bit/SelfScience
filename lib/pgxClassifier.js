// /app/lib/pgxClassifier.js
// SelfScience — Pharmacogenomic phenotype inference from consumer-genome SNPs.
//
// This module estimates simplified CPIC-style metabolizer phenotypes for
// the most common PGx genes from single-SNP consumer genome data. It is
// deliberately NOT a full star-allele caller — those require sequencing
// depth 23andMe / AncestryDNA don't provide. Instead we surface a
// conservative bucket per gene:
//
//   CYP2C19: 'PM' | 'IM' | 'EM' | 'RM' | 'UM'
//   CYP2D6:  'PM' | 'IM' | 'EM' | 'UM'
//   CYP2C9:  'PM' | 'IM' | 'EM'
//   VKORC1:  'higher_sensitivity' | 'normal' | 'lower_sensitivity'
//   SLCO1B1: 'poor_transport' | 'decreased_transport' | 'normal'
//   DPYD:    'reduced_activity' | 'normal'
//   TPMT:    'deficient' | 'intermediate' | 'normal'
//
// Compliance: every returned phenotype is framed as "estimated from single
// SNP" — the UI must always show "Confirm star-allele status with a
// clinical PGx test before dosing decisions."

import { flattenReportCards } from './supplementProtocol'

// The report keeps the RAW genotype map (from the client-side parser) at
// `report._variants` — this is where PGx-only rsIDs live (rs4244285 etc.
// aren't in the wellness classification tables so they don't surface as
// cards). We look here first, then fall back to classified cards.
function gt(rawOrCards, rsid) {
  // Support both a rawVariants object {rsid: 'AG', ...} and a cards array.
  let raw = null
  if (rawOrCards && !Array.isArray(rawOrCards)) {
    raw = rawOrCards[rsid]
  } else if (Array.isArray(rawOrCards)) {
    const c = rawOrCards.find((c) => c.rsid === rsid)
    raw = c?.genotype
  }
  if (!raw) return null
  const g = String(raw).toUpperCase().replace(/[^A-Z]/g, '')
  return g.length === 2 ? [...g].sort().join('') : g
}
function has(src, rsid, ...alleles) {
  const g = gt(src, rsid); if (!g) return false
  return alleles.some((a) => {
    const x = String(a).toUpperCase().replace(/[^A-Z]/g, '')
    return g === (x.length === 2 ? [...x].sort().join('') : x)
  })
}
function countAlt(src, rsid, altAllele) {
  const g = gt(src, rsid); if (!g) return 0
  return g.split('').filter((a) => a === altAllele.toUpperCase()).length
}

// -------------------- CYP2C19 --------------------
// *2 (loss-of-function): rs4244285 A (from G>A on the SNP)
// *3 (loss-of-function): rs4986893 A (from G>A)
// *17 (increased):       rs12248560 T (from C>T)
export function inferCYP2C19(cards) {
  const lof = countAlt(cards, 'rs4244285', 'A') + countAlt(cards, 'rs4986893', 'A')
  const gof = countAlt(cards, 'rs12248560', 'T')
  if (lof >= 2) return { phenotype: 'PM', label: 'Poor Metabolizer', activity: 0 }
  if (lof === 1 && gof === 0) return { phenotype: 'IM', label: 'Intermediate Metabolizer', activity: 0.5 }
  if (lof === 1 && gof >= 1) return { phenotype: 'IM', label: 'Intermediate Metabolizer', activity: 0.75 }
  if (gof >= 2) return { phenotype: 'UM', label: 'Ultra-rapid Metabolizer', activity: 2 }
  if (gof === 1) return { phenotype: 'RM', label: 'Rapid Metabolizer', activity: 1.5 }
  return { phenotype: 'EM', label: 'Extensive (Normal) Metabolizer', activity: 1 }
}

// -------------------- CYP2D6 --------------------
// Simplified from CYP2D6*10 (rs1065852 A) and *4 (rs3892097 A). Consumer
// files can’t resolve full star-allele calls so this is a rough guide only.
export function inferCYP2D6(cards) {
  const star4  = countAlt(cards, 'rs3892097', 'A')   // *4 LoF
  const star10 = countAlt(cards, 'rs1065852', 'A')   // *10 decreased
  const star6  = countAlt(cards, 'rs5030655', '-') + countAlt(cards, 'rs5030655', 'T')
  const lof = star4 + star6
  if (lof >= 2) return { phenotype: 'PM', label: 'Poor Metabolizer', activity: 0 }
  if (lof === 1) return { phenotype: 'IM', label: 'Intermediate Metabolizer', activity: 0.5 }
  if (star10 >= 2) return { phenotype: 'IM', label: 'Intermediate Metabolizer', activity: 0.5 }
  if (star10 === 1) return { phenotype: 'IM', label: 'Intermediate Metabolizer', activity: 0.75 }
  return { phenotype: 'EM', label: 'Extensive (Normal) Metabolizer', activity: 1 }
}

// -------------------- CYP2C9 --------------------
// *2 (rs1799853 T), *3 (rs1057910 C from A>C)
export function inferCYP2C9(cards) {
  const star2 = countAlt(cards, 'rs1799853', 'T')
  const star3 = countAlt(cards, 'rs1057910', 'C')
  const lof = star2 + star3
  if (lof >= 2) return { phenotype: 'PM', label: 'Poor Metabolizer', activity: 0 }
  if (lof === 1) return { phenotype: 'IM', label: 'Intermediate Metabolizer', activity: 0.5 }
  return { phenotype: 'EM', label: 'Extensive (Normal) Metabolizer', activity: 1 }
}

// -------------------- VKORC1 --------------------
// rs9923231 T = increased warfarin sensitivity (lower dose needed)
export function inferVKORC1(cards) {
  const t = countAlt(cards, 'rs9923231', 'T') + countAlt(cards, 'rs9923231', 'A')
  if (t >= 2) return { phenotype: 'higher_sensitivity', label: 'Higher warfarin sensitivity' }
  if (t === 1) return { phenotype: 'normal', label: 'Intermediate warfarin sensitivity' }
  return { phenotype: 'lower_sensitivity', label: 'Lower warfarin sensitivity' }
}

// -------------------- SLCO1B1 --------------------
// rs4149056 C = decreased statin transport into hepatocytes
export function inferSLCO1B1(cards) {
  if (has(cards, 'rs4149056', 'CC', 'GG')) return { phenotype: 'poor_transport', label: 'Poor statin transporter' }
  if (has(cards, 'rs4149056', 'CT', 'TC', 'AG', 'GA')) return { phenotype: 'decreased_transport', label: 'Decreased statin transporter' }
  return { phenotype: 'normal', label: 'Normal statin transport' }
}

// -------------------- DPYD --------------------
// rs1801265 A allele associated with reduced DPD activity
export function inferDPYD(cards) {
  const a = countAlt(cards, 'rs1801265', 'A')
  if (a >= 1) return { phenotype: 'reduced_activity', label: 'Reduced DPD activity' }
  return { phenotype: 'normal', label: 'Normal DPD activity' }
}

// -------------------- TPMT --------------------
// rs1800462 C (*2), rs1800460 T (*3B), rs1142345 C (*3C)
export function inferTPMT(cards) {
  const lof = countAlt(cards, 'rs1800462', 'C') + countAlt(cards, 'rs1800460', 'T') + countAlt(cards, 'rs1142345', 'C')
  if (lof >= 2) return { phenotype: 'deficient',    label: 'TPMT deficient' }
  if (lof === 1) return { phenotype: 'intermediate', label: 'Intermediate TPMT activity' }
  return { phenotype: 'normal', label: 'Normal TPMT activity' }
}

// -------------------- Master inference --------------------
// Returns a full phenotype snapshot from a genome report.
// Prefers report._variants (raw genotype map with ALL uploaded SNPs) so
// PGx-only rsIDs that don't have wellness classification cards still work.
// Falls back to flattened cards for backwards compatibility.
export function inferAllPGxPhenotypes(reportOrCards) {
  let src
  if (Array.isArray(reportOrCards)) {
    src = reportOrCards
  } else if (reportOrCards?._variants && typeof reportOrCards._variants === 'object') {
    src = reportOrCards._variants
  } else if (reportOrCards) {
    src = flattenReportCards(reportOrCards)
  } else {
    src = {}
  }
  return {
    CYP2C19: inferCYP2C19(src),
    CYP2D6:  inferCYP2D6(src),
    CYP2C9:  inferCYP2C9(src),
    VKORC1:  inferVKORC1(src),
    SLCO1B1: inferSLCO1B1(src),
    DPYD:    inferDPYD(src),
    TPMT:    inferTPMT(src),
  }
}
