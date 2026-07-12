'use client'

// /app/app/nutrition/nutrition-client.jsx
// SelfScience — Nutrition Hub (three tabs: Your Foods, Food Journal, Scanner)
// All three read from the same sessionStorage genome. Food journal is
// stored client-side in localStorage; scanner talks to /api/nutrition/product
// which proxies Open Food Facts.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Apple,
  Utensils,
  ScanLine,
  Camera,
  Search,
  Plus,
  Trash2,
  ShieldAlert,
  Info,
  Sparkles,
  Clock,
  Coffee,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import PgxDisclaimer from '@/components/PgxDisclaimer'
import BarcodeScanner from '@/components/BarcodeScanner'
import { getGenomeResults } from '@/lib/genomeSession'
import {
  getActiveNutritionRules,
  scanIngredients,
  gradeCompatibility,
  gradeToLabel,
  extractGenotypesFromReport,
  NUTRITION_DISCLAIMER,
  SCANNER_DISCLAIMER,
  ALLERGEN_DISCLAIMER,
} from '@/lib/nutritionGenomics'
import {
  scanUniversalFlags,
  scanBeneficial,
  lookupIngredient,
  INGREDIENT_DICTIONARY,
} from '@/lib/ingredientDictionary'
import { getAlternatives } from '@/lib/productAlternatives'

const LOG_KEY = 'selfscience_food_log_v1'

const PRIORITY_META = {
  critical: { label: 'Critical', chip: 'bg-red-100 text-red-800 border-red-300' },
  high:     { label: 'High',     chip: 'bg-ss-orange/15 text-ss-orange border-ss-orange/40' },
  moderate: { label: 'Moderate', chip: 'bg-ss-amber/15 text-ss-amber border-ss-amber/40' },
  low:      { label: 'Low',      chip: 'bg-ss-teal/10 text-ss-teal border-ss-teal/30' },
}

const SEVERITY_STYLES = {
  high:     'bg-ss-orange/15 text-ss-orange border-ss-orange/40',
  moderate: 'bg-ss-amber/15 text-ss-amber border-ss-amber/40',
  low:      'bg-ss-muted/20 text-ss-muted border-ss-muted/30',
}

const GRADE_STYLES = {
  A: { bg: 'bg-ss-green', desc: 'Excellent — no flags for your genomic profile.' },
  B: { bg: 'bg-ss-teal',  desc: 'Generally OK — a few low-severity notes.' },
  C: { bg: 'bg-ss-amber', desc: 'Moderate flags — use occasionally.' },
  D: { bg: 'bg-ss-orange', desc: 'Multiple or high-severity flags — consider alternatives.' },
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function NutritionClient() {
  const [report, setReport] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('foods')

  useEffect(() => {
    setReport(getGenomeResults())
    setReady(true)
    const onChange = () => setReport(getGenomeResults())
    window.addEventListener('selfscience:genome-changed', onChange)
    return () => window.removeEventListener('selfscience:genome-changed', onChange)
  }, [])

  const { rsidGenotypes, haplotypeResults } = useMemo(
    () => extractGenotypesFromReport(report),
    [report]
  )
  const activeRules = useMemo(
    () => getActiveNutritionRules(rsidGenotypes, haplotypeResults),
    [rsidGenotypes, haplotypeResults]
  )

  return (
    <div className="min-h-screen bg-ss-bg">
      <SiteNav />

      <div className="container pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">
              <Apple size={14} /> Nutrition Hub
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
              Genomic nutrition, cross-referenced to your variants.
            </h1>
            <p className="mt-2 max-w-2xl text-ss-muted">
              Food recommendations, a daily journal, and a product scanner that reads ingredient labels through the lens of your specific genotype.
            </p>
          </div>
        </div>

        {/* Top disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border-l-4 border-ss-amber bg-ss-amber/10 p-4">
          <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-ss-amber" />
          <p className="text-sm text-ss-text">
            <span className="font-semibold">Educational only.</span>{' '}
            {NUTRITION_DISCLAIMER}
          </p>
        </div>

        {/* No-genome prompt */}
        {ready && !report && (
          <div className="mt-6 rounded-2xl border border-dashed border-ss-border-warm bg-white/60 p-6 text-center">
            <p className="text-sm font-semibold text-ss-teal">Upload your genome to get personalized nutrition analysis</p>
            <p className="mt-1 text-xs text-ss-muted">All three tools still work without genome data — they will show population-average guidance instead of personalized.</p>
            <Link href="/genome" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
              Upload genome <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Tab bar */}
        <div className="mt-8 flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-ss-border-warm/60 sm:w-fit">
          <TabButton active={tab === 'foods'}   onClick={() => setTab('foods')}   Icon={Apple}     label="Your Foods" />
          <TabButton active={tab === 'journal'} onClick={() => setTab('journal')} Icon={Utensils}  label="Food Journal" />
          <TabButton active={tab === 'scanner'} onClick={() => setTab('scanner')} Icon={ScanLine}  label="Scanner" />
        </div>

        <div className="mt-8">
          {tab === 'foods'   && <YourFoodsTab activeRules={activeRules} hasGenome={!!report} />}
          {tab === 'journal' && <FoodJournalTab activeRules={activeRules} hasGenome={!!report} />}
          {tab === 'scanner' && <ScannerTab activeRules={activeRules} hasGenome={!!report} />}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-ss-teal text-white shadow' : 'text-ss-teal hover:bg-ss-bg'
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// TAB 1 — YOUR FOODS
// ---------------------------------------------------------------------------
function YourFoodsTab({ activeRules, hasGenome }) {
  const showPgx = activeRules.some((r) => r.pillar === 'Pharmacogenomics')

  return (
    <div className="space-y-8">
      {showPgx && <PgxDisclaimer />}

      {!hasGenome && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
          <p className="text-sm text-ss-text">
            No genome uploaded yet. Below are population-average nutrition principles anyone can benefit from. Upload your genome to see recommendations tailored to your specific variants.
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-ss-text sm:grid-cols-2">
            <li>• Prioritize whole foods and minimize ultra-processed items.</li>
            <li>• Include colorful vegetables at every meal for micronutrient density.</li>
            <li>• Choose fatty fish over ALA plant sources when possible.</li>
            <li>• Consider natural folate (leafy greens, liver) over synthetic folic acid supplements.</li>
            <li>• Avoid caffeine after noon if sleep quality is uncertain.</li>
            <li>• Aim for last meal 3+ hours before sleep.</li>
          </ul>
        </div>
      )}

      {hasGenome && activeRules.length === 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
          <p className="text-sm text-ss-text">
            Your uploaded genome did not trigger any specific nutrition-genomics rules. This means the variants we screen for (MTHFR, BCMO1, FADS, LCT, CYP1A2, PPARA, MTNR1B, COL5A1/MMP1, NOD2/FUT2, TCF7L2) all landed in the population-average range for you.
          </p>
        </div>
      )}

      {hasGenome && activeRules.length > 0 && (
        <>
          <DietMatchCard activeRules={activeRules} />
          <AllergenAwarenessCard activeRules={activeRules} />
          <div className="space-y-6">
            {activeRules.map((rule) => (
              <NutritionRuleCard key={rule.key} rule={rule} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NutritionRuleCard({ rule }) {
  const [expanded, setExpanded] = useState(false)
  const meta = PRIORITY_META[rule.priority] || PRIORITY_META.low

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ss-border-warm/60">
      <header className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-ss-teal">{rule.title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.chip}`}>
              {meta.label} priority
            </span>
            <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ss-teal">
              {rule.pillar}
            </span>
          </div>
          {rule.educational_note && (
            <p className="mt-2 max-w-3xl text-sm text-ss-muted">{rule.educational_note}</p>
          )}
        </div>
      </header>

      <div className="border-t border-ss-border-warm/60 bg-ss-surface px-6 py-5">
        {rule.prioritize_foods?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-green">
              <Sparkles size={13} /> Prioritize
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {rule.prioritize_foods.slice(0, expanded ? 999 : 6).map((f, i) => (
                <FoodTile key={i} food={f} tone="good" />
              ))}
            </div>
            {rule.prioritize_foods.length > 6 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline"
              >
                {expanded ? <><ChevronUp size={13} /> Show fewer</> : <><ChevronDown size={13} /> Show all {rule.prioritize_foods.length}</>}
              </button>
            )}
          </div>
        )}

        {rule.avoid_foods?.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-orange">
              <AlertTriangle size={13} /> Consider limiting
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {rule.avoid_foods.map((f, i) => (
                <FoodTile key={i} food={f} tone="warn" />
              ))}
            </div>
          </div>
        )}

        {rule.limit_foods?.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-amber">
              <Info size={13} /> Use with awareness
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {rule.limit_foods.map((f, i) => (
                <FoodTile key={i} food={f} tone="caution" />
              ))}
            </div>
          </div>
        )}

        {rule.tolerated_foods?.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-teal">
              <CheckCircle2 size={13} /> Usually tolerated
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {rule.tolerated_foods.map((f, i) => (
                <FoodTile key={i} food={f} tone="good" />
              ))}
            </div>
          </div>
        )}

        {rule.timing_rules?.length > 0 && (
          <div className="mt-6 rounded-xl bg-ss-teal/95 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70">
              <Clock size={13} /> Timing rules
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {rule.timing_rules.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/70" />
                  <span>{t.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}

function FoodTile({ food, tone }) {
  const border = tone === 'good' ? 'border-l-4 border-ss-green' : tone === 'warn' ? 'border-l-4 border-ss-orange' : 'border-l-4 border-ss-amber'
  return (
    <div className={`rounded-lg bg-white p-3 shadow-sm ring-1 ring-ss-border-warm/40 ${border}`}>
      <div className="text-sm font-bold text-ss-teal">{food.food}</div>
      <p className="mt-1 text-xs leading-relaxed text-ss-muted">{food.reason}</p>
      {(food.daily_target || food.weekly_target) && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ss-teal">
          {food.daily_target ? `Daily: ${food.daily_target}` : `Weekly: ${food.weekly_target}`}
        </div>
      )}
      {food.timing && (
        <div className="mt-1 text-[10px] font-semibold text-ss-orange">○ {food.timing}</div>
      )}
      {food.notes && (
        <div className="mt-1 text-[10px] italic text-ss-muted">{food.notes}</div>
      )}
      {Array.isArray(food.nutrients) && food.nutrients.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {food.nutrients.slice(0, 5).map((n, i) => (
            <span key={i} className="rounded-full bg-ss-bg px-2 py-0.5 text-[10px] font-semibold text-ss-teal ring-1 ring-ss-border-warm/50">{n}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB 1b — Diet Match + Allergen Awareness sections (also on Your Foods)
// ---------------------------------------------------------------------------
function DietMatchCard({ activeRules }) {
  const keys = new Set(activeRules.map((r) => r.key))
  const matches = []
  if (keys.has('ppara_enhanced')) matches.push('Low-carb / ketogenic / fat-adapted patterns are well-supported by your variant profile.')
  if (keys.has('mtnr1b_risk')) matches.push('Time-restricted eating (eating window closed before 6:30 PM) is the highest-impact dietary pattern for your metabolic variants.')
  if (keys.has('fads_reduced') || keys.has('bcmo1_reduced')) matches.push('Animal-source nutrient emphasis — preformed vitamin A, direct EPA/DHA, liver and organ meats — bypasses conversion steps your variants perform less efficiently.')
  if (keys.has('mthfr_compound_het')) matches.push('Whole-food folate emphasis — minimize US-fortified grain products with synthetic folic acid.')
  if (keys.has('tcf7l2_risk')) matches.push('Meal composition matters more than macros: pair carbs with fiber, fat, and protein to blunt post-meal glucose spikes.')

  if (matches.length === 0) return null

  return (
    <div className="rounded-2xl border-l-4 border-ss-teal bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-teal">
        <Sparkles size={14} /> Your Genomic Diet Profile
      </div>
      <ul className="mt-4 space-y-2 text-sm text-ss-text">
        {matches.map((m, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ss-orange" />
            <span>{m}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AllergenAwarenessCard({ activeRules }) {
  const items = []
  const keys = new Set(activeRules.map((r) => r.key))
  if (keys.has('lct_intolerant')) items.push({ label: 'Lactose (LCT non-persistence)', note: 'Research strongly associates GG at rs4988235 with lactose intolerance. Hard aged cheeses, fermented dairy, or lactose-free versions are typically better tolerated.' })
  if (keys.has('mthfr_compound_het')) items.push({ label: 'Synthetic folic acid / US-fortified wheat', note: 'Not a celiac indicator. Research associates MTHFR impairment with reduced ability to metabolize synthetic folic acid used in US wheat fortification.' })
  if (keys.has('gut_support')) items.push({ label: 'Common emulsifiers (carrageenan, polysorbate 80)', note: 'Research associates these additives with gut barrier disruption — relevant given your gut variant profile.' })
  if (items.length === 0) return null

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-orange">
        <AlertTriangle size={14} /> Research-Associated Sensitivities
      </div>
      <div className="mt-4 space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border-l-4 border-ss-orange bg-ss-orange/5 p-3">
            <div className="text-sm font-bold text-ss-teal">{it.label}</div>
            <p className="mt-1 text-xs text-ss-text">{it.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] italic text-ss-muted">{ALLERGEN_DISCLAIMER}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB 2 — FOOD JOURNAL
// ---------------------------------------------------------------------------
function FoodJournalTab({ activeRules, hasGenome }) {
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [ready, setReady] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [searchingProduct, setSearchingProduct] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOG_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch { /* noop */ }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(LOG_KEY, JSON.stringify(entries)) } catch { /* noop */ }
  }, [entries, ready])

  const todayKey = new Date().toDateString()
  const today = entries.filter((e) => new Date(e.at).toDateString() === todayKey)

  const addEntry = useCallback((entry) => {
    const e = { id: crypto.randomUUID?.() || String(Math.random()), at: Date.now(), ...entry }
    setEntries((prev) => [e, ...prev])
  }, [])

  const analyzeFoodName = (foodName) => {
    const text = foodName.toLowerCase()
    return scanIngredients(text, activeRules)
  }

  const handleAddManual = () => {
    if (!name.trim()) return
    const { flags } = analyzeFoodName(name)
    addEntry({ name: name.trim(), flags, source: 'manual' })
    setName('')
  }

  const handleBarcode = async (code) => {
    setShowScanner(false)
    setSearchingProduct(true)
    try {
      const res = await fetch(`/api/nutrition/product?barcode=${encodeURIComponent(code)}`)
      if (res.ok) {
        const { product } = await res.json()
        if (product) {
          const { flags } = scanIngredients(`${product.name} ${product.ingredients_text}`, activeRules)
          addEntry({ name: `${product.brand ? product.brand + ' — ' : ''}${product.name}`, flags, source: 'barcode', barcode: code, image: product.image })
        } else {
          addEntry({ name: `Barcode ${code}`, flags: [], source: 'barcode_notfound', barcode: code })
        }
      } else {
        addEntry({ name: `Barcode ${code}`, flags: [], source: 'barcode_notfound', barcode: code })
      }
    } catch {
      addEntry({ name: `Barcode ${code}`, flags: [], source: 'barcode_error', barcode: code })
    } finally {
      setSearchingProduct(false)
    }
  }

  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id))
  const clearAll = () => {
    if (confirm('Clear entire food journal? This cannot be undone.')) setEntries([])
  }

  const summary = useMemo(() => summarizeDay(today, activeRules), [today, activeRules])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,360px]">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ss-teal">Today — {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
          {entries.length > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm bg-white px-3 py-1 text-xs font-semibold text-ss-muted hover:bg-ss-bg">
              <Trash2 size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Add entry row */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddManual() }}
            placeholder="e.g. Greek yogurt with strawberries"
            className="flex-1 rounded-full border border-ss-border-warm bg-ss-bg px-4 py-2 text-sm focus:border-ss-teal focus:outline-none"
          />
          <button
            onClick={handleAddManual}
            className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            <Plus size={14} /> Add
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="inline-flex items-center gap-1 rounded-full border border-ss-teal bg-white px-3 py-2 text-sm font-semibold text-ss-teal hover:bg-ss-bg"
          >
            <Camera size={14} /> Scan barcode
          </button>
        </div>

        {searchingProduct && (
          <div className="mt-3 flex items-center gap-2 text-sm text-ss-muted">
            <Loader2 size={14} className="animate-spin" /> Looking up product…
          </div>
        )}

        {/* Today's entries */}
        <div className="mt-4 space-y-3">
          {today.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ss-border-warm p-6 text-center text-sm text-ss-muted">
              No entries yet. Type a food name or scan a product to start today’s log.
            </div>
          )}
          {today.map((entry) => (
            <JournalEntry key={entry.id} entry={entry} onRemove={() => removeEntry(entry.id)} />
          ))}
        </div>
      </section>

      {/* Sidebar summary */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ss-teal">Today’s alignment</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold text-white shadow ${GRADE_STYLES[summary.grade].bg}`}>{summary.grade}</div>
            <div>
              <div className="text-xs text-ss-muted">Genomic alignment</div>
              <div className="text-sm font-semibold text-ss-text">{GRADE_STYLES[summary.grade].desc}</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-ss-muted">
            {today.length} entries · {summary.totalFlags} flags
          </div>
        </div>

        {summary.caffeineTotal > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-orange"><Coffee size={13} /> Caffeine tracker</div>
            <div className="mt-2 text-2xl font-extrabold text-ss-teal">~{summary.caffeineTotal} mg</div>
            <div className="text-xs text-ss-muted">Estimated from logged items{summary.slowMetabolizer ? ' · CYP1A2 slow — 200 mg ceiling' : ''}</div>
          </div>
        )}

        {summary.timingIssues.length > 0 && (
          <div className="rounded-2xl border-l-4 border-ss-orange bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-orange"><Clock size={13} /> Timing notes</div>
            <ul className="mt-2 space-y-1 text-xs text-ss-text">
              {summary.timingIssues.map((t, i) => <li key={i}>• {t}</li>)}
            </ul>
          </div>
        )}

        {summary.nutrientGaps.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
            <div className="text-xs font-bold uppercase tracking-wider text-ss-teal">Suggested additions</div>
            <ul className="mt-2 space-y-1 text-xs text-ss-text">
              {summary.nutrientGaps.map((g, i) => <li key={i}>• {g}</li>)}
            </ul>
          </div>
        )}

        <p className="text-[11px] italic text-ss-muted">{NUTRITION_DISCLAIMER}</p>
      </aside>

      {showScanner && (
        <BarcodeScanner onScan={handleBarcode} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}

function JournalEntry({ entry, onRemove }) {
  const time = new Date(entry.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const isLate = new Date(entry.at).getHours() >= 18 && (new Date(entry.at).getHours() > 18 || new Date(entry.at).getMinutes() > 30)
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-ss-teal">{entry.name}</div>
          <div className="mt-0.5 text-[11px] text-ss-muted">{time}{entry.source === 'barcode' ? ' · Scanned' : ''}</div>
        </div>
        <button onClick={onRemove} className="text-ss-muted hover:text-ss-orange" aria-label="Remove entry">
          <Trash2 size={14} />
        </button>
      </div>
      {entry.flags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.flags.map((f, i) => (
            <span key={i} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.low}`} title={f.flag}>
              {f.ingredient} · {f.rule_title}
            </span>
          ))}
        </div>
      )}
      {isLate && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-ss-orange/15 px-2 py-0.5 text-[10px] font-semibold text-ss-orange">
          <Clock size={11} /> After 6:30 PM
        </div>
      )}
    </div>
  )
}

function summarizeDay(entries, activeRules) {
  const activeKeys = new Set(activeRules.map((r) => r.key))
  const slowMetabolizer = activeKeys.has('cyp1a2_slow')
  const totalFlags = entries.reduce((n, e) => n + (e.flags?.length || 0), 0)

  // Grade: A if no flags, else scale by flag density.
  let grade = 'A'
  const highCount = entries.reduce((n, e) => n + (e.flags?.filter((f) => f.severity === 'high').length || 0), 0)
  const modCount = entries.reduce((n, e) => n + (e.flags?.filter((f) => f.severity === 'moderate').length || 0), 0)
  if (highCount >= 2) grade = 'D'
  else if (highCount === 1) grade = 'C'
  else if (modCount >= 3) grade = 'C'
  else if (modCount >= 1 || totalFlags > 0) grade = 'B'

  // Caffeine estimation — crude keyword match on entry names.
  let caffeineTotal = 0
  for (const e of entries) {
    const n = e.name?.toLowerCase() || ''
    if (/\bespresso\b/.test(n)) caffeineTotal += 75
    else if (/\bcold ?brew\b/.test(n)) caffeineTotal += 155
    else if (/\bcoffee\b|\blatte\b|\bcappuccino\b|\bamericano\b/.test(n)) caffeineTotal += 95
    else if (/\bmatcha\b/.test(n)) caffeineTotal += 50
    else if (/\bgreen tea\b/.test(n)) caffeineTotal += 40
    else if (/\bblack tea\b/.test(n)) caffeineTotal += 45
    else if (/\benergy drink\b|\bred bull\b|\bmonster\b|\bcelsius\b/.test(n)) caffeineTotal += 160
    else if (/\bcaffeine\b/.test(n)) caffeineTotal += 100
  }

  const timingIssues = []
  const lateEntries = entries.filter((e) => {
    const d = new Date(e.at)
    return d.getHours() > 18 || (d.getHours() === 18 && d.getMinutes() > 30)
  })
  if (activeKeys.has('mtnr1b_risk') && lateEntries.length > 0) {
    timingIssues.push(`${lateEntries.length} entr${lateEntries.length === 1 ? 'y' : 'ies'} after 6:30 PM — MTNR1B GG melatonin-insulin window.`)
  }
  if (slowMetabolizer && caffeineTotal > 200) {
    timingIssues.push(`Estimated caffeine (${caffeineTotal}mg) exceeds the 200mg CYP1A2 slow-metabolizer ceiling.`)
  }
  if (slowMetabolizer && entries.some((e) => {
    const d = new Date(e.at); const late = d.getHours() >= 12
    return late && /\bcoffee\b|\bespresso\b|\bcaffeine\b|\benergy\b/.test(e.name?.toLowerCase() || '')
  })) {
    timingIssues.push('Caffeine logged after noon — CYP1A2 slow half-life is 6–10 hours.')
  }

  const nutrientGaps = []
  const namesText = entries.map((e) => e.name?.toLowerCase() || '').join(' ')
  if (activeKeys.has('mthfr_compound_het') && !/(spinach|liver|asparagus|arugula|lentil|avocado|folate|beet)/.test(namesText)) {
    nutrientGaps.push('No natural folate sources logged — MTHFR variant needs whole-food folate.')
  }
  if (activeKeys.has('fads_reduced') && !/(salmon|sardine|mackerel|herring|anchov|oyster|algae|fish oil)/.test(namesText)) {
    nutrientGaps.push('No direct EPA/DHA sources logged — FADS variant benefits from marine omega-3.')
  }
  if (activeKeys.has('bcmo1_reduced') && !/(liver|salmon|egg|butter|cod liver|whole milk)/.test(namesText)) {
    nutrientGaps.push('No preformed vitamin A sources logged — BCMO1 variant converts beta-carotene less efficiently.')
  }
  if (activeKeys.has('connective_tissue_support') && !/(bell pepper|kiwi|citrus|orange|lemon|berr|vitamin c|bone broth)/.test(namesText)) {
    nutrientGaps.push('No vitamin C sources logged — required for collagen synthesis given your connective tissue variants.')
  }

  return { grade, totalFlags, caffeineTotal, slowMetabolizer, timingIssues, nutrientGaps }
}

// ---------------------------------------------------------------------------
// TAB 3 — SCANNER (multi-product search + universal-quality analysis)
// ---------------------------------------------------------------------------
const QUICK_CATEGORIES = [
  { key: 'protein-bars',   label: 'Protein Bars' },
  { key: 'protein-powder', label: 'Protein Powder' },
  { key: 'teas',           label: 'Teas' },
  { key: 'cereals',        label: 'Cereals' },
  { key: 'chips',          label: 'Chips' },
  { key: 'yogurt',         label: 'Yogurt' },
  { key: 'bread',          label: 'Bread' },
  { key: 'oils',           label: 'Oils' },
]

function ScannerTab({ activeRules, hasGenome }) {
  const [showScanner, setShowScanner] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [openIngredient, setOpenIngredient] = useState(null)
  // Filter state
  const [minGrade, setMinGrade] = useState('all')   // all | ab | not_d
  const [onlyOrganic, setOnlyOrganic] = useState(false)
  const [hideSeedOils, setHideSeedOils] = useState(false)
  const [hideArtSweetener, setHideArtSweetener] = useState(false)

  const [lastSearch, setLastSearch] = useState(null) // { barcode?, q?, category? }

  const runSearch = async (params) => {
    const { barcode, q, category } = params
    setLastSearch(params)
    setLoading(true)
    setError(null)
    setProducts([])
    setSelectedProduct(null)
    try {
      let url
      if (barcode) url = `/api/nutrition/product?barcode=${encodeURIComponent(barcode)}`
      else if (category) url = `/api/nutrition/product?category=${encodeURIComponent(category)}`
      else url = `/api/nutrition/product?query=${encodeURIComponent(q)}`
      const res = await fetch(url)
      if (!res.ok) { setError(res.status === 404 ? 'Product not found in Open Food Facts.' : 'Lookup failed.'); return }
      const data = await res.json()
      if (data.product) { setProducts([data.product]); setSelectedProduct(data.product) }
      else if (data.products?.length) setProducts(data.products)
      else setError('No results. Open Food Facts sometimes returns empty on the first request — click Try again below.')
    } catch { setError('Network error — try again.') }
    finally { setLoading(false) }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = analyzeProduct(p, activeRules)
      if (minGrade === 'ab' && !['A', 'B'].includes(q.universal.grade)) return false
      if (minGrade === 'not_d' && q.universal.grade === 'D') return false
      if (onlyOrganic && !q.universal.positives.some((x) => /organic/.test(x.ingredient))) return false
      if (hideSeedOils && q.universal.flags.some((f) => f.category === 'seed_oil')) return false
      if (hideArtSweetener && q.universal.flags.some((f) => f.category === 'sweetener' && /sucralose|aspartame|acesulfame|saccharin/.test(f.ingredient))) return false
      return true
    })
  }, [products, activeRules, minGrade, onlyOrganic, hideSeedOils, hideArtSweetener])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,340px]">
      <section>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
          <h2 className="text-lg font-bold text-ss-teal">Scan a product</h2>
          <p className="mt-1 text-sm text-ss-muted">Point your camera at a barcode, type a product / brand / UPC, or browse a category.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setShowScanner(true)} className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-ss-orange-dark">
              <Camera size={15} /> Scan barcode
            </button>
            <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-full border border-ss-border-warm bg-ss-bg px-3">
              <Search size={14} className="text-ss-muted" />
              <input
                type="text" value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) runSearch({ q: query.trim() }) }}
                placeholder="Brand, product name, or UPC"
                className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
              />
              <button onClick={() => { if (query.trim()) runSearch({ q: query.trim() }) }} disabled={!query.trim() || loading} className="rounded-full bg-ss-teal px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">Search</button>
            </div>
          </div>

          {/* Category quick-browse */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold text-ss-muted">Browse:</span>
            {QUICK_CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => runSearch({ category: c.key })} className="rounded-full border border-ss-border-warm bg-white px-2.5 py-1 font-semibold text-ss-teal hover:bg-ss-bg">{c.label}</button>
            ))}
          </div>

          {loading && <div className="mt-4 flex items-center gap-2 text-sm text-ss-muted"><Loader2 size={14} className="animate-spin" /> Fetching from Open Food Facts…</div>}
          {error && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ss-orange/10 p-3 text-sm text-ss-orange">
              <span>{error}</span>
              {lastSearch && (
                <button
                  onClick={() => runSearch(lastSearch)}
                  className="rounded-full bg-ss-orange px-3 py-1 text-xs font-semibold text-white hover:brightness-110"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter bar + result grid */}
        {products.length > 0 && !selectedProduct && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-ss-muted">Filter:</span>
              <select value={minGrade} onChange={(e) => setMinGrade(e.target.value)} className="rounded-full border border-ss-border-warm bg-white px-3 py-1 font-semibold text-ss-teal">
                <option value="all">All grades</option>
                <option value="ab">A &amp; B only</option>
                <option value="not_d">Hide D</option>
              </select>
              <label className="inline-flex items-center gap-1 font-semibold text-ss-teal"><input type="checkbox" checked={onlyOrganic}     onChange={(e) => setOnlyOrganic(e.target.checked)}     /> Organic only</label>
              <label className="inline-flex items-center gap-1 font-semibold text-ss-teal"><input type="checkbox" checked={hideSeedOils}    onChange={(e) => setHideSeedOils(e.target.checked)}    /> No seed oils</label>
              <label className="inline-flex items-center gap-1 font-semibold text-ss-teal"><input type="checkbox" checked={hideArtSweetener} onChange={(e) => setHideArtSweetener(e.target.checked)} /> No artificial sweeteners</label>
              <span className="ml-auto text-ss-muted">{filteredProducts.length} of {products.length} shown</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((p, i) => (
                <ProductGridCard key={p.barcode || i} product={p} activeRules={activeRules} onSelect={() => setSelectedProduct(p)} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-ss-border-warm p-6 text-center text-sm text-ss-muted">All products filtered out — loosen the filters above.</div>
              )}
            </div>
          </>
        )}

        {selectedProduct && (
          <div className="mt-6">
            <button onClick={() => setSelectedProduct(null)} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
              ← Back to results ({filteredProducts.length})
            </button>
            <ProductCard product={selectedProduct} activeRules={activeRules} hasGenome={hasGenome} onIngredientClick={setOpenIngredient} onSearchAlternative={(term) => { setQuery(term); runSearch({ q: term }) }} />
          </div>
        )}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-teal"><Info size={13} /> How this works</div>
          <p className="mt-2 text-xs text-ss-text">
            Every product is checked against TWO scoring layers:
          </p>
          <ol className="mt-2 space-y-1 text-xs text-ss-text">
            <li><b>Genomic fit</b> — flags against your active variants (MTHFR, LCT, CYP1A2 …)</li>
            <li><b>Universal quality</b> — seed oils, HFCS, emulsifiers, artificial colors, glyphosate-risk grains, ultra-processing (NOVA)</li>
          </ol>
          <p className="mt-2 text-xs text-ss-muted">Tap any ingredient in a product to see what it is and what the research says.</p>
        </div>
        <p className="text-[11px] italic text-ss-muted">{SCANNER_DISCLAIMER}</p>
      </aside>

      {showScanner && (
        <BarcodeScanner onScan={(code) => { setShowScanner(false); runSearch({ barcode: code }) }} onClose={() => setShowScanner(false)} />
      )}
      {openIngredient && (
        <IngredientDrawer name={openIngredient} onClose={() => setOpenIngredient(null)} />
      )}
    </div>
  )
}

// -------- Universal quality scoring helper --------
function analyzeProduct(product, activeRules) {
  const text = `${product?.name || ''} ${product?.ingredients_text || ''} ${(product?.additives || []).join(' ')} ${(product?.labels || []).join(' ')}`.toLowerCase()
  const universalFlags = scanUniversalFlags(text)
  const positives = scanBeneficial(text)
  // Universal grade: bucket by severity penalty count + NOVA group.
  const highN = universalFlags.filter((f) => f.severity === 'universal_avoid').length
  const modN  = universalFlags.filter((f) => f.severity === 'universal_limit').length
  const cauN  = universalFlags.filter((f) => f.severity === 'caution').length
  const posN  = positives.length + ((product?.labels || []).some((l) => /organic/.test(l)) ? 2 : 0)
  const nova = Number(product?.nova_group) || 0
  let penalty = highN * 3 + modN * 2 + cauN + (nova >= 4 ? 3 : nova === 3 ? 1 : 0)
  penalty -= Math.min(posN, 4) // bonus caps at 4
  let uGrade = 'A'
  if (penalty >= 7) uGrade = 'D'
  else if (penalty >= 4) uGrade = 'C'
  else if (penalty >= 1) uGrade = 'B'
  // Genomic scoring (existing)
  const { flags: gFlags, severityCounts } = scanIngredients(text, activeRules)
  const gGrade = gradeCompatibility(severityCounts)
  return {
    universal: { grade: uGrade, flags: universalFlags, positives, penalty, nova },
    genomic:   { grade: gGrade, flags: gFlags },
  }
}

// -------- Small compact card used in the result grid --------
function ProductGridCard({ product, activeRules, onSelect }) {
  const q = useMemo(() => analyzeProduct(product, activeRules), [product, activeRules])
  const n = product.nutriments
  const macros = `${n.protein_g_serving ?? n.protein_g ?? '–'}g P · ${n.carbs_g_serving ?? n.carbs_g ?? '–'}g C · ${n.fat_g_serving ?? n.fat_g ?? '–'}g F`
  const kcal = n.energy_kcal_serving ?? n.energy_kcal
  return (
    <button onClick={onSelect} className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-ss-border-warm/60 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-32 w-full overflow-hidden bg-ss-bg">
        {product.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center text-ss-muted"><Apple size={28} /></div>}
        <div className="absolute right-2 top-2 flex gap-1">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold text-white shadow ${GRADE_STYLES[q.universal.grade].bg}`} title={`Universal quality: ${q.universal.grade}`}>{q.universal.grade}</span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold text-white shadow ${GRADE_STYLES[q.genomic.grade].bg}`} title={`Genomic fit: ${q.genomic.grade}`}>{q.genomic.grade}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">{product.brand || 'Unknown brand'}</div>
        <div className="text-sm font-bold text-ss-teal line-clamp-2">{product.name}</div>
        <div className="mt-1 text-[11px] text-ss-text">{macros}{kcal ? ` · ${kcal} kcal` : ''}</div>
      </div>
    </button>
  )
}

// -------- Big detailed product card with two scores + ingredient chips --------
function ProductCard({ product, activeRules, hasGenome, onIngredientClick, onSearchAlternative }) {
  const q = useMemo(() => analyzeProduct(product, activeRules), [product, activeRules])
  const n = product.nutriments
  const perServing = n.protein_g_serving != null || n.energy_kcal_serving != null
  const macros = perServing
    ? `${n.protein_g_serving ?? '–'}g protein · ${n.carbs_g_serving ?? '–'}g carbs · ${n.fat_g_serving ?? '–'}g fat · ${n.energy_kcal_serving ?? '–'} kcal`
    : `${n.protein_g ?? '–'}g protein · ${n.carbs_g ?? '–'}g carbs · ${n.fat_g ?? '–'}g fat · ${n.energy_kcal ?? '–'} kcal`
  const alt = getAlternatives(product)
  const showAlternatives = (q.universal.grade === 'C' || q.universal.grade === 'D' || q.genomic.grade === 'C' || q.genomic.grade === 'D') && alt.items.length > 0

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ss-border-warm/60">
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-[128px,1fr]">
        {product.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={product.image} alt={product.name} className="h-32 w-32 rounded-lg object-cover ring-1 ring-ss-border-warm" />
          : <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-ss-bg text-ss-muted ring-1 ring-ss-border-warm"><Apple size={28} /></div>}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-ss-muted">{product.brand || 'Unknown brand'}</div>
          <h3 className="text-xl font-extrabold text-ss-teal">{product.name}</h3>
          {product.barcode && <div className="text-[11px] text-ss-muted">UPC/EAN {product.barcode}</div>}
          {product.serving_size && <div className="text-[11px] text-ss-muted">Serving: {product.serving_size}</div>}
        </div>
      </div>

      {/* Two score cards side by side */}
      <div className="grid grid-cols-1 gap-3 border-t border-ss-border-warm/60 bg-ss-surface p-6 md:grid-cols-2">
        <ScoreCard grade={q.genomic.grade}  title="Genomic fit"        subtitle={hasGenome ? `${q.genomic.flags.length} flag${q.genomic.flags.length === 1 ? '' : 's'} against your variants` : 'Upload genome for personalized score'} />
        <ScoreCard grade={q.universal.grade} title="Universal quality" subtitle={`${q.universal.flags.length} concerning ingredient${q.universal.flags.length === 1 ? '' : 's'}${q.universal.nova ? ` · NOVA ${q.universal.nova}` : ''}`} />
      </div>

      <div className="border-t border-ss-border-warm/60 bg-ss-surface px-6 py-5">
        {/* Macros */}
        <div className="text-xs font-bold uppercase tracking-wider text-ss-teal">{perServing ? 'Per serving' : 'Per 100g'}</div>
        <div className="mt-1 text-base font-semibold text-ss-text">{macros}</div>
        {(n.fiber_g != null || n.sodium_mg != null || n.sugars_g_serving != null || n.sugars_g != null) && (
          <div className="mt-1 text-xs text-ss-muted">
            {(n.sugars_g_serving ?? n.sugars_g) != null && <>Sugars {n.sugars_g_serving ?? n.sugars_g}g · </>}
            {n.fiber_g != null && <>Fiber {n.fiber_g}g · </>}
            {n.sodium_mg != null && <>Sodium {n.sodium_mg}mg</>}
          </div>
        )}
        {perServing && n.energy_kcal != null && (
          <div className="mt-1 text-[11px] text-ss-muted">Per 100g reference: {n.protein_g ?? '–'}g P · {n.carbs_g ?? '–'}g C · {n.fat_g ?? '–'}g F · {n.energy_kcal} kcal</div>
        )}

        {/* Genomic flags */}
        {q.genomic.flags.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-bold uppercase tracking-wider text-ss-orange">Genomic flags ({q.genomic.flags.length})</div>
            <ul className="mt-2 space-y-2">
              {q.genomic.flags.map((f, i) => (
                <li key={i} className={`rounded-lg border-l-4 p-3 ${SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.low}`}>
                  <button className="text-xs font-bold uppercase tracking-wider underline-offset-2 hover:underline" onClick={() => onIngredientClick(f.ingredient)}>
                    {f.ingredient}
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider"> · {f.rule_title}</span>
                  <p className="mt-1 text-xs text-ss-text">{f.flag}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Universal quality flags */}
        {q.universal.flags.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-bold uppercase tracking-wider text-ss-orange">Ingredients to know ({q.universal.flags.length})</div>
            <p className="mt-1 text-[11px] text-ss-muted">Tap any chip for a definition and research context.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {q.universal.flags.map((f, i) => {
                const cls = f.severity === 'universal_avoid'
                  ? 'bg-ss-orange text-white border-ss-orange'
                  : f.severity === 'universal_limit'
                    ? 'bg-ss-amber/20 text-ss-amber border-ss-amber/50'
                    : 'bg-ss-bg text-ss-muted border-ss-border-warm'
                return (
                  <button key={i} onClick={() => onIngredientClick(f.ingredient)} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition hover:opacity-80 ${cls}`}>
                    {f.ingredient}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Clean label positives */}
        {q.universal.positives.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-bold uppercase tracking-wider text-ss-green">Clean-label positives</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {q.universal.positives.map((p, i) => (
                <button key={i} onClick={() => onIngredientClick(p.ingredient)} className="rounded-full border border-ss-green bg-ss-green/15 px-2.5 py-1 text-[11px] font-semibold text-ss-green hover:bg-ss-green/25">
                  {p.ingredient}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full ingredient list — every word clickable */}
        {product.ingredients_text && (
          <details className="mt-5 rounded-lg bg-white p-3 ring-1 ring-ss-border-warm" open>
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-ss-teal">Full ingredient list</summary>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.ingredients_text.split(/[,;]/).map((rawStr, i) => {
                const raw = rawStr.trim().replace(/[()]/g, '').replace(/[.:]$/, '')
                if (!raw) return null
                const entry = lookupIngredient(raw)
                let cls = 'bg-ss-bg text-ss-muted border-ss-border-warm'
                if (entry?.severity === 'universal_avoid') cls = 'bg-ss-orange/20 text-ss-orange border-ss-orange/50 font-semibold'
                else if (entry?.severity === 'universal_limit') cls = 'bg-ss-amber/15 text-ss-amber border-ss-amber/40'
                else if (entry?.severity === 'caution') cls = 'bg-ss-bg text-ss-text border-ss-border-warm'
                else if (entry?.severity === 'beneficial') cls = 'bg-ss-green/15 text-ss-green border-ss-green/40 font-semibold'
                return (
                  <button key={i} onClick={() => onIngredientClick(raw)} className={`rounded-full border px-2 py-0.5 text-[11px] transition hover:opacity-80 ${cls}`}>{raw}</button>
                )
              })}
            </div>
          </details>
        )}

        {/* Better alternatives (grade C/D on either axis) */}
        {showAlternatives && (
          <div className="mt-6 rounded-2xl border-l-4 border-ss-teal bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ss-teal"><Sparkles size={14} /> Better options for your profile</div>
            <p className="mt-1 text-[11px] text-ss-muted">Curated cleaner alternatives in the same category ({alt.key.replace('-', ' ')}).</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {alt.items.slice(0, 6).map((a, i) => (
                <div key={i} className="rounded-lg bg-ss-bg p-3 ring-1 ring-ss-border-warm/40">
                  <div className="text-sm font-bold text-ss-teal">{a.name}</div>
                  <p className="mt-1 text-xs text-ss-text">{a.why}</p>
                  <button onClick={() => onSearchAlternative(a.search_term)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-ss-orange hover:underline">
                    Search this product <ArrowRight size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-[11px] italic text-ss-muted">{SCANNER_DISCLAIMER}</p>
      </div>
    </article>
  )
}

function ScoreCard({ grade, title, subtitle }) {
  const g = GRADE_STYLES[grade]
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ss-border-warm/60">
      <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow ${g.bg}`}>{grade}</div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-ss-muted">{title}</div>
        <div className="text-sm font-semibold text-ss-text">{subtitle}</div>
      </div>
    </div>
  )
}

// -------- Slide-over drawer with the ingredient definition --------
function IngredientDrawer({ name, onClose }) {
  const entry = useMemo(() => lookupIngredient(name), [name])
  const isKnown = !!entry
  const sevMeta = {
    universal_avoid: { label: 'High concern',  color: 'bg-ss-orange text-white' },
    universal_limit: { label: 'Limit / caution', color: 'bg-ss-amber text-white' },
    caution:         { label: 'Some concern', color: 'bg-ss-bg text-ss-text ring-1 ring-ss-border-warm' },
    beneficial:      { label: 'Beneficial',   color: 'bg-ss-green text-white' },
    neutral:         { label: 'Neutral',      color: 'bg-ss-bg text-ss-text ring-1 ring-ss-border-warm' },
  }
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-ss-border-warm px-6 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">Ingredient</div>
            <h3 className="text-lg font-extrabold text-ss-teal">{name}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-ss-muted hover:bg-ss-bg"><X size={16} /></button>
        </header>
        <div className="flex-1 space-y-4 p-6 text-sm text-ss-text">
          {!isKnown ? (
            <div className="rounded-lg bg-ss-bg p-4 text-xs text-ss-muted">
              <p><b>Not in our curated ingredient database yet.</b></p>
              <p className="mt-2">This ingredient isn&apos;t flagged as a universal red flag or clean-label positive. That usually means it&apos;s a whole-food, spice, or a specific brand-name that doesn&apos;t raise research concerns.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ss-teal">{entry.category?.replace('_', ' ')}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${sevMeta[entry.severity]?.color || sevMeta.neutral.color}`}>{sevMeta[entry.severity]?.label || 'Neutral'}</span>
              </div>
              <section>
                <div className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">What it is</div>
                <p className="mt-1 leading-relaxed">{entry.what_it_is}</p>
              </section>
              {entry.purpose && (
                <section>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ss-muted">Why it&apos;s in food</div>
                  <p className="mt-1 leading-relaxed">{entry.purpose}</p>
                </section>
              )}
              {entry.concern && (
                <section>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ss-orange">Research context</div>
                  <p className="mt-1 leading-relaxed">{entry.concern}</p>
                </section>
              )}
              {entry.better_options?.length > 0 && (
                <section>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ss-teal">Better options</div>
                  <ul className="mt-1 space-y-1 text-xs">
                    {entry.better_options.map((o, i) => <li key={i}>• {o}</li>)}
                  </ul>
                </section>
              )}
            </>
          )}
          <p className="text-[11px] italic text-ss-muted">Ingredient notes summarize published research. Not medical advice. Regulatory status and formulations change — check current sources for specific decisions.</p>
        </div>
      </aside>
    </div>
  )
}
