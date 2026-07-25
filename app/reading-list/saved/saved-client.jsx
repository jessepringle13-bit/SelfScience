'use client'

// /app/app/reading-list/saved/saved-client.jsx
// Saved-items view — filters, sort, per-item notes, unsave, CSV export.
// Uses the new ss_reading_list store (lib/readingList.js), independent
// of the legacy /reading-list book/study experience.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, Download, ExternalLink, Pencil, Search } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import {
  useReadingList, unsaveItem, updateItemNotes, downloadListAsCsv, TYPE_META, fireToast,
} from '@/lib/readingList'

const TYPE_FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'research', label: 'Research' },
  { key: 'finding',  label: 'Findings' },
  { key: 'article',  label: 'Articles' },
  { key: 'trial',    label: 'Trials' },
  { key: 'digest',   label: 'Digest' },
]

const SORTS = [
  { key: 'recent',  label: 'Most recent' },
  { key: 'oldest',  label: 'Oldest first' },
  { key: 'pillar',  label: 'By pillar' },
  { key: 'type',    label: 'By type' },
]

function fmtDate(iso) {
  try {
    const d = new Date(iso)
    return `Saved ${d.toLocaleString('en-US', { month: 'short', day: 'numeric' })}`
  } catch { return '' }
}

export default function ReadingListSavedClient() {
  const list = useReadingList()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')

  const filtered = useMemo(() => {
    const base = filter === 'all' ? list : list.filter((x) => x.type === filter)
    const s = [...base]
    if (sort === 'recent') s.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
    if (sort === 'oldest') s.sort((a, b) => (a.savedAt || '').localeCompare(b.savedAt || ''))
    if (sort === 'pillar') s.sort((a, b) => (a.pillar || 'zzz').localeCompare(b.pillar || 'zzz'))
    if (sort === 'type')   s.sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    return s
  }, [list, filter, sort])

  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      <SiteNav />
      <main className="container py-8">
        <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>
          Saved for later
        </div>
        <h1 className="mt-1 text-[2rem] font-extrabold text-ss-text">Your Reading List</h1>
        <p className="mt-1 text-[0.95rem] text-ss-muted">
          Research, findings, and articles you have bookmarked — all in one place.
        </p>
        <div className="mt-2 font-mono text-[11px] text-ss-muted">
          {list.length} saved item{list.length === 1 ? '' : 's'}
        </div>

        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                      filter === f.key
                        ? 'border-ss-teal bg-ss-teal text-white'
                        : 'border-ss-border-warm bg-white text-ss-muted hover:border-ss-teal'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 font-mono text-[11px] text-ss-muted">
                Sort by:
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-md border border-ss-border-warm bg-white px-2 py-1 text-[11px] text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-teal/40"
                >
                  {SORTS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-3">
              {filtered.map((item) => (<SavedCard key={item.id} item={item} />))}
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white px-5 py-8 text-center text-[13px] text-ss-muted">
                  Nothing in this filter yet.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => downloadListAsCsv(list)}
              className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ss-teal hover:underline"
            >
              <Download size={13} /> Export Reading List as CSV
            </button>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

function SavedCard({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.research
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.notes || '')

  const handleUnsave = () => {
    unsaveItem(item.id)
    fireToast({ message: 'Removed from Reading List', tone: 'muted' })
  }

  const handleSaveNote = () => {
    updateItemNotes(item.id, draft)
    setEditing(false)
    fireToast({ message: 'Note saved', tone: 'success' })
  }

  return (
    <article className="flex flex-col gap-3 rounded-[14px] border border-ss-border-warm bg-white px-5 py-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2.5 py-[3px] font-mono text-[9px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text}`}>
            {meta.label}
          </span>
          {item.pillar && (
            <span className="inline-flex items-center rounded-full border border-ss-teal bg-white px-2.5 py-[3px] font-mono text-[9px] font-bold uppercase tracking-wider text-ss-teal">
              {item.pillar}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ss-muted">{fmtDate(item.savedAt)}</span>
          <button type="button" onClick={handleUnsave} className="text-ss-green hover:text-ss-red" aria-label="Remove from list" title="Remove">
            <BookmarkCheck size={16} fill="currentColor" />
          </button>
        </div>
      </div>

      <h3 className="line-clamp-2 text-[0.95rem] font-semibold text-ss-text">{item.title}</h3>
      {item.source && <div className="font-mono text-[10px] text-ss-muted">{item.source}</div>}
      {item.variantTag && (
        <span className="inline-flex w-fit items-center rounded-full bg-ss-green px-2.5 py-[3px] font-mono text-[10px] font-bold text-white">
          Matched: {item.variantTag}
        </span>
      )}

      {/* Notes */}
      <div>
        {!editing && !item.notes && (
          <button type="button" onClick={() => setEditing(true)} className="font-mono text-[10px] font-semibold text-ss-teal hover:underline">
            + Add a note
          </button>
        )}
        {!editing && item.notes && (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-ss-border-warm px-3 py-2">
            <div className="flex-1 text-[12.5px] text-ss-text">
              {item.notes.slice(0, 80)}{item.notes.length > 80 ? '…' : ''}
            </div>
            <button type="button" onClick={() => { setDraft(item.notes || ''); setEditing(true) }} className="inline-flex items-center gap-1 font-mono text-[10px] text-ss-teal hover:underline">
              <Pencil size={11} /> Edit
            </button>
          </div>
        )}
        {editing && (
          <div>
            <textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add your own notes about this item..."
              className="w-full rounded-lg border border-ss-teal bg-ss-bg px-3 py-2 text-[0.9rem] text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-teal/40"
            />
            <div className="mt-2 flex items-center gap-3">
              <button type="button" onClick={handleSaveNote} className="rounded-full border border-ss-teal bg-transparent px-4 py-1 text-[11px] font-semibold text-ss-teal hover:bg-ss-teal hover:text-white">
                Save note
              </button>
              <button type="button" onClick={() => setEditing(false)} className="font-mono text-[10px] text-ss-muted hover:text-ss-teal">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex w-fit items-center gap-1.5 font-mono text-[11px] font-semibold text-ss-teal hover:underline">
          {item.type === 'research' ? 'Read study' : item.type === 'trial' ? 'Open study' : item.type === 'finding' ? 'View finding' : 'Read'} <ExternalLink size={11} />
        </a>
      )}
    </article>
  )
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 text-center">
      <Bookmark size={48} className="text-ss-muted" aria-hidden="true" />
      <div className="text-lg font-bold text-ss-text">Nothing saved yet.</div>
      <p className="max-w-md text-[0.9rem] text-ss-muted">
        Tap the bookmark icon on any research paper, finding card, or article to save it here.
      </p>
      <Link href="/search" className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-ss-green px-4 py-2 text-[0.9rem] font-semibold text-white hover:bg-ss-green/90">
        <Search size={13} /> Explore research →
      </Link>
    </div>
  )
}
