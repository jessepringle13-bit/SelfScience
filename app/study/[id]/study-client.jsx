'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  FileDown,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Info,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import {
  ReliabilityBadge,
  ReliabilityPending,
  ReliabilityError,
} from '@/components/reliability-badge'
import { SourceBadge, FlagPill, FundingTrailPanel } from '@/components/result-card'

export default function StudyClient({ id }) {
  const router = useRouter()
  const [item, setItem] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [absOpen, setAbsOpen] = useState(false)

  // Load base item from sessionStorage (set by ResultCard when user clicked)
  useEffect(() => {
    if (!id) return
    try {
      const raw = sessionStorage.getItem(`ss:study:${id}`)
      if (raw) setItem(JSON.parse(raw))
      else setError('Study data not found in session. Open this page from a search result.')
    } catch (e) {
      setError('Could not load study data.')
    }
  }, [id])

  // Kick off analysis when item is available
  useEffect(() => {
    if (!item) return
    if (item.reliability) {
      setAnalysis(item)
      return
    }
    setAnalyzing(true)
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        doi: item.doi,
        pmid: item.pmid,
        title: item.title,
        journal: item.journal,
        year: item.year,
        source: item.source,
        authorsShort: item.authorsShort,
        abstract: item.abstract,
      }),
    })
      .then((r) => r.json())
      .then((json) => setAnalysis(json))
      .catch(() => setAnalysis({ _analysisError: true }))
      .finally(() => setAnalyzing(false))
  }, [item])

  const merged = item ? { ...item, ...(analysis || {}) } : null
  const hasReliability = merged && typeof merged.reliability === 'number' && merged.reliability > 0

  const runSearch = (q, pillar) => {
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (pillar) usp.set('pillar', pillar)
    router.push(`/search?${usp.toString()}`)
  }

  if (error) {
    return (
      <FallbackShell>
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2 text-ss-amber">
            <AlertTriangle size={18} />
            <div className="text-lg font-bold">{error}</div>
          </div>
          <p className="mt-2 text-sm text-ss-muted">
            Direct sharing of this page will be enabled once the study lookup endpoint is wired. For now, open studies from the search results grid.
          </p>
          <a
            href="/search"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2 text-sm font-semibold text-white transition hover:bg-ss-orange-dark"
          >
            <Search size={14} /> Go to search
          </a>
        </div>
      </FallbackShell>
    )
  }

  if (!merged) {
    return (
      <FallbackShell>
        <div className="animate-pulse rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="h-4 w-32 rounded-full bg-ss-border-warm" />
          <div className="mt-4 h-8 w-3/4 rounded bg-ss-border-warm" />
          <div className="mt-2 h-4 w-1/3 rounded bg-ss-border-warm" />
          <div className="mt-8 h-24 rounded bg-ss-border-warm" />
        </div>
      </FallbackShell>
    )
  }

  const fundingWarn = merged.funding && merged.funding.score <= 2

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* Header */}
      <section className="relative bg-ss-teal pb-10 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <SourceBadge type={merged.source} />
            {merged.provider && (
              <span className="text-[10px] uppercase tracking-wider text-white/70">
                {merged.provider}
              </span>
            )}
            {merged.oaUrl ? (
              <a
                href={merged.oaUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
              >
                ● Free Full Text
              </a>
            ) : null}
            {typeof merged.citationCount === 'number' && merged.citationCount > 0 && (
              <span className="text-[10px] text-white/70">
                {merged.citationCount.toLocaleString()} citation{merged.citationCount === 1 ? '' : 's'}
              </span>
            )}
            <span className="text-[10px] text-white/70">· {merged.year || '—'}</span>
          </div>

          <h1 className="mt-4 max-w-4xl text-2xl font-extrabold leading-tight md:text-4xl">
            {merged.title}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {merged.journal}{merged.authorsShort ? <span className="ml-2">· {merged.authorsShort}</span> : null}
          </p>

          {/* Action row */}
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a
              href={merged.url || '#'}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2 font-semibold text-white transition hover:bg-ss-orange-dark"
            >
              <ExternalLink size={14} /> View Full Study
            </a>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-medium text-white/85 ring-1 ring-white/20 hover:bg-white/20">
              <Share2 size={13} /> Share
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-medium text-white/85 ring-1 ring-white/20 hover:bg-white/20">
              <FileDown size={13} /> Export PDF
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-medium text-white/85 ring-1 ring-white/20 hover:bg-white/20">
              <Bookmark size={13} /> Save
            </button>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="container grid grid-cols-1 gap-6 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Reliability */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ss-muted">
              AI Evidence Analysis
            </div>
            <div className="mt-2">
              {analyzing || (!analysis && !hasReliability) ? (
                <ReliabilityPending />
              ) : merged._analysisError ? (
                <ReliabilityError />
              ) : hasReliability ? (
                <ReliabilityBadge
                  score={merged.reliability}
                  label={merged.reliabilityLabel}
                  note={merged.reliabilityNote}
                />
              ) : (
                <ReliabilityPending />
              )}
            </div>

            {merged.flags?.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {merged.flags.map((f) => (
                  <FlagPill key={f.label} label={f.label} tone={f.tone} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Funding trail (opened by default on detail page when applicable) */}
          {fundingWarn && (
            <div
              className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              style={{ borderLeft: '4px solid #964219' }}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-ss-amber">
                <AlertTriangle size={16} /> Funding & Conflict of Interest Report
              </div>
              <p className="mt-2 text-sm italic text-ss-muted">{merged.funding.note}</p>
              {merged.funding.funders?.length ? (
                <div className="mt-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ss-amber">Funders / Sponsors</div>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-ss-text">
                    {merged.funding.funders.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              ) : null}
              {merged.funding.authorConflicts?.length ? (
                <div className="mt-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ss-amber">Author Conflicts</div>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-ss-text">
                    {merged.funding.authorConflicts.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              ) : null}
              <div className="mt-4 text-[11px] italic text-ss-muted">
                Verify via <a href="https://openpaymentsdata.cms.gov/" target="_blank" rel="noreferrer noopener" className="underline">CMS Open Payments</a> · <a href="https://retractionwatch.com/" target="_blank" rel="noreferrer noopener" className="underline">Retraction Watch</a>
              </div>
            </div>
          )}

          {/* Plain language */}
          {merged.plain ? (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">
                In Plain Terms
              </div>
              <p className="mt-2 text-base leading-relaxed text-ss-text">{merged.plain}</p>
            </div>
          ) : null}

          {/* Abstract */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <button
              onClick={() => setAbsOpen((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">
                Original Abstract — Source: {merged.journal || merged.provider}
              </span>
              {absOpen ? <ChevronUp size={16} className="text-ss-muted" /> : <ChevronDown size={16} className="text-ss-muted" />}
            </button>
            {absOpen && (
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ss-text/90">
                {merged.abstract || 'No abstract available from source.'}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          {/* Metadata card */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">
              Study Metadata
            </div>
            <dl className="mt-3 space-y-2 text-[13px]">
              <MetaRow label="Year" value={merged.year} />
              <MetaRow label="Journal" value={merged.journal} />
              <MetaRow label="Authors" value={merged.authorsShort} />
              {merged.doi && <MetaRow label="DOI" value={<a href={`https://doi.org/${merged.doi}`} target="_blank" rel="noreferrer noopener" className="break-all text-ss-teal underline">{merged.doi}</a>} />}
              {merged.pmid && <MetaRow label="PMID" value={<a href={`https://pubmed.ncbi.nlm.nih.gov/${merged.pmid}/`} target="_blank" rel="noreferrer noopener" className="text-ss-teal underline">{merged.pmid}</a>} />}
              {merged.providers?.length ? <MetaRow label="Also found in" value={merged.providers.join(', ')} /> : null}
              {merged.aiProvider && <MetaRow label="Scored by" value={<span className="capitalize text-ss-muted">{merged.aiProvider}</span>} />}
            </dl>
          </div>

          {/* Related searches */}
          {merged.relatedSearches?.length ? (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ss-teal">
                Related Searches
              </div>
              <p className="mt-2 text-[11px] text-ss-muted">
                AI-generated follow-ups based on this study.
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {merged.relatedSearches.map((q) => (
                  <button
                    key={q}
                    onClick={() => runSearch(q)}
                    className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-left text-[12.5px] text-ss-teal hover:bg-ss-privacy-tint"
                  >
                    <Search size={11} className="mt-1 shrink-0 text-ss-muted" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Trust context */}
          <div className="rounded-xl bg-ss-privacy-tint p-5 ring-1 ring-ss-teal/20">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ss-teal">
              <Info size={12} /> How we score
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ss-teal/90">
              Every study gets an AI-generated reliability rating (1–5) based on study design, sample size, peer-review status, and disclosed conflicts. Scores are informational only; always verify with the original source.
            </p>
          </div>
        </aside>
      </section>

      <footer className="bg-[#0F2C30] py-8 text-white/70">
        <div className="container flex flex-col items-start justify-between gap-4 text-xs md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} SelfScience. Educational only. Not medical advice.</div>
          <nav className="flex gap-5">
            <a href="/about">About</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/reading-list">Reading List</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}

function FallbackShell({ children }) {
  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      <section className="relative bg-ss-teal pb-10 pt-24 text-white">
        <SiteNav variant="dark" />
      </section>
      <section className="container py-10">{children}</section>
    </main>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ss-border-warm/60 py-1.5 last:border-b-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ss-muted">{label}</span>
      <span className="text-right text-ss-text">{value || '—'}</span>
    </div>
  )
}
