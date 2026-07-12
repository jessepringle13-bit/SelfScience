// /app/app/admin/articles/import/page.jsx
// CSV bulk import wizard.
// 1. User picks a .csv file
// 2. Parse client-side with papaparse
// 3. Validate each row and show preview table with red highlights
// 4. User confirms → POST /api/admin/articles/import (drafts only)
// 5. Show summary

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import {
  Upload, ChevronLeft, Loader2, CheckCircle2, AlertTriangle, X,
} from 'lucide-react'
import AdminGate from '@/components/admin/AdminGate'
import { EDITORIAL_PILLARS } from '@/lib/supabase/pillar-map'
import { isValidSlug, slugify } from '@/lib/slugify'

const REQUIRED_HEADERS = [
  'title', 'slug', 'authors', 'journal', 'publish_date',
  'abstract', 'plain_terms_summary', 'doi', 'source_url', 'cover_image_url',
  'pillars', 'tags', 'ai_reliability_score', 'evidence_quality',
]
const EVIDENCE = new Set(['Settled', 'Emerging', 'Preliminary', 'Conflicting'])
const PILLAR_SET = new Set(EDITORIAL_PILLARS)

export default function ImportCsvPage() {
  return (
    <AdminGate title="Import CSV" backHref="/admin/articles">
      <ImportWizard />
    </AdminGate>
  )
}

function ImportWizard() {
  const router = useRouter()
  const [parsed, setParsed] = useState(null) // { rows, headerErrors }
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const onFile = (e) => {
    setParseError(null); setResult(null)
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => (h || '').trim(),
      complete: (results) => {
        if (results?.errors?.length) {
          const first = results.errors[0]
          setParseError(`CSV parse error on row ${first.row}: ${first.message}`)
          return
        }
        const headers = results.meta?.fields || []
        const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
        const extra = headers.filter((h) => !REQUIRED_HEADERS.includes(h))
        const rows = (results.data || []).map((r, i) => validateRow(r, i))
        setParsed({ rows, headerErrors: { missing, extra } })
      },
      error: (err) => setParseError(err?.message || 'Failed to parse CSV.'),
    })
  }

  const validRows = useMemo(() => (parsed?.rows || []).filter((r) => r.errors.length === 0), [parsed])
  const erroredRows = useMemo(() => (parsed?.rows || []).filter((r) => r.errors.length > 0), [parsed])

  async function doImport() {
    if (!validRows.length) return
    setImporting(true); setResult(null)
    try {
      const res = await fetch('/api/admin/articles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows.map((r) => r.data) }),
      })
      const j = await res.json()
      setResult({ ok: res.ok, ...j })
    } catch (e) {
      setResult({ ok: false, error: e?.message || 'Import failed' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import Articles from CSV</h1>
          <p className="text-sm text-slate-400">All imported articles are saved as drafts (not published, not featured).</p>
        </div>
        <Link href="/admin/articles" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <ChevronLeft size={12} /> Back to articles
        </Link>
      </div>

      {/* File picker */}
      {!parsed && !result && (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
          <Upload size={22} className="mx-auto mb-3 text-slate-400" />
          <div className="text-sm text-slate-300">Choose a .csv file with the required columns.</div>
          <div className="mt-1 text-xs text-slate-500">
            Required headers: {REQUIRED_HEADERS.map((h) => <code key={h} className="mx-0.5 rounded bg-slate-800/70 px-1 py-0.5 text-[10px] text-slate-300">{h}</code>)}
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="mt-4 block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-teal-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-400"
          />
          <div className="mt-3 text-xs text-slate-500">
            pillars / tags: pipe-separated (e.g. <code>Genomics|Nutrition</code>) ·
            evidence_quality: Settled | Emerging | Preliminary | Conflicting ·
            ai_reliability_score: 0–100
          </div>
        </div>
      )}

      {parseError && (
        <div className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/40">
          {parseError}
        </div>
      )}

      {/* Header errors */}
      {parsed?.headerErrors?.missing?.length > 0 && (
        <div className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-300 ring-1 ring-amber-500/40">
          Missing required columns: {parsed.headerErrors.missing.join(', ')}
        </div>
      )}
      {parsed?.headerErrors?.extra?.length > 0 && (
        <div className="mb-4 rounded-md bg-slate-500/10 px-3 py-2 text-xs text-slate-400">
          Ignored extra columns: {parsed.headerErrors.extra.join(', ')}
        </div>
      )}

      {/* Preview table */}
      {parsed && !result && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="text-slate-300">
              {parsed.rows.length} parsed · <span className="text-teal-300">{validRows.length} valid</span>
              {erroredRows.length > 0 && <> · <span className="text-rose-300">{erroredRows.length} with errors</span></>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setParsed(null); setResult(null) }}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!validRows.length || importing}
                onClick={doImport}
                className="inline-flex items-center gap-1.5 rounded-md bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-400 disabled:opacity-40"
              >
                {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Import {validRows.length} valid row{validRows.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-xs">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">Status</th>
                  <th className="px-2 py-1.5 text-left">Title</th>
                  <th className="px-2 py-1.5 text-left">Slug</th>
                  <th className="px-2 py-1.5 text-left">Pillars</th>
                  <th className="px-2 py-1.5 text-left">Score</th>
                  <th className="px-2 py-1.5 text-left">Evidence</th>
                  <th className="px-2 py-1.5 text-left">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {parsed.rows.map((r) => (
                  <tr key={r.index} className={r.errors.length ? 'bg-rose-500/10' : ''}>
                    <td className="px-2 py-1.5 text-slate-500">{r.index + 1}</td>
                    <td className="px-2 py-1.5">
                      {r.errors.length
                        ? <span className="inline-flex items-center gap-1 text-rose-300"><AlertTriangle size={11} /> skip</span>
                        : <span className="inline-flex items-center gap-1 text-teal-300"><CheckCircle2 size={11} /> ok</span>}
                    </td>
                    <td className="px-2 py-1.5 text-slate-200 line-clamp-1">{r.data.title || <span className="text-slate-500">(missing)</span>}</td>
                    <td className="px-2 py-1.5 text-slate-400"><code className="rounded bg-slate-800/70 px-1 text-[10px]">{r.data.slug || '—'}</code></td>
                    <td className="px-2 py-1.5 text-slate-300">{(r.data.pillars || []).join(', ') || '—'}</td>
                    <td className="px-2 py-1.5 text-slate-300">{r.data.ai_reliability_score ?? '—'}</td>
                    <td className="px-2 py-1.5 text-slate-300">{r.data.evidence_quality || '—'}</td>
                    <td className="px-2 py-1.5 text-rose-300">{r.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className={`rounded-md px-4 py-3 ${
            result.ok
              ? 'bg-teal-500/15 text-teal-200 ring-1 ring-teal-500/40'
              : 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40'
          }`}>
            <div className="font-semibold">
              {result.ok
                ? `✓ Imported ${result.inserted} article${result.inserted === 1 ? '' : 's'} as drafts`
                : `Import failed`}
            </div>
            {typeof result.skipped === 'number' && result.skipped > 0 && (
              <div className="mt-1 text-sm">{result.skipped} row{result.skipped === 1 ? '' : 's'} skipped.</div>
            )}
            {result.error && <div className="mt-1 text-sm">{result.error}</div>}
          </div>

          {Array.isArray(result.errors) && result.errors.length > 0 && (
            <div className="rounded-md border border-slate-800">
              <div className="border-b border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300">
                Row errors ({result.errors.length})
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-800 text-xs">
                  <tbody className="divide-y divide-slate-800">
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 text-slate-500">row {e.row ?? '?'}</td>
                        <td className="px-3 py-1.5 text-slate-400"><code>{e.slug || '—'}</code></td>
                        <td className="px-3 py-1.5 text-rose-300">{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => router.replace('/admin/articles?imported=1')}
              className="rounded-md bg-teal-500 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-400"
            >
              Back to articles
            </button>
            <button
              onClick={() => { setParsed(null); setResult(null) }}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------- CSV row validation --------------------------- */

function splitPipe(v) {
  return String(v || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function validateRow(raw, index) {
  const errors = []

  const title = (raw.title || '').trim()
  if (!title) errors.push('title required')

  let slug = (raw.slug || '').trim().toLowerCase()
  if (!slug && title) slug = slugify(title)
  if (!slug) errors.push('slug required')
  else if (!isValidSlug(slug)) errors.push('slug must be lowercase alnum + hyphens')

  const pillars = splitPipe(raw.pillars)
  const badPillars = pillars.filter((p) => !PILLAR_SET.has(p))
  if (badPillars.length) errors.push(`invalid pillar(s): ${badPillars.join(', ')}`)

  const tags = splitPipe(raw.tags)

  let score = null
  if ((raw.ai_reliability_score || '').toString().trim() !== '') {
    const n = Number(raw.ai_reliability_score)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 100) {
      errors.push('ai_reliability_score must be integer 0–100')
    } else score = n
  }

  const evidence = (raw.evidence_quality || '').trim()
  if (evidence && !EVIDENCE.has(evidence)) errors.push('invalid evidence_quality')

  const data = {
    title, slug,
    authors:             (raw.authors || '').trim() || null,
    journal:             (raw.journal || '').trim() || null,
    publish_date:        (raw.publish_date || '').trim() || null,
    abstract:            (raw.abstract || '').trim() || null,
    plain_terms_summary: (raw.plain_terms_summary || '').trim() || null,
    doi:                 (raw.doi || '').trim() || null,
    source_url:          (raw.source_url || '').trim() || null,
    cover_image_url:     (raw.cover_image_url || '').trim() || null,
    pillars: pillars.filter((p) => PILLAR_SET.has(p)),
    tags,
    ai_reliability_score: score,
    evidence_quality:     evidence || null,
  }

  return { index, data, errors }
}
