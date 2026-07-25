// /app/app/journal/page.js
// Server wrapper for the client-only journal experience.

import JournalClient from './journal-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Journal' }

export default function JournalPage() {
  return <JournalClient />
}
