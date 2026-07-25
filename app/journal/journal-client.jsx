'use client'

// /app/app/journal/journal-client.jsx
// The full personal journal experience: list + timeline views, mood
// trend SVG chart, filter + search, exports.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Filter, Download, FileText, Search, PenLine, Trash2, Pencil,
  List, Clock, Star, Eye, MessageCircle, CheckCircle2, HelpCircle, ArrowLeft,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import {
  useJournal, TYPES, TYPE_META, formatFullDate, formatShortDate, relativeTime,
  groupByDay, moodSeries, topTags, downloadCsv, openPrintablePdf, deleteEntry,
} from '@/lib/journal'
import JournalEntryModal from '@/components/JournalEntryModal'
import ShareToCommunityButton from '@/components/community/ShareToCommunityButton'

const ICONS = { observation: Eye, reflection: MessageCircle, action: CheckCircle2, question: HelpCircle }

export default function JournalClient() {
  const entries = useJournal()
  const [view, setView] = useState('list') // 'list' | 'timeline'
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (tagFilter && !(e.tags || []).map((t) => t.toLowerCase()).includes(tagFilter.toLowerCase())) return false
      if (q) {
        const hay = [
          e.text,
          e.findingName,
          e.actionCategory,
          ...(e.tags || []),
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [entries, typeFilter, tagFilter, query])

  const stats = useMemo(() => {
    const withMood = entries.filter((e) => Number.isFinite(e.moodRating))
    const avg = withMood.length ? (withMood.reduce((a, b) => a + b.moodRating, 0) / withMood.length) : null
    const counts = TYPES.reduce((acc, t) => {
      acc[t] = entries.filter((e) => e.type === t).length
      return acc
    }, {})
    return { total: entries.length, avgMood: avg, counts }
  }, [entries])

  const series = useMemo(() => moodSeries(entries, 30), [entries])
  const tags = useMemo(() => topTags(entries), [entries])

  const groups = useMemo(() => groupByDay(filtered, { ascending: false }), [filtered])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24">
      <SiteNav />
      <div className="container pt-24 md:pt-28">
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">Your Journal</div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">Progress Timeline</h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              Your longitudinal record of observations, reflections, actions, and questions. Everything here lives only on your device.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white hover:bg-ss-teal-dark"
            >
              <PenLine size={14} /> New entry
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total entries" value={stats.total} />
          <StatCard label="Avg mood (all-time)" value={stats.avgMood ? `${stats.avgMood.toFixed(1)}/5` : '—'} />
          <StatCard label="Actions" value={stats.counts.action || 0} accent="text-ss-green" />
          <StatCard label="Questions" value={stats.counts.question || 0} accent="text-ss-orange" />
        </div>

        {/* Mood chart */}
        {entries.some((e) => Number.isFinite(e.moodRating)) && (
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>
                  Mood trend
                </div>
                <h2 className="text-base font-extrabold text-ss-text">Last 30 days</h2>
              </div>
            </div>
            <MoodChart data={series} />
          </section>
        )}

        {/* Toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border border-ss-border-warm bg-white">
            <ViewBtn active={view === 'list'} onClick={() => setView('list')} Icon={List} label="List" />
            <ViewBtn active={view === 'timeline'} onClick={() => setView('timeline')} Icon={Clock} label="Timeline" />
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ss-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries…"
              className="w-full rounded-full border border-ss-border-warm bg-white py-2 pl-8 pr-3 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!filtered.length}
              onClick={() => downloadCsv(filtered)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filtered.length ? 'border-ss-teal text-ss-teal hover:bg-ss-teal hover:text-white' : 'border-ss-border-warm text-ss-muted opacity-60'
              }`}
            >
              <Download size={12} /> CSV
            </button>
            <button
              type="button"
              disabled={!filtered.length}
              onClick={() => openPrintablePdf(filtered)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filtered.length ? 'border-ss-teal text-ss-teal hover:bg-ss-teal hover:text-white' : 'border-ss-border-warm text-ss-muted opacity-60'
              }`}
            >
              <FileText size={12} /> PDF
            </button>
          </div>
        </div>

        {/* Type filter chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.14em' }}>
            <Filter size={11} className="mr-1 inline-block" /> Type:
          </span>
          <FilterChip label="All" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          {TYPES.map((t) => (
            <FilterChip
              key={t}
              label={TYPE_META[t].label}
              tone={TYPE_META[t].accent}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            />
          ))}
        </div>

        {/* Tag filter */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.14em' }}>Tags:</span>
            <FilterChip label="All" active={!tagFilter} onClick={() => setTagFilter('')} />
            {tags.map(({ tag, count }) => (
              <FilterChip
                key={tag}
                label={`#${tag} · ${count}`}
                active={tagFilter === tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <EmptyState hasEntries={entries.length > 0} onNew={() => setAddOpen(true)} />
          ) : view === 'list' ? (
            <ul className="space-y-3">
              {filtered.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  onEdit={() => setEditing(e)}
                  onDelete={() => {
                    if (confirm('Delete this journal entry?')) deleteEntry(e.id)
                  }}
                />
              ))}
            </ul>
          ) : (
            <Timeline
              groups={groups}
              onEdit={(e) => setEditing(e)}
              onDelete={(e) => { if (confirm('Delete this journal entry?')) deleteEntry(e.id) }}
            />
          )}
        </div>

        {/* Footer note */}
        <div className="mt-10 rounded-2xl border-l-4 border-ss-teal bg-white/70 p-4">
          <p className="text-sm text-ss-muted">
            <span className="font-semibold text-ss-teal">100% private.</span> Your journal never touches a server. Clearing browser data will remove it — export a copy to keep it forever.
          </p>
        </div>
      </div>

      {addOpen && <JournalEntryModal onClose={() => setAddOpen(false)} />}
      {editing && (
        <JournalEntryModal
          editing={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

/* --------------------------- Sub-components ------------------------- */

function StatCard({ label, value, accent = 'text-ss-teal' }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.14em' }}>{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${accent}`}>{value}</div>
    </div>
  )
}

function ViewBtn({ active, onClick, Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition ${
        active ? 'bg-ss-teal text-white' : 'text-ss-muted hover:bg-ss-bg hover:text-ss-teal'
      }`}
    >
      <Icon size={12} /> {label}
    </button>
  )
}

function FilterChip({ label, active, onClick, tone = null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
        active
          ? 'border-ss-teal bg-ss-teal text-white'
          : `border-ss-border-warm ${tone || 'text-ss-muted'} hover:border-ss-teal/30 hover:text-ss-teal`
      }`}
    >
      {label}
    </button>
  )
}

function EmptyState({ hasEntries, onNew }) {
  return (
    <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white/60 p-10 text-center">
      <BookOpen size={28} className="mx-auto text-ss-muted" />
      <h3 className="mt-3 text-lg font-extrabold text-ss-text">
        {hasEntries ? 'No entries match those filters' : 'Your journal is empty'}
      </h3>
      <p className="mt-1 text-sm text-ss-muted">
        {hasEntries
          ? 'Try clearing filters or searching a different keyword.'
          : 'Start capturing observations, actions, and questions. Everything stays private on your device.'}
      </p>
      <button
        type="button"
        onClick={onNew}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white hover:bg-ss-teal-dark"
      >
        <PenLine size={14} /> Add your first entry
      </button>
    </div>
  )
}

function EntryCard({ entry, onEdit, onDelete }) {
  const meta = TYPE_META[entry.type] || TYPE_META.reflection
  const Icon = ICONS[entry.type] || MessageCircle
  return (
    <li className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${meta.softBg} ${meta.accent}`}>
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-[9px] font-bold uppercase ${meta.accent}`} style={{ letterSpacing: '0.14em' }}>
              {meta.label}
            </span>
            <span className="text-[11px] text-ss-muted">{formatShortDate(entry.createdAt)} · {relativeTime(entry.createdAt)}</span>
            {entry.moodRating ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ss-amber">
                <Star size={11} fill="currentColor" strokeWidth={0} /> {entry.moodRating}/5
              </span>
            ) : null}
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit entry"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-teal"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete entry"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-red"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {entry.findingName && (
            <div className="mt-1 text-[11px] text-ss-muted">
              Finding: <span className="font-semibold text-ss-teal">{entry.findingName}</span>
            </div>
          )}
          {entry.actionCategory && (
            <div className="mt-1 text-[11px] text-ss-muted">
              Category: <span className="font-semibold text-ss-green">{entry.actionCategory}</span>
            </div>
          )}
          <p className="mt-2 whitespace-pre-wrap text-sm text-ss-text">{entry.text}</p>
          {(entry.tags || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.tags.map((t) => (
                <span key={t} className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">#{t}</span>
              ))}
            </div>
          )}
          {/* Share-to-community affordance. Auto-hidden if the user is
              not opted in to the community. */}
          <div className="mt-3 flex items-center gap-3">
            <ShareToCommunityButton
              initialText={entry.text || ''}
              pillar={null}
              label="Share this reflection"
            />
          </div>
        </div>
      </div>
    </li>
  )
}

function Timeline({ groups, onEdit, onDelete }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-px bg-ss-border-warm/70" aria-hidden="true" />
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.dateKey} className="relative pl-10">
            <div className="absolute left-[9px] top-1 h-3 w-3 rounded-full bg-ss-teal ring-4 ring-ss-bg" aria-hidden="true" />
            <h3 className="mb-2 text-sm font-extrabold text-ss-teal">{g.dateLabel}</h3>
            <ul className="space-y-2">
              {g.entries.map((e) => (
                <TimelineEntry key={e.id} entry={e} onEdit={() => onEdit(e)} onDelete={() => onDelete(e)} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineEntry({ entry, onEdit, onDelete }) {
  const meta = TYPE_META[entry.type] || TYPE_META.reflection
  const Icon = ICONS[entry.type] || MessageCircle
  return (
    <li className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${meta.softBg} ${meta.accent}`}>
          <Icon size={12} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-[9px] font-bold uppercase ${meta.accent}`} style={{ letterSpacing: '0.14em' }}>
              {meta.label}
            </span>
            {entry.moodRating ? <span className="text-[10px] font-semibold text-ss-amber">Mood {entry.moodRating}/5</span> : null}
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={onEdit} aria-label="Edit" className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-teal">
                <Pencil size={11} />
              </button>
              <button type="button" onClick={onDelete} aria-label="Delete" className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-red">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
          {entry.findingName && <div className="mt-0.5 text-[10.5px] text-ss-muted">Finding: <span className="font-semibold text-ss-teal">{entry.findingName}</span></div>}
          {entry.actionCategory && <div className="mt-0.5 text-[10.5px] text-ss-muted">Category: <span className="font-semibold text-ss-green">{entry.actionCategory}</span></div>}
          <p className="mt-1 whitespace-pre-wrap text-[13px] text-ss-text">{entry.text}</p>
          {(entry.tags || []).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {entry.tags.map((t) => (
                <span key={t} className="rounded-full bg-ss-teal/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-ss-teal">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function MoodChart({ data }) {
  // Simple SVG line chart. Width scales; height fixed.
  const width = 100 // viewBox units (percentage-like)
  const height = 28
  const padTop = 3, padBottom = 5
  const drawable = height - padTop - padBottom
  const N = data.length
  const yFor = (v) => padTop + drawable - ((v - 1) / 4) * drawable
  const xFor = (i) => (N === 1 ? width / 2 : (i / (N - 1)) * width)

  // Build path skipping nulls
  const pts = data.map((d, i) => (d.value == null ? null : { x: xFor(i), y: yFor(d.value), value: d.value, i }))
  const segments = []
  let current = []
  for (const p of pts) {
    if (p == null) {
      if (current.length) segments.push(current)
      current = []
    } else {
      current.push(p)
    }
  }
  if (current.length) segments.push(current)

  const linePath = segments
    .map((seg) => seg.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' '))
    .join(' ')

  const areaPath = segments
    .map((seg) => {
      if (seg.length < 2) return ''
      const start = seg[0], end = seg[seg.length - 1]
      const line = seg.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
      return `${line} L ${end.x.toFixed(2)} ${padTop + drawable} L ${start.x.toFixed(2)} ${padTop + drawable} Z`
    })
    .join(' ')

  const first = data[0]
  const last = data[data.length - 1]

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-40 w-full" aria-label="Mood trend for the last 30 days">
        {/* Gridlines for mood 1,3,5 */}
        {[1, 3, 5].map((v) => (
          <line
            key={v}
            x1={0}
            x2={width}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="#D4D1CA"
            strokeWidth={0.15}
            strokeDasharray="0.6 0.6"
          />
        ))}
        {areaPath && <path d={areaPath} fill="#964219" fillOpacity={0.12} />}
        {linePath && <path d={linePath} fill="none" stroke="#964219" strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />}
        {pts.filter(Boolean).map((p) => (
          <circle key={p.i} cx={p.x} cy={p.y} r={0.55} fill="#964219" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ss-muted">
        <span>{first ? formatShortDate(first.dateKey) : ''}</span>
        <span>Higher = better mood (5)</span>
        <span>{last ? formatShortDate(last.dateKey) : ''}</span>
      </div>
    </div>
  )
}
