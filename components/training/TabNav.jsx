'use client'

// /app/components/training/TabNav.jsx
// Horizontal tabbed nav for the protocol output.

export default function TabNav({ tabs, active, onChange }) {
  return (
    <div className="mb-5 overflow-x-auto">
      <div className="flex gap-1 border-b border-ss-border-warm/70">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => onChange(t.id)}
            className={`whitespace-nowrap px-3 py-2 text-[12px] font-semibold transition ${
              active === t.id
                ? 'border-b-2 border-ss-orange text-ss-orange'
                : 'text-ss-muted hover:text-ss-teal'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
