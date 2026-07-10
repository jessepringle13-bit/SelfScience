import ContentPage, { Section } from '@/components/content-page'
import SupportButton from '@/components/support-button'
import { Coffee, ShieldCheck, HeartHandshake, Sparkles, Users } from 'lucide-react'

export const metadata = {
  title: 'Support SelfScience',
  description:
    'SelfScience is free, ad-free, and never runs sponsored studies. If it has helped you understand your biology, a small contribution keeps the lights on.',
  alternates: { canonical: '/support' },
  openGraph: {
    title: 'Support SelfScience',
    description:
      'SelfScience is free, ad-free, and never runs sponsored studies. If it has helped you understand your biology, a small contribution keeps the lights on.',
    url: '/support',
    type: 'website',
  },
}

export default function SupportPage() {
  return (
    <ContentPage
      eyebrow="Support"
      title="Keep SelfScience honest and free."
      lede="No ads. No affiliate links. No supplement upsells. No sponsored studies. If SelfScience has helped you understand your biology, a small contribution helps keep it that way."
    >
      {/* Primary CTA */}
      <Section>
        <div className="rounded-2xl bg-gradient-to-br from-[#EEF7F7] to-white p-8 text-center ring-1 ring-[#1B474D]/10 md:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C45820]/10 text-[#C45820]">
            <Coffee size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1B474D] md:text-[28px]">
            Buy me a coffee &mdash; keep the science flowing.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#28251D]">
            One-time or monthly, any amount helps. SelfScience is a solo project right now, so every contribution
            has a real, direct impact on what gets built next.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SupportButton variant="hero" source="support_page_hero" label="Buy me a coffee" />
            <a
              href="#what-it-funds"
              className="text-sm font-semibold text-[#1B474D] underline underline-offset-4 hover:text-[#C45820]"
            >
              See what your donation funds
            </a>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-[#1B474D]/60">
            Secure checkout via Buy Me a Coffee &middot; No account required
          </p>
        </div>
      </Section>

      {/* What it funds */}
      <Section id="what-it-funds" heading="What your donation funds">
        <p>
          SelfScience runs on a tiny stack of costs that keep it honest. Here&rsquo;s the real breakdown:
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FundingCard
            icon={<Sparkles size={18} />}
            title="AI processing costs"
            body="Every reliability score, plain-language translation, and genome interpretation runs through an AI model. Those aren't free at scale. Your support covers the API costs so search stays fast and free for everyone."
          />
          <FundingCard
            icon={<ShieldCheck size={18} />}
            title="Keeping SelfScience free"
            body="No paywall, no premium tier, no data harvesting. The whole platform stays open and educational for anyone who lands on it."
          />
          <FundingCard
            icon={<HeartHandshake size={18} />}
            title="Editorial research time"
            body="Reading the studies. Writing the annotations. Building the reading list with an honest note on what's well-supported and what isn't. That's the work donations make possible."
          />
          <FundingCard
            icon={<Users size={18} />}
            title="Zero ads, zero supplement upsells, zero sponsored studies"
            body="The moment SelfScience takes advertising or affiliate money, its scoring can't be trusted. Donations are the alternative that lets us tell you the truth about a study &mdash; even when it's a study we'd rather like."
          />
        </div>
      </Section>

      {/* Transparency */}
      <Section heading="Where does the money actually go?" muted>
        <p>
          Right now, SelfScience is bootstrapped and self-funded by one person. Contributions go directly into
          the costs above &mdash; not salaries, not marketing, not vanity spend.
        </p>
        <p>
          When contributions start to consistently outpace running costs, we&rsquo;ll publish a transparent
          expense breakdown on this page so you can see exactly where your support went. That&rsquo;s the standard
          honest projects hold themselves to.
        </p>
      </Section>

      {/* Other ways to help */}
      <Section heading="Other ways to help">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Tell a friend.</strong> Someone in your life just downloaded their 23andMe results. Send
            them the link.
          </li>
          <li>
            <strong>Send feedback.</strong> Broken thing? Missing feature? A study we should surface? Email
            {' '}
            <a href="mailto:contact@selfscience.io" className="text-[#C45820] underline hover:text-[#A5471A]">
              contact@selfscience.io
            </a>
            .
          </li>
          <li>
            <strong>Correct us.</strong> If we mis-scored a study or missed a bias, tell us. Honest
            corrections are the whole point.
          </li>
          <li>
            <strong>Cite us.</strong> If you write about health research, link back to the studies you found here.
          </li>
        </ul>
      </Section>

      {/* Bottom CTA */}
      <Section>
        <div className="rounded-2xl bg-[#1B474D] p-8 text-center text-white md:p-10">
          <h2 className="text-2xl font-extrabold md:text-3xl">Ready to chip in?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Even a one-time coffee&rsquo;s worth keeps the AI credits topped up for a whole day of searches.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <SupportButton variant="hero" source="support_page_footer" label="Buy me a coffee" />
          </div>
        </div>
      </Section>
    </ContentPage>
  )
}

function FundingCard({ icon, title, body }) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-[#1B474D]/10">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B474D]/10 text-[#1B474D]">
          {icon}
        </span>
        <h3 className="text-base font-bold text-[#1B474D]">{title}</h3>
      </div>
      <p className="text-[15px] leading-[1.7] text-[#28251D]">{body}</p>
    </div>
  )
}
