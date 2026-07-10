import { Search, Home } from 'lucide-react'
import SiteFooter from '@/components/site-footer'

export const metadata = {
  title: 'Page Not Found',
  description: 'The page you were looking for could not be found.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ss-bg text-ss-text">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <div className="text-6xl font-extrabold text-ss-teal">404</div>
          <h1 className="mt-3 text-2xl font-bold text-ss-teal">Page not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-ss-muted">
            We couldn&apos;t find that page. Try searching the research directly, or head back to the
            homepage.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/search"
              className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-ss-orange-dark"
            >
              <Search size={14} /> Search research
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-ss-teal px-4 py-2 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
            >
              <Home size={14} /> Back home
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
