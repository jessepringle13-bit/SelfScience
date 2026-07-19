'use client'

// /app/components/nutrition/GroceryListSheet.jsx
// A bottom-sheet grocery list, plus a small "Add to grocery list" icon
// button (`GroceryAddButton`) that food tiles can render inline.
//
// Data lives entirely in localStorage under ss_grocery_list — no server,
// no cross-user leaks, no PII.

import { useEffect, useState } from 'react'
import { X, Copy, Trash2, ShoppingCart, CheckCircle2, Plus } from 'lucide-react'
import { groceryStore } from '@/lib/lists'
import { useListStore } from '@/lib/lists/store'

export default function GroceryListSheet({ open, onClose }) {
  const [items] = useListStore(groceryStore)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const copyList = () => {
    const text = ['My SelfScience grocery list', '─'.repeat(28), '', ...items.map((i) => `• ${i.name}${i.category ? `  (${i.category})` : ''}`)].join('\n')
    try {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* noop */ }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="My grocery list"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-ss-border-warm/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ss-teal/10 text-ss-teal">
              <ShoppingCart size={15} />
            </span>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ss-teal">
                My grocery list
              </div>
              <div className="text-[11px] text-ss-muted">{items.length} item{items.length === 1 ? '' : 's'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-ss-text">Your list is empty</p>
              <p className="mt-1 text-[11.5px] text-ss-muted">
                Tap the <Plus className="inline h-3 w-3" /> icon on any food card in the Prioritize section to add it here.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-ss-border-warm/40 bg-ss-bg/40 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-ss-text">{it.name}</div>
                    {(it.category || it.serving) && (
                      <div className="mt-0.5 text-[11px] text-ss-muted">
                        {it.category}{it.category && it.serving ? ' · ' : ''}{it.serving}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => groceryStore.remove(it.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-white hover:text-ss-red"
                    aria-label={`Remove ${it.name}`}
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-ss-border-warm/60 bg-white p-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyList}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-ss-teal bg-white px-4 text-sm font-bold text-ss-teal hover:bg-ss-teal hover:text-white"
              >
                {copied ? <><CheckCircle2 size={13} /> Copied</> : <><Copy size={13} /> Copy list</>}
              </button>
              <button
                type="button"
                onClick={() => { if (confirm('Clear your grocery list?')) groceryStore.clear() }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ss-border-warm px-3 text-sm font-semibold text-ss-muted hover:text-ss-red"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}

// Inline "+ Add" icon button for individual food tiles.
export function GroceryAddButton({ food, category, className = '' }) {
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    setMounted(true)
    return groceryStore.subscribe(() => setTick((t) => t + 1))
  }, [])
  const isIn = mounted && groceryStore.findBy(
    (i) =>
      (food.id && i.id === `food-${food.id}`) ||
      (food.name && i.name === food.name),
  )
  const handle = (e) => {
    e.stopPropagation()
    if (isIn) groceryStore.remove(isIn.id)
    else groceryStore.add({
      id: food.id ? `food-${food.id}` : undefined,
      name: food.name,
      category: category || food.category || null,
      serving: food.serving_frequency || food.serving || null,
    })
  }
  return (
    <button
      type="button"
      onClick={handle}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-ss-muted transition hover:bg-ss-teal/10 hover:text-ss-teal ${
        isIn ? 'text-ss-green' : ''
      } ${className}`}
      aria-label={isIn ? `Remove ${food.name} from grocery list` : `Add ${food.name} to grocery list`}
      title={isIn ? 'In your grocery list' : 'Add to grocery list'}
    >
      {isIn ? <CheckCircle2 size={16} /> : <Plus size={16} />}
    </button>
  )
}

// Trigger pill for the Foods tab header — shows count + opens sheet.
export function GroceryListTrigger({ onClick }) {
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    setMounted(true)
    return groceryStore.subscribe(() => setTick((t) => t + 1))
  }, [])
  const count = mounted ? groceryStore.all().length : 0
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ss-teal bg-white px-3 py-1.5 text-[12px] font-bold text-ss-teal hover:bg-ss-teal hover:text-white"
    >
      <ShoppingCart size={13} />
      My grocery list
      {count > 0 && (
        <span className="ml-1 rounded-full bg-ss-teal text-white px-1.5 py-0.5 text-[10px] font-black group-hover:bg-white group-hover:text-ss-teal">
          {count}
        </span>
      )}
    </button>
  )
}
