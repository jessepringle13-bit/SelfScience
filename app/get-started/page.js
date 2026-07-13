// /app/app/get-started/page.js
// SelfScience — “Get Your Data” kit recommendations landing page.
// Server component (static content); interactive accordion below.

import GetStartedClient from './get-started-client'

export const metadata = {
  title: 'Get Your Data | SelfScience',
  description:
    'Which DNA test kit and bloodwork service works with SelfScience. Genotyping vs whole genome sequencing, pricing, coverage, and step-by-step data-download instructions.',
  alternates: { canonical: '/get-started' },
}

export default function GetStartedPage() {
  return <GetStartedClient />
}
