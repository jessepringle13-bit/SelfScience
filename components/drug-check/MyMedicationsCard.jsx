'use client'

// /app/components/drug-check/MyMedicationsCard.jsx
// Persistent "My Medications" list on the Drug Check page. Users type a
// medication name and add it — the tool then surfaces PGx-relevant flags
// aggregated across every med in the list.

import { useMemo, useState } from 'react'
import { Pill, Plus, X, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { medicationsStore } from '@/lib/lists'
import { useListStore } from '@/lib/lists/store'
import { getPgxPlainEnglish } from '@/lib/pgxPlainEnglish'

export default function MyMedicationsCard({ drugCatalog, phenotypes, onSelectDrug }) {
  const [items] = useListStore(medicationsStore)
  const [input, setInput] = useState('')

  // Suggestions from the drug catalog for autocomplete.
  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase()
    if (q.length < 2) return []
    return (drugCatalog || [])
      .filter((d) => !d.isHarmReduction)
      .filter((d) =>
        d.generic.toLowerCase().includes(q) ||
        (d.brands || []).some((b) => b.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [input, drugCatalog])

  const addCatalogDrug = (d) => {
    if (medicationsStore.findBy((i) => i.drugId === d.id)) { setInput(''); return }
    medicationsStore.add({
      drugId: d.id,
      name: d.generic,
      primaryGene: d.primaryGene || null,
      extraGenes: d.extraGenes || [],
    })
    setInput('')
  }

  const addFreeText = () => {
    const q = input.trim()
    if (!q) return
    // Try to match against catalog first
    const hit = (drugCatalog || []).find((d) =>
      d.generic.toLowerCase() === q.toLowerCase() ||
      (d.brands || []).some((b) => b.toLowerCase() === q.toLowerCase())
    )
    if (hit) return addCatalogDrug(hit)
    medicationsStore.add({ name: q })
    setInput('')
  }

  // Aggregate PGx flags across all meds in the list.
  const flags = useMemo(() => {
    if (!phenotypes) return []
    const seen = new Set()
    const out = []
    for (const item of items) {
      const gene = item.primaryGene
      if (!gene) continue
      const ph = phenotypes[gene]
      if (!ph) continue
      const { severity, impact } = getPgxPlainEnglish(gene, ph)
      if (severity === 'normal') continue
      const key = `${item.name}:${gene}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ med: item.name, gene, phenotype: ph.label, severity, impact })
    }
    return out
  }, [items, phenotypes])

  const criticalCount = flags.filter((f) => f.severity === 'critical').length
  const intermCount   = flags.filter((f) => f.severity === 'intermediate').length

  return (
    <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
            <Pill size={15} />
          </span>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
              My medications
            </div>
            <div className="text-[11px] text-ss-muted">Stored locally on this device</div>
          </div>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => medicationsStore.clear()}
            className="min-h-9 rounded-full px-2 py-1 text-[11px] font-semibold text-ss-muted hover:text-ss-red"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Input row */}
      <div className="relative mt-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ss-muted" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addFreeText() }}
              placeholder="Add a medication (e.g. clopidogrel, warfarin)"
              className="h-11 w-full rounded-full border border-ss-border-warm bg-white pl-8 pr-3 text-sm outline-none focus:border-ss-teal"
            />
          </div>
          <button
            type="button"
            onClick={addFreeText}
            disabled={!input.trim()}
            className="inline-flex min-h-11 items-center gap-1 rounded-full bg-ss-teal px-4 text-[13px] font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-40"
          >
            <Plus size={13} /> Add
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-ss-border-warm bg-white shadow-lg">
            {suggestions.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => addCatalogDrug(d)}
                className="flex w-full items-center justify-between gap-2 border-b border-ss-border-warm/40 px-3 py-2 text-left text-[13px] hover:bg-ss-bg last:border-none"
              >
                <span className="font-semibold text-ss-text">{d.generic}</span>
                {d.primaryGene && (
                  <span className="rounded-full bg-ss-teal/10 px-1.5 py-0.5 text-[10px] font-bold text-ss-teal">
                    {d.primaryGene}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <p className="mt-3 rounded-lg bg-ss-bg/60 p-3 text-[11.5px] italic text-ss-muted">
          Add each medication you take. The tool will flag any PGx concerns across your entire list at once — and cross-check any supplements you add to your stack.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.map((it) => {
            const gene = it.primaryGene
            const ph = gene && phenotypes ? phenotypes[gene] : null
            const { severity } = ph ? getPgxPlainEnglish(gene, ph) : { severity: null }
            const chip =
              severity === 'critical'     ? 'bg-ss-orange/15 text-ss-orange' :
              severity === 'intermediate' ? 'bg-ss-amber/15 text-ss-amber'   :
              severity === 'normal'       ? 'bg-ss-green/15 text-ss-green'   :
                                            'bg-slate-100 text-slate-500'
            return (
              <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg border border-ss-border-warm/40 bg-ss-bg/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => it.drugId && onSelectDrug?.(it)}
                    className="text-left text-[13px] font-semibold text-ss-text hover:text-ss-teal"
                  >
                    {it.name}
                  </button>
                  {gene && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${chip}`}>
                      {gene}{ph ? ` · ${ph.phenotype}` : ''}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => medicationsStore.remove(it.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-white hover:text-ss-red"
                  aria-label={`Remove ${it.name}`}
                >
                  <X size={13} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Aggregate flag summary */}
      {items.length > 0 && phenotypes && (
        <div className="mt-3 rounded-lg border border-ss-border-warm/50 bg-ss-bg/40 p-3">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.14em]">
            <span className="text-ss-teal">PGx summary across your list</span>
            <span className="flex items-center gap-2 text-ss-muted">
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-ss-orange/15 px-1.5 py-0.5 text-ss-orange">
                  <AlertTriangle size={9} /> {criticalCount}
                </span>
              )}
              {intermCount > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-ss-amber/15 px-1.5 py-0.5 text-ss-amber">
                  <AlertTriangle size={9} /> {intermCount}
                </span>
              )}
              {flags.length === 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-ss-green/15 px-1.5 py-0.5 text-ss-green">
                  <CheckCircle2 size={9} /> All standard
                </span>
              )}
            </span>
          </div>
          {flags.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-[11.5px] leading-snug text-ss-text">
              {flags.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: f.severity === 'critical' ? '#C45820' : '#B45309' }}
                  />
                  <span>
                    <span className="font-semibold">{f.med}:</span>{' '}
                    <code className="rounded bg-white px-1 text-[10px] text-ss-teal">{f.gene}</code>{' '}
                    <span className="text-ss-muted">{f.phenotype}</span>
                    {f.impact && <span className="block text-[11px] text-ss-muted">{f.impact}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-2 text-[10px] italic text-ss-muted">
        For educational purposes only. Not a substitute for professional medical advice.
      </p>
    </div>
  )
}
