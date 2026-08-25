// /app/app/pillars/environment/page.js — slim pillar landing.
// Mirrors /pillars/youth via PillarLandingTemplate. No new features.

'use client'

import { Leaf } from 'lucide-react'
import PillarLandingTemplate from '@/components/PillarLandingTemplate'

export default function EnvironmentPillarPage() {
  return (
    <PillarLandingTemplate
      Icon={Leaf}
      pillarName="Environmental Sensitivity"
      headline="How your body meets the world around it."
      lede="Air, water, dust, chemicals, medications, and light — the parts of your environment your biology can’t opt out of. Read what the research actually says before you fear the next headline."
      whatItCovers={[
        'Air quality, particulate matter, and lung biology.',
        'Household chemicals, endocrine disruptors, and skin absorption.',
        'Genetic variants linked to detoxification and toxin sensitivity.',
        'Practical exposure-reduction moves with an honest evidence tier.',
      ]}
      tools={[
        {
          href: '/search?pillar=Environmental+Sensitivity',
          label: 'Research feed',
          blurb: 'Papers on toxin exposure, air quality, and chemical sensitivity, ranked by reliability.',
          tag: 'Primary',
        },
        {
          href: '/nutrition',
          label: 'Nutrition scanner',
          blurb: 'Look up ingredients and see what the research says about exposure through food.',
        },
        {
          href: '/reading-list',
          label: 'Reading list',
          blurb: 'Books on environmental health, with an annotation on which claims hold up.',
        },
        {
          href: '/biomarkers',
          label: 'Lab biomarkers',
          blurb: 'Log exposure-relevant labs (liver enzymes, vitamin levels) to see them in context.',
        },
      ]}
      related={[
        { href: '/pillars/wellness',        label: 'General Wellness' },
        { href: '/search?pillar=Pharmacogenomics', label: 'Pharmacogenomics' },
        { href: '/search?pillar=Nutrition',  label: 'Nutrition' },
      ]}
    />
  )
}
