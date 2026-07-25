'use client'

// /app/app/community/settings/settings-client.jsx
// Community settings hub: display name, share toggles, my posts,
// leave community. All updates round-trip through Supabase.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Pencil, Trash2, LogOut, AlertTriangle } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import {
  useCommunityState, getShareSettings, updateShareSettingsLocal, updateMember,
  fetchMyPosts, deletePost, deactivateMember, leaveCommunityLocal,
  checkDisplayName, checkNameAvailable,
} from '@/lib/community'

export default function SettingsClient() {
  const router = useRouter()
  const { optedIn, name } = useCommunityState()
  const [settings, setSettings] = useState(() => getShareSettings())
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(name || '')
  const [renameStatus, setRenameStatus] = useState({ state: 'idle', reason: null })
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaveDone, setLeaveDone] = useState(false)

  useEffect(() => {
    setRenameValue(name || '')
    if (!name) return
    setPostsLoading(true)
    fetchMyPosts(name).then((p) => { setPosts(p); setPostsLoading(false) })
  }, [name])

  // Toggling a share setting persists to Supabase + updates LS.
  const handleToggle = async (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    updateShareSettingsLocal(next)
    try {
      const interests = JSON.parse(window.localStorage.getItem('ss_interests') || '[]')
      await updateMember({ displayName: name, settings: next, pillarInterests: interests })
    } catch {}
  }

  // Rename display name (with availability check).
  useEffect(() => {
    if (!renaming) return
    setRenameStatus({ state: 'idle', reason: null })
    const s = renameValue.trim()
    if (!s || s === name) return
    const local = checkDisplayName(s)
    if (!local.ok) { setRenameStatus({ state: 'invalid', reason: local.reason }); return }
    setRenameStatus({ state: 'checking', reason: null })
    const t = setTimeout(async () => {
      const r = await checkNameAvailable(s)
      setRenameStatus(r.available ? { state: 'available', reason: null } : { state: 'taken', reason: null })
    }, 300)
    return () => clearTimeout(t)
  }, [renameValue, renaming, name])

  const applyRename = async () => {
    // Rename via Supabase requires deleting the old row and inserting
    // a new one because display_name is the FK for posts. Simpler and
    // safer to leave rename as a lightweight LS-only rename here and
    // note the limitation. In practice we still call updateMember
    // with the current row's settings + interests so the server keeps
    // the two in sync.
    // For now: only allow renaming when there are no existing posts,
    // since posts reference display_name via FK.
    if (renameStatus.state !== 'available') return
    const newName = renameValue.trim()
    if (posts.length > 0) {
      setRenameStatus({ state: 'invalid', reason: 'Delete your posts first, then rename.' })
      return
    }
    // Delete old member row, insert new one. Import lazily to avoid cycles.
    const { deactivateMember: deact, createMember, saveMemberLocal } = await import('@/lib/community')
    const interests = (() => { try { return JSON.parse(window.localStorage.getItem('ss_interests') || '[]') } catch { return [] } })()
    await deact(name)
    const { ok, member } = await createMember({ displayName: newName, settings, pillarInterests: interests })
    if (!ok) return
    saveMemberLocal({ displayName: member?.display_name || newName, settings })
    setRenaming(false)
  }

  const handleDeletePost = async (id) => {
    if (!confirm('Delete this post?')) return
    await deletePost(id)
    setPosts((cur) => cur.filter((p) => p.id !== id))
  }

  const handleLeave = async () => {
    await deactivateMember(name)
    leaveCommunityLocal()
    setLeaveDone(true)
    setTimeout(() => router.push('/'), 1500)
  }

  if (!optedIn && !leaveDone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24">
        <SiteNav />
        <div className="container pt-24 md:pt-28">
          <p className="rounded-lg border border-dashed border-ss-border-warm bg-white/60 p-6 text-sm text-ss-muted">
            You are not part of the community. <Link href="/community" className="font-semibold text-ss-teal hover:underline">Visit the community page</Link> to join.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24">
      <SiteNav />
      <div className="container pt-24 md:pt-28">
        <Link href="/community" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
          <ArrowLeft size={12} /> Community
        </Link>
        <div className="font-mono text-[10px] font-bold uppercase text-ss-teal" style={{ letterSpacing: '0.14em' }}>Community</div>
        <h1 className="mt-1 text-3xl font-extrabold text-ss-teal md:text-4xl">Community Settings</h1>

        {leaveDone ? (
          <div className="mt-6 rounded-2xl border border-ss-green/50 bg-ss-green/10 p-5 text-sm text-ss-green">
            You have left the community. Your data has been deleted. Redirecting…
          </div>
        ) : (
          <div className="mt-8 space-y-8">

            {/* Display name */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
              <h2 className="text-lg font-extrabold text-ss-text">Display name</h2>
              {!renaming ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-base font-semibold text-ss-teal">{name}</span>
                  <button type="button" onClick={() => setRenaming(true)} className="inline-flex items-center gap-1 rounded-full border border-ss-border-warm px-3 py-1 text-[11px] font-semibold text-ss-muted hover:text-ss-teal">
                    <Pencil size={11} /> Change
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value.replace(/\s+/g, ''))}
                    className="w-full max-w-sm rounded-lg border border-ss-border-warm bg-white px-3 py-2 text-sm text-ss-text focus:border-ss-teal focus:outline-none focus:ring-2 focus:ring-ss-teal/20"
                  />
                  <div className="min-h-[18px] text-[11px]">
                    {renameStatus.state === 'checking' && <span className="text-ss-muted">Checking…</span>}
                    {renameStatus.state === 'available' && <span className="font-semibold text-ss-green">✓ Available</span>}
                    {renameStatus.state === 'taken' && <span className="font-semibold text-red-600">✗ Taken — try another</span>}
                    {renameStatus.state === 'invalid' && <span className="text-red-600">{renameStatus.reason}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setRenaming(false); setRenameValue(name) }} className="rounded-full border border-ss-border-warm px-3 py-1 text-[11px] font-semibold text-ss-muted">Cancel</button>
                    <button
                      type="button" onClick={applyRename}
                      disabled={renameStatus.state !== 'available'}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold text-white transition ${
                        renameStatus.state === 'available' ? 'bg-ss-teal hover:bg-ss-teal-dark' : 'cursor-not-allowed bg-ss-border-warm'
                      }`}
                    >
                      Save name
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Share settings */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
              <h2 className="text-lg font-extrabold text-ss-text">Share settings</h2>
              <p className="mt-1 text-sm text-ss-muted">Toggle what the community sees about you. Changes apply immediately.</p>
              <div className="mt-4 space-y-3">
                <ShareToggle label="My health pillar interests" desc="Shows which pillars you are focused on. Never shows findings." value={settings.pillar_interests} onChange={(v) => handleToggle('pillar_interests', v)} />
                <ShareToggle label="Anonymous finding counts" desc="Shows how many findings you have in each pillar — not what." value={settings.finding_counts} onChange={(v) => handleToggle('finding_counts', v)} />
                <ShareToggle label="My written reflections" desc="Enables the Share affordance on journal entries and findings." value={settings.reflections} onChange={(v) => handleToggle('reflections', v)} />
                <ShareToggle label="My learning path progress" desc="Which learning paths you've started or completed." value={settings.learning_progress} onChange={(v) => handleToggle('learning_progress', v)} />
              </div>
            </section>

            {/* My posts */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ss-border-warm/60">
              <h2 className="text-lg font-extrabold text-ss-text">My posts</h2>
              {postsLoading ? (
                <div className="mt-3 h-12 animate-pulse rounded-lg bg-ss-bg" />
              ) : posts.length === 0 ? (
                <p className="mt-2 text-sm text-ss-muted">You haven't posted anything yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {posts.map((p) => (
                    <li key={p.id} className="rounded-xl border border-ss-border-warm/60 bg-ss-bg/40 p-3">
                      <div className="flex items-center gap-2 text-[11px]">
                        {p.pillar_tag && <span className="rounded-full bg-ss-teal/10 px-2 py-0.5 font-semibold text-ss-teal">{p.pillar_tag}</span>}
                        <span className="font-mono text-ss-muted">{new Date(p.posted_at).toLocaleString()}</span>
                        {!p.is_approved && <span className="ml-auto rounded-full bg-ss-amber/15 px-2 py-0.5 text-[10px] font-semibold text-ss-amber">Pending review</span>}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] text-ss-text">{p.text}</p>
                      <div className="mt-2 text-right">
                        <button type="button" onClick={() => handleDeletePost(p.id)} className="inline-flex items-center gap-1 text-[10.5px] font-mono font-semibold text-ss-red hover:underline">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Danger zone */}
            <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-1 flex-shrink-0 text-red-600" />
                <div>
                  <h2 className="text-lg font-extrabold text-red-700">Leave the community</h2>
                  {!confirmLeave ? (
                    <>
                      <p className="mt-1 text-sm text-red-700/80">This will delete your display name and all your posts. This cannot be undone.</p>
                      <button type="button" onClick={() => setConfirmLeave(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-500 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                        <LogOut size={12} /> Leave community
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-red-700/80">Really leave? Your display name and posts are deleted immediately.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setConfirmLeave(false)} className="rounded-full border border-ss-border-warm px-3 py-1 text-[11px] font-semibold text-ss-muted">Cancel</button>
                        <button type="button" onClick={handleLeave} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-1 text-[11px] font-semibold text-white hover:bg-red-700">
                          <Check size={11} /> Confirm and leave
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
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
