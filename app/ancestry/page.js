// /app/app/ancestry/page.js
import AncestryClient from './ancestry-client'

export const metadata = {
  title: 'Ancestry Report · SelfScience',
  description:
    'A rough, educational ancestry composition estimate derived from the geographically stratified variants in your genome.',
}

export default function AncestryPage() {
  return <AncestryClient />
}
