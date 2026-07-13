// /app/lib/training/viewMode.js
// Global Simple/Full view mode for the Training Protocol tabs.
// Stored on-device only. Default is 'simple' so a freshly-generated
// protocol reads as a scannable overview; user can click Full to expand.

'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'selfscience_training_view_mode'

const ViewModeCtx = createContext({ mode: 'simple', setMode: () => {} })

export function ViewModeProvider({ children }) {
  const [mode, setMode] = useState('simple')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored === 'simple' || stored === 'full') setMode(stored)
    } catch { /* noop */ }
  }, [])

  const set = (m) => {
    setMode(m)
    try { localStorage.setItem(KEY, m) } catch { /* noop */ }
  }

  return (
    <ViewModeCtx.Provider value={{ mode, setMode: set }}>
      {children}
    </ViewModeCtx.Provider>
  )
}

export function useViewMode() {
  return useContext(ViewModeCtx)
}

/**
 * Convenience component: renders children only in Full mode.
 * Use to wrap the deep-detail portions of any panel.
 */
export function OnlyFull({ children }) {
  const { mode } = useViewMode()
  if (mode !== 'full') return null
  return children
}

/** Renders children only in Simple mode. */
export function OnlySimple({ children }) {
  const { mode } = useViewMode()
  if (mode !== 'simple') return null
  return children
}
