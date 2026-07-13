'use client'
// Training-page cross-link → supplement recommendations relevant to training.
// Deterministic list, brand-agnostic; each links to the supplement discovery
// page pre-loaded with the right goal + ingredient category.
import { ArrowRight, Pill } from 'lucide-react'

const TRAINING_SUPPLEMENT_LINKS = [
  {
    label: 'Creatine Monohydrate',
    reason: 'Best-studied ergogenic aid; also supports cognition under sleep debt.',
    href: '/tools/supplements?goal=energy&category=creatine',
  },
  {
    label: 'Electrolytes (Na / K / Mg)',
    reason: 'Sodium + potassium + magnesium replenishment for training sessions >60 min or high sweat rate.',
    href: '/tools/supplements?goal=longevity&category=magnesium',
  },
  {
    label: 'Whey / Plant Protein',
    reason: 'Meet a 1.6–2.2 g/kg body-weight protein target for hypertrophy.',
    href: '/tools/supplements?goal=energy&category=creatine',
  },
  {
    label: 'Omega-3 (EPA/DHA)',
    reason: 'Anti-inflammatory support; DOMS + joint research base.',
    href: '/tools/supplements?goal=cardiovascular&category=omega-3',
  },
  {
    label: 'Magnesium Glycinate',
    reason: 'Sleep + recovery + muscle relaxation.',
    href: '/tools/supplements?goal=sleep&category=magnesium-glycinate',
  },
  {
    label: 'Ashwagandha (KSM-66)',
    reason: 'Adaptogen; stress and cortisol research base.',
    href: '/tools/supplements?goal=stress&category=ashwagandha',
  },
]

export default function TrainingSupplementLink() {
  return (
    <section className="rounded-2xl border border-[#1B474D]/15 bg-white shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-[#1B474D] to-[#0f2f34] text-white">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4" />
          <span className="text-sm font-semibold">Supplement stack for this training block</span>
        </div>
        <a href="/tools/supplements" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white">
          Open discovery <ArrowRight className="h-3 w-3" />
        </a>
      </header>
      <ul className="divide-y divide-slate-100">
        {TRAINING_SUPPLEMENT_LINKS.map((s) => (
          <li key={s.label}>
            <a href={s.href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                <div className="text-xs text-slate-600 mt-0.5">{s.reason}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 mt-1" />
            </a>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 text-[10px] text-slate-500 bg-slate-50 border-t border-slate-100">
        Educational only. Not medical advice. All links go to SelfScience&apos;s ingredient-first supplement discovery.
      </div>
    </section>
  )
}
