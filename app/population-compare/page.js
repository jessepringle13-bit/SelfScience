// /app/app/population-compare/page.js
import PopulationCompareClient from './population-compare-client'

export const metadata = {
  title: 'Population Compare · SelfScience',
  description:
    'See how your variant frequencies compare to global populations — where your genotype is rare, where it is common, and how it varies across ancestry groups.',
}

export default function PopulationComparePage() {
  return <PopulationCompareClient />
}
