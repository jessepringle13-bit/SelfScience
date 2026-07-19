// /app/lib/lists/store.js
// Tiny generic localStorage-backed list helper used by every "My X"
// feature (Medications, Stack, Grocery). All entries live only on the
// user's device — no server sync, no cross-tab leaks. Each list keeps a
// small event bus so components can subscribe to changes.

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

// Simple id generator — enough for local-only lists.
export function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  )
}

function readList(key) {
  if (!hasWindow()) return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function writeList(key, arr) {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(arr))
    window.dispatchEvent(new CustomEvent(`selfscience:list-changed:${key}`))
  } catch { /* noop */ }
}

// Factory that returns a fully-typed CRUD API for one localStorage key.
export function makeListStore(key) {
  return {
    key,
    all: () => readList(key),
    add: (item) => {
      const list = readList(key)
      // Dedupe by id if provided, else append.
      const id = item?.id || uid()
      const idx = list.findIndex((i) => i.id === id)
      const record = { id, addedAt: Date.now(), ...item }
      if (idx >= 0) list[idx] = { ...list[idx], ...record }
      else list.push(record)
      writeList(key, list)
      return record
    },
    remove: (id) => {
      const list = readList(key).filter((i) => i.id !== id)
      writeList(key, list)
    },
    update: (id, patch) => {
      const list = readList(key).map((i) => (i.id === id ? { ...i, ...patch } : i))
      writeList(key, list)
    },
    clear: () => writeList(key, []),
    has: (predicate) => readList(key).some(predicate),
    findBy: (predicate) => readList(key).find(predicate),
    subscribe: (handler) => {
      if (!hasWindow()) return () => {}
      const evt = `selfscience:list-changed:${key}`
      const cb = () => handler(readList(key))
      window.addEventListener(evt, cb)
      // Also react to cross-tab storage events.
      const storageCb = (e) => { if (e.key === key) handler(readList(key)) }
      window.addEventListener('storage', storageCb)
      return () => {
        window.removeEventListener(evt, cb)
        window.removeEventListener('storage', storageCb)
      }
    },
  }
}

// React hook — subscribes to a list store and re-renders on changes.
// Starts with [] to avoid SSR hydration mismatches, then hydrates on
// mount via a subscription.
import { useEffect, useState } from 'react'
export function useListStore(store) {
  const [items, setItems] = useState([])
  useEffect(() => {
    setItems(store.all())
    return store.subscribe(setItems)
  }, [store])
  return [items, store]
}
