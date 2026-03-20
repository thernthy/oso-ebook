import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requirePermission, requireAuth } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// ─── GET /api/partners/:id ────────────────────────────────────
// OSO or the partner themselves
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const isOso  = session!.user.role === 'oso'
  const isSelf = session!.user.id   === params.id

  if (!isOso && !isSelf) return err('Forbidden', 403)

  const [rows] = await pool.execute(
    `SELECT
       u.id, u.name, u.email, u.status, u.created_at,
       COUNT(DISTINCT a.id) AS author_count,
       COUNT(DISTINCT b.id) AS book_count,
       COALESCE(SUM(CASE WHEN b.status='published' THEN 1 ELSE 0 END), 0) AS published_count,
       COALESCE(SUM(CASE WHEN b.status='in_review' THEN 1 ELSE 0 END),  0) AS in_review_count
     FROM users u
     LEFT JOIN users a ON a.partner_id = u.id AND a.role = 'author'
     LEFT JOIN books b ON b.partner_id = u.id
     WHERE u.id = ? AND u.role = 'partner'
     GROUP BY u.id LIMIT 1`,
    [params.id]
  ) as any[]

  if (!(rows as any[]).length) return err('Partner not found', 404)

  // Also fetch their authors
  const [authors] = await pool.execute(
    `SELECT id, name, email, status, created_at,
       (SELECT COUNT(*) FROM books WHERE author_id = users.id) AS book_count
     FROM users WHERE partner_id = ? AND role = 'author'
     ORDER BY created_at DESC`,
    [params.id]
  ) as any[]

  return ok({ ...(rows as any[])[0], authors })
}

// ─── PATCH /api/partners/:id ──────────────────────────────────
// OSO only — approve, suspend, or reactivate a partner
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('manage:partners')
  if (response) return response

  const body = await req.json()
  const { status } = body

  const validStatuses = ['active', 'suspended', 'pending']
  if (!status || !validStatuses.includes(status)) {
    return err(`status must be one of: ${validStatuses.join(', ')}`)
  }

  const [result] = await pool.execute(
    `UPDATE users SET status = ? WHERE id = ? AND role = 'partner'`,
    [status, params.id]
  ) as any[]

  if ((result as any).affectedRows === 0) return err('Partner not found', 404)

  return ok({ message: `Partner ${status}` })
}
