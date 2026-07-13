'use client'
import { useMemo, useState } from 'react'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
import BrandProfileDrawer from '@/components/supplements/BrandProfileDrawer'
import CertBadges from '@/components/supplements/CertBadges'
import { BRAND_PROFILES } from '@/lib/supplements/brandProfiles'
import { CERT_REGISTRY } from '@/lib/supplements/certifications'
import { getScoreStyle } from '@/lib/supplements/scoreColor'
import { BRAND_CATEGORIES, inferBrandCategories } from '@/lib/supplements/brandCategories'
import { Trophy, ArrowLeft, Award, Search, ExternalLink, Filter } from 'lucide-react'

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

export default function BrandsLeaderboardClient() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [drawerBrand, setDrawerBrand] = useState(null)

  // Pre-compute categories per brand once
  const brandsWithCats = useMemo(() => {
    return Object.values(BRAND_PROFILES).map((b) => ({
      ...b,
      _categories: inferBrandCategories(b),
    }))
  }, [])

  // Only show categories that actually contain at least one brand
  const availableCategories = useMemo(() => {
    const present = new Set()
    for (const b of brandsWithCats) b._categories.forEach((c) => present.add(c))
    return BRAND_CATEGORIES.filter((c) => present.has(c.id))
  }, [brandsWithCats])

  const brands = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = brandsWithCats.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q) && !(b.focus || '').toLowerCase().includes(q)) return false
      if (filter !== 'all' && !(b.programmes || []).includes(filter)) return false
      if (category !== 'all' && !b._categories.includes(category)) return false
      return true
    })
    // Sort by score desc, then name asc
    filtered.sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name))
    return filtered
  }, [brandsWithCats, query, filter, category])

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
                  <th className="text-left px-4 py-2 font-semibold">Score</th>
                  <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Focus</th>
                  <th className="text-left px-4 py-2 font-semibold">Certifications</th>
                  <th className="text-right px-4 py-2 font-semibold">Visit</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b, idx) => {
                  const style = getScoreStyle(b.score)
                  const certs = (b.programmes || []).map((id) => CERT_REGISTRY[id]).filter(Boolean)
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
                        <div className="text-[11px] text-slate-500">{b.hq}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${style.chip}`}>
                          <span className="font-semibold">{b.score}</span>
                          <span className="opacity-60">/5</span>
                          <span className="hidden lg:inline opacity-80">· {style.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 hidden md:table-cell">
                        <span className="line-clamp-2 text-xs">{b.focus || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <CertBadges certifications={certs} compact maxVisible={3} />
                      </td>
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
