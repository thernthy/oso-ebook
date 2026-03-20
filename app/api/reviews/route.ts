import { NextRequest }          from 'next/server'
import pool                     from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const body   = await req.json()
  const { book_id, rating, body: reviewBody } = body

  if (!book_id || !rating) return err('book_id and rating required')
  if (rating < 1 || rating > 5) return err('rating must be 1–5')

  // Must own or have read the book
  const [access] = await pool.execute(
    `SELECT 1 FROM purchases WHERE user_id=? AND book_id=?
     UNION SELECT 1 FROM books WHERE id=? AND is_free=1`,
    [userId, book_id, book_id]
  ) as any[]
  if (!(access as any[]).length) return err('Purchase the book before reviewing', 403)

  await pool.execute(
    `INSERT INTO reviews (user_id, book_id, rating, body) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE rating=VALUES(rating), body=VALUES(body), updated_at=NOW()`,
    [userId, book_id, rating, reviewBody||null]
  )

  return ok({ message: 'Review saved' }, 201)
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const url    = new URL(req.url)
  const bookId = url.searchParams.get('book_id')
  if (!bookId) return err('book_id required')

  const [rows] = await pool.execute(
    `SELECT r.id, r.rating, r.body, r.created_at,
            u.name AS reviewer_name,
            CASE WHEN r.user_id=? THEN 1 ELSE 0 END AS is_mine
     FROM reviews r JOIN users u ON r.user_id=u.id
     WHERE r.book_id=? ORDER BY r.created_at DESC`,
    [session!.user.id, bookId]
  ) as any[]

  const [[{ avg_rating, total }]] = await pool.execute(
    'SELECT COALESCE(AVG(rating),0) AS avg_rating, COUNT(*) AS total FROM reviews WHERE book_id=?',
    [bookId]
  ) as any[]

  return ok({ reviews: rows, avg_rating, total })
}
