'use client'
// Practitioner Report supplement addendum. Renders a compact print-friendly
// section listing personalisation signals + curated top brands per ingredient
// family. Called from the practitioner report page below the biomarker block.
import { useEffect, useState } from 'react'
import { computePersonalisation } from '@/lib/supplements/personalisation'
import { getGenomeResults } from '@/lib/genomeSession'
import { getBiomarkerValues } from '@/lib/biomarkersSession'
import { BRAND_PROFILES } from '@/lib/supplements/brandProfiles'

const IK_TO_LABEL = {
  'folate': 'Folate (L-5-Methylfolate preferred)',
  'vitamin b12': 'Vitamin B12 (methylcobalamin preferred)',
  'vitamin d': 'Vitamin D3 + K2',
  'vitamin a': 'Preformed Vitamin A',
  'omega-3': 'Omega-3 EPA/DHA (triglyceride form)',
  'iron': 'Iron bisglycinate',
  'berberine': 'Berberine / dihydroberberine',
}

const TOP_BRANDS_BY_INGREDIENT = {
  'folate':      ['Thorne', 'MethylPro', 'Seeking Health', 'Pure Encapsulations'],
  'vitamin b12': ['Thorne', 'Seeking Health', 'Pure Encapsulations', 'Jarrow Formulas'],
  'vitamin d':   ['Thorne', 'Life Extension', 'Nordic Naturals', 'Pure Encapsulations'],
  'omega-3':     ['Nordic Naturals', 'Carlson Labs', 'Thorne', 'Momentous'],
  'iron':        ['Thorne', 'Pure Encapsulations', 'Designs for Health'],
  'berberine':   ['Thorne', 'Life Extension', 'Designs for Health'],
  'vitamin a':   ['Nordic Naturals', 'Thorne', 'Pure Encapsulations'],
}

export default function PractitionerSupplementBlock() {
  const [signals, setSignals] = useState([])

  useEffect(() => {
    try {
      const g = getGenomeResults()
      const b = getBiomarkerValues()
      setSignals(computePersonalisation({ genomeReport: g, biomarkers: b }))
    } catch { /* silent */ }
  }, [])

  if (!signals?.length) return null

  // Group signals by ingredient family
  const grouped = signals.reduce((acc, s) => {
    const k = s.ingredientKey
    if (!acc[k]) acc[k] = []
    acc[k].push(s)
    return acc
  }, {})

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 print:break-inside-avoid print:border-slate-400">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
        <h3 className="text-base font-semibold text-slate-900">Supplement Considerations</h3>
        <div className="text-[10px] text-slate-500">Educational · non-prescriptive</div>
      </div>
      <p className="text-xs text-slate-600 mb-3">
        Personalisation signals derived from the uploaded genome + entered biomarkers.
        Brand suggestions listed are illustrative of practitioner-tier, label-transparent options.
      </p>
      <div className="space-y-3">
        {Object.entries(grouped).map(([ik, sigs]) => {
          const label = IK_TO_LABEL[ik] || ik
          const brands = (TOP_BRANDS_BY_INGREDIENT[ik] || []).filter((n) => BRAND_PROFILES[n.toLowerCase()])
          return (
            <div key={ik} className="rounded border border-slate-200 p-3 text-xs">
              <div className="font-semibold text-slate-900">{label}</div>
              <ul className="mt-1 space-y-0.5 text-slate-700">
                {sigs.map((s) => (
                  <li key={s.id}>• <strong>{s.headline}</strong> — {s.reason}</li>
                ))}
              </ul>
              {brands.length > 0 && (
                <div className="mt-2 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Curated brand options: </span>
                  {brands.join(' · ')}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] italic text-slate-500">
        Product data referenced from the NIH Dietary Supplement Label Database (DSLD). No affiliate revenue. Talk with a licensed clinician before making changes.
      </div>
    </section>
  )
}
