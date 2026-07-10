import BookClient from './book-client'
import { READING_LIST } from '../page'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const book = READING_LIST.find((b) => b.slug === slug)
  if (!book) {
    return {
      title: 'Book not found',
      robots: { index: false, follow: false },
    }
  }
  return {
    title: `${book.title} — Reading List`,
    description: `${book.title} by ${book.author}. ${book.reason.slice(0, 160)}`,
    alternates: { canonical: `/reading-list/${slug}` },
    openGraph: {
      title: `${book.title} | SelfScience Reading List`,
      description: book.reason,
      url: `/reading-list/${slug}`,
      type: 'book',
    },
  }
}

export default async function BookPage({ params }) {
  const { slug } = await params
  return <BookClient slug={slug} />
}
