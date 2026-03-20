import { NextRequest }              from 'next/server'
import pool                         from '@/lib/db'
import { ok, err, requirePermission } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// ─── POST /api/books/:id/review ───────────────────────────────
// Partner approves or rejects a book submission with feedback.
// OSO can also act on any book.
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('approve:books')
  if (response) return response

  const role   = session!.user.role
  const userId = session!.user.id

  // Fetch the book
  const [rows] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (rows as any[])[0]
  if (!book) return err('Book not found', 404)

  // Partner can only act on their own catalog
  if (role === 'partner' && book.partner_id !== userId) {
    return err('Forbidden — book is not in your catalog', 403)
  }

  // Must be in_review to act on
  if (book.status !== 'in_review') {
    return err(`Book status is "${book.status}". Only in_review books can be reviewed.`)
  }

  const body = await req.json()
  const { action, feedback } = body

  if (!['approve', 'reject'].includes(action)) {
    return err('action must be "approve" or "reject"')
  }
  if (action === 'reject' && !feedback) {
    return err('feedback is required when rejecting a book')
  }

  const newStatus = action === 'approve' ? 'published' : 'rejected'

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Update book status
    await conn.execute(
      `UPDATE books SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_feedback = ?
       WHERE id = ?`,
      [newStatus, userId, feedback || null, params.id]
    )

    // If approved: publish all ready chapters
    if (action === 'approve') {
      await conn.execute(
        `UPDATE chapters SET is_published = 1 WHERE book_id = ? AND is_published = 0`,
        [params.id]
      )
    }

    await conn.commit()

    return ok({
      message:  action === 'approve'
        ? '✓ Book approved and published.'
        : '✕ Book rejected. Author has been notified.',
      status:   newStatus,
      feedback: feedback || null,
    })
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

// ─── GET /api/books/:id/review ────────────────────────────────
// Get review history for a book
export async function GET(_: NextRequest, { params }: Params) {
  const { response } = await requirePermission('approve:books')
  if (response) return response

  const [rows] = await pool.execute(
    `SELECT b.status, b.review_feedback, b.reviewed_at,
            u.name AS reviewed_by_name
     FROM books b
     LEFT JOIN users u ON b.reviewed_by = u.id
     WHERE b.id = ? LIMIT 1`,
    [params.id]
  ) as any[]

  if (!(rows as any[]).length) return err('Book not found', 404)
  return ok((rows as any[])[0])
}
