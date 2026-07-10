/**
 * Generate a portable Markdown report from a SelfScience genome analysis.
 *
 * Design notes:
 *   - Pure function: takes the same shape the results UI renders from and
 *     returns a Markdown string. No DOM access, no side effects.
 *   - Uses selfscience.io as the canonical base for search links so the
 *     downloaded file stays useful after the browser tab is closed.
 *   - Keeps every clinical disclaimer intact so a printed copy is still
 *     honest about scope.
 */

const SITE_URL = 'https://selfscience.io'

/**
 * @param {object} args
 * @param {object} args.report       — the /api/interpret-genome response
 * @param {object} args.variants     — { rsid: genotype } that user uploaded
 * @param {object} args.stats        — { recognized, format }
 * @param {Array}  args.books        — matched book objects from getBooksForVariants
 * @returns {string} A full Markdown document.
 */
export function buildGenomeMarkdown({ report, variants, stats, books }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const lines = []
  const push = (...rows) => rows.forEach((r) => lines.push(r))

  // -------------------- Header --------------------
  push(
    '# Your SelfScience Genome Report',
    '',
    `**Generated:** ${dateStr} at ${timeStr}`,
    `**Source file:** ${stats?.format || 'unknown'}`,
    `**Recognized variants:** ${stats?.recognized ?? 0}`,
    `**Session ID:** ${report?.session_id || '—'} (local only, not stored on our servers)`,
    '',
    '> **This is not medical advice.** SelfScience is an educational research platform.',
    '> Every finding below is a *research association*, not a diagnosis or prediction.',
    '> Genetics is only one input into health outcomes. Discuss any health concerns with a qualified provider.',
    '',
    '---',
    '',
  )

  // -------------------- Overview --------------------
  const strengths = report?.overview?.strengths || []
  const areas = report?.overview?.areasToExplore || []
  const systemView = report?.overview?.systemView

  push('## Overview', '')
  if (systemView) push(`> ${systemView}`, '')

  if (strengths.length) {
    push('### Top Strengths', '')
    strengths.forEach((s, i) => {
      push(
        `${i + 1}. **${s.name || 'Strength'}** — *${s.pillar || 'General'}*`,
        `   ${s.plain || ''}`,
        s.rsid ? `   _${s.rsid}${s.gene ? ` · ${s.gene}` : ''}${s.genotype ? ` · genotype ${s.genotype}` : ''}_` : '',
        '',
      )
    })
  }

  if (areas.length) {
    push('### Top Awareness Areas', '')
    areas.forEach((a, i) => {
      push(
        `${i + 1}. **${a.name || 'Awareness area'}** — *${a.pillar || 'General'}*`,
        `   ${a.plain || ''}`,
        a.rsid ? `   _${a.rsid}${a.gene ? ` · ${a.gene}` : ''}${a.genotype ? ` · genotype ${a.genotype}` : ''}_` : '',
        '',
      )
    })
  }

  push('---', '')

  // -------------------- Full Report by Pillar --------------------
  const fullReport = report?.fullReport || []
  if (fullReport.length) {
    push('## Full Report by Pillar', '')
    fullReport.forEach((pillar) => {
      const pName = pillar?.pillar || 'Pillar'
      push(`### ${pName}`, '')
      const items = pillar?.variants || []
      if (!items.length) {
        push('_No variant details in this pillar._', '')
        return
      }
      items.forEach((v) => {
        const geneLine = [v.gene, v.rsid, v.genotype].filter(Boolean).join(' · ')
        push(
          `#### ${v.gene || v.rsid || 'Variant'} (${v.classification || 'Neutral'})`,
          geneLine ? `_${geneLine}_` : '',
          '',
          v.explanation || '_No explanation available._',
          '',
        )
        if (v.landmarkStudy) {
          push('**Landmark study:**', `> ${v.landmarkStudy}`, '')
        }
        if (Array.isArray(v.searches) && v.searches.length) {
          push('**Research directions on SelfScience:**')
          v.searches.forEach((q) => {
            const url = `${SITE_URL}/search?q=${encodeURIComponent(q)}`
            push(`- [${q}](${url})`)
          })
          push('')
        }
      })
      push('')
    })
    push('---', '')
  }

  // -------------------- Research Roadmap --------------------
  const roadmap = report?.researchRoadmap || []
  if (roadmap.length) {
    push('## Your Research Roadmap', '')
    push('_Ordered by relevance to your genetic profile._', '', '')
    roadmap.forEach((r) => {
      push(`### ${r.priority ? `${r.priority}. ` : ''}${r.pillar || 'Pillar'}`, '')
      if (r.why) push(r.why, '')
      if (Array.isArray(r.searches) && r.searches.length) {
        push('**Starting points:**')
        r.searches.forEach((q) => {
          const url = `${SITE_URL}/search?q=${encodeURIComponent(q)}`
          push(`- [${q}](${url})`)
        })
        push('')
      }
    })
    push('---', '')
  }

  // -------------------- Recommended Books --------------------
  if (Array.isArray(books) && books.length) {
    push('## Recommended Reading', '')
    push('_Books matched to your genetic profile — synopsis + why-it-matters + direct links._', '', '')
    books.forEach((b, i) => {
      push(
        `### ${i + 1}. ${b.title}`,
        `*by ${b.author}, ${b.year}*`,
        '',
        b.plainReason ? `**Why it's on our list:** ${b.plainReason}` : '',
        b.synopsis    ? `\n**What's inside:** ${b.synopsis}` : '',
        b.knownFor    ? `\n**What it's known for:** ${b.knownFor}` : '',
        b.honestyNote ? `\n> ⚠ **Honesty note:** ${b.honestyNote}` : '',
        '',
        `Read more on SelfScience: [${SITE_URL}/reading-list/${b.slug}](${SITE_URL}/reading-list/${b.slug})`,
        '',
      )
    })
    push('---', '')
  }

  // -------------------- Recognized variants (technical) --------------------
  const vList = Object.entries(variants || {})
  if (vList.length) {
    push('## Recognized Variants (Technical Detail)', '')
    push('| rsID | Genotype |', '| --- | --- |')
    vList.sort().forEach(([rsid, gt]) => push(`| ${rsid} | ${gt} |`))
    push('')
    push('---', '')
  }

  // -------------------- Footer --------------------
  push(
    '## About This Report',
    '',
    'This report was generated by [SelfScience](https://selfscience.io), an educational',
    'research aggregator that surfaces peer-reviewed studies from PubMed, Semantic Scholar,',
    'OpenAlex, and Crossref. Every study on SelfScience is auto-scored for reliability and',
    'translated into plain language so you can evaluate the underlying evidence yourself.',
    '',
    '**Privacy:** Your raw genome file never left your browser. Only the small list of',
    'recognized variants above was sent to our server for interpretation, and it was NOT',
    'retained after the analysis completed. Nothing about you personally is stored.',
    '',
    '**Not medical advice.** This report is educational only. Genetic variants describe',
    'population-level *associations*, not individual predictions. Please discuss any',
    'health decisions with a qualified provider.',
    '',
    `— SelfScience · ${SITE_URL}`,
    '',
  )

  return lines.join('\n').replace(/\n{3,}/g, '\n\n')
}

/**
 * Trigger a browser download of a text file. Safe on modern browsers; a no-op
 * during SSR.
 */
export function downloadTextFile(content, filename, mimeType = 'text/markdown;charset=utf-8') {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Give the browser a beat to start the download before we revoke the URL.
  setTimeout(() => URL.revokeObjectURL(url), 400)
}

/**
 * Build a compact CSV of just the recognized variants — useful if the user
 * wants to plug them into another analysis tool.
 */
export function buildVariantsCsv(variants, stats) {
  const rows = ['rsid,genotype']
  Object.entries(variants || {}).sort().forEach(([rsid, gt]) => {
    rows.push(`${rsid},${gt}`)
  })
  return rows.join('\n')
}

/**
 * Suggested filename: `selfscience-genome-YYYY-MM-DD.md`
 */
export function reportFilename(ext = 'md') {
  const d = new Date()
  const iso = d.toISOString().slice(0, 10)
  return `selfscience-genome-${iso}.${ext}`
}
