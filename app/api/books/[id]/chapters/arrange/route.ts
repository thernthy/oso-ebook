import { NextRequest }         from 'next/server'
import pool                    from '@/lib/db'
import { autoArrangeChapters } from '@/lib/ai-chapters'
import { ok, err, requireAuth } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// ─── POST /api/books/:id/chapters/arrange ─────────────────────
// Two modes:
//   { mode: 'ai' }                       → GPT-4 auto-arranges
//   { mode: 'manual', order: [{id, chapter_num}] } → author drag-drop
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role
  const userId = session!.user.id

  // Verify ownership
  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  if (role === 'author' && book.author_id !== userId) return err('Forbidden', 403)
  if (role === 'partner' && book.partner_id !== userId) return err('Forbidden', 403)

  const body = await req.json()
  const { mode } = body

  if (mode === 'manual') {
    // Manual reorder — author dragged chapters into new positions
    const order: { id: string; chapter_num: number }[] = body.order
    if (!Array.isArray(order) || !order.length) {
      return err('order array required for manual mode')
    }

    // Validate all chapters belong to this book
    const [existing] = await pool.execute(
      'SELECT id FROM chapters WHERE book_id = ?', [params.id]
    ) as any[]
    const existingIds = new Set((existing as any[]).map((c: any) => c.id))
    const invalid     = order.filter(o => !existingIds.has(o.id))
    if (invalid.length) return err(`Invalid chapter IDs: ${invalid.map(i => i.id).join(', ')}`)

    // Update all at once using a transaction
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const { id, chapter_num } of order) {
        await conn.execute(
          'UPDATE chapters SET chapter_num = ? WHERE id = ? AND book_id = ?',
          [chapter_num, id, params.id]
        )
      }
      await conn.commit()
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }

    return ok({ message: 'Chapters reordered', mode: 'manual', updated: order.length })
  }

  if (mode === 'ai') {
    // Fetch all chapters for this book
    const [chapters] = await pool.execute(
      `SELECT id, chapter_num, title,
              LEFT(content, 300) AS content_preview
       FROM chapters WHERE book_id = ? ORDER BY chapter_num ASC`,
      [params.id]
    ) as any[]

    if (!(chapters as any[]).length) {
      return err('No chapters found. Upload a book file first.')
    }

    // Call GPT-4 to determine correct order
    const arranged = await autoArrangeChapters(chapters as any[])

    // Apply the new order
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const { id, new_chapter_num } of arranged) {
        await conn.execute(
          'UPDATE chapters SET chapter_num = ? WHERE id = ? AND book_id = ?',
          [new_chapter_num, id, params.id]
        )
      }
      await conn.commit()
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }

    return ok({
      message:  'AI has arranged your chapters in the correct order.',
      mode:     'ai',
      arranged: arranged.map(a => ({ id: a.id, chapter_num: a.new_chapter_num, reason: a.reason })),
    })
  }

  return err('mode must be "ai" or "manual"')
}
