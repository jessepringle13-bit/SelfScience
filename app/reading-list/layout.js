export const metadata = {
  title: 'Reading List',
  description:
    'Books that connect to the science. Every SelfScience reading-list entry pairs a book with its peer-reviewed research — and an honest note on where the evidence is strong.',
  alternates: { canonical: '/reading-list' },
  openGraph: {
    title: 'The SelfScience Reading List',
    description:
      'Honest, evidence-first book recommendations across Genomics, Longevity, Nutrition, Sleep, Mental Health and more.',
    url: '/reading-list',
    type: 'website',
  },
}

export default function ReadingListLayout({ children }) {
  return children
}
