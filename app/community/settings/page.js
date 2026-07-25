// /app/app/community/settings/page.js
import SettingsClient from './settings-client'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Community Settings' }
export default function CommunitySettingsPage() { return <SettingsClient /> }
