import { NextRequest }          from 'next/server'
import pool                     from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const url    = new URL(req.url)
  const bookId = url.searchParams.get('book_id') || ''

  const conditions = ['bm.reader_id = (SELECT id FROM readers WHERE user_id = ?)']
  const params: unknown[] = [userId]
  if (bookId) { conditions.push('bm.book_id = ?'); params.push(bookId) }

  const [rows] = await pool.execute(
    `SELECT bm.id, bm.book_id, bm.chapter_id, bm.note, bm.created_at,
            b.title AS book_title, c.title AS chapter_title, c.chapter_num
     FROM bookmarks bm
     JOIN books b ON bm.book_id = b.id
     LEFT JOIN chapters c ON bm.chapter_id = c.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY bm.created_at DESC`,
    params
  ) as any[]

  return ok({ bookmarks: rows })
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const body = await req.json()
  const { book_id, chapter_id, note } = body
  if (!book_id || !chapter_id) return err('book_id and chapter_id required')

  const [result] = await pool.execute(
    `INSERT INTO bookmarks (reader_id, book_id, chapter_id, note)
     SELECT id, ?, ?, ? FROM readers WHERE user_id = ?`,
    [book_id, chapter_id, note || null, userId]
  ) as any[]

  return ok({ message: 'Bookmark saved', id: (result as any).insertId }, 201)
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const url = new URL(req.url)
  const id  = url.searchParams.get('id')
  if (!id) return err('id required')

  await pool.execute(
    'DELETE FROM bookmarks WHERE id = ? AND reader_id = (SELECT id FROM readers WHERE user_id = ?)',
    [id, userId]
  )
  return ok({ message: 'Bookmark removed' })
}
