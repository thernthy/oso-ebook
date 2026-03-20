import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { Role } from '@/lib/permissions'

type Params = { params: { id: string } }

// ─── GET /api/books/:id/chapters ─────────────────────────────
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role as Role
  const userId = session!.user.id

  // Verify book access
  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  if (role === 'reader' && book.status !== 'published') return err('Book not found', 404)
  if (role === 'author' && book.author_id !== userId)   return err('Forbidden', 403)
  if (role === 'partner' && book.partner_id !== userId)  return err('Forbidden', 403)

  const includeContent = role !== 'reader' || book.status === 'published'

  const [rows] = await pool.execute(
    `SELECT id, chapter_num, title, word_count, is_published, created_at
     ${includeContent ? ', content' : ''}
     FROM chapters
     WHERE book_id = ?
     ORDER BY chapter_num ASC`,
    [params.id]
  ) as any[]

  return ok({ chapters: rows })
}

// ─── POST /api/books/:id/chapters ────────────────────────────
// Authors only — add chapter to their own book
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role as Role
  if (role !== 'author' && role !== 'oso') return err('Forbidden', 403)

  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  if (role === 'author' && book.author_id !== session!.user.id) {
    return err('Forbidden', 403)
  }

  const body = await req.json()
  const { title, content, is_published = false } = body
  if (!title) return err('title is required')

  // Auto-increment chapter number
  const [[{ next_num }]] = await pool.execute(
    'SELECT COALESCE(MAX(chapter_num), 0) + 1 AS next_num FROM chapters WHERE book_id = ?',
    [params.id]
  ) as any[]

  const wordCount = content ? content.trim().split(/\s+/).length : 0

  const [result] = await pool.execute(
    `INSERT INTO chapters (book_id, chapter_num, title, content, word_count, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [params.id, next_num, title, content || null, wordCount, is_published ? 1 : 0]
  ) as any[]

  return ok({ message: 'Chapter created', id: (result as any).insertId, chapter_num: next_num }, 201)
}
