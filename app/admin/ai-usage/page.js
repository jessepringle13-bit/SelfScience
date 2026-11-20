'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/admin/AdminGate'

/**
 * AI-usage admin dashboard. Requires the admin login cookie (via AdminGate);
 * the token is never put in the URL, so analytics and browser history can't see it.
 *
 * Refresh manually or with the button. Not linked from the site nav.
 */
export default function AiUsagePage() {
  return <AdminGate title="AI usage"><AiUsage /></AdminGate>
}

function AiUsage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ai-usage', { cache: 'no-store' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const snap = data?.snapshot
  const totals = snap?.totals
  const byKey  = snap?.byKey || {}
  const byDay  = snap?.byDay || {}
  const byFeature = snap?.byFeature || {}
  const ring   = snap?.ring || []
  const or     = data?.liveCredits?.openrouter

  return (
    <div className="min-h-screen bg-[#F6F5F0] p-6 font-mono text-sm text-[#28251D]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold text-[#1B474D]">SelfScience · AI Usage</h1>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-full bg-[#1B474D] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-400 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {or && (
          <div className="mt-6 rounded-lg border border-[#1B474D] bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#7A7974]">OpenRouter live credit</div>
            {typeof or === 'object' && or.error ? (
              <div className="mt-2 text-red-700">Error: {or.error}</div>
            ) : (
              <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(or, null, 2)}</pre>
            )}
          </div>
        )}

        {totals && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Total calls" value={totals.calls} />
            <StatBox label="Input tokens" value={totals.inTokens.toLocaleString()} />
            <StatBox label="Output tokens" value={totals.outTokens.toLocaleString()} />
            <StatBox label="Est. spend (USD)" value={`$${totals.usd.toFixed(4)}`} />
          </div>
        )}

        {snap && (
          <div className="mt-6">
            <div className="text-xs text-[#7A7974]">
              Started tracking: {snap.startedAt} · Last update: {snap.lastUpdated}
            </div>
          </div>
        )}

        <Section title="By feature (user-facing rollup)">
          {Object.keys(byFeature).length === 0 ? <Empty /> : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1B474D]/20 text-left text-[#7A7974]">
                  <th className="py-1.5 pr-3">Feature</th>
                  <th className="py-1.5 pr-3 text-right">Calls</th>
                  <th className="py-1.5 pr-3 text-right">In tok</th>
                  <th className="py-1.5 pr-3 text-right">Out tok</th>
                  <th className="py-1.5 pr-3 text-right">USD</th>
                  <th className="py-1.5 pr-3">Models</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byFeature)
                  .sort((a, b) => b[1].calls - a[1].calls)
                  .map(([feature, v]) => (
                    <tr key={feature} className="border-b border-black/5">
                      <td className="py-1.5 pr-3 font-bold text-[#1B474D]">{feature}</td>
                      <td className="py-1.5 pr-3 text-right">{v.calls}</td>
                      <td className="py-1.5 pr-3 text-right">{v.inTokens.toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right">{v.outTokens.toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right">${v.usd.toFixed(4)}</td>
                      <td className="py-1.5 pr-3 text-[10px] text-[#7A7974]">
                        {v.models.map((m) => m.split('/').pop()).join(', ')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Per model / task">
          {Object.keys(byKey).length === 0 ? <Empty /> : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1B474D]/20 text-left text-[#7A7974]">
                  <th className="py-1.5 pr-3">Provider / Model / Task</th>
                  <th className="py-1.5 pr-3 text-right">Calls</th>
                  <th className="py-1.5 pr-3 text-right">In tok</th>
                  <th className="py-1.5 pr-3 text-right">Out tok</th>
                  <th className="py-1.5 pr-3 text-right">USD</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byKey).sort((a, b) => b[1].usd - a[1].usd).map(([k, v]) => (
                  <tr key={k} className="border-b border-black/5">
                    <td className="py-1.5 pr-3">{k}{v.unknownPrice ? <span className="ml-1 rounded bg-[#FFEED9] px-1 text-[10px] text-[#B07D00]">no price</span> : null}</td>
                    <td className="py-1.5 pr-3 text-right">{v.calls}</td>
                    <td className="py-1.5 pr-3 text-right">{v.inTokens.toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-right">{v.outTokens.toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-right">${v.usd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Per day">
          {Object.keys(byDay).length === 0 ? <Empty /> : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1B474D]/20 text-left text-[#7A7974]">
                  <th className="py-1.5 pr-3">Day</th>
                  <th className="py-1.5 pr-3 text-right">Calls</th>
                  <th className="py-1.5 pr-3 text-right">In tok</th>
                  <th className="py-1.5 pr-3 text-right">Out tok</th>
                  <th className="py-1.5 pr-3 text-right">USD</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byDay).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([day, v]) => (
                  <tr key={day} className="border-b border-black/5">
                    <td className="py-1.5 pr-3">{day}</td>
                    <td className="py-1.5 pr-3 text-right">{v.calls}</td>
                    <td className="py-1.5 pr-3 text-right">{v.inTokens.toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-right">{v.outTokens.toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-right">${v.usd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title={`Recent calls (${ring.length})`}>
          {ring.length === 0 ? <Empty /> : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-[#F6F5F0]">
                  <tr className="border-b border-[#1B474D]/20 text-left text-[#7A7974]">
                    <th className="py-1 pr-3">When</th>
                    <th className="py-1 pr-3">Task</th>
                    <th className="py-1 pr-3">Provider/Model</th>
                    <th className="py-1 pr-3">Status</th>
                    <th className="py-1 pr-3 text-right">In</th>
                    <th className="py-1 pr-3 text-right">Out</th>
                    <th className="py-1 pr-3 text-right">Latency</th>
                    <th className="py-1 pr-3 text-right">USD</th>
                  </tr>
                </thead>
                <tbody>
                  {ring.slice().reverse().map((r, i) => (
                    <tr key={i} className="border-b border-black/5">
                      <td className="py-1 pr-3">{r.ts?.slice(11, 19)}</td>
                      <td className="py-1 pr-3">{r.task}</td>
                      <td className="py-1 pr-3">{r.provider}/{r.model?.split('/').pop()}</td>
                      <td className={`py-1 pr-3 ${r.status === 'ok' ? 'text-[#1B474D]' : 'text-red-700'}`}>{r.status}{r.httpStatus ? ` ${r.httpStatus}` : ''}</td>
                      <td className="py-1 pr-3 text-right">{r.inTokens}</td>
                      <td className="py-1 pr-3 text-right">{r.outTokens}</td>
                      <td className="py-1 pr-3 text-right">{r.latencyMs ? `${r.latencyMs}ms` : '—'}</td>
                      <td className="py-1 pr-3 text-right">${(r.usd || 0).toFixed(5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mt-8 rounded-lg border border-black/10 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-[#1B474D]">{title}</h2>
      {children}
    </section>
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

function Empty() {
  return <div className="text-[#7A7974]">No data yet.</div>
}
