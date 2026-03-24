import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.display_name, u.nickname, u.avatar_url, u.bio, u.two_factor_enabled,
            r.preferred_languages, r.preferred_genres
     FROM users u
     LEFT JOIN readers r ON r.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  ) as any[]

  if (!(rows as any[]).length) return err('User not found', 404)

  return ok((rows as any[])[0])
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id
  const body = await req.json()
  const updates: string[] = []
  const values: unknown[] = []

  if (body.nickname !== undefined) {
    updates.push('nickname = ?')
    values.push(body.nickname)
  }

  if (body.display_name !== undefined) {
    updates.push('display_name = ?')
    values.push(body.display_name)
  }

  if (body.avatar_url !== undefined) {
    updates.push('avatar_url = ?')
    values.push(body.avatar_url)
  }

  if (body.bio !== undefined) {
    updates.push('bio = ?')
    values.push(body.bio)
  }

  if (body.two_factor_enabled !== undefined) {
    updates.push('two_factor_enabled = ?')
    values.push(body.two_factor_enabled)
  }

  if (body.two_factor_secret !== undefined) {
    updates.push('two_factor_secret = ?')
    values.push(body.two_factor_secret)
  }

  if (!updates.length) return err('No valid fields to update')

  values.push(userId)
  await pool.execute(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  )

  return ok({ message: 'Settings updated' })
}
