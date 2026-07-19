'use client'

// /app/components/training/SupplementTimingSchedule.jsx
// Above the SupplementPanel content. Buckets each supplement into one of
// four time slots by parsing the free-text `timing` field, then renders a
// compact daily-schedule table with a Print button that outputs a clean
// one-page schedule.

import { useMemo, useRef } from 'react'
import { Sun, Zap, Sunset, Moon, Printer } from 'lucide-react'

const SLOTS = [
  { key: 'morning',       Icon: Sun,    label: 'Morning',         color: '#F59E0B', hint: 'With breakfast / on waking' },
  { key: 'pre_training',  Icon: Zap,    label: 'Pre-training',    color: '#0891B2', hint: '30–60 min before your session' },
  { key: 'post_training', Icon: Sunset, label: 'Post-training',   color: '#059669', hint: 'Within 30 min after your session' },
  { key: 'evening',       Icon: Moon,   label: 'Evening / bed',   color: '#7C3AED', hint: 'With dinner or 60 min before bed' },
]

function bucketFor(timing) {
  const t = String(timing || '').toLowerCase()
  if (/pre[- ]?(training|workout|session)|before (training|workout|session)/.test(t)) return 'pre_training'
  if (/post[- ]?(training|workout|session)|after (training|workout|session)|recovery window/.test(t)) return 'post_training'
  if (/(with|at) (breakfast|morning)|on (an )?empty stomach|on waking|first thing|am\b|morning/.test(t)) return 'morning'
  if (/(before|at) bed|bedtime|evening|pm\b|dinner|night/.test(t)) return 'evening'
  return 'morning' // reasonable default — most non-timed supps go with breakfast
}

export default function SupplementTimingSchedule({ supplements }) {
  const printRef = useRef(null)

  const grouped = useMemo(() => {
    const g = { morning: [], pre_training: [], post_training: [], evening: [] }
    for (const s of supplements || []) {
      g[bucketFor(s.timing)].push(s)
    }
    return g
  }, [supplements])

  if (!supplements?.length) return null

  const handlePrint = () => {
    if (typeof window === 'undefined') return
    // Simple approach: use window.print(). The existing print CSS on the
    // page already hides nav / footer; we add temp print-only classes so
    // the schedule is the only visible block during print.
    const el = printRef.current
    if (!el) { window.print(); return }
    el.classList.add('ss-print-only-block')
    // Temporarily hide the rest of the page via a body class the CSS
    // below picks up.
    document.body.classList.add('ss-print-schedule')
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        document.body.classList.remove('ss-print-schedule')
        el.classList.remove('ss-print-only-block')
      }, 500)
    }, 100)
  }

  return (
    <div className="mb-4 rounded-2xl border-2 border-ss-teal/25 bg-white p-4 shadow-sm" ref={printRef}>
      <style jsx global>{`
        @media print {
          body.ss-print-schedule > *:not(:has(.ss-print-only-block)) { display: none !important; }
          body.ss-print-schedule .ss-print-only-block,
          body.ss-print-schedule .ss-print-only-block * { visibility: visible; }
          body.ss-print-schedule .ss-print-only-block {
            position: absolute;
            left: 0; top: 0; width: 100%;
            padding: 24px !important;
          }
        }
      `}</style>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">Daily timing schedule</div>
          <div className="text-[11px] text-ss-muted">When to take each of your supplements. Everything below is derived from your protocol — no invented data.</div>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ss-teal px-3 py-2 text-xs font-semibold text-ss-teal hover:bg-ss-teal hover:text-white no-print"
        >
          <Printer size={12} /> Print timing schedule
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SLOTS.map(({ key, Icon, label, color, hint }) => {
          const items = grouped[key] || []
          return (
            <div
              key={key}
              className="flex min-h-[6rem] flex-col rounded-xl border p-3"
              style={{ borderColor: `${color}40`, background: `${color}0A` }}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={14} style={{ color }} />
                <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color }}>{label}</span>
              </div>
              <div className="mt-0.5 text-[10px] italic text-ss-muted">{hint}</div>
              {items.length === 0 ? (
                <div className="mt-2 text-[11px] text-ss-muted">— nothing scheduled</div>
              ) : (
                <ul className="mt-2 space-y-1">
                  {items.map((s) => (
                    <li key={s.id} className="text-[12px] leading-tight">
                      <div className="font-semibold text-ss-teal">{s.name}</div>
                      <div className="text-[10.5px] text-ss-muted">{s.dose} — {s.timing}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
