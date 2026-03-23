import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// GET /api/authors/partner - Get current author's partner
export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'author') {
    return err('Only authors can access this', 403)
  }

  try {
    const authorId = session!.user.id

    const [relations] = await pool.execute(
      `SELECT apr.id, apr.status, apr.termination_reason, apr.started_at,
              u.id as partner_user_id, u.name as partner_name, u.email as partner_email
       FROM author_partner_relations apr
       JOIN users u ON u.id = apr.partner_id
       WHERE apr.author_id = ?
       ORDER BY apr.created_at DESC
       LIMIT 1`,
      [authorId]
    ) as any[]

    if (!relations.length) {
      return ok({ partner: null })
    }

    return ok({ partner: relations[0] })
  } catch (error) {
    console.error('Get author partner error:', error)
    return err('Failed to fetch partner')
  }
}
