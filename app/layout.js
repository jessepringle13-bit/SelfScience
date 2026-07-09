import './globals.css'

export const metadata = {
  title: 'SelfScience — Search the science. Understand your biology.',
  description: 'Health research search engine with AI-powered reliability scoring and personalized genome analysis. Educational only — not medical advice.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
