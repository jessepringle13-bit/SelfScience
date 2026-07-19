'use client'
import { useEffect, useMemo, useState } from 'react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import BrandProfileDrawer from '@/components/supplements/BrandProfileDrawer'
import CertBadges from '@/components/supplements/CertBadges'
import { BRAND_PROFILES } from '@/lib/supplements/brandProfiles'
import { CERT_REGISTRY } from '@/lib/supplements/certifications'
import { getScoreStyle } from '@/lib/supplements/scoreColor'
import { BRAND_CATEGORIES, inferBrandCategories } from '@/lib/supplements/brandCategories'
import {
  getBrandExtras, computeGenomeFit, activeGenomeFormsFromContext, COST_TIER_STYLE,
} from '@/lib/supplements/brandExtras'
import { computeBrandScore, BRAND_SCORE_STYLE, CATEGORY_META } from '@/utils/brandScore'
import { getGenomeResults } from '@/lib/genomeSession'
import { Trophy, ArrowLeft, Award, Search, ExternalLink, Filter, Dna, DollarSign, Sparkles } from 'lucide-react'

const FILTER_TAGS = [
  { id: 'all',     label: 'All' },
  { id: 'nsf-sport',     label: 'NSF Sport' },
  { id: 'nsf-supplement',label: 'NSF Contents' },
  { id: 'usp',           label: 'USP Verified' },
  { id: 'informed-sport',label: 'Informed Sport' },
  { id: 'ifos-5',        label: 'IFOS 5-Star' },
  { id: 'non-gmo',       label: 'Non-GMO' },
  { id: 'usda-organic',  label: 'Organic' },
]

const COST_FILTERS = [
  { id: 'all',  label: 'All' },
  { id: '$',    label: '$ Budget' },
  { id: '$$',   label: '$$ Mid' },
  { id: '$$$',  label: '$$$ Premium' },
]

const GENOME_FILTER_KEY = 'ss_genome_filter_on'

export default function BrandsLeaderboardClient() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [costFilter, setCostFilter] = useState('all')
  const [drawerBrand, setDrawerBrand] = useState(null)
  const [genomeFilterOn, setGenomeFilterOn] = useState(false)
  const [variantsByGene, setVariantsByGene] = useState({})
  const [hasGenome, setHasGenome] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GENOME_FILTER_KEY)
      if (raw === '1') setGenomeFilterOn(true)
    } catch { /* noop */ }
    try {
      const g = getGenomeResults()
      if (g) {
        // Build a compact variantsByGene map from whatever fields are available.
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
        setHasGenome(Object.keys(map).length > 0 || !!(g.cards?.length))
      }
    } catch { /* noop */ }
  }, [])

  const activeForms = useMemo(
    () => activeGenomeFormsFromContext({ variantsByGene }),
    [variantsByGene],
  )

  const toggleGenomeFilter = () => {
    setGenomeFilterOn((prev) => {
      const next = !prev
      try { localStorage.setItem(GENOME_FILTER_KEY, next ? '1' : '0') } catch { /* noop */ }
      return next
    })
  }

  // Pre-compute categories + extras per brand once
  const brandsWithMeta = useMemo(() => {
    return Object.values(BRAND_PROFILES).map((b) => {
      const _extras = getBrandExtras(b.slug)
      return {
        ...b,
        _categories: inferBrandCategories(b),
        _extras,
        _genomeFit: computeGenomeFit(b, activeForms),
        _brandScore: computeBrandScore(b, _extras, hasGenome ? activeForms : null),
      }
    })
  }, [activeForms, hasGenome])

  const availableCategories = useMemo(() => {
    const present = new Set()
    for (const b of brandsWithMeta) b._categories.forEach((c) => present.add(c))
    return BRAND_CATEGORIES.filter((c) => present.has(c.id))
  }, [brandsWithMeta])

  const brands = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = brandsWithMeta.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q) && !(b.focus || '').toLowerCase().includes(q)) return false
      if (filter !== 'all' && !(b.programmes || []).includes(filter)) return false
      if (category !== 'all' && !b._categories.includes(category)) return false
      if (costFilter !== 'all' && b._extras.costTier !== costFilter) return false
      if (genomeFilterOn && hasGenome && b._genomeFit === 0) return false
      return true
    })
    // Sort: genome filter on → genomeFit desc first, then brandScore desc, then name.
    filtered.sort((a, b) => {
      if (genomeFilterOn && hasGenome) {
        const diff = b._genomeFit - a._genomeFit
        if (diff !== 0) return diff
      }
      return (b._brandScore.overall - a._brandScore.overall) || a.name.localeCompare(b.name)
    })
    return filtered
  }, [brandsWithMeta, query, filter, category, costFilter, genomeFilterOn, hasGenome])

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#28251D]">
      {/* Hero */}
      <section className="relative bg-[#1B474D] text-white">
        <SiteNav variant="dark" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6 pt-6 pb-8 md:pt-8 md:pb-10">
          <a href="/tools/supplements" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Supplement Discovery
          </a>
          <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-white/80">
                <Trophy className="h-3 w-3" /> Brand Leaderboard
              </div>
              <h1 className="mt-2 text-2xl md:text-4xl font-bold leading-tight">Brand transparency, ranked.</h1>
              <p className="mt-2 text-white/85 text-sm md:text-base max-w-2xl leading-snug">
                Every curated supplement brand in SelfScience, scored on manufacturing, CoA policy, proprietary-blend disclosure, third-party certification, and clinical-study track record.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 md:px-6 -mt-4 md:-mt-6 pb-16 space-y-4">
        {/* Filter toolbar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brand or focus…"
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm focus:border-[#1B474D] focus:outline-none focus:ring-1 focus:ring-[#1B474D]"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Category</span>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white pl-2 pr-1 py-1 text-sm">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent pr-1 py-1 text-sm text-slate-800 focus:outline-none"
                >
                  <option value="all">All categories</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </label>
            <div className="text-xs text-slate-500">
              {brands.length} of {Object.keys(BRAND_PROFILES).length} brands
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTER_TAGS.map((t) => {
              const active = filter === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-[#1B474D] text-white border-[#1B474D] shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-[#1B474D] hover:text-[#1B474D]'
                  }`}
                >
                  {t.id !== 'all' && <Award className="h-3 w-3" />}
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Cost tier + Best-for-my-genome */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <DollarSign className="h-3 w-3" /> Cost
            </span>
            {COST_FILTERS.map((c) => {
              const active = costFilter === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCostFilter(c.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-[#1B474D] text-white border-[#1B474D] shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-[#1B474D] hover:text-[#1B474D]'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
            {hasGenome && (
              <button
                type="button"
                onClick={toggleGenomeFilter}
                className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  genomeFilterOn
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }`}
                title="Reorder + filter brands that carry the specific forms your variants prefer (methylfolate, methylcobalamin, chelated minerals, etc.)"
              >
                <Dna className="h-3 w-3" />
                Best for my genome
                {genomeFilterOn && <span className="rounded-full bg-white/20 px-1.5 text-[10px]">ON</span>}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {brands.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No brands match those filters.</div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold w-14">#</th>
                  <th className="text-left px-4 py-2 font-semibold">Brand</th>
                  <th className="text-left px-4 py-2 font-semibold">BrandScore™</th>
                  <th className="text-left px-4 py-2 font-semibold hidden lg:table-cell">Sub-scores</th>
                  <th className="text-left px-4 py-2 font-semibold">Certifications</th>
                  <th className="text-left px-4 py-2 font-semibold">Cost</th>
                  {hasGenome && <th className="text-left px-4 py-2 font-semibold">Genome</th>}
                  <th className="text-right px-4 py-2 font-semibold">Visit</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b, idx) => {
                  const bs = b._brandScore
                  const bsStyle = BRAND_SCORE_STYLE[bs.tier]
                  const certs = (b.programmes || []).map((id) => CERT_REGISTRY[id]).filter(Boolean)
                  const costStyle = COST_TIER_STYLE[b._extras.costTier] || COST_TIER_STYLE['$$']
                  const genomeFit = b._genomeFit
                  const genomeLabel = genomeFit >= 3 ? 'High' : genomeFit >= 1 ? 'Med' : '—'
                  const genomeChip = genomeFit >= 3
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : genomeFit >= 1
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  return (
                    <tr key={b.slug} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDrawerBrand(b.name)}
                          className="text-left font-semibold text-[#1B474D] hover:underline"
                        >
                          {b.name}
                        </button>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{b.focus || b.hq}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${bsStyle.chip}`}>
                            <Sparkles className="h-3 w-3" />
                            <span className="tabular-nums">{bs.overall.toFixed(1)}</span>
                            <span className="opacity-60 font-medium">/10</span>
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">{bsStyle.label}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <SubScoreBars subScores={bs.subScores} />
                      </td>
                      <td className="px-4 py-3">
                        <CertBadges certifications={certs} compact maxVisible={3} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${costStyle.chip}`}>
                          {b._extras.costTier}
                          <span className="hidden xl:inline text-[10px] font-medium opacity-70">· {costStyle.label}</span>
                        </span>
                      </td>
                      {hasGenome && (
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${genomeChip}`}>
                            <Dna className="h-2.5 w-2.5" />
                            {genomeLabel}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <a
                          href={b.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#C45820] hover:underline text-xs font-medium"
                        >
                          Store <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Scores are hand-curated by SelfScience based on public information. Not an endorsement. Talk to a licensed clinician before starting any supplement.
        </p>
      </main>

      <BrandProfileDrawer
        brandName={drawerBrand}
        open={!!drawerBrand}
        onClose={() => setDrawerBrand(null)}
      />

      <SiteFooter />
    </div>
  )
}

function SubScoreBars({ subScores }) {
  const entries = Object.entries(subScores || {})
  return (
    <div className="flex items-end gap-1.5" style={{ minWidth: 160 }}>
      {entries.map(([key, val]) => {
        const meta = CATEGORY_META[key]
        if (!meta) return null
        const pct = Math.max(4, Math.round((val / meta.max) * 100))
        return (
          <div key={key} className="flex flex-col items-center gap-1" title={`${meta.label}: ${val}/${meta.max}`}>
            <div className="relative h-8 w-3 overflow-hidden rounded-sm bg-slate-100">
              <div
                className="absolute inset-x-0 bottom-0 transition-[height]"
                style={{ background: meta.color, height: `${pct}%` }}
              />
            </div>
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 leading-none">
              {meta.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
