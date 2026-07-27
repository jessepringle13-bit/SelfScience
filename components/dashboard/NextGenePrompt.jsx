'use client'

// /app/components/dashboard/NextGenePrompt.jsx
// "Your Next Gene" prompt card for the dashboard. Silent until a genome
// is loaded AND there are unexplored findings. Dismissible for the
// current session only (sessionStorage) so it comes back on next visit.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { X, Dna, ArrowRight } from 'lucide-react'
import {
  hasGenomeResults, getFindings, useExploredIds, getNextUnexplored,
  CLASSIFICATION_META,
} from '@/lib/explore'

const SESSION_KEY = 'ss_next_gene_dismissed'

export default function NextGenePrompt() {
  const [dismissed, setDismissed] = useState(false)
  const [findings, setFindings] = useState([])
  const [genome, setGenome] = useState(false)
  const explored = useExploredIds()

  useEffect(() => {
    try { if (sessionStorage.getItem(SESSION_KEY) === '1') setDismissed(true) } catch {}
    const load = () => {
      const ok = hasGenomeResults()
      setGenome(ok)
      setFindings(ok ? getFindings() : [])
    }
    load()
    const onChange = () => load()
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const next = useMemo(() => genome ? getNextUnexplored(findings, explored) : null, [findings, explored, genome])
  const remaining = useMemo(() => {
    if (!genome) return 0
    const seen = new Set(explored.map((x) => String(x).toLowerCase()))
    return findings.filter((f) => !seen.has(f.id)).length
  }, [findings, explored, genome])

  if (!genome || !next || dismissed) return null

  const meta = CLASSIFICATION_META[next.classification] || CLASSIFICATION_META.neutral
  const teaser = (next.meaning || '').split(/(?<=[.!?])\s+/)[0] || 'A finding from your genome to explore next.'

  return (
    <div
      className="ss-glow-orange relative flex flex-col items-stretch gap-4 rounded-2xl border-2 border-ss-orange bg-white p-5 md:flex-row md:items-center md:p-6"
      style={{ borderLeftWidth: '4px' }}
      role="region"
      aria-label="Up next in your explorer"
    >
      <button
        type="button"
        onClick={() => {
          setDismissed(true)
          try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
        }}
        aria-label="Dismiss for this session"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
      >
        <X size={13} />
      </button>

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
        <Dna size={22} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-ss-orange">Up next in your explorer</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <div className="text-lg font-extrabold leading-tight text-ss-text">{next.gene}</div>
          {next.rsid && <span className="font-mono text-[10px] text-ss-muted">{next.rsid}</span>}
        </div>
        <p className="mt-1 line-clamp-1 text-[13.5px] leading-snug text-ss-muted">{teaser}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {next.pillar && (
            <span className="inline-flex rounded-full bg-ss-bg px-2 py-0.5 font-mono text-[9px] font-semibold text-ss-muted">
              {next.pillar}
            </span>
          )}
          <span className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text}`}>
            {meta.label}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-1 md:items-end">
        <Link
          href={`/explore/${next.id}`}
          className="inline-flex items-center justify-center gap-1 rounded-full bg-ss-orange px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-ss-orange-dark"
        >
          Explore this gene <ArrowRight size={12} />
        </Link>
        <div className="text-center font-mono text-[9.5px] text-ss-muted md:text-right">
          {remaining} gene{remaining === 1 ? '' : 's'} remaining
        </div>
      </div>
    </div>
  )
}
