import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { ok, err, requireAuth, requirePermission } from '@/lib/api-helpers'
import { Role } from '@/lib/permissions'

type Params = { params: { id: string } }

// ─── GET /api/users/:id ───────────────────────────────────────
// OSO sees anyone. Others can only see themselves.
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const isOso    = session!.user.role === 'oso'
  const isSelf   = session!.user.id   === params.id

  if (!isOso && !isSelf) return err('Forbidden', 403)

  const [rows] = await pool.execute(
    `SELECT id, name, email, role, status, partner_id, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [params.id]
  ) as any[]

  if (!(rows as any[]).length) return err('User not found', 404)

  return ok((rows as any[])[0])
}

// ─── PATCH /api/users/:id ─────────────────────────────────────
// OSO can update any field. Users can update own name/password only.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const isOso  = session!.user.role === 'oso'
  const isSelf = session!.user.id   === params.id

  if (!isOso && !isSelf) return err('Forbidden', 403)

  const body = await req.json()
  const updates: string[] = []
  const values: unknown[] = []

  // Fields anyone can update on their own profile
  if (body.name) { updates.push('name = ?'); values.push(body.name) }
  if (body.password) {
    const hashed = await bcrypt.hash(body.password, 12)
    updates.push('password = ?')
    values.push(hashed)
  }

  // OSO-only fields
  if (isOso) {
    if (body.role) {
      const validRoles = ['oso', 'partner', 'author', 'reader']
      if (!validRoles.includes(body.role)) return err('Invalid role')
      updates.push('role = ?'); values.push(body.role)
    }
    if (body.status) {
      const validStatuses = ['active', 'suspended', 'pending']
      if (!validStatuses.includes(body.status)) return err('Invalid status')
      updates.push('status = ?'); values.push(body.status)
    }
    if ('partner_id' in body) {
      updates.push('partner_id = ?'); values.push(body.partner_id ?? null)
    }
  }

  if (!updates.length) return err('No valid fields to update')

  values.push(params.id)
  await pool.execute(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  )

  return ok({ message: 'User updated' })
}

// ─── DELETE /api/users/:id ────────────────────────────────────
// OSO only. Cannot delete yourself.
export async function DELETE(_: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('manage:users')
  if (response) return response

  if (session!.user.id === params.id) {
    return err('Cannot delete your own account', 400)
  }

  const [result] = await pool.execute(
    'DELETE FROM users WHERE id = ?', [params.id]
  ) as any[]

  if ((result as any).affectedRows === 0) return err('User not found', 404)

  return ok({ message: 'User deleted' })
}
