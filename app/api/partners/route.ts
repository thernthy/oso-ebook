import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requirePermission, parsePagination } from '@/lib/api-helpers'

// ─── GET /api/partners ────────────────────────────────────────
// OSO only — list all partner accounts with stats
export async function GET(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const url    = new URL(req.url)
  const status = url.searchParams.get('status') || 'active'
  const search = url.searchParams.get('search') || ''
  const { limit, offset } = parsePagination(url)

  const conditions = ["u.role = 'partner'"]
  const params: unknown[] = []

  if (status) { conditions.push('u.status = ?'); params.push(status) }
  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = `WHERE ${conditions.join(' AND ')}`

  const [rows] = await pool.execute(
    `SELECT
       u.id, u.name, u.email, u.status, u.created_at,
       COUNT(DISTINCT a.id)  AS author_count,
       COUNT(DISTINCT b.id)  AS book_count,
       COALESCE(SUM(CASE WHEN b.status = 'published' THEN 1 ELSE 0 END), 0) AS published_count
     FROM users u
     LEFT JOIN users a  ON a.partner_id = u.id AND a.role = 'author'
     LEFT JOIN books b  ON b.partner_id = u.id
     ${where}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as any[]

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) as total FROM users u ${where}`, params
  ) as any[]

  return ok({ partners: rows, total, limit, offset })
}

// ─── POST /api/partners ───────────────────────────────────────
// Public — anyone can apply to become a partner
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, company, message } = body

  if (!name || !email) return err('name and email are required')

  // Check for duplicate application or existing account
  const [existing] = await pool.execute(
    `SELECT id FROM partner_applications WHERE email = ?
     UNION
     SELECT id FROM users WHERE email = ?`,
    [email, email]
  ) as any[]

  if ((existing as any[]).length > 0) {
    return err('An application or account with this email already exists', 409)
  }

  await pool.execute(
    `INSERT INTO partner_applications (name, email, company, message)
     VALUES (?, ?, ?, ?)`,
    [name, email, company || null, message || null]
  )

  return ok({ message: 'Partner application submitted. You will be contacted by email.' }, 201)
}
