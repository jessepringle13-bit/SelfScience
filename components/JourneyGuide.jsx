'use client'

// /app/components/JourneyGuide.jsx
// Two-tier wayfinding guide.
//   Tier 1 — "Getting Started" — the original 5 steps.
//   Tier 2 — "Go Deeper" — unlocks automatically when all Tier 1 steps
//            are complete. Six deeper-use tasks that teach the user how
//            to actually USE the platform, not just visit pages.
//
// After Tier 2 finishes the full guide is replaced by a small "Explorer"
// chip in the header (rendered by /app/components/ExplorerChip.jsx).
// The 3-day auto-collapse rule still applies to the full guide; the
// Explorer chip is permanent.
//
// LocalStorage contract (all ss_ namespaced):
//   ss_guide_progress         — Tier 1 completed keys (string[])
//   ss_guide_tier2            — Tier 2 completed keys (string[])
//   ss_guide_tier2_unlocked   — '1' once every Tier 1 step is done
//   ss_guide_explorer         — '1' once every Tier 2 step is done
//   ss_guide_first_seen       — ISO timestamp (auto-collapse anchor)
//   ss_guide_collapsed        — '1' if the user manually collapsed
//   ss_guide_dismissed        — '1' if the user hit "Hide Guide"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass, Check, ChevronDown, ChevronUp, X,
  Upload, Star, Apple, Pill, LayoutGrid, Search, ScanLine,
  TestTube2, FileText, BookOpen, Rocket, RefreshCw,
} from 'lucide-react'
import { hasGenomeResults } from '@/lib/genomeSession'
import { resetGuideOnly, fireToast } from '@/lib/journeyReset'

const LS_PROGRESS         = 'ss_guide_progress'
const LS_TIER2            = 'ss_guide_tier2'
const LS_TIER2_UNLOCKED   = 'ss_guide_tier2_unlocked'
const LS_EXPLORER         = 'ss_guide_explorer'
const LS_FIRST_SEEN       = 'ss_guide_first_seen'
const LS_COLLAPSED        = 'ss_guide_collapsed'
const LS_DISMISSED        = 'ss_guide_dismissed'
const AUTO_COLLAPSE_AFTER_MS = 3 * 24 * 60 * 60 * 1000

const EXCLUDED_PATH_PREFIXES = [
  '/genome', '/practitioner-report', '/admin', '/get-started', '/start',
]

// Tier 1 — Getting Started (unchanged from the previous version)
const TIER1_STEPS = [
  { key: 'upload',      Icon: Upload,     label: 'Upload your genome file',            href: '/genome',            tooltip: 'This unlocks personalized results across every tool on the site.' },
  { key: 'findings',    Icon: Star,       label: 'Review your top 3 findings',         href: '/genome/findings',   tooltip: 'See the variants that matter most for your health right now.' },
  { key: 'nutrition',   Icon: Apple,      label: 'Check your nutrition matches',       href: '/nutrition',         tooltip: 'Discover which foods work with or against your specific genes.' },
  { key: 'supplements', Icon: Pill,       label: 'See your supplement suggestions',    href: '/tools/supplements', tooltip: 'Get research-backed supplement ideas matched to your biology.' },
  { key: 'profile',     Icon: LayoutGrid, label: 'Explore your full health profile',   href: '/',                  tooltip: 'See your complete genetic picture across all 9 health areas.' },
]

// Tier 2 — Go Deeper (new). Each step now completes on a REAL action
// (search submitted, barcode scanned, medication checked, biomarker
// saved, practitioner report generated, article opened) — dispatched via
// /app/lib/guideActions.js. `matchPath` is retained only as a soft
// fallback for the /articles slug pages where landing on the page IS
// the action (reading an article).
const TIER2_STEPS = [
  { key: 'search',       Icon: Search,     label: 'Search the research for one of your genes',   hint: 'Tap a gene chip on the Search page and read a study',      href: '/search',                matchPath: () => false, tooltip: 'Read the actual published studies behind your results.' },
  { key: 'explore',      Icon: Compass,    label: 'Explore your first gene in Focus Mode',       hint: 'Pick one gene from your Explorer list and read its full story', href: '/explore',           matchPath: (p) => /^\/explore\/[^/]+/.test(p), tooltip: 'Focus Mode isolates one finding so you can actually understand it without distraction.' },
  { key: 'scanner',      Icon: ScanLine,   label: 'Scan a food product with your camera',        hint: 'Open Nutrition Hub → Scanner tab → point at any barcode', href: '/nutrition?tab=scanner', matchPath: () => false, tooltip: 'Grade any food against your genome in real time.' },
  { key: 'drugcheck',    Icon: Pill,       label: 'Check a medication against your genome',      hint: 'Look up how your genes affect a specific drug',            href: '/drug-check',            matchPath: () => false, tooltip: 'See if your genes affect how you process common drugs.' },
  { key: 'biomarkers',   Icon: TestTube2,  label: 'Build your biomarker picture',                 hint: 'Log one blood result — HDL, Vitamin D, or HbA1c',          href: '/biomarkers',            matchPath: () => false, tooltip: 'Connect your blood work to your genetic findings.' },
  { key: 'report',       Icon: FileText,   label: 'Generate your Practitioner Report',            hint: 'Create a print-ready sheet to share with your doctor',     href: '/practitioner-report',   matchPath: () => false, tooltip: 'Create a document your doctor can actually use.' },
  { key: 'articles',     Icon: BookOpen,   label: 'Read an article in your top pillar',           hint: 'Browse staff-written explainers matched to your biology',  href: '/articles',              matchPath: (p) => /^\/articles\/[^/]+/.test(p), tooltip: 'Plain-English explainers written for your health areas.' },
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
function writeFlag(key, value) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, value ? '1' : '0') } catch {}
}
function readFlag(key) {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(key) === '1' } catch { return false }
}

export default function JourneyGuide() {
  const pathname = usePathname() || ''
  const [mounted, setMounted]       = useState(false)
  const [hasGenome, setHasGenome]   = useState(false)
  const [dismissed, setDismissed]   = useState(false)
  const [collapsed, setCollapsed]   = useState(false)
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [tier1Done, setTier1Done]   = useState(() => new Set())
  const [tier2Done, setTier2Done]   = useState(() => new Set())
  const [tier2Unlocked, setTier2Unlocked] = useState(false)
  const [explorer, setExplorer]     = useState(false)
  // The transition banner sits between Tier 1 completing and Tier 2
  // revealing — displayed for exactly 2s per spec.
  const [transitioning, setTransitioning] = useState(false)

  // Client-side hydration
  useEffect(() => {
    setMounted(true)
    setHasGenome(hasGenomeResults())
    setDismissed(readFlag(LS_DISMISSED))
    setExplorer(readFlag(LS_EXPLORER))

    // Auto-collapse anchor.
    if (typeof window !== 'undefined') {
      const first = window.localStorage.getItem(LS_FIRST_SEEN)
      if (!first) {
        window.localStorage.setItem(LS_FIRST_SEEN, new Date().toISOString())
        setCollapsed(false)
      } else {
        try {
          const ms = Date.now() - new Date(first).getTime()
          const manual = readFlag(LS_COLLAPSED)
          setCollapsed(manual || ms > AUTO_COLLAPSE_AFTER_MS)
        } catch {
          setCollapsed(readFlag(LS_COLLAPSED))
        }
      }
    }

    // Load Tier 1 progress (auto-complete "upload" when genome present).
    const t1 = readSet(LS_PROGRESS)
    if (hasGenomeResults()) t1.add('upload')
    setTier1Done(t1)
    // Load Tier 2 progress + unlock state.
    setTier2Done(readSet(LS_TIER2))
    setTier2Unlocked(readFlag(LS_TIER2_UNLOCKED))

    // Genome-changed listener re-derives "upload" completion.
    const onGenomeChanged = () => {
      const has = hasGenomeResults()
      setHasGenome(has)
      const s = readSet(LS_PROGRESS)
      if (has) s.add('upload')
      writeSet(LS_PROGRESS, s)
      setTier1Done(s)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('selfscience:genome-changed', onGenomeChanged)
      const onGuideChanged = () => {
        // Re-read every guide flag when journeyReset fires. Ensures the
        // guide un-hides + restarts without a page refresh.
        setDismissed(readFlag(LS_DISMISSED))
        setExplorer(readFlag(LS_EXPLORER))
        setCollapsed(readFlag(LS_COLLAPSED))
        setTier2Unlocked(readFlag(LS_TIER2_UNLOCKED))
        const t1r = readSet(LS_PROGRESS)
        if (hasGenomeResults()) t1r.add('upload')
        setTier1Done(t1r)
        setTier2Done(readSet(LS_TIER2))
      }
      window.addEventListener('selfscience:guide-changed', onGuideChanged)
      return () => {
        window.removeEventListener('selfscience:genome-changed', onGenomeChanged)
        window.removeEventListener('selfscience:guide-changed', onGuideChanged)
      }
    }
  }, [])

  // Auto-mark Tier 2 steps. Two paths:
  //   1) A real action was dispatched via /app/lib/guideActions.js
  //      (fireGuideAction('search'), etc.) — this is the primary path.
  //   2) Route match fallback (currently only "articles" — landing on an
  //      article slug page counts as "read an article").
  useEffect(() => {
    if (!mounted || !tier2Unlocked || explorer) return
    const match = TIER2_STEPS.find((s) => s.matchPath(pathname))
    if (!match) return
    if (tier2Done.has(match.key)) return
    const next = new Set(tier2Done)
    next.add(match.key)
    writeSet(LS_TIER2, next)
    setTier2Done(next)
  }, [pathname, mounted, tier2Unlocked, explorer, tier2Done])

  // Real-action listener — the source of truth for the other 5 Tier 2
  // steps. Callers dispatch via /app/lib/guideActions.js.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mounted || !tier2Unlocked || explorer) return
    const onAction = (e) => {
      const key = e?.detail?.key
      if (!key) return
      const step = TIER2_STEPS.find((s) => s.key === key)
      if (!step) return
      setTier2Done((prev) => {
        if (prev.has(key)) return prev
        const next = new Set(prev)
        next.add(key)
        writeSet(LS_TIER2, next)
        return next
      })
    }
    window.addEventListener('selfscience:guide-action', onAction)
    return () => window.removeEventListener('selfscience:guide-action', onAction)
  }, [mounted, tier2Unlocked, explorer])

  // Detect Tier 1 completion → trigger transition → unlock Tier 2.
  useEffect(() => {
    if (!mounted || tier2Unlocked || explorer) return
    const allDone = TIER1_STEPS.every((s) => tier1Done.has(s.key))
    if (!allDone) return
    // 2-second transition banner, then reveal Tier 2.
    setTransitioning(true)
    const t = setTimeout(() => {
      writeFlag(LS_TIER2_UNLOCKED, true)
      setTier2Unlocked(true)
      setTransitioning(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [tier1Done, mounted, tier2Unlocked, explorer])

  // Detect Tier 2 completion → promote to Explorer state.
  useEffect(() => {
    if (!mounted || !tier2Unlocked || explorer) return
    const allDone = TIER2_STEPS.every((s) => tier2Done.has(s.key))
    if (!allDone) return
    writeFlag(LS_EXPLORER, true)
    setExplorer(true)
  }, [tier2Done, mounted, tier2Unlocked, explorer])

  // "Next step" pointer (Tier 1 first, then Tier 2 once unlocked).
  const nextKey = useMemo(() => {
    if (!tier2Unlocked) return TIER1_STEPS.find((s) => !tier1Done.has(s.key))?.key
    return TIER2_STEPS.find((s) => !tier2Done.has(s.key))?.key
  }, [tier1Done, tier2Done, tier2Unlocked])

  const excluded = EXCLUDED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // Once Explorer state is reached the full guide is replaced by the
  // header chip (see ExplorerChip.jsx). Return null here.
  if (!mounted || !hasGenome || dismissed || explorer || excluded) return null

  const markT1 = (key) => {
    const s = new Set(tier1Done); s.add(key); writeSet(LS_PROGRESS, s); setTier1Done(s)
  }
  const markT2 = (key) => {
    const s = new Set(tier2Done); s.add(key); writeSet(LS_TIER2, s); setTier2Done(s)
  }
  const hideForever = () => {
    writeFlag(LS_DISMISSED, true)
    setDismissed(true); setSheetOpen(false)
  }
  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    writeFlag(LS_COLLAPSED, next)
  }
  const restartGuide = () => {
    // Reset only guide-related keys (Part 2). Toast the user and let the
    // 'selfscience:guide-changed' event re-hydrate our state in-place.
    resetGuideOnly()
    setSheetOpen(false)
    fireToast('Guide restarted — follow the steps to explore your results')
  }

  const t1Progress = tier1Done.size
  const t2Progress = tier2Done.size
  const totalProgress  = t1Progress + (tier2Unlocked ? t2Progress : 0)
  const totalPossible  = TIER1_STEPS.length + (tier2Unlocked ? TIER2_STEPS.length : 0)

  // ---------------- Desktop panel ----------------
  const desktopPanel = (
    <div
      role="complementary"
      aria-label="Your SelfScience journey"
      className="pointer-events-auto fixed bottom-6 right-6 z-40 hidden w-[320px] rounded-2xl border border-ss-border-warm bg-white shadow-xl md:block"
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
            {totalProgress} of {totalPossible} steps complete
          </div>
        </div>
        {collapsed
          ? <ChevronUp   size={16} className="text-ss-muted" aria-hidden="true" />
          : <ChevronDown size={16} className="text-ss-muted" aria-hidden="true" />}
      </button>

      {!collapsed && (
        <div id="ss-guide-body" className="max-h-[70vh] overflow-y-auto border-t border-ss-border-warm/60 p-4">
          <TierBanner tier={1} progress={t1Progress} total={TIER1_STEPS.length} />
          <StepList
            steps={TIER1_STEPS}
            done={tier1Done}
            nextKey={!tier2Unlocked ? nextKey : null}
            onClickStep={markT1}
          />

          {transitioning && <TransitionBanner />}

          {tier2Unlocked && (
            <>
              <TierBanner tier={2} progress={t2Progress} total={TIER2_STEPS.length} />
              <StepList
                steps={TIER2_STEPS}
                done={tier2Done}
                nextKey={tier2Unlocked ? nextKey : null}
                onClickStep={markT2}
                withHint
              />
            </>
          )}

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
          {/* Restart link (Phase D · Part 2) */}
          <button
            type="button"
            onClick={() => { restartGuide() }}
            className="mt-3 flex w-full items-center justify-center gap-1 font-mono text-[11px] text-ss-muted transition hover:text-ss-teal hover:underline"
          >
            <RefreshCw size={11} /> Restart guide from beginning
          </button>
        </div>
      )}
    </div>
  )

  // ---------------- Mobile FAB + sheet ----------------
  const mobileFab = (
    <button
      type="button"
      onClick={() => setSheetOpen(true)}
      aria-label={`Open your guide — ${totalProgress} of ${totalPossible} steps complete`}
      className="fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ss-green text-white shadow-lg md:hidden"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
    >
      <Compass size={20} />
      {totalProgress > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ss-orange px-1 text-[10px] font-bold text-white ring-2 ring-white"
        >
          {totalProgress}/{totalPossible}
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
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl"
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
              {totalProgress} of {totalPossible} steps complete
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
          <TierBanner tier={1} progress={t1Progress} total={TIER1_STEPS.length} />
          <StepList
            steps={TIER1_STEPS}
            done={tier1Done}
            nextKey={!tier2Unlocked ? nextKey : null}
            onClickStep={(k) => { markT1(k); setSheetOpen(false) }}
          />
          {transitioning && <TransitionBanner />}
          {tier2Unlocked && (
            <>
              <div className="my-4 border-t border-dashed border-ss-border-warm" aria-hidden="true" />
              <TierBanner tier={2} progress={t2Progress} total={TIER2_STEPS.length} />
              <StepList
                steps={TIER2_STEPS}
                done={tier2Done}
                nextKey={tier2Unlocked ? nextKey : null}
                onClickStep={(k) => { markT2(k); setSheetOpen(false) }}
                withHint
              />
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between text-[11px]">
          <button type="button" onClick={hideForever} className="text-ss-muted hover:underline">
            Hide Guide
          </button>
          <span className="text-ss-muted">Auto-hides after 3 days</span>
        </div>
        <button
          type="button"
          onClick={restartGuide}
          className="mt-3 flex w-full items-center justify-center gap-1 font-mono text-[11px] text-ss-muted transition hover:text-ss-teal hover:underline"
        >
          <RefreshCw size={11} /> Restart guide from beginning
        </button>
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

// ─── Sub-components ────────────────────────────────────────────────────

function TierBanner({ tier, progress, total }) {
  const label = tier === 1 ? 'Getting Started' : 'Go Deeper'
  const bg    = tier === 1 ? 'bg-ss-teal'  : 'bg-ss-green'
  return (
    <div className={`${bg} mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-white`}>
      <div className="flex items-center gap-2">
        {tier === 1 ? <Star size={12} /> : <Rocket size={12} />}
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <span className="text-[10.5px] font-semibold">{progress}/{total}</span>
    </div>
  )
}

function TransitionBanner() {
  return (
    <div className="my-3 rounded-lg border border-ss-green/40 bg-ss-green/8 px-3 py-3 text-center text-xs font-semibold text-ss-teal">
      🎉 Nice work — you&apos;ve got the basics. Ready to go deeper?
    </div>
  )
}

function StepList({ steps, done, nextKey, onClickStep, withHint = false }) {
  return (
    <ol className="space-y-2">
      {steps.map(({ key, Icon, label, href, hint, tooltip }) => {
        const isDone = done.has(key)
        const isNext = key === nextKey
        return (
          <li key={key}>
            <div
              className={`group flex items-start gap-3 rounded-lg pr-2 text-sm transition ${
                isDone
                  ? 'bg-ss-green/5 text-ss-muted'
                  : isNext
                    ? 'border-l-[3px] border-ss-green bg-ss-green/8 pl-2 font-semibold text-ss-teal'
                    : 'text-ss-teal hover:bg-ss-bg'
              }`}
            >
              <Link
                href={href}
                onClick={() => onClickStep(key)}
                className={`flex min-w-0 flex-1 items-start gap-3 px-3 py-2.5 ${isDone ? 'line-through' : ''}`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    isDone ? 'bg-ss-green text-white' : isNext ? 'bg-white ring-1 ring-ss-green text-ss-green' : 'bg-white ring-1 ring-ss-border-warm text-ss-muted'
                  }`}
                >
                  {isDone ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">{label}</span>
                  {withHint && hint && !isDone && (
                    <span className="mt-0.5 block text-[10.5px] font-normal leading-snug text-ss-muted no-underline">
                      {hint}
                    </span>
                  )}
                </span>
              </Link>
              {tooltip && <StepTooltip content={tooltip} />}
              <span className={`self-center pl-1 text-[10.5px] font-semibold uppercase tracking-wider ${
                isDone ? 'text-ss-green' : isNext ? 'text-ss-green' : 'text-ss-muted'
              }`}>
                {isDone ? 'Done' : 'View →'}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// Small [?] icon + tooltip bubble. Desktop hover, mobile tap. Positions
// above the icon so we don't clip off the bottom of a mobile sheet.
function StepTooltip({ content }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      // Close on any click / tap outside the tooltip anchor.
      if (!e.target.closest?.('[data-ss-tooltip]')) setOpen(false)
    }
    document.addEventListener('click', onDown)
    return () => document.removeEventListener('click', onDown)
  }, [open])
  return (
    <span data-ss-tooltip className="relative flex self-center">
      <button
        type="button"
        aria-label={`Why this matters — ${content}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
        className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold text-ss-muted transition hover:bg-white hover:text-ss-teal"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full right-0 z-30 mb-2 w-[220px] rounded-lg border border-ss-border-warm bg-white p-2 px-3 text-left text-[0.82rem] font-normal leading-snug text-ss-text shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  )
}

// Export the step arrays so ExplorerChip can render the same list in its
// summary modal without duplicating the source of truth.
export { TIER1_STEPS, TIER2_STEPS, LS_EXPLORER, LS_PROGRESS, LS_TIER2 }
