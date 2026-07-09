'use client'

import JSZip from 'jszip'
import { APPROVED_RSIDS } from './variant-catalog'

/**
 * Parse a raw genome file entirely on the client.
 * Supported formats:
 *   - .txt (23andMe, MyHeritage)
 *   - .zip (containing a .txt inside — typical 23andMe download)
 *   - .vcf (basic support for genotype extraction)
 *
 * Returns:
 *   {
 *     variants: { [rsid]: 'GT' },
 *     stats: { totalDataLines, recognized, format }
 *   }
 */

export async function parseGenomeFile(file) {
  if (!file) throw new Error('No file provided')
  const name = (file.name || '').toLowerCase()

  let text = ''
  let format = 'txt'

  if (name.endsWith('.zip')) {
    format = 'zip'
    const zip = await JSZip.loadAsync(file)
    const entry = Object.values(zip.files).find(
      (f) => !f.dir && /\.(txt|vcf)$/i.test(f.name)
    )
    if (!entry) throw new Error('No .txt or .vcf file found inside the .zip archive.')
    text = await entry.async('string')
  } else if (name.endsWith('.vcf')) {
    format = 'vcf'
    text = await file.text()
  } else {
    text = await file.text()
  }

  return format === 'vcf' ? parseVcfText(text) : parseGenomeText(text)
}

/**
 * 23andMe / AncestryDNA / MyHeritage tab-delimited format.
 * Header lines start with '#'.
 * 23andMe:      rsid \t chr \t pos \t genotype
 * AncestryDNA:  rsid \t chr \t pos \t allele1 \t allele2
 */
export function parseGenomeText(text) {
  const lines = text.split(/\r?\n/)
  const variants = {}
  let totalDataLines = 0
  let recognized = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    totalDataLines++

    const parts = line.split(/\t/)
    if (parts.length < 4) continue

    const rsid = parts[0].trim()
    if (!APPROVED_RSIDS.has(rsid)) continue

    let genotype
    if (parts.length >= 5 && parts[3].length === 1 && parts[4].length === 1) {
      // AncestryDNA-style two-allele columns
      genotype = parts[3] + parts[4]
    } else {
      genotype = parts[3].trim()
    }

    if (!genotype || genotype === '--' || genotype === '00' || /[^A-Za-z0-9]/.test(genotype)) continue
    variants[rsid] = genotype.toUpperCase()
    recognized++
  }

  return { variants, stats: { totalDataLines, recognized, format: '23andMe/AncestryDNA' } }
}

/**
 * Simple VCF genotype extraction. VCF is complex — for MVP we accept:
 *   #CHROM POS ID REF ALT QUAL FILTER INFO FORMAT SAMPLE
 * The GT field of SAMPLE indicates genotype (0/0, 0/1, 1/1, etc). ID must be an rsID.
 */
export function parseVcfText(text) {
  const lines = text.split(/\r?\n/)
  const variants = {}
  let totalDataLines = 0
  let recognized = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    totalDataLines++

    const parts = line.split(/\t/)
    if (parts.length < 10) continue
    const [_chrom, _pos, id, ref, alt, _qual, _filter, _info, format, sample] = parts
    if (!id || !id.startsWith('rs') || !APPROVED_RSIDS.has(id)) continue

    // Find GT index inside FORMAT and read the corresponding value from SAMPLE
    const fmtParts = format.split(':')
    const gtIdx = fmtParts.indexOf('GT')
    if (gtIdx < 0) continue
    const sampleParts = sample.split(':')
    const gtRaw = sampleParts[gtIdx]
    if (!gtRaw) continue

    // e.g. '0/1' or '1|0' — map to allele letters
    const alleles = gtRaw.split(/[|/]/).map((a) => (a === '0' ? ref : alt.split(',')[parseInt(a, 10) - 1] || 'N'))
    if (alleles.length < 2 || alleles.some((a) => a === 'N' || a === '.')) continue

    variants[id] = (alleles[0] + alleles[1]).toUpperCase()
    recognized++
  }

  return { variants, stats: { totalDataLines, recognized, format: 'VCF' } }
}
