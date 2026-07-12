// /app/app/articles/[slug]/not-found.jsx
// Rendered by Next.js when getArticleBySlug returns null (missing or
// unpublished). Kept minimal and stylistically aligned with the rest
// of the site.

import Link from 'next/link'
import SiteNav from '@/components/site-nav'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      <SiteNav />
      <div className="container flex min-h-[60vh] flex-col items-center justify-center pt-24 text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ss-orange">
          404 · Not found
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">
          This article is unavailable.
        </h1>
        <p className="mt-3 max-w-md text-sm text-ss-muted">
          It may have moved, been renamed, or not yet been published. Try searching for the topic instead.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="rounded-full border-2 border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal hover:bg-ss-teal hover:text-white"
          >
            Back to home
          </Link>
          <Link
            href="/search"
            className="rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ss-orange-dark"
          >
            Search research
          </Link>
        </div>
      </div>
    </main>
  )
}
