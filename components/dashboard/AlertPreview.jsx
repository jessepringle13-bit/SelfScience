'use client'

// /app/components/dashboard/AlertPreview.jsx
// Full-width dashboard banner. Shows up to 3 unread alerts at the top
// of the dashboard, above every other widget. If none are unread the
// component renders nothing — additive-only, never blocks content.

import { useMemo, useState } from 'react'
import { ArrowRight, X, Bell, Pin } from 'lucide-react'
import {
  useAlerts,
  TYPE_META,
  markRead,
  dismissAlert,
  sortAlerts,
} from '@/lib/alerts'
import AlertCenterPanel from '@/components/AlertCenterPanel'

const LS_HIDE_KEY = 'ss_alerts_preview_hidden_at'

export default function AlertPreview() {
  const alerts = useAlerts()
  const [panelOpen, setPanelOpen] = useState(false)
  const [hiddenTs, setHiddenTs] = useState(() => {
    if (typeof window === 'undefined') return 0
    try { return Number(window.localStorage.getItem(LS_HIDE_KEY) || 0) } catch { return 0 }
  })

  const top = useMemo(() => {
    return alerts
      .filter((a) => !a.isRead && !a.isDismissed)
      .sort(sortAlerts)
      .slice(0, 3)
  }, [alerts])

  // Snooze: if the user dismissed the whole preview in the last hour,
  // don't show it again until an even newer unread alert arrives.
  const newestTs = top.length ? Date.parse(top[0].createdAt) : 0
  const shouldShow = top.length > 0 && (!hiddenTs || newestTs > hiddenTs)
  if (!shouldShow) return null

  const dismissAll = () => {
    const ts = Date.now()
    try { window.localStorage.setItem(LS_HIDE_KEY, String(ts)) } catch {}
    setHiddenTs(ts)
  }

  const openAlert = (a) => {
    markRead(a.id)
    if (!a.actionUrl) return
    if (/^https?:\/\//i.test(a.actionUrl)) {
      window.open(a.actionUrl, '_blank', 'noopener,noreferrer')
    } else if (a.actionUrl.startsWith('#')) {
      try { document.querySelector(a.actionUrl)?.scrollIntoView({ behavior: 'smooth' }) } catch {}
    } else {
      window.location.href = a.actionUrl
    }
  }

  return (
    <>
      <div className="relative w-full border-b border-ss-border-warm/60 bg-gradient-to-r from-ss-teal/[0.06] via-ss-amber/[0.06] to-ss-orange/[0.06]">
        <div className="container flex flex-col gap-3 py-4 md:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ss-orange/15 text-ss-orange">
                <Bell size={14} strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ss-orange">
                  Since you were last here
                </div>
                <div className="text-sm font-extrabold text-ss-teal md:text-base">
                  {top.length === 1 ? '1 new alert' : `${top.length} new alerts`} for your genome
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-ss-teal/90"
              >
                View all <ArrowRight size={11} />
              </button>
              <button
                type="button"
                onClick={dismissAll}
                aria-label="Hide alerts banner"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ss-muted hover:bg-white/50"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <ul className="grid gap-2 md:grid-cols-3">
            {top.map((a) => {
              const meta = TYPE_META[a.type] || TYPE_META.update
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => openAlert(a)}
                    className="group flex w-full items-start gap-2.5 rounded-xl border border-white bg-white/85 p-3 text-left shadow-sm ring-1 ring-black/[0.03] transition hover:bg-white"
                  >
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.softBg}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[9.5px] font-bold uppercase tracking-[0.14em] ${meta.accent}`}>
                        {meta.label}
                        {a.pinned && <Pin size={9} className="ml-1 inline fill-ss-amber text-ss-amber" />}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] font-bold text-ss-teal group-hover:underline">
                        {a.title}
                      </span>
                      {a.body && (
                        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-ss-text/80">
                          {a.body}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <AlertCenterPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  )
}
