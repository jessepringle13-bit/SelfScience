'use client'

// /app/app/admin/hero-cta/page.js
// Simple admin dashboard for the homepage-hero quiz-CTA A/B test.
// Auth via ?token=<ADMIN_TOKEN>. Reads /api/admin/hero-cta-stats.

import { useEffect, useMemo, useState } from 'react'

export default function HeroCtaAdmin() {
  const [token, setToken] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = new URLSearchParams(window.location.search).get('token') || ''
    setToken(t)
  }, [])

  const load = async () => {
    if (!token) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/hero-cta-stats?token=${encodeURIComponent(token)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) { setError(e.message || 'Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) load() }, [token])

  // Compute per-variant totals + CTR from the raw byKey map.
  const rows = useMemo(() => {
    const snap = data?.snapshot
    if (!snap) return []
    const byVar = {}
    for (const [key, v] of Object.entries(snap.byKey || {})) {
      // key = location|cta|variant|kind
      const [location, cta, variant, kind] = key.split('|')
      if (location !== 'homepage-hero' || cta !== 'quiz_secondary') continue
      const bucket = byVar[variant] || (byVar[variant] = { variant, impressions: 0, clicks: 0 })
      bucket[kind === 'click' ? 'clicks' : 'impressions'] += v.count || 0
    }
    return Object.values(byVar)
      .sort((a, b) => (a.variant > b.variant ? 1 : -1))
      .map((r) => ({ ...r, ctr: r.impressions > 0 ? (r.clicks / r.impressions) : 0 }))
  }, [data])

  const totals = useMemo(() => {
    return rows.reduce((acc, r) => {
      acc.impressions += r.impressions
      acc.clicks      += r.clicks
      return acc
    }, { impressions: 0, clicks: 0 })
  }, [rows])

  const maxImp = Math.max(1, ...rows.map((r) => r.impressions))

  const COPY = {
    a: 'Not ready to upload DNA? Take the 2-minute quiz →',
    b: 'Don’t have DNA data yet? Take the 2-minute quiz →',
    c: 'Skip DNA — take the quiz →',
  }

  return (
    <div className="min-h-screen bg-[#F6F5F0] p-6 font-mono text-sm text-[#28251D]">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold text-[#1B474D]">SelfScience · Hero CTA A/B</h1>
          <button onClick={load} disabled={!token || loading} className="rounded-full bg-[#1B474D] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {!token && (
          <div className="mt-6 rounded-lg border border-[#B07D00] bg-[#FFFBEA] p-4">
            No token. Append <code>?token=&lt;ADMIN_TOKEN&gt;</code> to the URL.
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-lg border border-red-400 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        {rows.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatBox label="Total impressions" value={totals.impressions.toLocaleString()} />
              <StatBox label="Total clicks"      value={totals.clicks.toLocaleString()} />
              <StatBox label="Overall CTR"       value={totals.impressions > 0 ? `${(totals.clicks / totals.impressions * 100).toFixed(2)}%` : '—'} />
            </div>

            <section className="mt-8 rounded-lg border border-black/10 bg-white p-4">
              <h2 className="mb-4 text-sm font-bold text-[#1B474D]">By variant</h2>
              <div className="space-y-4">
                {rows.map((r) => {
                  const pct = (r.impressions / maxImp) * 100
                  const ctrPct = (r.ctr * 100).toFixed(2)
                  const isBest = rows.length > 1 && r.ctr === Math.max(...rows.map((x) => x.ctr)) && r.impressions >= 20
                  return (
                    <div key={r.variant} className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full font-bold ${isBest ? 'bg-[#1B474D] text-white' : 'bg-[#EDEBE2] text-[#28251D]'}`}>
                            {r.variant.toUpperCase()}
                          </span>
                          <span className="ml-2 text-xs text-[#7A7974]">“{COPY[r.variant] || r.variant}”</span>
                        </div>
                        <div className="text-right text-xs">
                          <span className="font-bold text-[#1B474D]">{r.clicks}</span> / {r.impressions.toLocaleString()} ·
                          <span className="ml-1 font-bold text-[#1B474D]">CTR {ctrPct}%</span>
                          {isBest && <span className="ml-2 rounded-full bg-[#1B474D] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Leader</span>}
                        </div>
                      </div>
                      <div className="relative h-3 overflow-hidden rounded-full bg-[#EDEBE2]">
                        {/* Impressions bar */}
                        <div className="absolute inset-y-0 left-0 bg-[#1B474D]/25" style={{ width: `${pct}%` }} />
                        {/* Clicks bar overlaid */}
                        <div className="absolute inset-y-0 left-0 bg-[#F58642]" style={{ width: `${(r.clicks / maxImp) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-[10px] text-[#7A7974]">Teal = impressions · Orange = clicks. “Leader” appears when a variant has ≥20 impressions AND the top CTR.</div>
            </section>

            <section className="mt-6 rounded-lg border border-black/10 bg-white p-4">
              <h2 className="mb-3 text-sm font-bold text-[#1B474D]">Raw byKey</h2>
              <pre className="overflow-x-auto text-[10px]">{JSON.stringify(data?.snapshot?.byKey || {}, null, 2)}</pre>
            </section>
          </>
        )}

        {data && rows.length === 0 && (
          <div className="mt-6 rounded-lg border border-black/10 bg-white p-6 text-center text-[#7A7974]">
            No hero-CTA impressions logged yet. Load the homepage a few times to seed data.
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7974]">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-[#1B474D]">{value}</div>
    </div>
  )
}
