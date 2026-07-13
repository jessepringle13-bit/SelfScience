'use client'
import { useState } from 'react'
import { ExternalLink, ShieldCheck, Beaker, Info, Package, AlertTriangle, ChevronDown, Search, Building2 } from 'lucide-react'
import CertBadges from './CertBadges'
import BrandProfileDrawer from './BrandProfileDrawer'

const TIER_BADGE = {
  preferred: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Preferred form', icon: ShieldCheck },
  acceptable: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300', label: 'Acceptable form', icon: Beaker },
  basic: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Basic form', icon: AlertTriangle },
  unknown: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Form not classified', icon: Info },
}

export default function ProductCard({ product }) {
  const [openTip, setOpenTip] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const brand = product?.brand || {}
  const brandUrl = brand?.url?.url
  const brandUrlSource = brand?.url?.source
  const isCurated = !!brand?.curated
  const hasProfile = !!brand?.profileSlug
  const transparencyScore = brand?.transparencyScore ?? null
  const certifications = product?.certifications || []

  const loadDetail = async () => {
    if (detail || loadingDetail) return
    setLoadingDetail(true)
    try {
      const r = await fetch(`/api/supplements/dsld/${product.id}`)
      const d = await r.json()
      setDetail(d?.product || null)
    } catch { /* silent */ }
    setLoadingDetail(false)
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              {hasProfile ? (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-1 font-semibold text-[#1B474D] hover:underline"
                  title="View brand transparency profile"
                >
                  {brand.name}
                  <Building2 className="h-3 w-3 opacity-70" />
                </button>
              ) : (
                <span className="font-semibold text-[#1B474D]">{brand.name}</span>
              )}
              {isCurated && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF7F7] text-[#1B474D] border border-[#1B474D]/20 px-2 py-0.5">
                  <ShieldCheck className="h-3 w-3" /> Curated
                </span>
              )}
              {typeof transparencyScore === 'number' && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-[#1B474D]/20 px-2 py-0.5 text-[#1B474D] hover:bg-[#EEF7F7]"
                  title="Transparency score"
                >
                  <span className="font-semibold">{transparencyScore}</span>/5
                </button>
              )}
            </div>
            <h3 className="mt-1 text-base md:text-lg font-semibold text-slate-900 leading-snug">
              {product.fullName}
            </h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {product.physicalState && <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" />{product.physicalState}</span>}
              {product.netContents && <span>{product.netContents}</span>}
              {product.productType && <span className="italic">{product.productType}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Form quality tags */}
      <div className="p-4 md:p-5 flex-1">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Active ingredient forms</div>
        {product.formQuality?.length ? (
          <ul className="mt-2 space-y-2">
            {product.formQuality.map((f, idx) => {
              const meta = TIER_BADGE[f.tier] || TIER_BADGE.unknown
              const Icon = meta.icon
              const key = `${product.id}-${idx}`
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenTip(openTip === key ? null : key)}
                    className={`w-full flex items-start gap-2 rounded-lg border ${meta.border} ${meta.bg} px-3 py-2 text-left`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${meta.text}`}>{meta.label}</div>
                      <div className="text-sm font-medium text-slate-900 truncate">{f.formLabel} <span className="text-slate-500">· {f.ingredient}</span></div>
                      {openTip === key && (
                        <div className="mt-1 text-xs text-slate-700 whitespace-normal">{f.explain}</div>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition ${openTip === key ? 'rotate-180' : ''}`} />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm italic text-slate-500">No mapped active ingredients (label parsed from DSLD, but this product uses forms not in our reference set yet).</p>
        )}

        {/* Ingredient list (compact) */}
        {product.ingredients?.length ? (
          <details className="mt-4 group">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-[#1B474D]">Show all label ingredients ({product.ingredients.length})</summary>
            <ul className="mt-2 text-xs text-slate-700 space-y-0.5">
              {product.ingredients.slice(0, 20).map((i, ix) => (
                <li key={ix} className="truncate">
                  <span className="font-medium">{i.name}</span>
                  {i.notes ? <span className="text-slate-500"> — {i.notes}</span> : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      {/* Certification badges (product-level + brand programmes) */}
      {certifications.length > 0 && (
        <div className="px-4 md:px-5 pb-3">
          <CertBadges certifications={certifications} maxVisible={5} />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500">
          Source: NIH DSLD label #{product.id}
          {product.offMarket ? <span className="ml-2 text-amber-700 font-semibold">Off market</span> : null}
        </div>
        {brandUrl ? (
          <a
            href={brandUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${
              brandUrlSource === 'curated'
                ? 'bg-[#C45820] hover:bg-[#a94a1a] text-white'
                : brandUrlSource === 'dsld_manufacturer'
                  ? 'bg-[#1B474D] hover:bg-[#0f2f34] text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
            title={
              brandUrlSource === 'curated' ? 'Curated official brand store'
                : brandUrlSource === 'dsld_manufacturer' ? 'Manufacturer website from NIH label record'
                : 'Search fallback (brand website not verified)'
            }
          >
            {brandUrlSource === 'search_fallback' ? <Search className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            {brandUrlSource === 'curated' ? 'Visit brand store'
              : brandUrlSource === 'dsld_manufacturer' ? 'Manufacturer site'
              : 'Find brand'}
          </a>
        ) : null}
      </div>

      {/* Expandable full label detail */}
      <details className="border-t border-slate-100" onToggle={(e) => { if (e.currentTarget.open) loadDetail() }}>
        <summary className="cursor-pointer px-4 md:px-5 py-3 text-sm font-medium text-[#1B474D] hover:bg-slate-50">
          Show full label details
        </summary>
        <div className="px-4 md:px-5 pb-4 text-sm text-slate-700 space-y-2">
          {loadingDetail && <p className="italic text-slate-500">Loading label from NIH DSLD…</p>}
          {detail && (
            <>
              {detail.servingsPerContainer && <p><strong>Servings per container:</strong> {detail.servingsPerContainer}</p>}
              {detail.directions && <p><strong>Directions:</strong> {detail.directions}</p>}
              {detail.warnings?.length ? <p><strong>Warnings:</strong> {detail.warnings.join(' ')}</p> : null}
              {detail.doesNotContain && <p><strong>Free of:</strong> {detail.doesNotContain}</p>}
              {detail.brand?.manufacturer?.name && (
                <p className="text-xs text-slate-500">Manufactured by {detail.brand.manufacturer.name}{detail.brand.manufacturer.city ? `, ${detail.brand.manufacturer.city}` : ''}{detail.brand.manufacturer.state ? `, ${detail.brand.manufacturer.state}` : ''}.</p>
              )}
              {detail.labelPdf && (
                <a href={detail.labelPdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1B474D] hover:underline text-xs">
                  <ExternalLink className="h-3.5 w-3.5" /> View original NIH label PDF
                </a>
              )}
            </>
          )}
        </div>
      </details>

      <BrandProfileDrawer
        brandName={brand.name}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </article>
  )
}
