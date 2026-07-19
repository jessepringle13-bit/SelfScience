'use client'

// /app/components/training/MobileTabBar.jsx
// Fixed bottom tab bar for the training tool on <768px. Replaces the
// horizontal scrolling tab strip with 5 anchor tabs: Today · Blueprint ·
// History · Supplements · Goals. Renders only at md- and hidden on desktop.

import { Dumbbell, Calendar, History, Pill, Target } from 'lucide-react'

const TABS = [
  { key: 'workouts',    label: 'Today',       Icon: Dumbbell },
  { key: 'blueprint',   label: 'Blueprint',   Icon: Calendar },
  { key: 'history',     label: 'History',     Icon: History },
  { key: 'supplements', label: 'Supplements', Icon: Pill },
  { key: 'goals',       label: 'Goals',       Icon: Target },
]

export default function MobileTabBar({ active, onChange, hide = false }) {
  if (hide) return null
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ss-teal-ink/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Training tabs"
    >
      <div className="grid grid-cols-5">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition ${
                isActive ? 'text-ss-teal' : 'text-white/70 hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  isActive ? 'bg-white text-ss-teal shadow-md' : ''
                }`}
              >
                <Icon size={18} />
              </span>
              <span className={isActive ? 'text-white' : ''}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
