// /app/app/community/page.js
import CommunityClient from './community-client'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'The SelfScience Community' }
export default function CommunityPage() { return <CommunityClient /> }
