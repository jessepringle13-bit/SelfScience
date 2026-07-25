'use client'

// /app/lib/featuresExplored.js
// Tracks which of the 11 top-level features the user has visited. Used
// by the Dashboard progress bar. Storage: ss_features_explored (JSON
// array of feature keys).

import { useEffect, useState } from 'react'

export const LS_FEATURES = 'ss_features_explored'

// 11 features that count toward "Your SelfScience journey" — order
// matters because the "Continue exploring" link points to the FIRST
// unvisited entry.
export const FEATURES = [
  { key: 'upload',       label: 'Upload genome',        href: '/genome',              match: (p) => p.startsWith('/genome') },
  { key: 'search',       label: 'Search',                href: '/search',              match: (p) => p.startsWith('/search') },
  { key: 'nutrition',    label: 'Nutrition Hub',         href: '/nutrition',           match: (p) => p.startsWith('/nutrition') },
  { key: 'supplements',  label: 'Supplements',           href: '/tools/supplements',   match: (p) => p.startsWith('/tools/supplements') },
  { key: 'drugcheck',    label: 'Drug Check',            href: '/drug-check',          match: (p) => p.startsWith('/drug-check') },
  { key: 'biomarkers',   label: 'Biomarkers',            href: '/biomarkers',          match: (p) => p.startsWith('/biomarkers') },
  { key: 'training',     label: 'Training Protocol',     href: '/tools/training',      match: (p) => p.startsWith('/tools/training') },
  { key: 'report',       label: 'Practitioner Report',   href: '/practitioner-report', match: (p) => p.startsWith('/practitioner-report') },
  { key: 'articles',     label: 'Articles',              href: '/articles',            match: (p) => p.startsWith('/articles') },
  { key: 'ancestry',     label: 'Ancestry',              href: '/ancestry',            match: (p) => p.startsWith('/ancestry') },
  { key: 'discover',     label: 'Discover tab',          href: '/?tab=discover',       match: () => false },
]

export function getFeaturesExplored() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_FEATURES)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function markFeatureExplored(key) {
  if (typeof window === 'undefined' || !key) return
  try {
    const set = new Set(getFeaturesExplored())
    if (set.has(key)) return
    set.add(key)
    window.localStorage.setItem(LS_FEATURES, JSON.stringify(Array.from(set)))
    window.dispatchEvent(new Event('selfscience:features-changed'))
  } catch {}
}

export function useFeaturesExplored() {
  const [explored, setExplored] = useState([])
  useEffect(() => {
    setExplored(getFeaturesExplored())
    if (typeof window === 'undefined') return
    const onChange = () => setExplored(getFeaturesExplored())
    window.addEventListener('selfscience:features-changed', onChange)
    return () => window.removeEventListener('selfscience:features-changed', onChange)
  }, [])
  return explored
}
