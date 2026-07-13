// /app/lib/biomarkers/patterns.js
//
// SelfScience biomarker PATTERN DETECTION.
//
// Each pattern examines a small cluster of related markers and returns
// an INTERPRETATION THEME rather than a diagnosis. Themes are phrased
// as tentative observations ("may suggest", "worth reviewing") and
// always frame the pattern as a discussion point rather than a verdict.
//
// A pattern's `detect(evaluated, values)` returns either:
//   • null                              → pattern couldn't be evaluated (insufficient data)
//   • { severity, headline, notes[], observed[] }
//
// severity:
//   • 'ok'       → all markers in target; nothing to flag
//   • 'nudge'    → mild optimization opportunity
//   • 'watch'    → worth reviewing / worth pairing with retest or clinician
//   • 'attend'   → outside clinical normal in ≥1 driver; discuss with clinician
//
// Notes are prose sentences the UI concatenates verbatim. Observed is
// a per-marker snapshot so the UI can show which values drove the theme.

const SEVERITY_META = {
  ok:     { label: 'Healthy pattern',       tone: 'text-emerald-800 bg-emerald-50 ring-emerald-200',  dot: 'bg-emerald-500' },
  nudge:  { label: 'Optimization nudge',    tone: 'text-teal-800    bg-teal-50    ring-teal-200',     dot: 'bg-teal-500' },
  watch:  { label: 'Worth reviewing',       tone: 'text-amber-800   bg-amber-50   ring-amber-200',    dot: 'bg-amber-500' },
  attend: { label: 'Discuss with clinician',tone: 'text-rose-800    bg-rose-50    ring-rose-200',     dot: 'bg-rose-500' },
}
export { SEVERITY_META }

/* ------------------------- helpers ---------------------------- */

/** True when every id has an evaluated value that isn't "insufficient". */
function haveAll(evaluated, ids) {
  return ids.every((id) => evaluated[id] && evaluated[id].status !== 'insufficient')
}

/** True when at least `n` of the ids have entered values. */
function haveAtLeast(evaluated, ids, n) {
  return ids.filter((id) => evaluated[id] && evaluated[id].status !== 'insufficient').length >= n
}

/** Return `{status, value}` snapshot for each requested id (skip missing). */
function snapshot(evaluated, ids) {
  return ids
    .filter((id) => evaluated[id] && evaluated[id].status !== 'insufficient')
    .map((id) => ({ id, status: evaluated[id].status, value: evaluated[id].value }))
}

/** Escalate to the most severe of two severities. */
const ORDER = { ok: 0, nudge: 1, watch: 2, attend: 3 }
function maxSev(a, b) { return ORDER[a] >= ORDER[b] ? a : b }

/** True if any of the ids is clinically abnormal in the evaluation. */
function anyClinicallyAbnormal(evaluated, ids) {
  return ids.some((id) => evaluated[id]?.isClinicallyAbnormal)
}

/* ============================ Patterns ============================ */

export const PATTERNS = [
  /* ------------------------ 1. Metabolic ---------------------- */
  {
    id: 'metabolic',
    label: 'Metabolic pattern',
    coreMarkers: ['hba1c', 'fasting_glucose'],
    optionalMarkers: [],
    description:
      'Long-run glycemic exposure (HbA1c) alongside a point-in-time fasting glucose. Together these give a fuller picture than either alone.',
    detect(evaluated) {
      if (!haveAtLeast(evaluated, ['hba1c', 'fasting_glucose'], 1)) return null

      const a1c   = evaluated.hba1c
      const fpg   = evaluated.fasting_glucose

      let severity = 'ok'
      const notes = []

      // Both entered — richest interpretation
      if (a1c?.status && fpg?.status && a1c.status !== 'insufficient' && fpg.status !== 'insufficient') {
        if (a1c.status === 'outside' && fpg.status === 'outside') {
          severity = 'attend'
          notes.push('Both HbA1c and fasting glucose sit outside clinical normal — a consistent hyperglycemia pattern that is worth reviewing with a clinician.')
        } else if (a1c.status === 'in_target' && fpg.status === 'borderline') {
          severity = 'watch'
          notes.push('HbA1c is in target while a single fasting glucose is borderline. This can reflect a poor draw morning (short sleep, stress, dawn phenomenon) — worth a retest before drawing conclusions.')
        } else if (a1c.status === 'borderline' && fpg.status === 'in_target') {
          severity = 'nudge'
          notes.push('HbA1c is edging upward while fasting glucose looks fine — long-run glycemic load may be creeping up even when single-timepoint sugar is normal. Post-meal walks and refined-carb reduction are the highest-leverage moves.')
        } else if (a1c.status === 'in_target' && fpg.status === 'in_target') {
          notes.push('Both markers sit in-target — a healthy glycemic pattern. Retest annually if stable.')
        } else if (a1c.status === 'outside' || fpg.status === 'outside') {
          severity = 'attend'
          notes.push('One marker sits outside clinical normal. HbA1c reflects ~3 months of exposure so it is the more stable of the two — the outside marker is the one to focus on.')
        } else {
          severity = 'watch'
          notes.push('Both markers show mild elevation. Refined-carb intake, sleep, and post-meal activity are the largest modifiable levers in this range.')
        }
      } else if (a1c?.status && a1c.status !== 'insufficient') {
        if (a1c.status === 'outside') { severity = 'attend'; notes.push('HbA1c is outside clinical normal; a fasting glucose reading would add context. Together they distinguish a bad draw morning from persistent hyperglycemia.') }
        else if (a1c.status === 'borderline') { severity = 'watch'; notes.push('HbA1c is edging upward — pair with a morning fasting glucose to confirm.') }
      } else if (fpg?.status && fpg.status !== 'insufficient') {
        if (fpg.status === 'outside') { severity = 'attend'; notes.push('Fasting glucose is outside clinical normal on a single reading. HbA1c would confirm whether this is chronic or a one-off high reading (short sleep, stress, dawn effect).') }
        else if (fpg.status === 'borderline') { severity = 'watch'; notes.push('Borderline fasting glucose — HbA1c would tell you whether this is a real trend or a bad-draw-morning artifact.') }
      }

      if (severity === 'attend' && anyClinicallyAbnormal(evaluated, ['hs_crp'])) {
        notes.push('hs-CRP is also elevated — inflammation and glycemic dysregulation often travel together.')
      }

      return {
        severity,
        headline: severity === 'ok'
          ? 'Healthy glycemic pattern'
          : severity === 'nudge' ? 'Long-run glucose creeping up'
          : severity === 'watch' ? 'Worth pairing HbA1c + fasting glucose next time'
          : 'Consistent glycemic elevation — review with a clinician',
        notes,
        observed: snapshot(evaluated, ['hba1c', 'fasting_glucose', 'hs_crp']),
      }
    },
  },

  /* ------------------------ 2. Androgen ----------------------- */
  {
    id: 'androgen',
    label: 'Androgen pattern',
    coreMarkers: ['testosterone_total', 'shbg'],
    optionalMarkers: ['testosterone_free'],
    description:
      'Total testosterone is only meaningful alongside SHBG (which binds most of it) and free testosterone (the bioactive fraction).',
    detect(evaluated) {
      if (!haveAtLeast(evaluated, ['testosterone_total', 'testosterone_free', 'shbg'], 2)) return null

      const tot   = evaluated.testosterone_total
      const free  = evaluated.testosterone_free
      const shbg  = evaluated.shbg

      let severity = 'ok'
      const notes = []

      // Any driver outside clinical normal escalates the whole pattern.
      const anyOutside = [tot, free, shbg].some((m) => m && m.status === 'outside')
      const anyBorderline = [tot, free, shbg].some((m) => m && m.status === 'borderline')

      // Total T low
      if (tot?.status === 'outside') {
        severity = 'attend'
        if (shbg?.status === 'outside' && shbg.value != null && shbg.value > (shbg.value)) {
          // (guarded: value comparison handled below)
        }
        if (shbg?.status === 'in_target' || shbg?.status === 'borderline') {
          notes.push('Total testosterone is low. Rule out sleep apnea, medications, and confirm with a repeat early-morning draw (before 10am) before drawing conclusions or considering TRT.')
        }
        if (shbg?.value != null && shbg.value > 60 && free?.status !== 'in_target') {
          notes.push('SHBG is high, which lowers the bioactive fraction \u2014 low total T here is partially SHBG-driven, and the free-T assay is a better read of what tissues actually see.')
        }
        if (shbg?.value != null && shbg.value < 20 && tot.status === 'outside') {
          notes.push('SHBG is low alongside low total T \u2014 low SHBG is associated with insulin resistance and metabolic syndrome, both of which can suppress T. Metabolic optimization tends to raise both.')
        }
      } else if (tot?.status === 'borderline') {
        severity = maxSev(severity, 'watch')
        notes.push('Total testosterone sits in the borderline zone. Confirm with an early-morning draw (before 10am) and interpret alongside free T + SHBG before drawing conclusions.')
      }

      // Free T low
      if (free?.status === 'outside' && tot?.status !== 'outside') {
        severity = maxSev(severity, 'watch')
        notes.push('Total testosterone looks fine but free (bioactive) T is low \u2014 suggests SHBG or albumin is binding more of the total than usual.')
      }

      // SHBG issues in the presence of other findings
      if (shbg?.status === 'outside' && !anyOutside) {
        severity = maxSev(severity, 'nudge')
        if (shbg.value != null && shbg.value < 20) {
          notes.push('SHBG is low. Low SHBG tracks with insulin resistance in cohort data; body composition + insulin sensitivity are the highest-leverage moves.')
        } else if (shbg.value != null && shbg.value > 60) {
          notes.push('SHBG is high. Very high SHBG reduces bioavailable T; check thyroid status and hepatic health context.')
        }
      }

      // High end
      if (tot?.status === 'outside' && tot.value != null && tot.value > 900) {
        severity = 'attend'
        notes.push('Total testosterone is above the standard clinical range. Discuss context (exogenous T, supplements, adenoma screening) with a clinician.')
      }

      // Healthy fallback
      if (severity === 'ok' && !anyOutside && !anyBorderline) {
        notes.push('Total, free, and SHBG sit within their target windows \u2014 a healthy androgen pattern for this age range.')
      } else if (severity === 'ok' && anyBorderline) {
        severity = 'nudge'
        notes.push('One or more markers sit in the borderline zone \u2014 not concerning on its own, but worth pairing with an early-morning repeat draw.')
      }

      return {
        severity,
        headline: severity === 'ok'
          ? 'Healthy androgen pattern'
          : severity === 'nudge' ? 'Androgen balance nudge'
          : severity === 'watch' ? 'Worth reviewing androgen picture'
          : 'Androgen pattern worth clinician review',
        notes,
        observed: snapshot(evaluated, ['testosterone_total', 'testosterone_free', 'shbg']),
      }
    },
  },

  /* -------------------------- 3. Thyroid ---------------------- */
  {
    id: 'thyroid',
    label: 'Thyroid pattern',
    coreMarkers: ['tsh'],
    optionalMarkers: ['free_t3', 'free_t4'],
    description:
      'TSH alone can miss subclinical or peripheral-conversion patterns. Free T3 and Free T4 fill in the picture.',
    detect(evaluated) {
      if (!haveAtLeast(evaluated, ['tsh', 'free_t3', 'free_t4'], 1)) return null

      const tsh = evaluated.tsh
      const ft3 = evaluated.free_t3
      const ft4 = evaluated.free_t4

      let severity = 'ok'
      const notes = []

      if (tsh?.status && tsh.status !== 'insufficient') {
        if (tsh.status === 'outside' && ft4?.status === 'outside') {
          severity = 'attend'
          notes.push('TSH and Free T4 both sit outside clinical normal — a classic primary hypothyroid (elevated TSH / low FT4) or hyperthyroid (low TSH / high FT4) pattern. Discuss with a clinician; a single reading warrants a 6–8 week repeat before treatment decisions.')
        } else if (tsh.status === 'outside') {
          severity = 'attend'
          notes.push('TSH is outside clinical normal. A retest in 6–8 weeks alongside Free T3, Free T4, and thyroid antibodies (TPO / Tg) gives the fullest picture before any treatment decision.')
        } else if (tsh.status === 'borderline') {
          severity = 'watch'
          notes.push('TSH is in the borderline range. Interpretation depends heavily on time of draw and recent illness — repeat in 6–8 weeks alongside FT3/FT4 before drawing conclusions.')
        }
      }

      if (tsh?.status === 'in_target' && ft3?.status === 'outside') {
        severity = maxSev(severity, 'watch')
        notes.push('TSH looks fine but Free T3 is low — possible peripheral T4→T3 conversion issue (sometimes seen in overtraining, very-low-calorie dieting, or chronic stress).')
      }

      if (severity === 'ok') {
        notes.push('TSH, Free T3, and Free T4 all sit within their target windows — a healthy thyroid pattern.')
      }

      return {
        severity,
        headline: severity === 'ok'
          ? 'Healthy thyroid pattern'
          : severity === 'watch' ? 'Worth pairing TSH with Free T3 / T4 next time'
          : 'Thyroid pattern worth clinician review',
        notes,
        observed: snapshot(evaluated, ['tsh', 'free_t3', 'free_t4']),
      }
    },
  },

  /* --------------------------- 4. Iron ------------------------ */
  {
    id: 'iron',
    label: 'Iron pattern',
    coreMarkers: ['ferritin', 'hemoglobin'],
    optionalMarkers: ['hs_crp'],
    description:
      'Ferritin doubles as an inflammation marker, so it can look adequate while true iron stores are depleted. Interpret alongside hemoglobin and hs-CRP.',
    detect(evaluated) {
      if (!haveAll(evaluated, ['ferritin', 'hemoglobin']) && !haveAll(evaluated, ['ferritin'])) return null

      const fer  = evaluated.ferritin
      const hgb  = evaluated.hemoglobin
      const crp  = evaluated.hs_crp

      let severity = 'ok'
      const notes = []

      if (fer && hgb && fer.status !== 'insufficient' && hgb.status !== 'insufficient') {
        if (fer.status === 'outside' && fer.value != null && fer.value < 30 && hgb.status === 'outside') {
          severity = 'attend'
          notes.push('Low ferritin plus low hemoglobin — a classic iron-deficiency anemia pattern. Discuss with a clinician; GI blood loss should be ruled out if unexplained.')
        } else if (fer.status === 'outside' && fer.value != null && fer.value < 30 && hgb.status !== 'outside') {
          severity = 'watch'
          notes.push('Ferritin is low but hemoglobin still holds — iron deficiency without anemia (common in athletes, menstruating individuals, and heavy-training endurance users). Symptoms often appear before hemoglobin drops.')
        } else if (fer.value != null && fer.value > 300 && crp?.value != null && crp.value > 3) {
          severity = maxSev(severity, 'watch')
          notes.push('Ferritin is high AND hs-CRP is elevated — the ferritin reading likely reflects inflammation rather than genuine iron overload. Address inflammation first before assuming hemochromatosis.')
        } else if (fer.value != null && fer.value > 300 && (!crp || crp.status === 'in_target')) {
          severity = maxSev(severity, 'watch')
          notes.push('Ferritin is high without inflammation to explain it. Discuss hemochromatosis screening (HFE genotype, transferrin saturation) if this persists on retest.')
        }
      } else if (fer && fer.status !== 'insufficient') {
        if (fer.value != null && fer.value < 30) {
          severity = 'watch'
          notes.push('Ferritin is low. Hemoglobin would confirm whether iron deficiency has progressed to anemia; symptoms usually appear before hemoglobin drops.')
        }
      }

      if (severity === 'ok') {
        notes.push('Ferritin and hemoglobin sit within healthy ranges — a healthy iron pattern.')
      }

      return {
        severity,
        headline: severity === 'ok'
          ? 'Healthy iron pattern'
          : severity === 'watch' ? 'Iron picture worth reviewing'
          : 'Iron pattern worth clinician review',
        notes,
        observed: snapshot(evaluated, ['ferritin', 'hemoglobin', 'hs_crp']),
      }
    },
  },

  /* ------------------ 5. Inflammation / Cardiovascular ----------- */
  {
    id: 'inflammation_cv',
    label: 'Inflammation & cardiovascular pattern',
    coreMarkers: ['hs_crp', 'apob'],
    optionalMarkers: ['ldl'],
    description:
      'Systemic inflammation (hs-CRP) and atherogenic particle burden (ApoB) are the two most-actionable cardiovascular risk markers. LDL adds cholesterol content context.',
    detect(evaluated) {
      if (!haveAtLeast(evaluated, ['hs_crp', 'apob', 'ldl'], 1)) return null

      const crp  = evaluated.hs_crp
      const apo  = evaluated.apob
      const ldl  = evaluated.ldl

      let severity = 'ok'
      const notes = []

      if (crp?.status === 'outside' && apo?.status === 'outside') {
        severity = 'attend'
        notes.push('Both hs-CRP and ApoB sit outside clinical normal — elevated inflammatory AND atherogenic burden. This combined pattern carries greater CV risk than either marker alone.')
      } else if (apo?.status === 'outside') {
        severity = 'watch'
        notes.push('ApoB is outside clinical normal. Diet levers (saturated fat, refined carbs, fiber) can move ApoB meaningfully in 3 months; discuss with a clinician about whether Lp(a) should also be measured once.')
      } else if (crp?.status === 'outside') {
        severity = 'watch'
        notes.push('hs-CRP is elevated. Retest in 2–4 weeks to rule out an acute driver (recent infection, injury, hard training week). Persistent elevation is worth investigating.')
      }

      if (apo?.status === 'in_target' && ldl?.status === 'outside') {
        severity = maxSev(severity, 'nudge')
        notes.push('LDL-C is elevated but ApoB is in target — suggests larger, more buoyant LDL particles with lower particle count. Generally lower risk per unit of LDL-C than a small-dense LDL pattern.')
      }
      if (apo?.status === 'outside' && ldl?.status === 'in_target') {
        severity = maxSev(severity, 'watch')
        notes.push('ApoB is elevated but LDL-C looks fine — suggests high particle count (small-dense LDL or Lp(a) contribution) that LDL alone would miss. ApoB is the more informative marker here.')
      }
      if (crp?.status === 'borderline' && apo?.status === 'borderline') {
        severity = maxSev(severity, 'nudge')
        notes.push('Both markers sit in the mild-elevation zone — the same lifestyle levers (body composition, sleep, fiber, saturated-fat reduction) tend to move both.')
      }

      if (severity === 'ok') {
        notes.push('hs-CRP and ApoB sit within their target ranges — a healthy inflammation/CV pattern.')
      }

      return {
        severity,
        headline: severity === 'ok'
          ? 'Healthy inflammation & CV pattern'
          : severity === 'nudge' ? 'Mild inflammation/CV signal'
          : severity === 'watch' ? 'Worth reviewing inflammation/CV picture'
          : 'Combined inflammation + atherogenic burden — clinician review recommended',
        notes,
        observed: snapshot(evaluated, ['hs_crp', 'apob', 'ldl']),
      }
    },
  },
]

/**
 * Evaluate every pattern given the current biomarker evaluation.
 * Returns detected patterns only (skips patterns that returned null).
 */
export function detectPatterns(evaluated) {
  return PATTERNS
    .map((p) => {
      const result = p.detect(evaluated)
      if (!result) return null
      return { ...p, ...result }
    })
    .filter(Boolean)
}
