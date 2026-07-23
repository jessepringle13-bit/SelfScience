'use client'

// /app/components/JourneyGuide.jsx
// Phase B · Part 3 — persistent "Your Guide" wayfinding component. It maps
// the SelfScience journey as a 5-step checklist so users always know what
// to look at next after uploading their genome.
//
// Behaviour:
//   • Mounts globally via layout.js.
//   • Only visible AFTER genome upload (hasGenomeResults()).
//   • Never shown on /genome itself (that's the upload page) or on any
//     admin/print route.
//   • Desktop (md+): floating rounded panel pinned to bottom-right, 300px
//     wide when expanded, collapses to a compact "Guide" pill when
//     collapsed.
//   • Mobile (<md): a floating "Guide" button (bottom-right, above the
//     site MobileNav) that opens a bottom sheet.
//   • Auto-collapses (not dismisses) after 3 days from first mount.
//   • Manual dismiss via the "Hide Guide" link → hidden forever
//     (ss_guide_dismissed = '1').
//
// LocalStorage keys (ss_ namespaced):
//   ss_guide_progress   → JSON.stringify(string[]) of completed step keys
//   ss_guide_first_seen → ISO date of first mount
//   ss_guide_collapsed  → '1' if the user manually collapsed
//   ss_guide_dismissed  → '1' if the user hit "Hide Guide"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass, Check, ChevronDown, ChevronUp, X,
  Upload, Star, Apple, Pill, LayoutGrid,
} from 'lucide-react'
import { hasGenomeResults } from '@/lib/genomeSession'

const LS_PROGRESS   = 'ss_guide_progress'
const LS_FIRST_SEEN = 'ss_guide_first_seen'
const LS_COLLAPSED  = 'ss_guide_collapsed'
const LS_DISMISSED  = 'ss_guide_dismissed'
const AUTO_COLLAPSE_AFTER_MS = 3 * 24 * 60 * 60 * 1000  // 3 days

const EXCLUDED_PATH_PREFIXES = [
  '/genome',              // upload page itself
  '/practitioner-report', // print-optimized doc
  '/admin',
  '/get-started',
  '/start',
]

const STEPS = [
  { key: 'upload',      Icon: Upload,     label: 'Upload your genome file',       href: '/genome' },
  { key: 'findings',    Icon: Star,       label: 'Review your top 3 findings',    href: '/genome/findings' },
  { key: 'nutrition',   Icon: Apple,      label: 'Check your nutrition matches',  href: '/nutrition' },
  { key: 'supplements', Icon: Pill,       label: 'See your supplement suggestions', href: '/tools/supplements' },
  { key: 'profile',     Icon: LayoutGrid, label: 'Explore your full health profile', href: '/' },
]

function readSet(key) {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch { return new Set() }
}
function writeSet(key, set) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, JSON.stringify(Array.from(set))) } catch {}
}

export default function JourneyGuide() {
  const pathname = usePathname() || ''
  const [mounted, setMounted]         = useState(false)
  const [hasGenome, setHasGenome]     = useState(false)
  const [dismissed, setDismissed]     = useState(false)
  const [collapsed, setCollapsed]     = useState(false)     // desktop panel state
  const [sheetOpen, setSheetOpen]     = useState(false)     // mobile bottom sheet
  const [done, setDone]               = useState(new Set()) // completed step keys

  // Client-side mount only (avoid SSR flicker / hydration mismatch).
  useEffect(() => {
    setMounted(true)
    setHasGenome(hasGenomeResults())
    setDismissed(typeof window !== 'undefined' && window.localStorage.getItem(LS_DISMISSED) === '1')

    // Auto-collapse after 3 days.
    if (typeof window !== 'undefined') {
      const first = window.localStorage.getItem(LS_FIRST_SEEN)
      if (!first) {
        window.localStorage.setItem(LS_FIRST_SEEN, new Date().toISOString())
        setCollapsed(false)
      } else {
        try {
          const ms = Date.now() - new Date(first).getTime()
          const manual = window.localStorage.getItem(LS_COLLAPSED) === '1'
          setCollapsed(manual || ms > AUTO_COLLAPSE_AFTER_MS)
        } catch {
          setCollapsed(window.localStorage.getItem(LS_COLLAPSED) === '1')
        }
      }
    }

    // Merge stored progress with derived "upload complete" state.
    const stored = readSet(LS_PROGRESS)
    if (hasGenomeResults()) stored.add('upload')
    setDone(stored)

    // Listen for genome changes so we re-detect after fresh upload.
    const onGenomeChanged = () => {
      const has = hasGenomeResults()
      setHasGenome(has)
      const s = readSet(LS_PROGRESS)
      if (has) s.add('upload')
      writeSet(LS_PROGRESS, s)
      setDone(s)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:genome-changed', onGenomeChanged)
      return () => window.removeEventListener('selfscience:genome-changed', onGenomeChanged)
    }
  }, [])

  // Compute the current "next" step so we can highlight it.
  const nextKey = useMemo(() => STEPS.find((s) => !done.has(s.key))?.key, [done])

  const excluded = EXCLUDED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (!mounted || !hasGenome || dismissed || excluded) return null

  const markStep = (key) => {
    const s = new Set(done); s.add(key); writeSet(LS_PROGRESS, s); setDone(s)
  }
  const hideForever = () => {
    if (typeof window !== 'undefined') window.localStorage.setItem(LS_DISMISSED, '1')
    setDismissed(true); setSheetOpen(false)
  }
  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LS_COLLAPSED, next ? '1' : '0')
    }
  }

  const progress = done.size
  const total    = STEPS.length

  // ---------------- Desktop panel ----------------
  const desktopPanel = (
    <div
      role="complementary"
      aria-label="Your SelfScience journey"
      className="pointer-events-auto fixed bottom-6 right-6 z-40 hidden w-[300px] rounded-2xl border border-ss-border-warm bg-white shadow-xl md:block"
    >
      <button
        type="button"
        onClick={toggleCollapse}
        aria-expanded={!collapsed}
        aria-controls="ss-guide-body"
        className="flex w-full items-center gap-2 rounded-t-2xl px-4 py-3 text-left"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ss-green/10 text-ss-green">
          <Compass size={16} />
        </span>
        <div className="flex-1">
          <div className="text-sm font-extrabold text-ss-teal">Your Guide</div>
          <div className="text-[10.5px] text-ss-muted">
            {progress} of {total} steps complete
          </div>
        </div>
        {collapsed
          ? <ChevronUp   size={16} className="text-ss-muted" aria-hidden="true" />
          : <ChevronDown size={16} className="text-ss-muted" aria-hidden="true" />}
      </button>

      {!collapsed && (
        <div id="ss-guide-body" className="border-t border-ss-border-warm/60 p-4">
          <StepList steps={STEPS} done={done} nextKey={nextKey} onClickStep={markStep} />
          <div className="mt-4 flex items-center justify-between text-[10.5px]">
            <button
              type="button"
              onClick={hideForever}
              className="text-ss-muted hover:text-ss-teal hover:underline"
            >
              Hide Guide
            </button>
            <span className="text-ss-muted">Auto-hides after 3 days</span>
          </div>
        </div>
      )}
    </div>
  )

  // ---------------- Mobile FAB + sheet ----------------
  const mobileFab = (
    <button
      type="button"
      onClick={() => setSheetOpen(true)}
      aria-label={`Open your guide — ${progress} of ${total} steps complete`}
      // Anchored ABOVE the site MobileNav (~64px + safe-area). Do NOT sit
      // below it or the tap target will be blocked.
      className="fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ss-green text-white shadow-lg md:hidden"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
    >
      <Compass size={20} />
      {progress > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ss-orange px-1 text-[10px] font-bold text-white ring-2 ring-white"
        >
          {progress}/{total}
        </span>
      )}
    </button>
  )

  const mobileSheet = sheetOpen && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ss-guide-sheet-title"
      className="fixed inset-0 z-[60] flex items-end bg-black/40 md:hidden"
      onClick={() => setSheetOpen(false)}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 shadow-2xl"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ss-border-warm" aria-hidden="true" />
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ss-green/10 text-ss-green">
            <Compass size={18} />
          </span>
          <div className="flex-1">
            <h3 id="ss-guide-sheet-title" className="text-base font-extrabold text-ss-teal">Your Guide</h3>
            <div className="text-[11px] text-ss-muted">
              {progress} of {total} steps complete
            </div>
          </div>
          <button
            type="button"
            aria-label="Close guide"
            onClick={() => setSheetOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5">
          <StepList steps={STEPS} done={done} nextKey={nextKey} onClickStep={(key) => { markStep(key); setSheetOpen(false) }} />
        </div>

        <div className="mt-6 flex items-center justify-between text-[11px]">
          <button type="button" onClick={hideForever} className="text-ss-muted hover:underline">
            Hide Guide
          </button>
          <span className="text-ss-muted">Auto-hides after 3 days</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {desktopPanel}
      {mobileFab}
      {mobileSheet}
    </>
  )
}

function StepList({ steps, done, nextKey, onClickStep }) {
  return (
    <ol className="space-y-2">
      {steps.map(({ key, Icon, label, href }) => {
        const isDone = done.has(key)
        const isNext = key === nextKey
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={() => onClickStep(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isDone
                  ? 'bg-ss-green/5 text-ss-muted'
                  : isNext
                    ? 'border-l-4 border-ss-green bg-ss-green/8 pl-2 font-semibold text-ss-teal'
                    : 'text-ss-teal hover:bg-ss-bg'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  isDone ? 'bg-ss-green text-white' : isNext ? 'bg-white ring-1 ring-ss-green text-ss-green' : 'bg-white ring-1 ring-ss-border-warm text-ss-muted'
                }`}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
              </span>
              <span className="min-w-0 flex-1">{label}</span>
              <span className={`text-[10.5px] font-semibold uppercase tracking-wider ${
                isDone ? 'text-ss-green' : isNext ? 'text-ss-green' : 'text-ss-muted'
              }`}>
                {isDone ? 'Done' : isNext ? 'View →' : 'View →'}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
