// /app/lib/drugCatalog.js
// SelfScience — Drug → pharmacogene mappings.
//
// SCHEMA (v2, June 2026)
// ----------------------
// Each drug entry has:
//   id           — string, kebab-case
//   name         — display name
//   category     — 'prescription' | 'otc' | 'stimulant' | 'recreational'
//   isHarmReduction — true iff the entry is scoped to a recreational
//                     substance and should trip the SAMHSA disclaimer +
//                     opt-in filter on the UI. Never shown by default.
//   brand[]      — brand names for search
//   generic      — canonical lowercase generic
//   aliases[]    — additional search terms
//   class        — human-readable drug class
//
//   pk_genes[]   — pharmacokinetic (metabolism / transport) genes
//                  [{ gene, rsid?, role }]
//   pd_genes[]   — pharmacodynamic (receptor / target) genes
//                  [{ gene, rsid?, role }]
//
//   critical_interactions[] — [{ severity, text, match(ctx) }] — a table of
//                             precomputed clinically-meaningful interactions.
//                             The optional `match` predicate filters the list
//                             to items relevant to *this user's* variants.
//
//   guidance(phenotypes)    — legacy CPIC-style function that returns a
//                             single { severity, headline, body, action }
//                             for the prescription-drug family. Recreational
//                             entries omit this and rely on critical_interactions
//                             + the pk/pd gene tables for their display.
//
// Severity tiers (both the guidance object and critical_interactions items):
//   'critical'      — life-threatening / strong CPIC alternative
//   'significant'   — meaningful clinical impact / dose adjust
//   'moderate'      — dose adjustment consideration
//   'informational' — awareness only
// UI colours are shared with the existing SEVERITY_META map below (with
// legacy names kept for backward compatibility with the older PGx pages).

export const SEVERITY_META = {
  clear:         { label: 'Standard',   chip: 'bg-ss-green/10 text-ss-green',    dot: 'bg-ss-green',   rank: 0 },
  informational: { label: 'Info',       chip: 'bg-ss-teal/10 text-ss-teal',      dot: 'bg-ss-teal',    rank: 1 },
  notice:        { label: 'Monitor',    chip: 'bg-amber-100 text-amber-900',     dot: 'bg-amber-500',  rank: 2 },
  moderate:      { label: 'Moderate',   chip: 'bg-amber-100 text-amber-900',     dot: 'bg-amber-500',  rank: 2 },
  caution:       { label: 'Caution',    chip: 'bg-ss-amber/10 text-ss-amber',    dot: 'bg-ss-amber',   rank: 3 },
  significant:   { label: 'Significant',chip: 'bg-ss-amber/10 text-ss-amber',    dot: 'bg-ss-amber',   rank: 3 },
  critical:      { label: 'Critical',   chip: 'bg-red-100 text-red-900',         dot: 'bg-red-600',    rank: 4 },
}

// -------------------- Guidance helpers (prescription drugs) --------------------

const cyp2c19Guidance = ({ actionByPheno }) => (ph) => {
  const p = ph.CYP2C19.phenotype
  const label = ph.CYP2C19.label
  const action = actionByPheno[p] || actionByPheno.EM
  return { severity: action.severity, headline: `CYP2C19: ${label}`, body: action.body, action: action.action, gene: 'CYP2C19' }
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

// -------------------- Interaction match helpers --------------------
// Predicates for critical_interactions.match(ctx) below. `ctx` is a shape
// like { CYP2D6:{phenotype,label}, CYP2C19:{...}, ..., rawVariants:{rsid:GT} }.
// Any variant table entry that returns truthy from `match(ctx)` should show
// on the user's personalised interactions list.

const isPheno   = (gene, phenos) => (ctx) => phenos.includes(ctx?.[gene]?.phenotype)
const hasAllele = (rsid, allele) => (ctx) => {
  const gt = ctx?.rawVariants?.[rsid]
  return !!(gt && gt.toUpperCase().includes(allele))
}
const isGenotype = (rsid, gt) => (ctx) => {
  const raw = ctx?.rawVariants?.[rsid]
  if (!raw) return false
  // Compare as unordered pair (AG === GA).
  const a = raw.toUpperCase().replace(/[^ACGT]/g, '')
  const b = gt.toUpperCase()
  return a.length === 2 && b.length === 2 && (a === b || a === b.split('').reverse().join(''))
}
const any = (...preds) => (ctx) => preds.some((p) => p(ctx))
const all = (...preds) => (ctx) => preds.every((p) => p(ctx))
// Always-true — for interactions that don't depend on the user's genotype
// (still valuable clinical info — e.g., benzos + opioids is dangerous for
// everyone). These show under "General cautions" instead of "For you".
const always = () => true

// ---------------------------------------------------------------------------
// DRUG_CATALOG
// ---------------------------------------------------------------------------

export const DRUG_CATALOG = [
  // ══════════════════════════════════════════════════════════════════════
  // PRESCRIPTION DRUGS — CYP2C19
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'clopidogrel',
    name: 'Clopidogrel', category: 'prescription',
    brand: ['Plavix'], generic: 'clopidogrel', aliases: ['plavix', 'clopidogrel'],
    class: 'Antiplatelet',
    primaryGene: 'CYP2C19',
    pk_genes: [
      { gene: 'CYP2C19', role: 'Converts clopidogrel to its active antiplatelet form — poor metabolizers lack effect' },
    ],
    pd_genes: [],
    guidance: cyp2c19Guidance({ actionByPheno: {
      PM: { severity: 'critical', body: 'Poor CYP2C19 metabolism converts less clopidogrel to its active form, associated with reduced antiplatelet effect and higher cardiovascular event risk in research.', action: 'CPIC guidance suggests an alternative antiplatelet (prasugrel, ticagrelor) when clinically appropriate. Discuss with your cardiologist.' },
      IM: { severity: 'caution',  body: 'Intermediate CYP2C19 metabolism may reduce clopidogrel activation. CPIC lists alternatives as a consideration.', action: 'Discuss with your cardiologist whether an alternative antiplatelet is appropriate.' },
      EM: { severity: 'clear',    body: 'Expected clopidogrel activation.', action: 'Standard dosing per prescriber.' },
      RM: { severity: 'clear',    body: 'Expected or slightly increased clopidogrel activation.', action: 'Standard dosing per prescriber.' },
      UM: { severity: 'clear',    body: 'Increased clopidogrel activation.', action: 'Standard dosing per prescriber — monitor for bleeding as with any antiplatelet.' },
    }}),
  },

  ...['omeprazole', 'esomeprazole', 'pantoprazole', 'lansoprazole'].map((generic) => ({
    id: generic,
    name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand: { omeprazole: ['Prilosec'], esomeprazole: ['Nexium'], pantoprazole: ['Protonix'], lansoprazole: ['Prevacid'] }[generic],
    generic, aliases: [generic],
    class: 'Proton Pump Inhibitor',
    primaryGene: 'CYP2C19',
    pk_genes: [{ gene: 'CYP2C19', role: `${generic} is cleared primarily by CYP2C19` }],
    pd_genes: [],
    guidance: cyp2c19Guidance({ actionByPheno: {
      PM: { severity: 'notice', body: 'Poor CYP2C19 metabolism raises PPI exposure. Research suggests better acid suppression but higher long-term drug exposure.', action: 'Standard doses often work well — discuss lowest effective dose with your provider for long courses.' },
      IM: { severity: 'notice', body: 'Intermediate CYP2C19 metabolism slightly raises PPI exposure.', action: 'Standard dosing; consider lowest effective dose for long-term use.' },
      EM: { severity: 'clear',  body: 'Expected PPI clearance.', action: 'Standard dosing per prescriber.' },
      RM: { severity: 'notice', body: 'Rapid CYP2C19 metabolism may lower PPI exposure and reduce acid suppression.', action: 'If PPI feels ineffective, discuss dose adjustment or twice-daily dosing with your provider.' },
      UM: { severity: 'caution',body: 'Ultra-rapid CYP2C19 metabolism substantially lowers PPI exposure — standard doses may be less effective.', action: 'CPIC suggests a higher starting dose or alternative agent — discuss with your provider.' },
    }}),
  })),

  ...[
    { generic: 'escitalopram', brand: ['Lexapro'] },
    { generic: 'citalopram',   brand: ['Celexa'] },
    { generic: 'sertraline',   brand: ['Zoloft'] },
  ].map(({ generic, brand }) => ({
    id: generic, name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'SSRI Antidepressant',
    primaryGene: 'CYP2C19',
    pk_genes: [{ gene: 'CYP2C19', role: `${generic} is cleared primarily by CYP2C19` }],
    pd_genes: [
      { gene: 'SLC6A4', rsid: 'rs25531', role: 'Serotonin transporter — expression variants modestly affect SSRI response' },
    ],
    guidance: cyp2c19Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: 'Poor CYP2C19 metabolism raises SSRI exposure and side-effect risk.', action: 'CPIC suggests starting at 50% of the usual dose or considering an alternative SSRI. Discuss with your prescriber.' },
      IM: { severity: 'notice',  body: 'Intermediate CYP2C19 metabolism raises SSRI exposure modestly.', action: 'Consider starting lower and titrating up. Discuss with prescriber.' },
      EM: { severity: 'clear',   body: 'Expected SSRI clearance.', action: 'Standard dosing per prescriber.' },
      RM: { severity: 'notice',  body: 'Rapid CYP2C19 metabolism may lower drug exposure and effect.', action: 'If response is poor, discuss dose adjustment or alternative with prescriber.' },
      UM: { severity: 'caution', body: 'Ultra-rapid CYP2C19 metabolism substantially lowers SSRI exposure. CPIC suggests an alternative not primarily metabolized by CYP2C19.', action: 'Discuss with your prescriber — alternatives like fluoxetine (CYP2D6) may be considered.' },
    }}),
  })),

  // ══════════════════════════════════════════════════════════════════════
  // PRESCRIPTION DRUGS — CYP2D6
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'codeine',
    name: 'Codeine', category: 'prescription',
    brand: ['Tylenol #3'], generic: 'codeine', aliases: ['codeine'],
    class: 'Opioid Analgesic',
    primaryGene: 'CYP2D6',
    pk_genes: [
      { gene: 'CYP2D6', role: 'Converts codeine to active morphine — required for effect' },
      { gene: 'CYP3A4', role: 'Alternate clearance pathway (norcodeine)' },
      { gene: 'ABCB1',  role: 'P-glycoprotein controls CNS penetration' },
    ],
    pd_genes: [
      { gene: 'OPRM1', rsid: 'rs1799971', role: 'μ-opioid receptor sensitivity' },
    ],
    guidance: cyp2d6Guidance({ actionByPheno: {
      PM: { severity: 'critical', body: 'Poor CYP2D6 metabolism converts less codeine to morphine — research reports reduced analgesic effect and a false sense of safety that can drive dose seeking.', action: 'CPIC lists this genotype as an alternative-analgesic indication (e.g., morphine, hydromorphone). Discuss with prescriber.' },
      IM: { severity: 'caution',  body: 'Intermediate CYP2D6 metabolism may reduce codeine activation and pain relief.', action: 'If pain relief is inadequate, discuss alternatives with prescriber.' },
      EM: { severity: 'clear',    body: 'Expected codeine activation.', action: 'Standard dosing per prescriber.' },
      UM: { severity: 'critical', body: 'Ultra-rapid CYP2D6 metabolism produces excess morphine — research links this to sedation, respiratory depression, and toxicity. Fatal cases have been reported in children.', action: 'CPIC contraindicates codeine in ultra-rapid metabolizers. Discuss alternatives with prescriber.' },
    }}),
    critical_interactions: [
      { severity: 'critical', match: isPheno('CYP2D6', ['UM']),
        text: 'CYP2D6 ultra-rapid + codeine: rapid conversion to morphine creates overdose risk even at normal doses. Fatal cases documented in children.' },
      { severity: 'critical', match: isPheno('CYP2D6', ['PM']),
        text: 'CYP2D6 poor metabolizer: codeine stays as codeine → no analgesia. This can drive dose escalation and unexpected toxicity via the CYP3A4 pathway.' },
      { severity: 'informational', match: isGenotype('rs1799971', 'AA'),
        text: 'OPRM1 AA (standard): typical opioid receptor response.' },
      { severity: 'moderate', match: any(isGenotype('rs1799971', 'AG'), isGenotype('rs1799971', 'GG')),
        text: 'OPRM1 G allele: altered μ-receptor binding — subjective effect may be stronger and dependence liability is elevated.' },
    ],
  },

  {
    id: 'tramadol',
    name: 'Tramadol', category: 'prescription',
    brand: ['Ultram'], generic: 'tramadol', aliases: ['tramadol'],
    class: 'Opioid Analgesic',
    primaryGene: 'CYP2D6',
    pk_genes: [
      { gene: 'CYP2D6', role: 'Converts tramadol to active O-desmethyltramadol (M1)' },
      { gene: 'CYP3A4', role: 'Alternate clearance pathway' },
    ],
    pd_genes: [
      { gene: 'OPRM1', rsid: 'rs1799971', role: 'μ-opioid receptor sensitivity' },
    ],
    guidance: cyp2d6Guidance({ actionByPheno: {
      PM: { severity: 'critical', body: 'Poor CYP2D6 metabolism reduces tramadol activation and analgesia.', action: 'CPIC suggests an alternative analgesic. Discuss with prescriber.' },
      IM: { severity: 'caution',  body: 'Intermediate CYP2D6 activation may reduce pain relief.', action: 'If pain relief is inadequate, discuss alternatives.' },
      EM: { severity: 'clear',    body: 'Expected tramadol activation.', action: 'Standard dosing per prescriber.' },
      UM: { severity: 'critical', body: 'Ultra-rapid CYP2D6 → excess M1 → sedation and respiratory depression risk.', action: 'CPIC cautions against tramadol in ultra-rapid metabolizers.' },
    }}),
    critical_interactions: [
      { severity: 'critical', match: isPheno('CYP2D6', ['UM']),
        text: 'CYP2D6 ultra-rapid + tramadol: excess M1 metabolite raises respiratory depression risk.' },
    ],
  },

  ...[
    { generic: 'fluoxetine',    brand: ['Prozac'] },
    { generic: 'paroxetine',    brand: ['Paxil'] },
    { generic: 'venlafaxine',   brand: ['Effexor'] },
    { generic: 'amitriptyline', brand: ['Elavil'] },
    { generic: 'nortriptyline', brand: ['Pamelor'] },
  ].map(({ generic, brand }) => ({
    id: generic, name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand, generic, aliases: [generic],
    class: 'Antidepressant',
    primaryGene: 'CYP2D6',
    pk_genes: [{ gene: 'CYP2D6', role: `Primary ${generic} clearance` }],
    pd_genes: [],
    guidance: cyp2d6Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: `Poor CYP2D6 metabolism raises ${generic} exposure and side-effect risk.`, action: 'CPIC suggests a 50% dose reduction or alternative agent. Discuss with prescriber.' },
      IM: { severity: 'notice',  body: `Intermediate CYP2D6 metabolism raises ${generic} exposure modestly.`, action: 'Consider starting lower and titrating. Discuss with prescriber.' },
      EM: { severity: 'clear',   body: `Expected ${generic} clearance.`, action: 'Standard dosing per prescriber.' },
      UM: { severity: 'caution', body: `Ultra-rapid CYP2D6 metabolism lowers ${generic} exposure — response may be reduced.`, action: 'If response is poor, discuss dose or agent change with prescriber.' },
    }}),
  })),

  ...[
    { generic: 'metoprolol',  brand: ['Lopressor', 'Toprol'], cls: 'Beta-blocker' },
    { generic: 'atomoxetine', brand: ['Strattera'],           cls: 'ADHD medication' },
  ].map(({ generic, brand, cls }) => ({
    id: generic, name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand, generic, aliases: [generic],
    class: cls,
    primaryGene: 'CYP2D6',
    pk_genes: [{ gene: 'CYP2D6', role: `Primary ${generic} clearance` }],
    pd_genes: [],
    guidance: cyp2d6Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: `Poor CYP2D6 metabolism raises ${generic} exposure.`, action: 'CPIC suggests dose reduction or slower titration. Discuss with prescriber.' },
      IM: { severity: 'notice',  body: `Intermediate CYP2D6 metabolism raises ${generic} exposure modestly.`, action: 'Standard start; monitor for side effects.' },
      EM: { severity: 'clear',   body: `Expected ${generic} clearance.`, action: 'Standard dosing per prescriber.' },
      UM: { severity: 'notice',  body: `Ultra-rapid CYP2D6 metabolism lowers exposure — response may be reduced.`, action: 'If response is inadequate, discuss with prescriber.' },
    }}),
  })),

  // ══════════════════════════════════════════════════════════════════════
  // PRESCRIPTION DRUGS — CYP2C9 / VKORC1 / SLCO1B1 / DPYD / TPMT
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'warfarin',
    name: 'Warfarin', category: 'prescription',
    brand: ['Coumadin'], generic: 'warfarin', aliases: ['warfarin', 'coumadin'],
    class: 'Anticoagulant',
    primaryGene: 'CYP2C9', extraGenes: ['VKORC1'],
    pk_genes: [{ gene: 'CYP2C9', role: 'Primary S-warfarin clearance' }],
    pd_genes: [{ gene: 'VKORC1', rsid: 'rs9923231', role: 'Warfarin target — variant increases sensitivity' }],
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

  ...[
    { generic: 'phenytoin',   brand: ['Dilantin'],    cls: 'Anticonvulsant' },
    { generic: 'celecoxib',   brand: ['Celebrex'],    cls: 'NSAID' },
    { generic: 'fluvastatin', brand: ['Lescol'],      cls: 'Statin' },
  ].map(({ generic, brand, cls }) => ({
    id: generic, name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand, generic, aliases: [generic],
    class: cls,
    primaryGene: 'CYP2C9',
    pk_genes: [{ gene: 'CYP2C9', role: `Primary ${generic} clearance` }],
    pd_genes: [],
    guidance: cyp2c9Guidance({ actionByPheno: {
      PM: { severity: 'caution', body: `Poor CYP2C9 metabolism raises ${generic} exposure and side-effect risk.`, action: 'CPIC suggests reduced dosing or alternative. Discuss with prescriber.' },
      IM: { severity: 'notice',  body: `Intermediate CYP2C9 metabolism raises ${generic} exposure modestly.`, action: 'Standard start; monitor. Discuss with prescriber if side effects arise.' },
      EM: { severity: 'clear',   body: `Expected ${generic} clearance.`, action: 'Standard dosing per prescriber.' },
    }}),
  })),

  ...[
    { generic: 'simvastatin',  brand: ['Zocor'] },
    { generic: 'atorvastatin', brand: ['Lipitor'] },
    { generic: 'rosuvastatin', brand: ['Crestor'] },
    { generic: 'pravastatin',  brand: ['Pravachol'] },
  ].map(({ generic, brand }) => ({
    id: generic, name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'Statin',
    primaryGene: 'SLCO1B1',
    pk_genes: [{ gene: 'SLCO1B1', role: `Transports ${generic} into hepatocytes — reduced function raises muscle-symptom risk` }],
    pd_genes: [],
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

  ...[
    { generic: 'fluorouracil', brand: ['5-FU', 'Adrucil'] },
    { generic: 'capecitabine', brand: ['Xeloda'] },
    { generic: 'tegafur',      brand: ['Ftorafur'] },
  ].map(({ generic, brand }) => ({
    id: generic, name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'Chemotherapy',
    primaryGene: 'DPYD',
    pk_genes: [{ gene: 'DPYD', role: `Rate-limiting enzyme for ${generic} breakdown` }],
    pd_genes: [],
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

  ...[
    { generic: 'azathioprine',   brand: ['Imuran'] },
    { generic: 'mercaptopurine', brand: ['Purinethol'] },
  ].map(({ generic, brand }) => ({
    id: generic, name: generic[0].toUpperCase() + generic.slice(1),
    category: 'prescription',
    brand, generic, aliases: [generic, ...brand.map((b) => b.toLowerCase())],
    class: 'Immunosuppressant / Chemotherapy',
    primaryGene: 'TPMT',
    pk_genes: [{ gene: 'TPMT', role: `Rate-limiting enzyme for thiopurine methylation` }],
    pd_genes: [],
    guidance: (ph) => {
      const p = ph.TPMT.phenotype
      if (p === 'deficient') return {
        severity: 'critical', headline: `TPMT: ${ph.TPMT.label}`,
        body: `Deficient TPMT activity causes severe, potentially fatal myelosuppression at standard ${generic} doses.`,
        action: 'CPIC strongly recommends alternative therapy or drastically reduced dosing (~10% of standard). Bring this finding to your prescribing physician immediately if this drug is being considered.',
        gene: 'TPMT',
      }
      if (p === 'intermediate') return {
        severity: 'caution', headline: `TPMT: ${ph.TPMT.label}`,
        body: `Intermediate TPMT activity raises myelosuppression risk at standard ${generic} doses.`,
        action: 'CPIC suggests reduced starting dose (30–80% of standard) and close monitoring. Discuss with prescriber.',
        gene: 'TPMT',
      }
      return { severity: 'clear', headline: `TPMT: ${ph.TPMT.label}`, body: `Expected ${generic} clearance.`, action: 'Standard prescriber-guided dosing with routine monitoring.', gene: 'TPMT' }
    },
  })),

  // ══════════════════════════════════════════════════════════════════════
  // OTC / STIMULANT — Caffeine (always visible; no harm-reduction gating)
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'caffeine',
    name: 'Caffeine', category: 'stimulant',
    brand: [], generic: 'caffeine', aliases: ['caffeine', 'coffee', 'espresso', 'tea'],
    class: 'Stimulant',
    pk_genes: [
      { gene: 'CYP1A2', rsid: 'rs762551', role: 'Primary caffeine metabolism — AC or CC = slow metabolizer, 6–10 hour half-life' },
      { gene: 'CYP2C8', role: 'Minor caffeine clearance pathway' },
    ],
    pd_genes: [
      { gene: 'ADORA2A', role: 'Adenosine receptor — variants affect anxiety sensitivity to caffeine' },
      { gene: 'COMT', rsid: 'rs4680', role: 'Val/Val (GG) handles caffeine-induced dopamine better under stress' },
    ],
    critical_interactions: [
      { severity: 'significant', match: any(isGenotype('rs762551', 'AC'), isGenotype('rs762551', 'CC')),
        text: 'CYP1A2 slow (AC/CC): caffeine half-life 6–10 h vs 3–4 h in fast metabolizers. Research associates high intake with elevated hypertension and heart-attack risk *specifically* in slow metabolizers — fast metabolizers do not show this association.' },
      { severity: 'moderate', match: all(
          any(isGenotype('rs762551', 'AC'), isGenotype('rs762551', 'CC')),
          any(isGenotype('rs10830963', 'CG'), isGenotype('rs10830963', 'GG'))
        ),
        text: 'CYP1A2 slow + MTNR1B GG/CG: caffeine after noon delays adenosine clearance AND compounds late-eating insulin impact. An earlier cutoff (before noon) is indicated.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // RECREATIONAL DRUGS — Harm-reduction gated (opt-in filter on the UI)
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'alcohol',
    name: 'Alcohol (Ethanol)', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'alcohol', aliases: ['alcohol', 'ethanol', 'beer', 'wine', 'spirits'],
    class: 'CNS Depressant',
    pk_genes: [
      { gene: 'ADH1B', rsid: 'rs1229984', role: 'Converts alcohol to acetaldehyde — fast variant = faster accumulation' },
      { gene: 'ALDH2', rsid: 'rs671',     role: 'Clears acetaldehyde — *2 variant = accumulation, flushing, nausea' },
      { gene: 'CYP2E1', role: 'Microsomal alcohol oxidation — relevant at high intake' },
    ],
    pd_genes: [
      { gene: 'GABRA2', rsid: 'rs279858', role: 'GABA receptor — risk allele associated with alcohol use disorder' },
      { gene: 'DRD2',   rsid: 'rs1800497', role: 'A1 allele → lower dopamine receptor density → higher reward-seeking' },
      { gene: 'OPRM1',  rsid: 'rs1799971', role: 'G allele → stronger endorphin release from alcohol → higher dependence risk' },
    ],
    critical_interactions: [
      { severity: 'critical', match: any(isGenotype('rs671', 'AG'), isGenotype('rs671', 'AA')),
        text: 'ALDH2 *2 (AG or AA at rs671): acetaldehyde builds up rapidly — flushing, nausea, headache, elevated carcinogen exposure. Regular use substantially elevates esophageal cancer risk.' },
      { severity: 'significant', match: all(
          any(isGenotype('rs1229984', 'AG'), isGenotype('rs1229984', 'AA')),
          any(isGenotype('rs671', 'AG'),     isGenotype('rs671', 'AA'))
        ),
        text: 'ADH1B fast + ALDH2 slow: worst combination — rapid acetaldehyde production paired with slow clearance.' },
      { severity: 'moderate', match: any(isGenotype('rs10830963', 'CG'), isGenotype('rs10830963', 'GG')),
        text: 'MTNR1B GG/CG + alcohol after 6 PM: compounds insulin-secretion impairment at the worst circadian window for your genotype.' },
      { severity: 'moderate', match: any(isGenotype('rs1799971', 'AG'), isGenotype('rs1799971', 'GG')),
        text: 'OPRM1 G allele + alcohol: stronger endorphin release → higher subjective reward and dependence liability.' },
    ],
  },

  {
    id: 'cannabis',
    name: 'Cannabis (THC)', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'cannabis', aliases: ['cannabis', 'thc', 'marijuana', 'weed', 'edibles'],
    class: 'Cannabinoid',
    pk_genes: [
      { gene: 'CYP2C9', role: 'Primary THC metabolism — *3 carriers clear THC slowly (stronger and longer effects)' },
      { gene: 'CYP3A4', role: 'Secondary THC clearance' },
      { gene: 'ABCB1',  role: 'P-glycoprotein controls brain THC penetration' },
    ],
    pd_genes: [
      { gene: 'COMT', rsid: 'rs4680', role: 'Dopamine clearance — Val/Val (GG) more vulnerable to THC-induced anxiety/paranoia at high doses' },
      { gene: 'AKT1',                  role: 'Cannabis-psychosis risk — AKT1 C/C associated with elevated risk' },
      { gene: 'BDNF', rsid: 'rs6265',  role: 'Met carriers — greater cognitive impact from heavy adolescent use' },
    ],
    critical_interactions: [
      { severity: 'significant', match: isGenotype('rs4680', 'GG'),
        text: 'COMT Val/Val (GG) + high THC: greater dopamine instability, elevated anxiety and paranoia risk at high doses.' },
      { severity: 'significant', match: isPheno('CYP2C9', ['PM', 'IM']),
        text: 'CYP2C9 poor / intermediate metabolizer + THC: clearance significantly slowed — edibles are especially unpredictable. Start with much lower doses.' },
      { severity: 'moderate', match: any(isGenotype('rs6265', 'AG'), isGenotype('rs6265', 'AA')),
        text: 'BDNF Met carrier (rs6265 AG/AA): heavier cognitive impact from chronic adolescent use.' },
    ],
  },

  {
    id: 'mdma',
    name: 'MDMA (Ecstasy / Molly)', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'mdma', aliases: ['mdma', 'ecstasy', 'molly'],
    class: 'Empathogen / Stimulant',
    pk_genes: [
      { gene: 'CYP2D6', role: 'PRIMARY MDMA metabolism — poor metabolizers accumulate toxic levels' },
      { gene: 'CYP3A4', role: 'Secondary clearance' },
    ],
    pd_genes: [
      { gene: 'COMT',   rsid: 'rs4680',   role: 'Dopamine clearance speed affects peak intensity and comedown severity' },
      { gene: 'SLC6A4', rsid: 'rs25531',  role: 'Serotonin transporter — low expression = greater serotonin flood, higher neurotoxicity risk' },
      { gene: 'HTR2A',  rsid: 'rs6311',   role: 'Serotonin receptor density affects subjective experience and serotonin-syndrome risk' },
      { gene: 'MTHFR',                    role: 'Methylation capacity affects recovery — compound heterozygotes need extended B-vitamin support' },
    ],
    critical_interactions: [
      { severity: 'critical', match: isPheno('CYP2D6', ['PM']),
        text: 'CRITICAL: CYP2D6 poor metabolizer + MDMA = toxic accumulation. MDMA itself becomes the neurotoxin at elevated levels. Significantly elevated risk of serotonin syndrome and neurotoxicity.' },
      { severity: 'critical', match: always,
        text: 'CRITICAL: Any SSRI/SNRI + MDMA = serotonin-syndrome risk regardless of genotype. Serotonin syndrome can be fatal.' },
      { severity: 'significant', match: isGenotype('rs4680', 'GG'),
        text: 'COMT Val/Val (GG) + MDMA: higher dopamine spike → more intense peak, harder crash. Elevated psychosis risk at high doses.' },
      { severity: 'significant', match: (ctx) => {
          const c9 = ctx?.MTHFR_C677T?.phenotype
          const a1 = ctx?.MTHFR_A1298C?.phenotype
          return c9 === 'compound_heterozygous' || a1 === 'compound_heterozygous'
        },
        text: 'MTHFR compound heterozygous: post-MDMA methylation demand is high. Active methylfolate + NAC are the research-supported recovery approach.' },
    ],
  },

  {
    id: 'nicotine',
    name: 'Nicotine (Tobacco / Vaping)', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'nicotine', aliases: ['nicotine', 'tobacco', 'cigarettes', 'vape', 'vaping', 'juul'],
    class: 'Stimulant',
    pk_genes: [
      { gene: 'CYP2A6', role: 'Primary nicotine metabolism — slow metabolizers keep higher nicotine, smoke less but are more addicted per cigarette' },
      { gene: 'CYP2B6', role: 'Secondary nicotine clearance' },
    ],
    pd_genes: [
      { gene: 'CHRNA5', rsid: 'rs16969968', role: 'Nicotinic receptor — A allele strongly associated with dependence and lung cancer risk' },
      { gene: 'CHRNA3', rsid: 'rs1051730',  role: 'Nicotinic receptor cluster — dependence risk' },
      { gene: 'DRD2',   rsid: 'rs1800497',  role: 'A1 allele → stronger dopamine reward from nicotine' },
    ],
    critical_interactions: [
      { severity: 'critical', match: any(isGenotype('rs16969968', 'AG'), isGenotype('rs16969968', 'AA')),
        text: 'CHRNA5 A allele (rs16969968): strongest known genetic risk for nicotine dependence. Also linked to elevated lung cancer risk independent of quantity smoked.' },
      { severity: 'moderate', match: any(isGenotype('rs1800497', 'CT'), isGenotype('rs1800497', 'TT')),
        text: 'DRD2 A1 (rs1800497 T carrier): lower baseline receptor density → stronger dopamine reward from nicotine, harder cessation.' },
    ],
  },

  {
    id: 'cocaine',
    name: 'Cocaine', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'cocaine', aliases: ['cocaine', 'coke', 'crack'],
    class: 'Stimulant',
    pk_genes: [
      { gene: 'BCHE',   role: 'Butyrylcholinesterase — primary cocaine hydrolysis; low activity = slower clearance and longer exposure' },
      { gene: 'CYP3A4', role: 'Hepatic cocaine metabolism' },
    ],
    pd_genes: [
      { gene: 'COMT',   rsid: 'rs4680',   role: 'CRITICAL — Val/Val (GG) + cocaine: dopamine flooding in an already-efficient system; higher cardiovascular strain' },
      { gene: 'DRD2',   rsid: 'rs1800497', role: 'A1 allele → lower baseline receptor density → stronger craving' },
      { gene: 'SLC6A3', role: 'Dopamine transporter (DAT1) — cocaine\u2019s primary target; variants affect reuptake-inhibition magnitude' },
    ],
    critical_interactions: [
      { severity: 'critical', match: always,
        text: 'CRITICAL: Cocaine + alcohol produces cocaethylene in the liver — more cardiotoxic than either alone. Significantly elevated cardiac risk regardless of genotype.' },
      { severity: 'critical', match: isGenotype('rs4680', 'GG'),
        text: 'COMT Val/Val (GG) + cocaine: dopamine system already efficient at stress; cocaine floods it harder. Cardiovascular stress and paranoia risk elevated.' },
      { severity: 'significant', match: (ctx) => {
          const c9 = ctx?.MTHFR_C677T?.phenotype
          const a1 = ctx?.MTHFR_A1298C?.phenotype
          return c9 === 'compound_heterozygous' || a1 === 'compound_heterozygous'
        },
        text: 'MTHFR compound heterozygous + regular cocaine use: methylation demand is extremely high; neurotoxicity risk and recovery impaired.' },
    ],
  },

  {
    id: 'opioids',
    name: 'Opioids (Recreational)', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'opioids', aliases: ['opioids', 'heroin', 'oxycodone', 'oxycontin', 'fentanyl', 'hydrocodone', 'oxy'],
    class: 'Opioid',
    pk_genes: [
      { gene: 'CYP2D6', role: 'Converts prodrugs (codeine, tramadol) to active opioids. Poor metabolizers get no effect from codeine; ultra-rapid = overdose risk' },
      { gene: 'CYP3A4', role: 'Clears oxycodone, fentanyl, buprenorphine' },
      { gene: 'ABCB1',  rsid: 'rs1045642', role: 'P-gp controls CNS penetration — TT = more drug crosses blood-brain barrier' },
    ],
    pd_genes: [
      { gene: 'OPRM1', rsid: 'rs1799971', role: 'G allele → stronger subjective effect AND higher dependence liability' },
      { gene: 'COMT',  rsid: 'rs4680',    role: 'Met/Met (AA) → higher baseline pain sensitivity, stronger opioid response' },
    ],
    critical_interactions: [
      { severity: 'critical', match: isPheno('CYP2D6', ['UM']),
        text: 'CRITICAL: CYP2D6 ultra-rapid + codeine or tramadol = respiratory depression risk. Prodrugs convert so fast that toxic levels occur at standard doses.' },
      { severity: 'critical', match: isPheno('CYP2D6', ['PM']),
        text: 'CRITICAL: CYP2D6 poor metabolizer + codeine = no effect. Dose escalation seeking pain relief can push people into toxic territory via the CYP3A4 pathway.' },
      { severity: 'significant', match: isGenotype('rs1045642', 'TT'),
        text: 'ABCB1 TT + any opioid: more drug crosses into CNS. Lower doses produce stronger effects; overdose threshold is lower.' },
      { severity: 'significant', match: any(isGenotype('rs1799971', 'AG'), isGenotype('rs1799971', 'GG')),
        text: 'OPRM1 G allele: stronger receptor response AND significantly higher dependence liability — each use creates a stronger reward memory.' },
    ],
  },

  {
    id: 'psychedelics',
    name: 'Psychedelics (LSD / Psilocybin)', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'psychedelics', aliases: ['lsd', 'acid', 'psilocybin', 'mushrooms', 'shrooms', 'psychedelics'],
    class: 'Serotonergic Psychedelic',
    pk_genes: [
      { gene: 'CYP2D6', role: 'Psilocin (active psilocybin metabolite) and LSD clearance' },
      { gene: 'CYP3A4', role: 'LSD oxidation' },
    ],
    pd_genes: [
      { gene: 'HTR2A',  rsid: 'rs6311',    role: 'Serotonin 2A receptor — PRIMARY target of LSD and psilocybin; variants affect intensity' },
      { gene: 'COMT',   rsid: 'rs4680',    role: 'Val/Val (GG): dopamine engages strongly during psychedelic state — can amplify intensity and reduce OR increase anxiety in unsupported settings' },
      { gene: 'BDNF',   rsid: 'rs6265',    role: 'Val/Val: stronger neuroplasticity response — may enhance therapeutic potential but also emotional intensity' },
      { gene: 'FKBP5',  rsid: 'rs1360780', role: 'T allele: cortisol lingers — challenging experiences may have longer stress-hormone tail' },
    ],
    critical_interactions: [
      { severity: 'critical', match: always,
        text: 'CRITICAL: Current SSRI/SNRI use + MDMA = serotonin-syndrome risk. Classical psychedelics interact less dangerously but SSRIs blunt subjective effects and interactions warrant caution.' },
      { severity: 'significant', match: isGenotype('rs4680', 'GG'),
        text: 'COMT Val/Val (GG) + psychedelics: dopamine engages strongly alongside serotonin. Set and setting are more critical — this genotype is more context-dependent.' },
      { severity: 'moderate', match: any(isGenotype('rs1360780', 'CT'), isGenotype('rs1360780', 'TT')),
        text: 'FKBP5 CT/TT + psychedelics: if the experience is challenging, cortisol clearance is already slower — extended integration support is more important for you.' },
    ],
  },

  {
    id: 'benzodiazepines',
    name: 'Benzodiazepines (Xanax, Valium, Klonopin)', category: 'recreational', isHarmReduction: true,
    brand: ['Xanax', 'Valium', 'Klonopin', 'Ativan'], generic: 'benzodiazepines',
    aliases: ['benzos', 'benzodiazepines', 'xanax', 'valium', 'klonopin', 'ativan', 'alprazolam', 'diazepam', 'clonazepam', 'lorazepam'],
    class: 'CNS Depressant / Sedative',
    pk_genes: [
      { gene: 'CYP2C19', role: 'Diazepam / clobazam primary metabolism — poor metabolizers accumulate to sedating levels' },
      { gene: 'CYP3A4',  role: 'Alprazolam / clonazepam / midazolam primary clearance' },
      { gene: 'CYP2D6',  role: 'Minor pathway for some benzodiazepines' },
    ],
    pd_genes: [
      { gene: 'GABRA2', rsid: 'rs279858', role: 'GABA-A α2 subunit — variants affect sedative sensitivity and dependence' },
      { gene: 'GABRG2',                    role: 'GABA-A γ2 subunit — affects drug-binding efficacy' },
    ],
    critical_interactions: [
      { severity: 'critical', match: always,
        text: 'CRITICAL: Benzodiazepines + opioids = synergistic CNS depression. Leading cause of overdose death. No pharmacogenomic variant makes this combination safe.' },
      { severity: 'critical', match: always,
        text: 'CRITICAL: Benzodiazepines + alcohol = same synergistic CNS depression. An ALDH2 variant does not protect against this interaction.' },
      { severity: 'significant', match: isPheno('CYP2C19', ['PM']),
        text: 'CYP2C19 poor metabolizer + diazepam: drug accumulates over days. Sedation, cognitive impairment, and respiratory depression risk at doses that would be safe in normal metabolizers.' },
    ],
  },

  {
    id: 'methamphetamine',
    name: 'Methamphetamine', category: 'recreational', isHarmReduction: true,
    brand: [], generic: 'methamphetamine', aliases: ['methamphetamine', 'meth', 'crystal', 'ice'],
    class: 'Stimulant',
    pk_genes: [
      { gene: 'CYP2D6', role: 'Primary meth metabolism to amphetamine' },
      { gene: 'FMO3',   role: 'Converts meth to metabolites' },
    ],
    pd_genes: [
      { gene: 'COMT',   rsid: 'rs4680',    role: 'CRITICAL — dopamine clearance speed determines flood magnitude and neurotoxicity window' },
      { gene: 'DRD2',   rsid: 'rs1800497', role: 'A1 allele → lower receptor density → stronger craving, harder crash' },
      { gene: 'SLC6A3',                    role: 'DAT1 dopamine transporter — meth\u2019s primary target for dopamine flooding' },
      { gene: 'BDNF',   rsid: 'rs6265',    role: 'Met/Met = reduced BDNF = slower neurotoxicity recovery' },
    ],
    critical_interactions: [
      { severity: 'critical', match: isGenotype('rs4680', 'GG'),
        text: 'CRITICAL: COMT Val/Val (GG) + methamphetamine: dopamine system flooded beyond efficient clearance rate. Psychosis risk significantly elevated compared to Met carriers.' },
      { severity: 'significant', match: any(isGenotype('rs1800497', 'CT'), isGenotype('rs1800497', 'TT')),
        text: 'DRD2 A1 (rs1800497 T carrier) + meth: lower receptor density → the brain compensates harder — cravings are more intense during withdrawal.' },
      { severity: 'significant', match: any(isGenotype('rs6265', 'AG'), isGenotype('rs6265', 'AA')),
        text: 'BDNF Met carrier + meth: reduced capacity to recover neuroplasticity after neurotoxic insult. Cognitive recovery after heavy use is slower.' },
      { severity: 'significant', match: (ctx) => {
          const c9 = ctx?.MTHFR_C677T?.phenotype
          const a1 = ctx?.MTHFR_A1298C?.phenotype
          return c9 === 'compound_heterozygous' || a1 === 'compound_heterozygous'
        },
        text: 'MTHFR compound heterozygous + meth: methylation is required for dopamine and serotonin synthesis. Meth depletes this system rapidly. Recovery is significantly impaired without active methylfolate support.' },
    ],
  },
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

/**
 * Fuzzy-match drug names / aliases against a query, respecting the current
 * harm-reduction visibility toggle. `showHarmReduction=false` hides all
 * entries flagged isHarmReduction so that a user searching for "amoxicillin"
 * never sees a cocaine card unless they've opted into that content.
 */
export function suggestDrugs(query, limit = 8, { showHarmReduction = false } = {}) {
  if (!query) return []
  const q = query.trim().toLowerCase()
  if (!q) return []
  const pool = showHarmReduction ? DRUG_CATALOG : DRUG_CATALOG.filter((d) => !d.isHarmReduction)
  const scored = pool.map((d) => {
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

/**
 * Filter a drug's critical_interactions to the ones that match the current
 * user's phenotype + raw genotype context. Interactions with `match=always`
 * always survive — they're general clinical cautions, not personalised.
 */
export function personaliseInteractions(drug, ctx) {
  if (!drug?.critical_interactions) return { personalised: [], general: [] }
  const personalised = []
  const general = []
  for (const it of drug.critical_interactions) {
    if (it.match === always) general.push(it)
    else if (typeof it.match === 'function' && it.match(ctx)) personalised.push(it)
  }
  // Sort by severity rank (critical → informational).
  const rank = (s) => SEVERITY_META[s]?.rank ?? 0
  personalised.sort((a, b) => rank(b.severity) - rank(a.severity))
  general.sort((a, b) => rank(b.severity) - rank(a.severity))
  return { personalised, general }
}

export const DRUG_CHECKER_DISCLAIMER =
  'Educational only. Estimates come from single-SNP consumer genome data and are NOT a substitute for a clinical pharmacogenomic test. Never start, stop, or change any medication based on this tool — always discuss findings with your prescriber and confirm with clinical PGx testing when needed.'

export const HARM_REDUCTION_DISCLAIMER =
  'SelfScience provides pharmacogenomic context for harm-reduction purposes. This information describes how your genetics may influence your response to a substance based on published research. It is not an endorsement, recommendation, or encouragement of use.'

export const SAMHSA_HELPLINE = {
  text: 'If you or someone you know is struggling with substance use, SAMHSA\u2019s helpline is available 24/7: 1-800-662-4357 (free, confidential).',
  phone: '1-800-662-HELP (4357)',
  url:   'https://www.samhsa.gov/find-help/national-helpline',
}
