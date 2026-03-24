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
     WHERE bm.user_id = ?
     ORDER BY bm.created_at DESC`,
    [userId]
  ) as any[]

  return ok(rows)
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const body = await req.json()
  const { book_id, chapter_id, note } = body
  if (!book_id || !chapter_id) return err('book_id and chapter_id required')

  await pool.execute(
    `INSERT INTO bookmarks (user_id, book_id, chapter_id, note)
     VALUES (?, ?, ?, ?)`,
    [userId, book_id, chapter_id, note || null]
  )

  return ok({ message: 'Bookmark saved' }, 201)
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const url = new URL(req.url)
  const id  = url.searchParams.get('id')
  if (!id) return err('id required')

  await pool.execute(
    'DELETE FROM bookmarks WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  return ok({ message: 'Bookmark removed' })
}
