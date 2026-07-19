'use client'

// /app/components/nutrition/TimingRulesBanner.jsx
// A pinned amber banner that surfaces the user's most actionable
// nutrition timing rules (MTNR1B eating window, CYP1A2 caffeine cutoff,
// etc.) at the top of the Foods and Journal tabs. Not dismissable — this
// is one of the highest-impact findings for these variants.

import { Clock, AlertTriangle } from 'lucide-react'

// Given the list of active nutrigenomics rules, flatten their timing_rules
// into a de-duplicated array, sorted so 'critical' > 'high' > 'moderate'.
function collectTimingRules(activeRules) {
  if (!Array.isArray(activeRules)) return []
  const items = []
  const seen = new Set()
  for (const rule of activeRules) {
    if (!rule?.timing_rules?.length) continue
    for (const t of rule.timing_rules) {
      const key = `${rule.key}:${t.rule || t.description}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        ruleKey: rule.key,
        ruleTitle: rule.title,
        description: t.description,
        severity: t.severity || (rule.priority === 'critical' ? 'critical' : 'moderate'),
        cutoff: t.cutoff_time || t.trigger_after || null,
      })
    }
  }
  const rank = { critical: 0, high: 1, moderate: 2, low: 3 }
  return items.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9))
}

export default function TimingRulesBanner({ activeRules, className = '' }) {
  const items = collectTimingRules(activeRules)
  if (items.length === 0) return null

  // The top item is treated as the "hero" rule — everything else stacks
  // below as compact strips.
  const [hero, ...rest] = items
  const isCritical = hero.severity === 'critical' || hero.severity === 'high'

  return (
    <section
      className={`rounded-2xl border-l-4 shadow-sm ${
        isCritical
          ? 'border-ss-amber bg-gradient-to-r from-amber-50 via-amber-50/80 to-white'
          : 'border-ss-orange bg-orange-50/60'
      } ${className}`}
      aria-label="Your critical nutrition timing rules"
      role="region"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ss-amber/15 text-ss-amber">
          <Clock size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ss-amber">
              Your highest-impact timing rule
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-amber shadow-sm">
              {hero.ruleTitle}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-ss-text">
            {hero.description}
          </p>
          {hero.cutoff && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-ss-amber">
              <AlertTriangle size={11} /> Cutoff: {hero.cutoff}
            </div>
          )}
          {rest.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-ss-amber/25 pt-3 text-[12px] leading-snug text-ss-text">
              {rest.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ss-amber/60" />
                  <span>
                    <span className="font-semibold text-ss-text">{r.ruleTitle}:</span>{' '}
                    <span className="text-ss-muted">{r.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
