// /app/lib/supplementProtocol.js
// SelfScience — Supplement & Lifestyle Protocol Generator.
//
// A static, rules-based mapping from user genome findings to educational
// supplement / lifestyle / awareness recommendations. This file has:
//   • SUPPLEMENT_PROTOCOL_MAP — 14 hand-curated variant-to-protocol rules
//   • matchProtocolToUserVariants(cards) — filters the map against the
//     user's actual classified variant cards from the genome report
//
// Compliance rules baked in:
//   1. Every card uses research language ("associated with", "research
//      suggests", "may support") — never "cure", "treat", "prevent",
//      "diagnose", or "prescribe".
//   2. Every recommendation carries a `researchBasis` sentence.
//   3. `awareness` category cards are framed as discussion points for a
//      qualified provider, not self-directed actions.
//
// No network calls, no secret-key exposure. Fully client-safe.

/**
 * @typedef {Object} Recommendation
 * @property {string} name            - Supplement / behavior name
 * @property {string} dose            - Suggested research dose or "Behavioral"
 * @property {string} mechanism       - Plain-language mechanism explanation
 * @property {string} researchBasis   - The literature grounding sentence
 * @property {string} [note]          - Optional additional context
 *
 * @typedef {Object} ProtocolMapping
 * @property {string}   id              - Stable identifier (kebab-case)
 * @property {string}   gene            - Gene name (may include "/" or "+" for combos)
 * @property {string}   genotypePattern - Human-readable genotype pattern
 * @property {string[]} rsids           - rsIDs this rule references
 * @property {'priority'|'lifestyle'|'awareness'} category
 * @property {(cards: any[]) => boolean} matches - Card-set predicate
 * @property {Recommendation[]} recommendations
 * @property {string}   [disclaimerNote]
 */

// Small helper: get the classified card for a specific rsID from the flat
// array of every card in the user's report.
function findCard(cards, rsid) {
  return cards.find((c) => c.rsid === rsid) || null
}

// Small helper: does the user carry a given genotype at the given rsID?
// Handles both A/B-strand notation and forward/reverse orientations if the
// caller passes an alternates array.
function hasGenotype(cards, rsid, ...genotypes) {
  const card = findCard(cards, rsid)
  if (!card || !card.genotype) return false
  const gt = String(card.genotype).toUpperCase().replace(/[^A-Z]/g, '')
  const sorted = gt.length === 2 ? [gt[0], gt[1]].sort().join('') : gt
  return genotypes.some((g) => {
    const gc = String(g).toUpperCase().replace(/[^A-Z]/g, '')
    const gcSorted = gc.length === 2 ? [gc[0], gc[1]].sort().join('') : gc
    return sorted === gcSorted
  })
}

// Helper: does the user have the given haplotype status?
// The classifier writes haplotype cards with:
//   gene           = the rsID list (e.g. "rs1801133 + rs1801131")
//   is_haplotype   = true
//   haplotype_name = the status label (e.g. "compound_heterozygous")
//
// We identify the haplotype by any rsID in `rsidHints` matching card.rsid,
// then confirm the status matches one of `statusNames`.
function hasHaplotype(cards, rsidHints, ...statusNames) {
  const hints = Array.isArray(rsidHints) ? rsidHints : [rsidHints]
  for (const c of cards) {
    if (!c.is_haplotype) continue
    // The classifier stores the haplotype card's primary rsID at c.rsid.
    // Also allow substring match on `gene` in case the card carries
    // "rsX + rsY" format (defensive).
    const rsidMatch = hints.includes(c.rsid) ||
      hints.some((h) => (c.gene || '').includes(h))
    if (!rsidMatch) continue
    if (statusNames.includes(c.haplotype_name)) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// SUPPLEMENT_PROTOCOL_MAP — 14 rules
// ---------------------------------------------------------------------------

export const SUPPLEMENT_PROTOCOL_MAP = [
  // ============================================================
  // PRIORITY STACK — variant-driven supplements
  // ============================================================
  {
    id: 'mthfr-compound-het',
    gene: 'MTHFR',
    genotypePattern: 'Compound heterozygous (C677T + A1298C)',
    rsids: ['rs1801133', 'rs1801131'],
    category: 'priority',
    matches: (cards) => hasHaplotype(cards, ['rs1801133', 'rs1801131'], 'compound_heterozygous', '677_homozygous', 'double_homozygous', '1298_homozygous'),
    recommendations: [
      {
        name: '5-MTHF (L-methylfolate)',
        dose: '400–800 mcg/day',
        mechanism: 'Reduced MTHFR enzyme activity limits conversion of folic acid/folate into the active form (5-MTHF) required for methylation and homocysteine clearance.',
        researchBasis: 'Studies of MTHFR C677T homozygotes and compound heterozygotes consistently report elevated homocysteine and impaired one-carbon metabolism; the pre-methylated form bypasses the enzymatic bottleneck.',
      },
      {
        name: 'Methylcobalamin (B12)',
        dose: '500–1000 mcg/day',
        mechanism: 'B12 acts as a cofactor with folate in the methionine cycle; the methylated form is preferred when methylation capacity is already reduced.',
        researchBasis: 'B12 and folate status are interdependent in homocysteine metabolism research.',
      },
      {
        name: 'Pyridoxal-5-Phosphate (P5P / B6)',
        dose: '25–50 mg/day',
        mechanism: 'Active form of B6 and a cofactor for the transsulfuration pathway — an alternate route for homocysteine clearance.',
        researchBasis: 'B6 status research shows supportive roles in homocysteine and neurotransmitter pathways alongside MTHFR-related methylation support.',
      },
      {
        name: 'Riboflavin (B2)',
        dose: '5–10 mg/day',
        mechanism: 'B2 is a required FAD cofactor for the MTHFR enzyme itself.',
        researchBasis: 'Riboflavin–MTHFR genotype interaction trials (e.g., McNulty et al.) show genotype-specific benefit concentrated in C677T TT and compound-het individuals.',
      },
    ],
    disclaimerNote: 'Discuss methylation support with a healthcare provider, especially if pregnant, on methotrexate, or managing a folate-sensitive condition.',
  },

  {
    id: 'mthfr-single-het',
    gene: 'MTHFR',
    genotypePattern: 'C677T heterozygous or A1298C heterozygous',
    rsids: ['rs1801133', 'rs1801131'],
    category: 'priority',
    matches: (cards) => hasHaplotype(cards, ['rs1801133', 'rs1801131'], '677_heterozygous', '1298_heterozygous'),
    recommendations: [
      {
        name: '5-MTHF (L-methylfolate)',
        dose: '400 mcg/day',
        mechanism: 'A single MTHFR variant reduces methylation capacity by roughly 30–40% in research; the active form supports the pathway without loading the reduced enzyme step.',
        researchBasis: 'Heterozygous MTHFR carriers show intermediate enzyme activity and modestly elevated homocysteine in published cohort studies.',
      },
      {
        name: 'Methylcobalamin (B12)',
        dose: '500 mcg/day',
        mechanism: 'Supports folate–B12 coupling in the methionine cycle.',
        researchBasis: 'General B-complex research alongside MTHFR methylation biology.',
      },
    ],
    disclaimerNote: 'Single-variant MTHFR is common in the population — dose conservatively and adjust with lab guidance.',
  },

  {
    id: 'bcmo1-low-converter',
    gene: 'BCMO1',
    genotypePattern: 'AA (reduced beta-carotene conversion)',
    rsids: ['rs12934922', 'rs7501331'],
    category: 'priority',
    matches: (cards) => hasGenotype(cards, 'rs12934922', 'AA', 'TT') || hasGenotype(cards, 'rs7501331', 'TT', 'AA'),
    recommendations: [
      {
        name: 'Preformed Vitamin A (Retinol)',
        dose: 'From animal sources (liver, cod liver oil) or retinyl palmitate — stay within adult RDA/UL guidance',
        mechanism: 'BCMO1 low-activity genotypes are associated with markedly reduced conversion of plant-based beta-carotene into usable retinol.',
        researchBasis: 'BCMO1 variant studies show up to 70%+ reduced conversion efficiency in AA carriers, meaning plant-only vitamin A sources may be insufficient.',
        note: 'Plant sources alone (carrots, sweet potato) are likely less effective for this genotype — prioritize preformed / animal-sourced vitamin A.',
      },
    ],
    disclaimerNote: 'Vitamin A has a defined upper tolerable intake limit — do not exceed standard UL guidance without medical supervision.',
  },

  {
    id: 'fads1-2-reduced',
    gene: 'FADS1 / FADS2',
    genotypePattern: 'Reduced-function variant (rs174537 T / rs174546 T)',
    rsids: ['rs174537', 'rs174546'],
    category: 'priority',
    matches: (cards) => hasGenotype(cards, 'rs174537', 'TT', 'CT', 'TC') || hasGenotype(cards, 'rs174546', 'TT', 'CT', 'TC'),
    recommendations: [
      {
        name: 'Direct EPA / DHA (fish oil or algae oil)',
        dose: '1–2 g/day combined EPA + DHA',
        mechanism: 'FADS1/2 reduced-function variants impair conversion of plant-based ALA (omega-3 precursor) into the active long-chain forms EPA and DHA.',
        researchBasis: 'FADS variant research consistently shows reduced ALA-to-EPA/DHA conversion efficiency, supporting direct-source supplementation over reliance on ALA-rich foods.',
        note: 'Prioritize direct EPA/DHA sources — do not rely on flax, chia, or walnuts alone for omega-3 status.',
      },
    ],
  },

  {
    id: 'col5a1-connective-tissue',
    gene: 'COL5A1',
    genotypePattern: 'TT (connective tissue sensitivity)',
    rsids: ['rs12722'],
    category: 'priority',
    matches: (cards) => hasGenotype(cards, 'rs12722', 'TT', 'AA'),
    recommendations: [
      {
        name: 'Hydrolyzed Collagen',
        dose: '15–20 g, 30–60 minutes before loading / training sessions',
        mechanism: 'COL5A1 TT is associated with altered type-V collagen structure, potentially affecting tendon/ligament resilience.',
        researchBasis: 'Collagen-timing studies (Shaw et al. 2017) show pairing hydrolyzed collagen with vitamin C before mechanical loading increases collagen synthesis markers.',
      },
      {
        name: 'Vitamin C',
        dose: '50 mg, taken alongside the collagen dose',
        mechanism: 'Required cofactor for collagen cross-linking (prolyl/lysyl hydroxylase enzymes).',
        researchBasis: 'Same collagen-synthesis timing research — vitamin C co-administration is necessary for the collagen-synthesis effect.',
      },
    ],
    disclaimerNote: 'If you have a history of tendon or ligament injury, discuss training load progression with a qualified sports medicine practitioner.',
  },

  {
    id: 'ppargc1a-glygly',
    gene: 'PPARGC1A',
    genotypePattern: 'Gly/Gly (blunted mitochondrial biogenesis)',
    rsids: ['rs8192678'],
    category: 'priority',
    matches: (cards) => hasGenotype(cards, 'rs8192678', 'CC', 'GG'),
    recommendations: [
      {
        name: 'CoQ10 (ubiquinone / ubiquinol)',
        dose: '100–200 mg/day',
        mechanism: 'PPARGC1A (PGC-1α) is a master regulator of mitochondrial biogenesis; the Gly/Gly variant is studied in relation to blunted training-induced mitochondrial adaptation.',
        researchBasis: 'CoQ10 research broadly supports mitochondrial electron transport chain function — a relevant context for individuals interested in mitochondrial support.',
      },
      {
        name: 'PQQ (pyrroloquinoline quinone)',
        dose: '10–20 mg/day',
        mechanism: 'Studied in connection with mitochondrial biogenesis pathways that overlap with PGC-1α signalling.',
        researchBasis: 'PQQ research remains early but is consistently linked to mitochondrial density and metabolic markers in preclinical and small human studies.',
      },
    ],
  },

  {
    id: 'sirt1-tt',
    gene: 'SIRT1',
    genotypePattern: 'TT (longevity-pathway variant)',
    rsids: ['rs7069102'],
    category: 'priority',
    matches: (cards) => hasGenotype(cards, 'rs7069102', 'TT', 'AA'),
    recommendations: [
      {
        name: 'NMN or NR (NAD+ precursors)',
        dose: 'NMN: 250–500 mg/day  |  NR: 300 mg/day',
        mechanism: 'SIRT1 activity is NAD+-dependent; maintaining NAD+ pools is studied as a way to support sirtuin activation.',
        researchBasis: 'NAD+ precursor research (Sinclair et al., others) links NMN/NR supplementation to raised NAD+ levels; SIRT1 activation in humans is still an emerging area.',
      },
      {
        name: 'Resveratrol (with fat)',
        dose: '100–500 mg/day, taken with a fat-containing meal',
        mechanism: 'Studied as a SIRT1 activator; bioavailability improves substantially when co-administered with dietary fat.',
        researchBasis: 'Small human trials show measurable SIRT1 pathway activity changes with resveratrol combined with fat-containing meals.',
      },
    ],
    disclaimerNote: 'Longevity-pathway research is early-stage — treat NAD+/sirtuin support as experimental, not settled science.',
  },

  {
    id: 'vdr-low-response',
    gene: 'VDR',
    genotypePattern: 'FokI TT or BsmI GG (lower receptor response)',
    rsids: ['rs2228570', 'rs1544410'],
    category: 'priority',
    matches: (cards) => hasGenotype(cards, 'rs2228570', 'TT', 'AA') || hasGenotype(cards, 'rs1544410', 'GG', 'CC'),
    recommendations: [
      {
        name: 'Vitamin D3 (cholecalciferol)',
        dose: '2000–4000 IU/day (target 25(OH)D in the 40–60 ng/mL range with lab confirmation)',
        mechanism: 'VDR low-response variants are associated with reduced downstream signalling per unit of circulating vitamin D — a higher circulating level is often needed to achieve equivalent receptor engagement.',
        researchBasis: 'VDR polymorphism studies show genotype-specific relationships between circulating 25(OH)D and downstream effects on bone, immune, and metabolic markers.',
      },
      {
        name: 'Vitamin K2 (MK-7)',
        dose: '90–200 mcg/day, taken with the vitamin D3',
        mechanism: 'K2 directs calcium mobilized by vitamin D toward bone rather than soft tissue — relevant when D3 is dosed at the higher end of the research range.',
        researchBasis: 'Combined D3+K2 research supports bone density and vascular calcification endpoints in aging populations.',
      },
    ],
    disclaimerNote: 'Dose vitamin D against a 25(OH)D blood test rather than blindly — over-supplementation is possible.',
  },

  {
    id: 'fut2-nonsecretor',
    gene: 'FUT2',
    genotypePattern: 'Non-secretor (rs601338 AA / rs602662 AA)',
    rsids: ['rs601338', 'rs602662'],
    category: 'priority',
    matches: (cards) => hasGenotype(cards, 'rs601338', 'AA', 'TT') || hasGenotype(cards, 'rs602662', 'AA', 'TT'),
    recommendations: [
      {
        name: 'Methylcobalamin (B12)',
        dose: '500–1000 mcg/day (sublingual preferred)',
        mechanism: 'FUT2 non-secretor status is associated with lower B12 absorption in research populations due to altered gut mucus antigen expression.',
        researchBasis: 'Non-secretor cohorts show lower average B12 and different gut microbiota composition than secretors in multiple population studies.',
      },
      {
        name: 'Bifidobacterium-focused probiotic',
        dose: 'Strain-labeled Bifidobacterium longum / infantis, 5–20 billion CFU/day',
        mechanism: 'Non-secretors show reduced natural Bifidobacterium colonization — targeted supplementation is studied as compensation.',
        researchBasis: 'FUT2 microbiome studies show consistently lower Bifidobacterium levels in non-secretors.',
      },
    ],
  },

  // ============================================================
  // LIFESTYLE PROTOCOLS
  // ============================================================
  {
    id: 'mtnr1b-gg',
    gene: 'MTNR1B',
    genotypePattern: 'GG (late-eating sensitivity)',
    rsids: ['rs10830963'],
    category: 'lifestyle',
    matches: (cards) => hasGenotype(cards, 'rs10830963', 'GG', 'CC'),
    recommendations: [
      {
        name: 'Meal / supplement cutoff by 6:30 PM',
        dose: 'Behavioral',
        mechanism: 'MTNR1B GG is associated with impaired late-evening insulin secretion when eating close to natural melatonin onset.',
        researchBasis: 'MTNR1B chronotype–nutrition studies (Lane et al., Nature Genetics) link this variant to impaired glucose response specifically for late eating.',
      },
      {
        name: 'Magnesium Glycinate — timing matters',
        dose: '200–400 mg, taken earlier in the evening (not right before bed)',
        mechanism: 'Magnesium timing is relevant because this genotype is sensitive to late-evening metabolic and insulin dynamics.',
        researchBasis: 'General magnesium–sleep–metabolism research combined with MTNR1B chronobiology findings.',
      },
    ],
  },

  {
    id: 'cyp1a2-slow',
    gene: 'CYP1A2',
    genotypePattern: 'AC or CC (slow caffeine metabolizer)',
    rsids: ['rs762551'],
    category: 'lifestyle',
    matches: (cards) => hasGenotype(cards, 'rs762551', 'AC', 'CC'),
    recommendations: [
      {
        name: 'Cap caffeine at ~200 mg/day and stop by early afternoon',
        dose: 'Behavioral — ideally caffeine cutoff by 12:00–2:00 PM',
        mechanism: 'Slow CYP1A2 metabolizers clear caffeine at ~40% of the rate of fast metabolizers, leaving active caffeine circulating well into the evening.',
        researchBasis: 'CYP1A2 variant research links slow metabolizer status to increased cardiovascular risk with high caffeine intake and to greater sleep disturbance from afternoon caffeine.',
        note: 'If afternoon energy is an issue, consider a walk, cold water, or L-theanine (100–200 mg) instead of more caffeine.',
      },
    ],
  },

  // ============================================================
  // AWARENESS FLAGS — provider discussion points, not self-actions
  // ============================================================
  {
    id: 'comt-valval',
    gene: 'COMT',
    genotypePattern: 'Val/Val (fast catecholamine clearance)',
    rsids: ['rs4680'],
    category: 'awareness',
    matches: (cards) => hasHaplotype(cards, ['rs4680'], 'val_val') || hasGenotype(cards, 'rs4680', 'GG', 'CC'),
    recommendations: [
      {
        name: 'Be cautious with high-dose tyrosine or phenylalanine supplements',
        dose: 'Discussion point',
        mechanism: 'COMT Val/Val is associated with faster dopamine and catecholamine breakdown; loading precursors on top of an already fast-clearing system is a less-studied combination and may not produce the intended effect.',
        researchBasis: 'COMT activity research on dopamine clearance rates by genotype.',
        note: 'This is a discussion point with a qualified provider — not a recommendation to add or avoid any supplement without professional context.',
      },
    ],
  },

  {
    id: 'slco1b1-c-carrier',
    gene: 'SLCO1B1',
    genotypePattern: 'C allele carrier (rs4149056 CT or CC)',
    rsids: ['rs4149056'],
    category: 'awareness',
    matches: (cards) => hasGenotype(cards, 'rs4149056', 'CT', 'CC', 'TC'),
    recommendations: [
      {
        name: 'Statin therapy — bring this variant up with your prescribing physician or pharmacist',
        dose: 'Discussion point only — no self-directed action',
        mechanism: 'SLCO1B1 C-allele carriers show reduced transport of statins (particularly simvastatin) into the liver, which may raise circulating levels and the risk of statin-associated muscle symptoms.',
        researchBasis: 'SEARCH trial and follow-up studies established SLCO1B1 rs4149056 as a well-replicated pharmacogenomic marker for statin myopathy risk; CPIC has published dosing guidance for prescribers.',
        note: 'This finding is only relevant if you are prescribed a statin, and it is a discussion point for your physician / pharmacist — never a reason to start, stop, or change any prescribed medication on your own.',
      },
    ],
    disclaimerNote: 'This is a prescriber-facing pharmacogenomic finding — share it with your care team before any statin decision is made.',
  },

  {
    id: 'apoe-e4',
    gene: 'APOE',
    genotypePattern: 'ε3/ε4 or ε4/ε4',
    rsids: ['rs429358', 'rs7412'],
    category: 'awareness',
    matches: (cards) => hasHaplotype(cards, ['rs429358', 'rs7412'], 'e3/e4', 'e4/e4', 'e2/e4'),
    recommendations: [
      {
        name: 'Discuss lipid, cardiovascular, and cognitive-health monitoring with your provider',
        dose: 'Discussion point — no self-directed medication or protocol changes',
        mechanism: 'APOE ε4 carriage is associated in research with altered lipid handling and higher lifetime cardiovascular and Alzheimer\'s-related risk (population-level averages, not individual predictions).',
        researchBasis: 'APOE is one of the most extensively studied variants in human genetics; ε4 associations with lipids, cardiovascular disease, and neurodegeneration are widely replicated across cohorts.',
        note: 'Lifestyle factors (physical activity, sleep, dietary pattern, resistance training, cognitive engagement) are the dominant modifiable levers in the research literature — this finding is about awareness and provider conversation, not alarm.',
      },
    ],
    disclaimerNote: 'ε4 status is a probabilistic research signal, not a diagnosis. Discuss its implications with a qualified clinician before drawing individual conclusions.',
  },
]

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

/**
 * Collect every classified variant card from a genome report into one flat
 * array so the rule matchers can look up rsIDs uniformly regardless of
 * which tab / section they originally came from.
 */
export function flattenReportCards(report) {
  if (!report) return []
  const out = []
  const push = (c) => { if (c && c.rsid) out.push(c) }
  ;(report.overview?.strengths || []).forEach(push)
  ;(report.overview?.areasToExplore || []).forEach(push)
  for (const pillar of report.fullReport || []) {
    for (const v of pillar.variants || []) push(v)
  }
  // De-duplicate by rsid keeping the first occurrence (overview cards tend
  // to be richer than pillar-only cards).
  const seen = new Set()
  return out.filter((c) => {
    const key = c.rsid + ':' + (c.genotype || '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Filter SUPPLEMENT_PROTOCOL_MAP down to the entries whose `matches()`
 * predicate returns true for the given card set. Returns entries grouped
 * by category, preserving the original spec order within each group.
 */
export function matchProtocolToUserVariants(reportOrCards) {
  const cards = Array.isArray(reportOrCards)
    ? reportOrCards
    : flattenReportCards(reportOrCards)
  const groups = { priority: [], lifestyle: [], awareness: [] }
  for (const entry of SUPPLEMENT_PROTOCOL_MAP) {
    try {
      if (entry.matches(cards)) groups[entry.category].push(entry)
    } catch (err) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.warn(`[supplementProtocol] matcher threw for ${entry.id}:`, err)
      }
    }
  }
  return groups
}

// Human-readable copy for the shared full disclaimer.
export const PROTOCOL_DISCLAIMER =
  'These suggestions are based on published research associations and are for educational insight only. Consult a qualified healthcare provider before starting any supplement protocol.'

export const CATEGORY_META = {
  priority:  { label: 'Priority Stack',        subtitle: 'Variant-driven supplements that map to specific genome findings.' },
  lifestyle: { label: 'Lifestyle Protocols',   subtitle: 'Timing, behavior, and dietary patterns that match your genome context.' },
  awareness: { label: 'Awareness Flags',       subtitle: 'Findings worth raising with your physician or pharmacist — not self-directed actions.' },
}
