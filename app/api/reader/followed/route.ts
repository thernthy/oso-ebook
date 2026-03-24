import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const userId = session!.user.id

  const [rows] = await pool.execute(
    `SELECT u.id, u.display_name, u.nickname, u.avatar_url, u.bio, a.total_books, a.total_followers
     FROM follows f
     JOIN users u ON u.id = f.following_id
     LEFT JOIN authors a ON a.user_id = f.following_id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  ) as any[]

  return ok(rows)
}
