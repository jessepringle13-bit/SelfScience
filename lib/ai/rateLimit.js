// /app/lib/ai/rateLimit.js
// Lightweight in-memory rate limiter for the AI Coach + Deep Research
// endpoints. Keyed by client-provided sessionId (never IP, so we don't
// keep any user-identifying data). Cleared on server restart — that's
// fine for a preview MVP, and can be swapped for Redis later.

const BUCKETS = new Map() // sessionId -> { count, resetAt, dailyReports? }

function now() { return Date.now() }

/**
 * Check + increment the per-session hourly counter. Returns
 * { allowed, remaining, resetAt }.
 */
export function checkCoachRate(sessionId, limit = 20, windowMs = 60 * 60 * 1000) {
  const id = String(sessionId || 'anon').slice(0, 80)
  const b = BUCKETS.get(id)
  if (!b || b.resetAt < now()) {
    const fresh = { count: 1, resetAt: now() + windowMs }
    BUCKETS.set(id, fresh)
    return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt }
  }
  if (b.count >= limit) return { allowed: false, remaining: 0, resetAt: b.resetAt }
  b.count += 1
  return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt }
}

/**
 * Deep Research daily budget — more expensive to run so a stricter cap.
 */
export function checkResearchRate(sessionId, limit = 3, windowMs = 24 * 60 * 60 * 1000) {
  const id = 'r:' + String(sessionId || 'anon').slice(0, 80)
  const b = BUCKETS.get(id)
  if (!b || b.resetAt < now()) {
    const fresh = { count: 1, resetAt: now() + windowMs }
    BUCKETS.set(id, fresh)
    return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt }
  }
  if (b.count >= limit) return { allowed: false, remaining: 0, resetAt: b.resetAt }
  b.count += 1
  return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt }
}
