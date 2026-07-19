'use client'

// /app/components/training/MilestoneCheckbox.jsx
// Small controlled checkbox row used inside GoalsPanel for milestone
// tracking. Persists to localStorage via milestoneStore.

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { isMilestoneDone, toggleMilestone } from '@/lib/training/milestoneStore'

export default function MilestoneCheckbox({ id, label }) {
  const [done, setDone] = useState(false)
  useEffect(() => { setDone(isMilestoneDone(id)) }, [id])

  const handle = () => {
    toggleMilestone(id)
    setDone((v) => !v)
  }

  return (
    <button
      type="button"
      onClick={handle}
      className={`inline-flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-[11.5px] transition ${
        done ? 'bg-ss-green/10 text-ss-green' : 'hover:bg-ss-bg/60'
      }`}
      aria-pressed={done}
    >
      {done
        ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ss-green" />
        : <Circle size={16} className="mt-0.5 shrink-0 text-ss-muted" />}
      <span className={done ? 'line-through' : ''}>{label}</span>
    </button>
  )
}
