'use client'

// /app/components/goals/GoalCard.jsx
// A single goal card with header, progress, milestones, target date,
// inline progress-log panel, and overflow menu.

import { useState, useRef, useEffect } from 'react'
import {
  Zap, Leaf, FlaskConical, TestTube2, Heart, BookOpen, Stethoscope, CheckCircle2,
  MoreHorizontal, Calendar, Edit3, Pause, Play, CheckSquare, XCircle, Sparkles, X,
} from 'lucide-react'
import {
  getCategory, progressPercent, daysUntil, daysActive, loggedTodayCount,
  logProgress, setStatus, deleteGoal, updateGoal,
} from '@/lib/goals'
import { getGenomeContext } from '@/lib/goalGenomeContext'

const ICON_MAP = { Zap, Leaf, FlaskConical, TestTube2, Heart, BookOpen, Stethoscope, CheckCircle2 }

export default function GoalCard({ goal, onComplete }) {
  const cat = getCategory(goal.category)
  const Icon = ICON_MAP[cat.icon] || CheckCircle2
  const pct = progressPercent(goal)
  const dTo = daysUntil(goal.targetDate)
  const alreadyLoggedToday = loggedTodayCount(goal) > 0

  const [showAllMilestones, setShowAllMilestones] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [logValue, setLogValue] = useState('')
  const [logNote, setLogNote] = useState('')
  const [selectedMs, setSelectedMs] = useState([])
  const [toast, setToast] = useState(null)
  const menuRef = useRef(null)

  const context = goal.variantSource ? { variantSource: goal.variantSource, ...(getGenomeContext(goal.category) || {}) } : null

  useEffect(() => {
    if (!openMenu) return
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openMenu])

  const flashToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800) }

  const submitLog = () => {
    const { hitTarget } = logProgress(goal.id, {
      value: logValue,
      note: logNote,
      milestoneIds: selectedMs,
    })
    setLogValue(''); setLogNote(''); setSelectedMs([])
    setShowLog(false)
    flashToast('Progress logged')
    if (hitTarget && goal.status === 'active') {
      setTimeout(() => {
        const yes = window.confirm('You hit your target! Mark this goal as complete?')
        if (yes) {
          setStatus(goal.id, 'completed')
          onComplete?.(goal)
        }
      }, 400)
    }
  }

  const milestones = goal.milestones || []
  const visibleMs = showAllMilestones ? milestones : milestones.slice(0, 3)
  const completedMs = milestones.filter((m) => m.isCompleted).length

  const dateLabel = (() => {
    if (!goal.targetDate) return null
    const d = dTo
    if (d == null) return null
    let color = 'text-ss-muted'
    let text = `${d} day${d === 1 ? '' : 's'} remaining`
    if (d < 0) { color = 'text-red-600'; text = `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'}` }
    else if (d < 7) { color = 'text-red-600' }
    else if (d <= 14) { color = 'text-ss-amber' }
    return { color, text }
  })()

  return (
    <div
      className="relative flex flex-col rounded-2xl border border-ss-border-warm bg-white p-5 shadow-sm ring-1 ring-black/[0.02] transition hover:shadow-md"
      style={{ borderTop: `4px solid ${cat.color}` }}
    >
      {/* Toast */}
      {toast && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-ss-teal px-3 py-1 text-[11px] font-semibold text-white shadow-md">
          {toast}
        </div>
      )}

      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: cat.color }}>
            <Icon size={9} /> {cat.name}
          </span>
          {goal.variantSource && (
            <span className="inline-flex rounded-full bg-ss-green px-2 py-0.5 font-mono text-[9px] font-bold text-white">
              {goal.variantSource}
            </span>
          )}
          {goal.status === 'completed' && (
            <span className="inline-flex rounded-full bg-ss-green/15 px-2 py-0.5 text-[10px] font-bold text-ss-green">
              ✓ Completed
            </span>
          )}
          {goal.status === 'paused' && (
            <span className="inline-flex rounded-full bg-ss-amber/15 px-2 py-0.5 text-[10px] font-bold text-ss-amber">
              Paused
            </span>
          )}
        </div>
        {/* Overflow menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpenMenu((v) => !v)}
            aria-label="More actions"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
          >
            <MoreHorizontal size={14} />
          </button>
          {openMenu && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/10">
              <MenuBtn onClick={() => { setOpenMenu(false); const t = prompt('Edit goal title:', goal.title); if (t !== null && t.trim()) updateGoal(goal.id, { title: t.trim().slice(0, 100) }) }}>
                <Edit3 size={12} /> Edit
              </MenuBtn>
              {goal.status === 'active' && (
                <MenuBtn onClick={() => { setOpenMenu(false); setStatus(goal.id, 'paused'); flashToast('Paused') }}>
                  <Pause size={12} /> Pause
                </MenuBtn>
              )}
              {goal.status === 'paused' && (
                <MenuBtn onClick={() => { setOpenMenu(false); setStatus(goal.id, 'active'); flashToast('Resumed') }}>
                  <Play size={12} /> Resume
                </MenuBtn>
              )}
              {goal.status !== 'completed' && (
                <MenuBtn onClick={() => { setOpenMenu(false); setStatus(goal.id, 'completed'); onComplete?.(goal); flashToast('Completed!') }}>
                  <CheckSquare size={12} /> Mark complete
                </MenuBtn>
              )}
              <MenuBtn danger onClick={() => { setOpenMenu(false); if (confirm('Abandon this goal?')) { setStatus(goal.id, 'abandoned'); flashToast('Abandoned') } }}>
                <XCircle size={12} /> Abandon
              </MenuBtn>
              <MenuBtn danger onClick={() => { setOpenMenu(false); if (confirm('Delete this goal permanently?')) { deleteGoal(goal.id); flashToast('Deleted') } }}>
                <XCircle size={12} /> Delete
              </MenuBtn>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-extrabold leading-tight text-ss-text md:text-lg">{goal.title}</h3>
      {goal.description && <p className="mt-1 text-[12px] leading-snug text-ss-muted">{goal.description}</p>}

      {/* Progress */}
      <div className="mt-3">
        {goal.targetValue != null ? (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-ss-bg">
              <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
            </div>
            <div className="mt-1.5 font-mono text-[10px] text-ss-muted">
              {goal.currentValue ?? 0} / {goal.targetValue} {goal.targetUnit || ''}
            </div>
          </>
        ) : milestones.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {milestones.map((m) => (
                <span
                  key={m.id}
                  className={`inline-block h-2 w-2 rounded-full ${m.isCompleted ? '' : 'ring-1 ring-inset ring-ss-border-warm'}`}
                  style={m.isCompleted ? { backgroundColor: cat.color } : { background: 'transparent' }}
                  title={m.title}
                />
              ))}
            </div>
            <div className="font-mono text-[10px] text-ss-muted">
              {completedMs} of {milestones.length} milestones complete
            </div>
          </div>
        ) : (
          <div className="font-mono text-[10px] text-ss-muted">Active for {daysActive(goal)} day{daysActive(goal) === 1 ? '' : 's'}</div>
        )}
      </div>

      {/* Target date */}
      {dateLabel && (
        <div className={`mt-2 flex items-center gap-1 font-mono text-[10px] ${dateLabel.color}`}>
          <Calendar size={11} /> {dateLabel.text}
        </div>
      )}

      {/* Milestone list */}
      {milestones.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {visibleMs.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-[13px] text-ss-text">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                m.isCompleted ? 'border-ss-green bg-ss-green text-white' : 'border-ss-border-warm bg-white'
              }`}>
                {m.isCompleted && <CheckSquare size={9} />}
              </span>
              <span className={m.isCompleted ? 'line-through text-ss-muted' : ''}>{m.title}</span>
            </li>
          ))}
          {milestones.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllMilestones(!showAllMilestones)}
              className="text-[11px] font-semibold text-ss-teal hover:underline"
            >
              {showAllMilestones ? 'Show less' : `+ ${milestones.length - 3} more`}
            </button>
          )}
        </ul>
      )}

      {/* Genome context (short) */}
      {context?.line && (
        <div className="mt-3 rounded-lg border-l-2 border-ss-teal bg-ss-teal/[0.04] px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-ss-teal">Genetic Context</div>
          <p className="mt-0.5 text-[12px] leading-snug text-ss-text/85">{context.line}</p>
          <a
            href={`/search?q=${encodeURIComponent(context.gene || context.variantSource)}`}
            className="mt-1 inline-block text-[11px] font-semibold text-ss-teal hover:underline"
          >
            Learn more →
          </a>
        </div>
      )}

      {/* Footer / actions */}
      {goal.status === 'active' && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowLog(!showLog)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
              alreadyLoggedToday
                ? 'border border-ss-border-warm bg-white text-ss-muted hover:bg-ss-bg'
                : 'bg-ss-green text-white hover:brightness-95'
            }`}
          >
            <Sparkles size={11} /> {alreadyLoggedToday ? 'Log again' : 'Log progress'}
          </button>
          <span className="font-mono text-[10px] text-ss-muted">{(goal.progressLog || []).length} log entries</span>
        </div>
      )}
      {goal.status === 'paused' && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => { setStatus(goal.id, 'active'); flashToast('Resumed') }}
            className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-95"
          >
            <Play size={11} /> Resume goal
          </button>
        </div>
      )}

      {/* Inline log panel */}
      {showLog && goal.status === 'active' && (
        <div className="mt-3 overflow-hidden rounded-lg border border-ss-border-warm bg-ss-bg/60 p-3 duration-200 animate-in slide-in-from-top-2">
          {goal.targetValue != null ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={logValue}
                onChange={(e) => setLogValue(e.target.value)}
                placeholder="Log today's value"
                className="flex-1 rounded-md border border-ss-border-warm bg-white px-2.5 py-1.5 text-sm text-ss-text focus:border-ss-teal focus:outline-none"
              />
              {goal.targetUnit && (
                <span className="font-mono text-[11px] text-ss-muted">{goal.targetUnit}</span>
              )}
            </div>
          ) : milestones.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ss-muted">Check off completed milestones</div>
              {milestones.filter((m) => !m.isCompleted).map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-2 text-[13px] text-ss-text">
                  <input
                    type="checkbox"
                    checked={selectedMs.includes(m.id)}
                    onChange={() => setSelectedMs(
                      selectedMs.includes(m.id)
                        ? selectedMs.filter((id) => id !== m.id)
                        : [...selectedMs, m.id]
                    )}
                    className="h-4 w-4 rounded border-ss-border-warm text-ss-green focus:ring-ss-teal"
                  />
                  {m.title}
                </label>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-ss-muted">No numeric target or milestones — just add a note below.</div>
          )}
          <input
            type="text"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value.slice(0, 120))}
            placeholder="Add a note (optional)"
            className="mt-2 w-full rounded-md border border-ss-border-warm bg-white px-2.5 py-1.5 text-sm text-ss-text focus:border-ss-teal focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={() => { setShowLog(false); setLogValue(''); setLogNote(''); setSelectedMs([]) }} className="text-[12px] font-semibold text-ss-muted hover:text-ss-text">Cancel</button>
            <button
              type="button"
              onClick={submitLog}
              disabled={!logValue && !logNote && !selectedMs.length}
              className="inline-flex items-center gap-1 rounded-full bg-ss-green px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
            >
              Save progress
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuBtn({ children, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-semibold transition hover:bg-ss-bg ${
        danger ? 'text-red-600' : 'text-ss-text'
      }`}
    >
      {children}
    </button>
  )
}
