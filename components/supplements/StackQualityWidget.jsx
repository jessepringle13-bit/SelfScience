'use client'

// /app/components/supplements/StackQualityWidget.jsx
// Dashboard widget that aggregates the user's "My Stack" (localStorage
// key: ss_my_stack) into a single Stack Quality score with sub-metrics.
//
// Empty state: prompts the user to add supplements from Supplement
// Discovery. When the stack is populated, shows:
//   • Overall quality (0–100) — average BrandScore × 10
//   • Brand Trust    — mean brand score
//   • Genome Alignment — mean genome-fit sub-score
//   • Item count
//   • Total monthly cost estimate (if brand cost tier available)
//   • Red alert rows for any items with unresolved supplement-drug flags
//
// Slice 5 will introduce the actual "My Stack" builder + storage; this
// widget already reads from ss_my_stack, so it lights up automatically
// as soon as the builder ships.

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronRight, PlusCircle, AlertTriangle } from 'lucide-react'
import { BRAND_PROFILES } from '@/lib/supplements/brandProfiles'
import { getBrandExtras, activeGenomeFormsFromContext } from '@/lib/supplements/brandExtras'
import { computeBrandScore, BRAND_SCORE_STYLE } from '@/utils/brandScore'
import { getGenomeResults } from '@/lib/genomeSession'

const STACK_KEY = 'ss_my_stack'

function readStack() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STACK_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

const COST_TO_MONTHLY = { '$': 15, '$$': 30, '$$$': 60 } // rough monthly per-supplement estimate USD

export default function StackQualityWidget() {
  const [stack, setStack] = useState([])
  const [variantsByGene, setVariantsByGene] = useState({})

  useEffect(() => {
    setStack(readStack())
    try {
      const g = getGenomeResults()
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
      }
    } catch { /* noop */ }
    // Re-read on cross-tab changes
    const onStorage = (e) => { if (e.key === STACK_KEY) setStack(readStack()) }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage)
      return () => window.removeEventListener('storage', onStorage)
    }
  }, [])

  const activeForms = useMemo(
    () => activeGenomeFormsFromContext({ variantsByGene }),
    [variantsByGene],
  )
  const hasGenome = activeForms.length > 0

  const agg = useMemo(() => {
    if (stack.length === 0) return null
    // For each stack item, look up its brand + compute BrandScore.
    let brandScoreSum = 0
    let brandScoreCount = 0
    let genomeSum = 0
    let genomeCount = 0
    let monthlyCost = 0
    const alerts = []
    const items = []

    for (const item of stack) {
      const brandProfile = Object.values(BRAND_PROFILES).find(
        (b) => (b.slug === item.brandSlug || b.name === item.brand),
      )
      let bs = null
      let extras = null
      if (brandProfile) {
        extras = getBrandExtras(brandProfile.slug)
        bs = computeBrandScore(brandProfile, extras, hasGenome ? activeForms : null)
        brandScoreSum += bs.overall
        brandScoreCount += 1
        if (bs.subScores.genomics != null) {
          genomeSum += bs.subScores.genomics
          genomeCount += 1
        }
        monthlyCost += COST_TO_MONTHLY[extras.costTier] ?? 30
      } else {
        monthlyCost += 30
      }
      if (item.alertFlag) {
        alerts.push({ name: item.name || 'Unknown supplement', message: item.alertFlag })
      }
      items.push({ item, bs })
    }
    const brandTrust = brandScoreCount ? brandScoreSum / brandScoreCount : 0
    const genomeAlignment = genomeCount ? genomeSum / genomeCount : 0
    // 0–100: weight 60 % brandTrust (0–10 → 0–60) + 40 % genomeAlignment (0–10 → 0–40).
    const overall = Math.round(brandTrust * 6 + genomeAlignment * 4)
    return {
      overall,
      brandTrust: Math.round(brandTrust * 10) / 10,
      genomeAlignment: Math.round(genomeAlignment * 10) / 10,
      monthlyCost,
      alerts,
      itemCount: stack.length,
      items,
    }
  }, [stack, hasGenome, activeForms])

  // ─── Empty state ────────────────────────────────────────────────────
  if (!agg) {
    return (
      <div className="rounded-2xl border border-ss-border-warm/60 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
            <Sparkles size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
              Your stack quality
            </div>
            <div className="mt-1 text-sm text-ss-text">
              Add supplements to your stack to see your quality score.
            </div>
          </div>
          <Link
            href="/tools/supplements"
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-ss-teal px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:brightness-110"
          >
            <PlusCircle size={12} /> Build stack
          </Link>
        </div>
      </div>
    )
  }

  const tier = agg.overall >= 80 ? 'high' : agg.overall >= 50 ? 'moderate' : 'low'
  const tierStyle = BRAND_SCORE_STYLE[tier]

  return (
    <div className="rounded-2xl border border-ss-border-warm/60 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
            <Sparkles size={17} />
          </span>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
              Your stack quality
            </div>
            <div className="text-xs text-ss-muted">{agg.itemCount} supplement{agg.itemCount === 1 ? '' : 's'} in your stack</div>
          </div>
        </div>
        <Link
          href="/tools/supplements"
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ss-teal px-3 py-1.5 text-[11px] font-bold text-ss-teal hover:bg-ss-teal hover:text-white"
        >
          Optimize stack <ChevronRight size={12} />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreCell label="Overall" value={agg.overall} suffix="/100" tone={tier} big />
        <ScoreCell label="Brand Trust" value={agg.brandTrust} suffix="/10" />
        {hasGenome && <ScoreCell label="Genome Align." value={agg.genomeAlignment} suffix="/10" />}
        <ScoreCell label="Est. cost" value={`$${agg.monthlyCost}`} suffix="/mo" />
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full transition-all ${tier === 'high' ? 'bg-emerald-500' : tier === 'moderate' ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(100, agg.overall)}%` }}
        />
      </div>

      {agg.alerts.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5">
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-red-700">
            <AlertTriangle size={11} /> {agg.alerts.length} item{agg.alerts.length === 1 ? '' : 's'} need attention
          </div>
          {agg.alerts.slice(0, 3).map((a, i) => (
            <div key={i} className="text-[11.5px] leading-snug text-red-800">
              <span className="font-bold">{a.name}:</span> {a.message}
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] italic text-ss-muted">
        For educational purposes only. Not a substitute for professional medical advice.
      </p>
    </div>
  )
}

function ScoreCell({ label, value, suffix, tone, big }) {
  const toneCls =
    tone === 'high'     ? 'text-emerald-700' :
    tone === 'moderate' ? 'text-amber-700' :
    tone === 'low'      ? 'text-red-700' :
                          'text-ss-teal'
  return (
    <div className="rounded-lg bg-ss-bg/60 px-2 py-2">
      <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-ss-muted">{label}</div>
      <div className={`mt-0.5 tabular-nums font-black ${big ? 'text-2xl' : 'text-lg'} ${toneCls}`}>
        {value}<span className="text-[11px] font-bold text-ss-muted">{suffix}</span>
      </div>
    </div>
  )
}
