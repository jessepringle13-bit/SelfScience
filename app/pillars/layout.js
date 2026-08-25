// /app/app/pillars/layout.js
// Metadata for the /pillars explainer. Kept in a Server layout so
// the page itself can remain a Client Component (it needs to import
// the PILLARS array from components/site-nav.jsx, which is a Client
// Component and therefore can only export non-component values to
// other Client Components).

export const metadata = {
  title: 'The 10 SelfScience pillars \u2014 one taxonomy for your whole biology',
  description:
    'What a pillar is, why SelfScience is organised into ten of them, and which tools live inside each. Genetic and lab data are optional \u2014 pillars are open to anyone.',
  alternates: { canonical: '/pillars' },
  openGraph: {
    title: 'The 10 SelfScience pillars',
    description:
      'One taxonomy for your whole biology \u2014 genetics, nutrition, performance, longevity, wellness, pharmacology, mental health, environment, hormones, and development.',
    url: '/pillars',
    type: 'website',
  },
}

export default function PillarsLayout({ children }) {
  return children
}
