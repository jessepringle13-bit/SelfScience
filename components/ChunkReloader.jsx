'use client'

// /app/components/ChunkReloader.jsx
// Global listener that force-reloads the page when a Next.js code-split
// chunk fails to load. This is a dev-server race condition (server rebuild
// invalidates chunk hashes while the browser still holds stale references)
// but can also happen in production if a deploy ships between the initial
// HTML and a subsequent navigation.
//
// Listens for both `error` (script-load failures) and `unhandledrejection`
// (dynamic-import promise rejections) at the window level, so we catch
// ChunkLoadErrors that happen during route transitions BEFORE React's
// error boundary in /app/error.js sees them.

import { useEffect } from 'react'

const CHUNK_RE = /Loading chunk .* failed|ChunkLoadError|Failed to fetch dynamically imported module/i

function isChunkErr(x) {
  if (!x) return false
  if (x.name === 'ChunkLoadError') return true
  const msg = String(x.message || x.reason?.message || x.reason || x)
  return CHUNK_RE.test(msg)
}

export default function ChunkReloader() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // A single per-session flag so a runaway loop can't reload us to death.
    const KEY = 'ss_chunk_reload_once'
    let reloading = false

    const bail = () => {
      if (reloading) return
      if (sessionStorage.getItem(KEY) === '1') {
        // Already reloaded once this session — don't loop; let the app
        // surface the error boundary instead.
        return
      }
      reloading = true
      try { sessionStorage.setItem(KEY, '1') } catch { /* noop */ }
      // Small delay so we don't fight another in-flight request.
      setTimeout(() => window.location.reload(), 250)
    }

    const onError = (evt) => { if (isChunkErr(evt?.error || evt)) bail() }
    const onRej   = (evt) => { if (isChunkErr(evt?.reason || evt)) bail() }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRej)

    // Clear the once-per-session guard after a full minute so a genuinely
    // recoverable chunk race doesn't get stuck.
    const clearT = setTimeout(() => {
      try { sessionStorage.removeItem(KEY) } catch { /* noop */ }
    }, 60_000)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRej)
      clearTimeout(clearT)
    }
  }, [])

  return null
}
