'use client'

// /app/components/training/TabNav.jsx
// Sticky-feeling pill-style tab bar with strong active-state contrast.

export default function TabNav({ tabs, active, onChange }) {
  return (
    <div className="mb-6 overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-1.5 rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-ss-border-warm">
        {tabs.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-[12px] font-extrabold uppercase tracking-wider transition-all duration-150 ${
                isActive
                  ? 'bg-ss-orange text-white shadow-md ring-2 ring-ss-orange/40 scale-[1.03]'
                  : 'text-ss-muted hover:bg-ss-teal/10 hover:text-ss-teal'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
