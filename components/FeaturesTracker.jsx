'use client'

// /app/components/FeaturesTracker.jsx
// Global route-visit listener that marks the matching feature complete
// in ss_features_explored. Mounted once from the root layout.
//
// useSearchParams() must live inside a Suspense boundary in Next.js 15
// so static prerender does not bail out. We wrap the inner hook-using
// component in Suspense so any consumer of <FeaturesTracker /> is safe.

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { FEATURES, markFeatureExplored } from '@/lib/featuresExplored'

function FeaturesTrackerInner() {
  const pathname = usePathname() || ''
  const params = useSearchParams()

  useEffect(() => {
    // Route-based feature detection.
    const match = FEATURES.find((f) => f.match(pathname))
    if (match) markFeatureExplored(match.key)
    // Special-case: Discover tab on homepage — treat ?tab=discover OR
    // the in-page dashboard/discover toggle as "explored".
    if (pathname === '/' && params?.get('tab') === 'discover') {
      markFeatureExplored('discover')
    }
  }, [pathname, params])

  // Also honour a custom event so the dashboard toggle can mark it.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onDiscover = () => markFeatureExplored('discover')
    window.addEventListener('selfscience:discover-viewed', onDiscover)
    return () => window.removeEventListener('selfscience:discover-viewed', onDiscover)
  }, [])

  return null
}

export default function FeaturesTracker() {
  return (
    <Suspense fallback={null}>
      <FeaturesTrackerInner />
    </Suspense>
  )
}
