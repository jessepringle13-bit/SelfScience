'use client'
// Global compare-mode context. Lets any product card add/remove itself from
// a comparison list, and the CompareDrawer opens when the list has >=2 items.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CompareContext = createContext(null)

const STORAGE_KEY = 'selfscience_supplement_compare_v1'

export function CompareProvider({ children }) {
  const [items, setItems] = useState([])   // array of full product objects
  const [open, setOpen] = useState(false)
  const [pendingConflict, setPendingConflict] = useState(null)   // { newProduct, newFamily, prevFamily }

  // Hydrate on mount (items are lightweight normalized products)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  const isIn = useCallback((id) => items.some((p) => p.id === id), [items])

  const add = useCallback((product) => {
    if (!product?.id) return
    const familyOf = (p) => {
      const q = p?.formQuality || []
      const pref = q.find((f) => f.tier === 'preferred') || q[0]
      return pref?.ingredient || null
    }
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev
      const family = familyOf(product)
      if (prev.length > 0) {
        const existingFamily = familyOf(prev[0])
        if (family && existingFamily && family !== existingFamily) {
          // Surface an inline confirmation prompt via pendingConflict.
          setPendingConflict({ newProduct: product, newFamily: family, prevFamily: existingFamily })
          return prev
        }
      }
      const next = [...prev, product]
      return next.slice(-4)
    })
  }, [])

  // Called when the user confirms the family conflict prompt.
  const acceptConflictReplace = useCallback(() => {
    setPendingConflict((pc) => {
      if (!pc) return null
      setItems([pc.newProduct])
      if (typeof window !== 'undefined') {
        try { window.dispatchEvent(new CustomEvent('selfscience:compare-family-conflict', { detail: { newFamily: pc.newFamily, prevFamily: pc.prevFamily } })) } catch {}
      }
      return null
    })
  }, [])
  const acceptConflictKeepBoth = useCallback(() => {
    setPendingConflict((pc) => {
      if (!pc) return null
      setItems((prev) => {
        const next = [...prev, pc.newProduct]
        return next.slice(-4)
      })
      return null
    })
  }, [])
  const dismissConflict = useCallback(() => setPendingConflict(null), [])

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const toggle = useCallback((product) => {
    if (!product?.id) return
    if (isIn(product.id)) remove(product.id)
    else add(product)
  }, [isIn, add, remove])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({
    items, add, remove, toggle, clear, isIn, open, setOpen,
    pendingConflict, acceptConflictReplace, acceptConflictKeepBoth, dismissConflict,
  }), [items, add, remove, toggle, clear, isIn, open, pendingConflict, acceptConflictReplace, acceptConflictKeepBoth, dismissConflict])

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used inside <CompareProvider>')
  return ctx
}
