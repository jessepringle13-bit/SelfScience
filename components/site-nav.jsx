export function SiteNav({ variant = 'light' }) {
  const isDark = variant === 'dark'
  const base = isDark
    ? 'border-white/15 bg-ss-teal/40 backdrop-blur-md text-white'
    : 'border-ss-border-warm bg-white text-ss-text'
  const linkClass = isDark ? 'text-white/85 hover:text-white' : 'text-ss-text hover:text-ss-teal'
  const wordmarkClass = isDark ? 'text-white' : 'text-ss-teal'

  return (
    <header className={`absolute inset-x-0 top-0 z-30 border-b ${base}`}>
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className={`flex items-center gap-2 text-xl font-extrabold tracking-tight ${wordmarkClass}`}>
          <span className="inline-block h-2 w-2 rounded-full bg-ss-orange" />
          SelfScience
        </a>
        <nav className={`hidden items-center gap-8 text-sm font-medium md:flex`}>
          <a href="/" className={linkClass}>Home</a>
          <a href="/search" className={linkClass}>Search</a>
          <a href="/genome" className={linkClass}>Genome</a>
          <a href="/how-it-works" className={linkClass}>How it works</a>
          <a href="/about" className={linkClass}>About</a>
        </nav>
        <a
          href="/genome"
          className="hidden rounded-full bg-ss-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark md:inline-flex"
        >
          Upload Genome
        </a>
      </div>
    </header>
  )
}

export default SiteNav
