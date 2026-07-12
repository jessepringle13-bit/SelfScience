// /app/lib/admin-auth.js
// Simple password-gated admin session for /admin/*.
//
// Cookie value = SHA-256(ADMIN_PASSWORD). On every admin API call we
// recompute the hash and compare to the cookie. If they match, the
// caller has proven they know the password. Cookie is httpOnly +
// secure + sameSite=lax so JS can't read it and cross-site requests
// can't forge it.
//
// Not intended for multi-user admin — this is a shared-password
// system for a single editor role.

import 'server-only'
import { createHash, timingSafeEqual } from 'crypto'

export const ADMIN_COOKIE = 'ss_admin_session'

function sha256(str) {
  return createHash('sha256').update(String(str)).digest('hex')
}

/** Returns the expected cookie value for the currently-configured password. */
export function expectedSessionToken() {
  const pw = process.env.ADMIN_PASSWORD || ''
  if (!pw) return null
  return sha256(pw)
}

/**
 * Verify the supplied plaintext password against ADMIN_PASSWORD.
 * Uses timingSafeEqual to avoid timing side-channels.
 */
export function verifyPassword(plaintext) {
  const pw = process.env.ADMIN_PASSWORD || ''
  if (!pw || !plaintext) return false
  const a = Buffer.from(sha256(pw), 'hex')
  const b = Buffer.from(sha256(plaintext), 'hex')
  if (a.length !== b.length) return false
  try { return timingSafeEqual(a, b) } catch { return false }
}

/**
 * Check a Request/NextRequest for a valid admin session cookie.
 * Returns boolean; does not throw.
 */
export function isAdminAuthenticated(request) {
  try {
    const expected = expectedSessionToken()
    if (!expected) return false
    // NextRequest exposes .cookies.get(name).value; standard Request needs header parse
    let token = null
    if (request?.cookies?.get) {
      token = request.cookies.get(ADMIN_COOKIE)?.value || null
    } else {
      const cookieHeader = request?.headers?.get?.('cookie') || ''
      const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${ADMIN_COOKIE}=`))
      token = match ? decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1)) : null
    }
    if (!token) return false
    const a = Buffer.from(expected, 'hex')
    let b
    try { b = Buffer.from(token, 'hex') } catch { return false }
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
