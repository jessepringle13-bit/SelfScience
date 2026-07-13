// Server component wrapper for the Supplement Discovery client page.
import SupplementsClient from './supplements-client'

export const metadata = {
  title: 'Supplement Discovery — SelfScience',
  description: 'Evidence-first supplement discovery. NIH DSLD label data. Brand-direct links. No Amazon, no marketplaces. Educational only — not medical advice.',
  openGraph: {
    title: 'Supplement Discovery — SelfScience',
    description: 'Discover supplements by their ingredient FORMS — not their marketing. Brand-direct only.',
  },
  robots: { index: true, follow: true },
}

export default function Page() {
  return <SupplementsClient />
}
