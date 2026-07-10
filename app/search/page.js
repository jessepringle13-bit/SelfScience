import { Suspense } from 'react'
import SearchClient from './search-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Search the research',
  description:
    'Search PubMed, Semantic Scholar, OpenAlex, and Crossref in one place. AI reliability scoring, plain-language translations, and honest bias flags on every study.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Search the research | SelfScience',
    description:
      'Aggregated research search with AI reliability scoring and plain-language study translations.',
    url: '/search',
    type: 'website',
  },
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-20">Loading…</div>}>
      <SearchClient />
    </Suspense>
  )
}
