// /app/lib/supabase/client.js
// Browser-safe Supabase client using the anon key.
// RLS enforces public reads to `is_published = true` on the articles table.
// Safe to import in client components. No secrets exposed.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

let _client = null

/**
 * Returns a memoized Supabase client. Returns null (and logs once) if
 * Supabase env vars aren't set — callers should treat null as "editorial
 * feature disabled" and fall back to external results only.
 */
export function getSupabaseClient() {
  if (_client) return _client
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — editorial features disabled.')
    }
    return null
  }
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return _client
}

export const supabase = getSupabaseClient()
