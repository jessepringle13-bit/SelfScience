import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'

/**
 * Content-page shell used by /about, /how-it-works, /mission, /terms, /privacy.
 *
 * Layout:
 *   [ optional disclaimer banner (sticky) ]
 *   [ dark teal hero band with dark nav + eyebrow + big white H1 + optional lede ]
 *   [ 800px content column on warm #F7F6F2 body ]
 *   [ footer ]
 *
 * Design system for content:
 *   - Max width 800px, 24px mobile gutter
 *   - 64px between major sections (space-y-16)
 *   - Heading color #1B474D, body #28251D
 */
export default function ContentPage({
  eyebrow,
  title,
  lede,
  children,
  disclaimerBanner = null,
}) {
  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#28251D]">
      {disclaimerBanner}

      {/* Teal hero band — same visual language as the rest of the site */}
      <section className="relative overflow-hidden bg-[#1B474D] pb-20 pt-24 text-white md:pb-24">
        {/* soft orange glow to warm the hero, matching site accent */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#C45820]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#EEF7F7]/10 blur-3xl" />
        <SiteNav variant="dark" />
        <div className="container relative">
          <div className="mx-auto max-w-[800px]">
            {eyebrow && (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/25 backdrop-blur">
                {eyebrow}
              </div>
            )}
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
              {title}
            </h1>
            {lede && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
                {lede}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content column */}
      <main className="relative">
        {/* subtle "paper" card underlays the content to warm up the whitespace */}
        <div className="mx-auto -mt-10 max-w-[880px] px-6 pb-16 md:px-8 md:pb-24">
          <article className="content-body space-y-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#1B474D]/10 md:space-y-16 md:p-12">
            {children}
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

/** A major section on a content page (64px gap between sections). */
export function Section({ id, heading, children, muted = false }) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 ${muted ? '-mx-6 rounded-xl bg-[#F9F8F5] px-6 py-8 ring-1 ring-[#1B474D]/5 md:-mx-8 md:px-8' : ''}`}
    >
      {heading && (
        <h2 className="mb-5 border-l-4 border-[#C45820] pl-4 text-2xl font-bold leading-snug text-[#1B474D] md:text-[28px]">
          {heading}
        </h2>
      )}
      <div className="space-y-5 text-[16px] leading-[1.7] text-[#28251D]">
        {children}
      </div>
    </section>
  )
}

/** Numbered section for legal pages (Terms / Privacy). Alternates background. */
export function LegalSection({ number, id, heading, alt = false, children }) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-xl px-6 py-8 md:px-10 md:py-10 ${
        alt ? 'bg-[#F9F8F5] ring-1 ring-[#1B474D]/10' : 'bg-white ring-1 ring-[#1B474D]/10'
      }`}
    >
      <div className="mb-5 flex items-baseline gap-4">
        {number != null && (
          <span className="text-3xl font-extrabold text-[#C45820] md:text-4xl">
            {number}.
          </span>
        )}
        <h2 className="text-2xl font-bold text-[#1B474D] md:text-[26px]">
          {heading}
        </h2>
      </div>
      <div className="space-y-4 text-[16px] leading-[1.7] text-[#28251D]">
        {children}
      </div>
    </section>
  )
}

/** Table of contents for legal pages. Renders anchor links to numbered sections. */
export function TableOfContents({ items }) {
  return (
    <nav
      aria-label="Table of contents"
      className="rounded-xl bg-gradient-to-br from-[#EEF7F7] to-white p-6 ring-1 ring-[#1B474D]/15 md:p-8"
    >
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#1B474D]">
        On this page
      </div>
      <ol className="space-y-2 text-[15px] leading-relaxed">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="flex gap-3 text-[#1B474D] hover:text-[#C45820] hover:underline"
            >
              {it.number != null && (
                <span className="w-6 shrink-0 text-right font-semibold text-[#C45820]">
                  {it.number}.
                </span>
              )}
              <span>{it.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
