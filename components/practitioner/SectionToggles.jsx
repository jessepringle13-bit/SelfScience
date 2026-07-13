'use client'

// /app/components/practitioner/SectionToggles.jsx
// Screen-only control block that lets the user choose which sections
// appear in the printed report. Cover + HIPAA + Legal disclaimer are LOCKED ON.

import { Lock, SlidersHorizontal } from 'lucide-react'
import { PRINT_SECTION_LABELS } from '@/lib/practitionerIntake'

const LOCKED_ITEMS = [
  { key: '_cover', label: 'Cover page + HIPAA acknowledgment' },
  { key: '_disclaimer', label: 'Final legal disclaimer page' },
]

export default function SectionToggles({ sections, onToggle, hasBiomarkers }) {
  return (
    <div className="ss-screen-only rounded-2xl border border-ss-border-warm bg-white p-5 shadow-sm no-print">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-ss-teal" />
        <div className="text-sm font-extrabold text-ss-teal">Choose what to print</div>
      </div>
      <div className="mt-1 text-[11px] text-ss-muted">
        Toggle sections in or out of the printed PDF. Legal and identity blocks are locked on for your protection.
      </div>

      <ul className="mt-3 space-y-2">
        {LOCKED_ITEMS.map((li) => (
          <li key={li.key} className="flex items-start justify-between gap-2 rounded border border-ss-teal/30 bg-ss-teal/5 px-3 py-2">
            <div className="flex items-start gap-2">
              <Lock size={13} className="mt-0.5 text-ss-teal" />
              <div>
                <div className="text-[12px] font-semibold text-ss-teal">{li.label}</div>
                <div className="text-[10px] text-ss-muted">Always included — cannot be turned off.</div>
              </div>
            </div>
          </li>
        ))}

        {Object.entries(PRINT_SECTION_LABELS).map(([key, label]) => {
          const disabled = key === 'biomarkers' && !hasBiomarkers
          return (
            <li key={key} className={`flex items-start justify-between gap-2 rounded border border-ss-border-warm px-3 py-2 ${disabled ? 'opacity-60' : ''}`}>
              <label className="flex flex-1 items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={disabled ? false : !!sections[key]}
                  disabled={disabled}
                  onChange={(e) => onToggle(key, e.target.checked)}
                />
                <div>
                  <div className="text-[12px] font-semibold text-ss-text">{label}</div>
                  {disabled && (
                    <div className="text-[10px] italic text-ss-amber">
                      Auto-hidden — no biomarker values recorded yet.
                    </div>
                  )}
                </div>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
