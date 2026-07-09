import BookClient from './book-client'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }) {
  const { slug } = await params
  return <BookClient slug={slug} />
}
