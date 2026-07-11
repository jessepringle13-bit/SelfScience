// /app/app/drug-check/page.js
import DrugCheckClient from './drug-check-client'
export const metadata = {
  title: 'Drug Check · SelfScience',
  description: 'Cross-reference a medication against your genome findings for CPIC-style pharmacogenomic guidance.',
}
export default function DrugCheckPage() { return <DrugCheckClient /> }
