// /app/app/biomarkers/page.js
// Server shell for the /biomarkers route — delegates to the client
// component which handles all form logic + localStorage hydration.

import BiomarkersClient from './biomarkers-client'

export const metadata = {
  title: 'Biomarkers · SelfScience',
  description: 'Enter your bloodwork to see status, reference ranges, and how it connects to your genome findings.',
}

export default function BiomarkersPage() {
  return <BiomarkersClient />
}
