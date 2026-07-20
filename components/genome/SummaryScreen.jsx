'use client'

// /app/components/genome/SummaryScreen.jsx
// Slice 4A "What we found" reveal screen that appears between the
// processing spinner and the full research roadmap on /genome. Its job
// is to make the moment feel deliberate — not another loading screen —
// so the user actually pauses to see what SelfScience identified before
// diving into the details.
//
// Behavior:
//   * Staggered fade-in via inline animation-delay so the header, count
//     row, and top-3 finding cards land one at a time.
//   * Primary CTA "See your full dashboard →" → onSeeDashboard()
//     (navigates to the personalized Dashboard at `/`).
//   * Secondary link "Go straight to dashboard" → same handler; kept
//     as a text link per spec so returning users don't feel gated.
//   * Tertiary link "Stay here to explore the roadmap →" →
//     onSeeRoadmap() (transitions to /genome's own results view).

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, Circle } from 'lucide-react'

export default function SummaryScreen({ report, stats, onSeeDashboard, onSeeRoadmap }) {
  // Derive count metrics from the report. `overview` is the deterministic
  // Step-1 classification result — always present even when the AI
  // enrichment pass fails, so the counts we surface here never lie.
  const { total, awareness, strengths, neutrals, top3 } = useMemo(() => {
    const overview = report?.overview || {}
    const a = Array.isArray(overview.areasToExplore) ? overview.areasToExplore : []
    const s = Array.isArray(overview.strengths) ? overview.strengths : []
    const n = Array.isArray(overview.neutralOrBenign) ? overview.neutralOrBenign : []
    const totalRecognized = stats?.recognized ?? (a.length + s.length + n.length)
    // "Top 3 most significant findings" — Section 9 spec. For the reveal
    // moment we prioritise awareness findings (things the user should
    // know about) over strengths (things that are already working) over
    // neutrals. Sort loosely by whatever priority field the AI attached,
    // else keep source order.
    const rank = (x) => (x?.clinical_priority === 'urgent' ? 0 : x?.clinical_priority === 'important' ? 1 : 2)
    const primary = [...a].sort((x, y) => rank(x) - rank(y))
    const top3 = [
      ...primary.slice(0, 3),
      ...(primary.length < 3 ? s.slice(0, 3 - primary.length) : []),
    ].slice(0, 3)
    return {
      total: totalRecognized,
      awareness: a.length,
      strengths: s.length,
      neutrals: n.length,
      top3,
    }
  }, [report, stats])

  return (
    <section className="container py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header — staggered entrance */}
        <div className="text-center" style={{ animation: 'ss-fade-up 0.5s ease-out both' }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-ss-orange/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-orange">
            <Sparkles size={11} /> Your genome, decoded
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-ss-teal md:text-3xl">
            We identified <span className="text-ss-orange">{total}</span> relevant variant{total === 1 ? '' : 's'} in your genome.
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ss-muted md:text-base">
            Here's the shape of what we found. Your full dashboard has the details, the research matches, and every downstream tool wired up.
          </p>
        </div>

        {/* Count row */}
        <div
          className="mt-6 grid grid-cols-3 gap-3"
          style={{ animation: 'ss-fade-up 0.5s ease-out 0.12s both' }}
        >
          <StatTile
            Icon={TrendingUp}
            tone="amber"
            count={awareness}
            label={`awareness finding${awareness === 1 ? '' : 's'}`}
            sublabel="Things to be aware of"
          />
          <StatTile
            Icon={ShieldCheck}
            tone="green"
            count={strengths}
            label={`strength${strengths === 1 ? '' : 's'}`}
            sublabel="Favourable variants"
          />
          <StatTile
            Icon={Circle}
            tone="muted"
            count={neutrals}
            label={`neutral variant${neutrals === 1 ? '' : 's'}`}
            sublabel="No interpretation"
          />
        </div>

        {/* Top-3 findings — staggered card entrance */}
        {top3.length > 0 && (
          <div className="mt-8">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-teal">
              Top {top3.length} finding{top3.length === 1 ? '' : 's'} at a glance
            </div>
            <ol className="mt-3 space-y-2.5">
              {top3.map((c, i) => (
                <li
                  key={(c.rsid || c.gene || '') + i}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  style={{ animation: `ss-fade-up 0.5s ease-out ${0.24 + i * 0.1}s both` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-ss-orange">
                        {c.classification || 'Finding'}
                      </div>
                      <div className="mt-1 text-sm font-bold text-ss-teal">
                        {c.name || c.gene || c.rsid}
                        {c.gene && c.name && c.name !== c.gene && (
                          <span className="ml-2 font-mono text-[11px] text-ss-muted">({c.gene})</span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ss-text">
                        {truncate(c.plain || c.classification_text || c.trait || 'See dashboard for details.', 220)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-ss-muted">#{i + 1}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* CTAs */}
        <div
          className="mt-8 flex flex-col items-center gap-3"
          style={{ animation: 'ss-fade-up 0.5s ease-out 0.6s both' }}
        >
          <button
            type="button"
            onClick={onSeeDashboard}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ss-teal px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:brightness-110 md:text-base"
          >
            See your full dashboard <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onSeeDashboard}
            className="text-xs font-semibold text-ss-muted underline underline-offset-4 hover:text-ss-teal"
          >
            Go straight to dashboard
          </button>
          {onSeeRoadmap && (
            <button
              type="button"
              onClick={onSeeRoadmap}
              className="text-[11px] italic text-ss-muted hover:text-ss-teal"
            >
              or stay here to explore the detailed roadmap \u2192
            </button>
          )}
        </div>
      </div>

      {/* Local styled-jsx for the fade-up keyframes so the animation
          doesn't leak into globals.css. */}
      <style jsx>{`
        @keyframes ss-fade-up {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </section>
  )
}

function StatTile({ Icon, tone, count, label, sublabel }) {
  const toneClasses = {
    amber: 'bg-ss-amber/10 text-ss-amber',
    green: 'bg-ss-green/10 text-ss-green',
    muted: 'bg-ss-border-warm/40 text-ss-muted',
  }
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses[tone] || toneClasses.muted}`}>
        <Icon size={16} />
      </span>
      <div className="mt-2 text-2xl font-extrabold text-ss-teal md:text-3xl">{count}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-ss-text">{label}</div>
      <div className="text-[10px] text-ss-muted">{sublabel}</div>
    </div>
  )
}

function truncate(s, max) {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '\u2026'
}
