/**
 * Tiny in-memory TTL cache used by /api/search to shield upstream biomedical
 * APIs (PubMed / Semantic Scholar / OpenAlex / Crossref) from repeat requests.
 *
 * Design notes:
 *   - Per-process (Node) — no Redis dependency for MVP.
 *   - Bounded via LRU-ish size cap so a spike of unique searches can't OOM us.
 *   - TTL is checked on read AND periodically swept, so expired entries don't
 *     linger indefinitely if a key is never re-requested.
 *   - Values are stored as-is (we clone-by-JSON on set/get to prevent callers
 *     from mutating cached rows).
 */

const DEFAULT_MAX = 500                     // ~500 cached responses is plenty
const SWEEP_INTERVAL_MS = 5 * 60 * 1000     // sweep expired keys every 5 min

class TTLCache {
  constructor(maxSize = DEFAULT_MAX) {
    this.maxSize = maxSize
    /** @type {Map<string, {value: any, expiresAt: number}>} */
    this.map = new Map()
    this._lastSweep = Date.now()
  }

  _sweepIfDue() {
    const now = Date.now()
    if (now - this._lastSweep < SWEEP_INTERVAL_MS) return
    this._lastSweep = now
    for (const [k, entry] of this.map) {
      if (entry.expiresAt <= now) this.map.delete(k)
    }
  }

  get(key) {
    this._sweepIfDue()
    const entry = this.map.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key)
      return null
    }
    // Move to the "most recent" position (LRU touch).
    this.map.delete(key)
    this.map.set(key, entry)
    // Deep clone so callers can't mutate the cached copy.
    try { return JSON.parse(JSON.stringify(entry.value)) } catch { return entry.value }
  }

  set(key, value, ttlMs) {
    this._sweepIfDue()
    // Enforce LRU cap: drop the oldest key first.
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }
    let stored
    try { stored = JSON.parse(JSON.stringify(value)) } catch { stored = value }
    this.map.set(key, { value: stored, expiresAt: Date.now() + ttlMs })
  }

  size() { return this.map.size }
  clear() { this.map.clear() }
}

/**
 * Reuse a single instance across hot-reloads in dev by pinning it to
 * globalThis. This means /api/search cache survives file edits without
 * needing a server restart, and avoids per-module-instance duplication.
 */
const GLOBAL_KEY = '__ss_search_cache__'
export const searchCache = /** @type {TTLCache} */ (
  globalThis[GLOBAL_KEY] || (globalThis[GLOBAL_KEY] = new TTLCache(500))
)

/** Convenience: build a stable, order-independent cache key from an object. */
export function makeCacheKey(prefix, params) {
  const keys = Object.keys(params).sort()
  const pairs = keys
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${String(params[k]).toLowerCase().trim()}`)
  return `${prefix}::${pairs.join('&')}`
}
