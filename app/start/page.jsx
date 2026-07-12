import StartClient from './start-client'

export const metadata = {
  title: 'Start Here — Your SelfScience Journey',
  description: 'New to SelfScience? This guided walk-through shows you exactly where to start — from your first search to uploading your genome and understanding what your biology actually tells you.',
  openGraph: {
    title: 'Start Your SelfScience Journey',
    description: 'A short guided walk-through from your first search to reading your genome. No account, no commitment, no jargon.',
  },
}

export default function StartPage() {
  return <StartClient />
}
