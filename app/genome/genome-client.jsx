'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dna,
  Lock,
  Upload,
  Cloud,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
  Loader2,
  BookOpen,
  Download,
  Printer,
  FileText,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { parseGenomeFile } from '@/lib/genome-parser'
import { VARIANT_CATALOG, SAMPLE_VARIANTS } from '@/lib/variant-catalog'
import { trackEvent, EVENTS } from '@/lib/analytics'
import { getBooksForVariants, PILLAR_LABELS } from '@/lib/books'
import { buildGenomeMarkdown, downloadTextFile, buildVariantsCsv, reportFilename } from '@/lib/genome-report'

const PILLAR_COLOR = {
  Genomics: '#1B474D',
  Nutrition: '#2E7D32',
  Performance: '#C45820',
  Longevity: '#006494',
  Wellness: '#A12C7B',
}

const CLASSIFICATION_STYLE = {
  Strength:  { color: '#2E7D32', bg: '#E4F1E5', label: 'Positive' },
  Awareness: { color: '#964219', bg: '#FBEEE4', label: 'Be Aware' },
  Neutral:   { color: '#7A7974', bg: '#EFEEE9', label: 'Typical' },
}

export default function GenomeClient() {
  const router = useRouter()
  const inputRef = useRef(null)

  const [stage, setStage] = useState('upload') // upload | processing | results | error
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)
  const [variants, setVariants] = useState(null) // { rsid: gt }
  const [stats, setStats] = useState(null)       // { recognized, format }
  const [report, setReport] = useState(null)     // Gemini JSON
  const [activeTab, setActiveTab] = useState('overview')

  // Fire GA event exactly once when the results view first renders.
  const resultsTrackedRef = useRef(false)
  useEffect(() => {
    if (stage === 'results' && !resultsTrackedRef.current) {
      resultsTrackedRef.current = true
      trackEvent(EVENTS.GENOME_RESULTS_VIEWED, {
        variant_count: stats?.recognized ?? 0,
        file_format: (stats?.format || 'unknown').toString().slice(0, 32),
      })
    }
    if (stage === 'upload') {
      // Reset when the user starts over so a repeat run tracks again.
      resultsTrackedRef.current = false
    }
  }, [stage, stats])

  // Also track when the user switches to the Full Report / Roadmap tabs.
  useEffect(() => {
    if (stage !== 'results') return
    if (activeTab === 'overview') return
    trackEvent(EVENTS.GENOME_RESULTS_VIEWED, {
      tab: activeTab, // 'full' or 'roadmap'
      triggered_by: 'tab_switch',
    })
  }, [activeTab, stage])

  /**
   * Start a background ticker that steps the progress bar toward 95% over
   * ~40 seconds and rotates through descriptive status messages so the user
   * feels progress even though the API call takes 25-35 seconds.
   *
   * Returns a stop() function the caller invokes when the API returns.
   */
  const startProgressTicker = () => {
    const stages = [
      { at: 0,     pct: 8,  label: 'Reading your variants…' },
      { at: 1500,  pct: 20, label: 'Cross-referencing your recognized variants…' },
      { at: 4000,  pct: 34, label: 'Analyzing 9 research pillars…' },
      { at: 10000, pct: 52, label: 'Identifying strengths and awareness areas…' },
      { at: 18000, pct: 68, label: 'Cross-referencing landmark studies…' },
      { at: 26000, pct: 82, label: 'Building your personalized research roadmap…' },
      { at: 34000, pct: 90, label: 'Finalizing your report…' },
      { at: 44000, pct: 95, label: 'Almost there — putting it all together…' },
    ]
    const t0 = Date.now()
    let stopped = false

    const advance = () => {
      if (stopped) return
      const elapsed = Date.now() - t0
      // Find the last stage whose "at" is ≤ elapsed.
      let current = stages[0]
      for (const s of stages) if (s.at <= elapsed) current = s
      setProgress(current.pct)
      setProgressLabel(current.label)
    }

    advance()
    const iv = setInterval(advance, 900)
    return () => { stopped = true; clearInterval(iv) }
  }

  const runAnalysis = useCallback(async (parsed) => {
    setStage('processing')
    setVariants(parsed.variants)
    setStats(parsed.stats)
    const stopTicker = startProgressTicker()

    try {
      const res = await fetch('/api/interpret-genome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: parsed.variants }),
      })
      if (!res.ok) throw new Error(`Analysis failed (${res.status})`)
      const json = await res.json()
      // Attach the raw variant genotypes so downstream UI (like Recommended
      // Reading) can match against variantTriggers without another request.
      setReport({ ...json, _variants: parsed.variants || {} })
      stopTicker()
      setProgress(100)
      setProgressLabel('Report ready ✓')
      await sleep(300)
      setStage('results')
    } catch (err) {
      stopTicker()
      setErrorMsg(err.message || 'Analysis failed')
      setStage('error')
    }
  }, [])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    // Track only the fact that upload started + generic file format, NEVER the contents.
    const ext = (file.name || '').toLowerCase().split('.').pop()
    trackEvent(EVENTS.GENOME_UPLOAD_STARTED, {
      file_format: ['txt', 'vcf', 'zip', 'csv'].includes(ext) ? ext : 'other',
      source: 'file_picker',
    })
    setErrorMsg(null)
    setStage('processing')
    setProgress(5)
    setProgressLabel('Reading your file…')
    try {
      const parsed = await parseGenomeFile(file)
      if (!parsed.variants || Object.keys(parsed.variants).length === 0) {
        throw new Error(
          'We couldn’t find any recognized variants in this file. Make sure it’s a raw 23andMe / AncestryDNA / MyHeritage file.'
        )
      }
      await runAnalysis(parsed)
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.')
      setStage('error')
    }
  }, [runAnalysis])

  const handleSample = useCallback(async () => {
    await runAnalysis({
      variants: SAMPLE_VARIANTS,
      stats: { totalDataLines: 0, recognized: Object.keys(SAMPLE_VARIANTS).length, format: 'Sample data' },
    })
  }, [runAnalysis])

  const reset = () => {
    setStage('upload')
    setProgress(0)
    setProgressLabel('')
    setErrorMsg(null)
    setVariants(null)
    setStats(null)
    setReport(null)
    setActiveTab('overview')
  }

  const goSearch = (q, pillar) => {
    const usp = new URLSearchParams()
    usp.set('q', q)
    if (pillar) usp.set('pillar', pillar)
    router.push(`/search?${usp.toString()}`)
  }

  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      {/* Header */}
      <section className="relative bg-ss-teal pb-14 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/20">
              <Dna size={13} /> Personalized · Optional
            </div>
            <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">
              Your Genome. Your Research Starting Point.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/85 md:text-lg">
              Upload your raw DNA data from 23andMe, AncestryDNA, or a whole-genome service.
              SelfScience identifies your key genetic variants and builds a personalized research roadmap —
              processed entirely in your browser, never stored or transmitted.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy banner */}
      <section className="border-b border-ss-border-warm bg-ss-privacy-tint">
        <div className="container flex flex-col items-center justify-center gap-2 py-4 text-center text-sm text-ss-teal md:flex-row md:gap-3">
          <Lock size={16} />
          <span className="font-semibold">Your file never leaves your device.</span>
          <span className="text-ss-teal/80">
            No names. No storage. No exposure. Your session clears when you close this page.
          </span>
        </div>
      </section>

      {/* Stage: upload */}
      {stage === 'upload' && (
        <section className="container py-14">
          <div className="mx-auto max-w-3xl">
            <DropZone
              onFile={handleFile}
              inputRef={inputRef}
            />
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleSample}
                className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-5 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
              >
                <Sparkles size={14} /> Try with sample data instead
              </button>
              <p className="text-xs text-ss-muted">
                Runs the same flow using an anonymized demo genotype set.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Stage: processing */}
      {stage === 'processing' && (
        <section className="container py-20">
          <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
                <Dna size={26} className="animate-pulse" />
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="text-lg font-bold text-ss-teal">Processing your genome…</div>
              <div className="mt-1 text-sm text-ss-muted">{progressLabel}</div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-ss-border-warm/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ss-teal to-ss-orange transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-center text-xs text-ss-muted">
              Runs entirely in your browser. Only the variant list is sent to our AI.
            </p>
          </div>
        </section>
      )}

      {/* Stage: error */}
      {stage === 'error' && (
        <section className="container py-20">
          <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3 text-ss-amber">
              <AlertTriangle />
              <div className="text-lg font-bold">We couldn’t process that file</div>
            </div>
            <p className="mt-3 text-sm text-ss-text">{errorMsg}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-ss-teal px-5 py-2 text-sm font-semibold text-white hover:bg-ss-teal-dark"
              >
                <RotateCcw size={14} /> Try again
              </button>
              <button
                onClick={handleSample}
                className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-5 py-2 text-sm font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
              >
                <Sparkles size={14} /> Use sample data instead
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Stage: results */}
      {stage === 'results' && report && (
        <section className="container py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
                Your Personalized Research Roadmap
              </div>
              <h2 className="mt-1 text-2xl font-extrabold text-ss-teal md:text-3xl">
                {stats?.format === 'Sample data' ? 'Sample profile' : 'Your profile'}
              </h2>
              <p className="mt-1 text-sm text-ss-muted">
                {stats?.recognized} recognized variants · {stats?.format}
              </p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-4 py-2 text-xs font-semibold text-ss-muted transition hover:border-ss-teal hover:text-ss-teal"
            >
              <RotateCcw size={13} /> Analyze another file
            </button>
          </div>

          {/* --- Save Your Report --- */}
          <SaveReportCard report={report} variants={variants} stats={stats} />

          {report?._aiFallback && (
            <div className="ss-no-print mt-4 rounded-lg border border-[#F4C56E] bg-[#FFFBEA] p-3 text-xs text-[#7A5A00]">
              <strong>Note:</strong> Our AI analyzer was busy at the moment your report was generated, so this
              is a lighter variant-only view based on our curated variant catalog and your recognized rsIDs.
              You can re-run the analysis in a minute or two to get the full AI-generated interpretation.
            </div>
          )}

          {/* Tabs */}
          <div className="mt-8 flex flex-wrap gap-1 rounded-full bg-ss-surface p-1 ring-1 ring-ss-border-warm/70">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'full', label: 'Full Report' },
              { key: 'roadmap', label: 'Research Roadmap' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === t.key
                    ? 'bg-ss-teal text-white shadow-sm'
                    : 'text-ss-muted hover:text-ss-teal'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <div data-tab="overview" className={activeTab === 'overview' ? '' : 'ss-tab-hidden'}>
              <OverviewTab report={report} onSearch={goSearch} />
            </div>
            <div data-tab="full" className={activeTab === 'full' ? '' : 'ss-tab-hidden'}>
              <FullReportTab report={report} onSearch={goSearch} />
            </div>
            <div data-tab="roadmap" className={activeTab === 'roadmap' ? '' : 'ss-tab-hidden'}>
              <RoadmapTab report={report} onSearch={goSearch} />
            </div>
          </div>
        </section>
      )}

      {/* Sticky footer disclaimer */}
      <div className="sticky bottom-0 z-20 border-t border-ss-border-warm bg-white/95 backdrop-blur">
        <div className="container flex flex-col items-center justify-between gap-1 py-2.5 text-center text-[11px] text-ss-muted md:flex-row md:text-left">
          <span>
            For educational purposes only. This is not a medical diagnosis or health recommendation.
            Discuss health concerns with a qualified provider.
          </span>
          <span className="whitespace-nowrap">
            <Lock size={11} className="-mt-0.5 mr-1 inline" />
            Your data is session-only. Nothing is stored.
          </span>
        </div>
      </div>
    </main>
  )
}

/* ------------------------------ Drop zone -------------------------------- */

function DropZone({ onFile, inputRef }) {
  const [dragOver, setDragOver] = useState(false)

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) onFile(f)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white p-12 text-center transition ${
        dragOver ? 'border-ss-orange bg-ss-orange/5' : 'border-ss-border-warm'
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
        <Cloud size={24} />
      </div>
      <div className="mt-4 text-lg font-bold text-ss-teal">
        Drop your genome file here
      </div>
      <div className="mt-1 text-sm text-ss-muted">or click to browse</div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-ss-muted">
        <span className="rounded-full bg-ss-bg px-2 py-1 font-semibold">.txt</span>
        <span className="rounded-full bg-ss-bg px-2 py-1 font-semibold">.zip</span>
        <span className="rounded-full bg-ss-bg px-2 py-1 font-semibold">.vcf</span>
      </div>
      <div className="mt-3 text-[11px] text-ss-muted">
        Supported: 23andMe · AncestryDNA · MyHeritage · Whole Genome Sequencing
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.zip,.vcf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </div>
  )
}

/* ------------------------------ Tabs ------------------------------------- */

function OverviewCard({ item, tone, onSearch }) {
  const border = tone === 'strength' ? '#2E7D32' : '#964219'
  return (
    <div
      className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5"
      style={{ borderLeft: `4px solid ${border}` }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-ss-teal">{item.name}</div>
        <PillarBadge pillar={item.pillar} />
      </div>
      <p className="mt-1.5 text-sm text-ss-text">{item.plain}</p>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-ss-muted">
        <code className="rounded bg-ss-bg px-1.5 py-0.5 font-semibold">{item.gene}</code>
        <code className="rounded bg-ss-bg px-1.5 py-0.5">{item.rsid}</code>
        <span>·</span>
        <span className="font-semibold">{item.genotype}</span>
      </div>
      <button
        onClick={() => onSearch(`${item.gene} ${item.name}`, item.pillar)}
        className="mt-4 inline-flex w-fit items-center gap-1 text-xs font-semibold text-ss-teal hover:underline"
      >
        {tone === 'strength' ? 'Explore research' : 'Find research'} <ArrowRight size={12} />
      </button>
    </div>
  )
}

function OverviewTab({ report, onSearch }) {
  const s = report?.overview?.strengths || []
  const a = report?.overview?.areasToExplore || []
  const sys = report?.overview?.systemView
  return (
    <div className="space-y-10">
      <div>
        <SectionHeader
          icon={<ShieldCheck size={16} className="text-ss-green" />}
          title={`Your Genetic Strengths${s.length ? ` (${s.length})` : ''}`}
          hint="Variants generally associated with favorable traits in the literature."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {s.map((it, i) => (
            <OverviewCard key={i} item={it} tone="strength" onSearch={onSearch} />
          ))}
        </div>
      </div>
      <div>
        <SectionHeader
          icon={<Sparkles size={16} className="text-ss-amber" />}
          title={`Areas to Explore${a.length ? ` (${a.length})` : ''}`}
          hint="Every recognized variant worth understanding better — not a diagnosis or warning."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {a.map((it, i) => (
            <OverviewCard key={i} item={it} tone="aware" onSearch={onSearch} />
          ))}
        </div>
      </div>
      {sys && (
        <div className="rounded-xl bg-ss-teal/5 p-6 text-center italic text-ss-teal">
          “{sys}”
        </div>
      )}

      {/* Recommended Reading based on the user's actual variant genotypes */}
      <RecommendedBooks variants={report?._variants || {}} onSearch={onSearch} />
    </div>
  )
}

/** Renders books whose variantTriggers match the user's genotype (max 8). */
function RecommendedBooks({ variants, onSearch }) {
  const books = getBooksForVariants(variants)
  const empty = !variants || Object.keys(variants).length === 0
  return (
    <div>
      <SectionHeader
        icon={<BookOpen size={16} className="text-ss-teal" />}
        title="Based on Your Profile — Recommended Reading"
        hint="Books that connect directly to the research areas most relevant to your genetic variants."
      />
      {empty && (
        <div className="mt-4 rounded-xl bg-white p-6 ring-1 ring-black/5 text-sm text-ss-muted">
          Upload your genome file to get personalized book recommendations based on your specific genetic profile.
        </div>
      )}
      {!empty && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          {books.map((b) => (
            <div key={b.slug} className="flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="mb-2 flex flex-wrap gap-1">
                {b.pillar.slice(0, 2).map((p) => (
                  <span key={p} className="rounded-full bg-[#1B474D] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                    {PILLAR_LABELS[p]}
                  </span>
                ))}
                {b.universalRecommendation && (
                  <span className="rounded-full bg-[#C45820] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">Essential</span>
                )}
              </div>
              <div className="text-sm font-bold leading-snug text-[#28251D] line-clamp-2">{b.title}</div>
              <div className="mt-0.5 text-xs text-[#7A7974]">{b.author}</div>
              <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-[#28251D]">{b.plainReason}</p>
              <div className="mt-3 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onSearch?.(b.searchQueries[0], b.pillar[0])}
                  className="flex-1 rounded-full border border-[#1B474D] px-2 py-1.5 text-[10px] font-semibold text-[#1B474D] transition hover:bg-[#1B474D] hover:text-white"
                >
                  Find Research
                </button>
                <a
                  href={`/reading-list/${b.slug}`}
                  className="flex-1 rounded-full bg-[#C45820] px-2 py-1.5 text-center text-[10px] font-semibold text-white transition hover:bg-[#A5471A]"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function _FinishSpacer() {
  return null
}


function FullReportTab({ report, onSearch }) {
  const groups = report?.fullReport || []
  const [open, setOpen] = useState(() => new Set(groups.map((g, i) => (i === 0 ? g.pillar : null)).filter(Boolean)))
  const toggle = (pillar) => {
    const n = new Set(open)
    n.has(pillar) ? n.delete(pillar) : n.add(pillar)
    setOpen(n)
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const isOpen = open.has(g.pillar)
        return (
          <div key={g.pillar} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <button
              className="flex w-full items-center justify-between px-6 py-4 text-left"
              onClick={() => toggle(g.pillar)}
            >
              <div className="flex items-center gap-3">
                <PillarBadge pillar={g.pillar} />
                <span className="text-lg font-bold text-ss-teal">{g.pillar}</span>
                <span className="text-xs text-ss-muted">{g.variants?.length || 0} variants</span>
              </div>
              {isOpen ? <ChevronUp size={18} className="text-ss-muted" /> : <ChevronDown size={18} className="text-ss-muted" />}
            </button>
            {isOpen && (
              <div className="space-y-4 border-t border-ss-border-warm/60 bg-ss-surface p-6">
                {g.variants?.map((v, i) => (
                  <VariantCard key={i} variant={v} pillar={g.pillar} onSearch={onSearch} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VariantCard({ variant, pillar, onSearch }) {
  const cls = CLASSIFICATION_STYLE[variant.classification] || CLASSIFICATION_STYLE.Neutral
  return (
    <div className="rounded-lg bg-white p-4 ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-ss-teal">{variant.gene}</span>
          <code className="rounded bg-ss-bg px-1.5 py-0.5 text-[11px] font-semibold text-ss-muted">{variant.rsid}</code>
          <span className="text-sm font-semibold text-ss-text">{variant.genotype}</span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
          style={{ background: cls.bg, color: cls.color }}
        >
          {cls.label}
        </span>
      </div>
      <p className="mt-3 text-sm text-ss-text">{variant.explanation}</p>
      {variant.landmarkStudy ? (
        <p className="mt-2 text-xs italic text-ss-muted">Landmark study: {variant.landmarkStudy}</p>
      ) : null}
      {variant.searches?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {variant.searches.map((q) => (
            <button
              key={q}
              onClick={() => onSearch(q, pillar)}
              className="inline-flex items-center gap-1 rounded-full border border-ss-teal/30 bg-ss-privacy-tint px-3 py-1 text-[12px] font-medium text-ss-teal transition hover:border-ss-teal hover:bg-ss-teal hover:text-white"
            >
              {q} <ArrowRight size={11} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RoadmapTab({ report, onSearch }) {
  const roadmap = report?.researchRoadmap || []
  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-ss-muted">
        Based on your genetic profile, here are the research areas most relevant to your biology. Click any search to explore.
      </p>
      <div className="space-y-3">
        {roadmap.map((r) => (
          <div key={r.priority} className="flex gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
              style={{ background: PILLAR_COLOR[r.pillar] || '#1B474D' }}
            >
              {r.priority}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-ss-teal">{r.pillar}</span>
                <PillarBadge pillar={r.pillar} />
              </div>
              <p className="mt-1 text-sm text-ss-text">{r.why}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.searches?.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSearch(q, r.pillar)}
                    className="inline-flex items-center gap-1 rounded-full border border-ss-teal/30 bg-white px-3 py-1 text-[12px] font-medium text-ss-teal transition hover:border-ss-teal hover:bg-ss-teal hover:text-white"
                  >
                    {q} <ArrowRight size={11} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, hint }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-extrabold text-ss-teal">{title}</h3>
      </div>
      {hint && <p className="mt-1 text-xs text-ss-muted">{hint}</p>}
    </div>
  )
}

function PillarBadge({ pillar }) {
  const color = PILLAR_COLOR[pillar] || '#1B474D'
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ background: color }}
    >
      {pillar}
    </span>
  )
}

/**
 * Save-your-report card. Shows above the tabs on the results view.
 * Offers three download options: Markdown (full report), CSV (variants only),
 * and Print / Save-as-PDF (uses the browser print flow with our print CSS,
 * which expands all tabs and hides chrome).
 */
function SaveReportCard({ report, variants, stats }) {
  const books = getBooksForVariants(variants || {})

  const handleDownloadMd = () => {
    const md = buildGenomeMarkdown({ report, variants: variants || {}, stats, books })
    downloadTextFile(md, reportFilename('md'), 'text/markdown;charset=utf-8')
    trackEvent(EVENTS.GENOME_RESULTS_VIEWED, { action: 'download_md' })
  }

  const handleDownloadCsv = () => {
    const csv = buildVariantsCsv(variants || {}, stats)
    downloadTextFile(csv, reportFilename('csv'), 'text/csv;charset=utf-8')
    trackEvent(EVENTS.GENOME_RESULTS_VIEWED, { action: 'download_csv' })
  }

  const handlePrint = () => {
    // Expand every collapsible pillar block so nothing is hidden on the
    // printed page. We toggle a global document class that our print CSS
    // uses to force-open every <details> and unhide the sticky footer.
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('ss-print-mode')
      document.querySelectorAll('details').forEach((d) => { d.open = true })
    }
    setTimeout(() => {
      window.print()
      // Cleanup once print dialog closes. Browsers fire afterprint reliably.
      const cleanup = () => {
        document.documentElement.classList.remove('ss-print-mode')
        window.removeEventListener('afterprint', cleanup)
      }
      window.addEventListener('afterprint', cleanup)
    }, 60)
    trackEvent(EVENTS.GENOME_RESULTS_VIEWED, { action: 'print' })
  }

  return (
    <div className="ss-no-print mt-6 rounded-2xl border border-ss-border-warm bg-gradient-to-br from-ss-surface to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-ss-teal">Save your report</div>
            <div className="mt-0.5 text-xs text-ss-muted">
              We don&rsquo;t store your results. Download or print now so you have a copy for later research.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadMd}
            className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-xs font-semibold text-white transition hover:bg-ss-teal/90"
            title="Portable text file with your full report, links, and reading list"
          >
            <Download size={13} /> Download report (.md)
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-full border border-ss-teal bg-white px-4 py-2 text-xs font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
            title="Opens your browser's print dialog. Choose &quot;Save as PDF&quot; to keep a copy."
          >
            <Printer size={13} /> Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-4 py-2 text-xs font-semibold text-ss-muted transition hover:border-ss-teal hover:text-ss-teal"
            title="Just the recognized variants as a CSV — useful for spreadsheets or other tools"
          >
            <Download size={13} /> Variants (.csv)
          </button>
        </div>
      </div>
    </div>
  )
}


function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
