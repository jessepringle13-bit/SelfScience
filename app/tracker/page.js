// /app/app/tracker/page.js
import TrackerClient from './tracker-client'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Habit Tracker' }
export default function TrackerPage() { return <TrackerClient /> }
