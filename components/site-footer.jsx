export default function SiteFooter() {
  return (
    <footer className="bg-[#0F2C30] py-8 text-white/70">
      <div className="container flex flex-col items-start justify-between gap-4 text-xs md:flex-row md:items-center">
        <div>
          &copy; {new Date().getFullYear()} SelfScience. Educational only. Not medical advice.
        </div>
        <nav className="flex flex-wrap gap-5">
          <a href="/about" className="hover:text-white">About</a>
          <a href="/how-it-works" className="hover:text-white">How It Works</a>
          <a href="/reading-list" className="hover:text-white">Reading List</a>
          <a href="/terms" className="hover:text-white">Terms</a>
          <a href="/privacy" className="hover:text-white">Privacy</a>
        </nav>
      </div>
    </footer>
  )
}
