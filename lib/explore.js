'use client'

// /app/lib/explore.js
// Gene Explorer & Focus Mode — core client library.
//
// State (localStorage under `ss_` namespace):
//   ss_explored_findings — array of finding IDs the user has opened / marked
//
// A finding ID is the finding's rsid (lowercased) when present, otherwise
// a slugified gene name: lowercase, non-alphanumeric → hyphen, trimmed.
// Example: rs1801133  or  mthfr-c677t

import { useEffect, useState } from 'react'
import { getGenomeResults, hasGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'
import { getVariantInterpretation, getConfidenceMeta } from '@/lib/variantInterpretations'

export const LS_EXPLORED = 'ss_explored_findings'
export const CHANGE_EVENT = 'selfscience:explored-changed'

/* -------------------------- ID helpers ------------------------------- */

export function slugGene(v) {
  const g = (v?.gene || v?.name || 'variant').toString().toLowerCase()
  return g.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'variant'
}

export function findingIdFor(v) {
  const r = String(v?.rsid || '').trim().toLowerCase()
  if (r) return r
  return slugGene(v)
}

/* -------------------------- Storage --------------------------------- */

export function readExplored() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_EXPLORED)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function isExplored(idOrCard) {
  const id = typeof idOrCard === 'string' ? idOrCard.toLowerCase() : findingIdFor(idOrCard)
  return readExplored().map((x) => String(x).toLowerCase()).includes(id)
}

function writeExplored(list) {
  if (typeof window === 'undefined') return
  try {
    // Dedupe + normalise + clamp (safety) to 500.
    const set = new Set()
    for (const v of (list || [])) if (v) set.add(String(v).toLowerCase())
    const out = [...set].slice(-500)
    window.localStorage.setItem(LS_EXPLORED, JSON.stringify(out))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
    // Nudge achievement engine (all_explored is Tier 4).
    try { const { checkAll } = require('@/lib/achievements'); checkAll?.() } catch {}
  } catch {}
}

export function markExplored(idOrCard) {
  const id = typeof idOrCard === 'string' ? idOrCard.toLowerCase() : findingIdFor(idOrCard)
  if (!id) return
  const list = readExplored()
  if (!list.map((x) => String(x).toLowerCase()).includes(id)) list.push(id)
  writeExplored(list)
}

export function unmarkExplored(idOrCard) {
  const id = typeof idOrCard === 'string' ? idOrCard.toLowerCase() : findingIdFor(idOrCard)
  const next = readExplored().filter((x) => String(x).toLowerCase() !== id)
  writeExplored(next)
}

export function useExploredIds() {
  const [ids, setIds] = useState([])
  useEffect(() => {
    const load = () => setIds(readExplored())
    load()
    const onChange = () => load()
    const onStorage = (e) => { if (e?.key === LS_EXPLORED) load() }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return ids
}

/* -------------------------- Findings --------------------------------- */

/**
 * Flatten a genome report into a normalised finding array with:
 *   { id, rsid, gene, genotype, pillar, name, classification, meaning,
 *     actions[], confidence }
 *
 * classification is normalised to 'positive' | 'awareness' | 'neutral'.
 */
export function getFindings() {
  const report = getGenomeResults()
  if (!report) return []

  // Strength / awareness index from overview so we can classify cards
  // even when the underlying card doesn't ship one.
  const strengthKeys = new Set(
    (report?.overview?.strengths || []).map((c) => (c?.rsid || c?.gene || '').toLowerCase())
  )
  const awareKeys = new Set(
    (report?.overview?.areasToExplore || []).map((c) => (c?.rsid || c?.gene || '').toLowerCase())
  )

  const flat = flattenReportCards(report) || []
  const out = []
  const seenIds = new Set()
  for (const card of flat) {
    if (!card) continue
    const rsid = String(card.rsid || '').toLowerCase()
    const gene = card.gene || card.name || 'variant'
    const key  = rsid || gene.toLowerCase()
    const id   = findingIdFor(card)
    // Dedupe: keep the first (richer overview) entry, drop subsequent
    // dupes even if they carry a different genotype string. This
    // prevents Section 1 from listing the same variant twice.
    if (seenIds.has(id)) continue
    seenIds.add(id)
    let classification = card.classification
    if (!classification || (classification !== 'positive' && classification !== 'awareness' && classification !== 'neutral')) {
      if (strengthKeys.has(key) || strengthKeys.has(rsid) || strengthKeys.has(gene.toLowerCase())) classification = 'positive'
      else if (awareKeys.has(key) || awareKeys.has(rsid) || awareKeys.has(gene.toLowerCase())) classification = 'awareness'
      else classification = 'neutral'
    }
    const interp = getVariantInterpretation(card) || {}
    out.push({
      id,
      rsid: card.rsid || null,
      gene,
      name: card.name || card.trait || null,
      genotype: card.genotype || card.genotype_called || null,
      pillar: card.pillar || null,
      classification,
      meaning: interp.meaning || '',
      actions: Array.isArray(interp.actions) ? interp.actions : [],
      confidence: interp.confidence || 'emerging',
      isCurated: !!interp.isCurated,
      research: card.research || null,
      trials: card.trials || null,
      // Original card for downstream reuse (frequency block, doctor modal, etc.)
      raw: card,
    })
  }
  return out
}

export function getFindingById(id) {
  if (!id) return null
  const target = String(id).toLowerCase()
  return getFindings().find((f) => f.id === target) || null
}

/**
 * Impact ranking used across Explorer + Focus Mode + NextGenePrompt.
 *   1) Awareness findings with high confidence first ("Start here")
 *   2) Other awareness findings
 *   3) Strengths (positive)
 *   4) Neutrals
 * Within each bucket, keep original order (already impact-sorted by
 * upstream report generator).
 */
const CONF_ORDER = { high: 3, moderate: 2, emerging: 1 }
export function impactRankedFindings(findings) {
  const bucket = (f) => {
    if (f.classification === 'awareness') return f.confidence === 'high' ? 0 : 1
    if (f.classification === 'positive') return 2
    return 3
  }
  return (findings || []).slice().sort((a, b) => {
    const bd = bucket(a) - bucket(b)
    if (bd !== 0) return bd
    // Within bucket, prefer higher confidence.
    return (CONF_ORDER[b.confidence] || 0) - (CONF_ORDER[a.confidence] || 0)
  })
}

/** Return the next unexplored finding for the "Your Next Gene" prompt. */
export function getNextUnexplored(findings, exploredIds) {
  const seen = new Set((exploredIds || []).map((x) => String(x).toLowerCase()))
  const ranked = impactRankedFindings(findings)
  return ranked.find((f) => !seen.has(f.id)) || null
}

/* -------------------------- UI helpers ------------------------------- */

export { hasGenomeResults, getGenomeResults, getConfidenceMeta }

export const CLASSIFICATION_META = {
  positive:  { label: 'Strength',  bg: 'bg-ss-green',  text: 'text-white' },
  awareness: { label: 'Explore',   bg: 'bg-ss-amber',  text: 'text-white' },
  neutral:   { label: 'Neutral',   bg: 'bg-ss-muted/70', text: 'text-white' },
}

// Best-guess action-type bucket per finding — used in T-2 for smart
// grouping but exposed now for anyone who wants it.
export function actionTypeBucket(f) {
  const g = (f?.gene || '').toUpperCase()
  const clinicalGenes = new Set(['SLCO1B1', 'DPYD', 'TPMT', 'CYP2C19', 'CYP2D6', 'CYP3A5', 'VKORC1', 'CYP2C9'])
  if (clinicalGenes.has(g)) return 'doctor'
  const actionsText = (f?.actions || []).join(' ').toLowerCase()
  if (/supplement|methylfolate|creatine|omega|vitamin|magnesium|fish oil|zinc|selenium|iron/.test(actionsText)) return 'action'
  if (/eat|meal|diet|fasting|breakfast|carb|protein|glycemic|caffeine|alcohol/.test(actionsText)) return 'action'
  if (/train|sleep|zone 2|hiit|exercise|workout|recovery|walk/.test(actionsText)) return 'action'
  if (f?.classification === 'awareness') return 'action'
  return 'context'
}
