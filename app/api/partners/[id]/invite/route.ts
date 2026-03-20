import { NextRequest } from 'next/server'
import crypto from 'crypto'
import pool from '@/lib/db'
import { ok, err, requirePermission } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// ─── POST /api/partners/:id/invite ───────────────────────────
// Partner invites an author by email. Generates a secure token.
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('invite:authors')
  if (response) return response

  // Partner can only invite for their own account; OSO can do any
  const isOso = session!.user.role === 'oso'
  if (!isOso && session!.user.id !== params.id) {
    return err('Forbidden', 403)
  }

  const body = await req.json()
  const { email } = body
  if (!email) return err('email is required')

  // Check user doesn't already exist
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1', [email]
  ) as any[]
  if ((existing as any[]).length > 0) {
    return err('A user with this email already exists', 409)
  }

  // Generate secure invite token (64 hex chars)
  const token     = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Invalidate any previous pending invites for this email + partner
  await pool.execute(
    `UPDATE author_invitations SET status = 'expired'
     WHERE email = ? AND partner_id = ? AND status = 'pending'`,
    [email, params.id]
  )

  await pool.execute(
    `INSERT INTO author_invitations (email, partner_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
    [email, params.id, token, expiresAt]
  )

  // In production: send invite email with this link
  const inviteLink = `${process.env.NEXTAUTH_URL}/auth/accept-invite?token=${token}`

  return ok({
    message:     `Invitation sent to ${email}`,
    invite_link: inviteLink, // Remove from response in production — email only!
    expires_at:  expiresAt,
  }, 201)
}

// ─── GET /api/partners/:id/invite ────────────────────────────
// List all invitations sent by this partner
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('invite:authors')
  if (response) return response

  const isOso = session!.user.role === 'oso'
  if (!isOso && session!.user.id !== params.id) return err('Forbidden', 403)

  const [rows] = await pool.execute(
    `SELECT id, email, status, expires_at, created_at
     FROM author_invitations
     WHERE partner_id = ?
     ORDER BY created_at DESC`,
    [params.id]
  ) as any[]

  return ok({ invitations: rows })
}
