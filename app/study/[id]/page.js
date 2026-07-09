import StudyClient from './study-client'

export const dynamic = 'force-dynamic'

export default async function StudyPage({ params }) {
  const { id } = await params
  return <StudyClient id={decodeURIComponent(id)} />
}
