export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ss-bg">
      <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-sm ring-1 ring-black/5">
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-ss-orange" />
        <span className="text-sm font-medium text-ss-teal">Loading…</span>
      </div>
    </div>
  )
}
