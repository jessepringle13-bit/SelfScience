'use client'
// Full-screen comparison table. Modal-style; opens when the user hits
// "Open comparison" on the CompareFloatingBar.
import { useEffect } from 'react'
import { X, ShieldCheck, ExternalLink, Beaker, AlertTriangle, Info } from 'lucide-react'
import { useCompare } from './CompareContext'
import { getScoreStyle } from '@/lib/supplements/scoreColor'
import { getBrandTierMeta } from '@/lib/supplements/brandTiers'
import CertBadges from './CertBadges'

const TIER_STYLE = {
  preferred: 'text-emerald-800 bg-emerald-100 border-emerald-300',
  acceptable: 'text-sky-800 bg-sky-100 border-sky-300',
  basic: 'text-amber-800 bg-amber-100 border-amber-300',
  unknown: 'text-slate-700 bg-slate-100 border-slate-300',
}

export default function CompareDrawer() {
  const { items, remove, open, setOpen, clear } = useCompare()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="absolute inset-0 md:inset-4 md:rounded-2xl overflow-hidden bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Side-by-side comparison</div>
            <h2 className="text-lg font-semibold text-[#1B474D]">{items.length} products · same-view compare</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clear} className="text-xs font-medium text-slate-500 hover:text-[#C45820] px-2 py-1">Clear all</button>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {items.length === 0 ? (
            <div className="p-6 text-slate-600">No products selected.</div>
          ) : (
            <div className="min-w-[720px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wide text-slate-500 font-semibold w-40">Attribute</th>
                    {items.map((p) => (
                      <th key={p.id} className="text-left px-4 py-2 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#1B474D]">{p.brand?.name}</div>
                            <div className="text-sm font-semibold text-slate-900 leading-snug">{p.fullName}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(p.id)}
                            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <Row label="Serving form">
                    {items.map((p) => <td key={p.id} className="px-4 py-3 text-slate-800">{p.physicalState || '—'}{p.netContents ? <span className="text-slate-500"> · {p.netContents}</span> : null}</td>)}
                  </Row>
                  <Row label="Active ingredient forms">
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3">
                        {(p.formQuality?.length ? p.formQuality : []).map((f, i) => (
                          <div key={i} className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] mr-1 mb-1 ${TIER_STYLE[f.tier] || TIER_STYLE.unknown}`}>
                            {f.tier === 'preferred' ? <ShieldCheck className="h-3 w-3" /> : f.tier === 'basic' ? <AlertTriangle className="h-3 w-3" /> : f.tier === 'acceptable' ? <Beaker className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                            <span className="font-medium">{f.formLabel}</span>
                            <span className="opacity-70">· {f.ingredient}</span>
                          </div>
                        ))}
                        {(!p.formQuality?.length) && <span className="text-xs italic text-slate-500">No mapped forms</span>}
                      </td>
                    ))}
                  </Row>
                  <Row label="Transparency score">
                    {items.map((p) => {
                      const s = p.brand?.transparencyScore
                      if (typeof s !== 'number') return <td key={p.id} className="px-4 py-3 text-slate-400 text-xs">Not scored</td>
                      const style = getScoreStyle(s)
                      return <td key={p.id} className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${style.chip}`}><span className="font-semibold">{s}</span><span className="opacity-60">/5</span><span className="opacity-80 hidden lg:inline">· {style.label}</span></span></td>
                    })}
                  </Row>
                  <Row label="Price tier">
                    {items.map((p) => {
                      const tm = getBrandTierMeta(p.brand?.name)
                      if (!tm) return <td key={p.id} className="px-4 py-3 text-slate-400 text-xs">\u2014</td>
                      return <td key={p.id} className="px-4 py-3"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tm.style}`} title={tm.description}>{tm.label}</span></td>
                    })}
                  </Row>
                  <Row label="Third-party certifications">
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3">
                        {p.certifications?.length
                          ? <CertBadges certifications={p.certifications} maxVisible={4} />
                          : <span className="text-xs italic text-slate-500">None detected on label</span>}
                      </td>
                    ))}
                  </Row>
                  <Row label="Brand curated?">
                    {items.map((p) => <td key={p.id} className="px-4 py-3 text-xs text-slate-700">{p.brand?.curated ? 'Yes' : 'No'}</td>)}
                  </Row>
                  <Row label="Off market">
                    {items.map((p) => <td key={p.id} className="px-4 py-3 text-xs text-slate-700">{p.offMarket ? 'Yes' : 'No'}</td>)}
                  </Row>
                  <Row label="DSLD label">
                    {items.map((p) => <td key={p.id} className="px-4 py-3 text-xs text-slate-500">#{p.id}</td>)}
                  </Row>
                  <Row label="Visit brand store">
                    {items.map((p) => {
                      const url = p.brand?.url?.url
                      const src = p.brand?.url?.source
                      if (!url) return <td key={p.id} className="px-4 py-3 text-xs text-slate-400">—</td>
                      return <td key={p.id} className="px-4 py-3">
                        <a href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${src === 'curated' ? 'bg-[#C45820] hover:bg-[#a94a1a] text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
                          <ExternalLink className="h-3 w-3" /> {src === 'curated' ? 'Brand store' : 'Brand site'}
                        </a>
                      </td>
                    })}
                  </Row>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-500 bg-slate-50">
          Educational only. Not medical advice. All links go to the brand&apos;s own store; we never link to Amazon or third-party marketplaces.
        </footer>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <tr>
      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-semibold align-top bg-slate-50 sticky left-0">{label}</th>
      {children}
    </tr>
  )
}
