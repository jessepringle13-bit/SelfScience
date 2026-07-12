'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RotateCw, Home } from 'lucide-react'

// Detect Next.js dev-server chunk-load races. When the server rebuilds
// during development it invalidates the previous chunk hashes; any
// still-loaded page trying to code-split will hit a ChunkLoadError.
// The correct recovery is a hard reload — the browser picks up the fresh
// manifest and everything works again.
function isChunkLoadError(err) {
  if (!err) return false
  const msg = String(err.message || err.name || err)
  return (
    err.name === 'ChunkLoadError' ||
    /Loading chunk .* failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg)
  )
}

export default function GlobalError({ error, reset }) {
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    console.error('[SelfScience] Unhandled error:', error)

    // Auto-recover from chunk load races by forcing a hard reload.
    if (isChunkLoadError(error)) {
      setReloading(true)
      // Small delay so the user sees the "Reloading…" state instead of a
      // jarring instant flash.
      const t = setTimeout(() => window.location.reload(), 300)
      return () => clearTimeout(t)
    }
  }, [error])

  const chunk = isChunkLoadError(error)

  return (
    <main className="flex min-h-screen items-center justify-center bg-ss-bg px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ss-orange/10 text-ss-orange">
          {reloading ? <RotateCw size={24} className="animate-spin" /> : <AlertTriangle size={24} />}
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-ss-teal">
          {chunk ? 'Refreshing…' : 'Something went wrong'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ss-muted">
          {chunk
            ? 'A newer version of the app is available. We\u2019re reloading the page for you — this will take a moment.'
            : 'The page hit an unexpected error. This is usually a temporary hiccup with one of our research providers. You can try again, or head back home.'}
        </p>
        {error?.digest && (
          <p className="mt-2 text-[11px] font-mono text-ss-muted/70">ref: {error.digest}</p>
        )}
        {!chunk && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-ss-orange-dark"
            >
              <RotateCw size={14} /> Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
            >
              <Home size={14} /> Back home
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
