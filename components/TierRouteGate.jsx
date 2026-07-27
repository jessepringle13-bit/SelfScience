'use client'

// /app/components/TierRouteGate.jsx
// Global client-side gate. Watches the current pathname; when the user
// lacks access to the route (Tier 1 → Tier-2 tool, or Tier 1/2 →
// Tier-3 Pro tool), renders the matching splash as a full-screen
// overlay. Doesn't touch the underlying route.

import { usePathname } from 'next/navigation'
import { useTierState, isRouteLocked } from '@/lib/tierState'
import LockedToolPage from '@/components/LockedToolPage'
import LockedProPage from '@/components/LockedProPage'

// Human-friendly tool names keyed by pathname.
const TOOL_NAMES = {
  '/tools/training':       'the Training Response tool',
  '/biomarkers':           'Biomarkers',
  '/nutrition':            'Nutrition',
  '/drug-check':           'Drug Check',
  '/population-compare':   'Population Compare',
  '/practitioner-report':  'the Practitioner Report',
  // Tier 3 / Pro tools.
  '/pro/ai-coach':         'AI Coach',
  '/pro/family-compare':   'Family Comparison',
  '/pro/deep-research':    'Deep Research Reports',
}

export default function TierRouteGate() {
  const pathname = usePathname() || ''
  const state = useTierState()
  const { locked, requiredTier } = isRouteLocked(pathname, state.tier)
  if (!locked) return null
  const toolName = TOOL_NAMES[pathname] || 'this tool'
  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-ss-canvas">
      {requiredTier === 3
        ? <LockedProPage toolName={toolName} />
        : <LockedToolPage toolName={toolName} />}
    </div>
  )
}
