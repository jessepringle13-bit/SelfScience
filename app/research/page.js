'use client'

// /app/app/research/page.js
// Deep Research generator. Takes a natural-language research question,
// decomposes it into sub-queries, retrieves candidate PubMed studies
// via /api/search, scores their reliability via /api/score-reliability,
// then synthesizes a structured markdown report via /api/research/synthesize.
// Progress states are visible; final report is exportable via
// window.print() / clipboard copy / markdown download.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileSearch, ArrowLeft, ArrowRight, Sparkles, Loader2, CheckCircle2,
  Copy, Download, Printer, AlertCircle, ExternalLink,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { hasGenomeResults, getGenomeResults } from '@/lib/genomeSession'

const STARTERS = [
  'How reliable is the evidence for methylated folate in MTHFR carriers?',
  'What does current research say about ACTN3 R577X and sprint performance?',
  'Summarise recent studies on ApoE4 and cognitive resilience interventions.',
]

function ensureSessionId() {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = window.sessionStorage.getItem('ss_research_session_id')
    if (!id) {
      id = 'ss_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36)
      window.sessionStorage.setItem('ss_research_session_id', id)
    }
    return id
  } catch { return 'anon' }
}

async function runPlan(question, context) {
  const res = await fetch('/api/research/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context, sessionId: ensureSessionId() }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || 'Planning failed')
  return data.queries || []
}

async function retrieveOne(query) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&source=pubmed&limit=8`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  const items = data?.items || data?.results || []
  return items.slice(0, 6)
}

async function scoreOne(item) {
  try {
    const res = await fetch('/api/score-reliability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:    item.title || '',
        abstract: item.abstract || item.summary || '',
        journal:  item.journal || '',
        year:     item.year || '',
        pmid:     item.pmid || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    return data?.score || data?.reliability || null
  } catch { return null }
}

async function runSynth(question, sources) {
  const res = await fetch('/api/research/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, sources }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || 'Synthesis failed')
  return data
}

export default function ResearchPage() {
  const [question, setQuestion] = useState('')
  const [useGenomeContext, setUseGenomeContext] = useState(true)
  const [genomeLoaded, setGenomeLoaded] = useState(false)
  const [stage, setStage] = useState('idle') // idle | plan | retrieve | score | synth | done | error
  const [queries, setQueries] = useState([])
  const [sources, setSources] = useState([])
  const [report, setReport] = useState('')
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    const load = () => setGenomeLoaded(hasGenomeResults())
    load()
    window.addEventListener('selfscience:genome-changed', load)
    return () => window.removeEventListener('selfscience:genome-changed', load)
  }, [])

  useEffect(() => {
    if (['plan', 'retrieve', 'score', 'synth'].includes(stage)) {
      startedAt.current = Date.now()
      timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 500)
      return () => clearInterval(timerRef.current)
    }
    return undefined
  }, [stage])

  const running = ['plan', 'retrieve', 'score', 'synth'].includes(stage)

  const start = async (q) => {
    const question2 = (q ?? question).trim()
    if (!question2 || running) return
    setQuestion(question2)
    setError('')
    setReport('')
    setQueries([])
    setSources([])
    setElapsed(0)

    // Assemble context (active pillar + first 5 variants if allowed).
    let ctx = {}
    if (useGenomeContext && genomeLoaded) {
      try {
        const g = getGenomeResults()
        const vs = Array.isArray(g?.variants_recognized) ? g.variants_recognized.slice(0, 5) : []
        ctx = {
          userVariants: vs.map((v) => ({ gene: v?.gene, rsid: v?.rsid, classification: v?.classification })),
        }
      } catch {}
    }

    try {
      // Step 1: plan
      setStage('plan')
      const qs = await runPlan(question2, ctx)
      setQueries(qs)

      // Step 2: retrieve
      setStage('retrieve')
      const allHits = []
      const seen = new Set()
      for (const q2 of qs.slice(0, 4)) {
        const items = await retrieveOne(q2)
        for (const it of items) {
          const key = it.pmid || it.doi || it.title
          if (key && !seen.has(key)) { seen.add(key); allHits.push(it) }
          if (allHits.length >= 12) break
        }
        if (allHits.length >= 12) break
      }
      if (allHits.length === 0) throw new Error('No candidate studies found. Try a broader question.')

      // Step 3: score (best-effort in parallel with a small cap)
      setStage('score')
      const scored = []
      for (const it of allHits.slice(0, 8)) {
        const r = await scoreOne(it)
        scored.push({
          pmid: it.pmid || '',
          title: it.title || '',
          year: it.year || '',
          journal: it.journal || '',
          abstract: it.abstract || it.summary || '',
          reliability: r ? (typeof r === 'object' ? (r.tier || r.label || r.score) : r) : null,
        })
      }
      setSources(scored)

      // Step 4: synthesize
      setStage('synth')
      const out = await runSynth(question2, scored)
      setReport(out.report || '')
      setStage('done')
    } catch (e) {
      setError(String(e?.message || e))
      setStage('error')
    }
  }

  const copyMd = () => {
    try { navigator.clipboard.writeText(report); } catch {}
  }
  const downloadMd = () => {
    try {
      const blob = new Blob([report], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `selfscience-research-${Date.now()}.md`
      a.click(); URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container max-w-3xl pt-24 pb-16">
        <Link href="/" className="ss-hide-in-print inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ss-muted hover:text-ss-text">
          <ArrowLeft size={11} /> Dashboard
        </Link>

        <div className="ss-hide-in-print mt-4 flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
            <FileSearch size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-ss-text md:text-3xl">Deep Research</h1>
            <p className="text-[13.5px] text-ss-muted">Ask a research question. Get a structured, cited answer built from real studies.</p>
          </div>
        </div>

        {/* Input */}
        {!running && stage !== 'done' && (
          <section className="ss-hide-in-print mt-6 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">Your research question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-ss-border-warm/60 bg-ss-canvas/40 p-3 text-[14px] text-ss-text placeholder:text-ss-muted focus:border-ss-orange focus:outline-none"
              placeholder="e.g. What does the current research say about creatine and cognitive performance in adults over 50?"
              maxLength={500}
            />
            {genomeLoaded && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12.5px] text-ss-text">
                <input
                  type="checkbox"
                  checked={useGenomeContext}
                  onChange={(e) => setUseGenomeContext(e.target.checked)}
                  className="h-4 w-4 accent-ss-orange"
                />
                Use my genome context (scope sub-queries to my variants)
              </label>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setQuestion(s); start(s) }}
                    className="rounded-full border border-ss-border-warm/60 bg-ss-canvas/40 px-3 py-1 text-[11.5px] font-semibold text-ss-muted transition hover:border-ss-orange/60 hover:text-ss-orange"
                  >
                    {s.slice(0, 60)}{s.length > 60 ? '…' : ''}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => start()}
                disabled={!question.trim()}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-[13.5px] font-bold transition ${
                  !question.trim()
                    ? 'cursor-not-allowed bg-ss-muted/30 text-ss-muted'
                    : 'ss-glow-orange-btn bg-ss-orange text-white hover:bg-ss-orange-dark'
                }`}
              >
                <Sparkles size={13} /> Generate report
              </button>
            </div>
            <p className="mt-3 text-[11.5px] text-ss-muted">
              Runs entirely on free-tier models. Reports are shared across users on the free budget — heavy days may be slower. Nothing about your query is stored server-side.
            </p>
          </section>
        )}

        {/* Progress */}
        {(running || stage === 'error') && (
          <section className="mt-6 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">In progress</div>
              <div className="font-mono text-[11px] text-ss-muted">{elapsed}s</div>
            </div>
            <div className="mt-3 space-y-2 text-[13px]">
              <ProgressStep label="Planning sub-queries"       active={stage === 'plan'}     done={['retrieve','score','synth','done'].includes(stage)} />
              <ProgressStep label="Retrieving PubMed studies"  active={stage === 'retrieve'} done={['score','synth','done'].includes(stage)} />
              <ProgressStep label="Scoring reliability"        active={stage === 'score'}    done={['synth','done'].includes(stage)} />
              <ProgressStep label="Synthesising report"        active={stage === 'synth'}    done={['done'].includes(stage)} />
            </div>
            {queries.length > 0 && (
              <div className="mt-4 border-t border-ss-border-warm/50 pt-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">Sub-queries</div>
                <ul className="mt-1 list-inside list-disc text-[12.5px] text-ss-text">
                  {queries.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.05] px-3 py-2 text-[12.5px] text-red-500">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}
            {stage === 'error' && (
              <button
                type="button"
                onClick={() => { setStage('idle'); setError('') }}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-ss-border-warm/60 bg-ss-canvas/40 px-4 py-1.5 text-[12.5px] font-semibold text-ss-text hover:border-ss-orange/60"
              >
                Try again
              </button>
            )}
          </section>
        )}

        {/* Report */}
        {stage === 'done' && report && (
          <section className="mt-6 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-5 ss-print-area">
            <div className="ss-hide-in-print mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">
                <CheckCircle2 size={11} className="mr-1 inline text-ss-green" /> Report ready
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={copyMd} className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm/60 bg-ss-canvas/40 px-3 py-1 text-[11.5px] font-semibold text-ss-muted hover:text-ss-text"><Copy size={11} /> Copy</button>
                <button type="button" onClick={downloadMd} className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm/60 bg-ss-canvas/40 px-3 py-1 text-[11.5px] font-semibold text-ss-muted hover:text-ss-text"><Download size={11} /> .md</button>
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm/60 bg-ss-canvas/40 px-3 py-1 text-[11.5px] font-semibold text-ss-muted hover:text-ss-text"><Printer size={11} /> Print / PDF</button>
                <button type="button" onClick={() => { setStage('idle'); setReport(''); setSources([]) }} className="inline-flex items-center gap-1 rounded-full bg-ss-orange px-3 py-1 text-[11.5px] font-bold text-white">New report</button>
              </div>
            </div>

            <MarkdownReport md={report} />

            {sources.length > 0 && (
              <div className="mt-6 border-t border-ss-border-warm/50 pt-4">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-orange">Sources used</div>
                <ul className="mt-2 space-y-1.5 text-[12.5px] text-ss-text">
                  {sources.map((s, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[10px] text-ss-muted">[{i + 1}]</span>
                      {s.pmid ? (
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-ss-orange hover:text-ss-orange-dark">
                          PMID:{s.pmid} <ExternalLink size={9} />
                        </a>
                      ) : <span className="font-mono text-[11px] text-ss-muted">PMID:n/a</span>}
                      <span className="min-w-0 flex-1">{s.title}</span>
                      {s.reliability ? <span className="ml-2 inline-flex items-center rounded-full bg-ss-teal/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase text-ss-teal">{String(s.reliability)}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Print stylesheet */}
        <style jsx global>{`
          @media print {
            body { background: #fff !important; color: #111 !important; }
            .ss-hide-in-print, header[class*="fixed"], nav { display: none !important; }
            main.container { max-width: 100% !important; padding: 0 !important; }
            .ss-print-area * { color: #111 !important; }
          }
        `}</style>
      </main>
    </div>
  )
}

function ProgressStep({ label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
        done ? 'bg-ss-green text-white' : active ? 'bg-ss-orange text-white' : 'bg-ss-canvas/40 text-ss-muted ring-1 ring-ss-border-warm/60'
      }`}>
        {done ? <CheckCircle2 size={12} /> : active ? <Loader2 size={12} className="animate-spin" /> : <span className="text-[8px]">•</span>}
      </span>
      <span className={active ? 'font-bold text-ss-text' : done ? 'text-ss-text' : 'text-ss-muted'}>{label}</span>
    </div>
  )
}

// Extremely minimal markdown renderer — handles h2, bold, and
// paragraphs plus links. Avoids pulling in a full library for one page.
function MarkdownReport({ md }) {
  const html = useMemo(() => renderMd(md || ''), [md])
  return (
    <article className="prose prose-invert prose-headings:text-ss-text prose-p:text-ss-text prose-strong:text-ss-text prose-a:text-ss-orange max-w-none text-[14px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ss-text" dangerouslySetInnerHTML={{ __html: html }} />
  )
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function renderMd(src) {
  const lines = String(src || '').split(/\r?\n/)
  const out = []
  let inList = false
  for (const raw of lines) {
    const line = raw
    if (/^##\s+/.test(line)) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h2>${escapeHtml(line.replace(/^##\s+/, ''))}</h2>`)
    } else if (/^-\s+/.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inlineMd(escapeHtml(line.replace(/^-\s+/, '')))}</li>`)
    } else if (line.trim() === '') {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('')
    } else {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<p>${inlineMd(escapeHtml(line))}</p>`)
    }
  }
  if (inList) out.push('</ul>')
  return out.join('\n')
}
function inlineMd(s) {
  // Bold **text**  and PMID citations as clickable orange chips.
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\(PMID:(\d{4,10})\)/g, '(<a href="https://pubmed.ncbi.nlm.nih.gov/$1/" target="_blank" rel="noopener noreferrer">PMID:$1</a>)')
}
