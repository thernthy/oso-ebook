import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  const [rows] = await pool.execute(
    `SELECT b.id, b.title, b.cover_image_url as cover_url, 
            CONCAT(a.pen_name, ' (', u.display_name, ')') as author_name
     FROM bookmarks bm
     JOIN readers rd ON rd.id = bm.reader_id
     JOIN books b ON b.id = bm.book_id
     LEFT JOIN authors a ON a.id = b.author_id
     LEFT JOIN users u ON u.id = a.user_id
     WHERE rd.user_id = ? AND bm.is_favorite = TRUE
     ORDER BY bm.created_at DESC`,
    [userId]
  ) as any[]

  return ok(rows)
}
