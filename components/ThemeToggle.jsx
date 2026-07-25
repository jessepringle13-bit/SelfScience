'use client'

// /app/components/ThemeToggle.jsx
// Three-way theme toggle: Light · System · Dark. Persists to
// localStorage via lib/theme.js and immediately flips the <html> class.
//
// Compact segmented-control layout — designed to sit inside PrefsMenu
// or the top nav's overflow menu.

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme'

const OPTIONS = [
  { key: 'light',  label: 'Light',  Icon: Sun },
  { key: 'system', label: 'System', Icon: Monitor },
  { key: 'dark',   label: 'Dark',   Icon: Moon },
]

export default function ThemeToggle({ compact = false }) {
  const { pref, setTheme } = useTheme()
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-ss-border-warm bg-ss-surface p-0.5"
    >
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = pref === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            onClick={() => setTheme(key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              active
                ? 'bg-ss-teal text-white shadow-sm'
                : 'text-ss-muted hover:text-ss-teal'
            }`}
          >
            <Icon size={12} aria-hidden="true" />
            {!compact && <span>{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
