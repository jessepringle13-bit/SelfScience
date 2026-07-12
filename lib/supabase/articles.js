// /app/lib/supabase/articles.js
// Public read-side data-access helpers for the editorial `articles`
// table. Uses the anon key + RLS, so callers can never accidentally
// pull unpublished drafts. Safe to import from server or client code.
//
// All functions return { data, error } shape or [] on failure —
// callers should treat Supabase failure as "no editorial content"
// and continue rendering external results.

import { getSupabaseClient } from './client'
import { toShortPillar } from './pillar-map'

/** Fields returned to the public site (excludes internal timestamps). */
const PUBLIC_FIELDS =
  'id, slug, title, authors, journal, publish_date, abstract, plain_terms_summary,' +
  ' doi, source_url, cover_image_url, pillars, tags, ai_reliability_score,' +
  ' evidence_quality, is_featured, created_at'

/**
 * Return the first article matching `slug`, or null if none exists
 * (or if it exists but is unpublished — RLS filters that out).
 */
export async function getArticleBySlug(slug) {
  const supabase = getSupabaseClient()
  if (!supabase || !slug) return null
  try {
    const { data, error } = await supabase
      .from('articles')
      .select(PUBLIC_FIELDS)
      .eq('slug', slug)
      .maybeSingle()
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[supabase.getArticleBySlug] error:', error.message)
      return null
    }
    return data || null
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[supabase.getArticleBySlug] threw:', e?.message)
    return null
  }
}

/**
 * Return featured, published articles ordered by newest first.
 * Silently returns [] on failure.
 */
export async function getFeaturedArticles(limit = 6) {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('articles')
      .select(PUBLIC_FIELDS)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

/**
 * Full-text search over the generated `fts` tsvector column, optionally
 * narrowed by pillar. Featured results are sorted to the top.
 *
 * @param {object} opts
 * @param {string} [opts.query]  - Free-text query, or empty for pillar browse
 * @param {string} [opts.pillar] - Short OR long pillar name (either works)
 * @param {number} [opts.limit]  - Max results (default 12)
 */
export async function searchArticles({ query = '', pillar = '', limit = 12 } = {}) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const q = String(query || '').trim()
  const shortPillar = toShortPillar(pillar)

  // If nothing to filter on, don't return a firehose — hide the section.
  if (!q && !shortPillar) return []

  try {
    let builder = supabase
      .from('articles')
      .select(PUBLIC_FIELDS)
      // is_published enforced by RLS but explicit for clarity
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (q) {
      // supabase-js `textSearch` → Postgres @@ operator on the tsvector.
      // Escape single quotes so a query like O'Brien doesn't break syntax;
      // `websearch` type also tolerates most user punctuation naturally.
      const safeQ = q.replace(/'/g, "''")
      builder = builder.textSearch('fts', safeQ, { type: 'websearch', config: 'english' })
    }

    if (shortPillar) {
      builder = builder.contains('pillars', [shortPillar])
    }

    const { data, error } = await builder
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[supabase.searchArticles] error:', error.message)
      return []
    }
    return data || []
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[supabase.searchArticles] threw:', e?.message)
    return []
  }
}

/** Lightweight connection check for /api/editorial/health. */
export async function pingArticlesTable() {
  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, reason: 'no-client', count: 0 }
  try {
    const { count, error } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
    if (error) return { ok: false, reason: error.message, count: 0 }
    return { ok: true, count: count ?? 0 }
  } catch (e) {
    return { ok: false, reason: e?.message || 'unknown', count: 0 }
  }
}
