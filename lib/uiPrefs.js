'use client'

// /app/lib/uiPrefs.js
// Phase C — SSR-safe read/write for user-facing UI preferences. Kept
// small on purpose: right now there's exactly one preference,
// `showTechnicalTerms`, but the shape is designed to grow.
//
// Storage key: ss_show_tech_terms  ('1' | '0'; default '0' i.e. plain
// English mode)

import { useEffect, useState } from 'react'

export const LS_TECH_TERMS = 'ss_show_tech_terms'
const EVT = 'selfscience:prefs-changed'

export function getShowTechnicalTerms() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(LS_TECH_TERMS) === '1' } catch { return false }
}

export function setShowTechnicalTerms(next) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_TECH_TERMS, next ? '1' : '0')
    window.dispatchEvent(new Event(EVT))
  } catch {}
}

// React hook — SSR-safe, updates on cross-component change.
export function useShowTechnicalTerms() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setShow(getShowTechnicalTerms())
    if (typeof window === 'undefined') return
    const onChange = () => setShow(getShowTechnicalTerms())
    window.addEventListener(EVT, onChange)
    return () => window.removeEventListener(EVT, onChange)
  }, [])
  return show
}
