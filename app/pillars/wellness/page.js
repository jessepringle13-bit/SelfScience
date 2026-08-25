// /app/app/pillars/wellness/page.js — slim pillar landing.
// Mirrors /pillars/youth via PillarLandingTemplate. No new features.

'use client'

import { Heart } from 'lucide-react'
import PillarLandingTemplate from '@/components/PillarLandingTemplate'

export default function WellnessPillarPage() {
  return (
    <PillarLandingTemplate
      Icon={Heart}
      pillarName="General Wellness"
      headline="The daily habits that quietly compound."
      lede="Sleep, stress, hydration, movement, gut health — the everyday levers most likely to change how you actually feel. Backed by the research, filtered from the noise, and easy to try one at a time."
      whatItCovers={[
        'Sleep quality, timing, and recovery.',
        'Stress physiology and simple ways to shift it.',
        'Gut health, hydration, and how they touch everything else.',
        'The everyday routines with the strongest evidence behind them.',
      ]}
      tools={[
        {
          href: '/search?pillar=General+Wellness',
          label: 'Research feed',
          blurb: 'Wellness research, ranked by reliability. Real papers, not repackaged tips.',
          tag: 'Primary',
        },
        {
          href: '/journal',
          label: 'Health journal',
          blurb: 'Log sleep, mood, energy, and see the story your own life is telling.',
        },
        {
          href: '/tracker',
          label: 'Habit tracker',
          blurb: 'Sleep, stress, movement, hydration. The boring levers, tracked simply.',
        },
        {
          href: '/goals',
          label: 'Goals',
          blurb: 'Turn intentions into a small number of goals you can actually see moving.',
        },
      ]}
      related={[
        { href: '/pillars/longevity',      label: 'Longevity' },
        { href: '/pillars/mental-health',  label: 'Mental Health' },
        { href: '/pillars/youth',          label: 'Developmental & Lifespan' },
      ]}
    />
  )
}
