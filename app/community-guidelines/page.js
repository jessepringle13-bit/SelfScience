// /app/app/community-guidelines/page.js
// Static community guidelines page.

import Link from 'next/link'
import SiteNav from '@/components/site-nav'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Community Guidelines' }

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DCEDED] via-[#EAF5F5] to-[#F5FAFA] pb-24">
      <SiteNav />
      <div className="container pt-24 md:pt-28">
        <Link href="/community" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-teal hover:underline">
          <ArrowLeft size={12} /> Community
        </Link>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-orange">Community</div>
        <h1 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">Community Guidelines</h1>

        <div className="prose prose-slate mt-8 max-w-2xl text-ss-text">
          <h2 className="text-lg font-extrabold text-ss-teal">What this community is</h2>
          <p className="text-sm leading-relaxed text-ss-text">
            A private, anonymous space for people exploring their genetics to share what they are learning — not medical advice, not diagnoses, not treatment recommendations.
          </p>

          <h2 className="mt-6 text-lg font-extrabold text-ss-teal">What we do not allow</h2>
          <ul className="mt-1 list-disc pl-5 text-sm text-ss-text">
            <li>Sharing raw genetic data or rsIDs</li>
            <li>Sharing personal identifying information (real name, email, phone, address)</li>
            <li>Medical advice or diagnoses</li>
            <li>Supplement or product promotion</li>
            <li>Harassment or negative comments about other members’ health situations</li>
          </ul>

          <h2 className="mt-6 text-lg font-extrabold text-ss-teal">How moderation works</h2>
          <p className="text-sm leading-relaxed text-ss-text">
            All posts pass through an on-device privacy and safety filter before publishing. Posts that violate guidelines are removed and repeat violations result in removal from the community.
          </p>

          <h2 className="mt-6 text-lg font-extrabold text-ss-teal">How to leave</h2>
          <p className="text-sm leading-relaxed text-ss-text">
            You can leave the community at any time from <span className="font-semibold text-ss-teal">Settings → Community → Leave community</span>. Your display name and posts are deleted within 24 hours.
          </p>
        </div>
      </div>
    </div>
  )
}
