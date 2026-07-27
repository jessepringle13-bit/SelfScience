'use client'

// /app/components/TierRouteGate.jsx
// Global client-side gate. Watches the current pathname; when the user
// is Tier 1 AND on a Tier-2-locked route, renders the LockedToolPage
// as a full-screen overlay. Doesn't touch the underlying route.

import { usePathname } from 'next/navigation'
import { useTierState, isRouteLocked, TIER2_LOCKED_ROUTES } from '@/lib/tierState'
import LockedToolPage from '@/components/LockedToolPage'

// Human-friendly tool names keyed by pathname.
const TOOL_NAMES = {
  '/tools/training':       'the Training Response tool',
  '/biomarkers':           'Biomarkers',
  '/nutrition':            'Nutrition',
  '/drug-check':           'Drug Check',
  '/population-compare':   'Population Compare',
  '/practitioner-report':  'the Practitioner Report',
}

export default function TierRouteGate() {
  const pathname = usePathname() || ''
  const state = useTierState()
  if (!isRouteLocked(pathname, state.tier)) return null
  const toolName = TOOL_NAMES[pathname] || 'this tool'
  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-ss-canvas">
      <LockedToolPage toolName={toolName} />
    </div>
  )
}
