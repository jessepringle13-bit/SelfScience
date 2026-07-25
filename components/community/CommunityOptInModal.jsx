'use client'

// /app/components/community/CommunityOptInModal.jsx
// Three-screen opt-in flow (display name → share settings → privacy).

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, ArrowRight, Check, Shield } from 'lucide-react'
import {
  checkDisplayName, checkNameAvailable, createMember, saveMemberLocal,
} from '@/lib/community'

const DEFAULT_SETTINGS = {
  pillar_interests: false,
  finding_counts: false,
  reflections: false,
  learning_progress: false,
}

export default function CommunityOptInModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [availability, setAvailability] = useState({ status: 'idle', reason: null })
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  // Debounced availability check.
  useEffect(() => {
    setAvailability({ status: 'idle', reason: null })
    const s = name.trim()
    if (!s) return
    const local = checkDisplayName(s)
    if (!local.ok) { setAvailability({ status: 'invalid', reason: local.reason }); return }
    setAvailability({ status: 'checking', reason: null })
    const id = setTimeout(async () => {
      const r = await checkNameAvailable(s)
      setAvailability(r.available
        ? { status: 'available', reason: null }
        : { status: 'taken', reason: r.error || null })
    }, 350)
    return () => clearTimeout(id)
  }, [name])

  const canContinue1 = availability.status === 'available'

  // Read pillar interests from existing ss_interests (if any).
  const readInterests = () => {
    try { return JSON.parse(window.localStorage.getItem('ss_interests') || '[]') } catch { return [] }
  }

  const finishJoin = async () => {
    setSaving(true); setError(null)
    const { ok, member, error: err } = await createMember({
      displayName: name.trim(),
      settings,
      pillarInterests: readInterests(),
    })
    setSaving(false)
    if (!ok) { setError(err || 'Something went wrong. Please try again.'); return }
    saveMemberLocal({ displayName: member?.display_name || name.trim(), settings })
    onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 backdrop-blur-sm md:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ss-border-warm/70 px-4 py-3">
          <div>
            <div
              className="font-mono text-[10px] font-bold uppercase text-ss-teal"
              style={{ letterSpacing: '0.14em' }}
            >
              Anonymous community — step {step} of 3
            </div>
            <h2 className="text-lg font-extrabold text-ss-text">
              {step === 1 && 'Choose how you appear to others'}
              {step === 2 && 'What would you like to share?'}
              {step === 3 && 'Your privacy is protected'}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ss-muted hover:bg-ss-bg hover:text-ss-teal">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {step === 1 && (
            <>
              <p className="text-sm text-ss-muted">This is the only name the community will ever see. No real name, no email, nothing personal.</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/\s+/g, ''))}
                placeholder="e.g. WisconsinRunner, NightOwlMTHFR, HealthCurious42"
                maxLength={24}
                className="mt-3 w-full rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text placeholder:text-ss-muted focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
              />
              <div className="mt-1 min-h-[18px] text-[11px]">
                {availability.status === 'checking' && <span className="text-ss-muted">Checking…</span>}
                {availability.status === 'available' && <span className="font-semibold text-ss-green">✓ Available</span>}
                {availability.status === 'taken' && <span className="font-semibold text-red-600">✗ Taken — try another</span>}
                {availability.status === 'invalid' && <span className="text-red-600">{availability.reason}</span>}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-ss-muted">You control exactly what the community sees. You can change this any time.</p>
              <div className="mt-4 space-y-3">
                <ShareToggle label="My health pillar interests" desc="Shows which of the 10 pillars you are most focused on. Never shows findings." value={settings.pillar_interests} onChange={(v) => setSettings({ ...settings, pillar_interests: v })} />
                <ShareToggle label="Anonymous finding counts" desc="Shows how many findings you have in each pillar — not what those findings are." value={settings.finding_counts} onChange={(v) => setSettings({ ...settings, finding_counts: v })} />
                <ShareToggle label="My written reflections" desc="Journal entries and reflections you explicitly choose to share. Each post requires a separate share action." value={settings.reflections} onChange={(v) => setSettings({ ...settings, reflections: v })} />
                <ShareToggle label="My learning path progress" desc="Which learning paths you have started or completed." value={settings.learning_progress} onChange={(v) => setSettings({ ...settings, learning_progress: v })} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <ul className="space-y-2">
                <ConfirmRow text="Your display name is your only identifier" />
                <ConfirmRow text="Your raw genetic data never leaves your device" />
                <ConfirmRow text="You can leave the community at any time" />
                <ConfirmRow text="Your shared content is reviewed for safety" />
              </ul>
              <p className="mt-4 text-sm text-ss-muted">
                By joining you agree to our <Link href="/community-guidelines" className="text-ss-teal underline">Community Guidelines</Link>.
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-ss-border-warm/70 bg-ss-bg/60 px-4 py-3">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="rounded-full border border-ss-border-warm px-4 py-1.5 text-xs font-semibold text-ss-muted hover:bg-white hover:text-ss-text">
              Go back
            </button>
          ) : <span />}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canContinue1}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
                (step === 1 && !canContinue1) ? 'cursor-not-allowed bg-ss-border-warm' : 'bg-ss-teal hover:bg-ss-teal-dark'
              }`}
            >
              Continue <ArrowRight size={12} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={finishJoin}
              className="inline-flex items-center gap-1.5 rounded-full bg-ss-green px-5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Joining…' : 'Join the community'} <Shield size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ShareToggle({ label, desc, value, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[0.93rem] font-semibold text-ss-text">{label}</div>
        <div className="mt-0.5 text-[0.82rem] leading-snug text-ss-muted">{desc}</div>
      </div>
      <button
        type="button" role="switch" aria-checked={!!value}
        onClick={() => onChange(!value)}
        className={`relative mt-1 h-6 w-11 flex-shrink-0 rounded-full transition ${value ? 'bg-ss-green' : 'bg-ss-border-warm'}`}
      >
        <span aria-hidden="true" className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

function ConfirmRow({ text }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ss-green text-white">
        <Check size={12} strokeWidth={3} />
      </span>
      <span className="text-sm text-ss-text">{text}</span>
    </li>
  )
}
