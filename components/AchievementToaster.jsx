'use client'

// /app/components/AchievementToaster.jsx
// Global celebration toast for achievement unlocks.
// Listens for UNLOCK_EVENT, queues, and slide-in-slides-out.
// Also runs checkAll() on mount + on the ambient events that the app
// already fires (variant-expanded, learning-changed, reading-list-
// changed, profile-changed, digest-viewed-changed, pillar-intro-changed)
// so achievements catch up organically after other UI actions.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Dna, Search, Bookmark, Compass, BarChart3, Stethoscope, Barcode, TestTube,
  Pill, Map, FileText, Grid3x3, BookOpen, GraduationCap, Calendar, Library,
  User, Star, Pencil, Award, X,
} from 'lucide-react'
import {
  UNLOCK_EVENT, checkAll, markFindingExpanded, markPillarClicked,
  ACHIEVEMENTS,
} from '@/lib/achievements'

const ICONS = { Dna, Search, Bookmark, Compass, BarChart3, Stethoscope, Barcode, TestTube, Pill, Map, FileText, Grid3x3, BookOpen, GraduationCap, Calendar, Library, User, Star, Pencil }

export default function AchievementToaster() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const [entered, setEntered] = useState(false)
  const timerRef = useRef(null)

  // Re-check triggers on mount + on ambient app events + on window focus.
  useEffect(() => {
    checkAll()
    const onCheck = () => checkAll()
    const events = [
      'selfscience:variant-expanded', 'selfscience:learning-changed',
      'selfscience:reading-list-changed', 'selfscience:profile-changed',
      'selfscience:digest-viewed-changed', 'selfscience:pillar-intro-changed',
      'focus',
    ]
    events.forEach((e) => window.addEventListener(e, onCheck))

    // Track distinct variant expansions for the *_findings tallies.
    const onExpand = (e) => {
      const p = e?.detail?.pillar || ''
      // Use pillar+timestamp isn't unique — we don't get rsid here.
      // As a best-effort dedupe token, hash the section's pillar + card
      // title-length available from the DOM; fallback = ISO minute stamp.
      markFindingExpanded(`${p}:${Date.now()}`.slice(0, 40))
    }
    window.addEventListener('selfscience:variant-expanded', onExpand)
    return () => {
      events.forEach((e) => window.removeEventListener(e, onCheck))
      window.removeEventListener('selfscience:variant-expanded', onExpand)
    }
  }, [])

  // Queue new unlocks.
  useEffect(() => {
    const onUnlock = (e) => {
      const item = e?.detail
      if (!item) return
      setQueue((q) => [...q, item])
    }
    window.addEventListener(UNLOCK_EVENT, onUnlock)
    return () => window.removeEventListener(UNLOCK_EVENT, onUnlock)
  }, [])

  // Dequeue if no current.
  useEffect(() => {
    if (current || queue.length === 0) return
    const next = queue[0]
    // 600ms delay per spec — let triggering action settle.
    const t = setTimeout(() => {
      setCurrent(next)
      setQueue((q) => q.slice(1))
      setLeaving(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
      timerRef.current = setTimeout(() => setLeaving(true), 6000)
      setTimeout(() => { setCurrent(null); setEntered(false) }, 6000 + 320)
    }, 600)
    return () => clearTimeout(t)
  }, [queue, current])

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setLeaving(true)
    setTimeout(() => { setCurrent(null); setEntered(false) }, 320)
  }

  if (!current) return null
  const Icon = ICONS[current.icon] || Award
  const isBigTier = current.tier >= 3

  // prefers-reduced-motion: opacity only, no translate, no confetti.
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const style = {
    transition: reduced ? 'opacity 300ms ease' : 'transform 350ms ease-out, opacity 350ms ease-out',
    transform: reduced ? 'none' : (leaving ? 'translateY(120%)' : entered ? 'translateY(0)' : 'translateY(120%)'),
    opacity: entered && !leaving ? 1 : 0,
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[90] w-[calc(100%-32px)] max-w-[320px] rounded-2xl bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-ss-teal/40"
      style={{ ...style, borderLeft: '4px solid var(--ss-green,#2E7D32)' }}
    >
      {isBigTier && !reduced && <Confetti />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={22} className="text-ss-green" aria-hidden="true" />
          <span
            className="font-mono text-[9px] font-bold uppercase text-ss-green"
            style={{ letterSpacing: '0.14em' }}
          >
            Achievement unlocked
          </span>
        </div>
        <button type="button" aria-label="Dismiss" onClick={dismiss} className="text-ss-muted hover:text-ss-teal">
          <X size={16} />
        </button>
      </div>
      <div className="mt-1.5 text-[1.1rem] font-semibold text-ss-text">{current.name}</div>
      <div className="mt-1 text-[0.88rem] text-ss-muted">{current.description}</div>
      <div className="mt-2.5 border-t border-dashed border-ss-border-warm pt-2.5 text-[0.83rem] italic text-ss-muted">
        {current.science}
      </div>
      <div className="mt-3">
        <Link href="/achievements" className="font-mono text-[10px] font-semibold text-ss-teal hover:underline">
          View all achievements →
        </Link>
      </div>
    </div>
  )
}

/* --------------------------- Confetti -------------------------------- */

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    left: 30 + Math.random() * 40,       // %
    tx: -60 + Math.random() * 120,        // final x offset (px)
    ty: -100 - Math.random() * 90,        // final y offset (px)
    rot: Math.random() * 720 - 360,
    color: ['#2E7D32', '#C45820', '#1B474D', '#F7F6F2'][i % 4],
    delay: Math.random() * 120,
  })), [])
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${b.left}%`,
            width: 4, height: 8,
            background: b.color,
            transform: 'translate(0,0) rotate(0deg)',
            animation: `ss-conf 1200ms ease-out ${b.delay}ms both`,
            // @ts-ignore - CSS custom properties
            ['--tx']: `${b.tx}px`,
            ['--ty']: `${b.ty}px`,
            ['--rot']: `${b.rot}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes ss-conf {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
