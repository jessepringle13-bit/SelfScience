// /app/lib/doctorExplanation.js
// Generates a single-finding clinical conversation summary for the
// "Explain this to my doctor" modal. Two-tier:
//
//   1. CURATED — 7 priority rsIDs get hand-written clinical questions,
//      per product spec (MTHFR C677T/A1298C, MTNR1B, COL5A1, PPARGC1A,
//      SLCO1B1, FKBP5).
//   2. DYNAMIC — every other variant assembles 3 template-driven
//      questions based on the card's own classification and pillar.
//
// The "What it suggests" prose reuses `variantInterpretations.meaning`,
// which is already plain English but clinical-safe (never uses
// diagnosis language, always frames as "research associates").
//
// Pure functions, no DOM — safe to import anywhere.

import { getVariantInterpretation } from '@/lib/variantInterpretations'
import { explainGene } from '@/lib/geneExplanations'

/* ------------------- Curated priority-variant questions ---------------- */

const CURATED_QUESTIONS = {
  // MTHFR C677T
  rs1801133: [
    'Can we check my homocysteine levels?',
    'Should I be taking methylfolate rather than folic acid given this genotype?',
    'Are any of my current medications affected by reduced methylation capacity?',
  ],
  // MTHFR A1298C — same clinical questions as C677T (compound-het framing).
  rs1801131: [
    'Can we check my homocysteine levels?',
    'Should I be taking methylfolate rather than folic acid given this genotype?',
    'Are any of my current medications affected by reduced methylation capacity?',
  ],
  // MTNR1B
  rs10830963: [
    'Can we run a fasting insulin and HbA1c panel?',
    'Is my current fasting glucose trend concerning given this variant?',
    'What eating window would you recommend given the late-eating insulin effect associated with MTNR1B?',
  ],
  // COL5A1
  rs12722: [
    'Should I consider a collagen synthesis protocol given elevated connective tissue injury risk?',
    'Are there any imaging or physical therapy assessments worth doing proactively?',
    'How aggressively should I progress training volume given this genotype?',
  ],
  // PPARGC1A
  rs8192678: [
    "Does my mitochondrial adaptation profile affect how you'd approach any metabolic concerns?",
    'Would more frequent low-intensity cardio be preferable to less frequent high-intensity for my genotype?',
    'Is there value in tracking VO2 max over time given this variant?',
  ],
  // SLCO1B1
  rs4149056: [
    'I carry a variant strongly associated with statin-induced myopathy — can we flag this before any statin is ever prescribed?',
    'If a statin is ever needed, which ones are safer for SLCO1B1 poor transporters?',
    'Should we monitor CK levels if I am ever on a statin?',
  ],
  // FKBP5
  rs1360780: [
    'My cortisol clearance may be slower than average based on this variant — is there value in testing cortisol patterns?',
    'Are there any medications that interact with HPA axis regulation I should be aware of?',
    'What stress-related conditions should I monitor for given this genotype?',
  ],
}

/* -------- Dynamic-question templates for non-priority variants -------- */
// Three questions, chosen to hit: (1) the primary effect of the gene,
// (2) the most relevant blood marker / clinical test, (3) monitoring /
// lifestyle interventions. Uses pillar to pick a marker.

const PILLAR_TO_MARKER = {
  Nutrition: 'a targeted micronutrient panel (folate, B12, homocysteine, vitamin D)',
  Fitness: 'CK, inflammatory markers, and a metabolic panel after intense training',
  Longevity: 'a full lipid panel including ApoB and Lp(a)',
  Sleep: 'HbA1c, fasting insulin, and morning cortisol',
  'Mental Health': 'thyroid function, vitamin D, and B12',
  Pharmacogenomics: 'a review of any current or planned medications for this pathway',
  Environment: 'liver enzymes and glutathione status if available',
  Hormones: 'a full sex-hormone and SHBG panel',
  Wellness: 'the standard preventive-care blood panel',
  Development: 'growth-and-development markers appropriate for age',
  Genomics: 'confirmatory clinical genetic testing if it will influence management',
}

function dynamicQuestions(card, geneLabel) {
  const pillar = card?.pillar || ''
  const marker = PILLAR_TO_MARKER[pillar] || 'the standard preventive-care blood panel'
  const geneText = geneLabel || (card?.gene || 'this gene')
  return [
    `What does the current research say about the ${geneText} variant and its likely effect on my day-to-day health?`,
    `Would it be worth running ${marker} to see whether this variant is currently affecting me?`,
    'Are there any monitoring, supplement, or lifestyle interventions you would recommend given this finding?',
  ]
}

/* --------------------- Public API ------------------------------------- */

/**
 * Build the full doctor-facing summary for a single variant card.
 * Never throws — falls back to safe defaults for missing fields.
 * Returns:
 *   {
 *     traitName,       // "Gene · trait" or gene alone
 *     geneLabel,       // "MTHFR"
 *     rsid,            // "rs1801133"
 *     genotype,        // "CT" (may be empty)
 *     source,          // "Consumer SNP data — 23andMe v5"
 *     whatItSuggests,  // paragraph — clinical but plain-English
 *     questions,       // string[3]
 *     clinicianNote,   // hardcoded caveat
 *     isCurated,       // did the questions come from CURATED?
 *   }
 */
export function buildDoctorExplanation(card) {
  const c = card || {}
  const rsid = String(c.rsid || '').toLowerCase()
  const geneLabel = (c.gene || c.name || '').toString().split(/[\s(/·+,]/)[0] || 'Variant'
  const traitBase = c.trait || c.name || c.gene || 'Genetic finding'
  const traitName = c.gene && c.trait && !String(c.trait).toLowerCase().includes(String(c.gene).toLowerCase())
    ? `${c.gene} · ${c.trait}`
    : traitBase

  // Reuse the plain-English interpretation "meaning" for the What it
  // suggests section — already framed with "research associates" tone.
  const interp = getVariantInterpretation(c)
  const geneExplainer = explainGene(c.gene, c.rsid)
  const whatItSuggests =
    (interp?.meaning && interp.meaning.length > 15)
      ? interp.meaning
      : (geneExplainer
          ? `The ${geneLabel} gene ${geneExplainer.toLowerCase()} Research associates this variant with variation in that pathway, though effect sizes and clinical relevance depend on the individual.`
          : `Research associates the ${rsid || 'this'} variant in ${geneLabel} with modest phenotypic variation. It is not diagnostic on its own, and clinical relevance depends on the broader picture including other genes, lifestyle, and biomarkers.`)

  const curated = CURATED_QUESTIONS[rsid]
  const questions = curated || dynamicQuestions(c, geneLabel)

  return {
    traitName,
    geneLabel,
    rsid: c.rsid || '',
    genotype: c.genotype || '',
    source: 'Consumer SNP data — 23andMe v5',
    whatItSuggests,
    questions,
    clinicianNote:
      'This finding is derived from consumer-grade SNP array data (23andMe v5). It is not equivalent to clinical sequencing and should be confirmed with validated diagnostic testing before informing any treatment or management decision.',
    isCurated: !!curated,
  }
}

/**
 * Serialize the modal content to plain text for the "Copy to clipboard"
 * action. Mirrors the modal layout so the recipient sees the same
 * structure the user did.
 */
export function serializeExplanationForClipboard(exp) {
  if (!exp) return ''
  const lines = []
  lines.push('FOR YOUR APPOINTMENT')
  lines.push('')
  lines.push(`Finding: ${exp.traitName} (${exp.rsid || '—'})`)
  if (exp.genotype) lines.push(`Genotype: ${exp.genotype}`)
  lines.push(`Source: ${exp.source}`)
  lines.push('')
  lines.push('What it suggests:')
  lines.push(exp.whatItSuggests)
  lines.push('')
  lines.push('Questions to ask your doctor:')
  for (const q of exp.questions || []) {
    lines.push(`  → ${q}`)
  }
  lines.push('')
  lines.push('Note to clinician:')
  lines.push(exp.clinicianNote)
  return lines.join('\n')
}
