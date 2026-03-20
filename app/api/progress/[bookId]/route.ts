import { NextRequest }          from 'next/server'
import pool                     from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

type Params = { params: { bookId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const [rows] = await pool.execute(
    `SELECT rp.*, c.chapter_num, c.title AS chapter_title
     FROM reading_progress rp
     JOIN chapters c ON c.id = rp.chapter_id
     WHERE rp.user_id = ? AND rp.book_id = ? LIMIT 1`,
    [session!.user.id, params.bookId]
  ) as any[]

  return ok((rows as any[])[0] || null)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const body   = await req.json()
  const { chapter_id, page_num, scroll_pct, total_pages, time_spent_s } = body

  if (!chapter_id) return err('chapter_id required')

  // Verify reader owns this book
  const [owned] = await pool.execute(
    `SELECT 1 FROM purchases WHERE user_id=? AND book_id=?
     UNION SELECT 1 FROM books WHERE id=? AND is_free=1`,
    [userId, params.bookId, params.bookId]
  ) as any[]
  if (!(owned as any[]).length) return err('Access denied', 403)

  await pool.execute(
    `INSERT INTO reading_progress (user_id, book_id, chapter_id, page_num, scroll_pct, total_pages, time_spent_s)
     VALUES (?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       chapter_id   = VALUES(chapter_id),
       page_num     = VALUES(page_num),
       scroll_pct   = VALUES(scroll_pct),
       total_pages  = VALUES(total_pages),
       time_spent_s = time_spent_s + VALUES(time_spent_s),
       updated_at   = NOW()`,
    [userId, params.bookId, chapter_id, page_num||1, scroll_pct||0, total_pages||1, time_spent_s||0]
  )

  return ok({ message: 'Progress saved' })
}
