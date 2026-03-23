import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requirePermission, parsePagination } from '@/lib/api-helpers'

// ─── GET /api/payouts ────────────────────────────────────────
// OSO only — list all payout requests
export async function GET(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const url    = new URL(req.url)
  const status = url.searchParams.get('status') || 'all'
  const search = url.searchParams.get('search') || ''
  const { limit, offset } = parsePagination(url)

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (status !== 'all') { conditions.push('p.status = ?'); params.push(status) }
  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.execute(
    `SELECT p.*, u.name AS user_name, u.email AS user_email, u.role AS user_role,
            pr.name AS processed_by_name
     FROM payouts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN users pr ON p.processed_by = pr.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as any[]

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) as total FROM payouts p JOIN users u ON p.user_id = u.id ${where}`, params
  ) as any[]

  const [[summary]] = await pool.execute(`
    SELECT
      COALESCE(SUM(CASE WHEN status='pending'    THEN amount END), 0) AS pending_total,
      COALESCE(SUM(CASE WHEN status='processing' THEN amount END), 0) AS processing_total,
      COALESCE(SUM(CASE WHEN status='completed'  THEN amount END), 0) AS completed_total,
      COUNT(CASE WHEN status='pending'    THEN 1 END) AS pending_count,
      COUNT(CASE WHEN status='processing' THEN 1 END) AS processing_count,
      COUNT(CASE WHEN status='completed'  THEN 1 END) AS completed_count
    FROM payouts
  `) as any[]

  return ok({ payouts: rows, total, summary, limit, offset })
}

// ─── POST /api/payouts ───────────────────────────────────────
// OSO only — create a manual payout request for a user
export async function POST(req: NextRequest) {
  const { session, response } = await requirePermission('manage:partners')
  if (response) return response

  const body = await req.json()
  const { user_id, amount, reference } = body

  if (!user_id || !amount) return err('user_id and amount are required')
  if (amount <= 0) return err('amount must be positive')

  const [user] = await pool.execute('SELECT id FROM users WHERE id = ?', [user_id]) as any[]
  if (!user.length) return err('User not found', 404)

  await pool.execute(
    `INSERT INTO payouts (user_id, amount, reference, status, processed_by)
     VALUES (?, ?, ?, 'pending', ?)`,
    [user_id, amount, reference || null, session!.user.id]
  )

  return ok({ message: 'Payout request created' }, 201)
}

// ─── PATCH /api/payouts ──────────────────────────────────────
// OSO only — update payout status (process, complete, fail)
export async function PATCH(req: NextRequest) {
  const { session, response } = await requirePermission('manage:partners')
  if (response) return response

  const body = await req.json()
  const { payout_id, action, reference } = body

  if (!payout_id || !action) return err('payout_id and action are required')

  const validActions = ['processing', 'completed', 'failed', 'pending']
  if (!validActions.includes(action)) {
    return err(`action must be one of: ${validActions.join(', ')}`)
  }

  const [result] = await pool.execute(
    `UPDATE payouts SET status = ?, processed_by = ?, processed_at = NOW()${action === 'completed' || action === 'failed' ? ', reference = ?' : ''} WHERE id = ?`,
    action === 'completed' || action === 'failed'
      ? [action, session!.user.id, reference || null, payout_id]
      : [action, session!.user.id, payout_id]
  ) as any[]

  if ((result as any).affectedRows === 0) return err('Payout not found', 404)

  return ok({ message: `Payout marked as ${action}` })
}
