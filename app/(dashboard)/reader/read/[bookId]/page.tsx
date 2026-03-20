import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import BookReader           from '@/components/reader/BookReader'

type Params = { params: { bookId: string } }

export default async function ReadPage({ params }: Params) {
  const session = await getServerSession(authOptions)
  const userId  = session!.user.id

  // Verify access (owned or free)
  const [access] = await pool.execute(
    `SELECT b.id, b.title, b.is_free
     FROM books b
     LEFT JOIN purchases p ON p.book_id=b.id AND p.user_id=?
     WHERE b.id=? AND b.status='published' AND (b.is_free=1 OR p.id IS NOT NULL)
     LIMIT 1`,
    [userId, params.bookId]
  ) as any[]

  const book = (access as any[])[0]
  if (!book) redirect(`/dashboard/reader/books/${params.bookId}`)

  // Fetch all published chapters with content
  const [chapters] = await pool.execute(
    `SELECT id, chapter_num, title, content, word_count
     FROM chapters WHERE book_id=? AND is_published=1
     ORDER BY chapter_num ASC`,
    [params.bookId]
  ) as any[]

  if (!(chapters as any[]).length) notFound()

  // Get saved progress
  const [progress] = await pool.execute(
    'SELECT chapter_id, page_num FROM reading_progress WHERE user_id=? AND book_id=? LIMIT 1',
    [userId, params.bookId]
  ) as any[]

  const saved = (progress as any[])[0]

  return (
    <BookReader
      bookId={params.bookId}
      bookTitle={book.title}
      chapters={chapters as any[]}
      initialChapterId={saved?.chapter_id}
      initialPage={saved?.page_num}
    />
  )
}
