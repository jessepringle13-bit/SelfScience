'use client'

// /app/lib/practitionerReport.js
// SessionStorage-backed practitioner report items. Cards from the new
// /genome/{overview,findings,strengths} pages push their plain-language
// summary into this store so the /practitioner-report page can pick them
// up without any server round-trip. Session-only by design — this data
// clears when the tab closes unless the user exports it first.

const KEY = 'ss:practitioner-report:items'
const EVT = 'selfscience:practitioner-changed'

function safeRead() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function safeWrite(list) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(list.slice(-200)))
    window.dispatchEvent(new CustomEvent(EVT))
  } catch { /* quota / disabled — silent */ }
}

export function getPractitionerItems() {
  return [...safeRead()].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
}

export function isInPractitionerReport(variantId) {
  if (!variantId) return false
  return safeRead().some((it) => it.id === String(variantId))
}

export function addToPractitionerReport(card) {
  const id = String(card?.rsid || card?.id || '')
  if (!id) return false
  const existing = safeRead()
  if (existing.some((it) => it.id === id)) return false
  existing.push({
    id,
    gene: card.gene || '',
    pillar: card.pillar || '',
    classification: card.classification || '',
    summary: card.classification_text || card.summary || card.description || '',
    rsid: card.rsid || null,
    genotype: card.genotype || null,
    evidenceStrength: card.evidence_strength || card.evidenceStrength || null,
    addedAt: Date.now(),
  })
  safeWrite(existing)
  return true
}

export function removeFromPractitionerReport(id) {
  const next = safeRead().filter((it) => it.id !== String(id))
  safeWrite(next)
}

export const PRACTITIONER_CHANGE_EVENT = EVT
