'use client'

// /app/components/FirstLook.jsx
// Tier 1 "Understand" experience. Renders when the user is Tier 1 and
// genome results exist. Encapsulates Welcome screen → one-at-a-time
// finding pager → Tier 2 unlock modal.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles, Unlock } from 'lucide-react'
import {
  useTierState,
  initTierStateIfNew,
  dismissWelcome,
  markFindingRead,
  unlockTier2,
} from '@/lib/tierState'

/**
 * Props:
 *   findings: Array<{ id?, rsid?, gene?, geneSymbol?, title?, pillar?, genotype?, classification?, plainSummary?, populationFrequency? }>
 *
 * Behaviour:
 *   - If tier === 2 → returns null (caller renders full results).
 *   - If !hasSeenWelcome → Welcome screen.
 *   - Else → Pager. Resumes at findingsRead.length.
 *   - On completing last card → Unlock modal → sets tier=2.
 */
export default function FirstLook({ findings = [] }) {
  const state = useTierState()
  const [showUnlock, setShowUnlock] = useState(false)
  const [returningMsg, setReturningMsg] = useState(false)

  // Sync findingsTotal on mount / when count changes.
  useEffect(() => {
    if (findings.length > 0) initTierStateIfNew(findings.length)
  }, [findings.length])

  // Show “welcome back” hint for 2s if user is resuming.
  useEffect(() => {
    if (state.hasSeenWelcome && (state.findingsRead?.length || 0) > 0 && !state.findingsCompleted) {
      setReturningMsg(true)
      const t = setTimeout(() => setReturningMsg(false), 2200)
      return () => clearTimeout(t)
    }
  }, [state.hasSeenWelcome])

  // Which finding index the user is currently on.
  const currentIdx = useMemo(() => {
    const read = new Set((state.findingsRead || []).map(String))
    // Find the first index not yet read.
    for (let i = 0; i < findings.length; i++) {
      if (!read.has(String(findings[i]?.id ?? findings[i]?.rsid ?? i))) return i
    }
    return findings.length - 1
  }, [state.findingsRead, findings])

  const [viewIdx, setViewIdx] = useState(currentIdx)
  useEffect(() => { setViewIdx(currentIdx) }, [currentIdx])

  // If tier already 2, don’t render anything.
  if (state.tier >= 2) return null
  if (!findings || findings.length === 0) return null

  const total = findings.length

  // ------------- Welcome -------------
  if (!state.hasSeenWelcome) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ss-canvas p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-ss-orange" />
            <span className="font-bold text-ss-text">SelfScience</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ss-text md:text-4xl">Your results are ready.</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ss-muted">
            You have {total} key findings. We’ll walk you through them one at a time — starting with what matters most.
          </p>
          <button
            type="button"
            onClick={dismissWelcome}
            className="ss-glow-orange-btn mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ss-orange px-8 text-sm font-bold text-white transition hover:bg-ss-orange-dark"
          >
            See my first finding <ArrowRight size={14} />
          </button>
          <p className="mt-6 text-[12px] text-ss-muted">Your progress is saved on this device. Come back anytime.</p>
        </div>
      </div>
    )
  }

  // ------------- Pager -------------
  const f = findings[viewIdx] || findings[0]
  const readCount = state.findingsRead?.length || 0
  const isLast = viewIdx === total - 1
  const alreadyRead = (state.findingsRead || []).includes(String(f?.id ?? f?.rsid ?? viewIdx))

  const handleUnderstand = () => {
    markFindingRead(f?.id ?? f?.rsid ?? viewIdx)
    // If this was the last, open unlock modal.
    if (isLast) { setShowUnlock(true); return }
    setViewIdx((i) => Math.min(total - 1, i + 1))
  }

  const handleSkip = () => {
    if (isLast) return
    setViewIdx((i) => Math.min(total - 1, i + 1))
  }

  const handleBack = () => setViewIdx((i) => Math.max(0, i - 1))

  const handleUnlock = () => {
    unlockTier2()
    setShowUnlock(false)
    // Full page reload so the parent picks up the tier flip and renders
    // the existing full results view.
    try { window.location.reload() } catch {}
  }

  return (
    <div className="min-h-screen bg-ss-canvas pb-20 pt-24">
      {returningMsg && (
        <div className="pointer-events-none fixed left-1/2 top-24 z-[70] -translate-x-1/2 rounded-full bg-ss-surface px-4 py-2 text-[12.5px] text-ss-muted shadow-lg ring-1 ring-ss-border-warm/40">
          Welcome back. Picking up where you left off — Finding {viewIdx + 1} of {total}.
        </div>
      )}

      <div className="container max-w-2xl">
        {/* Progress bar dots — muted for unread/active, orange for read */}
        <div className="mb-8 text-center">
          <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-ss-orange">
            Finding {viewIdx + 1} of {total}
          </div>
          <div className="mt-3 flex justify-center gap-1.5">
            {findings.map((ff, i) => {
              const idKey = String(ff?.id ?? ff?.rsid ?? i)
              const done = (state.findingsRead || []).includes(idKey)
              const active = i === viewIdx
              return (
                <span
                  key={i}
                  className={`inline-block h-1.5 rounded-full transition ${
                    done ? 'w-6 bg-ss-orange' :
                    active ? 'w-6 bg-ss-orange/70' :
                    'w-3 bg-ss-muted/40'
                  }`}
                />
              )
            })}
          </div>
          <div className="mt-2 text-[12px] text-ss-muted">{readCount} of {total} read · {total - readCount} to go</div>
        </div>

        {/* Card — uses the shared design tokens so it matches the rest of
            the site. Not a copy of the huge variant card component;
            renders the fields most users need. */}
        <div className="rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-6 shadow-lg md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {f?.pillar && (
              <span className="inline-flex items-center rounded-full border border-ss-teal/40 bg-ss-teal/[0.08] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ss-label">
                {f.pillar}
              </span>
            )}
            {f?.classification && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                f.classification === 'strength' ? 'bg-ss-green/15 text-ss-green ring-1 ring-ss-green/30' :
                f.classification === 'aware'    ? 'bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/30' :
                'bg-ss-muted/15 text-ss-muted ring-1 ring-ss-muted/30'
              }`}>
                {f.classification === 'strength' ? 'Positive' : f.classification === 'aware' ? 'Be Aware' : 'Typical'}
              </span>
            )}
            <span className="ml-auto font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ss-label">Established</span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold text-ss-text md:text-3xl">
            {f?.gene || f?.geneSymbol || 'Gene'}{f?.rsid ? <span className="ml-2 font-mono text-[13px] font-semibold text-ss-muted">· {f.rsid}</span> : null}
          </h2>
          {f?.title && f.title !== (f?.gene || f?.geneSymbol) && (
            <p className="mt-1.5 text-[15px] font-semibold text-ss-text">{f.title}</p>
          )}

          {f?.genotype && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ss-canvas/60 px-3 py-1.5">
              <span className="text-[11px] uppercase tracking-widest text-ss-label">Your genotype</span>
              <span className="font-mono text-[13.5px] font-bold text-ss-text">{f.genotype}</span>
            </div>
          )}

          {/* Plain-English explainer. Always expanded per spec. */}
          <div className="mt-5 border-l-2 border-ss-teal/40 pl-4 text-[14.5px] leading-relaxed text-ss-text">
            <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-label">What does this mean?</div>
            {f?.plainSummary || f?.description || f?.summary || 'This is one of your key findings from your uploaded genome. Read the full detail in the next tier once you’ve reviewed all your findings.'}
          </div>

          {f?.populationFrequency != null && (
            <div className="mt-4 text-[12px] text-ss-muted">Population frequency: <span className="font-mono text-ss-text">{typeof f.populationFrequency === 'number' ? `${(f.populationFrequency * 100).toFixed(1)}%` : f.populationFrequency}</span></div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleUnderstand}
            className="ss-glow-orange-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ss-orange px-7 text-sm font-bold text-white transition hover:bg-ss-orange-dark"
          >
            {isLast ? (
              <>I’ve read all my findings — show me everything <ArrowRight size={14} /></>
            ) : (
              <>I understand this <ArrowRight size={14} /></>
            )}
          </button>
          <div className="flex items-center gap-4 text-[12.5px]">
            {viewIdx > 0 && (
              <button type="button" onClick={handleBack} className="inline-flex items-center gap-1 font-semibold text-ss-muted hover:text-ss-text">
                <ArrowLeft size={12} /> Previous finding
              </button>
            )}
            {!isLast && (
              <button type="button" onClick={handleSkip} className="font-semibold text-ss-muted underline decoration-dotted underline-offset-4 hover:text-ss-text">
                Skip for now
              </button>
            )}
          </div>
          {alreadyRead && !isLast && (
            <div className="text-[11.5px] text-ss-muted">You’ve already read this one.</div>
          )}
        </div>
      </div>

      {/* Tier 2 Unlock modal */}
      {showUnlock && (
        <UnlockModal total={total} onExplore={handleUnlock} />
      )}
    </div>
  )
}

function UnlockModal({ total, onExplore }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10002] flex items-center justify-center bg-ss-canvas/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[480px] rounded-2xl border border-ss-border-warm/40 bg-ss-surface p-8 shadow-2xl md:p-10">
        <div className="mb-5 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ss-orange/15 ring-1 ring-ss-orange/40">
            <Unlock size={22} className="text-ss-orange" />
          </span>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-ss-text md:text-[28px]">You understand your genetics.</h2>
        <p className="mx-auto mt-3 max-w-md text-center text-[14.5px] leading-relaxed text-ss-muted">
          You’ve read all {total} of your key findings. Your full toolkit is now available.
        </p>

        <ul className="mt-6 space-y-2">
          {[
            { title: 'Full results', body: `all ${total} variants across all pillars` },
            { title: 'Research tools', body: 'search the studies behind your findings' },
            { title: 'Your Protocol', body: 'supplement and lifestyle recommendations' },
          ].map((it) => (
            <li key={it.title} className="flex items-start gap-3 rounded-lg border-l-2 border-ss-teal/60 bg-ss-canvas/40 py-2 pl-3 pr-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ss-text">{it.title}</span>
                <span className="mt-0.5 block text-[12.5px] text-ss-muted">{it.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onExplore}
          className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ss-orange text-[14.5px] font-bold text-white transition hover:bg-ss-orange-dark"
        >
          Explore everything <ArrowRight size={14} />
        </button>
        <p className="mt-3 text-center text-[11.5px] text-ss-muted">Your progress is saved. Come back anytime.</p>
      </div>
    </div>
  )
}
