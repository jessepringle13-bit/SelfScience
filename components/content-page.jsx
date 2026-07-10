import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'

/**
 * Content-page shell used by /about, /how-it-works, /mission, /terms, /privacy.
 * Enforces the design system for static content:
 *   max-width 800px, 24px mobile gutter, 64px between major sections,
 *   heading color #1B474D, body #28251D, background #F7F6F2.
 */
export default function ContentPage({ title, children, disclaimerBanner = null }) {
  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#28251D]">
      {disclaimerBanner}
      <SiteNav variant="light" />

      <main className="pt-24">
        <div className="mx-auto max-w-[800px] px-6 py-16 md:px-0 md:py-20">
          {title && (
            <h1 className="mb-12 text-4xl font-extrabold leading-tight tracking-tight text-[#1B474D] md:text-5xl">
              {title}
            </h1>
          )}
          <article className="content-body space-y-16">{children}</article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

/** A major section on a content page (64px gap between sections). */
export function Section({ id, heading, children, alt = false }) {
  const bg = alt ? 'bg-[#F9F8F5]' : ''
  return (
    <section id={id} className={`${bg} ${alt ? '-mx-6 rounded-lg px-6 py-10 md:mx-0 md:px-10' : ''}`}>
      {heading && (
        <h2 className="mb-5 text-2xl font-bold leading-snug text-[#1B474D] md:text-[28px]">
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
      className={`scroll-mt-28 rounded-lg px-6 py-8 md:px-10 md:py-10 ${
        alt ? 'bg-[#F9F8F5]' : 'bg-white'
      } ring-1 ring-black/5`}
    >
      <div className="mb-5 flex items-baseline gap-4">
        {number != null && (
          <span className="text-3xl font-extrabold text-[#1B474D] md:text-4xl">{number}.</span>
        )}
        <h2 className="text-2xl font-bold text-[#1B474D] md:text-[26px]">{heading}</h2>
      </div>
      <div className="space-y-4 text-[16px] leading-[1.7] text-[#28251D]">{children}</div>
    </section>
  )
}

/** Table of contents for legal pages. Renders anchor links to numbered sections. */
export function TableOfContents({ items }) {
  return (
    <nav
      aria-label="Table of contents"
      className="rounded-lg bg-white p-6 ring-1 ring-black/5 md:p-8"
    >
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#1B474D]/70">
        On this page
      </div>
      <ol className="space-y-2 text-[15px] leading-relaxed">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="flex gap-3 text-[#1B474D] hover:underline"
            >
              {it.number != null && (
                <span className="w-6 shrink-0 text-right font-semibold text-[#1B474D]/60">
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
