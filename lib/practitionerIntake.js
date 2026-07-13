// /app/lib/practitionerIntake.js
// SelfScience — Practitioner Report intake form storage.
//
// STRICT PRIVACY MODEL:
// - Intake form data lives ONLY in localStorage on the user's device.
// - No backend / no network calls. Ever.
// - Users can wipe at any time via the "Clear intake" button.

export const INTAKE_KEY = 'selfscience_practitioner_intake'
export const PRINT_SECTIONS_KEY = 'selfscience_practitioner_print_sections'

export const INTAKE_DEFAULTS = {
  patientName: '',
  dob: '',
  sex: '',
  unitSystem: 'metric', // 'metric' | 'imperial' — controls form input mode
  heightCm: '',         // canonical storage — always in cm
  weightKg: '',         // canonical storage — always in kg
  practitionerName: '',
  practitionerRole: '',
  reasonForVisit: '',
  currentMedications: '',
  currentSupplements: '',
  allergies: '',
  familyHistory: '',
  lifestyle: '',
  symptomsTimeline: '',
  priorLabs: '',
  goals: '',
  consentShare: false,
  consentUnderstand: false,
}

// The 5 report sections the user can toggle in/out of the printed PDF.
// Cover + HIPAA + Disclaimer are LOCKED ON — never toggled off.
export const PRINT_SECTION_DEFAULTS = {
  clinicianNote: true,
  patientContext: true,
  biomarkers: true,
  variants: true,
  rawAppendix: false, // long — off by default; user can toggle on
}

export const PRINT_SECTION_LABELS = {
  clinicianNote: 'Clinician context note',
  patientContext: 'Patient self-reported information',
  biomarkers: 'Biomarker summary',
  variants: 'Genetic variant summary',
  rawAppendix: 'Raw genotype appendix (long)',
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadIntake() {
  if (!hasWindow()) return { ...INTAKE_DEFAULTS }
  try {
    const raw = localStorage.getItem(INTAKE_KEY)
    if (!raw) return { ...INTAKE_DEFAULTS }
    const parsed = JSON.parse(raw)
    return { ...INTAKE_DEFAULTS, ...(parsed || {}) }
  } catch { return { ...INTAKE_DEFAULTS } }
}

export function saveIntake(patch) {
  if (!hasWindow()) return false
  try {
    const current = loadIntake()
    const next = { ...current, ...(patch || {}) }
    localStorage.setItem(INTAKE_KEY, JSON.stringify(next))
    return true
  } catch { return false }
}

export function clearIntake() {
  if (!hasWindow()) return
  try { localStorage.removeItem(INTAKE_KEY) } catch { /* noop */ }
}

export function loadPrintSections() {
  if (!hasWindow()) return { ...PRINT_SECTION_DEFAULTS }
  try {
    const raw = localStorage.getItem(PRINT_SECTIONS_KEY)
    if (!raw) return { ...PRINT_SECTION_DEFAULTS }
    const parsed = JSON.parse(raw)
    return { ...PRINT_SECTION_DEFAULTS, ...(parsed || {}) }
  } catch { return { ...PRINT_SECTION_DEFAULTS } }
}

export function savePrintSections(patch) {
  if (!hasWindow()) return false
  try {
    const current = loadPrintSections()
    const next = { ...current, ...(patch || {}) }
    localStorage.setItem(PRINT_SECTIONS_KEY, JSON.stringify(next))
    return true
  } catch { return false }
}

/** Compute approximate age (years) from an ISO YYYY-MM-DD date-of-birth string. */
export function ageFromDob(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

/** BMI helper — returns { bmi, category } or null if height/weight missing/invalid. */
export function bmiFrom(heightCm, weightKg) {
  const h = parseFloat(heightCm), w = parseFloat(weightKg)
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null
  const meters = h / 100
  const bmi = w / (meters * meters)
  let category = ''
  if (bmi < 18.5) category = 'Under WHO reference range'
  else if (bmi < 25) category = 'Within WHO reference range'
  else if (bmi < 30) category = 'Above WHO reference range'
  else category = 'Well above WHO reference range'
  return { bmi: Math.round(bmi * 10) / 10, category }
}

// ────────────── Unit conversion helpers ──────────────
// Canonical storage is metric (cm, kg). These helpers convert to/from
// imperial (feet/inches, pounds) for display and for accepting imperial input.

const CM_PER_INCH = 2.54
const KG_PER_LB   = 0.45359237

/** Convert cm → { ft, in, totalInches } (rounded to nearest inch). Returns null if invalid. */
export function cmToFtIn(cm) {
  const n = parseFloat(cm)
  if (!Number.isFinite(n) || n <= 0) return null
  const totalInches = Math.round(n / CM_PER_INCH)
  const ft = Math.floor(totalInches / 12)
  const inch = totalInches % 12
  return { ft, in: inch, totalInches }
}

/** Convert (ft, in) → cm (rounded to nearest 0.5). Returns null if both zero/invalid. */
export function ftInToCm(ft, inches) {
  const f = parseFloat(ft) || 0
  const i = parseFloat(inches) || 0
  if (f <= 0 && i <= 0) return null
  const cm = (f * 12 + i) * CM_PER_INCH
  return Math.round(cm * 10) / 10
}

/** kg → lb (rounded to 1 decimal). */
export function kgToLb(kg) {
  const n = parseFloat(kg)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round((n / KG_PER_LB) * 10) / 10
}

/** lb → kg (rounded to 1 decimal). */
export function lbToKg(lb) {
  const n = parseFloat(lb)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * KG_PER_LB * 10) / 10
}

/** Format cm with both metric + imperial for display, e.g. "168 cm · 5'6"". */
export function formatHeightBoth(cm) {
  const c = parseFloat(cm)
  if (!Number.isFinite(c) || c <= 0) return ''
  const ftin = cmToFtIn(c)
  if (!ftin) return `${c} cm`
  return `${c} cm · ${ftin.ft}'${ftin.in}"`
}

/** Format kg with both metric + imperial for display, e.g. "68 kg · 149.9 lb". */
export function formatWeightBoth(kg) {
  const k = parseFloat(kg)
  if (!Number.isFinite(k) || k <= 0) return ''
  const lb = kgToLb(k)
  if (lb == null) return `${k} kg`
  return `${k} kg · ${lb} lb`
}
