// /app/app/genome/protocol/page.js
// Route wrapper for the full protocol page. All heavy-lifting lives in
// <ProtocolClient> because it needs sessionStorage access.

import ProtocolClient from './protocol-client'

export const metadata = {
  title: 'Your Full Protocol — SelfScience',
  description:
    'Personalized protocol summary derived from your genome variants: what to prioritize, daily habits, supplements, training, medications, biomarkers to watch, and questions for your doctor.',
}

export default function ProtocolPage() {
  return <ProtocolClient />
}
