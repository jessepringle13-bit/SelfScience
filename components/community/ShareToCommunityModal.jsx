'use client'

// /app/components/community/ShareToCommunityModal.jsx
// Modal used from Journal entries and Finding cards to post a
// reflection to the community feed. Runs the same client-side PII
// filter on every keystroke; won't submit if the check fails.

import { useEffect, useMemo, useState } from 'react'
import { X, ArrowRight, Send } from 'lucide-react'
import { PILLARS } from '@/components/site-nav'
import {
  checkContent, createPost, getDisplayName, getShareSettings, isOptedIn,
} from '@/lib/community'

export default function ShareToCommunityModal({ initialText = '', pillar = null, onClose }) {
  const [text, setText] = useState((initialText || '').slice(0, 280))
  const [selectedPillar, setSelectedPillar] = useState(pillar || null)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const displayName = useMemo(() => getDisplayName(), [])
  const settings = useMemo(() => getShareSettings(), [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const check = useMemo(() => checkContent(text), [text])
  const remaining = 280 - text.length

  const submit = async () => {
    if (!check.ok || !displayName) return
    setPosting(true); setError(null)
    const { ok, error: err } = await createPost({
      displayName,
      text,
      pillarTag: selectedPillar || null,
    })
    setPosting(false)
    if (!ok) { setError(err || 'Could not share. Please try again.'); return }
    setDone(true)
    try {
      window.dispatchEvent(new CustomEvent('selfscience:toast', { detail: { message: 'Shared with the community', tone: 'success' } }))
    } catch {}
    setTimeout(() => onClose?.(), 900)
  }

  // If the user isn't opted in, don't render anything (shouldn't happen).
  if (!isOptedIn()) return null
  if (!settings?.reflections) {
    // Reflections sharing not enabled — tell the user how to fix it.
    return (
      <ShellWrapper onClose={onClose} step="Reflection sharing off">
        <p className="text-sm text-ss-muted">
          You have reflection sharing turned off. Enable it in <span className="font-semibold text-ss-teal">Community Settings</span> to post to the feed.
        </p>
        <div className="mt-3 flex justify-end">
          <a href="/community/settings" className="rounded-full bg-ss-teal px-4 py-1.5 text-xs font-semibold text-white hover:bg-ss-teal-dark">Open settings</a>
        </div>
      </ShellWrapper>
    )
  }

  return (
    <ShellWrapper onClose={onClose} step="Share with the community">
      {done ? (
        <p className="text-sm text-ss-green">Shared with the community.</p>
      ) : (
        <>
          <div className="rounded-xl border border-ss-border-warm/60 bg-ss-bg/60 p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px]">
              <span className="font-mono font-semibold text-ss-teal">{displayName}</span>
              {selectedPillar && (
                <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">{selectedPillar}</span>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 280))}
              rows={4}
              placeholder="Share what you've been noticing or learning…"
              className={`w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:outline-none focus:ring-2 ${
                text && !check.ok
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-ss-border-warm focus:border-ss-teal focus:ring-ss-teal/20'
              }`}
            />
            <div className="mt-1 flex items-center justify-between text-[11px]">
              {text && !check.ok ? (
                <span className="text-red-600">{check.reason}</span>
              ) : (
                <span className="text-ss-muted">On-device privacy filter is watching for personal info.</span>
              )}
              <span className={remaining < 20 ? 'font-semibold text-ss-amber' : 'text-ss-muted'}>
                {text.length} / 280
              </span>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.12em' }}>
              Tag to a pillar (optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPillar(null)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  !selectedPillar ? 'border-ss-teal bg-ss-teal text-white' : 'border-ss-border-warm text-ss-muted hover:border-ss-teal/40'
                }`}
              >
                None
              </button>
              {PILLARS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedPillar(p.name)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    selectedPillar === p.name ? 'border-ss-teal bg-ss-teal text-white' : 'border-ss-border-warm text-ss-muted hover:border-ss-teal/40'
                  }`}
                >
                  {p.short}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </>
      )}

      {!done && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-ss-border-warm px-4 py-1.5 text-xs font-semibold text-ss-muted hover:bg-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={posting || !check.ok}
            className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
              check.ok && !posting ? 'bg-ss-green hover:brightness-110' : 'cursor-not-allowed bg-ss-border-warm'
            }`}
          >
            {posting ? 'Posting…' : 'Post to community'} <Send size={12} />
          </button>
        </div>
      )}
    </ShellWrapper>
  )
}

function ShellWrapper({ children, onClose, step }) {
  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 backdrop-blur-sm md:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ss-border-warm/70 px-4 py-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>
              Community
            </div>
            <h2 className="text-lg font-extrabold text-ss-text">{step}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-teal">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
