'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import AdvisoryBanner from '@/components/supplements/AdvisoryBanner'
import WhyNotAmazon from '@/components/supplements/WhyNotAmazon'
import GoalPicker from '@/components/supplements/GoalPicker'
import CategoryStrip from '@/components/supplements/CategoryStrip'
import ProductList from '@/components/supplements/ProductList'
import PersonalisationBanner from '@/components/supplements/PersonalisationBanner'
import { CompareProvider } from '@/components/supplements/CompareContext'
import CompareFloatingBar from '@/components/supplements/CompareFloatingBar'
import CompareDrawer from '@/components/supplements/CompareDrawer'
import CompareToast from '@/components/supplements/CompareToast'
import CompareConflictDialog from '@/components/supplements/CompareConflictDialog'
import { GOALS, getGoalById } from '@/lib/supplements/goalCategories'
import { computePersonalisation, signalsForCategory } from '@/lib/supplements/personalisation'
import { getGenomeResults } from '@/lib/genomeSession'
import { getBiomarkerValues } from '@/lib/biomarkersSession'
import { Pill, ShieldCheck, ShieldAlert, Dna, Sparkles, Camera, FlaskConical } from 'lucide-react'
import FirstVisitBanner from '@/components/FirstVisitBanner'
import DashboardBackLink from '@/components/DashboardBackLink'
import MyStackDrawer from '@/components/supplements/MyStackDrawer'
import SupplementScanner from '@/components/supplements/SupplementScanner'
import { stackStore } from '@/lib/lists'
import { useListStore } from '@/lib/lists/store'

export default function SupplementsClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F6F2]" />}>
      <SupplementsClientInner />
    </Suspense>
  )
}

function SupplementsClientInner() {
  const searchParams = useSearchParams()
  const [goal, setGoal] = useState(null)
  const [context, setContext] = useState({})
  const [category, setCategory] = useState(null)
  const [signals, setSignals] = useState([])
  const [hasGenome, setHasGenome] = useState(false)
  const [hasBiomarkers, setHasBiomarkers] = useState(false)
  const [stackOpen, setStackOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [variantsByGene, setVariantsByGene] = useState({})
  const [phenotypes, setPhenotypes] = useState(null)
  const [stackItems] = useListStore(stackStore)

  // Hydrate genome + biomarkers on mount (client-side only)
  useEffect(() => {
    try {
      const g = getGenomeResults()
      const b = getBiomarkerValues()
      const sig = computePersonalisation({ genomeReport: g, biomarkers: b })
      setSignals(sig)
      setHasGenome(!!(g?.cards?.length))
      setHasBiomarkers(!!(b && Object.values(b).some((v) => v != null && v !== '')))
      // Build variantsByGene + phenotypes for the supplement scanner
      if (g) {
        const map = {}
        for (const v of g.variants_recognized || []) {
          if (v?.gene) map[v.gene.toUpperCase()] = { genotype: v.genotype_called, gene: v.gene }
        }
        for (const grp of g.fullReport || []) {
          for (const v of grp.variants || []) {
            if (v?.gene) map[v.gene.toUpperCase()] = { genotype: v.genotype, gene: v.gene }
          }
        }
        setVariantsByGene(map)
        try {
          import('@/lib/pgxClassifier').then(({ inferAllPGxPhenotypes }) => {
            try { setPhenotypes(inferAllPGxPhenotypes(g)) } catch { /* noop */ }
          })
        } catch { /* noop */ }
      }
    } catch { /* silent */ }
  }, [])

  // Hydrate goal + category from ?goal=... &category=... (deep-link support)
  useEffect(() => {
    const goalId = searchParams?.get('goal')
    const catId  = searchParams?.get('category')
    if (!goalId) return
    const g = getGoalById(goalId)
    if (!g) return
    setGoal(g)
    if (catId) {
      const c = g.categories.find((x) => x.id === catId) || g.categories[0]
      setCategory(c)
    } else {
      setCategory(g.categories[0])
    }
  }, [searchParams])

  const onGoalSelect = ({ goal: g, context: c }) => {
    setGoal(g)
    setContext(c || {})
    if (g) setCategory(g.categories[0])
  }

  const categorySignals = category ? signalsForCategory(signals, category) : []

  return (
    <CompareProvider>
    <div className="min-h-screen bg-[#F7F6F2] text-[#28251D]">
      {/* Compressed dark teal hero */}
      <section className="relative bg-[#1B474D] text-white">
        <SiteNav variant="dark" />
        <DashboardBackLink className="container pt-20 md:pt-24 -mb-4" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6 pt-6 pb-8 md:pt-8 md:pb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-white/80">
                <Pill className="h-3 w-3" /> Supplement Discovery
                {(hasGenome || hasBiomarkers) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-400/40 px-1.5 py-0.5 ml-1">
                    <Dna className="h-3 w-3" /> Personalised
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl md:text-4xl font-bold leading-tight max-w-3xl">
                Choose supplements by their <span className="text-[#F0A155]">form</span>, not their marketing.
              </h1>
              <p className="mt-2 text-white/85 text-sm md:text-base max-w-2xl leading-snug">
                NIH label data. Ingredient-form science. Brand-direct only &mdash; never Amazon.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                aria-label="Scan supplement barcode"
              >
                <Camera className="h-3.5 w-3.5" /> Scan
              </button>
              <button
                type="button"
                onClick={() => setStackOpen(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                aria-label={`Open my stack (${stackItems.length} items)`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                My Stack
                {stackItems.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-white text-[#1B474D] px-1.5 py-0.5 text-[10px] font-black">
                    {stackItems.length}
                  </span>
                )}
              </button>
              {(hasGenome || hasBiomarkers) && (
                <a
                  href="/tools/supplements/my-variants"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 text-sm font-semibold text-white transition"
                >
                  <Dna className="h-4 w-4" /> My variants
                </a>
              )}
              <a
                href="/tools/supplements/brands"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 text-sm font-semibold text-white transition"
              >
                <ShieldCheck className="h-4 w-4" /> Brand leaderboard
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 md:px-6 pt-6 md:pt-8 pb-24 space-y-6">
        <FirstVisitBanner
          storageKey="ss_visited_supplements"
          Icon={FlaskConical}
          text="Pick a health goal to see supplements matched to your genes — ranked by quality and transparency."
          buttonText="Choose a goal →"
          onAction={() => {
            const el = document.getElementById('goal-picker') || document.querySelector('[data-role="goal-picker"]')
            if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          ariaLabel="First visit tip on Supplements — dismiss"
        />
        <GoalPicker onSelect={onGoalSelect} initialGoalId={goal?.id} />
        {goal && (
          <CategoryStrip
            goal={goal}
            selectedCategoryId={category?.id}
            onSelect={setCategory}
          />
        )}
        {/* Personalisation banner - only when signals apply to selected category */}
        {categorySignals.length > 0 && (
          <PersonalisationBanner signals={categorySignals} category={category} />
        )}
        {/* Advisory moved below the goal picker */}
        <AdvisoryBanner />

        {goal && category ? (
          <ProductList category={category} signals={signals} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
            <p className="text-base font-semibold text-[#1B474D]">Pick a goal to see supplement categories.</p>
            <p className="mt-1 text-sm">Everything runs locally in your browser. We never send your goals or context off-device.</p>
            {!hasGenome && !hasBiomarkers && (
              <p className="mt-3 text-xs text-slate-500">
                <span className="font-semibold text-[#1B474D]">Optional:</span>{' '}
                <a href="/genome" className="underline hover:text-[#C45820]">Upload your genome</a> or{' '}
                <a href="/biomarkers" className="underline hover:text-[#C45820]">enter biomarkers</a>{' '}
                to see personalised form recommendations.
              </p>
            )}
          </div>
        )}

        <WhyNotAmazon />

        <div className="rounded-2xl border border-[#1B474D]/10 bg-white p-5 md:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B474D]">How this works</h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-700 list-decimal list-inside">
            <li><strong>Pick a goal.</strong> We map each goal to a hand-curated set of ingredient categories with the strongest published research.</li>
            <li><strong>Pick a category.</strong> We query the NIH Dietary Supplement Label Database (DSLD) for products containing that ingredient.</li>
            <li><strong>Compare by form.</strong> Every card is tagged with the FORM of the active ingredient and colour-coded by evidence tier.</li>
            <li><strong>Personalised (optional).</strong> If you&apos;ve uploaded your genome or entered biomarkers, we highlight the categories and forms your variants most reward.</li>
            <li><strong>Buy direct.</strong> All product links go to the brand&apos;s own store. We reject Amazon and marketplace links by design.</li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">Phase 1 covers {GOALS.length} health goals and roughly 40 ingredient categories. Phase 2 layers ingredient-form ontology, third-party certification detection, and brand-transparency profiles. Phase 3 adds genome + biomarker personalisation and side-by-side comparison &mdash; opt-in and 100% client-side.</p>
        </div>
      </main>

      <SiteFooter />
      <CompareFloatingBar />
      <CompareDrawer />
      <CompareConflictDialog />
      <MyStackDrawer open={stackOpen} onClose={() => setStackOpen(false)} />
      <SupplementScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        phenotypes={phenotypes}
        variantsByGene={variantsByGene}
      />
      <CompareToast />
    </div>
    </CompareProvider>
  )
}
