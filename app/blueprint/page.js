// /app/app/blueprint/page.js
// Server wrapper for the client-only Blueprint experience.

import BlueprintClient from './blueprint-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Your Health Blueprint' }

export default function BlueprintPage() {
  return <BlueprintClient />
}
