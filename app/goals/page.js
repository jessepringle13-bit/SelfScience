'use client'

// /app/app/goals/page.js
// Goals list page: tabbed filter (Active/Completed/Paused/All),
// goal grid, insights section, and CSV/PDF export.

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Target, Download, FileText } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { useGoals, downloadCsv, openPrintablePdf } from '@/lib/goals'
import { celebrationAlreadyShown, markCelebrationShown } from '@/components/goals/GoalCompletionCelebration'
import GoalCard from '@/components/goals/GoalCard'
import GoalCreationModal from '@/components/goals/GoalCreationModal'
import GoalCompletionCelebration from '@/components/goals/GoalCompletionCelebration'
import GoalInsights from '@/components/goals/GoalInsights'

const TABS = [
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'paused',    label: 'Paused' },
  { key: 'all',       label: 'All' },
]

function GoalsPage() {
  const goals = useGoals()
  const params = useSearchParams()
  const [tab, setTab] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [celebrateGoal, setCelebrateGoal] = useState(null)
  const [initialCategory, setInitialCategory] = useState(null)
  const [initialVariant, setInitialVariant]   = useState(null)

  // Support ?new=1, ?status=completed, ?category=<id>, ?variant=<rsid>
  // deep links. The category + variant params come from Focus Mode's
  // "Set a goal based on this finding" CTA and must survive into the
  // creation modal so the goal is pre-scoped and variant-tagged.
  useEffect(() => {
    if (!params) return
    const s = params.get('status')
    if (s && TABS.some((t) => t.key === s)) setTab(s)
    const cat = params.get('category')
    if (cat) setInitialCategory(cat)
    const v = params.get('variant')
    if (v) setInitialVariant(v)
    if (params.get('new') === '1') setModalOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (tab === 'all') return goals
    return goals.filter((g) => g.status === tab)
  }, [goals, tab])

  const counts = useMemo(() => {
    const out = { active: 0, completed: 0, paused: 0, all: goals.length, abandoned: 0 }
    for (const g of goals) out[g.status] = (out[g.status] || 0) + 1
    return out
  }, [goals])

  // When a goal completion happens, show celebration once per goal.
  const handleComplete = (goal) => {
    if (!goal?.id) return
    // Latest state may be a completed version — use whatever we have.
    const latest = goals.find((g) => g.id === goal.id) || goal
    if (celebrationAlreadyShown(latest.id)) return
    setCelebrateGoal(latest)
    markCelebrationShown(latest.id)
  }

  return (
    <div className="min-h-screen bg-ss-bg pb-20">
      <SiteNav />
      <div className="container pt-24 md:pt-28">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ss-teal">Genome-Informed Goals</div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-text md:text-4xl">Your Health Goals</h1>
            <p className="mt-2 max-w-2xl text-[15px] text-ss-muted">
              Set goals that connect your genetic findings to real outcomes — and track your progress over time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Plus size={14} /> New Goal
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-ss-border-warm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative rounded-t-lg px-3 py-2 text-sm font-semibold transition ${
                tab === t.key ? 'text-ss-teal' : 'text-ss-muted hover:text-ss-text'
              }`}
            >
              {t.label} <span className="ml-1 font-mono text-[10px] text-ss-muted">({counts[t.key] ?? 0})</span>
              {tab === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ss-teal" />}
            </button>
          ))}
        </div>

        {/* Grid or empty */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ss-border-warm bg-white px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ss-bg text-ss-muted">
                <Target size={26} />
              </div>
              <div className="text-lg font-bold text-ss-text">No {tab === 'all' ? '' : tab + ' '}goals yet.</div>
              <p className="max-w-md text-[13px] text-ss-muted">
                {tab === 'active'
                  ? 'Create your first goal to start tracking real progress backed by your genome.'
                  : 'Complete or add goals to see them appear here.'}
              </p>
              {tab === 'active' && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-ss-orange px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-95"
                >
                  <Plus size={12} /> Create your first goal
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((g) => (
                <GoalCard key={g.id} goal={g} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </div>

        {/* Insights */}
        <GoalInsights goals={goals} />

        {/* Export */}
        {goals.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-ss-border-warm pt-6">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-muted">Export</span>
            <button
              type="button"
              onClick={() => openPrintablePdf(goals)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-[12px] font-semibold text-ss-teal transition hover:bg-ss-bg"
            >
              <FileText size={12} /> Export goals as PDF
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(goals)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ss-border-warm bg-white px-3 py-1.5 text-[12px] font-semibold text-ss-teal transition hover:bg-ss-bg"
            >
              <Download size={12} /> Export goals as CSV
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <GoalCreationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialCategory={initialCategory}
        initialVariant={initialVariant}
      />
      {celebrateGoal && (
        <GoalCompletionCelebration goal={celebrateGoal} onClose={() => setCelebrateGoal(null)} />
      )}
    </div>
  )
}

export default function GoalsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ss-bg" />}>
      <GoalsPage />
    </Suspense>
  )
}
