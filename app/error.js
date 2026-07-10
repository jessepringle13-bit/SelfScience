'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCw, Home } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[SelfScience] Unhandled error:', error)
    }
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-ss-bg px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ss-orange/10 text-ss-orange">
          <AlertTriangle size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-ss-teal">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-ss-muted">
          The page hit an unexpected error. This is usually a temporary hiccup with one of our research
          providers. You can try again, or head back home.
        </p>
        {error?.digest && (
          <p className="mt-2 text-[11px] font-mono text-ss-muted/70">ref: {error.digest}</p>
        )}
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
      </div>
    </main>
  )
}
