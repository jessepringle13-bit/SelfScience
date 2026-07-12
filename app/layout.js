import './globals.css'
import Analytics from '@/components/analytics'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdater from '@/components/PWAUpdater'
import MobileNav from '@/components/MobileNav'
import ChunkReloader from '@/components/ChunkReloader'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://selfscience.app'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SelfScience — Search the science. Understand your biology.',
    template: '%s | SelfScience',
  },
  description:
    'A health research search engine with AI reliability scoring, plain-language study translations, and personalised genome analysis. Educational only — not medical advice.',
  applicationName: 'SelfScience',
  keywords: [
    'health research',
    'PubMed search',
    'genome analysis',
    'reliability scoring',
    'plain language summary',
    'longevity',
    'nutrition',
    'genomics',
    'pharmacogenomics',
    'SelfScience',
  ],
  authors: [{ name: 'SelfScience' }],
  creator: 'SelfScience',
  publisher: 'SelfScience',
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: 'SelfScience',
    title: 'SelfScience — Search the science. Understand your biology.',
    description:
      'Aggregated PubMed / Semantic Scholar / OpenAlex / Crossref results, AI reliability scoring, and browser-only genome analysis.',
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SelfScience — Search the science. Understand your biology.',
    description:
      'Aggregated research search, AI reliability scoring, and personalised genome analysis. Not medical advice.',
  },
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SelfScience',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport = {
  themeColor: '#1B474D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MobileNav />
        <PWAInstallPrompt />
        <PWAUpdater />
        <Analytics />
        <ChunkReloader />
      </body>
    </html>
  )
}
