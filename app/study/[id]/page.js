import StudyClient from './study-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { id } = await params
  const decoded = decodeURIComponent(id)
  return {
    title: `Study ${decoded}`,
    description:
      'Read the study with AI-assisted reliability scoring, plain-language translation, and a full funding trail.',
    alternates: { canonical: `/study/${decoded}` },
    robots: { index: false, follow: true },
  }
}

export default async function StudyPage({ params }) {
  const { id } = await params
  return <StudyClient id={decodeURIComponent(id)} />
}
