// /app/lib/variantInterpretations.js
// Plain-English "What does this mean for me?" interpretation layer for
// every finding card. Two-tier logic:
//
//   1. CURATED — 11 prioritized rsIDs get hand-written content with
//      three parts (meaning, actions, confidence).
//   2. DYNAMIC — every other variant gets a generated interpretation
//      built from the card's own description, classification, and
//      pillar tag, so no card is ever left without an interpretation.
//
// Confidence tiers (3 only, per product spec):
//   - 'high'     → well-replicated, widely accepted research
//   - 'moderate' → replicated but effect sizes vary
//   - 'emerging' → early findings, more research needed
//
// No React, no DOM — this file is pure logic, safe to import from
// server or client components. All copy is additive; nothing removes
// existing content.

import { explainGene } from '@/lib/geneExplanations'
import { normalizePillarName } from '@/lib/pillars'

/* --------------------- Curated interpretations ------------------------ */
// Keys are lowercased rsIDs. Every entry has:
//   meaning    — Part A: what the variant means, in plain English (≤3 sentences)
//   actions    — Part B: array of actionable next steps (2-4 items, short verbs)
//   confidence — Part C: 'high' | 'moderate' | 'emerging'
// Genotype-specific nuance is added when we can identify the "risk" or
// "favorable" allele — but the copy avoids clinical claims.

const CURATED = {
  // ─── MTHFR C677T ──────────────────────────────────────────────────
  rs1801133: {
    meaning:
      "This is the most studied variant in the MTHFR gene, which turns folate (vitamin B9) into its active form (5-MTHF). If you carry one or two T alleles, your enzyme runs at reduced efficiency — roughly 60–70% for one copy, and about 30% for two copies. Lower activity can nudge homocysteine upward and lower circulating folate, which touches DNA repair, mood chemistry, and cardiovascular biology.",
    actions: [
      "Ask your doctor to check homocysteine, B12, and RBC folate on your next blood panel.",
      "Favor folate-rich whole foods (leafy greens, legumes, avocado) and consider a methylated B-complex if levels run low.",
      "Discuss active forms (methylfolate, methylcobalamin) with a practitioner rather than starting supplements blindly.",
      "This is a well-known variant — carrying it is common and does NOT mean disease is coming.",
    ],
    confidence: 'high',
  },

  // ─── MTHFR A1298C ─────────────────────────────────────────────────
  rs1801131: {
    meaning:
      "The second common MTHFR variant. Its effect on enzyme activity is milder than C677T — most studies show a modest reduction that becomes more noticeable if you also carry a C677T variant. On its own it rarely raises homocysteine much, but it can still influence how well your body handles folate.",
    actions: [
      "Check whether your report also flags C677T (rs1801133) — the combination matters more than either alone.",
      "Include folate-rich foods daily; supplements are usually unnecessary if diet is solid.",
      "If you take a prenatal or general multivitamin, look for one that already includes methylfolate.",
    ],
    confidence: 'moderate',
  },

  // ─── PPARGC1A Gly482Ser ───────────────────────────────────────────
  rs8192678: {
    meaning:
      "This variant sits in PPARGC1A, a master regulator of how your muscle cells build new mitochondria — the energy factories that power endurance. Research suggests the A allele may be more common in sprint/power athletes, while the G allele shows up more in endurance athletes, though the effect on any individual is small.",
    actions: [
      "Regular Zone 2 cardio (long, easy-pace sessions) is the single best way to build mitochondria regardless of your variant.",
      "Add 1–2 short high-intensity sessions per week — HIIT is a potent mitochondrial signal.",
      "Don't use this result to skip training styles you enjoy — genetics explain a tiny fraction of endurance performance.",
    ],
    confidence: 'moderate',
  },

  // ─── COL5A1 ───────────────────────────────────────────────────────
  rs12722: {
    meaning:
      "COL5A1 helps build type-V collagen, a structural protein in your tendons, ligaments, and skin. Studies of runners and team-sport athletes suggest carriers of the T allele may have slightly stiffer tendons and a modestly elevated risk of Achilles tendinopathy or ACL injury — with lower flexibility on average.",
    actions: [
      "Warm up thoroughly before high-load activity — especially calf and hamstring dynamic drills.",
      "Add eccentric strengthening (slow lowering) for Achilles and knee tendons 2–3× weekly.",
      "Include mobility work; the tighter tendon profile responds well to consistent stretching.",
      "Progress mileage or plyometrics gradually — the injury signal is real but manageable.",
    ],
    confidence: 'moderate',
  },

  // ─── MTNR1B ───────────────────────────────────────────────────────
  rs10830963: {
    meaning:
      "MTNR1B is the melatonin receptor on your insulin-producing pancreatic cells. Carrying one or two G alleles is one of the most reliably replicated genetic signals for higher fasting blood glucose and slightly higher risk of gestational and type-2 diabetes — because melatonin at night can partially suppress insulin release.",
    actions: [
      "Avoid eating a heavy carbohydrate meal in the 2–3 hours before bed — that's when the effect is largest.",
      "Keep breakfast within an hour of waking and eat your biggest meal earlier in the day.",
      "Prioritize sleep regularity — irregular schedules amplify this variant's effect on glucose.",
      "If pregnant or planning pregnancy, mention this to your OB — gestational-diabetes screening thresholds may matter more.",
    ],
    confidence: 'high',
  },

  // ─── PPARA ────────────────────────────────────────────────────────
  rs4253778: {
    meaning:
      "PPARA is a nuclear receptor that tells your body when to switch from burning sugar to burning fat — especially during long or fasted exercise. The G allele has been associated with a stronger endurance phenotype and better response to aerobic training in some studies, though results vary by sport and population.",
    actions: [
      "Include at least one long, low-intensity session per week (Zone 2) to train fat-oxidation.",
      "Experiment with fasted morning walks or easy cardio — this variant tends to tolerate them well.",
      "Balance with resistance training — endurance leaning genetics don't excuse skipping strength work.",
    ],
    confidence: 'moderate',
  },

  // ─── MMP1 ─────────────────────────────────────────────────────────
  rs1799750: {
    meaning:
      "MMP1 is an enzyme that breaks down old collagen so new collagen can be laid down — essential for how tendons and ligaments remodel after strain. The 2G allele leads to higher MMP1 activity, which can mean faster collagen turnover but also, in some studies, a modestly elevated tendon-injury risk when paired with high training loads.",
    actions: [
      "Load tendons progressively — sudden jumps in intensity are the biggest injury trigger.",
      "Include 2–3 weekly sessions of eccentric or heavy-slow-resistance work for target tendons.",
      "Ensure adequate protein (roughly 1.6–2 g/kg body weight) and vitamin C to support collagen synthesis.",
    ],
    confidence: 'moderate',
  },

  // ─── CLU (clusterin) ──────────────────────────────────────────────
  rs9420907: {
    meaning:
      "This variant sits near CLU, a gene involved in lipid transport and clearing damaged proteins in the brain. Large genome-wide studies have linked the C allele to a small increase in late-onset Alzheimer's risk — but the effect is tiny compared to APOE, and lifestyle plays a far larger role in cognitive aging.",
    actions: [
      "Protect brain health with the basics: regular aerobic exercise, 7–9 hours of sleep, and a Mediterranean-style diet.",
      "Stay socially and cognitively engaged — learning new skills is one of the strongest cognitive-reserve builders.",
      "Manage cardiovascular risk factors (blood pressure, LDL, blood sugar) — what's good for the heart is good for the brain.",
      "Do NOT interpret this as a diagnosis. It is a small statistical signal, not a prediction.",
    ],
    confidence: 'emerging',
  },

  // ─── KL (Klotho) ──────────────────────────────────────────────────
  rs12778366: {
    meaning:
      "This variant sits near the KLOTHO gene, sometimes called an 'anti-aging' gene because it influences phosphate handling, vitamin-D metabolism, and vascular health. Some studies link certain alleles to modest differences in cognitive aging and cardiovascular outcomes, but the findings are early and effect sizes are small.",
    actions: [
      "Focus on the biology KLOTHO influences: keep vitamin D in a healthy range and stay physically active.",
      "Regular aerobic exercise raises circulating Klotho levels — one of the most reliable ways to boost this pathway.",
      "Don't chase Klotho-specific supplements; the evidence in humans is not there yet.",
    ],
    confidence: 'emerging',
  },

  // ─── FKBP5 ────────────────────────────────────────────────────────
  rs1360780: {
    meaning:
      "FKBP5 fine-tunes how strongly your cells respond to cortisol, the main stress hormone. Carriers of the T allele tend to show a slower shut-off of the cortisol stress response and, in studies where early-life adversity was also present, a higher susceptibility to anxiety, depression, and PTSD-like symptoms.",
    actions: [
      "Build a nervous-system routine: breathwork, meditation, or slow walks are especially valuable for this variant.",
      "Prioritize sleep — cortisol dysregulation and poor sleep amplify each other.",
      "If you notice persistent stress reactivity, this is a helpful conversation to have with a therapist or physician.",
      "This variant reflects stress SENSITIVITY, not fragility — sensitive systems also respond strongly to good habits.",
    ],
    confidence: 'moderate',
  },

  // ─── FADS1 ────────────────────────────────────────────────────────
  rs174547: {
    meaning:
      "FADS1 converts short-chain plant omega-3 (ALA, from flax, chia, walnuts) into the long-chain forms your body actually uses (EPA and DHA). The T allele is the slower-converting version — carriers make less EPA/DHA from plant sources, so directly consumed omega-3 (from fish or algae) matters more.",
    actions: [
      "Aim for 2 servings of fatty fish per week (salmon, sardines, mackerel) OR a quality fish/algae oil.",
      "If vegetarian/vegan, an algae-based EPA+DHA supplement is worth strongly considering.",
      "Plant omega-3s (flax, chia) are still healthy — but don't rely on them alone if you carry this variant.",
      "Consider a blood omega-3 index test to see where you actually stand.",
    ],
    confidence: 'high',
  },
}

/* ------------------ Confidence pill config ---------------------------- */

const CONFIDENCE_META = {
  high: {
    label: 'Well-studied',
    className: 'bg-ss-green/10 text-ss-green ring-1 ring-ss-green/30',
  },
  moderate: {
    label: 'Moderate evidence',
    className: 'bg-ss-amber/15 text-ss-amber ring-1 ring-ss-amber/30',
  },
  emerging: {
    label: 'Emerging research',
    className: 'bg-ss-muted/15 text-ss-muted ring-1 ring-ss-muted/40',
  },
}

/* ---------------- Evidence-strength → confidence mapping -------------- */
// For DYNAMIC (non-curated) variants, translate the card's own
// `evidence_strength` field into one of the 3 confidence tiers.
function strengthToConfidence(strength) {
  const s = String(strength || '').toLowerCase()
  if (s === 'strong' || s === 'established' || s === 'high') return 'high'
  if (s === 'moderate' || s === 'medium') return 'moderate'
  return 'emerging'
}

/* --------------------- Dynamic-fallback builder ----------------------- */
// For variants without curated content, assemble a coherent interpretation
// using the card's own fields plus the geneExplanations one-liner.

function classificationBucket(c) {
  const s = String(c || '').toLowerCase()
  if (s === 'positive' || s === 'strength') return 'strength'
  if (s === 'awareness' || s === 'be_aware' || s === 'aware' || s === 'finding') return 'awareness'
  return 'neutral'
}

function dynamicInterpretation(card) {
  const bucket = classificationBucket(card.classification)
  const pillar = normalizePillarName(card.pillar || '') || ''
  const description = card.classification_text || card.summary || card.plain || card.description || ''
  const geneExplainer = explainGene(card.gene, card.rsid)

  // Part A — assemble the "meaning" paragraph.
  // Priority: (1) gene job description, (2) card's own description, (3) generic fallback.
  const meaningParts = []
  if (geneExplainer) meaningParts.push(geneExplainer)
  if (description && description.length > 15) meaningParts.push(description)
  if (meaningParts.length === 0) {
    meaningParts.push(
      "This variant sits in a gene your body uses every day. The full picture of how much it matters for you personally depends on lifestyle, other genes, and biomarkers — this card is a single data point, not a verdict."
    )
  }
  const meaning = meaningParts.join(' ')

  // Part B — actions, tailored by classification bucket + pillar.
  const actions = []
  if (bucket === 'strength') {
    actions.push("This is a favorable variant — think of it as one advantage to lean into.")
    if (pillar) actions.push(`Keep investing in ${pillar.toLowerCase()} — your genetics support this area.`)
    actions.push("Use the 'Read the research' button below to explore studies about this gene.")
    actions.push("Add this to your practitioner report if you'd like your doctor to know about it.")
  } else if (bucket === 'awareness') {
    actions.push("This is an area worth understanding — it is NOT a diagnosis or a prediction of disease.")
    if (pillar) actions.push(`Focus on the basics of the ${pillar.toLowerCase()} pillar — foundation habits matter most.`)
    actions.push("Check whether related biomarkers are in a healthy range on your next lab panel.")
    actions.push("Use the 'Read the research' button below to see what current studies say.")
  } else {
    actions.push("This variant is classified as neutral — no clear positive or negative signal.")
    actions.push("It's still useful context if the same gene comes up in future research or symptoms.")
    actions.push("Use the 'Read the research' button below if you'd like to explore further.")
  }

  return {
    meaning,
    actions,
    confidence: strengthToConfidence(card.evidence_strength),
  }
}

/* ---------------------------- Public API ------------------------------ */

/**
 * Return the interpretation for a card. Always returns an object with
 * { meaning, actions, confidence, isCurated }.
 */
export function getVariantInterpretation(card) {
  const rsid = String(card?.rsid || '').toLowerCase()
  const curated = CURATED[rsid]
  if (curated) {
    return { ...curated, isCurated: true }
  }
  return { ...dynamicInterpretation(card || {}), isCurated: false }
}

/**
 * Get the confidence pill display metadata for a given confidence tier.
 */
export function getConfidenceMeta(confidence) {
  return CONFIDENCE_META[confidence] || CONFIDENCE_META.emerging
}

/**
 * Debug helper: list all curated rsIDs.
 */
export function allCuratedRsids() {
  return Object.keys(CURATED)
}
