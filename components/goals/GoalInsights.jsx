'use client'

// /app/components/goals/GoalInsights.jsx
// Renders up to 4 dynamic insights from user's goal data.

import { generateInsights } from '@/lib/goals'

export default function GoalInsights({ goals }) {
  const insights = generateInsights(goals)
  if (!insights.length) return null

  return (
    <section className="mt-10">
      <div className="mb-3">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ss-teal">What Your Data Shows</div>
        <h2 className="mt-1 text-xl font-extrabold text-ss-text">Goal Insights</h2>
        <p className="mt-0.5 text-[13px] text-ss-muted">Patterns from your goal progress and what they suggest.</p>
      </div>
      <ul className="space-y-2.5">
        {insights.map((i) => {
          const isRisk = i.type === 'at_risk'
          return (
            <li
              key={i.id}
              className={`rounded-xl border-l-4 px-4 py-3.5 text-[13.5px] leading-relaxed ${
                isRisk
                  ? 'border-ss-amber text-ss-text'
                  : 'border-ss-teal text-ss-text'
              }`}
              style={{ background: isRisk ? 'rgba(207,144,24,0.06)' : 'rgba(14,122,110,0.04)' }}
            >
              {i.text}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
