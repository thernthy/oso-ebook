import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'

export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  try {
    // In-progress books
    const [inProgress] = await pool.execute(
      `SELECT b.id, b.title, b.cover_url, u.name AS author_name,
              rp.scroll_pct, rp.chapter_id,
              c.chapter_num AS current_chapter_num, c.title AS current_chapter_title,
              COUNT(DISTINCT ch.id) AS total_chapters
       FROM reading_progress rp
       JOIN books b ON rp.book_id = b.id
       JOIN users u ON b.author_id = u.id
       JOIN chapters c ON rp.chapter_id = c.id
       LEFT JOIN chapters ch ON ch.book_id = b.id AND ch.is_published = 1
       WHERE rp.user_id = ? AND rp.scroll_pct < 100
       GROUP BY b.id, rp.scroll_pct, rp.chapter_id, c.chapter_num, c.title
       ORDER BY rp.updated_at DESC LIMIT 5`,
      [userId]
    ) as any[]

    // Reading stats
    const [[stats]] = await pool.execute(
      `SELECT
         COUNT(DISTINCT pu.book_id)                   AS books_owned,
         COALESCE(SUM(rp.time_spent_s), 0)           AS time_spent_s,
         COUNT(DISTINCT bm.id)                        AS bookmarks,
         COUNT(DISTINCT CASE WHEN rp.scroll_pct>=95 THEN rp.book_id END) AS completed
       FROM purchases pu
       LEFT JOIN reading_progress rp ON rp.user_id=pu.user_id AND rp.book_id=pu.book_id
       LEFT JOIN bookmarks bm ON bm.user_id=pu.user_id
       WHERE pu.user_id=?`,
      [userId]
    ) as any[]

    // Recent purchases
    const [recentBooks] = await pool.execute(
      `SELECT b.id, b.title, b.cover_url, b.category, b.price, b.is_free,
              u.name AS author_name,
              pu.created_at AS purchased_at,
              COALESCE(rp.scroll_pct, 0) AS progress
       FROM purchases pu
       JOIN books b ON pu.book_id=b.id
       JOIN users u ON b.author_id=u.id
       LEFT JOIN reading_progress rp ON rp.user_id=pu.user_id AND rp.book_id=b.id
       WHERE pu.user_id=? ORDER BY pu.created_at DESC LIMIT 12`,
      [userId]
    ) as any[]

    // Featured book (random from top rated published books, or most recent)
    const [featuredResults] = await pool.execute(
      `SELECT b.id, b.title, b.description, b.cover_url, b.category,
              u.name AS author_name,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count
       FROM books b
       JOIN users u ON b.author_id = u.id
       LEFT JOIN reviews r ON r.book_id = b.id
       WHERE b.status = 'published'
       GROUP BY b.id
       ORDER BY b.is_featured DESC, avg_rating DESC, b.total_reads DESC
       LIMIT 1`,
      []
    ) as any[]

    const featuredBook = (featuredResults as any[])[0] || null

    return NextResponse.json({
      inProgress,
      recentBooks,
      stats,
      featuredBook
    })
  } catch (error) {
    console.error('Reader home API error:', error)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}
