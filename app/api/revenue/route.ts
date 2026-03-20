import { NextRequest }              from 'next/server'
import pool                         from '@/lib/db'
import { ok, err, requireAuth, parsePagination } from '@/lib/api-helpers'
import { Role }                     from '@/lib/permissions'

// ─── GET /api/revenue ─────────────────────────────────────────
// OSO   → full platform revenue breakdown
// Partner → their catalog revenue + per-author breakdown
// Author  → their own earnings per book
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role      = session!.user.role as Role
  const userId    = session!.user.id
  const url       = new URL(req.url)
  const { limit, offset } = parsePagination(url)
  const period    = url.searchParams.get('period') || 'all' // 'month' | 'year' | 'all'

  // Build date filter
  let dateFilter = ''
  if (period === 'month') dateFilter = 'AND e.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)'
  if (period === 'year')  dateFilter = 'AND e.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'

  if (role === 'oso') {
    // Platform-wide summary
    const [[summary]] = await pool.execute(`
      SELECT
        COALESCE(SUM(e.amount), 0)                                    AS total_revenue,
        COALESCE(SUM(CASE WHEN e.role='author'   THEN e.amount END), 0) AS author_payouts,
        COALESCE(SUM(CASE WHEN e.role='partner'  THEN e.amount END), 0) AS partner_payouts,
        COALESCE(SUM(CASE WHEN e.role='platform' THEN e.amount END), 0) AS platform_revenue,
        COUNT(DISTINCT e.purchase_id)                                 AS total_purchases
      FROM earnings e WHERE 1=1 ${dateFilter}
    `) as any[]

    // Monthly breakdown for chart
    const [monthly] = await pool.execute(`
      SELECT
        DATE_FORMAT(e.created_at, '%Y-%m') AS month,
        COALESCE(SUM(e.amount), 0)         AS revenue,
        COUNT(DISTINCT e.purchase_id)      AS purchases
      FROM earnings e
      WHERE e.role = 'platform'
      GROUP BY month ORDER BY month DESC LIMIT 12
    `) as any[]

    // Top earning books
    const [topBooks] = await pool.execute(`
      SELECT b.id, b.title, u.name AS author_name,
             COALESCE(SUM(e.amount), 0) AS revenue,
             COUNT(DISTINCT e.purchase_id) AS sales
      FROM earnings e
      JOIN books b ON e.book_id = b.id
      JOIN users u ON b.author_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY b.id ORDER BY revenue DESC LIMIT 10
    `) as any[]

    return ok({ summary, monthly, top_books: topBooks })
  }

  if (role === 'partner') {
    // Partner: their catalog earnings
    const [[summary]] = await pool.execute(`
      SELECT
        COALESCE(SUM(e.amount), 0)           AS total_earned,
        COALESCE(SUM(CASE WHEN e.status='paid' THEN e.amount END), 0) AS paid_out,
        COALESCE(SUM(CASE WHEN e.status='pending' THEN e.amount END), 0) AS pending,
        COUNT(DISTINCT e.purchase_id)        AS total_sales
      FROM earnings e
      WHERE e.user_id = ? AND e.role = 'partner' ${dateFilter}
    `, [userId]) as any[]

    // Per-author breakdown
    const [byAuthor] = await pool.execute(`
      SELECT u.id, u.name AS author_name,
             COALESCE(SUM(e.amount), 0) AS author_earnings,
             COUNT(DISTINCT e.purchase_id) AS sales
      FROM earnings e
      JOIN books b ON e.book_id = b.id
      JOIN users u ON b.author_id = u.id
      WHERE b.partner_id = ? ${dateFilter}
      GROUP BY u.id ORDER BY author_earnings DESC
    `, [userId]) as any[]

    // Monthly chart
    const [monthly] = await pool.execute(`
      SELECT DATE_FORMAT(e.created_at,'%Y-%m') AS month,
             COALESCE(SUM(e.amount),0) AS revenue
      FROM earnings e
      WHERE e.user_id = ? AND e.role = 'partner'
      GROUP BY month ORDER BY month DESC LIMIT 12
    `, [userId]) as any[]

    return ok({ summary, by_author: byAuthor, monthly })
  }

  if (role === 'author') {
    // Author: their own earnings
    const [[summary]] = await pool.execute(`
      SELECT
        COALESCE(SUM(e.amount), 0)          AS total_earned,
        COALESCE(SUM(CASE WHEN e.status='paid' THEN e.amount END), 0)    AS paid_out,
        COALESCE(SUM(CASE WHEN e.status='pending' THEN e.amount END), 0) AS pending,
        COUNT(DISTINCT e.purchase_id)       AS total_sales
      FROM earnings e
      WHERE e.user_id = ? AND e.role = 'author' ${dateFilter}
    `, [userId]) as any[]

    // Per-book breakdown
    const [byBook] = await pool.execute(`
      SELECT b.id, b.title,
             COALESCE(SUM(e.amount), 0)     AS earned,
             COUNT(DISTINCT e.purchase_id)  AS sales
      FROM earnings e
      JOIN books b ON e.book_id = b.id
      WHERE e.user_id = ? AND e.role = 'author' ${dateFilter}
      GROUP BY b.id ORDER BY earned DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]) as any[]

    // Monthly
    const [monthly] = await pool.execute(`
      SELECT DATE_FORMAT(e.created_at,'%Y-%m') AS month,
             COALESCE(SUM(e.amount),0) AS earned
      FROM earnings e
      WHERE e.user_id = ? AND e.role = 'author'
      GROUP BY month ORDER BY month DESC LIMIT 12
    `, [userId]) as any[]

    return ok({ summary, by_book: byBook, monthly })
  }

  return err('Forbidden', 403)
}
