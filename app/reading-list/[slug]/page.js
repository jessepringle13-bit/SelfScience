import BookClient from './book-client'
import { BOOKS } from '@/lib/books'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const book = BOOKS.find((b) => b.slug === slug)
  if (!book) return { title: 'Book not found', robots: { index: false, follow: false } }
  return {
    title: `${book.title} — Reading List`,
    description: `${book.title} by ${book.author}. ${book.plainReason.slice(0, 160)}`,
    alternates: { canonical: `/reading-list/${slug}` },
    openGraph: {
      title: `${book.title} | SelfScience Reading List`,
      description: book.plainReason,
      url: `/reading-list/${slug}`,
      type: 'book',
    },
  }
}

export default async function BookPage({ params }) {
  const { slug } = await params
  return <BookClient slug={slug} />
}
