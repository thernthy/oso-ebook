import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  const [rows] = await pool.execute(
    `SELECT r.id, r.book_id, b.title as book_title, b.cover_image_url as book_cover, 
            r.rating, r.review_text, r.created_at
     FROM reviews r
     JOIN books b ON b.id = r.book_id
     JOIN readers rd ON rd.id = r.reader_id
     WHERE rd.user_id = ?
     ORDER BY r.created_at DESC`,
    [userId]
  ) as any[]

  return ok(rows)
}
