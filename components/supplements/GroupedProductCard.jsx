'use client'
// Redesigned card for the Curated view.
//   - One card per brand + product-family (variants nested).
//   - Brand header + trust badges.
//   - Selected variant with active-ingredient FORM front-and-centre.
//   - "Why this may fit you" — deterministic, non-prescriptive rationale.
//   - Variant chips: switch dose / count without leaving the card.
//   - Progressive disclosure: full label details are collapsed by default.
//   - Brand-direct CTA (never marketplace).
import { useMemo, useState } from 'react'
import {
  ExternalLink, ShieldCheck, Beaker, Info, AlertTriangle, ChevronDown,
  Search, Package, Sparkles, Building2,
} from 'lucide-react'
import CertBadges from './CertBadges'
import BrandProfileDrawer from './BrandProfileDrawer'

const TIER_BADGE = {
  preferred: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Preferred form', icon: ShieldCheck },
  acceptable: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300', label: 'Acceptable form', icon: Beaker },
  basic: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Basic form', icon: AlertTriangle },
  unknown: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Form not classified', icon: Info },
}

export default function GroupedProductCard({ group, whyThisFits }) {
  const [variantId, setVariantId] = useState(group.defaultVariant.id)
  const [openTip, setOpenTip] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const variant = useMemo(
    () => group.variants.find((v) => v.id === variantId) || group.variants[0],
    [variantId, group.variants]
  )
  const product = variant?.product || group.defaultVariant
  const brand = product.brand || {}
  const brandUrl = brand?.url?.url
  const brandUrlSource = brand?.url?.source
  const transparencyScore = brand?.transparencyScore ?? group.defaultVariant?.brand?.transparencyScore ?? null
  const hasProfile = !!(brand?.profileSlug || group.defaultVariant?.brand?.profileSlug)
  const certifications = product?.certifications || []

  const loadDetail = async () => {
    if (detail?.id === product.id || loadingDetail) return
    setLoadingDetail(true)
    try {
      const r = await fetch(`/api/supplements/dsld/${product.id}`)
      const d = await r.json()
      setDetail(d?.product ? { ...d.product, id: product.id } : null)
    } catch { /* silent */ }
    setLoadingDetail(false)
  }

  // Reset expanded label detail when user switches variant
  const onVariantSelect = (id) => {
    if (id === variantId) return
    setVariantId(id)
    setDetail(null)
    setOpenTip(null)
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Brand header (clickable when a profile exists) */}
      <header className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {hasProfile ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-[#1B474D] text-sm hover:underline"
              title="View brand transparency profile"
            >
              {group.brand}
              <Building2 className="h-3.5 w-3.5 opacity-70" />
            </button>
          ) : (
            <span className="font-semibold text-[#1B474D] text-sm">{group.brand}</span>
          )}
          {group.curated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF7F7] text-[#1B474D] border border-[#1B474D]/20 px-2 py-0.5 text-[11px] font-semibold">
              <ShieldCheck className="h-3 w-3" /> Curated brand
            </span>
          )}
          {typeof transparencyScore === 'number' && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white border border-[#1B474D]/20 px-2 py-0.5 text-[11px] text-[#1B474D] hover:bg-[#EEF7F7]"
              title="Transparency score (click for profile)"
            >
              <span className="font-semibold">{transparencyScore}</span>
              <span className="text-[#1B474D]/60">/5</span>
            </button>
          )}
          {group.variantCount > 1 && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px]">
              {group.variantCount} versions
            </span>
          )}
        </div>
        <h3 className="mt-1 text-base md:text-lg font-semibold text-slate-900 leading-snug">
          {group.family}
        </h3>
        {certifications.length > 0 && (
          <div className="mt-2">
            <CertBadges certifications={certifications} maxVisible={5} />
          </div>
        )}
      </header>

      {/* Form-quality tags for the selected variant */}
      <div className="p-4 md:p-5">
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
                      <div className={`text-[11px] font-semibold ${meta.text}`}>{meta.label}</div>
                      <div className="text-sm font-medium text-slate-900">
                        <span className="truncate">{f.formLabel}</span>
                        <span className="text-slate-500"> · {f.ingredient}</span>
                      </div>
                      {openTip === key && (
                        <div className="mt-1 text-xs text-slate-700 space-y-1">
                          <p>{f.explain}</p>
                          {(f.evidence || f.halfLife || f.pairWith) && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {f.evidence && <span className="inline-flex items-center rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px]">Evidence: {f.evidence}</span>}
                              {f.halfLife && <span className="inline-flex items-center rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px]">Half-life: {f.halfLife}</span>}
                              {f.pairWith && <span className="inline-flex items-center rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px]">Pair with: {f.pairWith}</span>}
                            </div>
                          )}
                          {f.caution && (
                            <p className="rounded bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 text-[11px] mt-1">
                              <strong>Caution:</strong> {f.caution}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition ${openTip === key ? 'rotate-180' : ''}`} />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs italic text-slate-500">No mapped active ingredients (label parsed, but this product uses forms not in our reference set yet).</p>
        )}

        {/* Why this may fit you */}
        {whyThisFits && (
          <div className="mt-4 rounded-lg border border-[#1B474D]/15 bg-[#F8FBFB] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1B474D]">
              <Sparkles className="h-3.5 w-3.5" /> Why this may fit
            </div>
            <p className="mt-1 text-xs text-slate-700 leading-snug">{whyThisFits}</p>
          </div>
        )}

        {/* Selected variant meta */}
        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Selected version</div>
              <div className="text-sm font-medium text-slate-900 truncate">{variant.label || variant.fullName}</div>
            </div>
          </div>
          {product.offMarket ? <span className="text-[11px] font-semibold text-amber-700">Off market</span> : null}
        </div>

        {/* Variant chips */}
        {group.variants.length > 1 && (
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">Other versions</div>
            <div className="flex flex-wrap gap-1.5">
              {group.variants.map((v) => {
                const selected = v.id === variant.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onVariantSelect(v.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      selected
                        ? 'border-[#1B474D] bg-[#1B474D] text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#1B474D] hover:text-[#1B474D]'
                    }`}
                    title={v.fullName}
                  >
                    {v.label || v.fullName}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* CTA row */}
      <div className="px-4 md:px-5 pb-3 pt-1 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500">
          Source: NIH DSLD label #{product.id}
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

      {/* Progressive disclosure: full label detail */}
      <details
        className="border-t border-slate-100 group"
        onToggle={(e) => { if (e.currentTarget.open) loadDetail() }}
      >
        <summary className="cursor-pointer px-4 md:px-5 py-3 text-sm font-medium text-[#1B474D] hover:bg-slate-50 flex items-center justify-between">
          <span>Show full label details</span>
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
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
              {product.ingredients?.length ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-slate-500 hover:text-[#1B474D]">Show all label ingredients ({product.ingredients.length})</summary>
                  <ul className="mt-1 text-xs text-slate-700 space-y-0.5">
                    {product.ingredients.slice(0, 30).map((i, ix) => (
                      <li key={ix}>
                        <span className="font-medium">{i.name}</span>
                        {i.notes ? <span className="text-slate-500"> — {i.notes}</span> : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
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
        brandName={group.brand}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </article>
  )
}
