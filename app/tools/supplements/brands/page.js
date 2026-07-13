import BrandsLeaderboardClient from './brands-client'

export const metadata = {
  title: 'Brand Transparency Leaderboard — SelfScience',
  description: 'Every curated supplement brand, ranked by SelfScience’s transparency score. Third-party certifications, manufacturing, and CoA disclosure at a glance.',
  robots: { index: true, follow: true },
}

export default function Page() {
  return <BrandsLeaderboardClient />
}
