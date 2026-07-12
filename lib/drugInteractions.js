// /app/lib/drugInteractions.js
// SelfScience — Multi-drug interaction detector.
//
// Given two drugs (A + B) from DRUG_CATALOG, this module returns a list of
// clinically-meaningful interactions between them. Three categories:
//
//   1. CYP competition        — both drugs are cleared by the same CYP
//                                enzyme, so one competitively inhibits the
//                                other's metabolism (severity scales with
//                                the user's phenotype at that gene: worse if
//                                already an IM/PM).
//   2. Class synergy          — two drugs from the same interaction class
//                                stack (e.g., two CNS depressants, two
//                                serotonergic drugs, two stimulants).
//   3. Named dangerous combos — hard-coded pairs known to cause
//                                specific reactions (cocaine + alcohol
//                                → cocaethylene, MDMA + SSRI → serotonin
//                                syndrome, opioid + benzo → respiratory
//                                depression, MAO-i + tyramine/stimulant
//                                → hypertensive crisis, etc.).
//
// The single-drug view already handles genotype-specific interactions on
// its own via personaliseInteractions(); this module handles cross-drug
// interactions that don't require the user to carry any particular variant.

// ---------------------------------------------------------------------------
// Interaction class tags — keyed by drug.id from drugCatalog.js
// A drug can carry multiple tags. Compare tags between two drugs to detect
// class-level synergy.
// ---------------------------------------------------------------------------

export const INTERACTION_TAGS = {
  // Prescription
  clopidogrel:     ['antiplatelet'],
  omeprazole:      ['ppi'],
  esomeprazole:    ['ppi'],
  pantoprazole:    ['ppi'],
  lansoprazole:    ['ppi'],
  escitalopram:    ['ssri', 'serotonergic'],
  citalopram:      ['ssri', 'serotonergic'],
  sertraline:      ['ssri', 'serotonergic'],
  fluoxetine:      ['ssri', 'serotonergic'],
  paroxetine:      ['ssri', 'serotonergic'],
  venlafaxine:     ['snri', 'serotonergic'],
  amitriptyline:   ['tricyclic', 'serotonergic'],
  nortriptyline:   ['tricyclic', 'serotonergic'],
  codeine:         ['opioid', 'cns_depressant'],
  tramadol:        ['opioid', 'cns_depressant', 'serotonergic'],
  metoprolol:      ['beta_blocker', 'cardiac'],
  atomoxetine:     ['stimulant_like', 'noradrenergic'],
  warfarin:        ['anticoagulant'],
  phenytoin:       ['anticonvulsant', 'cns_depressant'],
  celecoxib:       ['nsaid'],
  fluvastatin:     ['statin'],
  simvastatin:     ['statin'],
  atorvastatin:    ['statin'],
  rosuvastatin:    ['statin'],
  pravastatin:     ['statin'],
  fluorouracil:    ['chemo_fluoropyrimidine'],
  capecitabine:    ['chemo_fluoropyrimidine'],
  tegafur:         ['chemo_fluoropyrimidine'],
  azathioprine:    ['immunosuppressant_thiopurine'],
  mercaptopurine:  ['immunosuppressant_thiopurine'],

  // Recreational / harm reduction
  caffeine:        ['stimulant'],
  alcohol:         ['cns_depressant', 'alcohol'],
  cannabis:        ['cannabinoid', 'cns_depressant'],
  mdma:            ['stimulant', 'serotonergic', 'empathogen'],
  nicotine:        ['stimulant'],
  cocaine:         ['stimulant', 'cardiac_stressor'],
  opioids:         ['opioid', 'cns_depressant'],
  psychedelics:    ['psychedelic', 'serotonergic'],
  benzodiazepines: ['benzo', 'cns_depressant'],
  methamphetamine: ['stimulant', 'cardiac_stressor'],
}

const tagsFor = (drug) => (drug?.id && INTERACTION_TAGS[drug.id]) || []

// ---------------------------------------------------------------------------
// Class-pair synergy rules
// Each rule fires when BOTH drugs collectively carry all `requires` tags.
// The `requires` set uses order-independent matching: {opioid, benzo} matches
// (opioid drug + benzo drug) as well as (benzo drug + opioid drug).
// `excludeSelfPair` = true means the rule must be between two DIFFERENT drug
// ids (so "Cannabis + Cannabis" doesn't fire a CNS-depressant warning).
// ---------------------------------------------------------------------------

const CLASS_RULES = [
  {
    requires: ['opioid', 'benzo'], severity: 'critical',
    mechanism: 'Synergistic CNS depression',
    text: 'Opioid + benzodiazepine is the single most common drug combination behind fatal overdoses. The two classes suppress breathing via different receptor systems (μ-opioid + GABA-A), so effects multiply rather than add. No pharmacogenomic profile makes this combination safe.',
  },
  {
    requires: ['opioid', 'alcohol'], severity: 'critical',
    mechanism: 'Synergistic CNS depression',
    text: 'Opioids + alcohol depress breathing and airway reflexes together. Even moderate alcohol raises overdose risk substantially at opioid doses that would be tolerated dry.',
  },
  {
    requires: ['benzo', 'alcohol'], severity: 'critical',
    mechanism: 'Synergistic CNS depression',
    text: 'Benzodiazepines + alcohol both potentiate GABA-A signalling. Blackouts, respiratory depression, and aspiration risk are dramatically elevated. An ALDH2 variant does not protect against this interaction.',
  },
  {
    requires: ['cns_depressant', 'cns_depressant'], severity: 'significant',
    mechanism: 'Additive CNS depression',
    excludeSelfPair: true,
    text: 'Two CNS depressants stack — sedation, impaired coordination, and reduced respiratory drive compound. Dose thresholds that feel safe alone can become dangerous together.',
  },
  {
    requires: ['ssri', 'serotonergic'], severity: 'critical',
    mechanism: 'Serotonin syndrome risk',
    excludeSelfPair: true,
    text: 'SSRI + another serotonergic drug can trigger serotonin syndrome (hyperthermia, tremor, agitation, autonomic instability). MDMA is the highest-risk pairing — tramadol, SNRIs, and psychedelics also warrant caution. Serotonin syndrome can be fatal.',
  },
  {
    requires: ['snri', 'serotonergic'], severity: 'critical',
    mechanism: 'Serotonin syndrome risk',
    excludeSelfPair: true,
    text: 'SNRI + another serotonergic drug (MDMA, tramadol, psychedelics, another SSRI/SNRI, tricyclics) elevates serotonin syndrome risk. Wash-out periods matter — venlafaxine and duloxetine have longer half-lives than most SSRIs.',
  },
  {
    requires: ['tricyclic', 'serotonergic'], severity: 'significant',
    mechanism: 'Serotonin syndrome risk',
    excludeSelfPair: true,
    text: 'Tricyclic antidepressants + another serotonergic drug can trigger serotonin syndrome and also compound anticholinergic effects.',
  },
  {
    requires: ['stimulant', 'stimulant'], severity: 'significant',
    mechanism: 'Additive sympathomimetic load',
    excludeSelfPair: true,
    text: 'Two stimulants stack cardiovascular and dopaminergic load — heart rate, blood pressure, arrhythmia risk, and psychosis risk all compound. Combining street stimulants with prescription stimulants is a particular hidden-risk pattern.',
  },
  {
    requires: ['stimulant', 'cardiac_stressor'], severity: 'significant',
    mechanism: 'Cardiovascular strain',
    excludeSelfPair: true,
    text: 'Combining stimulants with substances that already stress the cardiovascular system (cocaine, methamphetamine) escalates arrhythmia, hypertensive crisis, and myocardial ischemia risk.',
  },
  {
    requires: ['stimulant', 'beta_blocker'], severity: 'significant',
    mechanism: 'Unopposed alpha stimulation',
    text: 'Stimulants + beta-blockers can leave alpha-adrenergic vasoconstriction unopposed — paradoxically raising blood pressure. Particularly relevant for cocaine, meth, and high-dose amphetamine users on cardiac medications.',
  },
  {
    requires: ['cardiac_stressor', 'cardiac'], severity: 'significant',
    mechanism: 'Cardiovascular interaction',
    text: 'A cardiac-stressor drug combined with an active cardiovascular medication is a red flag — the two act on the same organ system by different mechanisms and can either blunt therapy or provoke arrhythmia.',
  },
  {
    requires: ['anticoagulant', 'nsaid'], severity: 'significant',
    mechanism: 'Bleeding risk',
    text: 'Anticoagulant + NSAID compounds bleeding risk (platelet inhibition + factor inhibition + gastric mucosal effect). Common cause of GI bleeds.',
  },
  {
    requires: ['anticoagulant', 'ssri'], severity: 'significant',
    mechanism: 'Bleeding risk',
    text: 'SSRIs impair platelet aggregation. Combined with an anticoagulant, GI bleeding risk rises noticeably. Discuss whether PPI cover is appropriate.',
  },
  {
    requires: ['antiplatelet', 'nsaid'], severity: 'significant',
    mechanism: 'Bleeding risk',
    text: 'Antiplatelet + NSAID stacks the two most common contributors to upper-GI bleeds. If both are truly needed, PPI cover is standard of care.',
  },
]

// ---------------------------------------------------------------------------
// Named dangerous combos — hard-coded, order-independent, drug-id pairs.
// ---------------------------------------------------------------------------

const NAMED_COMBOS = [
  {
    ids: ['cocaine', 'alcohol'], severity: 'critical',
    mechanism: 'Cocaethylene formation',
    text: 'Cocaine + alcohol produces cocaethylene in the liver — a metabolite more cardiotoxic than either substance alone and with a longer half-life. Cardiac events (arrhythmia, sudden death) are substantially more common with the combination than with cocaine alone.',
  },
  {
    ids: ['mdma', 'psychedelics'], severity: 'significant',
    mechanism: 'Serotonergic overload',
    text: 'MDMA + classical psychedelics ("candyflipping") stacks two serotonergic loads. Anecdotal reports describe intensified experiences; toxicology reports document elevated serotonin-syndrome-like presentations.',
  },
  {
    ids: ['mdma', 'methamphetamine'], severity: 'significant',
    mechanism: 'Sympathomimetic + serotonergic overload',
    text: 'MDMA + methamphetamine compounds cardiovascular strain (both are stimulants) AND serotonergic + dopaminergic flooding. Both are competitively cleared by CYP2D6, which extends exposure further.',
  },
  {
    ids: ['cannabis', 'alcohol'], severity: 'moderate',
    mechanism: 'Additive impairment; delayed onset masks intoxication',
    text: 'THC delays gastric emptying and slows the subjective onset of alcohol — a common contributor to overshooting a comfortable dose. Motor impairment stacks. Not lethal, but a well-documented crash-risk pattern.',
  },
  {
    ids: ['caffeine', 'alcohol'], severity: 'moderate',
    mechanism: 'Masked intoxication',
    text: 'Caffeine partially blunts the subjective sedation from alcohol without changing blood alcohol content or breakdown. This "wide-awake drunk" state is linked to higher-risk decisions and greater overall consumption.',
  },
  {
    ids: ['nicotine', 'caffeine'], severity: 'informational',
    mechanism: 'CYP1A2 induction',
    text: 'Chronic smoking induces CYP1A2, accelerating caffeine clearance — smokers metabolise caffeine roughly 50% faster than non-smokers. Sudden cessation causes an effective caffeine surge for 2–3 weeks.',
  },
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the interaction list between two drugs.
 *
 * @param {object} drugA        — a DRUG_CATALOG entry
 * @param {object} drugB        — a DRUG_CATALOG entry
 * @param {object} ctx          — { phenotypes..., rawVariants } (same shape as
 *                                the single-drug personaliseInteractions ctx)
 * @returns {{severity, findings, categories}}
 *   severity   — aggregate worst severity
 *   findings   — [{ severity, mechanism, text }]
 *   categories — { cyp: [...], synergy: [...], named: [...] }
 */
export function computeDrugInteractions(drugA, drugB, ctx = {}) {
  if (!drugA || !drugB) return { severity: null, findings: [], categories: emptyCategories() }
  const isSameEntry = drugA.id === drugB.id

  const cyp = detectCYPCompetition(drugA, drugB, ctx)
  const synergy = detectClassSynergy(drugA, drugB, isSameEntry)
  const named = detectNamedCombos(drugA, drugB, isSameEntry)

  // Deduplicate findings by mechanism + text so a class rule + a named combo
  // that describe the same interaction don't render twice.
  const seen = new Set()
  const findings = []
  for (const arr of [named, cyp, synergy]) {
    for (const f of arr) {
      const key = `${f.mechanism}::${f.text.slice(0, 60)}`
      if (seen.has(key)) continue
      seen.add(key)
      findings.push(f)
    }
  }

  const rank = (s) => severityRank(s)
  findings.sort((a, b) => rank(b.severity) - rank(a.severity))

  const worst = findings[0]?.severity || null
  return {
    severity: worst,
    findings,
    categories: { cyp, synergy, named },
  }
}

/**
 * If two drugs share a metabolising enzyme in pk_genes, one competitively
 * inhibits the other's clearance. Severity depends on the user's phenotype
 * at that gene (worse if already an IM/PM).
 */
function detectCYPCompetition(drugA, drugB, ctx) {
  const out = []
  const pkA = drugA.pk_genes || []
  const pkB = drugB.pk_genes || []
  const genesA = new Set(pkA.map((g) => g.gene))
  const genesB = new Set(pkB.map((g) => g.gene))
  for (const gene of genesA) {
    if (!genesB.has(gene)) continue
    if (!/^CYP/.test(gene)) continue  // only CYPs compete this way in this simplified model
    const ph = ctx?.[gene]?.phenotype
    let severity = 'moderate'
    let phLine = ''
    if (ph === 'PM')       { severity = 'significant'; phLine = ` (you are a poor ${gene} metabolizer — this compounds the effect)` }
    else if (ph === 'IM')  { severity = 'significant'; phLine = ` (you are an intermediate ${gene} metabolizer — this compounds the effect)` }
    else if (ph === 'UM')  { severity = 'moderate';    phLine = ` (you are an ultra-rapid ${gene} metabolizer — competition may partially offset)` }
    else if (ctx?.[gene]?.label) phLine = ` (your inferred ${gene} phenotype: ${ctx[gene].label})`
    out.push({
      severity,
      mechanism: `${gene} competitive metabolism`,
      text: `${drugA.name || drugA.generic} and ${drugB.name || drugB.generic} are both cleared by ${gene}${phLine}. Taken together, each slows the other's breakdown, prolonging exposure and raising side-effect risk. Discuss dose spacing or an alternative agent with your prescriber.`,
    })
  }
  return out
}

function detectClassSynergy(drugA, drugB, isSameEntry) {
  const tagsA = tagsFor(drugA)
  const tagsB = tagsFor(drugB)
  if (!tagsA.length || !tagsB.length) return []
  const combined = [...tagsA, ...tagsB]
  const out = []
  for (const rule of CLASS_RULES) {
    if (isSameEntry && rule.excludeSelfPair) continue
    // Count required tags in the combined pool, allowing each drug to
    // contribute at most one tag per requires slot.
    if (!satisfiesRequires(rule.requires, tagsA, tagsB)) continue
    out.push({ severity: rule.severity, mechanism: rule.mechanism, text: rule.text })
  }
  // Additionally auto-detect "same interaction class present in both" for
  // tags not explicitly listed above — a safety net so any obviously-similar
  // pair still produces at least one finding.
  const overlap = tagsA.filter((t) => tagsB.includes(t))
  if (!isSameEntry) {
    for (const tag of overlap) {
      const alreadyCovered = out.some((f) => f.mechanism.toLowerCase().includes(tag.replace('_', ' ')))
      if (alreadyCovered) continue
      if (tag === 'ppi' || tag === 'nsaid' || tag === 'statin') {
        out.push({
          severity: 'moderate',
          mechanism: `Two ${tag.toUpperCase()} agents`,
          text: `Both entries fall in the ${tag.toUpperCase()} class — duplicate therapy with limited additional benefit. Discuss with prescriber whether one should replace the other.`,
        })
      }
    }
  }
  return out
}

/**
 * Match `requires` against the drugs' tags such that requires items can be
 * satisfied by tags from EITHER drug. Duplicate tokens in `requires`
 * (e.g. ['cns_depressant', 'cns_depressant']) require the token to appear
 * in BOTH tag lists — that's how we detect two-of-a-kind stacking without
 * mistakenly matching a single drug that carries the tag twice.
 */
function satisfiesRequires(requires, tagsA, tagsB) {
  const dupes = new Map()
  for (const r of requires) dupes.set(r, (dupes.get(r) || 0) + 1)
  for (const [token, need] of dupes.entries()) {
    if (need === 1) {
      // Token must appear in A OR B.
      if (!tagsA.includes(token) && !tagsB.includes(token)) return false
    } else {
      // Token must appear in BOTH A AND B.
      if (!tagsA.includes(token) || !tagsB.includes(token)) return false
    }
  }
  return true
}

function detectNamedCombos(drugA, drugB, isSameEntry) {
  if (isSameEntry) return []
  const idA = drugA.id
  const idB = drugB.id
  const out = []
  for (const combo of NAMED_COMBOS) {
    if (combo.ids.length !== 2) continue
    const [x, y] = combo.ids
    if ((x === idA && y === idB) || (x === idB && y === idA)) {
      out.push({ severity: combo.severity, mechanism: combo.mechanism, text: combo.text })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyCategories = () => ({ cyp: [], synergy: [], named: [] })

function severityRank(s) {
  switch (s) {
    case 'critical':      return 5
    case 'significant':   return 4
    case 'caution':       return 4
    case 'moderate':      return 3
    case 'notice':        return 2
    case 'informational': return 1
    case 'clear':         return 0
    default:              return 0
  }
}
