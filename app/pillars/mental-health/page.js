// /app/app/pillars/mental-health/page.js — slim pillar landing.
// Mirrors the layout of /pillars/youth via PillarLandingTemplate.
// No new features; every href is an existing route.

'use client'

import { Brain } from 'lucide-react'
import PillarLandingTemplate from '@/components/PillarLandingTemplate'

export default function MentalHealthPillarPage() {
  return (
    <PillarLandingTemplate
      Icon={Brain}
      pillarName="Mental Health & Neurochemistry"
      headline="Mood, focus, and the chemistry behind them."
      lede="Neurotransmitters, stress response, sleep architecture, and the everyday habits that quietly shape all of it. Read the research — no diagnoses, no dosing advice, just what the science actually says."
      whatItCovers={[
        'Serotonin, dopamine and other neurotransmitter systems.',
        'How stress, sleep, and inflammation shape mood and focus.',
        'Genetic variants linked to anxiety, depression, and attention.',
        'The evidence tier for common self-management strategies.',
      ]}
      tools={[
        {
          href: '/search?pillar=Mental+Health+%26+Neurochemistry',
          label: 'Research feed',
          blurb: 'Papers on mood, focus, stress response, and brain chemistry — ranked by reliability.',
          tag: 'Primary',
        },
        {
          href: '/reading-list',
          label: 'Reading list',
          blurb: 'Curated books on neurochemistry, sleep, and behaviour change with an evidence note on each claim.',
        },
        {
          href: '/journal',
          label: 'Health journal',
          blurb: 'Log mood, energy, and focus over time. Optional — useful for spotting your own patterns.',
        },
        {
          href: '/coach',
          label: 'AI Coach',
          blurb: 'Ask nuanced questions with citations on every answer. Politely refuses to diagnose or prescribe.',
        },
      ]}
      related={[
        { href: '/pillars/wellness',  label: 'General Wellness' },
        { href: '/pillars/longevity', label: 'Longevity' },
        { href: '/pillars/youth',     label: 'Developmental & Lifespan' },
      ]}
    />
  )
}
