// /app/offline/page.js
// Fallback UI when the user is offline and the requested page isn't cached.
export const metadata = { title: 'Offline — SelfScience' }

export default function OfflinePage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center bg-ss-bg px-6 text-center">
      <img src="/icons/icon-192.png" alt="SelfScience" className="mb-6 h-20 w-20 rounded-2xl shadow-lg" />
      <h1 className="text-2xl font-bold text-ss-teal">You are offline</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ss-muted">
        Some SelfScience pages work offline once you have visited them. Reconnect to the internet to run new searches, analyze a genome file, or fetch new content.
      </p>
      <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ss-teal px-6 py-3 text-sm font-semibold text-ss-bg transition hover:brightness-110">
        Return home
      </a>
    </main>
  )
}
