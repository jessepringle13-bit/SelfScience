// /app/lib/drugCatalog.js
// SelfScience — Drug → pharmacogene mappings with CPIC-style guidance text.
//
// Each drug entry has: id, brand (list), generic (canonical), aliases[],
// class, primaryGene (main PGx driver), extraGenes, notes, and a
// `guidance(phenotypes)` function that returns { severity, headline, body,
// action } based on the user's inferred phenotype snapshot.
//
// Guidance strings are informed by CPIC/PharmGKB/FDA Table of Pharmacogenomic
// Associations language, but this app is NOT a clinical decision tool.
// Every result surface must show "Discuss with your prescribing clinician"
// framing.

// Severity tiers drive the color chip in the UI.
//   'clear'    = normal metabolizer / no concerns
//   'notice'   = intermediate / expect standard dose but monitor
//   'caution'  = clinically actionable per CPIC — physician should adjust
//   'critical' = strong CPIC "consider alternative" or major dose reduction
export const SEVERITY_META = {
  clear:    { label: 'Standard',   chip: 'bg-ss-green/10 text-ss-green',    dot: 'bg-ss-green' },
  notice:   { label: 'Monitor',    chip: 'bg-amber-100 text-amber-900',     dot: 'bg-amber-500' },
  caution:  { label: 'Caution',    chip: 'bg-ss-amber/10 text-ss-amber',    dot: 'bg-ss-amber' },
  critical: { label: 'Alternative',chip: 'bg-red-100 text-red-900',         dot: 'bg-red-600' },
}

// -------------------- Guidance helpers --------------------
// Reduce repetition across drug entries.

const cyp2c19Guidance = ({ drug, actionByPheno }) => (ph) => {
  const p = ph.CYP2C19.phenotype
  const label = ph.CYP2C19.label
  const action = actionByPheno[p] || actionByPheno.EM
  return {
    severity: action.severity,
    headline: `CYP2C19: ${label}`,
    body: action.body,
    action: action.action,
    gene: 'CYP2C19',
  }
}
const cyp2d6Guidance = ({ actionByPheno }) => (ph) => {
  const p = ph.CYP2D6.phenotype
  const label = ph.CYP2D6.label
  const action = actionByPheno[p] || actionByPheno.EM
  return { severity: action.severity, headline: `CYP2D6: ${label}`, body: action.body, action: action.action, gene: 'CYP2D6' }
}
const cyp2c9Guidance = ({ actionByPheno }) => (ph) => {
  const p = ph.CYP2C9.phenotype
  const label = ph.CYP2C9.label
  const action = actionByPheno[p] || actionByPheno.EM
  return { severity: action.severity, headline: `CYP2C9: ${label}`, body: action.body, action: action.action, gene: 'CYP2C9' }
}

// ---------------------------------------------------------------------------
// DRUG_CATALOG
// ---------------------------------------------------------------------------

export const DRUG_CATALOG = [
  // -------- Clopidogrel (CYP2C19) --------
  {
    id: 'clopidogrel',
    brand: ['Plavix'], generic: 'clopidogrel', aliases: ['plavix', 'clopidogrel'],
    class: 'Antiplatelet', primaryGene: 'CYP2C19',
    guidance: cyp2c19Guidance({ actionByPheno: {
      PM: { severity: 'critical', body: 'Poor CYP2C19 metabolism converts less clopidogrel to its active form, associated with reduced antiplatelet effect and higher cardiovascular event risk in research.', action: 'CPIC guidance suggests an alternative antiplatelet (prasugrel, ticagrelor) when clinically appropriate. Discuss with your cardiologist.' },
      IM: { severity: 'caution',  body: 'Intermediate CYP2C19 metabolism may reduce clopidogrel activation. CPIC lists alternatives as a consideration.', action: 'Discuss with your cardiologist whether an alternative antiplatelet is appropriate.' },
      EM: { severity: 'clear',    body: 'Expected clopidogrel activation.', action: 'Standard dosing per prescriber.' },
      RM: { severity: 'clear',    body: 'Expected or slightly increased clopidogrel activation.', action: 'Standard dosing per prescriber.' },
      UM: { severity: 'clear',    body: 'Increased clopidogrel activation.', action: 'Standard dosing per prescriber — monitor for bleeding as with any antiplatelet.' },
    }}),
  },

  // -------- PPIs: omeprazole, esomeprazole, pantoprazole (CYP2C19) --------
  ...['omeprazole', 'esomeprazole', 'pantoprazole', 'lansoprazole'].map((generic) => ({
    id: generic,
    brand: {
      omeprazole: ['Prilosec'], esomeprazole: ['Nexium'],
      pantoprazole: ['Protonix'], lansoprazole: ['Prevacid'],
    }[generic], generic, aliases: [generic],
    class: 'Proton Pump Inhibitor', primaryGene: 'CYP2C19',
    guidance: cyp2c19Guidance({ actionByPheno: {
      PM: { severity: 'notice', body: 'Poor CYP2C19 metabolism raises PPI exposure. Research suggests better acid suppression but higher long-term drug exposure.', action: 'Standard doses often work well — discuss lowest effective dose with your provider for long courses.' },
      IM: { severity: 'notice', body: 'Intermediate CYP2C19 metabolism slightly raises PPI exposure.', action: 'Standard dosing; consider lowest effective dose for long-term use.' },
      EM: { severity: 'clear',  body: 'Expected PPI clearance.', action: 'Standard dosing per prescriber.' },
      RM: { severity: 'notice', body: 'Rapid CYP2C19 metabolism may lower PPI exposure and reduce acid suppression.', action: 'If PPI feels ineffective, discuss dose adjustment or twice-daily dosing with your provider.' },
      UM: { severity: 'caution',body: 'Ultra-rapid CYP2C19 metabolism substantially lowers PPI exposure — standard doses may be less effective.', action: 'CPIC suggests a higher starting dose or alternative agent — discuss with your provider.' },
    }}),
  })),

  // -------- Escitalopram / Citalopram / Sertraline (CYP2C19) --------
  ...[
    { generic: 'escitalopram', brand: ['Lexapro'] },
    { generic: 'citalopram',   brand: ['Celexa'] },
    { generic: 'sertraline',   brand: ['Zoloft'] },
  ].map(({ generic, brand }) => ({
    id: generic, brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'SSRI Antidepressant', primaryGene: 'CYP2C19',
    guidance: cyp2c19Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: 'Poor CYP2C19 metabolism raises SSRI exposure and side-effect risk.', action: 'CPIC suggests starting at 50% of the usual dose or considering an alternative SSRI. Discuss with your prescriber.' },
      IM: { severity: 'notice',  body: 'Intermediate CYP2C19 metabolism raises SSRI exposure modestly.', action: 'Consider starting lower and titrating up. Discuss with prescriber.' },
      EM: { severity: 'clear',   body: 'Expected SSRI clearance.', action: 'Standard dosing per prescriber.' },
      RM: { severity: 'notice',  body: 'Rapid CYP2C19 metabolism may lower drug exposure and effect.', action: 'If response is poor, discuss dose adjustment or alternative with prescriber.' },
      UM: { severity: 'caution', body: 'Ultra-rapid CYP2C19 metabolism substantially lowers SSRI exposure. CPIC suggests an alternative not primarily metabolized by CYP2C19.', action: 'Discuss with your prescriber — alternatives like fluoxetine (CYP2D6) may be considered.' },
    }}),
  })),

  // -------- Codeine / Tramadol / Oxycodone / Hydrocodone (CYP2D6) --------
  ...[
    { generic: 'codeine',      brand: ['Tylenol #3'] },
    { generic: 'tramadol',     brand: ['Ultram'] },
  ].map(({ generic, brand }) => ({
    id: generic, brand, generic, aliases: [generic],
    class: 'Opioid Analgesic', primaryGene: 'CYP2D6',
    guidance: cyp2d6Guidance({ actionByPheno: {
      PM: { severity: 'critical', body: `Poor CYP2D6 metabolism converts less ${generic} to its active form — research reports reduced analgesic effect.`, action: 'CPIC suggests an alternative analgesic not primarily activated by CYP2D6 (e.g., morphine, hydromorphone). Discuss with prescriber.' },
      IM: { severity: 'caution',  body: `Intermediate CYP2D6 metabolism may reduce ${generic} activation and pain relief.`, action: 'If pain relief is inadequate, discuss alternatives with prescriber.' },
      EM: { severity: 'clear',    body: `Expected ${generic} activation.`, action: 'Standard dosing per prescriber.' },
      UM: { severity: 'critical', body: `Ultra-rapid CYP2D6 metabolism produces excess active metabolite — research links this to increased sedation, respiratory depression, and toxicity risk with ${generic}.`, action: 'CPIC lists this genotype as a contraindication for codeine and a strong caution for tramadol. Discuss alternatives with prescriber.' },
    }}),
  })),

  // -------- Fluoxetine / Paroxetine / Venlafaxine / Amitriptyline (CYP2D6) --------
  ...[
    { generic: 'fluoxetine',    brand: ['Prozac'] },
    { generic: 'paroxetine',    brand: ['Paxil'] },
    { generic: 'venlafaxine',   brand: ['Effexor'] },
    { generic: 'amitriptyline', brand: ['Elavil'] },
    { generic: 'nortriptyline', brand: ['Pamelor'] },
  ].map(({ generic, brand }) => ({
    id: generic, brand, generic, aliases: [generic],
    class: 'Antidepressant', primaryGene: 'CYP2D6',
    guidance: cyp2d6Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: `Poor CYP2D6 metabolism raises ${generic} exposure and side-effect risk.`, action: 'CPIC suggests a 50% dose reduction or alternative agent. Discuss with prescriber.' },
      IM: { severity: 'notice',  body: `Intermediate CYP2D6 metabolism raises ${generic} exposure modestly.`, action: 'Consider starting lower and titrating. Discuss with prescriber.' },
      EM: { severity: 'clear',   body: `Expected ${generic} clearance.`, action: 'Standard dosing per prescriber.' },
      UM: { severity: 'caution', body: `Ultra-rapid CYP2D6 metabolism lowers ${generic} exposure — response may be reduced.`, action: 'If response is poor, discuss dose or agent change with prescriber.' },
    }}),
  })),

  // -------- Metoprolol / Atomoxetine (CYP2D6) --------
  ...[
    { generic: 'metoprolol',  brand: ['Lopressor', 'Toprol'], cls: 'Beta-blocker' },
    { generic: 'atomoxetine', brand: ['Strattera'],           cls: 'ADHD medication' },
  ].map(({ generic, brand, cls }) => ({
    id: generic, brand, generic, aliases: [generic],
    class: cls, primaryGene: 'CYP2D6',
    guidance: cyp2d6Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: `Poor CYP2D6 metabolism raises ${generic} exposure.`, action: 'CPIC suggests dose reduction or slower titration. Discuss with prescriber.' },
      IM: { severity: 'notice',  body: `Intermediate CYP2D6 metabolism raises ${generic} exposure modestly.`, action: 'Standard start; monitor for side effects.' },
      EM: { severity: 'clear',   body: `Expected ${generic} clearance.`, action: 'Standard dosing per prescriber.' },
      UM: { severity: 'notice',  body: `Ultra-rapid CYP2D6 metabolism lowers exposure — response may be reduced.`, action: 'If response is inadequate, discuss with prescriber.' },
    }}),
  })),

  // -------- Warfarin (CYP2C9 + VKORC1 combined) --------
  {
    id: 'warfarin',
    brand: ['Coumadin'], generic: 'warfarin', aliases: ['warfarin', 'coumadin'],
    class: 'Anticoagulant', primaryGene: 'CYP2C9', extraGenes: ['VKORC1'],
    guidance: (ph) => {
      const c9 = ph.CYP2C9.phenotype
      const vk = ph.VKORC1.phenotype
      const parts = []
      if (c9 === 'PM' || c9 === 'IM') parts.push('reduced CYP2C9 metabolism')
      if (vk === 'higher_sensitivity') parts.push('higher VKORC1 sensitivity')
      const severity = (c9 === 'PM' || (c9 === 'IM' && vk === 'higher_sensitivity')) ? 'critical'
        : (c9 === 'IM' || vk === 'higher_sensitivity') ? 'caution'
        : 'clear'
      const body = parts.length
        ? `Your variants suggest ${parts.join(' and ')}, which research links to lower warfarin dose requirements and greater bleeding risk at standard doses.`
        : 'Your CYP2C9 and VKORC1 variants suggest a typical warfarin dose response.'
      const action = severity === 'clear'
        ? 'Standard initiation per prescriber — INR monitoring as usual.'
        : 'CPIC provides genotype-guided dosing algorithms. Share these results with your anticoagulation clinic before initiation.'
      return { severity, headline: `CYP2C9: ${ph.CYP2C9.label} · VKORC1: ${ph.VKORC1.label}`, body, action, gene: 'CYP2C9 + VKORC1' }
    },
  },

  // -------- Phenytoin, Celecoxib, Fluvastatin (CYP2C9) --------
  ...[
    { generic: 'phenytoin',   brand: ['Dilantin'],    cls: 'Anticonvulsant' },
    { generic: 'celecoxib',   brand: ['Celebrex'],    cls: 'NSAID' },
    { generic: 'fluvastatin', brand: ['Lescol'],      cls: 'Statin' },
  ].map(({ generic, brand, cls }) => ({
    id: generic, brand, generic, aliases: [generic],
    class: cls, primaryGene: 'CYP2C9',
    guidance: cyp2c9Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: `Poor CYP2C9 metabolism raises ${generic} exposure and side-effect risk.`, action: 'CPIC suggests reduced dosing or alternative. Discuss with prescriber.' },
      IM: { severity: 'notice',  body: `Intermediate CYP2C9 metabolism raises ${generic} exposure modestly.`, action: 'Standard start; monitor. Discuss with prescriber if side effects arise.' },
      EM: { severity: 'clear',   body: `Expected ${generic} clearance.`, action: 'Standard dosing per prescriber.' },
    }}),
  })),

  // -------- Statins (SLCO1B1) --------
  ...[
    { generic: 'simvastatin',  brand: ['Zocor'] },
    { generic: 'atorvastatin', brand: ['Lipitor'] },
    { generic: 'rosuvastatin', brand: ['Crestor'] },
    { generic: 'pravastatin',  brand: ['Pravachol'] },
  ].map(({ generic, brand }) => ({
    id: generic, brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'Statin', primaryGene: 'SLCO1B1',
    guidance: (ph) => {
      const p = ph.SLCO1B1.phenotype
      if (p === 'poor_transport') {
        return {
          severity: generic === 'simvastatin' ? 'critical' : 'caution',
          headline: `SLCO1B1: ${ph.SLCO1B1.label}`,
          body: `Poor SLCO1B1 transport raises ${generic} exposure and research-observed risk of statin-associated muscle symptoms (SAMS).`,
          action: generic === 'simvastatin'
            ? 'CPIC lists this genotype as a strong caution for high-dose simvastatin — consider a different statin or lower dose. Discuss with prescriber.'
            : `CPIC suggests avoiding high doses of ${generic} in this genotype. Discuss with prescriber.`,
          gene: 'SLCO1B1',
        }
      }
      if (p === 'decreased_transport') {
        return {
          severity: 'notice',
          headline: `SLCO1B1: ${ph.SLCO1B1.label}`,
          body: `Decreased SLCO1B1 transport modestly raises ${generic} exposure.`,
          action: `Standard dosing is often tolerated; monitor for muscle symptoms. Discuss with prescriber before high doses.`,
          gene: 'SLCO1B1',
        }
      }
      return { severity: 'clear', headline: `SLCO1B1: ${ph.SLCO1B1.label}`, body: `Expected ${generic} handling.`, action: 'Standard dosing per prescriber.', gene: 'SLCO1B1' }
    },
  })),

  // -------- Fluorouracil / Capecitabine / Tegafur (DPYD) --------
  ...[
    { generic: 'fluorouracil', brand: ['5-FU', 'Adrucil'] },
    { generic: 'capecitabine', brand: ['Xeloda'] },
    { generic: 'tegafur',      brand: ['Ftorafur'] },
  ].map(({ generic, brand }) => ({
    id: generic, brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'Chemotherapy', primaryGene: 'DPYD',
    guidance: (ph) => {
      if (ph.DPYD.phenotype === 'reduced_activity') {
        return {
          severity: 'critical',
          headline: `DPYD: ${ph.DPYD.label}`,
          body: `Reduced DPD activity slows fluoropyrimidine breakdown — research reports severe toxicity risk (mucositis, neutropenia, cardiotoxicity) at standard doses of ${generic}.`,
          action: 'CPIC strongly recommends genotype-guided dose reduction (25–50%) or alternative chemotherapy. Bring this to your oncologist BEFORE any 5-FU / capecitabine / tegafur regimen.',
          gene: 'DPYD',
        }
      }
      return { severity: 'clear', headline: `DPYD: ${ph.DPYD.label}`, body: `Expected ${generic} clearance.`, action: 'Standard oncologist-guided dosing.', gene: 'DPYD' }
    },
  })),

  // -------- Thiopurines (TPMT) --------
  ...[
    { generic: 'azathioprine',   brand: ['Imuran'] },
    { generic: 'mercaptopurine', brand: ['Purinethol'] },
  ].map(({ generic, brand }) => ({
    id: generic, brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'Immunosuppressant / Chemotherapy', primaryGene: 'TPMT',
    guidance: (ph) => {
      const p = ph.TPMT.phenotype
      if (p === 'deficient') return {
        severity: 'critical',
        headline: `TPMT: ${ph.TPMT.label}`,
        body: `Deficient TPMT activity causes severe, potentially fatal myelosuppression at standard ${generic} doses.`,
        action: 'CPIC strongly recommends alternative therapy or drastically reduced dosing (~10% of standard). Bring this finding to your prescribing physician immediately if this drug is being considered.',
        gene: 'TPMT',
      }
      if (p === 'intermediate') return {
        severity: 'caution',
        headline: `TPMT: ${ph.TPMT.label}`,
        body: `Intermediate TPMT activity raises myelosuppression risk at standard ${generic} doses.`,
        action: 'CPIC suggests reduced starting dose (30–80% of standard) and close monitoring. Discuss with prescriber.',
        gene: 'TPMT',
      }
      return { severity: 'clear', headline: `TPMT: ${ph.TPMT.label}`, body: `Expected ${generic} clearance.`, action: 'Standard prescriber-guided dosing with routine monitoring.', gene: 'TPMT' }
    },
  })),
]

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

export function findDrug(query) {
  if (!query) return null
  const q = query.trim().toLowerCase()
  return DRUG_CATALOG.find((d) =>
    d.id === q ||
    d.generic.toLowerCase() === q ||
    d.aliases?.some((a) => a.toLowerCase() === q) ||
    d.brand?.some((b) => b.toLowerCase() === q)
  ) || null
}

export function suggestDrugs(query, limit = 8) {
  if (!query) return []
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored = DRUG_CATALOG.map((d) => {
    const names = [d.generic, ...(d.brand || []), ...(d.aliases || [])].map((n) => n.toLowerCase())
    let best = -1
    for (const n of names) {
      if (n === q) { best = 100; break }
      if (n.startsWith(q)) { best = Math.max(best, 80) }
      else if (n.includes(q)) { best = Math.max(best, 40) }
    }
    return { drug: d, score: best }
  }).filter((s) => s.score > 0)
  scored.sort((a, b) => b.score - a.score || a.drug.generic.localeCompare(b.drug.generic))
  return scored.slice(0, limit).map((s) => s.drug)
}

export const DRUG_CHECKER_DISCLAIMER =
  'Educational only. Estimates come from single-SNP consumer genome data and are NOT a substitute for a clinical pharmacogenomic test. Never start, stop, or change any medication based on this tool — always discuss findings with your prescriber and confirm with clinical PGx testing when needed.'
