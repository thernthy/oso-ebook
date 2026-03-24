import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  const [rows] = await pool.execute(
    `SELECT u.id, u.display_name, u.nickname, u.avatar_url, u.email, f.created_at as followed_at
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  ) as any[]

  return ok(rows)
}