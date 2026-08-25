// /app/app/pillars/longevity/page.js — slim pillar landing.
// Mirrors /pillars/youth via PillarLandingTemplate. No new features.

'use client'

import { Hourglass } from 'lucide-react'
import PillarLandingTemplate from '@/components/PillarLandingTemplate'

export default function LongevityPillarPage() {
  return (
    <PillarLandingTemplate
      Icon={Hourglass}
      pillarName="Longevity"
      headline="What the research really says about a longer, healthier life."
      lede="There’s a lot of noise in the longevity space. This pillar filters it: what the evidence supports, what’s still emerging, and what looks like great marketing dressed up as science."
      whatItCovers={[
        'Healthspan vs lifespan — why the two aren’t the same.',
        'Metabolic, cardiovascular, and cellular ageing pathways.',
        'Diet patterns, movement, sleep, and social connection.',
        'Popular interventions (fasting, senolytics, rapamycin) with honest evidence tiers.',
      ]}
      tools={[
        {
          href: '/search?pillar=Longevity',
          label: 'Research feed',
          blurb: 'Longevity papers ranked by reliability, funding transparency, and study design.',
          tag: 'Primary',
        },
        {
          href: '/goals',
          label: 'Goals',
          blurb: 'Track long-horizon health goals with progress bars — the everyday levers behind healthspan.',
        },
        {
          href: '/tracker',
          label: 'Habit tracker',
          blurb: 'The boring, repeatable behaviours the science keeps pointing at. Log them, watch them stick.',
        },
        {
          href: '/reading-list',
          label: 'Reading list',
          blurb: 'Curated books on the science of ageing — flagged where the popular narrative outruns the evidence.',
        },
      ]}
      related={[
        { href: '/pillars/wellness',       label: 'General Wellness' },
        { href: '/pillars/mental-health',  label: 'Mental Health' },
        { href: '/pillars/youth',          label: 'Developmental & Lifespan' },
      ]}
    />
  )
}
