import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'

export default function StaticPageShell({ eyebrow, title, lede, children }) {
  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      <section className="relative bg-ss-teal pb-14 pt-24 text-white">
        <SiteNav variant="dark" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">{title}</h1>
            {lede && (
              <p className="mx-auto mt-4 max-w-2xl text-white/80 md:text-lg">
                {lede}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <article className="mx-auto max-w-3xl space-y-6 text-[15px] leading-relaxed text-ss-text md:text-base">
          {children}
        </article>
      </section>

      <SiteFooter />
    </main>
  )
}
