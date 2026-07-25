'use client'

// /app/app/community/community-client.jsx
// Anonymous community hub with 3 sections: Pillar Popularity, Feed,
// Finding Frequency aggregates.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Users, ArrowLeft, ThumbsUp, Flag, ChevronDown, X,
} from 'lucide-react'
import SiteNav, { PILLARS } from '@/components/site-nav'
import {
  isOptedIn, getDisplayName, useCommunityState,
  fetchMemberCount, fetchPillarPopularity, fetchFeed,
  toggleReaction, reportPost, roundToNearest50,
} from '@/lib/community'
import CommunityOptInModal from '@/components/community/CommunityOptInModal'

const REPORT_REASONS = [
  'Inappropriate content',
  'Personal information shared',
  'Spam',
  'Other',
]

export default function CommunityClient() {
  const { optedIn, name } = useCommunityState()
  const [modalOpen, setModalOpen] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [pillarStats, setPillarStats] = useState({ total: 0, buckets: {} })
  const [feed, setFeed] = useState([])
  const [feedFilter, setFeedFilter] = useState('all')
  const [feedOffset, setFeedOffset] = useState(0)
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedHasMore, setFeedHasMore] = useState(true)
  const [reportPostId, setReportPostId] = useState(null)

  // Load initial data.
  useEffect(() => {
    fetchMemberCount().then(setMemberCount).catch(() => {})
    fetchPillarPopularity().then(setPillarStats).catch(() => {})
  }, [])

  // Load feed whenever filter changes.
  useEffect(() => {
    let alive = true
    setFeedLoading(true); setFeedOffset(0)
    fetchFeed({ limit: 10, offset: 0, pillar: feedFilter }).then(({ posts }) => {
      if (!alive) return
      setFeed(posts)
      setFeedOffset(posts.length)
      setFeedHasMore(posts.length === 10)
      setFeedLoading(false)
    })
    return () => { alive = false }
  }, [feedFilter])

  const loadMore = async () => {
    const { posts } = await fetchFeed({ limit: 10, offset: feedOffset, pillar: feedFilter })
    setFeed((f) => [...f, ...posts])
    setFeedOffset((n) => n + posts.length)
    setFeedHasMore(posts.length === 10)
  }

  const roundedCount = useMemo(() => roundToNearest50(memberCount), [memberCount])

  const myInterests = useMemo(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(window.localStorage.getItem('ss_interests') || '[]') } catch { return [] }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24">
      <SiteNav />
      <div className="container pt-24 md:pt-28">
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
            <Users size={22} />
          </span>
          <div>
            <div
              className="font-mono text-[10px] font-bold uppercase text-ss-teal"
              style={{ letterSpacing: '0.14em' }}
            >
              Anonymous by default
            </div>
            <h1 className="text-3xl font-extrabold text-ss-text md:text-4xl">The SelfScience Community</h1>
            <p className="mt-1 max-w-2xl text-ss-muted">
              Explore what others are learning about their genomes — privately, anonymously, and with full control over what you share.
            </p>
            <div
              className="mt-2 font-mono text-[11px] text-ss-muted"
              style={{ letterSpacing: '0.02em' }}
            >
              {roundedCount}+ members exploring their genomes
            </div>
          </div>
        </div>

        {!optedIn && (
          <div className="mt-6 rounded-2xl border border-ss-teal/40 bg-ss-teal/[0.06] p-5 md:flex md:items-center md:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold text-ss-teal">Join anonymously to see everything</h2>
              <p className="mt-1 text-sm text-ss-muted">Choose a display name, pick what you share, and see how your genome compares to other members.</p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ss-green px-4 py-2 text-sm font-semibold text-white hover:brightness-110 md:mt-0"
            >
              Join anonymously
            </button>
          </div>
        )}

        {/* ============= SECTION A — PILLAR POPULARITY ============= */}
        <section className="mt-10">
          <div className="mb-3">
            <div
              className="font-mono text-[10px] font-bold uppercase text-ss-teal"
              style={{ letterSpacing: '0.14em' }}
            >
              Across the community
            </div>
            <h2 className="text-xl font-extrabold text-ss-text">What people are exploring</h2>
          </div>
          {pillarStats.total < 50 ? (
            <p className="rounded-lg border border-dashed border-ss-border-warm bg-white/60 p-4 text-sm text-ss-muted">
              Community stats will appear as more members join.
            </p>
          ) : (
            <ul className="space-y-2">
              {PILLARS.map((p) => {
                const n = pillarStats.buckets[p.name] || 0
                const pct = Math.round((n / pillarStats.total) * 100)
                const mine = optedIn && myInterests.includes(p.key)
                return (
                  <li key={p.key} className="flex items-center gap-3">
                    <span className="w-40 truncate font-mono text-[11px] text-ss-text">{p.short}</span>
                    <div className="relative flex-1">
                      <div className="h-2 rounded-full bg-ss-border-warm/40">
                        <div className="h-2 rounded-full bg-ss-teal" style={{ width: `${pct}%` }} />
                      </div>
                      {mine && (
                        <span
                          className="absolute -top-4 h-3 w-3 -translate-x-1/2 rounded-full bg-ss-green ring-2 ring-white"
                          style={{ left: `${pct}%` }}
                          title="You"
                        />
                      )}
                    </div>
                    <span className="w-12 text-right font-mono text-[10px] text-ss-muted">{pct}%</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ============= SECTION B — FEED ============= */}
        <section className="mt-12">
          <div className="mb-3">
            <div
              className="font-mono text-[10px] font-bold uppercase text-ss-teal"
              style={{ letterSpacing: '0.14em' }}
            >
              Recent shares
            </div>
            <h2 className="text-xl font-extrabold text-ss-text">What members are discovering</h2>
          </div>

          {/* Filter chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active={feedFilter === 'all'} onClick={() => setFeedFilter('all')} label="All pillars" />
            {PILLARS.map((p) => (
              <FilterChip key={p.key} active={feedFilter === p.name} onClick={() => setFeedFilter(p.name)} label={p.short} />
            ))}
          </div>

          {feedLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-ss-border-warm/60" />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ss-border-warm bg-white/60 p-4 text-sm text-ss-muted">
              No shares yet. Be the first to add one!
            </p>
          ) : (
            <ul className="space-y-3">
              {feed.map((post) => (
                <FeedItem
                  key={post.id}
                  post={post}
                  optedIn={optedIn}
                  displayName={name}
                  onReport={() => setReportPostId(post.id)}
                />
              ))}
            </ul>
          )}

          {feedHasMore && !feedLoading && feed.length > 0 && (
            <div className="mt-4 text-center">
              <button
                type="button" onClick={loadMore}
                className="inline-flex items-center gap-1 rounded-full border border-ss-teal px-4 py-1.5 text-xs font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
              >
                Load more <ChevronDown size={12} />
              </button>
            </div>
          )}
        </section>

        {/* ============= SECTION C — FINDING FREQUENCY ============= */}
        <section className="mt-12">
          <div className="mb-3">
            <div
              className="font-mono text-[10px] font-bold uppercase text-ss-teal"
              style={{ letterSpacing: '0.14em' }}
            >
              Aggregate data only
            </div>
            <h2 className="text-xl font-extrabold text-ss-text">How common are your findings?</h2>
          </div>
          <div className={optedIn ? '' : 'relative'}>
            <div className={optedIn ? '' : 'pointer-events-none select-none blur-sm'}>
              <p className="rounded-lg border border-dashed border-ss-border-warm bg-white/60 p-4 text-sm text-ss-muted">
                Not enough data yet to display finding-level statistics. Aggregates will appear once at least 50 members have joined.
              </p>
              <p className="mt-3 text-[0.82rem] italic text-ss-muted">
                These statistics are calculated from anonymous aggregate data. No individual’s findings are ever identified or shared.
              </p>
            </div>
            {!optedIn && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/40 backdrop-blur-sm">
                <button
                  type="button" onClick={() => setModalOpen(true)}
                  className="rounded-full bg-ss-green px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110"
                >
                  Join anonymously to see aggregates
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="mt-14 rounded-2xl border-l-4 border-ss-teal bg-white/70 p-4">
          <p className="text-sm text-ss-muted">
            <span className="font-semibold text-ss-teal">Anonymous by design.</span> Your real name, email, and raw genome never leave your device. Only content you explicitly share appears here.
          </p>
        </div>
      </div>

      {modalOpen && <CommunityOptInModal onClose={() => setModalOpen(false)} />}
      {reportPostId && (
        <ReportModal
          postId={reportPostId}
          reporterName={name}
          onClose={() => setReportPostId(null)}
        />
      )}
    </div>
  )
}

/* --------------------------- Sub-components ------------------------- */

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
        active ? 'border-ss-teal bg-ss-teal text-white' : 'border-ss-border-warm text-ss-muted hover:border-ss-teal/40 hover:text-ss-teal'
      }`}
    >
      {label}
    </button>
  )
}

function FeedItem({ post, optedIn, displayName, onReport }) {
  const [expanded, setExpanded] = useState(false)
  const [reacted, setReacted] = useState(post.reacted_by_me)
  const [count, setCount] = useState(post.helpful_count)
  const long = post.text.length > 280
  const text = expanded || !long ? post.text : post.text.slice(0, 280) + '…'

  const handleReact = async () => {
    if (!optedIn || !displayName) return
    // optimistic
    if (reacted) { setReacted(false); setCount(Math.max(0, count - 1)) }
    else { setReacted(true); setCount(count + 1) }
    await toggleReaction(post.id, displayName)
  }

  return (
    <li className="rounded-2xl border border-ss-border-warm bg-white p-4 md:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-semibold text-ss-teal">{post.display_name}</span>
        {post.pillar_tag && (
          <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold text-ss-teal">{post.pillar_tag}</span>
        )}
        <span className="ml-auto font-mono text-[10px] text-ss-muted">{timeAgo(post.posted_at)}</span>
      </div>
      <p className="whitespace-pre-wrap text-[0.93rem] leading-[1.65] text-ss-text">{text}</p>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 font-mono text-[10px] font-semibold text-ss-teal hover:underline">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      <div className="mt-3 flex items-center gap-4">
        <button
          type="button" onClick={handleReact}
          disabled={!optedIn}
          className={`inline-flex items-center gap-1 font-mono text-[10px] transition ${
            reacted ? 'text-ss-green' : 'text-ss-muted hover:text-ss-teal'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <ThumbsUp size={12} fill={reacted ? 'currentColor' : 'none'} />
          {count} found this helpful
        </button>
        <button type="button" onClick={onReport} className="inline-flex items-center gap-1 font-mono text-[10px] text-ss-muted hover:text-ss-red">
          <Flag size={11} /> Report this post
        </button>
      </div>
    </li>
  )
}

function ReportModal({ postId, reporterName, onClose }) {
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const submit = async () => {
    setSubmitting(true)
    await reportPost({ postId, reporterName: reporterName || 'anonymous', reason })
    setSubmitting(false); setDone(true)
    setTimeout(() => onClose?.(), 1200)
  }
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ss-border-warm/70 px-4 py-3">
          <h3 className="text-base font-extrabold text-ss-text">Report post</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full text-ss-muted hover:bg-ss-bg"><X size={16} className="m-auto" /></button>
        </div>
        <div className="px-4 py-4">
          {done ? (
            <p className="text-sm text-ss-green">Thanks — report submitted.</p>
          ) : (
            <>
              <label className="block text-sm text-ss-muted">Reason</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm">
                {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </>
          )}
        </div>
        {!done && (
          <div className="flex justify-end gap-2 border-t border-ss-border-warm/70 px-4 py-3">
            <button type="button" onClick={onClose} className="rounded-full border border-ss-border-warm px-4 py-1.5 text-xs font-semibold text-ss-muted">Cancel</button>
            <button type="button" onClick={submit} disabled={submitting} className="rounded-full bg-ss-teal px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Submit</button>
          </div>
        )}
      </div>
    </div>
  )
}

function timeAgo(iso) {
  try {
    const t = Date.parse(iso); if (!Number.isFinite(t)) return ''
    const s = Math.floor((Date.now() - t) / 1000)
    if (s < 60) return 'just now'
    const m = Math.floor(s / 60); if (m < 60) return `${m} minute${m===1?'':'s'} ago`
    const h = Math.floor(m / 60); if (h < 24) return `${h} hour${h===1?'':'s'} ago`
    const d = Math.floor(h / 24); if (d < 30) return `${d} day${d===1?'':'s'} ago`
    return new Date(iso).toLocaleDateString()
  } catch { return '' }
}
