// /app/lib/supabase/admin-articles.js
// Server-only write-side helpers for the editorial `articles` table.
// Uses the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS — so callers
// MUST verify the admin session (see admin-auth.js) before invoking.

import 'server-only'
import { getSupabaseAdmin } from './server'
import { EDITORIAL_PILLARS } from './pillar-map'
import { isValidSlug } from '@/lib/slugify'

const ALL_FIELDS =
  'id, slug, title, authors, journal, publish_date, abstract, plain_terms_summary,' +
  ' doi, source_url, cover_image_url, pillars, tags, ai_reliability_score,' +
  ' evidence_quality, is_featured, is_published, created_at, updated_at'

const EVIDENCE_ENUM = new Set(['Settled', 'Emerging', 'Preliminary', 'Conflicting'])
const PILLAR_SET = new Set(EDITORIAL_PILLARS)

/** Coerce empty strings to null so we don't shove empty text into date/int columns. */
function nullIfBlank(v) {
  if (v === undefined || v === null) return null
  if (typeof v === 'string' && v.trim() === '') return null
  return v
}

/** Whitelist + normalize incoming article payload for insert/update. */
export function normalizeArticlePayload(input = {}, { partial = false } = {}) {
  const out = {}
  const errors = []

  if ('title' in input || !partial) {
    const title = String(input.title || '').trim()
    if (!title) errors.push('title is required')
    out.title = title
  }
  if ('slug' in input || !partial) {
    const slug = String(input.slug || '').trim().toLowerCase()
    if (!slug) errors.push('slug is required')
    else if (!isValidSlug(slug)) errors.push('slug must be lowercase alnum + hyphens (e.g. "my-article")')
    out.slug = slug
  }
  if ('authors' in input)             out.authors = nullIfBlank(input.authors)
  if ('journal' in input)             out.journal = nullIfBlank(input.journal)
  if ('publish_date' in input)        out.publish_date = nullIfBlank(input.publish_date)
  if ('abstract' in input)            out.abstract = nullIfBlank(input.abstract)
  if ('plain_terms_summary' in input) out.plain_terms_summary = nullIfBlank(input.plain_terms_summary)
  if ('doi' in input)                 out.doi = nullIfBlank(input.doi)
  if ('source_url' in input)          out.source_url = nullIfBlank(input.source_url)
  if ('cover_image_url' in input)     out.cover_image_url = nullIfBlank(input.cover_image_url)

  if ('pillars' in input) {
    const arr = Array.isArray(input.pillars) ? input.pillars : []
    const filtered = arr.map((p) => String(p).trim()).filter(Boolean)
    const invalid = filtered.filter((p) => !PILLAR_SET.has(p))
    if (invalid.length) errors.push(`invalid pillar(s): ${invalid.join(', ')}`)
    out.pillars = filtered.filter((p) => PILLAR_SET.has(p))
  }

  if ('tags' in input) {
    const arr = Array.isArray(input.tags) ? input.tags : []
    out.tags = arr.map((t) => String(t).trim()).filter(Boolean).slice(0, 40)
  }

  if ('ai_reliability_score' in input) {
    const raw = input.ai_reliability_score
    if (raw === null || raw === '' || raw === undefined) {
      out.ai_reliability_score = null
    } else {
      const n = Number(raw)
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 100) {
        errors.push('ai_reliability_score must be an integer 0-100')
      } else {
        out.ai_reliability_score = n
      }
    }
  }

  if ('evidence_quality' in input) {
    const v = nullIfBlank(input.evidence_quality)
    if (v && !EVIDENCE_ENUM.has(v)) {
      errors.push(`evidence_quality must be one of ${[...EVIDENCE_ENUM].join(', ')}`)
    }
    out.evidence_quality = v
  }

  if ('is_published' in input) out.is_published = !!input.is_published
  if ('is_featured'  in input) out.is_featured  = !!input.is_featured

  return { data: out, errors }
}

export async function listAllArticles({ limit = 500 } = {}) {
  const supa = getSupabaseAdmin()
  if (!supa) return { data: [], error: 'no-admin-client' }
  const { data, error } = await supa
    .from('articles')
    .select(ALL_FIELDS)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data || [], error: error?.message || null }
}

export async function getArticleById(id) {
  const supa = getSupabaseAdmin()
  if (!supa) return { data: null, error: 'no-admin-client' }
  const { data, error } = await supa
    .from('articles')
    .select(ALL_FIELDS)
    .eq('id', id)
    .maybeSingle()
  return { data: data || null, error: error?.message || null }
}

export async function createArticle(payload) {
  const supa = getSupabaseAdmin()
  if (!supa) return { data: null, error: 'no-admin-client' }
  const { data, error } = await supa
    .from('articles')
    .insert(payload)
    .select(ALL_FIELDS)
    .maybeSingle()
  return { data: data || null, error: error?.message || null }
}

export async function updateArticleById(id, payload) {
  const supa = getSupabaseAdmin()
  if (!supa) return { data: null, error: 'no-admin-client' }
  const { data, error } = await supa
    .from('articles')
    .update(payload)
    .eq('id', id)
    .select(ALL_FIELDS)
    .maybeSingle()
  return { data: data || null, error: error?.message || null }
}

export async function deleteArticleById(id) {
  const supa = getSupabaseAdmin()
  if (!supa) return { error: 'no-admin-client' }
  const { error } = await supa.from('articles').delete().eq('id', id)
  return { error: error?.message || null }
}

export async function slugExists(slug, { excludeId = null } = {}) {
  const supa = getSupabaseAdmin()
  if (!supa) return false
  let q = supa.from('articles').select('id').eq('slug', slug).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  const { data } = await q
  return Array.isArray(data) && data.length > 0
}

export async function bulkInsertArticles(rows) {
  const supa = getSupabaseAdmin()
  if (!supa) return { data: [], error: 'no-admin-client' }
  const { data, error } = await supa
    .from('articles')
    .insert(rows)
    .select('id, slug, title')
  return { data: data || [], error: error?.message || null }
}
