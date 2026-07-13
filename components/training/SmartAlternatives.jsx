'use client'

// /app/components/training/SmartAlternatives.jsx
// Renders Section 3B — activity-aware alternative suggestions.

import { Lightbulb, Shield, ArrowRight } from 'lucide-react'
import { OnlyFull } from '@/lib/training/viewMode'

export default function SmartAlternatives({ result }) {
  if (!result?.items?.length && !result?.protected) return null
  return (
    <div className="space-y-3">
      {result.protected && (
        <div
          className="flex items-start gap-2 rounded-xl border-2 border-ss-orange/50 p-3 shadow-md"
          style={{ background: 'linear-gradient(135deg, #FED7AA55 0%, #FFF7ED 60%, #FFEDD5 100%)' }}
        >
          <Shield size={16} className="mt-0.5 shrink-0 text-ss-orange" />
          <div className="text-[12px] leading-relaxed text-ss-text">
            <span className="font-extrabold text-ss-orange">Your protected activity: {result.protected}.</span>{' '}
            We will never recommend stopping this. Everything below is about doing it more effectively and with less injury risk.
          </div>
        </div>
      )}

      {result.items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border-2 border-ss-teal/40 p-4 shadow-md"
          style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 55%, #ECFEFF 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-ss-orange" />
            <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-ss-orange">Smart alternative</div>
          </div>
          <div className="mt-2 space-y-2 text-[12px] leading-relaxed text-ss-text">
            <Row label="What you're doing">{item.doing}</Row>
            <OnlyFull>
              <Row label="The genetic consideration">{item.consideration}</Row>
            </OnlyFull>
            <Row label="Smarter approach" accent>
              <span>{item.smarter}</span>
            </Row>
            <OnlyFull>
              <Row label="Same goal, different path">{item.samePath}</Row>
            </OnlyFull>
          </div>
        </div>
      ))}

      {result.items.length === 0 && result.protected && (
        <div className="rounded border border-dashed border-ss-border-warm/70 p-3 text-center text-[11px] italic text-ss-muted">
          Your intake activity and your genetics do not create any injury-risk conflict we flag — keep doing what you love.
        </div>
      )}
    </div>
  )
}

function Row({ label, accent = false, children }) {
  return (
    <div className={`flex gap-2 ${accent ? 'rounded border-l-4 border-ss-teal bg-ss-teal/5 p-2' : ''}`}>
      <ArrowRight size={12} className={`mt-1 shrink-0 ${accent ? 'text-ss-teal' : 'text-ss-muted'}`} />
      <div>
        <div className={`text-[9.5px] font-extrabold uppercase tracking-[0.14em] ${accent ? 'text-ss-teal' : 'text-ss-muted'}`}>{label}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  )
}
