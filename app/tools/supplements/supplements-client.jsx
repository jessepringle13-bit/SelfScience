'use client'
import { useState } from 'react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import AdvisoryBanner from '@/components/supplements/AdvisoryBanner'
import WhyNotAmazon from '@/components/supplements/WhyNotAmazon'
import GoalPicker from '@/components/supplements/GoalPicker'
import CategoryStrip from '@/components/supplements/CategoryStrip'
import ProductList from '@/components/supplements/ProductList'
import { GOALS } from '@/lib/supplements/goalCategories'
import { Pill, ShieldCheck, ShieldAlert } from 'lucide-react'

export default function SupplementsClient() {
  const [goal, setGoal] = useState(null)
  const [context, setContext] = useState({})
  const [category, setCategory] = useState(null)

  const onGoalSelect = ({ goal: g, context: c }) => {
    setGoal(g)
    setContext(c || {})
    // Auto-select first category on new goal
    if (g) setCategory(g.categories[0])
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#28251D]">
      {/* Compressed dark teal hero */}
      <section className="relative bg-[#1B474D] text-white">
        <SiteNav variant="dark" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6 pt-6 pb-8 md:pt-8 md:pb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-white/80">
                <Pill className="h-3 w-3" /> Supplement Discovery
              </div>
              <h1 className="mt-2 text-2xl md:text-4xl font-bold leading-tight max-w-3xl">
                Choose supplements by their <span className="text-[#F0A155]">form</span>, not their marketing.
              </h1>
              <p className="mt-2 text-white/85 text-sm md:text-base max-w-2xl leading-snug">
                NIH label data. Ingredient-form science. Brand-direct only &mdash; never Amazon.
              </p>
            </div>
            <a
              href="/tools/supplements/brands"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 text-sm font-semibold text-white transition"
            >
              <ShieldCheck className="h-4 w-4" /> Brand leaderboard
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 md:px-6 pt-6 md:pt-8 pb-16 space-y-6">
        <GoalPicker onSelect={onGoalSelect} initialGoalId={goal?.id} />
        {goal && (
          <CategoryStrip
            goal={goal}
            selectedCategoryId={category?.id}
            onSelect={setCategory}
          />
        )}
        {/* Advisory moved below the goal picker so it's visible in the context of
            actual products, not compressed behind the hero. */}
        <AdvisoryBanner />

        {goal && category ? (
          <ProductList category={category} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
            <p className="text-base font-semibold text-[#1B474D]">Pick a goal to see supplement categories.</p>
            <p className="mt-1 text-sm">Everything runs locally in your browser. We never send your goals or context off-device.</p>
          </div>
        )}

        <WhyNotAmazon />

        <div className="rounded-2xl border border-[#1B474D]/10 bg-white p-5 md:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B474D]">How this works</h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-700 list-decimal list-inside">
            <li><strong>Pick a goal.</strong> We map each goal to a hand-curated set of ingredient categories with the strongest published research.</li>
            <li><strong>Pick a category.</strong> We query the NIH Dietary Supplement Label Database (DSLD) for products containing that ingredient.</li>
            <li><strong>Compare by form.</strong> Every card is tagged with the FORM of the active ingredient (Methylfolate vs Folic Acid, MK-7 vs K1, Ubiquinol vs Ubiquinone) and colour-coded by evidence tier.</li>
            <li><strong>Buy direct.</strong> All product links go to the brand&apos;s own store. We reject Amazon and marketplace links by design.</li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">Phase 1 covers {GOALS.length} health goals and roughly 40 ingredient categories. Phase 2 layers ingredient-form ontology, third-party certification detection, and brand-transparency profiles. Phase 3 will add genome/biomarker personalisation &mdash; opt-in and client-side only.</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
