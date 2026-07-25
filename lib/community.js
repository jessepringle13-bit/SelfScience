'use client'

// /app/lib/community.js
// SelfScience Community layer — client-side helpers over Supabase.
// All PII/profanity moderation runs on-device before any insert.
// The user's real name, genome, rsIDs, and genotypes are NEVER sent.

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getGenomeResults } from '@/lib/genomeSession'
import { flattenReportCards } from '@/lib/supplementProtocol'

/* ------------------------- localStorage keys ------------------------- */

const LS_OPTED_IN = 'ss_community_opted_in'
const LS_NAME     = 'ss_community_display_name'
const LS_SHARE    = 'ss_community_share_settings'
const LS_PROMPT_DISMISSED = 'ss_community_prompt_dismissed'
const LS_PROMPT_DISMISSED_COUNT = 'ss_community_prompt_dismissed_count'
const LS_LAST_SESSION_DATE = 'ss_last_session_date'
const LS_SESSION_COUNT = 'ss_session_count'
const LS_HELPFUL_POSTS = 'ss_community_helpful_posts' // JSON array of post ids reacted to

export const CHANGE_EVENT = 'selfscience:community-changed'

/* ------------------------- Session counter --------------------------- */
// Increments once per calendar day.
function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function bumpSessionCounterOnce() {
  if (typeof window === 'undefined') return 0
  try {
    const last = window.localStorage.getItem(LS_LAST_SESSION_DATE)
    const today = todayKey()
    if (last === today) return Number(window.localStorage.getItem(LS_SESSION_COUNT) || '1')
    const n = Number(window.localStorage.getItem(LS_SESSION_COUNT) || '0') + 1
    window.localStorage.setItem(LS_LAST_SESSION_DATE, today)
    window.localStorage.setItem(LS_SESSION_COUNT, String(n))
    return n
  } catch { return 0 }
}
export function getSessionCount() {
  if (typeof window === 'undefined') return 0
  try { return Number(window.localStorage.getItem(LS_SESSION_COUNT) || '0') } catch { return 0 }
}

/* ------------------------- Opt-in state ------------------------------ */

export function isOptedIn() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(LS_OPTED_IN) === 'true' } catch { return false }
}
export function getDisplayName() {
  if (typeof window === 'undefined') return null
  try { return window.localStorage.getItem(LS_NAME) } catch { return null }
}
export function getShareSettings() {
  if (typeof window === 'undefined') return { pillar_interests: false, finding_counts: false, reflections: false, learning_progress: false }
  try {
    const raw = window.localStorage.getItem(LS_SHARE)
    return raw ? JSON.parse(raw) : { pillar_interests: false, finding_counts: false, reflections: false, learning_progress: false }
  } catch { return { pillar_interests: false, finding_counts: false, reflections: false, learning_progress: false } }
}
function fireChange() {
  try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)) } catch {}
}
export function saveMemberLocal({ displayName, settings }) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_OPTED_IN, 'true')
    window.localStorage.setItem(LS_NAME, displayName)
    window.localStorage.setItem(LS_SHARE, JSON.stringify(settings || {}))
    fireChange()
  } catch {}
}
export function updateShareSettingsLocal(settings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_SHARE, JSON.stringify(settings || {}))
    fireChange()
  } catch {}
}
export function leaveCommunityLocal() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LS_OPTED_IN)
    window.localStorage.removeItem(LS_NAME)
    window.localStorage.removeItem(LS_SHARE)
    fireChange()
  } catch {}
}

/* --------------------- Prompt dismissal tracking --------------------- */

export function isPromptDismissed() {
  if (typeof window === 'undefined') return false
  try {
    const cnt = Number(window.localStorage.getItem(LS_PROMPT_DISMISSED_COUNT) || '0')
    if (cnt >= 3) return true
    const iso = window.localStorage.getItem(LS_PROMPT_DISMISSED)
    if (!iso) return false
    const t = Date.parse(iso)
    if (!Number.isFinite(t)) return false
    const days = (Date.now() - t) / (1000 * 60 * 60 * 24)
    return days < 14
  } catch { return false }
}
export function dismissPrompt() {
  if (typeof window === 'undefined') return
  try {
    const cnt = Number(window.localStorage.getItem(LS_PROMPT_DISMISSED_COUNT) || '0')
    window.localStorage.setItem(LS_PROMPT_DISMISSED_COUNT, String(cnt + 1))
    window.localStorage.setItem(LS_PROMPT_DISMISSED, new Date().toISOString())
    fireChange()
  } catch {}
}

/* -------------------- Prompt gating (Dashboard) ---------------------- */
// Show prompt only after: First Insight seen AND >= 3 findings expanded AND 2+ sessions
export function shouldShowOptInPrompt() {
  if (typeof window === 'undefined') return false
  if (isOptedIn()) return false
  if (isPromptDismissed()) return false
  if (getSessionCount() < 2) return false
  const insightSeen = !!window.localStorage.getItem('ss_first_insight_seen') || !!window.localStorage.getItem('ss_orientation_seen')
  if (!insightSeen) return false
  let expanded = []
  try { expanded = JSON.parse(window.localStorage.getItem('ss_findings_expanded') || '[]') } catch {}
  if (!Array.isArray(expanded) || expanded.length < 3) return false
  return true
}

/* --------------------------- PII / profanity ------------------------- */

const PROFANITY = ['fuck','shit','cunt','bitch','asshole','bastard','nigger','faggot','retard']
const EMAIL_RE  = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
const PHONE_RE  = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/
const URL_RE    = /(?:https?:\/\/|www\.)[^\s]{3,}/i
const SELF_NAME_RE = /\b(?:i\s?am|my\s+name\s+is)\s+[A-Z][a-z]{2,}/i

export function checkContent(text = '') {
  const trimmed = String(text).trim()
  if (!trimmed) return { ok: false, reason: 'Please write something to share.' }
  if (trimmed.length > 280) return { ok: false, reason: 'Max 280 characters.' }
  const lower = trimmed.toLowerCase()
  if (PROFANITY.some((w) => new RegExp(`\\b${w}s?\\b`, 'i').test(lower))) {
    return { ok: false, reason: 'Please rephrase without offensive language.' }
  }
  if (EMAIL_RE.test(trimmed))    return { ok: false, reason: 'Please remove email addresses before sharing.' }
  if (PHONE_RE.test(trimmed))    return { ok: false, reason: 'Please remove phone numbers before sharing.' }
  if (URL_RE.test(trimmed))      return { ok: false, reason: 'Please remove URLs before sharing.' }
  if (SELF_NAME_RE.test(trimmed)) return { ok: false, reason: 'Please avoid sharing your real name.' }
  return { ok: true }
}

export function checkDisplayName(name = '') {
  const s = String(name).trim()
  if (s.length < 3 || s.length > 24) return { ok: false, reason: '3–24 characters.' }
  if (!/^[a-z0-9-]+$/i.test(s))      return { ok: false, reason: 'Letters, numbers, and hyphens only.' }
  if (EMAIL_RE.test(s) || PHONE_RE.test(s) || URL_RE.test(s)) return { ok: false, reason: 'No emails, phones, or URLs.' }
  return { ok: true }
}

/* --------------------------- Supabase ops --------------------------- */

/* Collect anonymized plain-English finding labels from the local
 * genome results. Returns a deduplicated array of card.name strings
 * (e.g. ["MTHFR C677T", "ACTN3 sprint variant"]). Never emits rsID
 * or genotype. Used only when share_settings.finding_counts=true. */
export function collectAnonymousFindingLabels() {
  if (typeof window === 'undefined') return []
  const report = getGenomeResults()
  if (!report) return []
  const cards = flattenReportCards(report)
  const seen = new Set()
  const out = []
  for (const c of cards) {
    // We use the human-readable finding NAME only. The name label is
    // shared by every user whose genome surfaces the same variant, so
    // it enables aggregate counts without revealing genotype.
    const name = String(c?.name || '').trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= 100) break // hard cap
  }
  return out
}

export async function checkNameAvailable(name) {
  const s = getSupabaseClient(); if (!s) return { available: false, error: 'offline' }
  const { data, error } = await s.from('community_members').select('display_name').eq('display_name', name).limit(1)
  if (error) return { available: false, error: error.message }
  return { available: !data || data.length === 0 }
}

export async function createMember({ displayName, settings, pillarInterests = [] }) {
  const s = getSupabaseClient(); if (!s) return { ok: false, error: 'offline' }
  const findingLabels = settings?.finding_counts ? collectAnonymousFindingLabels() : []
  const { data, error } = await s.from('community_members').insert({
    display_name: displayName,
    share_settings: settings || {},
    pillar_interests: settings?.pillar_interests ? pillarInterests : [],
    finding_labels: findingLabels,
  }).select().single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, member: data }
}

export async function updateMember({ displayName, settings, pillarInterests }) {
  const s = getSupabaseClient(); if (!s) return { ok: false, error: 'offline' }
  const patch = {}
  if (settings) patch.share_settings = settings
  if (Array.isArray(pillarInterests)) patch.pillar_interests = settings?.pillar_interests ? pillarInterests : []
  if (settings) patch.finding_labels = settings.finding_counts ? collectAnonymousFindingLabels() : []
  const { error } = await s.from('community_members').update(patch).eq('display_name', displayName)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/* Re-sync only finding labels (called when genome data changes and
 * the user is opted-in with finding_counts=true). */
export async function syncFindingLabels(displayName) {
  const s = getSupabaseClient(); if (!s) return { ok: false }
  const labels = collectAnonymousFindingLabels()
  const { error } = await s.from('community_members').update({ finding_labels: labels }).eq('display_name', displayName)
  return { ok: !error }
}

export async function deactivateMember(displayName) {
  const s = getSupabaseClient(); if (!s) return { ok: false, error: 'offline' }
  // Soft-delete: set is_active=false + delete posts, cascade will remove reactions/reports.
  await s.from('community_posts').update({ is_deleted: true }).eq('display_name', displayName)
  const { error } = await s.from('community_members').delete().eq('display_name', displayName)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchMemberCount() {
  const s = getSupabaseClient(); if (!s) return 0
  const { count, error } = await s.from('community_members').select('id', { count: 'exact', head: true }).eq('is_active', true)
  if (error) return 0
  return count || 0
}

export async function fetchPillarPopularity() {
  const s = getSupabaseClient(); if (!s) return { total: 0, buckets: {} }
  const { data, error } = await s.from('community_members').select('pillar_interests').eq('is_active', true)
  if (error || !data) return { total: 0, buckets: {} }
  const buckets = {}
  for (const m of data) {
    for (const p of (m.pillar_interests || [])) buckets[p] = (buckets[p] || 0) + 1
  }
  return { total: data.length, buckets }
}

/* Compute % of opted-in members whose finding_labels array contains
 * each of the caller-supplied labels. Returns:
 *   { totalMembers, minSample, rows: [{ label, count, percent, ok }] }
 * `ok` is true only when totalMembers >= minSample (spec: 50). Below
 * that threshold, callers should suppress the numeric percentage
 * per privacy rule 5. */
export async function fetchFindingFrequencies(labels, minSample = 50) {
  const s = getSupabaseClient()
  if (!s || !labels?.length) return { totalMembers: 0, minSample, rows: [] }
  const { data, error } = await s.from('community_members')
    .select('finding_labels')
    .eq('is_active', true)
  if (error || !data) return { totalMembers: 0, minSample, rows: [] }
  const totalMembers = data.length
  // Normalize case-insensitive lookup.
  const lowerToOriginal = new Map(labels.map((l) => [String(l).toLowerCase(), l]))
  const counts = new Map(labels.map((l) => [l, 0]))
  for (const m of data) {
    const seen = new Set()
    for (const lbl of (m.finding_labels || [])) {
      const orig = lowerToOriginal.get(String(lbl).toLowerCase())
      if (!orig || seen.has(orig)) continue
      seen.add(orig)
      counts.set(orig, (counts.get(orig) || 0) + 1)
    }
  }
  const rows = labels.map((label) => {
    const count = counts.get(label) || 0
    const percent = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
    return { label, count, percent, ok: totalMembers >= minSample }
  })
  return { totalMembers, minSample, rows }
}

export async function fetchFeed({ limit = 10, offset = 0, pillar = null } = {}) {
  const s = getSupabaseClient(); if (!s) return { posts: [] }
  let q = s.from('community_posts')
    .select('id, display_name, text, pillar_tag, posted_at')
    .eq('is_approved', true).eq('is_deleted', false)
    .order('posted_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (pillar && pillar !== 'all') q = q.eq('pillar_tag', pillar)
  const { data, error } = await q
  if (error) return { posts: [] }
  if (!data || !data.length) return { posts: [] }
  // Attach reaction counts + whether the current user reacted.
  const ids = data.map((p) => p.id)
  const { data: counts } = await s.from('community_reaction_counts').select('post_id, helpful_count').in('post_id', ids)
  const countMap = new Map((counts || []).map((r) => [r.post_id, r.helpful_count]))
  const mine = new Set(readReactedPosts())
  return { posts: data.map((p) => ({
    ...p, helpful_count: countMap.get(p.id) || 0, reacted_by_me: mine.has(p.id),
  })) }
}

export async function fetchMyPosts(displayName) {
  const s = getSupabaseClient(); if (!s) return []
  const { data } = await s.from('community_posts')
    .select('id, text, pillar_tag, posted_at, is_approved, is_deleted')
    .eq('display_name', displayName).eq('is_deleted', false)
    .order('posted_at', { ascending: false })
  return data || []
}

export async function createPost({ displayName, text, pillarTag }) {
  const check = checkContent(text)
  if (!check.ok) return { ok: false, error: check.reason }
  const s = getSupabaseClient(); if (!s) return { ok: false, error: 'offline' }
  const { data, error } = await s.from('community_posts').insert({
    display_name: displayName,
    text: text.trim(),
    pillar_tag: pillarTag || null,
    is_approved: true, // Auto-approve if filter passed (per product decision)
  }).select().single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, post: data }
}

export async function deletePost(id) {
  const s = getSupabaseClient(); if (!s) return { ok: false }
  const { error } = await s.from('community_posts').update({ is_deleted: true }).eq('id', id)
  return { ok: !error, error: error?.message }
}

/* Reactions: one per (post, reactor). We also track locally to give
 * instant UI feedback and support toggling without a round trip. */
function readReactedPosts() {
  if (typeof window === 'undefined') return []
  try { const a = JSON.parse(window.localStorage.getItem(LS_HELPFUL_POSTS) || '[]'); return Array.isArray(a) ? a : [] } catch { return [] }
}
function writeReactedPosts(list) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_HELPFUL_POSTS, JSON.stringify(list)) } catch {}
}
export async function toggleReaction(postId, displayName) {
  const s = getSupabaseClient(); if (!s) return { ok: false }
  const cur = new Set(readReactedPosts())
  if (cur.has(postId)) {
    cur.delete(postId); writeReactedPosts([...cur])
    await s.from('community_reactions').delete().eq('post_id', postId).eq('reactor_name', displayName)
    return { ok: true, reacted: false }
  }
  cur.add(postId); writeReactedPosts([...cur])
  const { error } = await s.from('community_reactions').insert({ post_id: postId, reactor_name: displayName })
  // On dup-key error the client already thinks it's reacted — fine.
  return { ok: !error || String(error?.message || '').includes('duplicate'), reacted: true }
}

export async function reportPost({ postId, reporterName, reason }) {
  const s = getSupabaseClient(); if (!s) return { ok: false }
  const { error } = await s.from('community_reports').insert({ post_id: postId, reporter_name: reporterName || null, reason })
  return { ok: !error, error: error?.message }
}

/* --------------------------- Hooks ---------------------------------- */

export function useCommunityState() {
  const [state, setState] = useState({ optedIn: false, name: null, settings: {} })
  useEffect(() => {
    const load = () => setState({ optedIn: isOptedIn(), name: getDisplayName(), settings: getShareSettings() })
    load()
    const onChange = () => load()
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return state
}

/**
 * Fires syncFindingLabels() whenever the genome changes AND the user
 * is an opted-in member with finding_counts=true. Mount this hook
 * once from a top-level client (we mount from the community page and
 * the settings page \u2014 both are the natural touch-points).
 */
export function useAutoSyncFindingLabels() {
  useEffect(() => {
    let cancelled = false
    const maybeSync = async () => {
      if (cancelled) return
      const optedIn = isOptedIn()
      const name = getDisplayName()
      const settings = getShareSettings()
      if (optedIn && name && settings?.finding_counts) {
        await syncFindingLabels(name)
      }
    }
    // Run once on mount + whenever genome / community state changes.
    maybeSync()
    const onGenome = () => maybeSync()
    const onCommunity = () => maybeSync()
    window.addEventListener('selfscience:genome-changed', onGenome)
    window.addEventListener(CHANGE_EVENT, onCommunity)
    return () => {
      cancelled = true
      window.removeEventListener('selfscience:genome-changed', onGenome)
      window.removeEventListener(CHANGE_EVENT, onCommunity)
    }
  }, [])
}

export function useMemberCount() {
  const [n, setN] = useState(0)
  useEffect(() => { fetchMemberCount().then(setN).catch(() => setN(0)) }, [])
  return n
}

export function roundToNearest50(n) {
  return Math.max(0, Math.round(n / 50) * 50)
}
