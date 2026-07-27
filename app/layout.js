import './globals.css'
import Analytics from '@/components/analytics'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdater from '@/components/PWAUpdater'
import MobileNav from '@/components/MobileNav'
import ChunkReloader from '@/components/ChunkReloader'
import BookmarkToast from '@/components/BookmarkToast'
import FirstTimeWelcome from '@/components/FirstTimeWelcome'
import HealthStoryQuiz from '@/components/HealthStoryQuiz'
import JourneyGuide from '@/components/JourneyGuide'
import Toast from '@/components/Toast'
import ReadingListToaster from '@/components/ReadingListToaster'
import AchievementToaster from '@/components/AchievementToaster'
import FeaturesTracker from '@/components/FeaturesTracker'
import JournalFloatingButton from '@/components/JournalFloatingButton'
import AlertsInitializer from '@/components/AlertsInitializer'
import ExplorerUnlockModal from '@/components/ExplorerUnlockModal'
import TierRouteGate from '@/components/TierRouteGate'
import CoachLauncher from '@/components/CoachLauncher'
import { NO_FLASH_SCRIPT } from '@/lib/theme'

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
      <head>
        {/* No-flash theme init: reads ss_theme from localStorage and
            sets <html class="dark"> before hydration so users never
            see a light→dark flash on first paint. */}
        <script
          dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }}
        />
      </head>
      <body>
        <div className="mx-auto min-h-screen w-full max-w-[1600px] bg-ss-bg text-ss-text 2xl:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          {children}
        </div>
        <MobileNav />
        <PWAInstallPrompt />
        <PWAUpdater />
        <BookmarkToast />
        <FirstTimeWelcome />
        <HealthStoryQuiz />
        <JourneyGuide />
        <Toast />
        <ReadingListToaster />
        <AchievementToaster />
        <FeaturesTracker />
        <JournalFloatingButton />
        <AlertsInitializer />
        <ExplorerUnlockModal />
        <TierRouteGate />
        <CoachLauncher />
        <Analytics />
        <ChunkReloader />
      </body>
    </html>
  )
}
