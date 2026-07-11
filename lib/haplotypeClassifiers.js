// =============================================================================
// SelfScience — Haplotype Classifier Functions
// /lib/haplotypeClassifiers.ts
//
// These functions handle multi-SNP variants where a single rsID is insufficient
// to determine classification. Each function takes the relevant genotype calls
// and returns a standardized HaplotypeResult.
//
// IMPORTANT: All genotypes should be normalized to uppercase before passing.
// Strand orientation is assumed to be the forward strand as reported by 23andMe.
// =============================================================================
// =============================================================================
// UTILITY
// =============================================================================
/** Normalize a genotype string — uppercase, strip spaces/dashes */
export function normalizeGT(gt) {
    if (!gt)
        return "";
    return gt.toUpperCase().replace(/[\s\-_]/g, "");
}
/** Sort a two-character genotype alphabetically for consistent lookup
 *  e.g. "GA" → "AG", "TC" → "CT" */
export function sortGT(gt) {
    if (gt.length !== 2)
        return gt;
    return [gt[0], gt[1]].sort().join("");
}
// =============================================================================
// 1. APOE — Cardiovascular & Brain Health
// Requires: rs429358 + rs7412
// Most important haplotype on the platform — handle with extra care
// =============================================================================
export function classifyAPOE(rs429358_raw, // C/T polymorphism — C = e4 allele
rs7412_raw // C/T polymorphism — T = e2 allele
) {
    const r1 = normalizeGT(rs429358_raw);
    const r2 = normalizeGT(rs7412_raw);
    const base = {
        pillar: "Longevity",
        variants_used: "rs429358 + rs7412"
    };
    // e4/e4 — two copies of APOE4
    if ((r1 === "CC") && (r2 === "CC"))
        return {
            ...base,
            classification: "awareness",
            haplotype: "e4/e4",
            label: "APOE cardiovascular variant",
            detail: "Two copies of the APOE4 isoform — associated with elevated LDL clearance differences and higher cardiovascular research flags in population studies."
        };
    // e3/e4 — one copy of APOE4
    if ((r1 === "CT") && (r2 === "CC"))
        return {
            ...base,
            classification: "awareness",
            haplotype: "e3/e4",
            label: "APOE cardiovascular variant",
            detail: "One copy of the APOE4 isoform — associated with moderately elevated LDL and cardiovascular markers in population research."
        };
    // e3/e3 — most common, average risk
    if ((r1 === "TT") && (r2 === "CC"))
        return {
            ...base,
            classification: "neutral",
            haplotype: "e3/e3",
            label: "APOE cardiovascular variant",
            detail: "Most common APOE isoform — standard cardiovascular and lipid metabolism associations in population research."
        };
    // e2/e3 — mildly protective
    if ((r1 === "TT") && (r2 === "CT"))
        return {
            ...base,
            classification: "positive",
            haplotype: "e2/e3",
            label: "APOE cardiovascular variant",
            detail: "One copy of the APOE2 isoform — associated with lower LDL and favorable cardiovascular markers in population studies."
        };
    // e2/e2 — rare, very protective for cardiovascular but elevated TG risk
    if ((r1 === "TT") && (r2 === "TT"))
        return {
            ...base,
            classification: "positive",
            haplotype: "e2/e2",
            label: "APOE cardiovascular variant",
            detail: "Two copies of the APOE2 isoform — associated with lowest LDL in population research; some studies note elevated triglyceride tendency."
        };
    // e2/e4 — rare, mixed
    if ((r1 === "CT") && (r2 === "CT"))
        return {
            ...base,
            classification: "neutral",
            haplotype: "e2/e4",
            label: "APOE cardiovascular variant",
            detail: "Rare APOE2/E4 compound — mixed associations in the literature; see the research section for current findings."
        };
    // Unresolved
    return {
        ...base,
        classification: "unknown",
        haplotype: undefined,
        label: "APOE cardiovascular variant",
        detail: "APOE genotype could not be fully resolved from available positions. Both rs429358 and rs7412 are required."
    };
}
export function classifyMTHFR(rs1801133_raw, // C677T — TT = homozygous variant
rs1801131_raw // A1298C — CC = homozygous variant
) {
    const c677t = sortGT(normalizeGT(rs1801133_raw));
    const a1298c = sortGT(normalizeGT(rs1801131_raw));
    const base = {
        pillar: "Genomics",
        variants_used: "rs1801133 + rs1801131"
    };
    let status = "unknown";
    let classification = "neutral";
    let label = "Methylation pathway";
    let detail = "";
    if (c677t === "CC" && a1298c === "AA") {
        status = "wild_type";
        classification = "positive";
        detail = "Both MTHFR positions at standard function — folate-to-methylfolate conversion at full estimated activity.";
    }
    else if (c677t === "CT" && a1298c === "AA") {
        status = "677_heterozygous";
        classification = "awareness";
        detail = "One C677T variant — MTHFR enzyme activity estimated ~40% reduced. Methylfolate supplementation relevant.";
    }
    else if (c677t === "TT" && a1298c === "AA") {
        status = "677_homozygous";
        classification = "awareness";
        detail = "Homozygous C677T — MTHFR enzyme activity estimated ~70% reduced. Active methylfolate (5-MTHF) is the primary research intervention.";
    }
    else if (c677t === "CC" && a1298c === "AC") {
        status = "1298_heterozygous";
        classification = "awareness";
        detail = "One A1298C variant — mild MTHFR reduction. Folate quality is more relevant than quantity for this pattern.";
    }
    else if (c677t === "CC" && a1298c === "CC") {
        status = "1298_homozygous";
        classification = "awareness";
        detail = "Homozygous A1298C — moderate MTHFR reduction primarily affecting BH4 pathway. Methylfolate and riboflavin are the key research nutrients.";
    }
    else if (c677t === "CT" && a1298c === "AC") {
        status = "compound_heterozygous";
        classification = "awareness";
        detail = "Compound heterozygous MTHFR — one variant at each position. Estimated ~50% enzyme reduction. Active methylfolate (5-MTHF) is the research-supported approach.";
    }
    else if (c677t === "TT" && a1298c === "CC") {
        status = "double_homozygous";
        classification = "awareness";
        detail = "Double homozygous MTHFR — rare pattern with significant methylation pathway impact. Active methylfolate and full B-complex support are the research focus.";
    }
    else {
        status = "unknown";
        classification = "neutral";
        detail = "MTHFR status could not be fully resolved. Both rs1801133 and rs1801131 are required for complete classification.";
    }
    return { ...base, classification, label, detail, mthfr_status: status, haplotype: status };
}
// Known slow allele genotypes at each position
const NAT2_SLOW_ALLELES = {
    rs1799930: ["AG", "GG"], // *6 — G allele = slow
    rs1208: ["AG", "GG"], // *7 — G allele = slow
    rs1801280: ["CT", "TT"], // *5B — T allele = slow
    rs1799929: ["CT", "TT"], // *5C — T allele = slow
    rs1041983: ["CT", "TT"], // *5 — T allele = slow
};
export function classifyNAT2(rs1799930_raw, rs1208_raw, rs1801280_raw, rs1799929_raw, rs1041983_raw) {
    const calls = {
        rs1799930: sortGT(normalizeGT(rs1799930_raw)),
        rs1208: sortGT(normalizeGT(rs1208_raw)),
        rs1801280: sortGT(normalizeGT(rs1801280_raw)),
        rs1799929: sortGT(normalizeGT(rs1799929_raw)),
        rs1041983: sortGT(normalizeGT(rs1041983_raw)),
    };
    let slowCount = 0;
    let missingCount = 0;
    for (const [rsid, gt] of Object.entries(calls)) {
        if (!gt) {
            missingCount++;
            continue;
        }
        if (NAT2_SLOW_ALLELES[rsid]?.includes(gt))
            slowCount++;
    }
    let status = "unknown";
    let classification = "neutral";
    let detail = "";
    if (missingCount >= 3) {
        status = "unknown";
        detail = "Insufficient NAT2 positions available for haplotype classification. At least 3 of 5 positions are required.";
    }
    else if (slowCount === 0) {
        status = "rapid";
        classification = "positive";
        detail = "NAT2 rapid acetylator — dietary amines, heterocyclic amines, and certain medications are processed efficiently.";
    }
    else if (slowCount === 1) {
        status = "intermediate";
        classification = "neutral";
        detail = "NAT2 intermediate acetylator — one slow allele detected. Processing speed for amines and certain drugs is between rapid and slow patterns.";
    }
    else {
        status = "slow";
        classification = "awareness";
        detail = "NAT2 slow acetylator — two or more slow alleles detected. Certain medications and dietary compounds accumulate more slowly. See the pharmacogenomics section for specific implications.";
    }
    return {
        classification,
        label: "Acetylator status",
        detail,
        pillar: "Pharmacogenomics",
        variants_used: "rs1799930, rs1208, rs1801280, rs1799929, rs1041983",
        haplotype: status,
        acetylator_status: status
    };
}
// Loss-of-function alleles at each position
const CYP2D6_LOF = {
    rs1065852: ["AG", "GG"], // *4 — most common poor metabolizer allele
    rs3892097: ["CT", "TT"], // *4 variant
    rs5030655: ["GA", "AA"], // *3
    rs28371706: ["CT", "TT"], // *41 (reduced function)
    rs35742686: ["CT", "TT"], // *3 frameshift
};
export function classifyCYP2D6(rs1065852_raw, rs3892097_raw, rs5030655_raw, rs28371706_raw, rs35742686_raw) {
    const calls = {
        rs1065852: sortGT(normalizeGT(rs1065852_raw)),
        rs3892097: sortGT(normalizeGT(rs3892097_raw)),
        rs5030655: sortGT(normalizeGT(rs5030655_raw)),
        rs28371706: sortGT(normalizeGT(rs28371706_raw)),
        rs35742686: sortGT(normalizeGT(rs35742686_raw)),
    };
    let lofCount = 0;
    let missingCount = 0;
    for (const [rsid, gt] of Object.entries(calls)) {
        if (!gt) {
            missingCount++;
            continue;
        }
        if (CYP2D6_LOF[rsid]?.includes(gt))
            lofCount++;
    }
    let status = "unknown";
    let classification = "neutral";
    let detail = "";
    if (missingCount >= 4) {
        status = "unknown";
        detail = "Insufficient CYP2D6 positions for classification. Full metabolizer status cannot be determined.";
    }
    else if (lofCount === 0) {
        status = "normal";
        classification = "positive";
        detail = "CYP2D6 normal metabolizer — antidepressants, opioids, beta-blockers and many other drugs are processed at standard rates.";
    }
    else if (lofCount === 1) {
        status = "intermediate";
        classification = "awareness";
        detail = "CYP2D6 intermediate metabolizer — one reduced-function allele. Some medications may require dose consideration. See the pharmacogenomics section.";
    }
    else {
        status = "poor";
        classification = "awareness";
        detail = "CYP2D6 poor metabolizer — two or more reduced-function alleles detected. Many common medications (SSRIs, codeine, beta-blockers) may accumulate — discuss with a pharmacist.";
    }
    return {
        classification,
        label: "CYP2D6 drug metabolism",
        detail,
        pillar: "Pharmacogenomics",
        variants_used: "rs1065852, rs3892097, rs5030655, rs28371706, rs35742686",
        haplotype: status,
        cyp2d6_status: status
    };
}
export function classifyCYP2C19(rs4244285_raw, // *2 — loss of function
rs4986893_raw, // *3 — loss of function
rs12248560_raw // *17 — gain of function
) {
    const star2 = sortGT(normalizeGT(rs4244285_raw)); // AG or AA = *2 carrier
    const star3 = sortGT(normalizeGT(rs4986893_raw)); // AG or AA = *3 carrier
    const star17 = sortGT(normalizeGT(rs12248560_raw)); // CT or TT = *17 carrier (rapid)
    const hasStar2 = ["AG", "AA"].includes(star2);
    const hasStar3 = ["AG", "AA"].includes(star3);
    const hasStar17 = ["CT", "TT"].includes(star17);
    const lofAlleles = (hasStar2 ? 1 : 0) + (hasStar3 ? 1 : 0);
    let status = "unknown";
    let classification = "neutral";
    let detail = "";
    if (!star2 && !star3 && !star17) {
        status = "unknown";
        detail = "CYP2C19 status could not be determined from available positions.";
    }
    else if (lofAlleles >= 2) {
        status = "poor";
        classification = "awareness";
        detail = "CYP2C19 poor metabolizer — two loss-of-function alleles detected. Clopidogrel, many SSRIs, and PPIs may not be processed effectively. Discuss with a pharmacist.";
    }
    else if (lofAlleles === 1 && !hasStar17) {
        status = "intermediate";
        classification = "awareness";
        detail = "CYP2C19 intermediate metabolizer — one reduced-function allele. Some medications may need dose adjustment.";
    }
    else if (lofAlleles === 0 && !hasStar17) {
        status = "normal";
        classification = "positive";
        detail = "CYP2C19 normal metabolizer — standard processing of SSRIs, PPIs, and antiplatelet medications.";
    }
    else if (lofAlleles === 0 && hasStar17) {
        status = "ultra_rapid";
        classification = "awareness";
        detail = "CYP2C19 ultra-rapid metabolizer (*17) — some medications may clear too quickly to reach effective levels. See pharmacogenomics section.";
    }
    else if (lofAlleles === 1 && hasStar17) {
        status = "rapid";
        classification = "neutral";
        detail = "CYP2C19 rapid metabolizer — one slow and one fast allele, resulting in near-normal metabolism for most drugs.";
    }
    return {
        classification,
        label: "CYP2C19 drug metabolism",
        detail,
        pillar: "Pharmacogenomics",
        variants_used: "rs4244285, rs4986893, rs12248560",
        haplotype: status,
        cyp2c19_status: status
    };
}
export function classifyFADS(rs174547_raw, // FADS1 — TT = reduced conversion
rs1535_raw, // FADS1 — AA = reduced conversion
rs174537_raw, // FADS1 — major tag SNP
rs3834458_raw // FADS2
) {
    const s1 = sortGT(normalizeGT(rs174547_raw));
    const s2 = sortGT(normalizeGT(rs1535_raw));
    const s3 = sortGT(normalizeGT(rs174537_raw));
    const s4 = sortGT(normalizeGT(rs3834458_raw));
    // Count reduced-function alleles across FADS cluster
    // TT at rs174547, AA at rs1535 are the primary reduced signals
    let reducedSignals = 0;
    if (s1 === "TT")
        reducedSignals += 2;
    else if (s1 === "CT")
        reducedSignals += 1;
    if (s2 === "AA")
        reducedSignals += 2;
    else if (s2 === "AG")
        reducedSignals += 1;
    if (s3 === "GG")
        reducedSignals += 1; // GG at rs174537 = reduced
    if (s4 === "AA")
        reducedSignals += 1; // FADS2 AA = reduced
    let status = "unknown";
    let classification = "neutral";
    let detail = "";
    const available = [s1, s2, s3, s4].filter(Boolean).length;
    if (available < 2) {
        status = "unknown";
        detail = "Insufficient FADS1/2 positions available for omega-3 conversion classification.";
    }
    else if (reducedSignals <= 1) {
        status = "efficient";
        classification = "positive";
        detail = "FADS1/2 variants associated with efficient conversion of ALA from plant sources into EPA and DHA in research studies.";
    }
    else if (reducedSignals <= 3) {
        status = "moderate";
        classification = "neutral";
        detail = "FADS1/2 variants suggest moderate omega-3 conversion efficiency. Both plant and marine sources are relevant in research.";
    }
    else {
        status = "reduced";
        classification = "awareness";
        detail = "FADS1/2 variants associated with reduced conversion of plant-based ALA into EPA/DHA. Marine omega-3 sources or direct EPA/DHA supplementation are more relevant for this profile.";
    }
    return {
        classification,
        label: "Omega-3 conversion efficiency",
        detail,
        pillar: "Nutrition",
        variants_used: "rs174547, rs1535, rs174537, rs3834458",
        haplotype: status,
        fads_status: status
    };
}
export function classifyCOMT(rs4680_raw, // Val158Met — GG=Val/Val, AA=Met/Met
rs4818_raw, // L136L — refines haplotype
rs4633_raw // H62H — refines haplotype
) {
    const primary = sortGT(normalizeGT(rs4680_raw));
    let status = "unknown";
    let classification = "neutral";
    let label = "Dopamine & stress processing";
    let detail = "";
    if (primary === "AA") {
        status = "met_met";
        classification = "positive";
        detail = "COMT Met/Met — slower dopamine clearance, higher baseline dopamine in prefrontal cortex. Associated with strong cognitive performance in low-stress environments in research.";
    }
    else if (primary === "AG") {
        status = "val_met";
        classification = "neutral";
        detail = "COMT Val/Met — intermediate dopamine processing. Research shows balanced stress response and cognitive flexibility across conditions.";
    }
    else if (primary === "GG") {
        status = "val_val";
        classification = "positive";
        detail = "COMT Val/Val (Warrior) — faster dopamine clearance, more stable dopamine under stress. Research associates this pattern with stronger performance under high-pressure conditions.";
    }
    else {
        status = "unknown";
        detail = "COMT status could not be determined from rs4680.";
    }
    return {
        classification,
        label,
        detail,
        pillar: "Brain & Neurochemistry",
        variants_used: "rs4680, rs4818, rs4633",
        haplotype: status,
        comt_status: status
    };
}
export function classifyWarfarin(rs9923231_raw, // VKORC1 — AA = sensitive
rs1799853_raw, // CYP2C9 *2
rs1057910_raw // CYP2C9 *3
) {
    const vkorc1 = sortGT(normalizeGT(rs9923231_raw));
    const cyp2c9_2 = sortGT(normalizeGT(rs1799853_raw));
    const cyp2c9_3 = sortGT(normalizeGT(rs1057910_raw));
    const vkorc1_sensitive = vkorc1 === "AA";
    const vkorc1_intermediate = vkorc1 === "AG";
    const cyp_lof = ["AC", "CT"].includes(cyp2c9_2) || ["AC", "CT"].includes(cyp2c9_3);
    const cyp_double_lof = ["AC", "CT"].includes(cyp2c9_2) && ["AC", "CT"].includes(cyp2c9_3);
    let sensitivity = "unknown";
    let classification = "neutral";
    let detail = "";
    if (!vkorc1 && !cyp2c9_2 && !cyp2c9_3) {
        sensitivity = "unknown";
        detail = "Warfarin sensitivity could not be assessed — positions not available.";
    }
    else if (vkorc1_sensitive && cyp_lof) {
        sensitivity = "highly_sensitive";
        classification = "awareness";
        detail = "VKORC1 sensitive genotype combined with CYP2C9 reduced function — research indicates significantly lower warfarin doses may be appropriate. Discuss with prescribing physician.";
    }
    else if (vkorc1_sensitive || cyp_double_lof) {
        sensitivity = "sensitive";
        classification = "awareness";
        detail = "Warfarin sensitivity variants detected — research suggests lower starting doses may be relevant. Discuss with prescribing physician.";
    }
    else if (vkorc1_intermediate && !cyp_lof) {
        sensitivity = "standard";
        classification = "neutral";
        detail = "Warfarin sensitivity at typical range for this genotype pattern based on population research.";
    }
    else {
        sensitivity = "standard";
        classification = "neutral";
        detail = "No major warfarin sensitivity variants detected at these positions.";
    }
    return {
        classification,
        label: "Anticoagulant sensitivity",
        detail,
        pillar: "Pharmacogenomics",
        variants_used: "rs9923231, rs1799853, rs1057910",
        haplotype: sensitivity,
        warfarin_sensitivity: sensitivity
    };
}
export function classifyACTN3(rs1815739_raw) {
    const gt = sortGT(normalizeGT(rs1815739_raw));
    let status = "unknown";
    let classification = "neutral";
    let detail = "";
    if (gt === "CC") {
        status = "power";
        classification = "positive";
        detail = "ACTN3 RR — alpha-actinin-3 fully expressed in fast-twitch fibers. Research associates this pattern with power and sprint performance advantages.";
    }
    else if (gt === "CT") {
        status = "mixed";
        classification = "neutral";
        detail = "ACTN3 RX — one functional copy of alpha-actinin-3. Research shows balanced athletic profile across endurance and power domains.";
    }
    else if (gt === "TT") {
        status = "endurance";
        classification = "positive";
        detail = "ACTN3 XX — no alpha-actinin-3 in fast-twitch fibers. Research consistently associates this pattern with endurance performance advantages and efficient aerobic metabolism.";
    }
    else {
        status = "unknown";
        detail = "ACTN3 genotype could not be determined.";
    }
    return {
        classification,
        label: "Muscle fiber type tendency",
        detail,
        pillar: "Sports Performance",
        variants_used: "rs1815739",
        haplotype: status,
        actn3_status: status
    };
}
export function classifySLC6A4(rs25531_raw, rs2064070_raw) {
    const s1 = sortGT(normalizeGT(rs25531_raw));
    const s2 = sortGT(normalizeGT(rs2064070_raw));
    // rs25531 A = La allele (high expression), G = Lg allele (functionally like S)
    const hasLowExpr = s1 === "AG" || s1 === "GG" || s2 === "AG" || s2 === "GG";
    const bothLow = (s1 === "GG" || s1 === "AG") && (s2 === "GG" || s2 === "AG");
    let status = "unknown";
    let classification = "neutral";
    let detail = "";
    if (!s1 && !s2) {
        status = "unknown";
        detail = "Serotonin transporter status could not be fully resolved from available positions.";
    }
    else if (!hasLowExpr) {
        status = "high_expression";
        classification = "positive";
        detail = "Serotonin transporter variants associated with higher SLC6A4 expression — standard serotonin reuptake efficiency in research populations.";
    }
    else if (bothLow) {
        status = "low_expression";
        classification = "awareness";
        detail = "Serotonin transporter variants associated with lower SLC6A4 expression — research links this pattern with heightened stress sensitivity and environmental responsiveness.";
    }
    else {
        status = "intermediate";
        classification = "neutral";
        detail = "Serotonin transporter intermediate pattern — mixed expression alleles. Research shows context-dependent stress response.";
    }
    return {
        classification,
        label: "Serotonin transporter expression",
        detail,
        pillar: "Brain & Neurochemistry",
        variants_used: "rs25531, rs2064070",
        haplotype: status,
        serotonin_transporter: status
    };
}
export function runAllHaplotypes(genome) {
    return {
        apoe: classifyAPOE(genome["rs429358"], genome["rs7412"]),
        mthfr: classifyMTHFR(genome["rs1801133"], genome["rs1801131"]),
        nat2: classifyNAT2(genome["rs1799930"], genome["rs1208"], genome["rs1801280"], genome["rs1799929"], genome["rs1041983"]),
        cyp2d6: classifyCYP2D6(genome["rs1065852"], genome["rs3892097"], genome["rs5030655"], genome["rs28371706"], genome["rs35742686"]),
        cyp2c19: classifyCYP2C19(genome["rs4244285"], genome["rs4986893"], genome["rs12248560"]),
        fads: classifyFADS(genome["rs174547"], genome["rs1535"], genome["rs174537"], genome["rs3834458"]),
        comt: classifyCOMT(genome["rs4680"], genome["rs4818"], genome["rs4633"]),
        warfarin: classifyWarfarin(genome["rs9923231"], genome["rs1799853"], genome["rs1057910"]),
        actn3: classifyACTN3(genome["rs1815739"]),
        slc6a4: classifySLC6A4(genome["rs25531"], genome["rs2064070"]),
    };
}
