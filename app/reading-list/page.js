import ReadingListClient from './reading-list-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The SelfScience Reading List',
  description:
    'Books that connect to the research. Every recommendation includes the peer-reviewed studies behind the ideas — and an honest note on where the evidence is strong and where it is still emerging.',
  alternates: { canonical: '/reading-list' },
  openGraph: {
    title: 'The SelfScience Reading List',
    description:
      'Honest, evidence-first book recommendations across Genomics, Longevity, Nutrition, Sleep, Mental Health and more.',
    url: '/reading-list',
    type: 'website',
  },
}

export default function ReadingListPage() {
  return <ReadingListClient />
}
