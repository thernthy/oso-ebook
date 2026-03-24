import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  const [rows] = await pool.execute(
    `SELECT bm.id, bm.book_id, b.title, b.cover_image_url as cover_url, 
            c.title as chapter_title, c.chapter_num, bm.note, bm.created_at
     FROM bookmarks bm
     JOIN books b ON bm.book_id = b.id
     LEFT JOIN chapters c ON bm.chapter_id = c.id
     WHERE bm.reader_id = (SELECT id FROM readers WHERE user_id = ?)
     ORDER BY bm.created_at DESC`,
    [userId]
  ) as any[]

  return ok(rows)
}