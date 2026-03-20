import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth, requirePermission } from '@/lib/api-helpers'
import { can, Role } from '@/lib/permissions'

type Params = { params: { id: string } }

// ─── GET /api/books/:id ───────────────────────────────────────
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role = session!.user.role as Role

  const [rows] = await pool.execute(
    `SELECT b.*, u.name AS author_name, p.name AS partner_name
     FROM books b
     JOIN users u ON b.author_id  = u.id
     JOIN users p ON b.partner_id = p.id
     WHERE b.id = ? LIMIT 1`,
    [params.id]
  ) as any[]

  const book = (rows as any[])[0]
  if (!book) return err('Book not found', 404)

  // Readers can only see published books
  if (role === 'reader' && book.status !== 'published') {
    return err('Book not found', 404)
  }
  // Authors can only see their own books
  if (role === 'author' && book.author_id !== session!.user.id) {
    return err('Forbidden', 403)
  }
  // Partners can only see their catalog
  if (role === 'partner' && book.partner_id !== session!.user.id) {
    return err('Forbidden', 403)
  }

  // Also fetch chapters (content only if published or owner)
  const [chapters] = await pool.execute(
    `SELECT id, chapter_num, title, word_count, is_published, created_at
     FROM chapters WHERE book_id = ? ORDER BY chapter_num ASC`,
    [params.id]
  ) as any[]

  return ok({ ...book, chapters })
}

// ─── PATCH /api/books/:id ─────────────────────────────────────
// Authors edit drafts. Partners approve/reject. OSO can do all.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role as Role
  const userId = session!.user.id

  // Fetch the book first
  const [rows] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (rows as any[])[0]
  if (!book) return err('Book not found', 404)

  const body = await req.json()
  const updates: string[] = []
  const values: unknown[] = []

  // Author: can edit own draft/rejected books
  if (role === 'author') {
    if (book.author_id !== userId) return err('Forbidden', 403)
    if (!['draft', 'rejected'].includes(book.status)) {
      return err('Can only edit books in draft or rejected state')
    }
    const editableFields = ['title', 'description', 'cover_url', 'price', 'is_free', 'category']
    for (const field of editableFields) {
      if (field in body) { updates.push(`${field} = ?`); values.push(body[field]) }
    }
    // Author submits for review
    if (body.status === 'in_review') {
      updates.push("status = 'in_review'")
    }
  }

  // Partner: can approve or reject books in their catalog
  if (role === 'partner') {
    if (book.partner_id !== userId) return err('Forbidden', 403)
    if (!can(role, 'approve:books')) return err('Forbidden', 403)
    if (!['in_review'].includes(book.status)) {
      return err('Book must be in_review to approve or reject')
    }
    if (body.status === 'published' || body.status === 'rejected') {
      updates.push('status = ?'); values.push(body.status)
    }
  }

  // OSO: can edit any field on any book
  if (role === 'oso') {
    const allFields = ['title','description','cover_url','price','is_free','category','status','is_featured']
    for (const field of allFields) {
      if (field in body) { updates.push(`${field} = ?`); values.push(body[field]) }
    }
  }

  if (!updates.length) return err('No valid fields to update')

  values.push(params.id)
  await pool.execute(
    `UPDATE books SET ${updates.join(', ')} WHERE id = ?`, values
  )

  return ok({ message: 'Book updated' })
}

// ─── DELETE /api/books/:id ────────────────────────────────────
// Authors delete own drafts. OSO deletes any.
export async function DELETE(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role as Role
  const userId = session!.user.id

  const [rows] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (rows as any[])[0]
  if (!book) return err('Book not found', 404)

  if (role === 'author') {
    if (book.author_id !== userId) return err('Forbidden', 403)
    if (book.status !== 'draft') return err('Can only delete draft books')
  } else if (role !== 'oso') {
    return err('Forbidden', 403)
  }

  await pool.execute('DELETE FROM books WHERE id = ?', [params.id])
  return ok({ message: 'Book deleted' })
}
