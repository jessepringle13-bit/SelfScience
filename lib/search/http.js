// /app/lib/search/http.js
// Shared HTTP helpers for the SelfScience search adapters.
// Extracted from the old catch-all /app/app/api/[[...path]]/route.js
// during the 2026-07 search refactor.

export async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function safeText(res) {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

/**
 * fetch() with a hard timeout. Any biomedical API that hasn't returned
 * headers by the timeout is aborted, ensuring the parent /api/search call
 * never runs past the ingress 60s cap because one provider (looking at
 * you, Crossref) decided to hang.
 *
 * Callers should still wrap in try/catch and treat AbortError as "no
 * results" — the existing per-provider handlers already do this.
 */
export async function fetchWithTimeout(url, options = {}, ms = 12_000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}
