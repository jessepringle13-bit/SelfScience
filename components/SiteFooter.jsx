/**
 * SiteFooter — shared footer rendered on the marketing homepage, static
 * content pages (About, How It Works, Terms, Privacy) and stub articles
 * like /articles/apoe-explained. Mirrors the inline footer already used in
 * app/page.js so styling stays consistent site-wide.
 */
export default function SiteFooter() {
  return (
    <footer className="bg-[#0F2C30] py-12 text-white/80">
      <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <div className="text-lg font-extrabold text-white">SelfScience</div>
          <p className="mt-1 text-sm text-white/60">
            Search the science. Understand your biology.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-sm">
          <a href="/about" className="hover:text-white">About</a>
          <a href="/how-it-works" className="hover:text-white">How It Works</a>
          <a href="/reading-list" className="hover:text-white">Reading List</a>
          <a href="/terms" className="hover:text-white">Terms of Use</a>
          <a href="/privacy" className="hover:text-white">Privacy Policy</a>
        </nav>
      </div>
      <div className="container mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
        <p>© {new Date().getFullYear()} SelfScience. For educational purposes only. Not medical advice.</p>
      </div>
    </footer>
  )
}
