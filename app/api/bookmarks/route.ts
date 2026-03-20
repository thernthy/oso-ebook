import { NextRequest }          from 'next/server'
import pool                     from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const url    = new URL(req.url)
  const bookId = url.searchParams.get('book_id') || ''

  const conditions = ['bm.user_id = ?']
  const params: unknown[] = [session!.user.id]
  if (bookId) { conditions.push('bm.book_id = ?'); params.push(bookId) }

  const [rows] = await pool.execute(
    `SELECT bm.*, b.title AS book_title, c.title AS chapter_title, c.chapter_num
     FROM bookmarks bm
     JOIN books b    ON bm.book_id    = b.id
     JOIN chapters c ON bm.chapter_id = c.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY bm.created_at DESC`,
    params
  ) as any[]

  return ok({ bookmarks: rows })
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const body = await req.json()
  const { book_id, chapter_id, page_num, note, highlight } = body
  if (!book_id || !chapter_id) return err('book_id and chapter_id required')

  const [result] = await pool.execute(
    `INSERT INTO bookmarks (user_id, book_id, chapter_id, page_num, note, highlight)
     VALUES (?,?,?,?,?,?)`,
    [session!.user.id, book_id, chapter_id, page_num||1, note||null, highlight||null]
  ) as any[]

  return ok({ message: 'Bookmark saved', id: (result as any).insertId }, 201)
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const url = new URL(req.url)
  const id  = url.searchParams.get('id')
  if (!id) return err('id required')

  await pool.execute(
    'DELETE FROM bookmarks WHERE id=? AND user_id=?',
    [id, session!.user.id]
  )
  return ok({ message: 'Bookmark removed' })
}
