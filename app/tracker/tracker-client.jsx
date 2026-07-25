'use client'

// /app/app/tracker/tracker-client.jsx
// Full habit tracker experience: suggestions, daily check-in, progress
// view (90-day heatmap), stats, insights, CSV export.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plus, ArrowLeft, ArrowRight, MoreVertical, Trash2, Pencil, Archive,
  Undo2, Download, CheckCircle2, Circle, ClipboardList, X, Sparkles, Lightbulb,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import HabitEditorModal from '@/components/tracker/HabitEditorModal'
import {
  useHabits, CATEGORY_META, FREQUENCIES, dateKey, addDays, daysDiff,
  toggleCheckIn, setNote, streakFor, bestStreak, completionOverWindow,
  archiveHabit, restoreHabit, deleteHabit, generateInsights, summaryStats,
  getHabitSuggestions, suggestionsShown, markSuggestionsShown, addHabit,
  downloadCsv, formatLongDate, formatShortDate, isEditableDate,
} from '@/lib/habits'

export default function TrackerClient() {
  const habits = useHabits()
  const [view, setView] = useState('daily') // 'daily' | 'progress'
  const [selectedDate, setSelectedDate] = useState(dateKey())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [prefill, setPrefill] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [amberToast, setAmberToast] = useState(null)

  const active = useMemo(() => habits.filter((h) => h.isActive !== false), [habits])
  const archived = useMemo(() => habits.filter((h) => h.isActive === false), [habits])
  const doneToday = useMemo(() => active.filter((h) => (h.checkIns || []).includes(selectedDate)).length, [active, selectedDate])

  const [showSuggestions, setShowSuggestions] = useState(false)
  useEffect(() => {
    // Show suggestions grid on first visit only.
    setShowSuggestions(!suggestionsShown() && active.length === 0)
  }, [active.length])

  const openNew = () => { setEditing(null); setPrefill(null); setEditorOpen(true) }

  const handleAddSuggestion = (s) => {
    const { ok, error } = addHabit({
      name: s.name, category: s.category, frequency: s.frequency,
      why: s.why, variantSource: s.gene || null,
      color: CATEGORY_META[s.category]?.color || '#2E7D32',
    })
    if (!ok && error === 'max') showAmber('You have reached the maximum of 20 active habits. Archive one to add another.')
  }

  const showAmber = (msg) => {
    setAmberToast(msg)
    setTimeout(() => setAmberToast(null), 4000)
  }

  const dismissSuggestions = () => {
    markSuggestionsShown()
    setShowSuggestions(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24">
      <SiteNav />
      <div className="container pt-24 md:pt-28">
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
          <ArrowLeft size={12} /> Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>
              Daily check-in
            </div>
            <h1 className="mt-1 text-3xl font-extrabold text-ss-text md:text-4xl">Your Habit Tracker</h1>
            <p className="mt-1 text-sm text-ss-muted">{formatLongDate(selectedDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing done={doneToday} total={active.length} />
            <button type="button" onClick={openNew}
              className="inline-flex items-center gap-1.5 rounded-full bg-ss-green px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              <Plus size={14} /> New habit
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <SuggestionsPanel
            onAdd={handleAddSuggestion}
            onCustomize={(s) => { setEditing(null); setPrefill({
              name: s.name, category: s.category, frequency: s.frequency,
              why: s.why, gene: s.gene || null,
              color: CATEGORY_META[s.category]?.color,
            }); setEditorOpen(true) }}
            onDismiss={dismissSuggestions}
          />
        )}

        {/* View toggle */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded-full border border-ss-border-warm bg-white">
            <ViewBtn active={view === 'daily'} onClick={() => setView('daily')} label="Daily check-in" />
            <ViewBtn active={view === 'progress'} onClick={() => setView('progress')} label="Progress view" />
          </div>
          {view === 'daily' && (
            <DateNav date={selectedDate} onChange={setSelectedDate} />
          )}
        </div>

        {/* Body */}
        <div className="mt-6">
          {active.length === 0 && !showSuggestions ? (
            <EmptyState onNew={openNew} />
          ) : view === 'daily' ? (
            <DailyView
              habits={active}
              dateKeyStr={selectedDate}
              onEdit={(h) => { setEditing(h); setPrefill(null); setEditorOpen(true) }}
              onArchive={(h) => archiveHabit(h.id)}
              onDelete={(h) => deleteHabit(h.id)}
            />
          ) : (
            <ProgressView habits={active} />
          )}
        </div>

        {/* Archived section */}
        {archived.length > 0 && (
          <div className="mt-8">
            <button type="button" onClick={() => setShowArchived((v) => !v)} className="font-mono text-[11px] font-semibold text-ss-teal hover:underline">
              {showArchived ? 'Hide archived habits' : `View archived habits (${archived.length})`}
            </button>
            {showArchived && (
              <ul className="mt-3 space-y-2">
                {archived.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 rounded-lg border border-ss-border-warm/60 bg-white p-3">
                    <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: h.color }} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ss-text">{h.name}</span>
                    <button type="button" onClick={() => restoreHabit(h.id)} className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
                      <Undo2 size={11} /> Restore
                    </button>
                    <button type="button" onClick={() => { if (confirm('Delete permanently?')) deleteHabit(h.id) }} className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-ss-red hover:underline">
                      <Trash2 size={11} /> Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CSV export */}
        {habits.some((h) => (h.checkIns || []).length > 0) && (
          <div className="mt-10">
            <button type="button" onClick={() => downloadCsv(habits)} className="inline-flex items-center gap-1.5 rounded-full border border-ss-teal px-4 py-1.5 text-xs font-semibold text-ss-teal hover:bg-ss-teal hover:text-white">
              <Download size={12} /> Export habit data as CSV
            </button>
          </div>
        )}

        <div className="mt-10 rounded-2xl border-l-4 border-ss-teal bg-white/70 p-4">
          <p className="text-sm text-ss-muted">
            <span className="font-semibold text-ss-teal">100% private.</span> Habit data stays on your device — no server ever sees your check-ins.
          </p>
        </div>
      </div>

      {editorOpen && (
        <HabitEditorModal
          initial={editing}
          prefill={prefill}
          onClose={() => { setEditorOpen(false); setEditing(null); setPrefill(null) }}
          onSaved={() => {}}
        />
      )}
      {amberToast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-ss-amber px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {amberToast}
        </div>
      )}
    </div>
  )
}

/* ============================ Sub-components ============================ */

function ProgressRing({ done, total }) {
  const size = 56, r = 24, c = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} stroke="#D4D1CA" strokeWidth={5} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r} stroke="#2E7D32" strokeWidth={5} fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1B474D" fontFamily="Inter">{done}/{total || 0}</text>
    </svg>
  )
}

function ViewBtn({ active, onClick, label }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`px-4 py-1.5 text-xs font-semibold transition ${active ? 'bg-ss-teal text-white' : 'text-ss-muted hover:bg-ss-bg hover:text-ss-teal'}`}
    >{label}</button>
  )
}

function DateNav({ date, onChange }) {
  const isToday = date === dateKey()
  const go = (delta) => {
    const next = dateKey(addDays(new Date(date + 'T12:00:00'), delta))
    onChange(next)
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-ss-border-warm bg-white px-3 py-1.5">
      <button type="button" onClick={() => go(-1)} aria-label="Previous day" className="text-ss-muted hover:text-ss-teal">
        <ArrowLeft size={12} />
      </button>
      <button type="button" onClick={() => onChange(dateKey())} className="font-mono text-[11px] font-semibold text-ss-teal">
        {isToday ? 'Today' : formatShortDate(date)}
      </button>
      <button type="button" onClick={() => go(1)} disabled={isToday} aria-label="Next day"
        className={`transition ${isToday ? 'cursor-not-allowed text-ss-border-warm' : 'text-ss-muted hover:text-ss-teal'}`}
      >
        <ArrowRight size={12} />
      </button>
    </div>
  )
}

function EmptyState({ onNew }) {
  return (
    <div className="rounded-2xl border border-dashed border-ss-border-warm bg-white/60 p-10 text-center">
      <ClipboardList size={28} className="mx-auto text-ss-muted" />
      <h3 className="mt-3 text-lg font-extrabold text-ss-text">No habits yet</h3>
      <p className="mt-1 text-sm text-ss-muted">Create genome-informed habits and start tracking your consistency.</p>
      <button type="button" onClick={onNew} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ss-green px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
        <Plus size={14} /> Add your first habit
      </button>
    </div>
  )
}

function SuggestionsPanel({ onAdd, onCustomize, onDismiss }) {
  const suggestions = useMemo(() => getHabitSuggestions(), [])
  if (!suggestions.length) return null
  return (
    <section className="mt-6 rounded-2xl border border-ss-teal/40 bg-ss-teal/[0.04] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>
            Personalized to your variants
          </div>
          <h2 className="text-xl font-extrabold text-ss-text">Habits suggested for your genome</h2>
          <p className="mt-1 text-sm text-ss-muted">These are based on your top findings. Add the ones that apply to your life right now.</p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss suggestions" className="text-ss-muted hover:text-ss-teal">
          <X size={16} />
        </button>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {suggestions.map((s, i) => {
          const m = CATEGORY_META[s.category]
          return (
            <li key={i} className="rounded-2xl border border-ss-border-warm/60 bg-white p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white" style={{ backgroundColor: m.color, letterSpacing: '0.14em' }}>{m.label}</span>
                {s.gene && (
                  <span className="rounded-full bg-ss-green px-2 py-0.5 font-mono text-[9px] font-bold text-white" style={{ letterSpacing: '0.02em' }}>{s.gene}</span>
                )}
                <span className="font-mono text-[10px] text-ss-muted">{FREQUENCIES.find((f) => f.key === s.frequency)?.label || s.frequency}</span>
              </div>
              <div className="text-[0.95rem] font-semibold text-ss-text">{s.name}</div>
              {s.why && <p className="mt-1 text-[0.85rem] italic text-ss-muted">{s.why}</p>}
              <div className="mt-3 flex items-center gap-3">
                <button type="button" onClick={() => onAdd(s)} className="inline-flex items-center gap-1 rounded-full bg-ss-green px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">
                  <Plus size={11} /> Add this habit
                </button>
                <button type="button" onClick={() => onCustomize(s)} className="font-mono text-[10px] font-semibold text-ss-teal hover:underline">
                  Customize first
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 text-right">
        <button type="button" onClick={onDismiss} className="font-mono text-[10px] font-semibold text-ss-muted hover:text-ss-text">
          Skip all suggestions
        </button>
      </div>
    </section>
  )
}

function DailyView({ habits, dateKeyStr, onEdit, onArchive, onDelete }) {
  const editable = isEditableDate(dateKeyStr)
  return (
    <>
      {!editable && (
        <p className="mb-3 rounded-lg border border-ss-amber/40 bg-ss-amber/10 p-3 text-sm text-ss-amber">
          Check-ins older than 30 days are locked.
        </p>
      )}
      <ul className="space-y-3">
        {habits.map((h) => (
          <DailyRow key={h.id} habit={h} dateKeyStr={dateKeyStr} editable={editable} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
        ))}
      </ul>
    </>
  )
}

function DailyRow({ habit: h, dateKeyStr, editable, onEdit, onArchive, onDelete }) {
  const [expandWhy, setExpandWhy] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteVal, setNoteVal] = useState((h.notes || {})[dateKeyStr] || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const done = (h.checkIns || []).includes(dateKeyStr)
  const streak = streakFor(h)
  const cat = CATEGORY_META[h.category] || CATEGORY_META.custom
  const freq = FREQUENCIES.find((f) => f.key === h.frequency)?.label || h.frequency
  const fireColor = streak >= 30 ? '#2E7D32' : streak >= 7 ? '#964219' : streak >= 3 ? '#7A7974' : null

  const saveNote = () => { setNote(h.id, dateKeyStr, noteVal); setNoteOpen(false) }

  return (
    <li className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60" style={{ borderLeft: `4px solid ${h.color}` }}>
      <div className="flex items-center gap-4">
        <button
          type="button" onClick={() => editable && toggleCheckIn(h.id, dateKeyStr)}
          aria-label={done ? 'Uncheck habit' : 'Check habit'} aria-pressed={done}
          disabled={!editable}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition disabled:opacity-50"
          style={done
            ? { backgroundColor: h.color, color: 'white' }
            : { border: `2px solid ${h.color}` }}
        >
          {done ? <CheckCircle2 size={18} strokeWidth={0} fill="currentColor" /> : null}
        </button>
        <div className="min-w-0 flex-1">
          <div className={`text-[0.95rem] font-semibold ${done ? 'text-ss-muted line-through' : 'text-ss-text'}`}>{h.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white" style={{ backgroundColor: cat.color, letterSpacing: '0.14em' }}>{cat.label}</span>
            <span className="font-mono text-[10px] text-ss-muted">{freq}</span>
            {h.variantSource && <span className="rounded-full bg-ss-green px-2 py-0.5 font-mono text-[9px] font-bold text-white">{h.variantSource}</span>}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {h.why && (
            <button type="button" onClick={() => setExpandWhy((v) => !v)} className="font-mono text-[10px] font-semibold text-ss-teal hover:underline">
              {expandWhy ? 'Hide why' : 'Why?'}
            </button>
          )}
          {streak >= 1 && (
            <span className="font-mono text-[10px] text-ss-muted" style={fireColor ? { color: fireColor } : {}}>
              {streak >= 3 ? '🔥 ' : ''}{streak >= 30 ? <span className="animate-pulse">{streak}</span> : streak}{streak === 1 ? ' day' : ' days'}
            </span>
          )}
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Habit menu" className="h-8 w-8 rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-teal">
              <MoreVertical size={14} className="m-auto" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-10 w-40 rounded-lg border border-ss-border-warm bg-white p-1 shadow-lg">
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(h) }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-ss-bg">
                  <Pencil size={11} /> Edit
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onArchive(h) }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-ss-bg">
                  <Archive size={11} /> Archive
                </button>
                {!confirmDel ? (
                  <button type="button" onClick={() => setConfirmDel(true)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-ss-red hover:bg-ss-bg">
                    <Trash2 size={11} /> Delete
                  </button>
                ) : (
                  <div className="px-2 py-1.5 text-xs text-ss-red">
                    Confirm? <button type="button" onClick={() => { setMenuOpen(false); setConfirmDel(false); onDelete(h) }} className="ml-1 font-bold">Yes</button> · <button type="button" onClick={() => setConfirmDel(false)} className="font-semibold">No</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {expandWhy && h.why && (
        <div className="mt-3 rounded-lg bg-ss-bg/60 p-3 text-sm text-ss-text">{h.why}</div>
      )}

      {done && editable && (
        <div className="mt-3">
          {!noteOpen ? (
            <button type="button" onClick={() => setNoteOpen(true)} className="font-mono text-[10px] font-semibold text-ss-teal hover:underline">
              + {(h.notes || {})[dateKeyStr] ? 'Edit note' : 'Add note'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input type="text" value={noteVal} maxLength={120} onChange={(e) => setNoteVal(e.target.value)}
                placeholder="How did it go?"
                className="flex-1 rounded-lg border border-ss-border-warm bg-white px-2 py-1 text-sm focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
              />
              <button type="button" onClick={saveNote} className="font-mono text-[10px] font-semibold text-ss-teal hover:underline">Save</button>
              <button type="button" onClick={() => setNoteOpen(false)} className="font-mono text-[10px] font-semibold text-ss-muted hover:underline">Cancel</button>
            </div>
          )}
          {(h.notes || {})[dateKeyStr] && !noteOpen && (
            <div className="mt-1 text-[12px] italic text-ss-muted">“{(h.notes || {})[dateKeyStr]}”</div>
          )}
        </div>
      )}
    </li>
  )
}

/* -------------------------- Progress view --------------------------- */
function ProgressView({ habits }) {
  const stats = useMemo(() => summaryStats(habits), [habits])
  const insights = useMemo(() => generateInsights(habits), [habits])
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryStat label="Most consistent habit" value={stats.mostConsistent ? stats.mostConsistent.habit.name : '—'} sub={stats.mostConsistent ? `${stats.mostConsistent.percent}%` : ''} />
        <SummaryStat label="Current longest streak" value={stats.longestStreak ? `${stats.longestStreak.days} days` : '—'} sub={stats.longestStreak?.habit.name || ''} />
        <SummaryStat label="Check-ins this month" value={stats.totalThisMonth} />
      </div>

      <div className="mt-6 space-y-6">
        {habits.map((h) => <HeatmapRow key={h.id} habit={h} />)}
      </div>

      {insights.length > 0 && (
        <section className="mt-10">
          <div className="mb-3">
            <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>Insights</div>
            <h2 className="text-xl font-extrabold text-ss-text">What your habits are telling you</h2>
          </div>
          <ul className="space-y-3">
            {insights.map((i) => (
              <li key={i.id} className="rounded-xl border border-ss-teal/40 bg-ss-teal/[0.04] p-4 text-sm text-ss-text" style={{ borderLeft: '3px solid #1B474D' }}>
                <div className="flex items-start gap-2">
                  <Lightbulb size={14} className="mt-0.5 flex-shrink-0 text-ss-teal" />
                  <span>{i.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function SummaryStat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.14em' }}>{label}</div>
      <div className="mt-1 text-[1.4rem] font-extrabold text-ss-teal">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ss-muted">{sub}</div>}
    </div>
  )
}

function HeatmapRow({ habit: h }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const days = []
  for (let i = 89; i >= 0; i--) days.push(addDays(today, -i))
  const set = new Set(h.checkIns || [])
  const createdAt = h.createdAt ? new Date(h.createdAt) : null
  // Group into weeks of 7 for a grid.
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  const { percent } = completionOverWindow(h, 90)
  const best = bestStreak(h)
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60 md:flex md:gap-4">
      <div className="mb-3 md:mb-0 md:w-[160px] md:flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: h.color }} />
          <span className="truncate text-sm font-semibold text-ss-text">{h.name}</span>
        </div>
        <div className="mt-1.5">
          <span className="rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white" style={{ backgroundColor: CATEGORY_META[h.category]?.color || '#7A7974', letterSpacing: '0.14em' }}>
            {CATEGORY_META[h.category]?.label || 'Custom'}
          </span>
        </div>
        <div className="mt-2 font-mono text-[10px] text-ss-muted">{percent}% completion over 90 days</div>
        <div className="font-mono text-[10px] text-ss-muted">Best streak: {best} days</div>
      </div>
      <div className="flex-1">
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))', maxWidth: '540px' }}>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {week.map((day, dIdx) => {
                const key = dateKey(day)
                const isFuture = day > today
                const inFuture = isFuture
                const beforeCreation = createdAt && day < createdAt
                const completed = set.has(key)
                let bg = 'transparent', border = ''
                if (inFuture) { bg = 'transparent' }
                else if (beforeCreation) { bg = '#EEE8DA' }
                else if (completed) { bg = h.color }
                else { bg = 'transparent'; border = `1px solid ${h.color}66` }
                return (
                  <span key={dIdx}
                    title={`${key}${completed ? ' — completed' : ''}`}
                    className="h-2.5 w-2.5 rounded-[2px] md:h-3 md:w-3"
                    style={{ backgroundColor: bg, border }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
