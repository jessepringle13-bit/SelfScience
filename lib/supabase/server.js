// /app/lib/supabase/server.js
// Server-only Supabase admin client using the service-role key.
// BYPASSES ROW LEVEL SECURITY — must NEVER be imported into client code.
// Only used inside /api/admin/* route handlers after admin password check.

import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let _adminClient = null

/**
 * Returns a memoized service-role Supabase client, or null if the
 * service-role key is not configured. Callers must handle null by
 * returning a 503 to the admin UI.
 */
export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient
  if (!supabaseUrl || !supabaseServiceRoleKey) return null
  _adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return _adminClient
}

/**
 * Public-read server client using the anon key. Used from server
 * components (e.g. /articles/[slug]/page.jsx) so we can render with
 * SSR while still respecting RLS (only published articles visible).
 */
let _publicServerClient = null
export function getSupabasePublicServer() {
  if (_publicServerClient) return _publicServerClient
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !anonKey) return null
  _publicServerClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return _publicServerClient
}
