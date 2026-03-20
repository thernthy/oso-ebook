import { NextRequest }              from 'next/server'
import pool                         from '@/lib/db'
import { ok, requirePermission }    from '@/lib/api-helpers'

// ─── GET /api/admin/stats ─────────────────────────────────────
// Returns all live numbers the OSO dashboard needs in one call
export async function GET(_: NextRequest) {
  const { response } = await requirePermission('manage:platform')
  if (response) return response

  // Run all queries in parallel for speed
  const [
    [userStats],
    [bookStats],
    [revenueStats],
    [pendingStats],
    [monthlyRevenue],
    [recentUsers],
    [recentActivity],
    [topBooks],
  ] = await Promise.all([

    // User counts by role + status
    pool.execute(`
      SELECT
        COUNT(*)                                          AS total_users,
        SUM(role = 'partner')                            AS partners,
        SUM(role = 'author')                             AS authors,
        SUM(role = 'reader')                             AS readers,
        SUM(status = 'active')                           AS active,
        SUM(status = 'suspended')                        AS suspended,
        SUM(status = 'pending')                          AS pending,
        SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS new_this_month
      FROM users
    `),

    // Book counts by status
    pool.execute(`
      SELECT
        COUNT(*)                          AS total_books,
        SUM(status = 'published')         AS published,
        SUM(status = 'in_review')         AS in_review,
        SUM(status = 'draft')             AS drafts,
        SUM(is_featured = 1)             AS featured,
        SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS new_this_month
      FROM books
    `),

    // Revenue summary
    pool.execute(`
      SELECT
        COALESCE(SUM(amount), 0)                                      AS total_revenue,
        COALESCE(SUM(CASE WHEN role='platform' THEN amount END), 0)   AS platform_revenue,
        COALESCE(SUM(CASE WHEN role='author'   THEN amount END), 0)   AS author_payouts,
        COALESCE(SUM(CASE WHEN role='partner'  THEN amount END), 0)   AS partner_payouts,
        COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND role='platform' THEN amount END), 0) AS revenue_this_month,
        COUNT(DISTINCT purchase_id)                                    AS total_purchases
      FROM earnings
    `),

    // Pending items needing OSO action
    pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM partner_applications WHERE status = 'pending') AS pending_partners,
        (SELECT COUNT(*) FROM books WHERE status = 'in_review')              AS books_in_review,
        (SELECT COUNT(*) FROM payouts WHERE status = 'pending')              AS pending_payouts,
        (SELECT COUNT(*) FROM users WHERE status = 'pending')                AS pending_users
    `),

    // Monthly revenue for chart (last 12 months)
    pool.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m')         AS month,
        COALESCE(SUM(CASE WHEN role='platform' THEN amount END), 0) AS revenue,
        COUNT(DISTINCT purchase_id)              AS purchases
      FROM earnings
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `),

    // Recent users
    pool.execute(`
      SELECT id, name, email, role, status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 8
    `),

    // Recent activity (audit-style from ai_jobs + books + partner_applications)
    pool.execute(`
      SELECT * FROM (
        SELECT 'book_submitted' AS type, b.title AS subject, u.name AS actor, b.updated_at AS ts
        FROM books b JOIN users u ON b.author_id = u.id WHERE b.status = 'in_review'
        UNION ALL
        SELECT 'book_published', b.title, u.name, b.updated_at
        FROM books b JOIN users u ON b.author_id = u.id WHERE b.status = 'published'
        UNION ALL
        SELECT 'partner_applied', pa.name, pa.email, pa.created_at
        FROM partner_applications pa WHERE pa.status = 'pending'
        UNION ALL
        SELECT 'user_suspended', u.name, 'system', u.updated_at
        FROM users u WHERE u.status = 'suspended'
      ) activity
      ORDER BY ts DESC
      LIMIT 10
    `),

    // Top books by reads
    pool.execute(`
      SELECT b.id, b.title, b.total_reads, b.status,
             u.name AS author_name,
             COALESCE(SUM(e.amount),0) AS revenue
      FROM books b
      JOIN users u ON b.author_id = u.id
      LEFT JOIN earnings e ON e.book_id = b.id AND e.role = 'platform'
      WHERE b.status = 'published'
      GROUP BY b.id
      ORDER BY b.total_reads DESC
      LIMIT 5
    `),
  ]) as any[]

  return ok({
    users:           (userStats as any[])[0],
    books:           (bookStats as any[])[0],
    revenue:         (revenueStats as any[])[0],
    pending:         (pendingStats as any[])[0],
    monthly_revenue: monthlyRevenue,
    recent_users:    recentUsers,
    recent_activity: recentActivity,
    top_books:       topBooks,
  })
}
