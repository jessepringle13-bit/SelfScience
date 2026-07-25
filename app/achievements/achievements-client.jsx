'use client'

// /app/app/achievements/achievements-client.jsx
// Full achievements grid grouped by 4 tiers. Unlocked/locked visual
// states + NEW badge for unseen unlocks. Marks all-seen on mount.

import { useEffect, useMemo } from 'react'
import {
  Dna, Search, Bookmark, Compass, BarChart3, Stethoscope, Barcode, TestTube,
  Pill, Map, FileText, Grid3x3, BookOpen, GraduationCap, Calendar, Library,
  User, Star, Pencil, Award, Lock,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import {
  ACHIEVEMENTS, TIER_LABELS, useUnlockedAchievements, markAllSeen,
} from '@/lib/achievements'

const ICONS = { Dna, Search, Bookmark, Compass, BarChart3, Stethoscope, Barcode, TestTube, Pill, Map, FileText, Grid3x3, BookOpen, GraduationCap, Calendar, Library, User, Star, Pencil }

function fmt(iso) {
  try { return `Unlocked ${new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}` }
  catch { return '' }
}

export default function AchievementsClient() {
  const unlocked = useUnlockedAchievements()
  const byId = useMemo(() => Object.fromEntries(unlocked.map((x) => [x.id, x])), [unlocked])
  const total = ACHIEVEMENTS.length
  const done = unlocked.length

  useEffect(() => { markAllSeen() }, [])

  const tiers = [1, 2, 3, 4]
  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      <SiteNav />
      <main className="container py-8">
        <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>Progress</div>
        <h1 className="mt-1 text-[2rem] font-extrabold text-ss-text">Your Achievements</h1>
        <p className="mt-1 font-mono text-[11px] text-ss-muted">{done} of {total} achievements unlocked</p>
        <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-ss-border-warm/70">
          <div className="h-full rounded-full bg-ss-green transition-all duration-500 ease-out" style={{ width: `${(done/total)*100}%` }} />
        </div>

        {tiers.map((t, i) => {
          const items = ACHIEVEMENTS.filter((a) => a.tier === t)
          const tierDone = items.filter((a) => byId[a.id]).length
          return (
            <section key={t} className={i === 0 ? 'mt-8' : 'mt-10'}>
              <div className="font-mono text-[10px] font-bold uppercase text-ss-muted" style={{ letterSpacing: '0.14em' }}>{tierDone} of {items.length} unlocked</div>
              <h2 className="mt-1 text-[1.1rem] font-bold text-ss-text">{TIER_LABELS[t]}</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((a) => <AchievementCard key={a.id} a={a} rec={byId[a.id]} />)}
              </div>
            </section>
          )
        })}
      </main>
      <SiteFooter />
    </div>
  )
}

function AchievementCard({ a, rec }) {
  const unlocked = !!rec
  const Icon = ICONS[a.icon] || Award
  const hideName = !unlocked && a.tier >= 3
  const isNew = !!(rec && rec.seen === false)

  return (
    <div
      className={`relative rounded-2xl px-5 py-5 ${
        unlocked
          ? 'border border-ss-teal/40 bg-white'
          : 'border border-ss-border-warm bg-ss-bg'
      }`}
    >
      {isNew && (
        <span className="absolute right-2 top-2 rounded-full bg-ss-green px-2 py-[2px] font-mono text-[9px] font-bold uppercase text-white">NEW</span>
      )}
      <Icon size={32} className={unlocked ? 'text-ss-green' : 'text-ss-muted opacity-30'} aria-hidden="true" />
      <div className={`mt-2.5 text-[1rem] leading-tight ${unlocked ? 'font-semibold text-ss-text' : 'font-medium text-ss-muted'}`}>
        {hideName ? '???' : a.name}
      </div>
      <p className={`mt-1 text-[0.85rem] ${unlocked ? 'text-ss-muted' : 'text-ss-muted/60'}`}>
        {unlocked ? a.description : 'Keep exploring to unlock this achievement.'}
      </p>
      {unlocked && (
        <>
          <div className="mt-2 font-mono text-[10px] text-ss-muted">{fmt(rec.unlockedAt)}</div>
          <div className="mt-2 border-t border-dashed border-ss-border-warm pt-2 text-[0.82rem] italic text-ss-muted">
            {a.science}
          </div>
        </>
      )}
    </div>
  )
}
