// /app/lib/shareCard.js
// SelfScience — Shareable genome summary card helpers.
//
// All rasterization and share/download logic is fully client-side. No API
// keys are used and no network calls are made. This module is safe to import
// from any 'use client' component.
//
// Data shape expected by buildShareText / <ShareCard /> — should match the
// live app's genome report data. In this codebase results live at
//   report.overview.strengths       -> "Benefit" findings
//   report.overview.areasToExplore  -> "Be Aware" findings
//   report.step1.pillar_summary     -> per-pillar counts
// See buildGenomeResultsForShare() for the normalizer used by the UI.

import { VARIANT_CATALOG } from './variant-catalog'

/**
 * Compose the short shareable text following the exact pattern from the spec:
 *   "My top genomic findings on SelfScience: [GENE Label] [GENE Label] [GENE Label] — explore yours at selfscience.io"
 *
 * Priority: two top Be Aware findings, then one top Benefit finding.
 */
export function buildShareText(genomeResults) {
  const beAware = Array.isArray(genomeResults?.beAware) ? genomeResults.beAware : []
  const benefits = Array.isArray(genomeResults?.benefits) ? genomeResults.benefits : []
  const topFindings = [
    ...beAware.slice(0, 2),
    ...benefits.slice(0, 1),
  ]
    .map((f) => `[${f.gene || 'Gene'} ${f.label || 'variant'}]`)
    .join(' ')
  const findingsText = topFindings || '[genome profile]'
  return `My top genomic findings on SelfScience: ${findingsText} — explore yours at selfscience.io`
}

/**
 * Rasterize a DOM node into a PNG Blob using html2canvas at 2x density.
 * The caller must ensure the node is fully rendered and visible in the DOM
 * (even off-screen positioning works — but display:none does not).
 *
 * Returns { blob, dataUrl } — blob for Web Share / downloads, dataUrl for
 * <img src> previews if needed.
 */
export async function exportCardAsPng(node) {
  if (!node) throw new Error('exportCardAsPng: node is required')
  // Dynamically import so html2canvas doesn't bloat the initial JS bundle
  // (it's ~50KB gzipped and only needed when the user clicks Share).
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(node, {
    backgroundColor: '#F7F6F2',
    scale: 2,
    useCORS: true,
    logging: false,
    // Force a fixed rendering size so different device pixel ratios don't
    // affect the exported dimensions.
    width: node.offsetWidth,
    height: node.offsetHeight,
    windowWidth: node.offsetWidth,
    windowHeight: node.offsetHeight,
  })
  const dataUrl = canvas.toDataURL('image/png', 1.0)
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))), 'image/png', 1.0)
  })
  return { blob, dataUrl }
}

/**
 * Trigger a browser download of a PNG blob with the given filename.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so mobile Safari has time to pick up the file.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Native share on mobile (with file when supported), falls back to a
 * clipboard-copy of the shareable text on desktop / unsupported browsers.
 *
 * Returns a shape describing what happened so the caller can show the right
 * toast copy:
 *   { mode: 'native' | 'native-text-only' | 'clipboard' | 'cancelled', ok: boolean }
 */
export async function shareCardOrCopy({ blob, text }) {
  // Try native Web Share API with file first (mobile).
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], 'selfscience-genome-profile.png', { type: 'image/png' })
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'My SelfScience Genome Profile' })
        return { mode: 'native', ok: true }
      }
      // Fallback: share text/title only.
      await navigator.share({ text, title: 'My SelfScience Genome Profile' })
      return { mode: 'native-text-only', ok: true }
    } catch (err) {
      // User cancelled the share sheet — not an error, just report it.
      if (err?.name === 'AbortError') return { mode: 'cancelled', ok: false }
      // Fall through to clipboard on any other native-share failure.
    }
  }
  // Desktop / unsupported — copy the text to clipboard.
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return { mode: 'clipboard', ok: true }
    }
  } catch (_) {
    // fall through
  }
  return { mode: 'clipboard', ok: false }
}

/**
 * Normalize the live app's `report` object into the shape expected by
 * <ShareCard /> and buildShareText(). Handles missing/partial data safely
 * and derives per-pillar status for the color bar.
 *
 * Every pillar in the pillar_summary becomes a segment. A pillar's status is:
 *   - 'aware' if it has any awareness findings
 *   - 'benefit' if it has strengths but no awareness
 *   - 'neutral' otherwise (only neutrals / no findings)
 *
 * We use nine well-known SelfScience pillars as the display fallback when
 * the report only has some of them populated, so the bar always shows nine
 * segments as spec'd.
 */
const NINE_PILLARS_ORDER = [
  'Nutrition',
  'Sports Performance',
  'Sleep & Circadian',
  'Genomics',
  'Pharmacogenomics',
  'Immune & Gut Health',
  'Stress & Mood',
  'Longevity',
  'Neurology',
]

export function buildGenomeResultsForShare(report) {
  const strengths = Array.isArray(report?.overview?.strengths) ? report.overview.strengths : []
  const areas     = Array.isArray(report?.overview?.areasToExplore) ? report.overview.areasToExplore : []

  // Coerce cards -> minimal { gene, rsid, label, pillar } shape.
  const toFinding = (c) => ({
    gene: deriveDisplayGene(c.gene, c.rsid),
    rsid: c.rsid || '',
    // Prefer the app's short display name; strip any " — details" tails so
    // labels fit on one line inside the card.
    label: shortLabel(c.name || c.gene || ''),
    pillar: c.pillar || 'General',
  })

  // Areas to Explore holds both Awareness and Neutral cards in the live UI,
  // so we split them here so the share card only shows *true* Be Aware ones.
  const beAware = areas
    .filter((c) => c.classification === 'Awareness')
    .map(toFinding)
  const benefits = strengths.map(toFinding)

  // Derive pillar statuses.
  const summary = report?.step1?.pillar_summary || {}
  const seen = new Set()
  const pillars = []
  for (const name of NINE_PILLARS_ORDER) {
    const s = summary[name]
    let status = 'neutral'
    if (s) {
      if ((s.awareness || 0) > 0) status = 'aware'
      else if ((s.positive || 0) > 0) status = 'benefit'
    }
    pillars.push({ name, status })
    seen.add(name)
  }
  // Add any extra pillars we saw in the report but aren't in the canonical
  // nine list — keeps the bar honest for future pillar names.
  for (const [name, s] of Object.entries(summary)) {
    if (seen.has(name)) continue
    let status = 'neutral'
    if ((s.awareness || 0) > 0) status = 'aware'
    else if ((s.positive || 0) > 0) status = 'benefit'
    pillars.push({ name, status })
  }

  return { beAware, benefits, pillars }
}

/** Trim overly long card names so they don't wrap awkwardly in the share card. */
function shortLabel(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  // Common patterns in card titles: "Gene — trait" / "trait (context)".
  const dashIdx = s.indexOf('—')
  const base = dashIdx > 0 ? s.slice(0, dashIdx).trim() : s
  return base.length > 42 ? base.slice(0, 40).trim() + '…' : base
}

/**
 * Turn the app's raw gene field into a display-friendly name. The classifier
 * sometimes writes gene fields as "rs123 + rs456" (haplotype variants_used
 * list) instead of a proper gene symbol. When that happens we look the first
 * rsID up in VARIANT_CATALOG and use its true gene symbol; otherwise we
 * return the gene as-is (already a proper symbol like "MTHFR").
 */
function deriveDisplayGene(rawGene, rsid) {
  const g = (rawGene || '').trim()
  const looksLikeRsidList = /^rs\d/i.test(g) || g.includes(' + ') || g.includes(',')
  if (g && !looksLikeRsidList) return g
  // Try to resolve from the first rsID present in the gene string, then from `rsid`.
  const candidates = []
  if (g) {
    for (const chunk of g.split(/[,+]/)) {
      const m = chunk.trim().match(/rs\d+/i)
      if (m) candidates.push(m[0])
    }
  }
  if (rsid) candidates.push(rsid)
  for (const r of candidates) {
    const meta = VARIANT_CATALOG[r]
    if (meta?.gene) return meta.gene
  }
  return g || 'Variant'
}
