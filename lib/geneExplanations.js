// /app/lib/geneExplanations.js
// Curated plain-English "what this gene is responsible for" one-liners.
// Used to explain each variant card in language a non-technical user can
// understand at a glance. Additive — falls back to null when a gene is
// not in the map so the calling UI can hide the line gracefully.
//
// Style rules for descriptions:
//   • Start with a verb ("Helps ...", "Controls ...", "Breaks down ...").
//   • One sentence, ≤ 22 words, no jargon.
//   • Never use "variant", "SNP", "polymorphism" — describe the JOB
//     of the gene, not the science.
//   • Keep it functional — what does it DO in the body?

const GENE_EXPLANATIONS = {
  // Folate / methylation cycle
  MTHFR:   'Turns folate (a B-vitamin) into its active form so your body can build DNA, dopamine, and healthy blood vessels.',
  MTR:     'Uses vitamin B12 to recycle homocysteine into methionine — a key step in DNA repair and heart health.',
  MTRR:    'Reactivates the MTR enzyme so your body can keep using B12 efficiently.',
  SHMT1:   'Helps move one-carbon units between folate pathways — important for making new cells and healthy red blood cells.',
  BHMT:    'Backs up the folate cycle by recycling homocysteine using choline (from eggs and liver).',
  CBS:     'Converts homocysteine into cysteine — critical for building glutathione, your body\'s master antioxidant.',
  COMT:    'Clears dopamine, adrenaline, and estrogens from the brain and liver — affects focus, mood, and stress response.',
  MAOA:    'Breaks down serotonin, dopamine, and adrenaline — influences mood, aggression, and stress tolerance.',
  MAOB:    'Breaks down dopamine specifically — affects reward, motivation, and Parkinson-related biology.',
  BDNF:    'Builds and protects brain cells — critical for learning, memory, and mood stability.',
  DRD2:    'Codes for dopamine receptors — influences motivation, reward learning, and impulse control.',
  DRD4:    'Another dopamine receptor — linked to novelty-seeking and attention.',
  ANK3:    'Anchors channels in nerve cells — helps steady electrical signaling in the brain.',
  CACNA1C: 'Codes for a calcium channel used by brain cells to fire — affects mood regulation.',
  SLC6A4:  'Recycles serotonin back into brain cells — the target of most SSRI antidepressants.',
  TPH2:    'Makes serotonin in the brain — affects mood, sleep, and appetite.',

  // Sports performance / muscle
  ACTN3:   'Builds the fast-twitch muscle fibres that power sprinting and jumping.',
  PPARA:   'Switches your body from burning sugar to burning fat — important for endurance and metabolic flexibility.',
  PPARG:   'Regulates fat storage and insulin sensitivity — influences how you gain and lose weight.',
  ACE:     'Controls blood pressure and blood-vessel tone — affects endurance capacity and recovery.',
  BDKRB2:  'Helps blood vessels dilate during exercise — linked to muscle endurance.',
  MYH7:    'Builds slow-twitch muscle proteins — the engines behind endurance activity.',
  MSTN:    'Puts a natural brake on muscle growth — low-signal variants can mean more lean mass.',
  IL6:     'Signals inflammation during and after exercise — affects recovery time.',
  IGF1:    'Fuels muscle repair and growth after exercise.',
  COL5A1:  'Builds the collagen in your tendons and ligaments — affects flexibility and injury risk.',
  MMP1:    'Remodels connective tissue as it heals — influences how tendons recover from strain.',

  // Cardiovascular / longevity
  APOE:    'Ferries cholesterol around the body and brain — a central player in heart health and long-term brain health.',
  APOA5:   'Helps clear triglycerides from your blood after meals.',
  LDLR:    'Pulls LDL ("bad") cholesterol out of circulation — the receptor statins upregulate.',
  PCSK9:   'Breaks down LDL receptors — variants that reduce PCSK9 lower cholesterol lifelong.',
  LPA:     'Makes Lp(a), an inherited cardiovascular risk marker independent of LDL cholesterol.',
  NOS3:    'Produces nitric oxide, which relaxes blood vessels and improves circulation.',
  MTHFD1L: 'Supports one-carbon metabolism — indirectly influences homocysteine and cardiovascular risk.',
  F2:      'Codes for prothrombin — a key clotting factor. Certain variants raise clotting risk.',
  F5:      'Codes for Factor V — the "Leiden" variant raises clotting risk.',
  ADIPOQ:  'Makes adiponectin, a fat-cell hormone that improves insulin sensitivity.',

  // Nutrition / metabolism
  FTO:     'Regulates appetite signalling and fat mass — the most studied "obesity gene" locus.',
  MC4R:    'Central hunger-vs-fullness switch in the brain — a major driver of appetite.',
  TCF7L2:  'Regulates insulin secretion — the strongest common genetic influence on type-2 diabetes risk.',
  SLC30A8: 'Moves zinc into insulin-producing cells — affects insulin secretion.',
  BCMO1:   'Converts plant beta-carotene into active vitamin A — variants can mean animal sources of A matter more.',
  FADS1:   'Turns short-chain plant omega-3 (ALA) into the long-chain versions (EPA, DHA).',
  FADS2:   'Same as FADS1 — sits next to it and helps make long-chain omega-3s.',
  LCT:     'Keeps the lactase enzyme active in adulthood so you can digest dairy.',
  CYP1A2:  'Breaks down caffeine in the liver — determines whether you\'re a fast or slow metabolizer.',
  ADH1B:   'Turns alcohol into acetaldehyde in the liver — the first step of alcohol clearance.',
  ALDH2:   'Clears acetaldehyde (the toxic step of alcohol metabolism).',
  MTNR1B:  'The melatonin receptor in insulin cells — links sleep timing to blood sugar control.',
  VDR:     'The vitamin D receptor — controls how effectively your cells use vitamin D.',
  GC:      'Transports vitamin D through the blood — influences your circulating vitamin-D levels.',
  HFE:     'Regulates iron absorption in the gut — variants can cause iron overload (hemochromatosis).',
  NOD2:    'Sees bacterial signals in the gut and helps regulate the immune response.',
  FUT2:    'Controls whether ABO blood-group sugars appear in your gut mucus — affects the microbiome.',

  // Pharmacogenomics
  CYP2D6:  'Breaks down ~25% of common prescription drugs including many antidepressants and pain medications.',
  CYP2C19: 'Breaks down clopidogrel, PPIs, and several antidepressants — variants change dosing needs.',
  CYP2C9:  'Breaks down warfarin, NSAIDs, and some diabetes drugs.',
  CYP3A4:  'The main drug-metabolizing enzyme in the liver — clears roughly half of all prescription drugs.',
  CYP3A5:  'Partners with CYP3A4 and matters especially for tacrolimus dosing.',
  VKORC1:  'The target of warfarin — variants change how much warfarin you need.',
  TPMT:    'Breaks down thiopurine drugs (azathioprine, 6-MP) — variants raise toxicity risk.',
  DPYD:    'Breaks down 5-fluorouracil (chemo) — variants can cause severe toxicity.',
  UGT1A1:  'Clears bilirubin and irinotecan — links Gilbert\'s syndrome to chemo dosing.',
  OPRM1:   'The mu-opioid receptor — affects how you respond to pain medications and endogenous opioids.',
  HTR2A:   'A serotonin receptor targeted by many antidepressants and antipsychotics.',
  SCN9A:   'Codes for a sodium channel that transmits pain signals in nerves.',
  EPHX1:   'Detoxifies environmental chemicals including some carcinogens from smoke.',
  TNF:     'Signals inflammation across the immune system — affects arthritis and infection response.',

  // Hormones / endocrine
  ESR1:    'The main estrogen receptor — affects bone, breast, brain, and cardiovascular biology.',
  ESR2:    'Another estrogen receptor — matters for bone and ovarian biology.',
  AR:      'The androgen receptor — governs how your cells respond to testosterone.',
  CYP17A1: 'Makes sex hormones (androgens and estrogens) from cholesterol.',
  CYP19A1: 'Converts testosterone into estrogen (aromatase) — the target of aromatase inhibitors.',
  SHBG:    'Makes sex-hormone binding globulin — controls how much of your sex hormones are "free".',
  LEP:     'Codes for leptin, the satiety hormone made by fat cells.',
  LEPR:    'The leptin receptor — determines how your brain responds to leptin signals.',

  // Sleep / circadian
  PER3:    'A core circadian-clock gene — influences whether you\'re a morning lark or night owl.',
  CLOCK:   'Master timekeeper of the circadian rhythm — coordinates 24-hour body cycles.',
  BMAL1:   'Partners with CLOCK to drive the daily rhythm of gene expression.',
  ADORA2A: 'The adenosine A2A receptor — mediates caffeine\'s wake-up effect.',

  // Environmental sensitivity / detox
  GSTM1:   'A glutathione-S-transferase that helps clear environmental toxins.',
  GSTT1:   'A glutathione-S-transferase focused on smaller reactive molecules.',
  GSTP1:   'A third GST enzyme — a major liver detox pathway.',
  NAT2:    'Acetylates drugs and dietary carcinogens — fast/slow acetylator phenotype.',
  SOD2:    'Codes for a mitochondrial antioxidant enzyme — protects cells from oxidative damage.',
  CAT:     'Codes for catalase, which breaks down hydrogen peroxide (a cellular waste product).',
  NRF2:    'Master switch for antioxidant defence — turns on your body\'s detox response.',
}

// Extra rsID → gene overrides for cases where the card only has an rsID
// (no gene column). We map common IDs to their gene so the explanation
// lookup still works.
const RSID_TO_GENE = {
  rs1065852:  'CYP2D6',
  rs4244285:  'CYP2C19',
  rs4680:     'COMT',
  rs10994359: 'ANK3',
  rs6265:     'BDNF',
  rs1800497:  'DRD2',
  rs1815739:  'ACTN3',
  rs4253778:  'PPARA',
  rs4654748:  'SCN9A',
  rs1805087:  'MTR',
  rs1801394:  'MTRR',
  rs1532268:  'SHMT1',
  rs1801133:  'MTHFR',
  rs1801131:  'MTHFR',
  rs429358:   'APOE',
  rs7412:     'APOE',
  rs9939609:  'FTO',
  rs7903146:  'TCF7L2',
  rs762551:   'CYP1A2',
  rs4988235:  'LCT',
  rs671:      'ALDH2',
  rs174537:   'FADS1',
  rs10830963: 'MTNR1B',
  rs4149056:  'SLCO1B1',
  rs1799853:  'CYP2C9',
  rs1057910:  'CYP2C9',
  rs9923231:  'VKORC1',
  rs1799971:  'OPRM1',
  rs1042713:  'ADRB2',
  rs1544410:  'VDR',
  rs2228570:  'VDR',
  rs4646903:  'CYP1A1',
  rs662:      'PON1',
  rs854560:   'PON1',
}

/**
 * Return a plain-English "what this gene does" one-liner, or null if we
 * don't have a curated explanation. Never throws.
 */
export function explainGene(gene, rsid) {
  const geneUp = (gene || '').toUpperCase().split(/[\s(/·+,]/)[0]
  if (geneUp && GENE_EXPLANATIONS[geneUp]) return GENE_EXPLANATIONS[geneUp]

  const mapped = RSID_TO_GENE[String(rsid || '').toLowerCase()]
  if (mapped && GENE_EXPLANATIONS[mapped]) return GENE_EXPLANATIONS[mapped]

  return null
}

/**
 * Bulk helper used by tests / debug pages.
 */
export function allExplainedGenes() {
  return Object.keys(GENE_EXPLANATIONS).sort()
}
