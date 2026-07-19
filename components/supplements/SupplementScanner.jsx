'use client'

// /app/components/supplements/SupplementScanner.jsx
// Full-screen supplement barcode scanner. Wraps the existing
// BarcodeScanner (same @zxing-backed component used by Nutrition Hub) and
// swaps the lookup target to the NIH DSLD API. Renders a genome-fit
// verdict + interaction flags in the result view.

import { useEffect, useMemo, useState } from 'react'
import { X, Camera, Search, ExternalLink, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import BarcodeScanner from '@/components/BarcodeScanner'
import { findInteractionsForSupplement } from '@/lib/supplements/interactions'
import { activeGenomeFormsFromContext } from '@/lib/supplements/brandExtras'
import { medicationsStore } from '@/lib/lists'
import { AddToStackButton } from '@/components/supplements/MyStackDrawer'

// Simple ingredient-form → variant-fit heuristic. Higher score = better
// fit for MTHFR / BCMO1 / COMT variants.
function computeGenomeFitFromIngredients(ingredients, activeForms) {
  if (!activeForms?.length || !ingredients?.length) return { level: 'Unknown', matched: [], suboptimal: [] }
  const matched = []
  const suboptimal = []
  for (const ing of ingredients) {
    const nameForm = (`${ing.name || ''} ${ing.form || ''}`).toLowerCase()
    // Positive form matches
    if (/methylfolate|l-5-mthf|5-methyltetrahydrofolate|quatrefolic/.test(nameForm)) matched.push('methylfolate')
    if (/methylcobalamin|methyl b-12|methyl b12/.test(nameForm))                     matched.push('methylcobalamin')
    if (/preformed vitamin a|retinyl (palmitate|acetate)/.test(nameForm))            matched.push('preformed_retinol')
    if (/bisglycinate|glycinate|chelate|amino acid chelate|malate|citrate/.test(nameForm)) matched.push('chelated_minerals')
    if (/hydroxocobalamin|hydroxy.*b12|adenosylcobalamin/.test(nameForm))            matched.push('hydroxy_b12')
    if (/p-5-p|pyridoxal-5-phosphate|riboflavin-5-phosphate|active b-?complex/.test(nameForm)) matched.push('active_bs')
    // Suboptimal
    if (/folic acid(?!\s*equivalents)/.test(nameForm) && activeForms.includes('methylfolate')) {
      suboptimal.push({ ingredient: ing.name, issue: 'Contains folic acid — MTHFR carriers convert methylfolate more efficiently.' })
    }
    if (/cyanocobalamin/.test(nameForm) && activeForms.includes('methylcobalamin')) {
      suboptimal.push({ ingredient: ing.name, issue: 'Contains cyanocobalamin — methylcobalamin is preferred for MTHFR carriers.' })
    }
    if (/beta.?carotene/.test(nameForm) && activeForms.includes('preformed_retinol')) {
      suboptimal.push({ ingredient: ing.name, issue: 'Beta-carotene form — BCMO1 carriers benefit from preformed retinol.' })
    }
    if (/(iron\s+oxide|magnesium\s+oxide|calcium\s+carbonate)/.test(nameForm) && activeForms.includes('chelated_minerals')) {
      suboptimal.push({ ingredient: ing.name, issue: `Oxide/carbonate form — a chelated mineral (${ing.name.split(' ')[0]} glycinate/citrate) is better absorbed.` })
    }
  }
  const uniqMatches = Array.from(new Set(matched))
  const activeMatch = uniqMatches.filter((m) => activeForms.includes(m)).length
  const level = activeMatch >= 3 ? 'High' : activeMatch >= 1 ? 'Medium' : 'Low'
  return { level, matched: uniqMatches, suboptimal }
}

export default function SupplementScanner({ open, onClose, phenotypes, variantsByGene }) {
  const [state, setState] = useState({ status: 'idle', product: null, error: null, query: '' })

  const activeForms = useMemo(
    () => activeGenomeFormsFromContext({ variantsByGene: variantsByGene || {} }),
    [variantsByGene],
  )
  const userDrugs = medicationsStore.all().map((m) => m.name)

  const lookupBarcode = async (code) => {
    setState({ status: 'loading', product: null, error: null, query: code })
    try {
      const res = await fetch(`/api/supplements/dsld-product?barcode=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!res.ok || !data.product) {
        setState({ status: 'notfound', product: null, error: null, query: code })
        return
      }
      setState({ status: 'result', product: data.product, error: null, query: code })
    } catch (err) {
      setState({ status: 'error', product: null, error: err?.message || 'Unknown error', query: code })
    }
  }

  const searchByName = async (q) => {
    if (!q.trim()) return
    setState({ status: 'loading', product: null, error: null, query: q })
    try {
      const res = await fetch(`/api/supplements/dsld-product?query=${encodeURIComponent(q)}&size=6`)
      const data = await res.json()
      if (data.products?.length) {
        setState({ status: 'results', products: data.products, error: null, query: q })
      } else {
        setState({ status: 'notfound', product: null, error: null, query: q })
      }
    } catch (err) {
      setState({ status: 'error', product: null, error: err?.message, query: q })
    }
  }

  const reset = () => setState({ status: 'idle', product: null, error: null, query: '' })

  // Close on Escape key
  useEffect(() => {
    if (!open || typeof window === 'undefined') return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const genomeFit = state.product
    ? computeGenomeFitFromIngredients(state.product.ingredients, activeForms)
    : null
  const interactions = state.product
    ? findInteractionsForSupplement(
        [state.product.productName, ...(state.product.ingredients?.map((i) => i.name) || [])].join(' '),
        { userDrugs, phenotypes },
      )
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ss-canvas text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Supplement barcode scanner"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Camera size={16} />
          </span>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">Supplement scanner</div>
            <div className="text-sm font-bold">NIH DSLD lookup + genome fit</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
          aria-label="Close scanner"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {state.status === 'idle' && (
          <BarcodeScanner onScan={lookupBarcode} onClose={onClose} />
        )}

        {state.status === 'loading' && (
          <div className="mt-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <p className="mt-3 text-sm text-white/70">Looking up "{state.query}" in the DSLD database…</p>
          </div>
        )}

        {state.status === 'notfound' && (
          <div className="mt-8 rounded-2xl bg-white/5 p-5 text-center">
            <p className="text-sm font-semibold">Product not found in DSLD</p>
            <p className="mt-1 text-[12px] text-white/70">Try searching by name instead.</p>
            <div className="mx-auto mt-4 flex max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  defaultValue={state.query}
                  onKeyDown={(e) => { if (e.key === 'Enter') searchByName(e.target.value) }}
                  className="h-11 w-full rounded-full border border-white/20 bg-white/10 pl-8 pr-3 text-sm text-white placeholder-white/50 outline-none focus:border-white/50"
                  placeholder="e.g. Thorne Basic Nutrients"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={reset}
                className="min-h-11 rounded-full border border-white/20 px-3 text-xs font-bold text-white/80 hover:bg-white/10"
              >
                Rescan
              </button>
            </div>
          </div>
        )}

        {state.status === 'results' && (
          <div className="mx-auto max-w-md">
            <h3 className="text-sm font-bold">Results for "{state.query}"</h3>
            <ul className="mt-3 space-y-2">
              {state.products.map((p) => (
                <li key={p.dsldId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-bold">{p.productName}</div>
                  <div className="text-[11px] text-white/70">{p.brand}</div>
                  <button
                    type="button"
                    onClick={() => setState({ status: 'result', product: p, error: null, query: state.query })}
                    className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-[11px] font-bold hover:bg-white/10"
                  >
                    View <ExternalLink size={11} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.status === 'result' && state.product && (
          <ProductResult
            product={state.product}
            genomeFit={genomeFit}
            interactions={interactions}
            onRescan={reset}
          />
        )}

        {state.status === 'error' && (
          <div className="mt-8 rounded-2xl bg-red-500/10 p-5 text-center text-red-100">
            <AlertTriangle className="mx-auto" size={20} />
            <p className="mt-2 text-sm">Something went wrong. {state.error}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 min-h-11 rounded-full border border-white/30 px-4 text-xs font-bold hover:bg-white/10"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductResult({ product, genomeFit, interactions, onRescan }) {
  const fitTone =
    genomeFit?.level === 'High'   ? 'bg-emerald-500 text-white' :
    genomeFit?.level === 'Medium' ? 'bg-amber-500 text-white' :
    genomeFit?.level === 'Low'    ? 'bg-red-500 text-white'   :
                                    'bg-white/20 text-white'
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-5 text-ss-text shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">
            {product.brand || 'Unknown brand'}
          </div>
          <h2 className="mt-0.5 text-base font-bold text-ss-text">{product.productName}</h2>
          {product.servingSize && (
            <div className="mt-0.5 text-[11px] text-ss-muted">Serving: {product.servingSize}</div>
          )}
        </div>
        {genomeFit && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${fitTone}`}>
            Genome fit: {genomeFit.level}
          </span>
        )}
      </div>

      {genomeFit && genomeFit.suboptimal.length > 0 && (
        <div className="mt-3 rounded-lg border border-ss-amber/40 bg-ss-amber/10 p-2.5">
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-ss-amber">
            <AlertTriangle size={10} /> Suboptimal for your variants
          </div>
          <ul className="mt-1.5 space-y-1 text-[11.5px] leading-snug text-ss-text">
            {genomeFit.suboptimal.map((s, i) => (
              <li key={i}>
                <span className="font-semibold">{s.ingredient}</span>: <span className="text-ss-muted">{s.issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {interactions.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-300/60 bg-red-50 p-2.5 text-red-900">
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider">
            <AlertTriangle size={10} /> Interaction with your list
          </div>
          {interactions.map((f, i) => (
            <p key={i} className="mt-1 text-[11.5px] leading-snug">{f.message}</p>
          ))}
        </div>
      )}

      {product.ingredients?.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ss-teal">Label ingredients</div>
          <ul className="mt-1.5 max-h-56 overflow-y-auto space-y-1 pr-1 text-[11.5px] leading-snug">
            {product.ingredients.slice(0, 20).map((i, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2">
                <span className="text-ss-text">
                  <span className="font-semibold">{i.name}</span>
                  {i.form && i.form !== i.name && <span className="text-ss-muted"> ({i.form})</span>}
                </span>
                {(i.quantity || i.unit) && (
                  <span className="whitespace-nowrap text-ss-muted">{i.quantity} {i.unit}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AddToStackButton
          item={{
            id: `dsld-${product.dsldId}`,
            name: product.productName,
            brand: product.brand,
            brandSlug: product.brand ? product.brand.toLowerCase().replace(/\s+/g, '-') : null,
            dose: product.ingredients?.[0]?.quantity ? `${product.ingredients[0].quantity} ${product.ingredients[0].unit || ''}` : null,
          }}
          label="Add to my stack"
        />
        <button
          type="button"
          onClick={onRescan}
          className="min-h-11 rounded-full border border-ss-border-warm px-3 py-1.5 text-[11px] font-bold text-ss-muted hover:text-ss-teal"
        >
          Scan another
        </button>
      </div>

      <p className="mt-3 text-[10px] italic text-ss-muted">
        For educational purposes only. Not a substitute for professional medical advice. Data via NIH DSLD.
      </p>
    </div>
  )
}
