import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { ok, err } from '@/lib/api-helpers'

// ─── GET /api/auth/accept-invite?token=TOKEN ──────────────────
// Validates the invite token and returns invitation details
export async function GET(req: NextRequest) {
  const url   = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return err('Token is required')

  const [rows] = await pool.execute(
    `SELECT i.id, i.email, i.partner_id, i.status, i.expires_at, p.name AS partner_name
     FROM author_invitations i
     JOIN users p ON i.partner_id = p.id
     WHERE i.token = ? LIMIT 1`,
    [token]
  ) as any[]

  const invite = rows[0]
  if (!invite) return err('Invalid token', 404)

  if (invite.status !== 'pending') {
    return err(`This invitation has already been ${invite.status}`, 400)
  }

  if (new Date(invite.expires_at) < new Date()) {
    // Auto-expire if needed
    await pool.execute("UPDATE author_invitations SET status = 'expired' WHERE id = ?", [invite.id])
    return err('This invitation has expired', 400)
  }

  return ok({
    email:        invite.email,
    partner_id:   invite.partner_id,
    partner_name: invite.partner_name,
  })
}

// ─── POST /api/auth/accept-invite ─────────────────────────────
// Creates the author account from the invitation
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, name, password } = body

  if (!token || !name || !password) {
    return err('token, name, and password are required')
  }

  // 1. Validate token again
  const [rows] = await pool.execute(
    `SELECT * FROM author_invitations WHERE token = ? AND status = 'pending' LIMIT 1`,
    [token]
  ) as any[]
  const invite = rows[0]

  if (!invite) return err('Invalid or expired token', 404)
  if (new Date(invite.expires_at) < new Date()) return err('Invite expired', 400)

  // 2. Check if user already exists (just in case)
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1', [invite.email]
  ) as any[]
  if ((existing as any[]).length > 0) {
    return err('A user with this email already exists', 409)
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 3. Create the author user
    const hashed = await bcrypt.hash(password, 12)
    const [uResult] = await conn.execute(
      `INSERT INTO users (name, email, password, role, partner_id, status)
       VALUES (?, ?, ?, 'author', ?, 'active')`,
      [name, invite.email, hashed, invite.partner_id]
    ) as any[]
    
    // 4. Mark invitation as accepted
    await conn.execute(
      "UPDATE author_invitations SET status = 'accepted' WHERE id = ?",
      [invite.id]
    )

    await conn.commit()
    return ok({ message: 'Account created! You can now log in.', email: invite.email }, 201)
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
