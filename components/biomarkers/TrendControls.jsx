// /app/components/biomarkers/TrendControls.jsx
// Top-of-page toolbar: Save Snapshot · View History · Print Report · Export JSON.
// Everything is client-side; no data leaves the browser.

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookmarkPlus, History, Printer, Download, Trash2, X, Calendar, Loader2,
} from 'lucide-react'
import { addSnapshot, loadHistory, deleteSnapshot, exportHistoryJSON } from '@/lib/biomarkers/history'

export function TrendControls({ values, context, sex, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [entries, setEntries] = useState(() => loadHistory().entries)

  const hasValues = useMemo(() => Object.values(values || {}).some((v) => v !== '' && v != null), [values])

  const doSave = () => {
    if (!hasValues || saving) return
    setSaving(true)
    const dateISO = prompt('Snapshot date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10))
    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      setSaving(false)
      if (dateISO !== null) alert('Invalid date. Use YYYY-MM-DD format.')
      return
    }
    addSnapshot({ values, context, sex, dateISO })
    setEntries(loadHistory().entries)
    setSavedToast(`Saved snapshot for ${dateISO}`)
    onSaved?.()
    setSaving(false)
    setTimeout(() => setSavedToast(null), 2500)
  }

  const doDelete = (id) => {
    if (!confirm('Delete this snapshot? This cannot be undone.')) return
    deleteSnapshot(id)
    setEntries(loadHistory().entries)
  }

  const doExport = () => {
    const blob = new Blob([exportHistoryJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selfscience-biomarker-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const count = entries.length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={doSave}
        disabled={!hasValues || saving}
        className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        title={hasValues ? 'Save these values as a dated snapshot' : 'Enter values first'}
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <BookmarkPlus size={13} />}
        Save snapshot
      </button>

      <button
        type="button"
        onClick={() => setShowHistory(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-xs font-semibold text-ss-teal hover:bg-ss-bg"
      >
        <History size={13} /> History {count > 0 && <span className="rounded-full bg-ss-teal/10 px-1.5 text-[10px]">{count}</span>}
      </button>

      <Link
        href="/biomarkers/report"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-xs font-semibold text-ss-teal hover:bg-ss-bg"
      >
        <Printer size={13} /> Clinician report
      </Link>

      {savedToast && (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {savedToast}
        </span>
      )}

      {showHistory && (
        <HistoryModal
          entries={entries}
          onClose={() => setShowHistory(false)}
          onDelete={doDelete}
          onExport={doExport}
        />
      )}
    </div>
  )
}

function HistoryModal({ entries, onClose, onDelete, onExport }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-ss-border-warm/60 p-5">
          <div>
            <h3 className="text-lg font-extrabold text-ss-teal">Snapshot history</h3>
            <p className="text-xs text-ss-muted">
              Stored locally in your browser only. Never sent to a server.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm px-3 py-1.5 text-xs font-semibold text-ss-teal hover:bg-ss-bg"
              disabled={entries.length === 0}
            >
              <Download size={12} /> Export JSON
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 text-ss-muted hover:bg-ss-bg">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {entries.length === 0 ? (
            <div className="rounded-lg bg-ss-bg p-6 text-center text-sm text-ss-muted">
              No snapshots yet. Enter values, then click Save snapshot to capture your first dated entry.
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map((e) => {
                const count = Object.keys(e.values || {}).length
                return (
                  <li key={e.id} className="flex items-start justify-between gap-3 rounded-xl bg-ss-bg/60 p-3 ring-1 ring-ss-border-warm/60">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-ss-teal" />
                        <span className="font-mono text-sm font-bold text-ss-teal">{e.dateISO}</span>
                        <span className="text-[10px] uppercase tracking-widest text-ss-muted">{e.sex}</span>
                      </div>
                      <div className="mt-1 text-xs text-ss-muted">
                        {count} value{count === 1 ? '' : 's'} recorded
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {Object.entries(e.values).slice(0, 8).map(([bid, v]) => (
                          <span key={bid} className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] text-ss-text ring-1 ring-ss-border-warm">
                            {bid.replace(/_/g, ' ')}: {v}
                          </span>
                        ))}
                        {count > 8 && <span className="text-[10px] text-ss-muted">+ {count - 8} more</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(e.id)}
                      className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50"
                      title="Delete this snapshot"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrendControls
