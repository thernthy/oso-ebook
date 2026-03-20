import { NextRequest }          from 'next/server'
import pool                     from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

type Params = { params: { id: string; chapterId: string } }

// ─── GET /api/books/:id/chapters/:chapterId ───────────────────
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const [rows] = await pool.execute(
    `SELECT c.*, b.author_id, b.partner_id, b.status AS book_status
     FROM chapters c JOIN books b ON c.book_id = b.id
     WHERE c.id = ? AND c.book_id = ? LIMIT 1`,
    [params.chapterId, params.id]
  ) as any[]

  const ch = (rows as any[])[0]
  if (!ch) return err('Chapter not found', 404)

  const role   = session!.user.role
  const userId = session!.user.id

  if (role === 'reader' && (ch.book_status !== 'published' || !ch.is_published)) {
    return err('Chapter not available', 404)
  }
  if (role === 'author'  && ch.author_id  !== userId) return err('Forbidden', 403)
  if (role === 'partner' && ch.partner_id !== userId)  return err('Forbidden', 403)

  return ok(ch)
}

// ─── PATCH /api/books/:id/chapters/:chapterId ─────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role
  const userId = session!.user.id

  // Verify chapter + book ownership
  const [rows] = await pool.execute(
    `SELECT c.*, b.author_id, b.partner_id, b.status AS book_status
     FROM chapters c JOIN books b ON c.book_id = b.id
     WHERE c.id = ? AND c.book_id = ? LIMIT 1`,
    [params.chapterId, params.id]
  ) as any[]
  const ch = (rows as any[])[0]
  if (!ch) return err('Chapter not found', 404)

  if (role === 'author' && ch.author_id !== userId) return err('Forbidden', 403)
  if (role === 'reader') return err('Forbidden', 403)

  const body = await req.json()
  const updates: string[] = []
  const values: unknown[] = []

  if ('title' in body) {
    updates.push('title = ?')
    values.push(body.title)
  }
  if ('content' in body) {
    updates.push('content = ?')
    updates.push('word_count = ?')
    values.push(body.content)
    values.push(body.content ? body.content.trim().split(/\s+/).length : 0)
  }
  if ('chapter_num' in body) {
    updates.push('chapter_num = ?')
    values.push(body.chapter_num)
  }
  if ('is_published' in body) {
    updates.push('is_published = ?')
    values.push(body.is_published ? 1 : 0)
  }

  if (!updates.length) return err('No valid fields to update')

  values.push(params.chapterId)
  await pool.execute(
    `UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`,
    values
  )

  return ok({ message: 'Chapter updated' })
}

// ─── DELETE /api/books/:id/chapters/:chapterId ────────────────
export async function DELETE(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role
  const userId = session!.user.id

  const [rows] = await pool.execute(
    `SELECT c.*, b.author_id FROM chapters c
     JOIN books b ON c.book_id = b.id
     WHERE c.id = ? AND c.book_id = ? LIMIT 1`,
    [params.chapterId, params.id]
  ) as any[]
  const ch = (rows as any[])[0]
  if (!ch) return err('Chapter not found', 404)

  if (role === 'author' && ch.author_id !== userId) return err('Forbidden', 403)
  if (role === 'reader' || role === 'partner') return err('Forbidden', 403)

  await pool.execute('DELETE FROM chapters WHERE id = ?', [params.chapterId])

  // Re-sequence remaining chapters
  await pool.execute(
    `SET @num = 0;
     UPDATE chapters SET chapter_num = (@num := @num + 1)
     WHERE book_id = ? ORDER BY chapter_num ASC`,
    [params.id]
  )

  return ok({ message: 'Chapter deleted and sequence updated' })
}
