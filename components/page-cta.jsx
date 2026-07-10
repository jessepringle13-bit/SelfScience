import { Search, Upload } from 'lucide-react'

/**
 * "Ready to start?" CTA card shown at the bottom of /about and /mission.
 */
export default function PageCTA() {
  return (
    <div className="rounded-2xl bg-[#1B474D] p-8 text-center text-white md:p-12">
      <h2 className="text-3xl font-extrabold md:text-4xl">Ready to start?</h2>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <a
          href="/search"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C45820] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#A5471A]"
        >
          <Search size={16} /> Search the Research
        </a>
        <a
          href="/genome"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/80 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#1B474D]"
        >
          <Upload size={16} /> Upload Your Genome
        </a>
      </div>
    </div>
  )
}
