'use client'

// /app/components/PrefsMenu.jsx
// Phase C — small header dropdown that hosts user-facing UI preferences.
// Right now it contains a single "Show technical terms" toggle. Kept
// visually light so it doesn't compete with the rest of the top-nav.
//
// Click / touch outside or Escape closes the menu.

import { useEffect, useRef, useState } from 'react'
import { Settings2, Compass, RefreshCw, Trash2, ShieldAlert, X, Users, Bell, Target, Route, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useShowTechnicalTerms, setShowTechnicalTerms } from '@/lib/uiPrefs'
import { resetGuideOnly, showGuideAgain, resetGenomeAndGuide, fireToast } from '@/lib/journeyReset'
import ThemeToggle from '@/components/ThemeToggle'
import { openHealthStoryQuiz } from '@/lib/userProfile'
import { useCommunityState } from '@/lib/community'
import { usePrefs as useAlertPrefs, clearAllAlerts, TYPE_META } from '@/lib/alerts'
import { useMode, setMode } from '@/lib/userPath'

export default function PrefsMenu({ isDark = false }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const showTech = useShowTechnicalTerms()
  const [alertPrefs, updateAlertPrefs] = useAlertPrefs()
  const { optedIn: communityOptedIn } = useCommunityState()
  const mode = useMode()
  const wrapRef = useRef(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey  = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const btnClass = isDark
    ? 'text-white/80 hover:text-white'
    : 'text-ss-muted hover:text-ss-teal'

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Display preferences"
        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${btnClass}`}
      >
        <Settings2 size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 max-h-[85vh] w-80 overflow-y-auto overflow-x-hidden rounded-2xl border border-ss-border-warm bg-white shadow-xl ring-1 ring-black/5"
        >
          <div className="border-b border-ss-border-warm/60 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ss-muted">Display preferences</div>
          </div>

          {/* Journey mode — the core toggle between the guided
              curriculum and the full Explorer experience. Both stay
              reachable by URL; this only changes which nav items
              surface and where CTAs point by default. */}
          <div className="border-b border-ss-border-warm/60 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route size={13} className="text-ss-teal" />
                <span className="text-sm font-bold text-ss-teal">Journey mode</span>
              </div>
              <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ss-teal">
                {mode === 'guided' ? 'Guided' : 'Explorer'}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => { setMode('guided'); fireToast('Switched to Guided mode') }}
                className={`flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition ${
                  mode === 'guided'
                    ? 'border-ss-teal bg-ss-teal/[0.08] ring-1 ring-ss-teal'
                    : 'border-ss-border-warm bg-white hover:border-ss-teal/60'
                }`}
              >
                <span className="text-[12px] font-bold text-ss-text">Guided</span>
                <span className="text-[10px] leading-tight text-ss-muted">Curriculum · one step at a time</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('explorer'); fireToast('Switched to Explorer mode') }}
                className={`flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition ${
                  mode === 'explorer'
                    ? 'border-ss-teal bg-ss-teal/[0.08] ring-1 ring-ss-teal'
                    : 'border-ss-border-warm bg-white hover:border-ss-teal/60'
                }`}
              >
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ss-text"><Sparkles size={10} className="text-ss-orange" /> Explorer</span>
                <span className="text-[10px] leading-tight text-ss-muted">Full nav · all tools</span>
              </button>
            </div>
            {mode === 'guided' && (
              <button
                type="button"
                onClick={() => { setOpen(false); router.push('/my-path') }}
                className="mt-2 flex w-full items-center justify-between rounded-lg bg-ss-teal/[0.05] px-2.5 py-1.5 text-left text-[11.5px] font-semibold text-ss-teal transition hover:bg-ss-teal/10"
              >
                <span>Go to my path</span>
                <span>→</span>
              </button>
            )}
          </div>

          {/* Colour theme — light / system / dark. Additive: nothing
              else in the menu changes. */}
          <div className="border-b border-ss-border-warm/60 px-4 py-3">
            <div className="mb-2 text-sm font-bold text-ss-teal">Colour theme</div>
            <ThemeToggle />
            <div className="mt-1.5 text-[11px] leading-snug text-ss-muted">
              Dark mode is optimised for the core reading surfaces. Some pages may still render in light shades.
            </div>
          </div>

          {/* Update my preferences — re-open the Health Story quiz.
              Answers pre-populate from the previous run. */}
          <button
            type="button"
            onClick={() => { setOpen(false); openHealthStoryQuiz() }}
            className="flex w-full items-center gap-2 border-b border-ss-border-warm/60 px-4 py-3 text-left text-sm font-semibold text-ss-teal transition hover:bg-ss-bg"
          >
            <span aria-hidden="true">⚙</span>
            Update my preferences
          </button>

          <label className="flex cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-ss-bg">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ss-teal">Show technical terms</div>
              <div className="mt-0.5 text-[11px] leading-snug text-ss-muted">
                Show rsIDs, "heterozygous / homozygous", pillar names, and other scientific
                terminology in card summaries.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showTech}
              onClick={() => setShowTechnicalTerms(!showTech)}
              className={`relative mt-1 h-6 w-11 flex-shrink-0 rounded-full transition ${
                showTech ? 'bg-ss-green' : 'bg-ss-border-warm'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  showTech ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </label>

          <div className="border-t border-ss-border-warm/60 bg-ss-bg/60 px-4 py-2.5 text-[11px] text-ss-muted">
            Detail views always show both plain English and technical labels.
          </div>

          {/* Guide actions (Parts 2 + 3) */}
          <div className="border-t border-ss-border-warm/60">
            <MenuItem
              Icon={Compass}
              label="Explore Your Genes"
              hint="Focus Mode — one finding at a time"
              onClick={() => { setOpen(false); router.push('/explore') }}
            />
            <MenuItem
              Icon={Target}
              label="My Goals"
              hint="Set genome-informed goals and track progress"
              onClick={() => { setOpen(false); router.push('/goals') }}
            />
            {communityOptedIn && (
              <MenuItem
                Icon={Users}
                label="Community Settings"
                hint="Manage your display name and shares"
                onClick={() => { setOpen(false); router.push('/community/settings') }}
              />
            )}
            <MenuItem
              Icon={Compass}
              label="Show getting started guide"
              hint="Bring back the Guide if it's hidden"
              onClick={() => { showGuideAgain(); setOpen(false); fireToast('Guide reopened') }}
            />
            <MenuItem
              Icon={RefreshCw}
              label="Replay getting started guide"
              hint="Reset only your Guide progress"
              onClick={() => { resetGuideOnly(); setOpen(false); fireToast('Guide restarted — follow the steps to explore your results') }}
            />
          </div>

          {/* Alert settings — Genome Alert System (Section: 6 toggles + master). */}
          <div id="alert-prefs" className="border-t border-ss-border-warm/60">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-ss-teal" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-ss-teal">Alerts</span>
              </div>
              <MiniSwitch
                checked={!!alertPrefs.master}
                onChange={(v) => updateAlertPrefs({ master: v })}
                label="Master alerts switch"
              />
            </div>
            <p className="px-4 pb-2 text-[10.5px] leading-snug text-ss-muted">
              Choose which alerts appear in your nav bell. Everything runs on-device — no push, no email.
            </p>
            <div className={`px-2 pb-2 ${alertPrefs.master ? '' : 'pointer-events-none opacity-50'}`}>
              {[
                { k: 'research',  label: 'New research on your variants',    hint: 'PubMed studies matching your top variants.' },
                { k: 'habit',     label: 'New habits linked to your genome', hint: 'Genotype-specific habits you haven\u2019t added yet.' },
                { k: 'trial',     label: 'Clinical trial matches',           hint: 'Recruiting trials for your genes.' },
                { k: 'community', label: 'Community insights',               hint: 'What other carriers of your variants are sharing.' },
                { k: 'reminder',  label: 'Reminders',                         hint: 'Journal gaps, habit streaks, reading backlog.' },
                { k: 'update',    label: 'Platform updates',                  hint: 'New features and improvements to SelfScience.' },
              ].map((row) => (
                <label key={row.k} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-ss-bg">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-ss-teal">{row.label}</div>
                    <div className="mt-0.5 text-[10.5px] leading-snug text-ss-muted">{row.hint}</div>
                  </div>
                  <MiniSwitch
                    checked={!!alertPrefs[row.k]}
                    onChange={(v) => updateAlertPrefs({ [row.k]: v })}
                    label={row.label}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all non-pinned alerts?')) {
                  clearAllAlerts()
                  fireToast('Alerts cleared')
                }
              }}
              className="flex w-full items-center gap-2 border-t border-ss-border-warm/60 px-4 py-2.5 text-left text-[12px] font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={12} /> Clear all alerts
            </button>
          </div>

          {/* Danger zone (Part 1) */}
          <div className="border-t border-ss-border-warm/60">
            <MenuItem
              Icon={Trash2}
              label="Clear all data & reset"
              hint="Remove genome + guide progress"
              danger
              onClick={() => { setOpen(false); setConfirmReset(true) }}
            />
          </div>
        </div>
      )}

      {/* Full-reset confirmation modal (Part 1 — invoked from the header
          menu; the dashboard button uses ResetGenomeButton's own modal). */}
      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ss-reset-menu-heading"
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/50 md:items-center"
          onClick={() => setConfirmReset(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-6 shadow-2xl md:w-full md:max-w-md md:rounded-2xl md:p-8"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ss-border-warm md:hidden" aria-hidden="true" />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                <ShieldAlert size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="ss-reset-menu-heading" className="text-lg font-extrabold text-ss-teal">Clear your genome data?</h2>
                <p className="mt-2 text-sm text-ss-text">
                  This will remove your uploaded genome file and all personalized results from this session. Your Guide progress will also reset so you can experience the full walkthrough again.
                </p>
                <p className="mt-2 text-[11px] italic text-ss-muted">Your data never left your device — nothing is stored on our servers.</p>
              </div>
              <button
                type="button"
                aria-label="Close reset dialog"
                onClick={() => setConfirmReset(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmReset(false)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-ss-border-warm bg-white px-5 text-sm font-semibold text-ss-teal transition hover:bg-ss-bg">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  resetGenomeAndGuide()
                  setConfirmReset(false)
                  setTimeout(() => { router.push('/'); router.refresh?.() }, 60)
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Yes, clear everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ Icon, label, hint, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ss-bg ${danger ? 'text-red-600' : 'text-ss-teal'}`}
    >
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] font-normal text-ss-muted">{hint}</span>}
      </span>
    </button>
  )
}

function MiniSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.preventDefault(); onChange(!checked) }}
      className={`relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition ${
        checked ? 'bg-ss-green' : 'bg-ss-border-warm'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
