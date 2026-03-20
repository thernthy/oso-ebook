import { NextRequest }           from 'next/server'
import pool                      from '@/lib/db'
import { ok, err, requireAuth }  from '@/lib/api-helpers'

// POST /api/purchases — reader buys a book
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const body   = await req.json()
  const { book_id } = body
  if (!book_id) return err('book_id is required')

  // Fetch book
  const [books] = await pool.execute(
    `SELECT b.*, p.id AS partner_user_id FROM books b
     JOIN users p ON b.partner_id = p.id
     WHERE b.id = ? AND b.status = 'published' LIMIT 1`,
    [book_id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  // Check already owned
  const [owned] = await pool.execute(
    'SELECT id FROM purchases WHERE user_id = ? AND book_id = ? LIMIT 1',
    [userId, book_id]
  ) as any[]
  if ((owned as any[]).length) return err('You already own this book', 409)

  // Get revenue split from platform settings
  const [settings] = await pool.execute(
    `SELECT setting_key, value FROM platform_settings
     WHERE setting_key IN ('revenue_author_pct','revenue_partner_pct','revenue_platform_pct')`
  ) as any[]
  const cfg = Object.fromEntries((settings as any[]).map((s: any) => [s.setting_key, parseFloat(s.value)]))
  const authorPct   = cfg.revenue_author_pct   ?? 70
  const partnerPct  = cfg.revenue_partner_pct  ?? 20
  const platformPct = cfg.revenue_platform_pct ?? 10

  const price        = parseFloat(book.price)
  const authorEarn   = parseFloat((price * authorPct  / 100).toFixed(2))
  const partnerEarn  = parseFloat((price * partnerPct / 100).toFixed(2))
  const platformEarn = parseFloat((price * platformPct/ 100).toFixed(2))

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Record purchase
    const [pResult] = await conn.execute(
      'INSERT INTO purchases (user_id, book_id, price_paid) VALUES (?,?,?)',
      [userId, book_id, price]
    ) as any[]
    const purchaseId = (pResult as any).insertId

    // Increment book read count
    await conn.execute('UPDATE books SET total_reads = total_reads + 1 WHERE id = ?', [book_id])

    if (price > 0) {
      // Record earnings for author, partner, platform
      for (const [role, amount, earner] of [
        ['author',   authorEarn,   book.author_id],
        ['partner',  partnerEarn,  book.partner_user_id],
        ['platform', platformEarn, null],
      ]) {
        if (amount > 0) {
          await conn.execute(
            `INSERT INTO earnings (purchase_id, book_id, user_id, role, amount)
             VALUES (?,?,?,?,?)`,
            [purchaseId, book_id, earner || userId, role, amount]
          )
        }
      }
    }

    // Init reading progress
    await conn.execute(
      `INSERT IGNORE INTO reading_progress (user_id, book_id, chapter_id)
       SELECT ?, ?, c.id FROM chapters c WHERE c.book_id = ? ORDER BY c.chapter_num ASC LIMIT 1`,
      [userId, book_id, book_id]
    )

    await conn.commit()
    return ok({ message: 'Purchase successful! Start reading now.', book_id }, 201)
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

// GET /api/purchases — reader's library
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  const [books] = await pool.execute(
    `SELECT b.id, b.title, b.description, b.cover_url, b.category,
            u.name AS author_name,
            pu.created_at AS purchased_at, pu.price_paid,
            rp.chapter_id AS current_chapter_id,
            rp.page_num, rp.scroll_pct,
            c_curr.chapter_num AS current_chapter_num,
            c_curr.title AS current_chapter_title,
            COUNT(DISTINCT c.id) AS total_chapters,
            COALESCE(AVG(r.rating),0) AS avg_rating
     FROM purchases pu
     JOIN books b  ON pu.book_id  = b.id
     JOIN users u  ON b.author_id = u.id
     LEFT JOIN reading_progress rp ON rp.user_id=pu.user_id AND rp.book_id=b.id
     LEFT JOIN chapters c_curr ON c_curr.id = rp.chapter_id
     LEFT JOIN chapters c      ON c.book_id = b.id AND c.is_published=1
     LEFT JOIN reviews r ON r.book_id=b.id
     WHERE pu.user_id = ?
     GROUP BY b.id, pu.created_at, pu.price_paid, rp.chapter_id, rp.page_num, rp.scroll_pct, c_curr.chapter_num, c_curr.title
     ORDER BY pu.created_at DESC`,
    [userId]
  ) as any[]

  return ok({ books })
}
