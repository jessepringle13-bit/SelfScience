'use client'
import { useState, useEffect } from 'react'
import { GOALS, CONTEXTS } from '@/lib/supplements/goalCategories'

const STORAGE_KEY = 'selfscience_supplement_intake_v1'

function loadIntake() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
function saveIntake(data) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export default function GoalPicker({ onSelect, initialGoalId = null }) {
  const [selectedGoalId, setSelectedGoalId] = useState(initialGoalId)
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [diet, setDiet] = useState('')

  // Hydrate from localStorage
  useEffect(() => {
    const saved = loadIntake()
    if (saved) {
      if (saved.goalId && !initialGoalId) setSelectedGoalId(saved.goalId)
      if (saved.age) setAge(saved.age)
      if (saved.sex) setSex(saved.sex)
      if (saved.diet) setDiet(saved.diet)
    }
  }, [initialGoalId])

  const handleGoalClick = (g) => {
    setSelectedGoalId(g.id)
    saveIntake({ goalId: g.id, age, sex, diet })
    onSelect?.({ goal: g, context: { age, sex, diet } })
  }

  const handleContextChange = (key, val) => {
    if (key === 'age') setAge(val)
    if (key === 'sex') setSex(val)
    if (key === 'diet') setDiet(val)
    const next = { goalId: selectedGoalId, age, sex, diet, [key]: val }
    saveIntake(next)
    if (selectedGoalId) {
      const g = GOALS.find((x) => x.id === selectedGoalId)
      onSelect?.({ goal: g, context: { age: next.age, sex: next.sex, diet: next.diet } })
    }
  }

  return (
    <div className="rounded-2xl border border-[#1B474D]/10 bg-white p-5 md:p-6 shadow-sm">
      <h2 className="text-lg md:text-xl font-semibold text-[#1B474D]">What are you exploring?</h2>
      <p className="text-sm text-slate-600 mt-1">Pick one goal. We&apos;ll surface the supplement categories with the strongest published research for that outcome.</p>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {GOALS.map((g) => {
          const selected = g.id === selectedGoalId
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => handleGoalClick(g)}
              className={`rounded-xl border p-3 text-left transition ${
                selected
                  ? 'border-[#C45820] bg-[#FFF3EA] shadow-inner'
                  : 'border-slate-200 bg-white hover:border-[#1B474D]/40 hover:bg-slate-50'
              }`}
            >
              <div className="text-xl">{g.icon}</div>
              <div className={`mt-1 text-sm font-semibold ${selected ? 'text-[#C45820]' : 'text-[#1B474D]'}`}>{g.label}</div>
              <div className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">{g.description}</div>
            </button>
          )
        })}
      </div>

      {selectedGoalId && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Age band" value={age} onChange={(v) => handleContextChange('age', v)} options={CONTEXTS.age} />
          <Select label="Sex" value={sex} onChange={(v) => handleContextChange('sex', v)} options={CONTEXTS.sex} />
          <Select label="Dietary pattern" value={diet} onChange={(v) => handleContextChange('diet', v)} options={CONTEXTS.dietary_pattern} />
        </div>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col text-xs font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 focus:border-[#1B474D] focus:outline-none focus:ring-1 focus:ring-[#1B474D]"
      >
        <option value="">Prefer not to say</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
