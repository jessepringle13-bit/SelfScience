'use client'

// /app/components/AlertCenterPanel.jsx
// Slide-out panel from the right on desktop, bottom sheet on mobile.
// Lists alerts with filter tabs (All / Unread / Pinned) and per-type
// filter chips. Supports mark-read, dismiss, pin/unpin, clear-all.
//
// Long-press (touch) or right-click (mouse) opens the context menu.
//
// Rendered via a portal to document.body so it escapes any ancestor
// backdrop-filter / transform which would otherwise trap position:fixed.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Pin, PinOff, Check, Trash2, Bell, ExternalLink } from 'lucide-react'
import {
  useAlerts,
  TYPE_META,
  TYPES,
  markRead,
  markAllRead,
  dismissAlert,
  clearAllAlerts,
  pinAlert,
  unpinAlert,
  relativeTime,
  MAX_PINNED,
  sortAlerts,
} from '@/lib/alerts'

export default function AlertCenterPanel({ open, onClose }) {
  const alerts = useAlerts()
  const [tab, setTab] = useState('all')       // 'all' | 'unread' | 'pinned'
  const [typeFilter, setTypeFilter] = useState(null)
  const [ctxMenu, setCtxMenu] = useState(null) // { id, x, y }
  const [toast, setToast] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Close context menu on outside click / scroll
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('mousedown', close)
    window.addEventListener('touchstart', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('mousedown', close)
      window.removeEventListener('touchstart', close)
    }
  }, [ctxMenu])

  const filtered = useMemo(() => {
    let out = alerts.slice()
    if (tab === 'unread') out = out.filter((a) => !a.isRead)
    if (tab === 'pinned') out = out.filter((a) => a.pinned)
    if (typeFilter) out = out.filter((a) => a.type === typeFilter)
    out.sort(sortAlerts)
    return out
  }, [alerts, tab, typeFilter])

  const unreadCount = alerts.filter((a) => !a.isRead).length
  const pinnedCurrent = alerts.filter((a) => a.pinned).length

  const handleOpenAlert = (a) => {
    if (!a.isRead) markRead(a.id)
    if (a.actionUrl) {
      if (/^https?:\/\//i.test(a.actionUrl)) {
        window.open(a.actionUrl, '_blank', 'noopener,noreferrer')
      } else if (a.actionUrl.startsWith('#')) {
        // Anchor to preference section — close panel and let user land there.
        onClose?.()
        setTimeout(() => {
          try { document.querySelector(a.actionUrl)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
        }, 200)
      } else {
        window.location.href = a.actionUrl
      }
    }
  }

  const openContextMenu = (e, alertId) => {
    e.preventDefault()
    e.stopPropagation()
    const x = e.clientX || e.touches?.[0]?.clientX || 0
    const y = e.clientY || e.touches?.[0]?.clientY || 0
    setCtxMenu({ id: alertId, x, y })
  }

  if (!open) return null

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ss-alert-panel-title"
      className="fixed inset-0 z-[100]"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — right slide-out on desktop, bottom sheet on mobile */}
      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[420px] md:rounded-none md:rounded-l-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for mobile */}
        <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-ss-border-warm md:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-ss-border-warm/60 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-ss-teal" />
              <h2 id="ss-alert-panel-title" className="text-base font-extrabold text-ss-teal">Alerts</h2>
              {unreadCount > 0 && (
                <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-ss-orange px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-ss-muted">
              Personalised to your genome. All checks run on-device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-ss-border-warm/60 px-3 py-2">
          {[
            { k: 'all',    label: `All (${alerts.length})` },
            { k: 'unread', label: `Unread (${unreadCount})` },
            { k: 'pinned', label: `Pinned (${pinnedCurrent})` },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                tab === t.k ? 'bg-ss-teal text-white' : 'text-ss-muted hover:bg-ss-bg'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => { markAllRead(); showToast('All marked as read') }}
                className="rounded-full px-2 py-1 text-[10px] font-semibold text-ss-teal hover:bg-ss-bg"
                title="Mark all as read"
              >
                <Check size={12} className="inline" /> Mark read
              </button>
            )}
            {alerts.filter((a) => !a.pinned).length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all non-pinned alerts?')) { clearAllAlerts(); showToast('Cleared') }
                }}
                className="rounded-full px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                title="Clear all non-pinned alerts"
              >
                <Trash2 size={12} className="inline" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-1.5 border-b border-ss-border-warm/60 px-4 py-2">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
              !typeFilter ? 'bg-ss-teal text-white' : 'bg-ss-bg text-ss-muted hover:text-ss-teal'
            }`}
          >
            All types
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                typeFilter === t
                  ? 'bg-ss-teal text-white'
                  : `${TYPE_META[t].softBg} ${TYPE_META[t].accent} hover:brightness-95`
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${TYPE_META[t].dot}`} aria-hidden="true" />
              {TYPE_META[t].label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <EmptyState tab={tab} typeFilter={typeFilter} />
          ) : (
            <ul className="space-y-1">
              {filtered.map((a) => (
                <AlertRow
                  key={a.id}
                  alert={a}
                  onOpen={() => handleOpenAlert(a)}
                  onContext={(e) => openContextMenu(e, a.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer helper */}
        <div className="border-t border-ss-border-warm/60 bg-ss-bg/60 px-4 py-2 text-[10px] leading-snug text-ss-muted">
          Right-click (or long-press) an alert to pin, mark read, or dismiss. Pinned alerts never expire. Max {MAX_PINNED} pins.
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          ctx={ctxMenu}
          alert={alerts.find((a) => a.id === ctxMenu.id)}
          onClose={() => setCtxMenu(null)}
          onPin={() => {
            const r = pinAlert(ctxMenu.id)
            if (!r.ok && r.reason === 'max_pinned') showToast(`You can pin up to ${MAX_PINNED} alerts`)
            else if (r.ok && !r.alreadyPinned) showToast('Pinned')
            setCtxMenu(null)
          }}
          onUnpin={() => { unpinAlert(ctxMenu.id); showToast('Unpinned'); setCtxMenu(null) }}
          onMarkRead={() => { markRead(ctxMenu.id); setCtxMenu(null) }}
          onDismiss={() => { dismissAlert(ctxMenu.id); showToast('Dismissed'); setCtxMenu(null) }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-ss-teal px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )

  // Portal to document.body so the panel escapes any ancestor
  // backdrop-filter / transform that would trap a fixed-positioned child.
  if (!mounted || typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

/* ----------------------------- Row ------------------------------------- */

function AlertRow({ alert, onOpen, onContext }) {
  const meta = TYPE_META[alert.type] || TYPE_META.update
  const rowRef = useRef(null)
  const pressTimer = useRef(null)

  // Long-press detection for touch devices.
  const onTouchStart = (e) => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      onContext(e)
    }, 550)
  }
  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current) }

  return (
    <li>
      <div
        ref={rowRef}
        onContextMenu={onContext}
        onTouchStart={onTouchStart}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onTouchCancel={cancelPress}
        className={`group relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-ss-bg ${
          alert.isRead ? '' : 'bg-ss-teal/[0.03]'
        }`}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      >
        {/* Unread indicator */}
        {!alert.isRead && (
          <span className="absolute left-1 top-4 h-2 w-2 rounded-full bg-ss-orange" aria-hidden="true" />
        )}

        {/* Type dot */}
        <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.softBg} ${meta.accent}`}>
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
        </span>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-[0.12em] ${meta.accent}`}>
                {meta.label}
                {alert.variantSource && (
                  <span className="ml-1.5 rounded-full bg-ss-bg px-1.5 py-0.5 text-[9px] font-mono text-ss-muted">
                    {alert.variantSource}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-sm font-bold leading-tight text-ss-teal">{alert.title}</div>
            </div>
            {alert.pinned && (
              <Pin size={12} className="mt-1 shrink-0 fill-ss-amber text-ss-amber" aria-label="Pinned" />
            )}
          </div>
          {alert.body && (
            <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-ss-text">{alert.body}</p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-ss-muted">{relativeTime(alert.createdAt)}</span>
            {alert.actionLabel && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ss-teal">
                {alert.actionLabel}
                {alert.actionUrl && /^https?:\/\//i.test(alert.actionUrl)
                  ? <ExternalLink size={11} />
                  : <span aria-hidden="true">→</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

/* ----------------------------- Context menu ---------------------------- */

function ContextMenu({ ctx, alert, onClose, onPin, onUnpin, onMarkRead, onDismiss }) {
  if (!alert) return null
  const W = 200, H = 168
  const x = Math.min(ctx.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - W - 8)
  const y = Math.min(ctx.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - H - 8)
  return (
    <div
      className="fixed z-[120] w-[200px] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {alert.pinned ? (
        <button
          type="button"
          onClick={onUnpin}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-ss-teal hover:bg-ss-bg"
        >
          <PinOff size={14} /> Unpin alert
        </button>
      ) : (
        <button
          type="button"
          onClick={onPin}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-ss-amber hover:bg-ss-bg"
        >
          <Pin size={14} /> Pin this alert
        </button>
      )}
      {!alert.isRead && (
        <button
          type="button"
          onClick={onMarkRead}
          className="flex w-full items-center gap-2 border-t border-ss-border-warm/60 px-3 py-2.5 text-left text-[13px] font-semibold text-ss-teal hover:bg-ss-bg"
        >
          <Check size={14} /> Mark as read
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="flex w-full items-center gap-2 border-t border-ss-border-warm/60 px-3 py-2.5 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} /> Dismiss
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center gap-2 border-t border-ss-border-warm/60 px-3 py-2 text-left text-[11px] text-ss-muted hover:bg-ss-bg"
      >
        Cancel
      </button>
    </div>
  )
}

/* ----------------------------- Empty state ----------------------------- */

function EmptyState({ tab, typeFilter }) {
  const label = typeFilter ? `${TYPE_META[typeFilter].label.toLowerCase()} alerts` : (
    tab === 'unread' ? 'unread alerts' :
    tab === 'pinned' ? 'pinned alerts' : 'alerts'
  )
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ss-bg">
        <Bell size={22} className="text-ss-muted" />
      </div>
      <div className="text-sm font-bold text-ss-teal">No {label}</div>
      <p className="max-w-[240px] text-[12px] text-ss-muted">
        When new research, trials, habits, community insights, or reminders match your genome, they will appear here.
      </p>
    </div>
  )
}
