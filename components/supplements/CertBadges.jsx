'use client'
// Compact certification badge strip. Sorted gold -> silver -> bronze -> baseline.
// Each badge is clickable and links to the certifier’s verification page.
import { ShieldCheck, ExternalLink } from 'lucide-react'

const TIER_STYLE = {
  gold:     { bg: 'bg-amber-100',    text: 'text-amber-900',   border: 'border-amber-300' },
  silver:   { bg: 'bg-slate-100',    text: 'text-slate-800',   border: 'border-slate-300' },
  bronze:   { bg: 'bg-orange-50',    text: 'text-orange-800',  border: 'border-orange-200' },
  baseline: { bg: 'bg-[#EEF7F7]',    text: 'text-[#1B474D]',   border: 'border-[#1B474D]/20' },
}

export default function CertBadges({ certifications, compact = false, maxVisible = 6 }) {
  if (!certifications?.length) return null
  const visible = certifications.slice(0, maxVisible)
  const overflow = certifications.length - visible.length

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
      {visible.map((c) => {
        const t = TIER_STYLE[c.tier] || TIER_STYLE.baseline
        return (
          <a
            key={c.id}
            href={c.verifierUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`${c.name} — ${c.what} (opens verifier)`}
            className={`inline-flex items-center gap-1 rounded-full border ${t.bg} ${t.text} ${t.border} px-2 py-0.5 font-medium transition hover:brightness-95`}
          >
            <ShieldCheck className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
            <span className="truncate max-w-[16ch]">{c.name}</span>
            <ExternalLink className={compact ? 'h-2.5 w-2.5 opacity-60' : 'h-3 w-3 opacity-60'} />
          </a>
        )
      })}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-full border border-slate-300 bg-white text-slate-500 px-2 py-0.5">+{overflow}</span>
      )}
    </div>
  )
}
