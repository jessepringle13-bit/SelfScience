'use client'

// /app/components/PostUploadOrientation.jsx
// Phase A · Part 4 — one-time interstitial that shows immediately after
// genome processing completes, BEFORE the full dashboard. Presents the 3
// most important findings in plain English (1 green / 1 yellow / 1 orange)
// pulled from the real processed report. If results haven't arrived yet,
// shows an "Analyzing your file..." loading state.
//
// Only renders once per genome upload — dismissal is persisted to
// localStorage under a session-id-scoped key so re-uploading a new file
// re-shows it. Dismissed via the "Show me all my results" button.

import { useEffect, useState } from 'react'
import { ArrowRight, Info, Loader2 } from 'lucide-react'

const LS_KEY = 'ss_orientation_seen'

// SSR-safe helpers
function isDismissed(sessionId) {
  if (typeof window === 'undefined') return true
  try { return window.localStorage.getItem(LS_KEY) === (sessionId || '1') } catch { return true }
}
function markDismissed(sessionId) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_KEY, sessionId || '1') } catch {}
}

// Pull 1 green + 1 yellow + 1 orange from the real report. Yellow and
// orange both come from areasToExplore (only "Awareness" bucket) — we
// use the first item as "yellow (aware)" and the second as
// "orange (action)". If the report only has one awareness item, we render
// it as orange (higher-severity slot) and drop the yellow slot.
function pickTop3(report) {
  const strengths = report?.overview?.strengths || []
  const areas     = report?.overview?.areasToExplore || []
  const green  = strengths[0] || null
  const yellow = areas[1] || null   // secondary aware slot
  const orange = areas[0] || null   // most important awareness / action
  return { green, yellow, orange }
}

function FindingRow({ tone, card }) {
  if (!card) return null
  const cfg = {
    green:  { emoji: '🟢', label: 'Strength',        color: 'text-ss-green',  bg: 'bg-ss-green/8' },
    yellow: { emoji: '🟡', label: 'Be Aware',        color: 'text-ss-amber',  bg: 'bg-ss-amber/8' },
    orange: { emoji: '🟠', label: 'Worth Attention', color: 'text-ss-orange', bg: 'bg-ss-orange/8' },
  }[tone]
  const title = card.name || card.gene || 'Genetic finding'
  const pillar = card.pillar
  const plain = card.plain || card.what_this_means || ''
  return (
    <li className={`flex items-start gap-3 rounded-2xl border border-ss-border-warm bg-white p-4 shadow-sm md:p-5`}>
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg} text-lg`} aria-hidden="true">
        {cfg.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] ${cfg.color}`}>
          {cfg.label}
        </div>
        <h3 className="mt-0.5 text-base font-extrabold leading-snug text-ss-teal md:text-lg">{title}</h3>
        {pillar && (
          <div className="mt-1 text-[11px] text-ss-muted">
            <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 font-semibold text-ss-teal">{pillar}</span>
          </div>
        )}
        {plain && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ss-text">{plain}</p>}
      </div>
    </li>
  )
}

function ColorTooltip({ open, onClose }) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ss-colors-heading"
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h4 id="ss-colors-heading" className="text-base font-extrabold text-ss-teal">What the colors mean</h4>
        <ul className="mt-3 space-y-2 text-sm text-ss-text">
          <li><span aria-hidden="true">🟢</span> <b>Positive</b> — Research links your variant to a favorable outcome.</li>
          <li><span aria-hidden="true">🟡</span> <b>Awareness</b> — Worth knowing about, usually manageable with lifestyle changes.</li>
          <li><span aria-hidden="true">🟠</span> <b>Action</b> — Higher-impact areas where the research suggests specific steps to consider.</li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ss-teal px-4 text-sm font-semibold text-white hover:bg-ss-teal/90"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export default function PostUploadOrientation({ report, onDismiss }) {
  const sessionId = report?.session_id || '1'
  const [visible, setVisible] = useState(false)
  const [showColors, setShowColors] = useState(false)

  // Decide on mount / whenever the session changes.
  useEffect(() => {
    setVisible(!isDismissed(sessionId))
  }, [sessionId])

  if (!visible) return null

  const { green, yellow, orange } = pickTop3(report)
  // Consider results "ready" when at least one bucket has content. If
  // nothing is available yet we render the analyzing state instead.
  const hasFindings = Boolean(green || yellow || orange)
  const totalAreas =
    (report?.pillar_summary && Object.keys(report.pillar_summary).length) ||
    (Object.keys(report?.step1?.pillar_summary || {}).length) ||
    0

  const dismiss = () => {
    markDismissed(sessionId)
    setVisible(false)
    if (typeof onDismiss === 'function') onDismiss()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-20">
      <div className="container pt-24 md:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
            Your results are ready
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
            Here&apos;s what we found
          </h1>
          <p className="mt-3 text-ss-muted">
            Your Genome at a Glance
          </p>
        </div>

        {!hasFindings ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-ss-border-warm bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto animate-spin text-ss-teal" size={28} />
            <p className="mt-3 text-sm font-semibold text-ss-teal">Analyzing your file&hellip;</p>
            <p className="mt-1 text-xs text-ss-muted">
              This usually takes 10-30 seconds. We&apos;ll show your top findings the moment they&apos;re ready.
            </p>
          </div>
        ) : (
          <>
            <p className="mx-auto mt-8 max-w-2xl text-center text-ss-text">
              We analyzed your file and found insights across{' '}
              <b className="text-ss-teal">{totalAreas || 9}</b> health area{totalAreas === 1 ? '' : 's'}. Here are your most important findings:
            </p>

            <ul className="mx-auto mt-8 grid max-w-2xl gap-3">
              <FindingRow tone="green"  card={green}  />
              <FindingRow tone="yellow" card={yellow} />
              <FindingRow tone="orange" card={orange} />
            </ul>

            <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-ss-orange px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark md:w-auto"
              >
                Show me all my results <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowColors(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline"
              >
                <Info size={12} /> What do these colors mean?
              </button>
            </div>
          </>
        )}
      </div>

      <ColorTooltip open={showColors} onClose={() => setShowColors(false)} />
    </div>
  )
}
